#!/bin/bash

set -e

. $HOME/.profile
cd assets
yarn --production=false
yarn build
cd ..
mix deps.get
mix ecto.migrate
mix phx.digest
