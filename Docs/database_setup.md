#  AWS EC2, SSH & PostgreSQL Setup Guide

This guide explains how to:

- Create and configure an EC2 instance
- Enable root login and configure `sshd`
- Set up SSH key authentication
- Configure VS Code SSH host
- Install and configure PostgreSQL in the cloud
- Open security group rules
- Connect from local machine & set backend `.env`

The instructions below describe how I set up the database in the cloud using AWS. If you want to access it, please read through. Since the node has already been created and the PostgreSQL database has been added in AWS, the only thing you need to do is figure out how to connect to the database.

---

## 1️⃣ EC2 Instance & SSH Setup

### 1.1 Launch EC2 Instance

Search for EC2 in the search bar, go to the EC2 homepage, click Launch Instance, fill in any name you want, choose Ubuntu 22.04 for the Linux version (the one without any additional features), configure according to your project requirements, change the login option from “existing key pair” to no key pair, leave network and storage untouched, and launch the instance.

---

### 1.2 Allocate & Associate Elastic IP

In the left navigation bar, find Elastic IPs. In the upper right corner, allocate a new static IP, just confirm on the creation page, then select this IP. In Actions, select Associate IP, and on the association page choose the newly created instance and its only private IP.

---

### 1.3 Connect to the Instance

Go back to Instances in the left navigation bar, select the instance you just created, find the Connect button above, and on the next page choose Connect directly. You will then see a black terminal window.

---

### 1.4 Enable Root (Optional)

(If you need root -> first run sudo passwd root, enter your password twice; nothing will show while typing. Then you can run su -, enter your password, and if you see that the left side of the command prompt has “root” before the @ symbol, then you are root. Once you have root, you don’t need sudo for later commands.)

---

### 1.5 Configure sshd

Next, configure sshd. In the terminal enter vim /etc/ssh/sshd_config to enter the Vim editor. Press i to enter insert mode, and you will see -- INSERT -- at the bottom-left. Then remove the comment from the line PermitRootLogin prohibit-password and change prohibit-password to yes. Remove the comment from PubkeyAuthentication and change it to yes. Remove the comment from AuthorizedKeysFile. Remove the comment from PasswordAuthentication and change it to yes. Remove the comment from KbdInteractiveAuthentication and change it to yes. Then press Esc to exit insert mode and type :wq to save and exit.

---

### 1.6 Restart SSH & First Login from Local

Run systemctl restart ssh to apply the configuration. On this page, find the public IP in the bottom-left corner, copy it, open CMD on your local machine, and type ssh root@your_ip_address. On first login, it will ask whether to accept the fingerprint; type yes. Then it will ask for your password. After confirming and logging in, you can type exit to disconnect.

---

### 1.7 Prepare Local SSH Keys

Open the .ssh folder inside your local user directory—if you don’t have one, create it yourself. Then check whether you already have SSH keys, usually named id_ed25519 and id_ed25519.pub. If you don’t have a key pair, open CMD and run ssh-keygen, then press Enter all the way through.

---

### 1.8 Upload Public Key to Server

Then inside your .ssh folder, open CMD and run:

your_ip_address should be subsitute to 51.21.80.169
```bash
scp id_ed25519.pub root@your_ip_address:~/.ssh
```

Enter the server password. If you see the transfer progress on the right side of the next line, it means it succeeded. Then run:

```bash
ssh root@your_ip_address
```

You still need to enter the password this time. After logging in:

```bash
cd ~/.ssh
ls -l
```

You will see four items: ., .., authorized_keys, and your id_ed25519.pub. Then run:

```bash
cat id_ed25519.pub >> authorized_keys
```

Then change permissions:

```bash
chmod +r authorized_keys
chmod +rx .
```

Then exit and SSH again — now you should no longer need to enter a password. For security reasons, it is recommended to modify the configuration again to prevent root access leakage: inside ssh, run vim /etc/ssh/sshd_config, find PasswordAuthentication and KbdInteractiveAuthentication, change them to no, then run systemctl restart ssh to apply the configuration.

---

### 1.9 Optional: SSH Host Config (VS Code / OpenSSH)

```bash
Host   Name(e.g. Database)
  HostName hostip
  User root
  IdentityFile "~/.ssh/id_ed25519"
```

---

## 2️⃣ PostgreSQL in the Cloud

### 2.1 Download PostgreSQL in Cloud

Download postgresql in cloud

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

---

### 2.2 Create Database and User
{Password refers to the password i send in teams}

Create database and user

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE sharedgo;
CREATE USER sharedgo_user WITH PASSWORD '{Password}';
GRANT ALL PRIVILEGES ON DATABASE sharedgo TO sharedgo_user;
```

---

### 2.3 Configure `postgresql.conf`

```bash
sudo vim /etc/postgresql/14/main/postgresql.conf
```

(version may differ) → set:

```text
listen_addresses = '*'.
```

---

### 2.4 Configure pg_hba.conf

Run https://api.ipify.org to get your ip

put it in to config file
```text
host    sharedgo    sharedgo_user    your ip/32    md5
```

---

### 2.5 Configure AWS Security Group

Go to EC2 → Instances, select your instance, and in the Details pane click the linked Security group name.
On the security group page, open the Inbound rules tab → Edit inbound rules.
Click Add rule, choose Type: PostgreSQL (it auto-fills TCP/5432), set Source to My IP (it inserts your current your-ip/32) or enter another CIDR for a teammate.

---

### 2.6 Test Remote Connection

execute to check if it works

```bash
.\psql.exe "postgresql://sharedgo_user:{password}@51.21.80.169:5432/sharedgo"
```

---

### 2.7 Backend `.env` Configuration

in Backend Folder,in .env file, change the only line(suppose to be)to

```env
DATABASE_URL="postgresql://sharedgo_user:{password}@51.21.80.169:5432/sharedgo?schema=public""
```

---
