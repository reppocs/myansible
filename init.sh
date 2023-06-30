#!/usr/bin/env bash

# This is a script to set up the environment for running the playbook.
#
# Currently, it only supports Ubuntu 22.04, and Fedora 38.

DISTRO_NAME="$(grep '^ID=' /etc/os-release | awk -F= '{print $2}')"
DISTRO_VERSION="$(grep '^VERSION_ID' /etc/os-release | awk -F= '{print $2}' |sed -e 's/\"//g')"

# handle errors in a uniform manner
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR: $*" >&2 && exit 1
}

# fedora things
fedora_things() {
  sudo dnf -y install git ansible python3-ansible-lint -q
}

ubuntu_things() {
  sudo apt-add-repository -y ppa:ansible/ansible > /dev/null
  DEBIAN_FRONTEND=noninteractive sudo apt-get update -qq
  sudo apt-get -y install curl git software-properties-common ansible ansible-lint -qq
}

git_things() {
  # clone the repo to the Downloads directory
  [[ ! -d "$HOME/Downloads" ]] && err "$HOME/Downloads does not exist."
  git clone https://github.com/reppocs/myansible.git "$HOME/Downloads"

  # if the cloned repo directory exists, exit successfully
  if [[ -d "$HOME/Downloads/myansible" ]]
  then
    exit 0
  else
    err "The repo was not cloned successfully"
  fi
}

# if it's supported, do the thing
case $DISTRO_NAME in
  fedora)
    if [[ "$DISTRO_VERSION" == 38 ]]
    then
      fedora_things
    else
      err "This is an unsupported version of $DISTRO_NAME"
    fi
    ;;

  ubuntu)
    if [[ $DISTRO_VERSION = "22.04" ]]
    then
      ubuntu_things 
    else
      err "This is an unsupported version of $DISTRO_NAME"
    fi
    ;;

  *)
    err "This is an unsupported distribution"
    ;;
esac
