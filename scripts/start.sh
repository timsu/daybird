#!/bin/bash

source ~/.profile

export PORT=$1
export TF_PORT=$2

mix phx.server
