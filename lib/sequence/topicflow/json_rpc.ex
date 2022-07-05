defmodule Sequence.Topicflow.JsonRpc do
  defmodule Request do
    @type t :: %__MODULE__{}

    defstruct [
      :id,
      :method,
      :params
    ]
  end

  defmodule Meta do
    @type t :: %__MODULE__{}

    defstruct [
      :us
    ]
  end

  defmodule Success do
    @type t :: %__MODULE__{}

    defstruct [
      :id,
      :meta,
      :result
    ]
  end

  defmodule Error do
    @type t :: %__MODULE__{}

    defstruct [
      :id,
      :meta,
      :error
    ]
  end

  defmodule ErrorInfo do
    @type t :: %__MODULE__{}

    defstruct [
      :code,
      :message,
      :data
    ]
  end

  @method_not_found_code -32601
  @method_not_found_message "Method not found"
  @invalid_params_code -32602
  @invalid_params_message "Invalid params"

  @spec make_request(binary, nil | map) :: Sequence.Topicflow.JsonRpc.Request.t()
  def make_request(method, params \\ nil) do
    make_request(UUID.uuid1(), method, params)
  end

  @spec make_request(binary, binary, nil | map) :: Sequence.Topicflow.JsonRpc.Request.t()
  def make_request(id, method, params)
      when is_binary(id) and is_binary(method) and (is_nil(params) or is_map(params)) do
    %Request{id: id, method: method, params: params}
  end

  @spec make_success(binary | Sequence.Topicflow.JsonRpc.Request.t(), nil | map) ::
          Sequence.Topicflow.JsonRpc.Success.t()
  def make_success(_, result \\ nil)

  def make_success(id, result) when is_binary(id) and (is_nil(result) or is_map(result)) do
    %Success{id: id, result: result}
  end

  def make_success(%Request{id: id}, result) when is_nil(result) or is_map(result) do
    make_success(id, result)
  end

  @spec make_error(binary | Sequence.Topicflow.JsonRpc.Request.t(), number, binary, nil | map) ::
          Sequence.Topicflow.JsonRpc.Error.t()
  def make_error(_, _, _, data \\ nil)

  def make_error(id, code, message, data)
      when is_binary(id) and is_number(code) and is_binary(message) and
             (is_nil(data) or is_map(data)) do
    %Error{id: id, error: %ErrorInfo{code: code, message: message, data: data}}
  end

  def make_error(%Request{id: id}, code, message, data)
      when is_number(code) and is_binary(message) and (is_nil(data) or is_map(data)) do
    make_error(id, code, message, data)
  end

  @spec make_method_not_found_error(binary | Sequence.Topicflow.JsonRpc.Request.t()) ::
          Sequence.Topicflow.JsonRpc.Error.t()
  def make_method_not_found_error(request_or_id) do
    make_error(request_or_id, @method_not_found_code, @method_not_found_message)
  end

  @spec make_invalid_params_error(binary | Sequence.Topicflow.JsonRpc.Request.t()) ::
          Sequence.Topicflow.JsonRpc.Error.t()
  def make_invalid_params_error(request_or_id) do
    make_error(request_or_id, @invalid_params_code, @invalid_params_message)
  end

  @spec encode(
          [
            Sequence.Topicflow.JsonRpc.Error.t()
            | Sequence.Topicflow.JsonRpc.Request.t()
            | Sequence.Topicflow.JsonRpc.Success.t()
          ]
          | Sequence.Topicflow.JsonRpc.Error.t()
          | Sequence.Topicflow.JsonRpc.Request.t()
          | Sequence.Topicflow.JsonRpc.Success.t()
        ) :: binary
  def encode(batch) when is_list(batch) do
    batch
    |> Enum.map(&do_encode(&1))
    |> Jason.encode!()
  end

  def encode(struct) do
    [do_encode(struct)]
    |> Jason.encode!()
  end

  @spec decode(binary) ::
          {:error, :bad_json | :bad_message}
          | {:ok,
             [
               Sequence.Topicflow.JsonRpc.Error.t()
               | Sequence.Topicflow.JsonRpc.Request.t()
               | Sequence.Topicflow.JsonRpc.Success.t()
             ]}
  def decode(text) when is_binary(text) do
    case Jason.decode(text) do
      {:ok, raw} ->
        r = do_decode(raw)

        if Enum.any?(r, fn
             {:error, :bad_message} -> true
             _ -> false
           end) do
          {:error, :bad_message}
        else
          {:ok, r}
        end

      _ ->
        {:error, :bad_json}
    end
  end

  def set_reply_meta(%{__struct__: struct} = reply, us)
      when struct in [Success, Error] do
    Map.put(reply, :meta, %Meta{us: us})
  end

  defp do_encode(%Request{id: id, method: method, params: nil}) do
    make_raw(id, method)
  end

  defp do_encode(%Request{id: id, method: method, params: params}) when is_map(params) do
    make_raw(id, method)
    |> Map.put("params", params)
  end

  defp do_encode(%Success{id: id, result: result, meta: meta}) do
    make_raw(id)
    |> encode_result(result)
    |> encode_meta(meta)
  end

  defp do_encode(%Error{id: id, error: error, meta: meta}) do
    make_raw(id)
    |> encode_meta(meta)
    |> encode_error_info(error)
  end

  defp encode_error_info(encoded, %ErrorInfo{code: code, message: message, data: data}) do
    Map.put(encoded, "error", make_error_info(code, message, data))
  end

  defp encode_result(encoded, nil) do
    encoded
  end

  defp encode_result(encoded, result) do
    Map.put(encoded, "result", result)
  end

  defp encode_meta(encoded, nil) do
    encoded
  end

  defp encode_meta(encoded, %Meta{us: us})
       when is_number(us) do
    Map.put(encoded, "meta", %{"us" => us})
  end

  defp do_decode(batch) when is_list(batch) do
    batch
    |> Enum.map(&decode_one(&1))
  end

  defp do_decode(raw) do
    [decode_one(raw)]
  end

  defp decode_one(%{"jsonrpc" => "2.0", "id" => id} = raw) when is_binary(id) do
    case raw do
      %{"method" => method} = raw ->
        %Request{id: id, method: method, params: Map.get(raw, "params")}

      %{"error" => error} ->
        with {:ok, info} <- decode_error_info(error),
             {:ok, meta} <- decode_meta(Map.get(raw, "meta")) do
          %Error{id: id, meta: meta, error: info}
        else
          {:error, _} = error ->
            error
        end

      raw ->
        with {:ok, meta} <- decode_meta(Map.get(raw, "meta")) do
          %Success{id: id, meta: meta, result: Map.get(raw, "result")}
        else
          {:error, _} = error ->
            error
        end
    end
  end

  defp decode_one(_) do
    {:error, :bad_message}
  end

  defp decode_meta(%{"us" => us}) when is_number(us) do
    {:ok, %Meta{us: us}}
  end

  defp decode_meta(nil) do
    {:ok, nil}
  end

  defp decode_meta(_) do
    {:error, :bad_message}
  end

  defp decode_error_info(%{"code" => code, "message" => message} = raw)
       when is_number(code) and is_binary(message) do
    {:ok, %ErrorInfo{code: code, message: message, data: Map.get(raw, "data")}}
  end

  defp decode_error_info(_) do
    {:error, :bad_message}
  end

  defp make_raw(id) when is_binary(id) do
    %{"jsonrpc" => "2.0", "id" => id}
  end

  defp make_raw(id, method) when is_binary(method) do
    make_raw(id)
    |> Map.put("method", method)
  end

  defp make_error_info(code, message, data) when is_number(code) and is_binary(message) do
    %{"code" => code, "message" => message}
    |> make_error_info_data(data)
  end

  defp make_error_info_data(encoded, nil) do
    encoded
  end

  defp make_error_info_data(encoded, data) when is_map(data) do
    Map.put(encoded, "data", data)
  end
end
