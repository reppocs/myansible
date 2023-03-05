# my little ole ansible

This ansible post-install playbook is compatible with PopOS! and Ubuntu 22.04.

![Pop! Pop!](https://github.com/reppocs/myansible/raw/main/files/poppop.webp)

## what it do?

This playbook (and other stuff) does my post-installation on my laptops, workstations, virtual machines, and various whatnots.

## execution

Before running the playbook, you'll need to run the `init.sh` script to set up the environment, and install the latest version of ansible and git. It will also clone the repo.

Do the following to run it.

`ansible-playbook -K --ask-vault-pass run.yml`

This will install and configure everything, except i3 or gnome. If you want those, use the tags, baby! The default theme is nord, because I like nord. If you want to change the theme, you can use the `theme` variable in the playbook run. The following are the currently configured themes.

- dracula
- gruvbox
- nord

## tags

- changetheme - Just changes the theme... (requires the `theme` variable)
- i3 - Installs and configures i3-gaps, and i3-gaps related packages.
- gnome - Configures PopOS!'s gnome situation

## other

You can also change the hostname of the system, since PopOS! is dumb and doesn't ask you what your system wants to be called during the install. Just use the `hostname` variable.

If you have any questions about any of this, please feel free to find me in person and tap me on the shoulder while I have my headphones in. I hope you have a fantastic day.
