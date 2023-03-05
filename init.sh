#!/usr/bin/env bash

# update and install required packages for latest ansible
sudo apt-add-repository -y ppa:ansible/ansible > /dev/null
DEBIAN_FRONTEND=noninteractive sudo apt-get update -qq
sudo apt-get -y install curl git software-properties-common ansible ansible-lint -qq
sudo apt-get -y autoremove -qq

# clone the repo
git clone https://github.com/reppocs/myansible.git
