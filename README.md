# Daybird

Daybird is a daily planning app with calendar and tasks. A hosted version can be found at [daybird.app](https://daybird.app).

Built with Phoenix/Elixir and Typescript/Preact, and uses Postgres as the DB.

Pull requests welcome, as are issues and discussions.

## Building from Source

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

## Running tests

Backend tests can be run with `make test`

## Deploying to a server

The `scripts/` folder has build and deployment scripts for easy deployment on a remote server. At a high level, the steps are:

1. Set up an nginx configuration. See `scripts/nginx.conf` for an example configuration.

2. Set up Postgres and populate the environment with secrets (see `scripts/secrets.example.env`.

    - (Optional) Set up AWS S3 (or any compatible service) for file storage and a Google Cloud OAuth key for Calendar sync.

3. Git clone your repo and use `mix phx.server` to start it.

