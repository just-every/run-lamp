#!/bin/bash
# Final candidate run: every proof script against the running demo, with its real exit code.
cd "$(dirname "$0")" || exit 1
OUT=../proof-raw/final; mkdir -p $OUT; : > $OUT/commands.log
run() { echo "\$ $*" >> $OUT/commands.log; "$@" > $OUT/$1.$2.out 2>&1; code=$?; echo "exit $code  ($*)" | tee -a $OUT/commands.log; }
run_named() { name=$1; shift; echo "\$ $*" >> $OUT/commands.log; "$@" > $OUT/$name.out 2>&1; code=$?; echo "exit $code  ($*)" | tee -a $OUT/commands.log; }
run_named states node states.mjs after ../proof-raw/final
run_named behaviour node behaviour.mjs ../proof-raw/final
run_named refresh60 node refresh60.mjs ../proof-raw/final
run_named extras node extras.mjs ../proof-raw/final
run_named hover node hover-shots.mjs after ../proof-raw/final-hover
run_named clip node clip.mjs ../proof-raw/final/clip-ancestors.json
run_named static node static-inventory.mjs ../proof-raw/final/static-after.json
