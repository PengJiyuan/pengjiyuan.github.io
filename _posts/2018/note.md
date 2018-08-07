---
title: 一些备忘的记载
date: 2018/08/06 18:37:00
---

# 环境搭建(Ubuntu下)：
**[包括nvm，git，grunt，webpack，sublime，google-chrome，vpn，gnome-pie的安装和配置]**     

## nvm的搭建
```bash
$ cd ~/git   
$ git clone https://github.com/creationix/nvm.git
```  

配置终端启动时自动执行 `source ~/git/nvm/nvm.sh`,
在 `~/.bashrc`, `~/.bash_profile`, `~/.profile`, 或者 `~/.zshrc` 文件添加以下命令:    

```bash
source ~/git/nvm/nvm.sh
```    

**或者：**    

```bash
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash
```    

在 `~/.bashrc`, `~/.bash_profile`, `~/.profile`, 或者 `~/.zshrc` 文件添加以下命令:

```bash
source ./.nvm/nvm.sh
```   

然后输入在控制台输入 `nvm` 查看是否安装成功吧～    

## 常见nvm命令：    
### 1.  安装node：  
    
* `nvm install <version>`    

* nvm 默认是从 http://nodejs.org/dist/ 下载的, 国外服务器, 必然很慢, 好在 nvm以及支持从镜像服务器下载包, 于是我们可以方便地从七牛的 node dist 镜像下载:    

* `NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node nvm install 5`   

* 5是5.xx版本的意思，6即是6.xx版本，也可以指定版本如5.9.1    

### 2.  查看node版本   
```bash
nvm ls
```     

列出你安装的所有版本的node以及当前你所用的node版本，还有你默认的node版本。    

### 3.  切换node版本    

```bash
nvm use version
```

### 4.  设置默认版本    

```bash
nvm alias default v5.9.0
```    

## git安装及配置

### 1.  安装git    
```bash
$ sudo apt-get install git
```


### 2.  配置git    
```bash
$ git config --global user.name "your name"

$ git config --global user.email "your email"
```


### 3.  创建SSH Key    
```bash
$ ssh-keygen -t rsa -C "youremail@example.com"     
   
$ cd ~/.ssh    可以看到id_rsa(私钥)和id_rsa.pub(公钥)，将id_rsa.pub的内容添加到    

GitHub->Account-settings->SSH Keys中
```


### 4.  windows下配置git：    

```bash
$ Git config --global user.name "your name"    

$ git config --global user.email "your email"
```



__创建SSH Key:__        

不同于linux，window没有~/.ssh，需要生成秘钥到/c/Users/Administrator/.ssh。     

进入/c/Users/Administrator/.ssh目录，`ssh-keygen -t rsa -C "youremail@example.com"` ,接下来同linux操作。

## grunt的安装和配置：    

安装grunt和grunt-cli  
  
```bash
$ npm install -g grunt-cli    

$ npm install grunt -g
```


安装grunt插件    
```bash
$ npm install <module> --save-dev
```

## webpack的安装和使用    

### 1.  安装    

```bash
$ npm install webpack -g    

$ pm install webpack --save-dev
```


### 2.  命令行操作    

```bash
$ webpack --config XXX.js   //使用另一份配置文件（比如webpack.config2.js）来打包
 
$ webpack --watch   //监听变动并自动打包
         
$ webpack -p    //压缩混淆脚本，这个非常非常重要！
         
$ webpack -d    //生成map映射文件，告知哪些模块被最终打包到哪里了   
```

##  sublime text 3的安装       

```bash
$ sudo add-apt-repository ppa:webupd8team/sublime-text-3  

$ sudo apt-get update    

$ sudo apt-get install sublime-text-installer    
```

##  google chrome安装    

```bash
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb     

$ sudo dpkg -i google-chrome-stable_current_amd64.deb    

$ 控制台输入 `google-chrome` 即可打开chrome浏览器，把它锁定到启动器吧～ 
```

## Linux zip    

* `zip -r myfile.zip ./*`
   将当前目录下的所有文件和文件夹全部压缩成myfile.zip文件,－r表示递归压缩子目录下所有文件.    

* unzip
   `unzip -o -d /home/sunny myfile.zip`    
   把myfile.zip文件解压到 /home/sunny/    
   -o:不提示的情况下覆盖文件；    
   -d:-d /home/sunny 指明将文件解压缩到/home/sunny目录下；

* `zip -d myfile.zip smart.txt`    
   删除压缩文件中smart.txt文件    
   zip -m myfile.zip ./rpm_info.txt    
   向压缩文件中myfile.zip中添加rpm_info.txt文件    

* `zip -r filename.zip file1 file2 file3 /usr/work/school`    
   上面的命令把 file1、file2、 file3、以及 /usr/work/school 目录的内容（假设这个目录存在）压缩起来，然后放入 filename.zip 文件中。 

## Linux tar.gz解压

tar  -zxvf   压缩文件名.tar.gz

## Linux rar 解压

需要先下载rar    

`sudo apt-get install rar`    

解压：    

`rar x FileName.rar`    

压缩：    

`rar a FileName.rar DirName`


##  VPN的搭建

1.  首先需要准备一个文件    
    NetExtender.Linux.7.0.741.x86_64.tgz      

2.  安装压缩文件        

    `tar -zxvf NetExtender.Linux.7.0.741.x86_64.tgz`       

    `cd netExtenderClient`     

    `sudo ./install`     

3.  图形化界面需要java环境支持，不安装图形化界面的略过～    

    `sudo apt-get install openjdk-7-jre`       
 
     如果报错的话，使用下边方法：    

    `sudo add-apt-repository ppa:webupd8team/java`    

    `sudo apt-get update`      

    `sudo apt-get install oracle-java7-installer`    

     等待时间略长～～    

4.  启动    

    在控制台输入 `netExtender` 即可～    

## 安装mysql    

   `sudo apt-get install mysql-server mysql-client` 安装mysql    

   `service mysql start`  启动MySQL服务    

   `service mysql stop`  停止MySQL服务    

   `sudo mysqladmin -u root password newpassword`  修改 MySQL 的管理员密码    

   设置远程访问(正常情况下，mysql占用的3306端口只是在IP 127.0.0.1上监听，拒绝了其他IP的访问（通过netstat可以查看到）。取消本地监

听需要修改 my.cnf 文件：)：

   `sudo vi /etc/mysql/my.cnf`

   `bind-address = 127.0.0.1` //找到此内容并且注释  

## 装X神器gnome-pie     

  `sudo add-apt-repository ppa:simonschneegans/testing -y`    

  `sudo apt-get update && sudo apt-get install gnome-pie`    

  `gnome-pie`  即可启动应用        

  `ctrl+alt+a`  在鼠标处唤出    

##  chrome 代理设置(nproxy)    

1. SwitchySharp下载    
 
2. 解压得到crx文件，拖到chrome扩展程序即可安装    

3. 如图配置    
       
 ![config](assets/daily/nproxy.png)    

4. `npm install nproxy -g`    

5. `touch your_replace_rule.js`   填写你的替换规则    

6. `nproxy -l your_replace_rule.js`  即可开启代理    


# 一些备忘操作

##  连接远程服务器    

    ssh root@192.168.1.1  

   （root对应你使用的用户名，192……对应的服务器ip地址，一般服务器端口22，命令默认22.如果需要更改端口在ssh后面 -p 端口）

## 修改terminal前面路径太长    

   将 `export PS1="\[\e[32;1m\]-> \[\e[0m\]"` 添加到 ～/.bashrc 内，保存    
   那么终端前面路径只会显示一个箭头～

## 修改terminal不显示绝对路径，只显示当前路径    

打开 ～/.bashrc    

```bash
if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
    unset color_prompt force_color_prompt     //将w改成W，保存    
```

## watch ... ENOSPC报错

在使用gulp，grunt，gitbook等的watch功能时，如果出现watch...ENOSPC的报错，主要是因为watch需要监听很多文件的改动，但是fedora、ubuntu系统的文件句柄其实是有限制的，因此可以使用以下命令：    

`$ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`


## mysql导出

导出数据库：mysqldump -u 用户名 -p 数据库名 > 导出的文件名     

如我输入的命令行:mysqldump -u root -p news > news.sql   (输入后会让你输入进入MySQL的密码)    

（如果导出单张表的话在数据库名后面输入表名即可）
