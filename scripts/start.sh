#!/bin/bash

PATH=$PATH:/home/app/.asdf/shims

set -a
. /home/app/.secrets
set +a

mix phx.server
