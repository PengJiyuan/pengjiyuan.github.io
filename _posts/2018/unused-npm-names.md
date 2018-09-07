---
title: 怎么样写一个能告诉你npm包名字是否被占用的工具
date: 2018-09-07
author: PengJiyuan
tag: JavaScript,NodeJs
intro: 怎么样可以知道一个npm包的名字是否被占用？为了方便，我们来写一个能告诉你npm名字是否被占用的工具。
type: 原创
---

> 事情是这样的：
>
> 因为我经常会写一些npm包，但是有时候我写完一个包，`npm publish` 的时候却被提示说包名字被占用了，要不就改名字，要不就加scope，很无奈。
> npm 命令行可以通过 `npm view` 的方式去得知一个包是否存在，但是无法批量得知，所以就想着写一个工具来批量选名:)
>
> 本教程的相关代码已经全上传到github: [源代码](https://github.com/PengJiyuan/unused-npm-names)

## NPM方式

在写工具之前，我们先看看怎么通过 npm 提供的命令来得知包名是否被占用。

`npm view`

通过 `npm view -h` 我们可以得知其用法：

> `npm view [<@scope>/]<pkg>[@<version>] [<field>[.subfield]...]`
>
> aliases: v, info, show

通过以上命令来看看 `unused-npm-names` 包：

```bash
npm view unused-npm-names
# 或者
npm info unused-npm-names
```

会输出：

```
{ name: 'unused-npm-names',
  'dist-tags': { latest: '1.1.1' },
  versions: [ '1.0.0', '1.0.1', '1.1.0', '1.1.1' ],
  time:
   { created: '2018-09-07T02:53:05.277Z',
     '1.0.0': '2018-09-07T02:53:05.439Z',
     modified: '2018-09-07T03:44:06.363Z',
     '1.0.1': '2018-09-07T03:07:46.542Z',
     '1.1.0': '2018-09-07T03:35:40.221Z',
     '1.1.1': '2018-09-07T03:44:03.534Z' },
  maintainers: [ 'pjy <731401082@qq.com>' ],
  description: 'Find unused npm names',
  homepage: 'https://github.com/PengJiyuan/unused-npm-names#readme',
  keywords: [ 'npm', 'names', 'unused', 'find' ],
  repository:
   { type: 'git',
     url: 'git+https://github.com/PengJiyuan/unused-npm-names.git' },
  author: 'PengJiyuan',
  bugs:
   { url: 'https://github.com/PengJiyuan/unused-npm-names/issues' },
  license: 'MIT',
  readmeFilename: 'README.md',
  version: '1.1.1',
  main: 'index.js',
  bin: { unn: 'cli.js' },
  scripts: { test: 'echo "Error: no test specified" && exit 1' },
  dependencies: { axios: '^0.18.0', chalk: '^2.4.1', commander: '^2.17.1' },
  gitHead: '818611db1c2baeb589cb3f639559ab6afc9f8e8f',
  dist:
   { integrity: 'sha512-t9bCfY3qbeVY54QC6Cznn3YhM0jq6HX0fE0r5TMAq1IOzu+NQ/caA8tfj62pZtDuZKb9R29ne7UyPB+4zAAplw==',
     shasum: '0b7c162f7656c0d74868bf567713150488f8c473',
     tarball: 'https://registry.npmjs.org/unused-npm-names/-/unused-npm-names-1.1.1.tgz',
     fileCount: 5,
     unpackedSize: 4544,
     'npm-signature': '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v3.0.4\r\nComment: https://openpgpjs.org\r\n\r\nwsFcBAEBCAAQBQJbkfQDCRA9TVsSAnZWagAAwS4QAKFC1MnosxmJEws07U4O\ngfUPLP04ZLZqtW6nuB/29A72DE1+bh/TGsir83r/sYf1TAPSLOCRd3Nrky3A\n7+umUUOl5zGU5WyG86Fo2XOl5cYgXXWXU6LcZufG/cwM3Xi9MUfxnT7zCEWt\nQPAE8Oh9UhkWCnvFMBA6M6knqK9K08nQf0Ke55UoiuX+OqF8BUlNw8LqEwrI\nMTW8hpjKqsAdo3JhBu0ZkrfTRMq7cTawfjAg+qDs4SSTuWD9OJ9d/2y4OC/p\nX6+3I+Et+SqFJxjGDBounjF1GYYiH3dQPRN8UWL1p9Ypu6YsiZ7l8dp6RH15\nHFUv6lsCmZvhkKc1zO1pY67xUOA9VbLjhXtObwopFvCIehlv3cCw5FMwoa7x\nz+tou0J4II6n68cG6IfTt+9odi9abj7M2YxStW32Miu3efhpXiw2PpX3HWOW\njkY7IQryyxJbQIdKHJqJ59fADHLxpdmr6WADYWt8mKI+9TK9onpSgFgX4udw\ng7fXN3z/L6i7yY+0fvvX/b0jjVzVFNP5kFnUBSnWk/Hjm+h96QS+0xfRCRNv\n5CmVT2kbxYNAdFsFFoNCqHqE+uQoMrSwBw1SIJdybWjs84QrLOrDFjhKypev\nl6bzrgcyE0VWYY1A+zdyquL1cQ+xEJacsfN5NbicxTZhDU0enAtcxhKSe7bz\nJ9CP\r\n=t8xy\r\n-----END PGP SIGNATURE-----\r\n' },
  directories: {} }
```

这样的输出太长了，我们可以只看 `unused-npm-names` 最近的版本号:

```bash
npm view unused-npm-names version
```

会输出：

```
1.1.1
```

当然，如果这个包不存在的话，就会报 `404` 的错误，我们也就知道这个包名是否被占用了。

## 写个命令行工具

上面的方式是可以得到我们想要的结果，可是如果我想从一批名字中选一个可用的，就没有那么方便了，就要一个一个试了。

如果有一个工具可以像这样使用：

```bash
unn react react-router react-dom react-pp react-fdasf
```

能一步鉴别所有的包，那就太方便了。

所以，我们一步一步来看一下应该怎么实现这个功能。

### 一、看npm如何做的

我们通过 `npm view` 可以查看一个包的信息，那么在走这个命令的时候，npm 肯定是发了一个请求去拿到的这个包的数据，那么我们怎么知道 npm 发的什么请求呢？

```bash
# 加 --verbose 后缀来看详细的输出
npm view unused-npm-names --verbose
```

会输出：

```
...

npm http request GET https://registry.npmjs.org/unused-npm-names

...

npm info ok
```

我们在其中发现，npm 发了个 `GET` 请求，请求的url是 `https://registry.npmjs.org/unused-npm-names`。

哦，那知道了，我们可以请求 `https://registry.npmjs.org/${packageName}` 来获取名为 `packageName` 的包信息。当然，在npm的官方仓库也能找到相关api的用法：[package-metadata](https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md)。

## 开始写工具

之前有一篇文章，讲了怎么写一个命令行工具，见这里：[手把手教你写命令行工具](/blog/2018/how-to-write-cli-tool)。这篇文章就不从怎么从零开始构建一个命令行工具开始了，我们直接来代码：

文件目录大概是这样：

```
unused-npm-names
├── node_modules
├── package.json
├── cli.js (bin)
└── index.js (main)
```

`package.json`:

```json
{
  "name": "unused-npm-names",
  "version": "1.0.0",
  "description": "Find unused npm names",
  "main": "index.js",
  "bin": {
    "unn": "cli.js"
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "license": "MIT",
  "dependencies": {
    "axios": "^0.18.0",
    "chalk": "^2.4.1",
    "commander": "^2.17.1"
  }
}
```

通过 `package.json` 中设置 `bin` 自动，我们将命令的名字设置为 `unn`，比较简短，方便实用。

我们把查询的主逻辑放到 `index.js` 中，把命令行逻辑放到 `cli.js` 中，这样的话我们既可以通过 cli 的方式去使用，也可以通过 `require` 的方式在 nodejs 脚本中使用。

```js
// index.js
const axios = require('axios'); // 用于发送 http 请求
const chalk = require('chalk'); // 终端输出带颜色的文本

// search方法的参数是一个数组，存放着需要查询的包的名字
// 比如我们要查询 react和react-dom，那么search(['react', 'react-dom'])
function search(pkgs = []) {
  if (!Array.isArray(pkgs)) {
    throw 'Param should be an array.';
  }

  console.log();
  pkgs.forEach((pkg) => {
    axios.get(`https://registry.npmjs.org/${pkg}`)
      .then((res) => {
        // 如果请求成功，说明包存在，那么名字被占用。
        console.log(`${chalk.cyan(pkg)}: ${chalk.red('Used ❌')}`);
      })
      .catch((err) => {
        // 如果请求失败，并且是因为404报错，那么证明包不存在，名字可用。
        if (err.stack && /Request failed with status code 404/.test(err.stack)) {
          console.log(`${chalk.cyan(pkg)}: ${chalk.green('Unused ✅')}`);
        } else {
          // 处理未知情况
          console.log(`${chalk.cyan(pkg)}: ${chalk.gray('Unknown 🤔')}`)
        }
      });
  });
}

module.exports = search;
```

我们最终实现的cli要支持两种模式，一种是命令行参数解析，一种是传入js文件。如下：
```js
// cli.js
#!/usr/bin/env node

'use strict';

const path = require('path');
const program = require('commander'); // 命令行参数解析
const chalk = require('chalk');
const search = require('.');
const pkg = require('./package.json');

program
  .version(pkg.version, '-v, --version')
  .usage('[names])')
  .option('-c, --config [config]', 'use config files')
  .on('--help', () => {
    console.log('\n  Examples:\n');
    console.log(`    ${chalk.green('$')} unn react,react-dom,react-router`);
    console.log('');
  })
  .parse(process.argv);

// program.args是所有解析直接传入的参数
// 比如 unn react react-dom --hehe
// 那么program.args是['react', 'react-dom']
let pkgs = program.args;

// 如果指定js文件的话，pkgs从文件中读取
if (program.config && typeof program.config === 'string') {
  // process.cwd() 是当前程序运行的目录
  const files = path.resolve(process.cwd(), program.config);

  try {
    pkgs = require(files);
    search(pkgs);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
} else {
  if (pkgs.length > 0) {
    search(pkgs);
  } else {
    program.outputHelp();
  }
}
```

这样我们的工具就创建好了，我们一起来试一下吧。（注意：要先 `npm link` 或者 全局安装了我们写的这个包，不明白的可以先看上一篇教程）

**cli使用**

```bash
unn react react-dom unnnn

# 输出
unnnn: Unused ✅
react-dom: Used ❌
react: Used ❌
```

**配置文件使用**

```js
// names.js
module.exports = ['react', 'react-router', 'react-dom', 'hahahahahaha'];
```

```bash
unn -c names.js

# 输出
hahahahahaha: Unused ✅
react-dom: Used ❌
react: Used ❌
react-router: Used ❌
```

**NodeJs api使用**

```js
// search.js
const search = require('unused-npm-names');

search(['react', 'react-dom', 'react-router', 'unused-npm-names']);
```

```bash
node search.js

# 输出
unused-npm-names: Used ❌
react-router: Used ❌
react: Used ❌
react-dom: Used ❌
```

## 后话

当然，这种方式不是百分百准确的，因为有的时候，就算包名字没被占用，也可能会被提示，跟已经存在的包名字太相似，让你改名字或者加scope，那就无能为力了。。。

> 相关阅读：[手把手教你写一个命令行工具](/blog/2018/how-to-write-cli-tool)
>
> 源代码：https://github.com/PengJiyuan/unused-npm-names

**本章完**
