# ApiAccessor
# accesses REST APIs
# you must define a api_config function and a :name option for errors

# defmodule ExampleApi do
#   use Sequence.ApiAccessor, name: :example
#
#   defp api_config(), do: {"https://my.endpoint", "my-bearer-token"}
#
#   def get_users() do
#     get("/users")
#   end
# end
defmodule Sequence.ApiAccessor do
  defmacro __using__(opts) do
    quote do
      def std_headers() do
        [{"Content-Type", "application/json"}, {"Accept", "application/json"}]
      end

      def token_header(nil), do: std_headers()

      def token_header(token) do
        std_headers() ++ [{"Authorization", "Bearer #{token}"}]
      end

      def get(path, headers \\ []) do
        {url, token} = api_config()
        headers = token_header(token) ++ headers
        Mojito.get(url <> path, headers)
        |> process_result()
      end

      def post(path, params, headers \\ []) do
        {url, token} = api_config()
        headers = token_header(token) ++ headers
        body = encode_params(params)
        Mojito.post(url <> path, headers, body)
        |> process_result()
      end

      def put(path, params, headers \\ []) do
        {url, token} = api_config()
        headers = token_header(token) ++ headers
        body = encode_params(params)
        Mojito.put(url <> path, headers, body)
        |> process_result()
      end

      def delete(path, headers \\ []) do
        {url, token} = api_config()
        headers = token_header(token) ++ headers
        Mojito.delete(url <> path, headers)
        |> process_result()
      end

      def encode_params(params) when is_list(params), do: URI.encode_query(params)
      def encode_params(params) when is_map(params), do: Jason.encode!(params)
      def encode_params(params), do: params

      defp process_result(result) do
        opts = unquote(opts)
        case result do
          {:ok, %Mojito.Response{status_code: status, body: body}} ->
            case Jason.decode(body) do
              {:ok, decoded} when is_map(decoded) ->
                if status >= 200 and status <= 299 do
                  {:ok, decoded}
                else
                  {:error, opts[:name], status, decoded["error"] || decoded}
                end
              _ -> {:error, opts[:name], status, body}
            end
          {:error, %Mojito.Error{message: message, reason: reason}} ->
            message = message || inspect(reason)
            {:error, opts[:name], :connection_error, message}
        end
      end
    end
  end
end
