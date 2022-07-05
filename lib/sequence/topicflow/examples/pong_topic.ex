defmodule Sequence.Topicflow.Examples.PongTopic do
  alias Sequence.Topicflow.Topic

  @pong_width 640
  @pong_height 480
  @pong_update_period 50
  @pong_pad_size 120
  @pong_ball_size 10

  def init(_id) do
    Process.send_after(self(), :update_pong, @pong_update_period)
    {:ok, new_round()}
  end

  def handle_info(
        :update_pong,
        {x, y, dx, dy, return_count, score_left, score_right},
        _data,
        grouped_datasets
      ) do
    Process.send_after(self(), :update_pong, @pong_update_period)

    {{left_pad_key, left_pad_y}, {right_pad_key, right_pad_y}} =
      case Map.to_list(grouped_datasets) do
        [{pad_key, %{"pad_y" => {pad_y, _}}} | rest] ->
          {{pad_key, pad_y},
           case rest do
             [{pad_key, %{"pad_y" => {pad_y, _}}} | _] -> {pad_key, pad_y}
             _ -> {nil, nil}
           end}

        _ ->
          {{nil, nil}, {nil, nil}}
      end

    kvt = %{
      "ball" => {%{"x" => ceil(x), "y" => ceil(y)}, nil},
      "score" => {%{"left" => score_left, "right" => score_right}, nil},
      "left_pad" =>
        {if left_pad_y != nil do
           %{
             "key" => left_pad_key,
             "from_y" => left_pad_y - @pong_pad_size / 2,
             "to_y" => left_pad_y + @pong_pad_size / 2
           }
         else
           nil
         end, nil},
      "right_pad" =>
        {if right_pad_y != nil do
           %{
             "key" => right_pad_key,
             "from_y" => right_pad_y - @pong_pad_size / 2,
             "to_y" => right_pad_y + @pong_pad_size / 2
           }
         else
           nil
         end, nil}
    }

    :ok = Topic.cast_set_keys_no_reply(self(), nil, kvt)

    x = x + dx
    y = y + dy

    dx =
      if x + @pong_ball_size / 2 > @pong_width or x - @pong_ball_size / 2 < 0, do: -dx, else: dx

    dy =
      if y + @pong_ball_size / 2 > @pong_height or y - @pong_ball_size / 2 < 0, do: -dy, else: dy

    if right_pad_y != nil and x + @pong_ball_size / 2 > @pong_width do
      if y < right_pad_y - @pong_pad_size / 2 or y > right_pad_y + @pong_pad_size / 2 do
        new_round(score_left + 1, score_right, true)
      else
        deflect(x, y, return_count, score_left, score_right, false)
      end
    else
      if left_pad_y != nil and x - @pong_ball_size / 2 < 0 do
        if y < left_pad_y - @pong_pad_size / 2 or y > left_pad_y + @pong_pad_size / 2 do
          new_round(score_left, score_right + 1, false)
        else
          deflect(x, y, return_count, score_left, score_right, true)
        end
      else
        {x, y, dx, dy, return_count, score_left, score_right}
      end
    end
  end

  defp rand_dxy(return_count, leftward) do
    angle =
      if leftward do
        :math.pi() / 4
      else
        :math.pi() + :math.pi() / 4
      end

    angle = angle + :math.pi() / 2 * :rand.uniform()
    speed = 5 + :rand.uniform(5)

    speed =
      if return_count > 0 do
        speed + :math.log(return_count) * 5
      else
        speed
      end

    {speed * :math.sin(angle), speed * :math.cos(angle)}
  end

  defp new_round(score_left \\ 0, score_right \\ 0, serve_left \\ :rand.uniform() > 0.5) do
    {dx, dy} = rand_dxy(0, serve_left)

    {if serve_left do
       @pong_ball_size / 2
     else
       @pong_width - @pong_ball_size / 2
     end, @pong_height / 2, dx, dy, 0, score_left, score_right}
  end

  defp deflect(x, y, return_count, score_left, score_right, deflect_left) do
    {dx, dy} = rand_dxy(return_count, deflect_left)
    {x, y, dx, dy, return_count + 1, score_left, score_right}
  end
end
