#!/bin/bash

set -e

cd assets
yarn tsc
cd ..

git push origin HEAD:production

ssh app@app.listnote.co 'cd listnote; git pull; ./scripts/build.sh; sudo systemctl restart listnote'
