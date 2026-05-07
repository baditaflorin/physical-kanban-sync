#!/usr/bin/env sh
set -eu

message_file="$1"
first_line="$(sed -n '1p' "$message_file")"

case "$first_line" in
  feat:\ *|fix:\ *|docs:\ *|chore:\ *|refactor:\ *|test:\ *|ops:\ *|data:\ *)
    exit 0
    ;;
  feat\(*\):\ *|fix\(*\):\ *|docs\(*\):\ *|chore\(*\):\ *|refactor\(*\):\ *|test\(*\):\ *|ops\(*\):\ *|data\(*\):\ *)
    exit 0
    ;;
esac

printf '%s\n' "Commit message must use Conventional Commits."
printf '%s\n' "Got: $first_line"
exit 1
