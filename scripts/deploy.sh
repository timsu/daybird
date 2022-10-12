#!/bin/bash

set -e

cd assets
yarn tsc
cd ..

git push origin HEAD:production

ssh app@app.listnote.co 'cd listnote; git fetch && git reset --hard origin/production && ./scripts/build.sh && sudo systemctl restart listnote'
