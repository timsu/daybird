cd assets
yarn --production=false
yarn build
cd ..
mix phx.digest
