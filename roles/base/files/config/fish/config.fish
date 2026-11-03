if status is-interactive
    # Commands to run in interactive sessions can go here
    starship init fish | source
    atuin init fish | source
end

set -gx PATH $HOME/.local/bin $PATH
set -gx EDITOR nvim
set -gx VISUAL nvim
