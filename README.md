# ListNote

Installation instructions:

1. Install asdf and postgres

```
# Mac: brew install asdf postgresql@12
# Ubuntu: apt-get install asdf postgresql-12
```

2. Install relevant asdf plugins:

```
asdf plugin add elixir
asdf plugin add erlang
asdf plugin add nodejs
asdf plugin add yarn
```

3. Install dependencies and initialize database

```
asdf install
yarn
cd assets && yarn
mix deps.get
mix ecto.setup
```

4. Start the phoenix server

```
mix phx.server
```

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

