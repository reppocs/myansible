#!/usr/bin/env bash

[[ ! -d "$HOME/Downloads" ]] && echo "$HOME/Downloads does not exist." && exit 1
[[ -d "$HOME/Downloads/myansible" ]] && echo "$HOME/Downloads/myansible already exists" && exit 1

echo "run git clone"
