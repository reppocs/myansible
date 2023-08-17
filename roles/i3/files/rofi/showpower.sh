#!/usr/bin/env bash

#THEME="~/.config/rofi/themes/gruvbox.rasi"
#THEME="~/.config/rofi/themes/onedark.rasi"
THEME="~/.config/rofi/themes/mytheme.rasi"

rofi -show power-menu -modi power-menu:'~/.config/rofi/rofi-power-menu --no-symbols' -font "JetBrainsMono Nerd Font Medium 10" -theme "$THEME" -theme-str 'window {width: 20em;} listview {lines: 6;}'
