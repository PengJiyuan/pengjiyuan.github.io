# Blog

No Hexo! No Jekyll! All by myself. Powered by [Mdpack](https://www.github.com/PengJiyuan/mdpack).

## 怎么使用

* 克隆下来源代码
* 将my.json中的信息修改成自己的信息，`links`对象中的字段可以删减。
* `_post`文件夹中放入自己的markdown文件
* `npm i serve -g && npm i && npm run build && npm start`


## 怎么写博客

* 在`_posts`中当前年份文件夹下新建一个markdown文件。
* `npm run dev && npm start`

## markdown格式

在markdown顶部需要手动填写一些文章的基本信息，基本包括这几项：

```markdown
---
title: 一天学会Javascript (做梦)
date: 2018/08/05
author: PengJiyuan
tag: Javascript
intro: 这篇文章主要教大家如何在一天之内学会Javascript.
type: 原创
---
```

## 怎么发布到Github Pages?

直接将整个项目push到github即可。如果仓库名是`<yourusername>.github.io`, 直接推到`master`分支即可，访问卢靖为`<yourusername>.github.io`。

如果仓库名不是`<yourusername>.github.io`，需要推到`gh-pages`分支, 访问路径是`<yourusername>.github.io/repoName`。

## LICENSE

[MIT](./LICENSE) © PengJiyuan
