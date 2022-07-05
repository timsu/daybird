defmodule Strip do
  @doc """
    iex> Strip.strip_utf "Tallak\xc3\xb1 Tveide"
    "Tallakñ Tveide"
  """
  def strip_utf(nil), do: nil

  def strip_utf(str) do
    strip_utf_helper(str, [])
  end

  defp strip_utf_helper(<<x :: utf8>> <> rest, acc) do
    strip_utf_helper rest, [x | acc]
  end

  defp strip_utf_helper(<<_x>> <> rest, acc), do: strip_utf_helper(rest, acc)

  defp strip_utf_helper("", acc) do
    acc
    |> :lists.reverse
    |> List.to_string
  end
end
