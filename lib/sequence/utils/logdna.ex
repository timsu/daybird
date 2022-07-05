defmodule LogDNA do
  require Logger

  @url "https://logs.logdna.com/logs/ingest"
  @tags "elixir"
  @app "sequence"

  defmodule Line do
    @type t :: %__MODULE__{}

    defstruct [
      :line,
      :app,
      :level,
      :env,
      :meta,
      :timestamp
    ]
  end

  def ignored(nil), do: true

  def ignored(line) do
    msg = line.line
    String.contains?(msg, "user=(none) params=%{} status=200")
  end

  @spec post([Line.t()], binary, binary | nil, binary | nil, binary | nil, boolean) ::
          :ok | :error | :nop
  def post(lines, hostname, mac \\ nil, ip \\ nil, tags \\ nil, allow_dev \\ false) do
    key = Application.get_env(:sequence, :logdna_key)
    allowed = Sequence.prod?() or Sequence.staging?() or allow_dev
    lines = Enum.filter(lines, &(!ignored(&1)))

    if !key or length(lines) == 0 do
      :nop
    else
      post_body = %{
        lines: lines
      }

      body = Poison.encode!(post_body)
      headers = [{"Content-Type", "application/json"}, {"charset", "UTF-8"}, {"apikey", key}]

      now = :os.system_time(:millisecond)
      ip = if String.contains?(ip, "."), do: ip, else: nil

      params =
        [hostname: hostname, mac: mac, ip: ip, now: now, tags: tags]
        |> Enum.filter(fn {_k, v} -> v end)
        |> URI.encode_query()

      if allowed do
        case Mojito.post("#{@url}?#{params}", headers, body) do
          {:ok, %Mojito.Response{status_code: 200}} ->
            :ok

          {:ok, e} ->
            IO.inspect(e, label: "LogDNA 200 Error")
            :error

          {:error, %Mojito.Error{message: message, reason: reason}} ->
            message = message || inspect(reason)
            IO.inspect(message, label: "LogDNA Non-200 Error")
            :error
        end
      else
        :nop
      end
    end
  end

  @spec post([Line.t()]) :: :ok | :error | :nop
  def post(lines) do
    hostname = :inet.gethostname() |> elem(1) |> to_string
    ip = Node.self() |> to_string |> String.replace("sequence@", "")

    post(lines, hostname, nil, ip, @tags)
  end

  @spec line(binary, map | nil, binary, integer) :: Line.t()
  def line(line, meta \\ nil, level \\ "INFO", timestamp \\ :os.system_time(:millisecond)) do
    %Line{
      line: line,
      app: "#{@app}-#{Sequence.env}",
      level: level,
      env: Sequence.env(),
      meta: meta,
      timestamp: timestamp
    }
  end
end

defmodule LogDNA.BatchLogger do
  @name __MODULE__
  @timeout 5_000
  @size 100
  use Sequence.BatchProcessor

  def debug(message, meta \\ nil), do: log("DEBUG", message, meta)
  def info(message, meta \\ nil), do: log("INFO", message, meta)
  def warn(message, meta \\ nil), do: log("WARN", message, meta)
  def error(message, meta \\ nil), do: log("ERROR", message, meta)

  def log(level, message, meta \\ nil) do
    if Sequence.test?() do
      Poison.encode!(LogDNA.line(message, meta, level))
    else
      request(LogDNA.line(message, meta, level))
    end
  end

  defp send_api(requests) do
    try do
      LogDNA.post(requests)
    rescue
      e -> IO.inspect(e, label: "LogDNA try/rescue Error")
    end
  end
end
