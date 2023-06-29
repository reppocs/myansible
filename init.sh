#!/usr/bin/env bash

# This is a script to set up the environment for running the playbook.
#
# It only supports Ubuntu 22.04.

set -e

DISTRO_NAME="$(grep '^ID=' /etc/os-release | awk -F= '{print $2}')"
DISTRO_VERSION="$(grep '^VERSION_ID' /etc/os-release | awk -F= '{print $2}' |sed -e 's/\"//g')"

# handle errors in a uniform manner
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR: $*" >&2 && exit 1
}

if [[ ! "$DISTRO_NAME" == "ubuntu" ]]; then
    err "This script only supports Ubuntu 22.04."
    if [[ ! "$DISTRO_VERSION" == "22.04" ]]; then
        err "This script only supports Ubuntu 22.04." 
    fi
fi
                                                                                                                                                            
sudo apt-add-repository -y ppa:ansible/ansible > /dev/null
DEBIAN_FRONTEND=noninteractive sudo apt-get update -qq
sudo apt-get -y install curl git software-properties-common ansible ansible-lint -qq
sudo apt-get -y autoremove -qq

# clone the repo to the Downloads directory
[[ ! -d "$HOME/Downloads" ]] && err "$HOME/Downloads does not exist."
git clone https://github.com/reppocs/myansible.git "$HOME/Downloads"

# if the cloned repo directory exists, exit successfully
[[ -d "$HOME/Downloads/myansible" ]] && exit 0
