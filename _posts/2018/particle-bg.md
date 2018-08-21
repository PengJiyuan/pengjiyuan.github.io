---
title: 粒子动画背景
date: 2018-08-14 15:52:06
author: PengJiyuan
tag: JavaScript
intro: 教你如何绘制炫酷的粒子背景。
type: 原创
top: true
---

### 效果 :)

不带连线效果：

<div id="particle-demo" style="width: 100%;height: 300px;background: linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);background: -webkit-linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);"></div>
<script src="https://unpkg.com/particle-bg/lib/particle-bg.umd.min.js"></script>
<script>
  particleBg('#particle-demo', {
    line: false
  });
</script>

<br/>带连线的效果：<br/>

<div id="particle-demo2" style="width: 100%;height: 300px;background: linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);background: -webkit-linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);"></div>
<script>
  particleBg('#particle-demo2');
</script>

### 教程

要实现这样的效果其实很简单，大概分为这么几个步骤：

#### 创建canvas

首先需要在需要展示粒子背景的父元素中创建一个`canvas`标签, 指定`width`和`height`, 在我们生成随机点坐标的时候需要用`width`和`height`来做参照。`width`和`height`等于父元素的宽和高。

```javascript
// 假如父元素是body
const ele = document.body;
const canvas = document.createElement('canvas');
canvas.width = ele.clientWidth;
canvas.height = ele.clientHeight;
// 将canvas标签插入
ele.appendChild(canvas);
```

#### 随机生成一定数量的点坐标信息

以`width`和`height`做参照随机生成一定数量的点坐标信息，包含`x`, `y`, `rateX`(点在X轴的移动速率), `rateY`(点在Y轴移动的速率), `rateX`和`rateY`决定了点的运动轨迹。

```javascript
const points = [];
// 随机生成点的坐标，需指定radius的最大值
function getPoint(radius) {
  const x = Math.ceil(Math.random() * this.width), // 粒子的x坐标
    y = Math.ceil(Math.random() * this.height), // 粒子的y坐标
    r = +(Math.random() * this.radius).toFixed(4), // 粒子的半径
    rateX = +(Math.random() * 2 - 1).toFixed(4), // 粒子在x方向运动的速率
    rateY = +(Math.random() * 2 - 1).toFixed(4); // 粒子在y方向运动的速率

  return { x, y, r, rateX, rateY };
}

// 随机生成100个点的坐标信息
for (let i = 0; i < 100; i++) {
  points.push(this.getPoint());
}
```

#### 将生成的点数组画到canvas上

```javascript
function drawPoints() {
  points.forEach((item, i) => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI*2, false);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // 根据rateX和rateY移动点的坐标
    if(item.x > 0 && item.x < width && item.y > 0 && item.y < height) {
      item.x += item.rateX * rate;
      item.y += item.rateY * rate;
    } else {
      // 如果粒子运动超出了边界，将这个粒子去除，同时重新生成一个新点。
      points.splice(i, 1);
      points.push(getPoint(radius));
    }
  });
}
```

#### 画线

遍历点数组，两两比较点坐标，如果两点之间距离小于某个值，在两个点之间画一条直线，`lineWidth`随两点之间距离改变，距离越大，线越细。

```javascript
// 计算两点之间的距离
function dis(x1, y1, x2, y2) {
  var disX = Math.abs(x1 - x2),
    disY = Math.abs(y1 - y2);

  return Math.sqrt(disX * disX + disY * disY);
}

function drawLines() {
  const len = points.length;
  //对圆心坐标进行两两判断
  for(let i = 0; i < len; i++) {
    for(let j = len - 1; j >= 0; j--) {
      const x1 = points[i].x,
        y1 = points[i].y,
        x2 = points[j].x,
        y2 = points[j].y,
        disPoint = dis(x1, y1, x2, y2);

      // 如果两点之间距离小于150，画线
      if(disPoint <= 150) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#fff';
        //两点之间距离越大，线越细，反之亦然
        ctx.lineWidth = 1 - disPoint / distance;
        ctx.stroke();
      }
    }
  }
}
```

#### 动画

使用`requestAnimationFrame`循环调用`draw`方法（draw方法里包含画点和画线），同时在`draw`的时候根据`rateX`和`rateY`来改动点的位置。

```javascript
// 调用draw函数开启动画
(function draw() {
  ctx.clearRect(0, 0, width, height);
  drawPoints();
  // 如果不需要画线，取消下面这行代码即可。
  drawLines();
  window.requestAnimationFrame(draw);
}());
```

##### 本章完
