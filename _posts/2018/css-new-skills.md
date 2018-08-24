---
title: Css还可以这么写?
date: 2018-08-23
author: PengJiyuan
tag: JavaScript,Css
intro: 本章主要介绍css-modules, style-components, less.
type: 原创
top: true
keywords: css-modules,style-components,less,css,postcss,js,前端
---

> 作为一个前端，毫无疑问css肯定是最基础的一项技能之一。css是一个标记语言，没有编程语言的诸多特性，比如变量定义，复用，嵌套等，所以相应的开发效率也受到限制。
> 在追求效率和自动化的当下，涌现了一批解决方案，像是css预编译语言Less, Sass等，解决css命名冲突的css-modules，在js中写css的style-components等。
>
> 本篇文章不在于探讨css的技巧学习，而在于讨论css的这些提升开发效率的方案。

## Less

[Less](https://github.com/less/less.js), [Sass](https://github.com/sass/sass), [Stylus](https://github.com/stylus/stylus)等 `css预编译语言`，给css赋予了编程特性。拿 `Less` 来说，它扩展了 CSS 语言，增加了变量、Extend、Mixin、函数等特性，也支持import导入文件，使 CSS 更易维护和扩展。本篇简单介绍一下Less的一些特性，详细的教程可以上[Less官网](http://lesscss.org/)查看。

### 怎么样使用Less?

我们可以在 `命令行` 直接使用less，也可以通过 `node api` 去使用less，或者通过 `webpack`，`gulp`，`grunt`等的 `less插件` 去使用，甚至可以在浏览器端使用，非常灵活。这里简单说一下在命令行中使用less。

```bash
$ npm i less -g
# 当less被安装之后，就可以使用全局命令lessc
$ lessc bootstrap.less bootstrap.css
```

### 一、变量

`变量使css代码更易维护。`

比如有个主色 `#ef8376`，在整个样式表中，我们有多处使用这个颜色。如果主色变动的话，比如主色要变成 `#000`，我们就要手动去全局替换这个变量，而有一些 `#ef8376`我们却不希望替换掉，这样就造成了极大的困扰。

如果我们使用less的话，就可以这么写：

```less
@primaryColor: #ef8376;

.banner {
  background-color: @primaryColor;
  .text {
    color: @primaryColor;
    border-color: #ef8376;
  }
}
```

我们要修改主色，只需要将 `@primaryColor` 修改为 '#000'即可。

### 二、Extend

`Extend让我们可以用伪类的写法去合并一些类`。

比如：

```less
nav ul {
  &:extend(.inline);
  background: blue;
}
.inline {
  color: red;
}
```

会编译成：

```css
nav ul {
  background: blue;
}
.inline,
nav ul {
  color: red;
}
```

### 三、Mixin

`Mixin既有Extend继承已有类的特性，也有其他高级的特性，比如支持变量，支持像使用方法一样使用mixin`

**支持变量**

```less
.foo (@bg, @color: '#000') {
  background: @bg;
  color: @color;
}
.unimportant {
  .foo(#f5f5f5);
}
.important {
  .foo(#121212) !important;
}
```

会编译成：

```css
.unimportant {
  background: #f5f5f5;
  color: #000;
}
.important {
  background: #121212 !important;
  color: #000 !important;
}
```

**像方法一样使用Mixin**

```less
.count(@x, @y) {
  @margin: ((@x + @y) / 2);
  @padding: ((@x + @y) / 4)
}

div {
  margin: .count(16px, 16px)[@margin];
  padding: .count(16px, 16px)[@padding];
}

.loop(@counter) when (@counter > 0) {
  .loop((@counter - 1));    // next iteration
  width: (10px * @counter); // code for each iteration
}

.text {
  .loop(5); // launch the loop
}
```

会编译成:

```css
div {
  margin: 16px;
  padding: 8px;
}

.text {
  width: 10px;
  width: 20px;
  width: 30px;
  width: 40px;
  width: 50px;
}
```

### 四、Import导入文件

```less
// head.less
.banner {
  background-color: red;
}
```

```less
// footer.css
.footer {
  background-color: green;
}
```

```less
@import './head.less';
@import css './footer.css';
```

会编译成：

```css
.banner {
  background-color: red;
}
.footer {
  background-color: green;
}
```

### 五、方法

`Less支持一些常用的辅助方法`

比如`darken`和`lighten`用来加深或淡化颜色。

```less
body {
  background-color: darken(hsl(90, 80%, 50%), 20%);
  color: lighten(hsl(90, 80%, 50%), 20%);
}
```

会编译成：

```css
body {
  background-color: #4d8a0f;
  color: #b3f075;
}
```

## css-modules

[css-modules](https://github.com/css-modules/css-modules) 相较于 **Less** 来说有所不同，**css-modules** 只是拓展了 css 的写法，解决了css的块作用域和全局作用域，而不是将css变成一门编程语言。

### 为什么需要 css-modules？

Css一直以来都有一个问题，就是css定义的类都是全局的，我们虽然可以通过不同的命名空间或是加前缀的方式去避免类的混淆和冲突，但是在写法上却不是那么的干净利落，而且一旦重构css的话，也会造成很大的困扰。

为了让我们能随意的写类名而不需要考虑冲突或是覆盖，**css-modules** 便出现了。

**css-modules**提供了 块作用域 `:local` 和 全局作用域 `:global`，这两个特性就能很好的避免css的命名冲突。

### 怎么使用？

首先来说一下怎么使用 **css-modules**。

当我们在使用[webpack](https://github.com/webpack/webpack)的时候，最简单的用法是通过 [css-loader](https://github.com/webpack-contrib/css-loader) 来开启对 **css-modules** 的支持。如下：

```javascript
{
  test: /\.css$/,
  use: [
    {
      loader: 'css-loader',
      options: {
        modules: true, // 开启对css-modules的支持
        localIdentName: '[name]__[local]___[hash:base64:5]' // 生成的类名的格式
      }
    }
  ]
}
```

同时可以配合[less-loader](https://github.com/webpack-contrib/less-loader) 和 [postcss](https://github.com/postcss/postcss)使用。注意：在结合[less-loader](https://github.com/webpack-contrib/less-loader)的时候可能出现对url的兼容问题。见：https://github.com/webpack-contrib/less-loader/issues/109#issuecomment-253797335 。而且 **less-loader** 的维护者认为结合 **less-loader** 和 **css-modules**没什么必要。。

* [css-loader](https://github.com/webpack-contrib/css-loader) - webpack开启css modules
* [postcss-modules](https://github.com/css-modules/postcss-modules) - postcss的 **css-modules** 插件

### 一、作用域

**css-modules**提供了两个关键字，`:local` 和 `:global`。

比如这种写法：

```less
// App.css
:local(.banner) {
  background: red;
}
:local(.banner .text) {
  color: yellow;
}
.center {
  color: green;
}
:global(.global-class-name) {
  color: blue;
}
```

会编译成：

```css
.App__banner___3NbRo {
  background: red;
}
.App__banner___3NbRo .App__text___2j1Ht {
  color: yellow;
}
.App__center___3eDJo {
  background: green;
}
.global-class-name {
  color: blue;
}
```

`:global` 声明的类不会被编译，会保持不变。

同时，我们在js中引入css，写法如下：

```javascript
/**
 * styles是什么呢？styles其实是一个经过处理过的类名的集合。
 * 
 * 比如上边这个css文件，处理后的style对象是这样的：
 * 
 * {
 *   banner: 'App__banner___3NbRo',
 *   text: 'App__banner___3NbRo App__text___2j1Ht',
 *   center: 'App__center___3eDJo'
 * }
 * 
 * 这样我们就可以理解为什么css-modules可以避免明明冲突了。
 * 命名都按照我们设置的hash规则重写了,保证了类名的唯一，并且在生成的html结构里也进行了替换，还何来冲突？
 */
import styles from './App.css';
import React from 'react';

const html = () => {
  return <div class={styles.banner}>
    <span class={style.text}>HAHAHAHHAHAHA</span>
  </div>;
};

export default html;
```

### 二、Composition - 混合组成

css-modules支持多个类的混合组成。比如：

```css
.colorRed {
  color: red
}

.text {
  composes: colorRed;
  background: #000;
}
```

会编译成：

```css
.App__colorRed___yoG_f {
  color: red
}

.App__text___2j1Ht {
  background: #000;
}
```

可以看到，生成的css中并没有任何的变化，那这个composes做了什么呢？其实在通过js引用的对象内发生了变化。如下：

```json
{
  "colorRed": "App__colorRed___yoG_f",
  "text": "App__text___2j1Ht App__colorRed___yoG_f"
}
```

那么在通过 `styles.text` 使用 `text` 类的时候，其实也同时使用了 `colorRed` 类，达到了混合组成的效果。

### 三、Import - 引用

`css-modules` 支持引用其他文件的类。

比如：

```less
// green.css
.green {
  color: green;
}
```

```less
// text.css
.text {
  background-color: red;
  composes: green from './green.css';
}
```

会编译成：

```css
.green__green___1v20L {
  color: green;
}
.text__text__2jfs0 {
  background-color: red;
}
```

其实跟 `二` 一样，生成的css并没有什么改动，其实改变的是生成js对象的内容：

```js
import styles from './text.css';

// styles = {green: 'green__green___1v20L', text: 'text__text__2jfs0 green__green___1v20L'}
```

## style-components

TODO...
