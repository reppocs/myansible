if status is-interactive
    # Commands to run in interactive sessions can go here
end

set -gx PATH $HOME/.local/bin $PATH

starship init fish | source
