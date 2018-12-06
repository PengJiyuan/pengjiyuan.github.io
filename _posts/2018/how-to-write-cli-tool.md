---
title: 手把手教你写命令行工具
date: 2018-08-21
author: PengJiyuan
tag: JavaScript,NodeJs
intro: 手把手教你学会写NodeJs的cli工具
type: 原创
top: true
keywords: 命令行,cli,工具,JavaScript,nodejs,npm,JS,js,手把手教你,shell
---

> **命令行工具**，即 **Cli**(command-line interface)。是在图形用户界面得到普及之前使用最为广泛的用户界面，它通常不支持鼠标，用户通过键盘输入指令，计算机接收到指令后，予以执行。

**在学习这篇教程之前，你需要先了解NodeJs,NPM和一些常用的shell命令！**

对于前端开发者来说，用NodeJs开发命令行工具是最方便和快速的，借助于 **npm**，可以方便的进行调试和发布。

NodeJs的命令行使用如下图所示：

<div style="width: 100%;max-height:720px;text-align:center;overflow:hidden;">
  <img src="/static/images/blogs/how-to-write-cli-tool/cli.svg" />
</div>
<br>

那么怎么从零开始写一个命令行工具呢？

### 一、创建一个新项目

首先，我们创建一个npm项目。

```bash
$ mkdir cli-demo
$ cd cli-demo
$ npm init
```

通过以上步骤，我们新建了一个`cli-demo`文件夹，并且在`cli-demo`文件夹中初始化了一个`package.json`文件。`package.json`的内容大概是这样:

```json
{
  "name": "cli-demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT"
}
```

### 二、新建一个可执行文件

我们在`cli-demo`文件夹中，新建一个js文件，这里我们新建一个名为`cli.js`的文件。

> 我们在写命令行工具的时候，需要指定一个可执行文件。在`package.json`中，`bin`字段用来映射命令名和可执行文件。在通过`npm install -g`全局安装的时候，npm会`symlink`可执行文件到`prefix/bin`文件夹。
如果通过`npm install`本地安装的时候, npm会`symlink`可执行文件到`./node_modules/.bin/`文件夹。
>
> (完整的字段说明在这里：https://docs.npmjs.com/files/package.json)

如何让一个js文件变成可执行文件？只需要在js文件的头部加上一行代码:

```javascript
#!/usr/bin/env node
```

稍微完善一下`cli.js`, 如下：

```javascript
#!/usr/bin/env node

console.log('Hello world!');
```

### 三、指定`cli.js`为执行文件

我们需要在`package.json`中，指定`bin`字段将`cli.js`作为我们的执行文件。

```json
{
  "bin": "cli.js"
}
```

或者：

```json
{
  "bin": {
    "cli-demo": "cli.js"
  }
}
```

### 四、调试

我们全局安装一个cli包后，可以全局调用这个命令行工具。那我们在开发调试的时候, 就要用到`npm link`这个命令了。

> 在npm包文件夹下执行`npm link`命令，会创建一个符号链接，链接全局文件夹`{prefix}/lib/node_modules/<package>`和你执行`npm link`的包文件夹。
>
> 注意：`package-name`是`package.json`中的`name`, 而不是文件夹名。
>
> 详细的解释在这儿: https://docs.npmjs.com/cli/link

我们在`cli-demo`文件夹下执行`npm link`命令后，就可以全局使用`cli-demo`命令了。

```bash
$ cli-demo

Hello world!
```

### 五、使用命令行辅助工具

在我们写命令行工具的时候，使用一些辅助工具会让我们开发更高效。以下是一些我用过的一些辅助工具：

* [Commander.js](https://github.com/tj/commander.js) - 帮助参数解析，我最常用
* [optionator](https://github.com/gkz/optionator) - 帮助参数解析，[Eslint](https://github.com/eslint/eslint) 使用
* [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - 常见交互式命令行
* [chalk](https://github.com/chalk/chalk) - 命令行输出自定义颜色

修改我们的`cli.js`，使用[Commander.js](https://github.com/tj/commander.js)做一些更复杂的操作。

首先，安装`commander.js`:

```bash
npm i commander
```

`cli.js`代码：

```javascript
#!/usr/bin/env node

const program = require('commander');

program
  .version('0.1.0')
  .option('-n, --yourname [yourname]', 'Your name')
  .option('-g, --glad', 'Tell us you are happy')
  .parse(process.argv);

if (program.yourname) {
  console.log(`Hello, ${program.yourname}! ${program.glad ? 'I am very happy to see you!' : ''}`);
}
```

在命令行中使用：

```bash
$ cli-demo -h

  Usage: cli-demo [options]

  Options:

    -V, --version              output the version number
    -n, --yourname [yourname]  Your name
    -g, --glad                 Tell us you are happy
    -h, --help                 output usage information
```

```bash
$ cli-demo -n Jay

  Hello, Jay!
```

```bash
$ cli-demo -n Jay -g

  Hello, Jay! I am very happy to see you!
```

### 六、发布

单纯的发布包到npm非常简单，只需要一条命令：

```bash
npm publish
```

但是一个完善规范的发布流程不仅如此，还需要考虑版本号的规范([Semver](https://semver.org/))，commit message的规范，tag等一系列因素。如果手动来搞的话，是挺麻烦的。

这里推荐使用[relix](https://github.com/PengJiyuan/relix), 一步搞定！

```bash
npm i relix -g
```

进入`cli-demo`文件夹，然后：

```bash
relix --patch
```

会自动帮你生成新版本号，生成提交信息，打tag，推送提交和tag到github，发布npm包！[relix](https://github.com/PengJiyuan/relix)的详细用法请看relix文档。

> 进阶阅读：[怎么样写一个能告诉你npm包名字是否被占用的工具](/blog/2018/unused-npm-names)
