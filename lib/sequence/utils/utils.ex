defmodule Sequence.Utils do

  require Logger

  @dialyzer [{:nowarn_function, free_email_domain?: 1}]

  def no_dash(uuid) do
    uuid |> String.replace("-", "")
  end

  def uuid_to_base16(uuid) do
    uuid |> String.upcase() |> String.replace("-", "") |> Base.decode16!()
  end

  # convert int, float, and decimal to float
  def to_float(num) do
    case num do
      x when is_integer(num) -> x
      x when is_float(num) -> x
      %Decimal{} = x -> Decimal.to_float(x)
      nil -> 0
    end
  end

  def to_struct(kind, attrs) do
    struct = struct(kind)
    Enum.reduce Map.to_list(struct), struct, fn {k, _}, acc ->
      case Map.fetch(attrs, Atom.to_string(k)) do
        {:ok, v} -> %{acc | k => v}
        :error -> acc
      end
    end
  end

  def keys_to_atoms(value) when is_struct(value), do: value
  def keys_to_atoms(string_key_map) when is_map(string_key_map) do
    for {key, val} <- string_key_map, into: %{} do
      if is_binary(key) do
        {String.to_atom(key), keys_to_atoms(val)}
      else
        {key, keys_to_atoms(val)}
      end
    end
  end
  def keys_to_atoms(list) when is_list(list) do
    Enum.map(list, &keys_to_atoms/1)
  end
  def keys_to_atoms(value), do: value

  def atoms_to_keys(value) when is_struct(value), do: value
  def atoms_to_keys(atom_key_map) when is_map(atom_key_map) do
    for {key, val} <- atom_key_map, into: %{}, do: {to_string(key), atoms_to_keys(val)}
  end

  def atoms_to_keys(list) when is_list(list) do
    Enum.map(list, &atoms_to_keys/1)
  end

  def atoms_to_keys(value), do: value

  def encrypt(term), do: term |> :erlang.term_to_binary |> Sequence.Vault.encrypt |> elem(1) |> Base.encode64

  def decrypt(code) do
    try do
      result = code |> Base.decode64! |> Sequence.Vault.decrypt |> elem(1) |> :erlang.binary_to_term
      {:ok, result}
    rescue
      e -> {:error, e}
    end
  end

  def html_safe(text) do
    text
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
  end

  # from Rosetta Code
  def permute([]), do: [[]]
  def permute(list) do
    for x <- list, y <- permute(list -- [x]), do: [x|y]
  end

  @wordlist File.read("data/eff_wordlist.txt") |> elem(1) |> String.split("\n") |> Enum.map(fn s -> String.split(s, "\t") |> Enum.at(1) end)

  def magic_words(iterations) do
    Enum.take_random(@wordlist, iterations)
    |> Enum.join("-")
  end

  def random_string(length) do
    :crypto.strong_rand_bytes(length) |> Base.url_encode64 |> binary_part(0, length)
  end

  def nickname(name) do
    String.split(name, " ") |> hd
  end

  @free_email_domain_list File.read("data/free-email-domain-list.conf") |> elem(1) |> String.split("\n") |> Enum.map(&String.trim/1)
  |> Enum.reject(&(String.starts_with?(&1,"#"))) |> Enum.map(&String.downcase/1) |> MapSet.new

  @spec free_email_domain?(binary) :: boolean
  def free_email_domain?(domain) do
    !! (@free_email_domain_list |> MapSet.member?(String.downcase(domain)))
  end

  def updated_meta_field(nil, incoming) do updated_meta_field(%{}, incoming) end

  def updated_meta_field(current, incoming) do
    Map.merge(current, incoming)
      |> Enum.filter(fn {k, _v} -> !Map.has_key?(incoming, k) or Map.get(incoming, k) != nil end)
      |> Enum.into(%{})
  end

  def timex_parse(value, default) do
    try do
      case value do
        nil -> {:ok, default}
        value -> Timex.parse(value, "{ISO:Extended:Z}")
      end
    rescue
      e -> Logger.error("Error timex_parse for value #{inspect(value)}: #{inspect(e)}")
      {:error, default}
    end
  end

  def to_date(value) when is_number(value), do: Timex.from_unix(value)
  def to_date(value) when is_binary(value), do: Timex.parse(value, "{ISO:Extended:Z}")
  def to_date(%DateTime{} = value), do: {:ok, value}
  def to_date(_), do: :error

  def deep_merge(left, right) do

    Map.merge left, right, fn
      (_key, left = %{}, right = %{}) -> deep_merge(left, right)
      (_key, _left, right) -> right
    end

  end

  # equal -> nothing to report
  def deep_diff(a, a) do
    {nil, nil}
  end

  # Both maps, recurse
  def deep_diff(%{} = left, %{} = right) do

    empty = %{}

    Map.keys(left) ++ Map.keys(right)
    |> Enum.uniq()
    |> Enum.map(fn key ->
      case deep_diff(left[key], right[key]) do
        {nil, nil} -> {nil, nil}
        {^empty, ^empty} -> {nil, nil}
        {a, nil} -> {{key, a}, nil}
        {nil, a} -> {nil, {key, a}}
        {a, b} -> {{key, a}, {key, b}}
      end
    end)
    |> Enum.unzip()
    |> pair_apply(&compact/1)
    |> pair_apply(&Enum.into(&1, %{}))
  end

  def deep_diff(a, b) when is_list(a) and is_list(b) do
    aint = a -- b
    bint = b -- a

    {aint, bint}
  end

  # Not maps, not equal -> report diff
  def deep_diff(left, right) do
    {left, right}
  end


  def pair_apply({left, right}, func) do
    {func.(left), func.(right)}
  end

  def pair_fold({left, right}, func) do
    func.(left, right)
  end

  def compact(enum) do
    Enum.filter(enum, & !is_nil(&1))
  end

  # the current time shifted to the next weekday (Mon-Fri)
  def next_weekday() do
    day = Timex.now |> Timex.weekday
    case day do
      # 5, 6 = friday, saturday
      d when d in [5, 6] -> Timex.now |> Timex.shift(days: 8 - d)
      _ -> Timex.now |> Timex.shift(days: 1)
    end
  end

  def next_weekday(nil), do: next_weekday()

  def next_weekday(""), do: next_weekday()

  # the current time in the given timezone shifted to the next weekday (Mon-Fri)
  def next_weekday(timezone) do
    day = Timex.now(timezone) |> Timex.weekday
    case day do
      # 5, 6 = friday, saturday
      d when d in [5, 6] -> Timex.now(timezone) |> Timex.shift(days: 8 - d)
      _ -> Timex.now(timezone) |> Timex.shift(days: 1)
    end
  end

  def ok_wrap(value, error \\ :error)
  def ok_wrap(nil, error), do: error
  def ok_wrap(value, _), do: {:ok, value}

  def ok_unwrap(maybe_value, error \\ nil)
  def ok_unwrap({:ok, value}, _), do: value
  def ok_unwrap(_, error), do: error

  def any_to_float(nil), do: 0.0
  def any_to_float(%Decimal{} = dec), do: Decimal.to_float(dec)
  def any_to_float(num) when is_number(num), do: num
  def any_to_float(str) when is_binary(str), do: Float.parse(str) |> elem(0)
  def any_to_float(any), do: raise "Don't know how to convert #{inspect(any)} to float"

  def current_stack_trace(strip \\ 1) do
      {:current_stacktrace, stacktrace} = Process.info(self(), :current_stacktrace)
      Enum.drop(stacktrace, strip)
  end

  # convert allowed PUT params into fields, supporting *_at timestamps
  def params_to_attrs(params, allowed_keys) do
    Enum.reduce(allowed_keys, %{}, fn(key, acc) ->
      if Map.has_key?(params, key) do
        value = if String.ends_with?(key, "_at") and params[key] != nil, do: Timex.now, else: params[key]
        Map.put(acc, key, value)
      else
        acc
      end
    end)
  end

end
