---
title: Javascript备忘记录
date: 2018-08-13 15:20:16
author: PengJiyuan
tag: JavaScript,笔记
intro: 记录一些Javascript上小技巧和备忘.
type: 原创
---

## @装饰符

有时候会看到这样的写法，比如react-router的connect函数，本身是一个HOC，用于包裹组件，如下：

```js
class A extends React.Component {
  ...
}

export default connect({...})(A);
```

那么要是用上@装饰符就可以这么来写：

```js
@connect({...});
export default class A extends React.Component {
  ...
}
```

记住`@`必须在class前。

其实`@`就是一个语法糖而已，需要配合babel的`babel-plugin-transform-decorators-legacy`插件使用：

```json
{
  "plugins":[
    "transform-decorators-legacy"
  ]
}
```

如果你用的是vscode, 可以在项目根目录下添加jsconfig.json文件来消除代码警告：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Position

#### Fixed

如果`position: fixed`元素的祖先元素有`transform`, `perspective`, `filter`属性，那么`fixed`失效。

FYI: [https://developer.mozilla.org/en-US/docs/Web/CSS/position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

The element is removed from the normal document flow, and no space is created for the element in the page layout. It is positioned relative to the initial containing block established by the viewport, except when one of its ancestors has a `transform`, `perspective`, or `filter` property set to something other than none (see the CSS Transforms Spec), in which case that ancestor behaves as the containing block. (Note that there are browser inconsistencies with `perspective` and `filter` contributing to containing block formation.) Its final position is determined by the values of `top`, `right`, `bottom`, and `left`.
This value always creates a new stacking context. In printed documents, the element is placed in the same position on every page.

#### sticky

The element is positioned according to the normal flow of the document, and then offset relative to its nearest scrolling ancestor and containing block (nearest block-level ancestor), including table-related elements, based on the values of `top`, `right`, `bottom`, and `left`. The offset does not affect the position of any other elements.
This value always creates a new stacking context. Note that a sticky element "sticks" to its nearest ancestor that has a "scrolling mechanism" (created when `overflow` is `hidden`, `scroll`, `auto`, or `overlay`), even if that ancestor isn't the nearest actually scrolling ancestor. This effectively inhibits any "sticky" behavior
