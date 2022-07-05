defmodule Sequence.Security.RateLimiter do
  require Logger

  @spec check_rate_limit(String.t(), non_neg_integer, non_neg_integer) ::
          {:exceeded, non_neg_integer} | {:ok, non_neg_integer}
  def check_rate_limit(tag, period_ms, limit) do
    now_ms = :os.system_time(:millisecond)
    key = "rate_limit:#{tag}"

    with {:ok, [_, _, _, [_, tss]]} <- Redix.pipeline(:redix, [
          ["MULTI"],
          ["ZREMRANGEBYSCORE", key, 0, now_ms - period_ms],
          ["ZRANGE", key, 0, -1],
          ["EXEC"]
        ]) do

      current = length(tss)

      if current < limit do
        {:ok, _} =
          Redix.pipeline(:redix, [
            ["MULTI"],
            ["ZADD", key, now_ms, now_ms],
            ["EXPIRE", key, ceil(period_ms / 1000)],
            ["EXEC"]
          ])

        {:ok, current}
      else
        {:exceeded, current}
      end
    else
      {:error, error} ->
        Logger.info("rate limiter redix error: #{inspect error}")
        {:ok, 0}
    end
  end
end
