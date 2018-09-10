---
title: 搭建博客太简单，这次我们来做一个博客生成工具
date: 2018-09-10
author: PengJiyuan
tag: JavaScript,NodeJs
intro: 搭建博客是在是没什么难度，世面上有太多成熟的博客生成工具了，像是Hexo、Jekyll, Hugo等等。这篇文章不仅讲如何搭建一个博客，而且教你怎么写一个博客生成工具！
type: 原创
---

> 文章较长，耐心读下来我想你肯定会有所收获 : )

作为一个技术人员，见到别人那光鲜亮丽的个人博客，心里总免不了想搭建自己博客的冲动。当然，搭建博客的方式有好多种，但是大体上分这两种：

1. **服务端数据库**

  例如：你可以用 **WordPress** 搭建自己的博客，你可以利用 PHP 和 MySQL 数据库在服务器上架设属于自己的网站。
2. **纯静态页面**

  市面上有挺多的免费 **静态文件**（**HTML**）托管机构，当然其中最简单，最方便的可能就是 **Github Pages** 了。纯静态文件构建的网站有很多的优点，
  比如静态网页的访问速度比较快、容易被搜索引擎检索等。

当然，仅仅用作博客的话，纯静态页面足够使用了。评论系统的话可以用第三方的插件，比如 [Disqus](https://disqus.com/)。

## Github Pages

**Github Pages** 是Github提供的一个静态文件托管系统，配合Github仓库，使用起来特别方便。如果你不会使用的话，请看[这里](https://pages.github.com/)。

而且，Github Pages 集成了 [Jekyll](https://jekyllrb.com/)，可以自动帮你把 `markdown` 语法编译成漂亮的 `html` 页面。

市面上有很多的博客生成工具，可以跟 **Github pages** 很好的结合，像是 [Hexo](https://github.com/hexojs/hexo)。其实本质上很简单，Hexo就是帮你把 `markdown` 编译成了 `html`,
并且帮你生成了完善的目录和路由。

## 手把手教你写一个博客生成工具出来

> 通过一篇文章很难把整个工具描述的一清二楚，所以先放源代码在这里。[源代码](https://github.com/PengJiyuan/bloger)

我们得知了博客生成的本质，那么动手做出一个博客生成工具也就没有那么大的难度了。我们先来梳理一下博客生成工具需要有哪些最基本的功能：

1. **`markdown` 编译成 `html`**

  我们写博客，如果自己去写html的话，那怕会被累死。。 **Markdown** 语法帮我们解决了这个问题，如果你对markdown不了解的话，可以看[这里](https://www.jianshu.com/p/191d1e21f7ed)。

2. **生成目录结构**

我们想一下，确实，一个博客的话最基本的就两个部分：目录和博客内容。我们模仿[Hexo](https://github.com/hexojs/hexo)的命令，设计如下：

> 我们把工具命名为 **Bloger**。

```bash
bloger init blog # 初始化一个名为blog的博客项目

bloger new hello-world # 创建一篇名为 hello-word 的博客

bloger build # 编译博客网站

bloger dev # 监听 markdown 文件，实时编译博客网站

bloger serve # 本地起服务
```

按照以上的设计，我们开始写工具：

### 一、目录设计

我们需要为我们 **生成的博客项目** 设计一个合理的文件目录。如下：

```
blog
  ├── my.json (网站的基本配置)
  ├── index.html (首页)
  ├── node_modules
  ├── package.json
  ├── _posts (博客 markdown 源文件)
  │   └── 2018
  │       ├── test.md
  │       └── hello-world.md
  ├── blog (_posts 中 markdown 生成的 html 文件)
  │   └── 2018
  │       ├── test
  │       │   └──index.html (这样设计的话，我们就可以通过访问 https://xxx.com/blog/2018/test/ 来访问这篇博客了)
  │       └── hello-world
  │           └──index.html
  └── static (博客 markdown 源文件)
      ├── css (网站的css存放的文件)
      ├── iconfonts (网站的 iconfonts 存放的文件夹)
      ├── images (网站的图片存放的文件夹)
      └── less (存放于这儿的 less 文件，会在 dev 的时候被编译到 css 文件夹中，生成同名的 css 文件)
```

下面是我们写的工具的源码结构：

```
bloger
  ├── bin
  │   └── cli.js
  ├── lib
  │   ├── less (博客的样式文件)
  │   ├── pages (博客的ejs模版)
  │   ├── tasks (编译网站的脚本)
  │   └── gulpfile.js
  └── tpl (生成的博客模版，结构见上方)
```

### 二、markdown编译成html

markdown编译成html，有许多成熟的库，这里我们选用 [mdpack](https://github.com/PengJiyuan/mdpack)。这个项目其实是在[marked](https://github.com/markedjs/marked)上的一层封装。
**mdpack** 支持模版定制，支持多markdown拼接。

## 三、文章信息配置

一篇文章有很多的信息需要我们配置，比如 **标题**、**标签**、**发布日期** 等等，**Hexo** 和 **Jekyll** 通常有一个规范是这样的，在markdown文件的顶部放置文章的配置，
front-matter 格式如下：

```md
 ---
 title: Hello world
 date: 2018-09-10
 tag: JavaScript,NodeJs
 info: 这篇文章简单介绍了写一个博客生成工具.
 ---
```

我们需要写个脚本将这些信息提取，并且转换成一个json对象，比如上边的信息，我们要转换成这样：

```json
{
  "title": "Hello world",
  "date": "2018-09-10",
  "tag": "JavaScript,NodeJs",
  "info": "这篇文章简单介绍了写一个博客生成工具."
}
```

脚本如下：

```js
// task/metadata.js
const frontMatter = require('@egoist/front-matter'); // 截取头部front-matter信息
const fs = require('fs');
const path = require('path');
const root = process.cwd();

const metadata = {
  post: []
};

// 把提取出来的front-matter字符串解析，生成对象
function getMetadata(content) {
  const head = frontMatter(content).head.split('\n');
  const ret = {};
  head.forEach((h) => {
    const [key, value] = h.split(': ');
    ret[key.trim()] = value.trim();
  });

  if (!ret.type) {
    ret.type = '原创';
  }

  return ret;
}

try {
  // 便利 _posts 文件夹，将所有的markdown内容的front-matter转换成对象，存放到metadata数组中
  // 将生成的metadata信息写入一个文件中，我们命名为postMap.json，保存到所生成项目的根目录，以备使用
  fs.readdirSync(path.resolve(root, '_posts'))
  .filter(m => fs.statSync(path.resolve(root, '_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(root, '_posts', year))
      .forEach((post) => {
        const content = fs.readFileSync(path.resolve(root, '_posts', year, post), 'utf8');
        metadata.post.push({
          year,
          filename: post.split('.md')[0],
          metadata: getMetadata(content)
        });
      });
  });

  fs.writeFileSync(path.resolve(root, 'postMap.json'), JSON.stringify(metadata), 'utf8');
} catch (err) {}

module.exports = metadata;
```

### 四、博客目录生成

通过读取`postMap.json`中的metadata信息，我们可以构建一个博客目录出来。代码如下：

```js
const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
// 首页的ejs模版
const homeTpl = fs.readFileSync(path.resolve(__dirname, '../pages/home.ejs'), 'utf8');
const root = process.cwd();

function buildHomeHtml() {
  const metadata = require('./metadata');
  // 博客网站的基本配置
  const myInfo = require(path.resolve(root, 'my.json'));
  const htmlMenu = require('./menu')(); // 菜单生成，这里不讲

  // 讲postMap.json中的metadata遍历，然后生成一个blogList数组
  const blogList = metadata.post.map((postInfo) => {
    const data = postInfo.metadata;

    return {
      title: data.title,
      date: data.date,
      url: `/blog/${postInfo.year}/${postInfo.filename}`,
      intro: data.intro,
      tags: data.tag.split(','),
      author: data.author,
      type: data.type,
      top: data.top === 'true' ? true : false
    };
  });

  // 默认按发布时间排序
  blogList.sort((a, b) => new Date(a.date) - new Date(b.date));

  // 置顶
  blogList.sort((a, b) => !a.top);

  // ejs替换
  fs.outputFile(
    path.resolve(root, 'index.html'),
    ejs.render(homeTpl, {
      name: myInfo.name,
      intro: myInfo.intro,
      homepage: myInfo.homepage,
      links: myInfo.links,
      blogList,
      htmlMenu
    }),
    (err) => {
      console.log('\nUpadate home html success!\n');
    }
  );
}

module.exports = buildHomeHtml;
```

### 五、集成gulp

在编译博客的过程中，一些操作利用 **[gulp](https://github.com/gulpjs/gulp)** 会简单快捷许多。比如 **编译less**、**打包iconfonts**、**监听文件改动** 等。
但是gulp是一个命令行工具，我们怎么样能把gulp继承到我们的工具中呢？方法很简单，如下：

```javascript
const gulp = require('gulp');
require('./gulpfile.js');

// 启动gulpfile中的build任务
if(gulp.tasks.build) {
  gulp.start('build');
}
```

通过以上的方法，我们可以在我们的cli工具中集成 **gulp**，那么好多问题就变得特别简单，贴上完整的 `gulpfile`:

```js
const fs = require('fs');
const path = require('path');
const url = require('url');
const del = require('del');
const gulp = require('gulp');
const log = require('fancy-log');
const less = require('gulp-less');
const minifyCSS = require('gulp-csso');
const autoprefixer = require('gulp-autoprefixer');
const plumber = require('gulp-plumber');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');
const mdpack = require('mdpack');
const buildHome = require('./tasks/home');
const root = process.cwd();

// 编译博客文章页面
function build() {
  const metadata = require(path.resolve(root, 'postMap.json'));
  const myInfo = require(path.resolve(root, 'my.json'));
  const htmlMenu = require('./tasks/menu')(); // 跳过
  // 删除博客文件夹
  del.sync(path.resolve(root, 'blog'));
  
  // 遍历_posts文件夹，编译所有的markdown文件
  // 生成的格式为 blog/${year}/${filename}/index.html
  fs.readdirSync(path.resolve(root, '_posts'))
  .filter(m => fs.statSync(path.resolve(root, '_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(root, '_posts', year))
      .forEach((post) => {
        const filename = post.split('.md')[0];
        const _meta = metadata.post.find(_m => _m.filename === filename).metadata;
        const currentUrl = url.resolve(myInfo.homepage, `blog/${year}/${filename}`);
        const mdConfig = {
          entry: path.resolve(root, '_posts', year, post),
          output: {
            path: path.resolve(root, 'blog', year, filename),
            name: 'index'
          },
          format: ['html'],
          plugins: [
            // 去除markdown文件头部的front-matter
            new mdpack.plugins.mdpackPluginRemoveHead()
          ],
          template: path.join(__dirname, 'pages/blog.ejs'),
          resources: {
            markdownCss: '/static/css/markdown.css',
            highlightCss: '/static/css/highlight.css',
            title: _meta.title,
            author: _meta.author,
            type: _meta.type,
            intro: _meta.intro,
            tag: _meta.tag,
            keywords: _meta.keywords,
            homepage: myInfo.homepage,
            name: myInfo.name,
            disqusUrl: myInfo.disqus ? myInfo.disqus.src : false,
            currentUrl,
            htmlMenu
          }
        };
        mdpack(mdConfig);
      });
  });
}

// 编译css
gulp.task('css', () => {
  log('Compile less.');
  // 我们编译当前项目下的 lib/less/*.less 和 生成的博客项目下的 static/less/**/*.less
  return gulp.src([path.resolve(__dirname, 'less/*.less'), path.resolve(root, 'static/less/**/*.less')])
    .pipe(plumber())
    .pipe(less({
      paths: [root]
    }))
    // css压缩
    .pipe(minifyCSS())
    // 自动加前缀
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    // 将编译生成的css放入生成的博客项目下的 static/css 文件夹中
    .pipe(gulp.dest(path.resolve(root, 'static/css')));
});

// 监听css文件的改动，编译css
gulp.task('cssDev', () => {
  log('Starting watch less files...');
  return gulp.watch([path.resolve(__dirname, 'less/**/*.less'), path.resolve(root, 'static/less/**/*.less')], ['css']);
});

// 监听markdown文件的改动，编译首页和博客文章页
gulp.task('mdDev', () => {
  log('Starting watch markdown files...');
  return gulp.watch(path.resolve(root, '_posts/**/*.md'), ['home', 'blog']);
});

// 编译首页
gulp.task('home', buildHome);

// build博客
gulp.task('blog', build);

gulp.task('default', ['build']);

// 监听模式
gulp.task('dev', ['cssDev', 'mdDev']);

// 执行build的时候会编译css，编译首页，编译文章页
gulp.task('build', ['css', 'home', 'blog']);

// 生成iconfonts
gulp.task('fonts', () => {
  console.log('Task: [Generate icon fonts and stylesheets and preview html]');
  return gulp.src([path.resolve(root, 'static/iconfonts/svgs/**/*.svg')])
    .pipe(iconfontCss({
      fontName: 'icons',
      path: 'css',
      targetPath: 'icons.css',
      cacheBuster: Math.random()
    }))
    .pipe(iconfont({
      fontName: 'icons',
      prependUnicode: true,
      fontHeight: 1000,
      normalize: true
    }))
    .pipe(gulp.dest(path.resolve(root, 'static/iconfonts/icons')));
});
```

### 六、cli文件

我们已经把gulpfile写完了，下面就要写我们的命令行工具了，并且集成gulp。代码如下：

```js
// cli.js
#!/usr/bin/env node

const gulp = require('gulp');
const program = require('commander'); // 命令行参数解析
const fs = require('fs-extra');
const path = require('path');
const spawn = require('cross-spawn');
const chalk = require('chalk');
const dateTime = require('date-time');
require('../lib/gulpfile');
const { version } = require('../package.json');
const root = process.cwd();

// 判断是否是所生成博客项目的根目录（因为我们必须进入到所生成的博客项目中，才可以执行我们的build和dev等命令）
const isRoot = fs.existsSync(path.resolve(root, '_posts'));
// 如果不是根目录的话，输出的内容
const notRootError = chalk.red('\nError: You should in the root path of blog project!\n');

// 参数解析，正如我们上面所设计的命令用法，我们实现了以下几个命令
// bloger init [blogName]
// bloger new [blog]
// bloger build
// bloger dev
// bloger iconfonts
program
  .version(version)
  .option('init [blogName]', 'init blog project')
  .option('new [blog]', 'Create a new blog')
  .option('build', 'Build blog')
  .option('dev', 'Writing blog, watch mode.')
  .option('iconfonts', 'Generate iconfonts.')
  .parse(process.argv);

// 如果使用 bloger init 命令的话，执行以下操作
if (program.init) {
  const projectName = typeof program.init === 'string' ? program.init : 'blog';
  const tplPath = path.resolve(__dirname, '../tpl');
  const projectPath = path.resolve(root, projectName);
  // 将我们的项目模版复制到当前目录下
  fs.copy(tplPath, projectPath)
    .then((err) => {
      if (err) throw err;
      console.log('\nInit project success!');
      console.log('\nInstall npm packages...\n');
      fs.ensureDirSync(projectPath); // 确保存在项目目录
      process.chdir(projectPath); // 进入到我们生成的博客项目，然后执行 npm install 操作
      const commond = 'npm';
      const args = [
        'install'
      ];
      
      // npm install
      spawn(commond, args, { stdio: 'inherit' }).on('close', code => {
        if (code !== 0) {
          process.exit(1);
        }
        // npm install 之后执行 npm run build，构建博客项目
        spawn('npm', ['run', 'build'], { stdio: 'inherit' }).on('close', code => {
          if (code !== 0) {
            process.exit(1);
          }
          // 构建成功之后输出成功信息
          console.log(chalk.cyan('\nProject created!\n'));
          console.log(`${chalk.cyan('You can')} ${chalk.grey(`cd ${projectName} && npm start`)} ${chalk.cyan('to serve blog website.')}\n`);
        });
      });
    });
}

// bloger build 执行的操作
if (program.build && gulp.tasks.build) {
  if (isRoot) {
    gulp.start('build');
  } else {
    console.log(notRootError);
  }
}

// bloger dev执行的操作
if (program.dev && gulp.tasks.dev) {
  if (isRoot) {
    gulp.start('dev');
  } else {
    console.log(notRootError);
  }
}

// bloger new 执行的操作
if (program.new && typeof program.new === 'string') {
  if (isRoot) {
    const postRoot = path.resolve(root, '_posts');
    const date = new Date();
    const thisYear = date.getFullYear().toString();
    // 在_posts文件夹中生成一个markdown文件，内容是下边的字符串模版
    const template = `---\ntitle: ${program.new}\ndate: ${dateTime()}\nauthor: 作者\ntag: 标签\nintro: 简短的介绍这篇文章.\ntype: 原创\n---\n\nBlog Content`;
    fs.ensureDirSync(path.resolve(postRoot, thisYear));
    const allList = fs.readdirSync(path.resolve(postRoot, thisYear)).map(name => name.split('.md')[0]);
    // name exist
    if (~allList.indexOf(program.new)) {
      console.log(chalk.red(`\nFile ${program.new}.md already exist!\n`));
      process.exit(2);
    }
    fs.outputFile(path.resolve(postRoot, thisYear, `${program.new}.md`), template, 'utf8', (err) => {
      if (err) throw err;
      console.log(chalk.green(`\nCreate new blog ${chalk.cyan(`${program.new}.md`)} done!\n`));
    });
  } else {
    console.log(notRootError);
  }
}

// bloger iconfonts执行的操作
if (program.iconfonts && gulp.tasks.fonts) {
  if (isRoot) {
    gulp.start('fonts');
  } else {
    console.log(notRootError);
  }
}
```

> 完整的项目源代码：https://github.com/PengJiyuan/bloger
>
> 相关阅读：[手把手教你写一个命令行工具](/blog/2018/how-to-write-cli-tool)

**本章完**
