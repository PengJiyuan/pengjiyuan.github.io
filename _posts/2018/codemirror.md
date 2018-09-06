---
title: 搭建网页代码编辑器
date: 2018-09-05
author: PengJiyuan
tag: JavaScript
intro: 本章主要探讨如何使用 codemirror 搭建网页代码编辑器.
type: 原创
keywords: codemirror,网页编辑器,代码编辑器,教程,javascript,js,前端
---

## CodeMirror

[CodeMirror](https://github.com/codemirror/codemirror) 是一个可以镶嵌到 Web 页面中代码编辑器组件。它的核心代码库仅仅提供了编辑器功能，没有提供像是 **自动补全**, **语法纠错** 等IDE功能。
**CodeMirror** 提供了丰富的api，让你可以轻易的拓展想要的功能。

## 使用方法

### 浏览器

在浏览器中使用的话，你需要引用编辑器核心 `js` 和 `css` 文件，每个编辑器主题对应一个css文件，你需要引用你所指定的编辑器主题对应的css。每个编辑器语言对应一个js文件，需引入你需要编辑的语言对应的js文件。

如下，我们创建一个编辑 `javascript` 代码的编辑器：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="stylesheet" href="https://unpkg.com/codemirror@5.40.0/lib/codemirror.css">
  <link rel="stylesheet" href="https://unpkg.com/codemirror@5.40.0/theme/material.css">
  <title>Document</title>
  <style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  textarea {
    width: 100%;
    height: 100%;
  }
  </style>
</head>
<body>
  <textarea id="text">
    var myTextArea = document.getElementById('text');
    var editor = CodeMirror.fromTextArea(myTextArea, {
      lineNumbers: true,
      mode: 'javascript',
      theme: 'material'
    });
    editor.on('change', () => {
      console.log(editor.getValue());
    });
  </textarea>
</body>
<script src="https://unpkg.com/codemirror@5.40.0/lib/codemirror.js"></script>
<script src="https://unpkg.com/codemirror@5.40.0/mode/javascript/javascript.js"></script>
<script>
  var myTextArea = document.getElementById('text');
  var editor = CodeMirror.fromTextArea(myTextArea, {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'material'
  });
  editor.on('change', () => {
    console.log(editor.getValue());
  });
</script>
</html>
```

上边的代码复制到html文件即可运行。从上边的代码可以看到，我们使用 `CodeMirror.fromTextArea()` 创建了一个编辑器，当然还有其他的方法来创建。

* 从textarea创建，会自动替换textarea并且获取textarea的值，填充到编辑器。

```html
<textarea id="text">console.log('codemirror!');</textarea>
<script>
const myTextArea = document.getElementById('textarea');
CodeMirror.fromTextArea(myTextArea, {
  lineNumbers: true,
  mode: 'javascript'
});
</script>
```

* 指定父级元素创建编辑器

如下代码，`CodeMirror` 会创建一个编辑器，插入到 `body` 节点下。

```html
<body></body>
<script>
CodeMirror(document.body, {
  value: 'console.log("codemirror")',
  mode: 'javascript'
});
</script>
```

### 模块打包用法

我们可以通过 **Webpack** 来打包使用 **codemirror**。

先通过 `npm` 下载codemirror：

```bash
npm i codemirror
```

引用 **codemirror** 所需要的 js 和 css 文件：

```javascript
const CodeMirror = require('codemirror'); // 编辑器主逻辑文件
require('codemirror/mode/javascript/javascript.js'); // 编辑器支持 javascript
require('codemirror/lib/codemirror.css'); // 编辑器主样式文件
require('codemirror/theme/material.css'); // 编辑器主题样式文件

CodeMirror(document.body, {
  value: 'console.log("codemirror")',
  mode: 'javascript',
  theme: 'material'
});
```

## 简单常用的api

在我们使用 **CodeMirror** 搭建编辑器之后，可能会用到下面一些简单的api。详细的api列表在这里：[api list](https://codemirror.net/doc/manual.html#api).

**`getValue()`**

获取编辑器当前的值。

```javascript
const editor = CodeMirror(document.body);

function getEditorValue() {
  return editor.getValue();
}
```

**`setValue(value: String)`**

改变编辑器的值。

```javascript
const editor = CodeMirror(document.body);

function setEditorValue(value) {
  editor.setValue(value);
}
```

**`on(eventName: String, handler: Function)`**

编辑器时间监听。

支持丰富的event类型，完整的event 类型你可以在这里查阅：[event list](https://codemirror.net/doc/manual.html#events)。比如，我们可以监听编辑器内容改变，当编辑器内容改变时，输出编辑器的内容：

```javascript
const editor = CodeMirror(document.body);

editor.on('change', (codemirrorIns, codemirrorObj) => {
  console.log(editor.getValue());
});
```

## IDE拓展

**CodeMirror** 支持丰富的IDE拓展，这些拓展放在 `codemirror/addon`文件夹下。我们可以通过引入该文件夹下的IDE文件，从而让我们编辑器的功能更加丰富。完整的IDE拓展列表在这里：[addon list](https://codemirror.net/doc/manual.html#addons).

如下示例展示了开启javascript语法纠错：(直接将代码复制到html文件即可运行)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="stylesheet" href="https://unpkg.com/codemirror@5.40.0/lib/codemirror.css" />
  <link rel="stylesheet" href="https://unpkg.com/codemirror@5.40.0/theme/material.css" />
  <link rel="stylesheet" href="https://unpkg.com/codemirror@5.40.0/addon/lint/lint.css" />
  <title>Document</title>
  <style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  textarea {
    width: 100%;
    height: 100%;
  }
  </style>
</head>
<body>
<textarea id="text">
const a = 
</textarea>
</body>
<script src="https://unpkg.com/jshint@2.9.6/dist/jshint.js"></script>
<script src="https://unpkg.com/codemirror@5.40.0/lib/codemirror.js"></script>
<script src="https://unpkg.com/codemirror@5.40.0/mode/javascript/javascript.js"></script>
<script src="https://unpkg.com/codemirror@5.40.0/addon/lint/lint.js"></script>
<script src="https://unpkg.com/codemirror@5.40.0/addon/lint/javascript-lint.js"></script>
<script>
  var myTextArea = document.getElementById('text');
  var editor = CodeMirror.fromTextArea(myTextArea, {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'material',
    lint: true
  });
  editor.on('change', () => {
    console.log(editor.getValue());
  });
</script>
</html>
```

当然，**CodeMirror** 的功能十分丰富，比如 **按键映射**、**主题定制**、**Vim模式**等，更深入的使用可以查阅 [CodeMirror 官网](https://codemirror.net/)。

**本章完**
