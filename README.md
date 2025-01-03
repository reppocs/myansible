# myansible
This is my personal ansible situation to configure new workstations, laptops, and vms.

### installation
Run the following to set up your environment (install ansible, git, etc... and clone the repo).

```
wget https://raw.githubusercontent.com/reppocs/myansible/main/init.sh
chmod +x init.sh
./init.sh
```
Execute the playbook.

```
cd myansible
ansible-playbook -K --ask-vault-pass -e "hostname=<hostname>" runme.yml
```

Note: I ansible-vaulted some of these files so I don't doxx myself, so you'll have to add your own info.

### supported platforms

This has been written for the following distro versions.

* Fedora 41
* Ubuntu 22.04/24.04
