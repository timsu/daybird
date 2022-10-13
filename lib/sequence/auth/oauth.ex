defmodule Sequence.Auth.OAuth do
  require Logger

  @google_client_id Application.get_env(:sequence, Sequence.Auth.OAuth)[:google_client_id]

  # Fetch google profile given token, make sure 'aud' matches CLIENT_ID and token not expired.
  # %{
  #   "alg" => "RS256",
  #   "at_hash" => "G9XgqdoApwTysZv-9ahJEA",
  #   "aud" => "457490883783-0to2t0pggailq48v3nsm6mkub2h51ucs.apps.googleusercontent.com",
  #   "azp" => "457490883783-0to2t0pggailq48v3nsm6mkub2h51ucs.apps.googleusercontent.com",
  #   "email" => "tim@something.com",
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

      _ -> {:error, "Invalid provider"}

    end

  end

  defp non_default_profile_img(nil) do nil end
  defp non_default_profile_img(url) do
    if String.length(url) > 120 do nil else url end
  end

end
