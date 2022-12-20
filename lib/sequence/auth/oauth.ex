defmodule Sequence.Auth.OAuth do
  require Logger

  # Fetch google profile given token, make sure 'aud' matches CLIENT_ID and token not expired.
  # %{
  #   "alg" => "RS256",
  #   "at_hash" => "G9XgqdoApwTysZv-9ahJEA",
  #   "aud" => "457490883783-0to2t0pggailq48v3nsm6mkub2h51ucs.apps.googleusercontent.com",
  #   "azp" => "457490883783-0to2t0pggailq48v3nsm6mkub2h51ucs.apps.googleusercontent.com",
  #   "email" => "...",
  #   "email_verified" => "true",
  #   "exp" => "1560210595",
  #   "family_name" => "Su",
  #   "given_name" => "Tim",
  #   "hd" => "something.com",
  #   "iat" => "1560206995",
  #   "iss" => "accounts.google.com",
  #   "jti" => "c064f77548d595d1228c6b62e4651817e71cf5fb",
  #   "kid" => "846ddaf88cc19235221c8ee0dfa3bb46ae27bffc",
  #   "locale" => "en",
  #   "name" => "Tim Su",
  #   "picture" => "https://lh5.googleusercontent.com/-slUJ4nqNMCI/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rcrJB82X1AtQIr9e64T-wffAi8yUQ/s96-c/photo.jpg",
  #   "sub" => "109009293324923898542",
  #   "typ" => "JWT"
  # }
  defp fetch_google_profile(token) do
    url = "https://oauth2.googleapis.com/tokeninfo?id_token=" <> token
    case Mojito.get(url, []) do
      {:ok, %Mojito.Response{status_code: 200, body: body}} ->
        profile = Poison.decode!(body)
        cond do
          profile["exp"] < :os.system_time(:second) ->
            Logger.error("Google token is expired: #{inspect(profile)}")
            {:error, "token expired"}
          true ->
            {:ok, profile}
        end

      {:ok, %Mojito.Response{status_code: _code, body: body}} ->
        {:error, "Token error: #{body}"}
      {:error, %Mojito.Error{message: message, reason: reason}} ->
        message = message || (inspect(reason) |> String.replace("\"",""))
        {:error, message}
    end
  end

  defp get_apple_auth_public_key(token) do
    case Joken.peek_header(token) do
      {:ok, %{"kid" => kid}} ->
        url = "https://appleid.apple.com/auth/keys"
        case HTTPoison.get(url, []) do
          {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
            %{ "keys" => keys } = Poison.decode!(body)
            key_hash = Enum.find(keys, fn key -> key["kid"] == kid end)
            {:ok, key_hash}

          {:ok, %HTTPoison.Response{status_code: _code, body: body}} ->
            {:error, "Apple auth token error: #{body}"}

          {:error, %HTTPoison.Error{reason: reason}} ->
            message = (inspect(reason) |> String.replace("\"",""))
            {:error, message}
        end

      _ -> {:error, "Invalid apple auth token #{token}"}
    end
  end

  # %{
  #   "aud" => "app.daybird.insightloop",
  #   "auth_time" => 1671578990,
  #   "c_hash" => "CekZExyXlo5bLAsz1LjjEg",
  #   "email" => "...",
  #   "email_verified" => "true",
  #   "exp" => 1671665390,
  #   "iat" => 1671578990,
  #   "is_private_email" => "true",
  #   "iss" => "https://appleid.apple.com",
  #   "nonce" => "f30e3944dff75e0a084e45133d4b5f10cb3cb70d29d6a51806f90feeb25b8ab7",
  #   "nonce_supported" => true,
  #   "sub" => "000882.7abb5f3df7724227998b49b61a69bbd2.2327"
  # }
  defp fetch_apple_profile(token) do
    case get_apple_auth_public_key(token) do
      {:ok, public_key} ->
        jwk = JOSE.JWK.from_map(public_key)
        case JOSE.JWT.verify_strict(jwk, [public_key["alg"]], token) do
          {true, %{ fields: profile}, _} ->
            cond do
              !String.starts_with?(profile["aud"], "app.daybird.") ->
                Logger.error("Apple token has invalid aud: #{inspect(profile)}")
                {:error, "Invalid aud"}
              profile["exp"] < :os.system_time(:second) ->
                Logger.error("Apple token is expired: #{inspect(profile)}")
                {:error, "token expired"}
              true ->
                {:ok, profile}
            end
          {false, _, _} -> {:error, "Token verification failed #{token}"}
        end
      {:error, message} -> {:error, message}
    end
  end

  def get_user_info(provider, token) do
    case provider do
      "google" ->
        case fetch_google_profile(token) do
          {:ok, profile} ->
            %{"sub" => id, "email" => email, "name" => name} = profile
            {:ok, %{
              id: id,
              email: email,
              name: name,
              profile_img: non_default_profile_img(profile["picture"]),
              domain: profile["hd"]
            }}
          {:error, message} -> {:error, message}
        end

        "apple" ->
          case fetch_apple_profile(token) do
            {:ok, profile} ->
              %{"sub" => id, "email" => email} = profile
              {:ok, %{ id: id, email: email }}
            {:error, message} -> {:error, message}
          end

      _ -> {:error, "Invalid provider"}

    end

  end

  defp non_default_profile_img(nil) do nil end
  defp non_default_profile_img(url) do
    if String.length(url) > 120 do nil else url end
  end

end
