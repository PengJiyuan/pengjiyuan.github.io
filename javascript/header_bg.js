/*
 * add particles bg
 *
 */

let helper = require('./helper.js');

module.exports = function() {

	let canvas = helper.selectOne("#header_bg"),
		ctx = canvas.getContext("2d"),
		width = document.body.clientWidth,
		height = parseInt(helper.getStyle(helper.selectOne('header')).height),
		points = [],
		distance = 400,
		lineColor = "rgba(255, 255, 255, 0.5)";
		
	canvas.width = width;
	canvas.height = height;

	//随机生成n个坐标信息并储存到数组里备用
	for(let i = 0; i < 10; i++) {
		points.push(getPointData(5));
	}

	//生成随机的坐标信息
	function getPointData(radius) {

		var x = Math.ceil(Math.random()*width),
			y = Math.ceil(Math.random()*height),
			r = +(Math.random()*radius + 8).toFixed(4),
			rateX = +(Math.random()*2-1).toFixed(4),
			rateY = +(Math.random()*2-1).toFixed(4);

		return {
			x: x,//坐标x
			y: y,//坐标y
			r: r,//半径
			rateX: rateX,//X轴方向的位移率
			rateY: rateY//Y轴方向的位移率
		}

	}

	//画点，画完后对坐标进行位移，以供下次重绘使用
	function drawPoints() {
		points.forEach(function(item, i) {
			ctx.beginPath();
			ctx.arc(item.x, item.y, item.r, 0, Math.PI*2, false);
			//圆半径越大，透明度越小，反之亦然
			ctx.fillStyle = "rgba(255, 255, 255, "+ (item.r-8)/4 +")";
			ctx.fill();
			if(item.x > -15 && item.x < (width + 15) && item.y > -15 && item.y < (height + 15)) {
				item.x += item.rateX*0.4;
				item.y += item.rateY*0.4;
			} else {
				points.splice(i, 1);
				points.push(getPointData(5));
			}
		});
	}

	//两点之间距离
	function dis(x1, y1, x2, y2) {
		var disX = Math.abs(x1 - x2),
			disY = Math.abs(y1 - y2);

		return Math.sqrt(disX * disX + disY * disY);
	}

	//判断两点之间距离小于distance，就画线
	function drawLines() {
		//对圆心坐标进行两两判断
		for(let i = 0, len = points.length;i < len;i++) {
			for(let j = len - 1; j >= 0; j--) {
				let x1 = points[i].x,
					y1 = points[i].y,
					x2 = points[j].x,
					y2 = points[j].y,
					disPoint = dis(x1, y1, x2, y2);

				if(disPoint <= distance) {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.strokeStyle = lineColor;
					//两点之间距离越大，线越细，反之亦然
					ctx.lineWidth = 1 - disPoint/distance;
					ctx.stroke();
				}
			}
		}
	}

	//让点动起来
	(function move() {
		//擦除画布，进行重绘
		ctx.clearRect(0, 0, width, height);
		drawPoints();
		drawLines();
		window.requestAnimationFrame(move);
	}());

}