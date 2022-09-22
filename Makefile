SHELL := /bin/bash
ACTUAL := $(shell pwd)
MIX_ENV=dev

export MIX_ENV
export ACTUAL

deps:
	mix local.hex --force && mix local.rebar --force
	mix deps.get

clean:
	mix deps.clean --all

test:
	MIX_ENV=test mix ecto.reset
	mix test.watch

test-ci:
	MIX_ENV=test mix clean
	MIX_ENV=test mix compile -f
	MIX_ENV=test mix ecto.reset
	MIX_ENV=test mix test

tsc:
	yarn deps
	yarn tsc

coverage-ci:
	MIX_ENV=test mix ecto.reset
	MIX_ENV=test mix test --cover

coverage:
	MIX_ENV=test mix ecto.reset
	MIX_ENV=test mix test --cover
	genhtml -o cover/lcov-report cover/lcov.info
	open cover/lcov-report/index.html

filter-coverage:
	cat .coverage-exclude | xargs lcov --remove cover/lcov.info -o cover/lcov.info

start:
	mix ecto.migrate
	mix phx.server

console:
	iex -S mix

.PHONY: deps docs test test-ci tsc clean coverage start console filter-coverage

start-test-server:
	-MIX_ENV=test mix ecto.reset
	ISTANBUL=1 IS_TEST=1 MIX_ENV=test AUTOMATION=1 mix phx.server

start-test-server-ci:
	ISTANBUL=1 IS_TEST=1 yarn workspace @tandem/assets build
	MIX_ENV=test mix compile > /dev/null 2>&1
	-MIX_ENV=test mix ecto.reset
	MIX_ENV=test AUTOMATION=1 SERVE_STATIC=1 mix test --cover test/teamtalk_web/server_test.exs

join-coverage:
	# join coverage across frontend and backend
	genhtml -o cover/lcov-report cover/lcov.info coverage/lcov.info
	open cover/lcov-report/index.html

