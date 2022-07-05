defmodule Sequence.Auth.OAuth do
  require Logger

  @google_client_id Application.get_env(:sequence, Sequence.Auth.OAuth)[:google_client_id]

  # Fetch google profile given token, make sure 'aud' matches Wisp CLIENT_ID and token not expired.
  # %{
  #   "alg" => "RS256",
  #   "at_hash" => "G9XgqdoApwTysZv-9ahJEA",
  #   "aud" => "457490883783-0to2t0pggailq48v3nsm6mkub2h51ucs.apps.googleusercontent.com",
  #   "azp" => "457490883783-0to2t0pggailq48v3nsm6mkub2h51ucs.apps.googleusercontent.com",
  #   "email" => "tim@tandem.chat",
  #   "email_verified" => "true",
  #   "exp" => "1560210595",
  #   "family_name" => "Su",
  #   "given_name" => "Tim",
  #   "hd" => "tandem.chat",
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
          profile["aud"] != @google_client_id ->
            Logger.error("Google token has invalid aud: #{inspect(profile)}")
            {:error, "Invalid aud"}
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
        case Mojito.get(url, []) do
          {:ok, %Mojito.Response{status_code: 200, body: body}} ->
            %{ "keys" => keys } = Poison.decode!(body)
            key_hash = Enum.find(keys, fn key -> key["kid"] == kid end)
            {:ok, key_hash}

          {:ok, %Mojito.Response{status_code: _code, body: body}} ->
            {:error, "Apple auth token error: #{body}"}

          {:error, %Mojito.Error{message: message, reason: reason}} ->
            message = message || (inspect(reason) |> String.replace("\"",""))
            {:error, message}
        end

      _ -> {:error, "Invalid apple auth token #{token}"}
    end
  end

  # %{
  #   "aud" => "chat.tandem-dev.ios",
  #   "auth_time" => 1624756406,
  #   "c_hash" => "sWB8XbCRUHCjX8UHG2sYRg",
  #   "email" => "jhwon0820@gmail.com",
  #   "email_verified" => "true",
  #   "exp" => 1624842806,
  #   "iat" => 1624756406,
  #   "iss" => "https://appleid.apple.com",
  #   "nonce" => "8a76865c2d36390ff5cff9d13d09bf40fe5867b4f5c7bebb3019ebdb65f25504",
  #   "nonce_supported" => true,
  #   "sub" => "000010.8dc18304009845d1bf2cf38eb4792cb5.0049"
  # }
  defp fetch_apple_profile(token) do
    case get_apple_auth_public_key(token) do
      {:ok, public_key} ->
        jwk = JOSE.JWK.from_map(public_key)
        case JOSE.JWT.verify_strict(jwk, [public_key["alg"]], token) do
          {true, %{ fields: profile}, _} ->
            cond do
              profile["aud"] != Application.get_env(:sequence, :bundle_identifier_ios) ->
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
