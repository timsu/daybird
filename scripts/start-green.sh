#!/bin/bash

source ~/.profile

export PORT=5000
export TF_PORT=5100

mix phx.server
