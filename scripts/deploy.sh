#!/bin/bash

cd assets && yarn tsc && cd ..
git push -f origin HEAD:production

LIVE_VERSION=$(curl -s -w "\n" "https://daybird.app/deployment_id")

if [ "$LIVE_VERSION" = "blue" ]; then
  DEPLOY_VERSION="green"
else
  DEPLOY_VERSION="blue"
fi

echo "Deploying "$DEPLOY_VERSION

set -e

DIR=sites/$DEPLOY_VERSION

# build & start new server
ssh app@app.listnote.co "cd $DIR; git fetch && git reset --hard origin/production && \
  ./scripts/build.sh && \
  sudo systemctl restart daybird-$DEPLOY_VERSION && \
  sleep 5 && \
  sudo ln -sf /etc/nginx/sites-available/$DEPLOY_VERSION /etc/nginx/sites-enabled/daybird && \
  sudo systemctl reload nginx &&
  sleep 5 && \
  sudo systemctl stop daybird-$LIVE_VERSION"
