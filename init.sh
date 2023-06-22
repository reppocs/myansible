#!/usr/bin/env bash

set -e

DISTRO_NAME="$(grep '^ID=' /etc/os-release | awk -F= '{print $2}')"
DISTRO_VERSION="$(grep '^VERSION_ID' /etc/os-release | awk -F= '{print $2}' |sed -e 's/\"//g')"

# handle errors in a uniform manner
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR: $*" >&2 && exit 1
}

run_fedora () {
    sudo dnf -y install ansible git curl -q
}

run_ubuntu() {
    sudo apt-add-repository -y ppa:ansible/ansible > /dev/null
    DEBIAN_FRONTEND=noninteractive sudo apt-get update -qq
    sudo apt-get -y install curl git software-properties-common ansible ansible-lint -qq
    sudo apt-get -y autoremove -qq
}

git_clone() {
    # clone the repo to the Downloads directory
    [[ ! -d "$HOME/Downloads" ]] && err "$HOME/Downloads does not exist."
    git clone https://github.com/reppocs/myansible.git "$HOME/Downloads"

    # if the cloned repo directory exists, exit successfully
    [[ -d "$HOME/Downloads/myansible" ]] && exit 0
}

# if the distro and version are supported, run the things
if [[ "$DISTRO_NAME" == "ubuntu" ]]; then
    if [[ "$DISTRO_VERSION" == "22.04" ]]; then
        run_ubuntu
        git_clone
    fi
elif [[ "$DISTRO_NAME" == "fedora" ]]; then
    if [[ "$DISTRO_VERSION" == "38" ]]; then
        run_fedora
        git_clone
    fi 
fi

# if none of those matched, error out
err "Distribution and/or version unsupported."
