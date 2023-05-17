#!/usr/bin/env bash

# Terminate already running bar instances
killall -q polybar

# launch the main bar
polybar --config=$HOME/.config/polybar/config.ini main 2>&1 |tee -a /tmp/polybar.log & disown

echo "Polybar launched..."
