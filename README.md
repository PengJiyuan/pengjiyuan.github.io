# markdown博客
只需markdown文件，全自动自动生成网页,支持自定义插件，自定义配置。[pengjiyuan.github.io](http://pengjiyuan.github.io)
## Usage

* fork本项目， 然后克隆到本地。
`git clone xxxxx...`
* `npm install` 
* `npm run build`
打开index.html即可看到生成的网页。

**写博客**

`npm run dev`    

修改article.md， 自动生成网页。

**本地开发**    

`npm run dev`    

自动编译代码。

### wenfont
如果你需要用svg图标，将svg文件放入`style/svg`文件夹中，`npm run font`即可自动编译。    

使用只需:    
```html
<i class="icon icon_name"></i>
```

> note: name 为svg文件名

### Config

修改config.json文件，可开启或关闭某些功能。    

目前如下：    
```javascript
{
  header_bg: true,  //是否显示header的canvas背景
  catalog: true  //是否生成左侧目录
}
```

### Modules

modules文件加是模块的放置目录，每个模块应有单独的文件夹存放。入口文件`index.js`, 入口样式文件`index.less`。    

在网页总入口文件`index.js`中引入即可用。    

保证了模块的之间的**独立性**，即添即删。

### Scripts

目前提供两个脚本。
```bash
$ npm run eslint // 代码检测，保证代码格式

$ npm run add_eslint // 运行一次即可，以后每次提交代码前，会自动跑eslint
```

### To Do

* 自定义滚动条(原生的太丑)。  **[1]**
* 对自动生成目录做进一步封装，使其更有普适性， 配置更灵活， 结合自定义滚动条。**[1]**
* 支持多文件生成，导航生成。**[2]**

> note: 
>  [1] -- 下一步要做    

>  [2] -- 之后再做    


### About Me

**Name: PengJiyuan**    

**Email: pengjiyuanzz@gmail.com**

