## 包和类库

### [omg.js](https://github.com/PengJiyuan/omg)

🎨 **一个让你跳过canvas，直接绘图的 2d 绘图库，上手简单，接口简洁，功能丰富.**

### [emitry](https://github.com/PengJiyuan/emitry)

**一个只有60行不到的eventemitter.**

### [particle-bg](https://github.com/PengJiyuan/particle-bg)

**一行代码生成粒子背景**

### [fakeme](https://github.com/PengJiyuan/fakeme)

**随机生成人名，邮箱，性别，id等信息，支持中英文**

## Cli 工具

### [Bloger](https://github.com/PengJiyuan/bloger)

☕️ **Bloger是一个博客生成工具。**

该博客就是使用Bloger生成的。 为什么在已经有了`Hexo`, `Jekyll`的情况下再造个轮子？
其实也没什么，主要是全自定义，灵活性比较强。**不造轮子的前端不是一个好厨师**。
当然，Bloger具有博客生成工具的所有需要的功能，（目前还不能换主题如有需要也比较容易加），包括`init`, `build`, `dev`, `new` 等，添加自定义页面也非常容易，有比较强的扩展性。

### [Relix](https://github.com/PengJiyuan/relix)

☀️ **Relix是一个全自动的NPM包发布工具。**

Relix主要为了解决繁琐的NPM发布流程，并且更准确规范的生成新版本号。 Relix可以帮你做以下的事情：

* 根据 `SemVer` 规范自动生成新版本号.

  你不用浪费时间去手动确认版本号，Relix会根据你想要的发布类型自动确认版本号，`MAJOR.MINOR.PATCH.BETA`， 全自动化！

* 根据 新版本的类型 自动生成Commit message.

  比如, 当你使用 `relix --patch`, 会生成这样一个提交信息 `Bump version x.x.x`.

  当你使用 `relix --prerelease alpha`, 会生成这样一个提交信息 `Prerelease alpha version x.x.x-alpha.0`.

  听起来不错对不对！

* 推送提交到远程Github，并且根据新版本号打个tag，然后把这个tag推送到远程Github。

* 最后，Relix会帮你把完全标准化的一个包发布到 NPM 上!

### [Uslint](https://github.com/PengJiyuan/uslint)

👍 **Uslint是一个集成了`eslint`, `jsonlint`, `stylelint`与一体的命令行工具。**

当我新建一个项目的时候，经常需要去配置繁琐的eslint规则，安装很多的eslint插件和config, 去配置一个`.eslintrc`文件。

当然，为了规范，我们还需要配置stylelint, 也需要安装stylelint插件和config。当然jsonlint也非常重要！

Uslint就是为了跳过这么多繁琐的过程，只需要下载一个uslint，就可以完全零配置的使用以上所有的东西，不需要任何插件（插件都已内部集成）

### [Quick-init](https://github.com/PengJiyuan/quick-init)

⚡️ **quick-init 是一个一键生成项目的工具，跟`create-react-app`一致。**

不同与`create-react-app`的只能生成react项目, `quick-init`设计的意图更偏向于多模版，可以无限进行拓展。

在使用`quick-init`的时候，会让你选择生成模版的类型, `react`? `vue`? `cli`? `官网`?

只要有需求的新模版，可以随时进行添加。

### [xbundle](https://github.com/PengJiyuan/xbundle)

**xbundle是一个零配置的webpack打包器。**

这个项目是在webpack上做的一层封装，所以你既可以享受webpack带来的便捷，又不需要处理webpack复杂的配置。从此告别webpack复杂的配置，一键打包。

### [mdpack](https://github.com/PengJiyuan/mdpack)

**mdpack是一个markdown编译工具。**

mdpack的使用方式模仿webpack，让markdown支持`import`语法，并且支持插件。上边介绍的[Bloger](https://github.com/PengJiyuan/bloger)就在底层依赖了mdpack.
