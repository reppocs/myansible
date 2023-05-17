#!/usr/bin/env bash

# only works on ubuntu 22.04 (and popos)
CODENAME="jammy"

# handle errors in a uniform manner
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR: $*" >&2 && exit 1
}

# if /etc/lsb-release doesn't exist, exit
[[ ! -f "/etc/lsb-release" ]] && err "/etc/lsb-release file not present"

# if /etc/lsb-release doesn't contain the right codename, exit
[[ -z "$(grep "DISTRIB_CODENAME=$CODENAME" /etc/lsb-release)" ]] && err "wrong release version"

# update and install required packages for latest ansible
sudo apt-add-repository -y ppa:ansible/ansible > /dev/null
DEBIAN_FRONTEND=noninteractive sudo apt-get update -qq
sudo apt-get -y install curl git software-properties-common ansible ansible-lint -qq
sudo apt-get -y autoremove -qq

# clone the repo
git clone https://github.com/reppocs/myansible.git
