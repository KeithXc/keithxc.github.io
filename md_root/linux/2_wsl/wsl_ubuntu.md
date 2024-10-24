# wsl_ubuntu

## install wsl

### 需要打开 设置->应用->应用和功能->可选功能->更多Windows功能->

```bash
# 勾选&确定
- Hyper-V
- 适用于Linux的Windows子系统
- 虚拟机平台
# 重启电脑
```

### 安装Ubuntu

```bash
# 修改wsl默认的版本为wsl2
wsl --set-default-version 2
# 查看已安装 wsl 的版本
wsl -l -v
# 查看可以安装的 wsl 发行版
wsl --list --online
# 安装 Ubuntu --- or --- 也可以在应用商店安装
wsl --install -d Ubuntu
# 更新 wsl
wsl --update
```

### 换源

```bash
# mirror
# <https://mirrors.ustc.edu.cn/help/ubuntu.html>
sudo apt install apt-transport-https -y
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bk
sudo sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list
sudo sed -i 's|security.ubuntu.com|mirrors.ustc.edu.cn|g' /etc/apt/sources.list
sudo sed -i 's/http:/https:/g' /etc/apt/sources.list
sudo apt-get update
sudo apt-get upgrade -y
```

### 安装 oh-my-bash

```bash
bash -c "$(curl -fsSL <https://raw.githubusercontent.com/ohmybash/oh-my-bash/master/tools/install.sh>)"
```

### apt install some apps

```shell
sudo apt install -y rustc cargo vim git curl wget cmake
```

### docker_编译环境

```bash
sudo apt install -y docker docker.io
```

#### build 基于 docker 的编译环境

```bash
sudo ./docker.sh build 0
sudo ln -s [当前路径/docker.sh] /bin/docker.sh
cd /home/keith/mywork/_prj/code
sudo docker.sh make 0 clean
sudo docker.sh make 0 all
# 编译失败用这个清除docker实例
sudo docker.sh clean
```

#### 导出|导入 docker image

```bash
# 导出
sudo docker save -o ubuntu.tar ubuntu
sudo docker save -o ubuntu_0.tar ubuntu_0
sudo chown keith:keith ubuntu*
sudo chmod 744 ubuntu*
# 导入
docker load -i [...tar]
```

## config

```powershell
# C:\Users\keith\.wslconfig
# Settings apply across all Linux distros running on WSL 2
[wsl2]
networkingMode=mirrored # 开启镜像网络
dnsTunneling=true # 开启 DNS Tunneling
firewall=true # 开启 Windows 防火墙
autoProxy=true # 开启自动同步代理
[experimental]
hostAddressLoopback=true
```

## mount U盘

```shell
sudo mount -t drvfs d: /home/keith/opt/e
```

### edge

​	https://www.microsoft.com/zh-cn/edge/download/insider?platform=linux-deb

```shell
## Setup
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo install -o root -g root -m 644 microsoft.gpg /usr/share/keyrings/
sudo sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-beta.list'
sudo rm microsoft.gpg
## Install
sudo apt update
sudo apt install -y microsoft-edge-beta
```



## Q&A

- 无法连接wsl问题

	```powershell
	netsh winsock reset
	```

- 虚拟盘损坏修复

	```powershell
	dism /Online /Cleanup-Image /RestoreHealth
	```

- 指定wsl 使用的网卡

	```shell
	# shutdown wsl
	wsl --shutdown
	# 创建一个名为 WSL 的虚拟网卡 桥接到 Wi-Fi
	New-VMSwitch -Name "WSL" -NetAdapterName "Wi-Fi" -AllowManagementOS $true
	# 编辑 C:\Users\keith\.wslconfig
	[wsl2]
	networkingMode=bridged  # 使用桥接模式
	vmSwitch=WSL  		    # 替换为你的 Wi-Fi 适配器名称
	ipv6=true               # 启用 IPv6（如果需要）
	# 重新打开 wsl
	-------------------------------------------------------------------------
	# other
	Remove-VMSwitch -Name "WSL"
	```
	
	
