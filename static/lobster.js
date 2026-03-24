/**
 * Wandering mascot lobster for homepage.
 */
(function() {
  const SIZE = 180;
  const MOVE_SPEED = 1.28;
  const BOB_AMP = 4;
  const WOBBLE_AMP = 6;
  const BLINK_INTERVAL = 2200;
  const BLINK_DURATION = 160;
  const W = SIZE, H = SIZE;

  // 添加光点容器
  const foodContainer = document.createElement('div');
  foodContainer.id = 'lobster-food-container';
  Object.assign(foodContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0'
  });
  document.body.appendChild(foodContainer);

  const container = document.createElement('div');
  container.id = 'wandering-lobster';
  Object.assign(container.style, {
    position: 'fixed',
    zIndex: '0',
    pointerEvents: 'none',
    opacity: '0.98',
    willChange: 'left, top, transform',
    filter: 'drop-shadow(0 12px 28px rgba(255, 88, 60, 0.24))',
    transformOrigin: 'center bottom',
  });

  const svg = `
  <!-- 将 SVG 画布和内部内容居中放大，避免被裁剪 -->
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 188 188" width="180" height="180">
    <defs>
      <linearGradient id="lobsterRed" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff7d68"/>
        <stop offset="50%" stop-color="#ff4f43"/>
        <stop offset="100%" stop-color="#e3342f"/>
      </linearGradient>
      <linearGradient id="lobsterRedDark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff5b4e"/>
        <stop offset="100%" stop-color="#d72626"/>
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#ff8a5b" flood-opacity="0.2"/>
      </filter>
    </defs>

    <g filter="url(#softGlow)">
      <path d="M65 34 C60 20, 52 12, 44 8" stroke="#f87171" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      <path d="M83 34 C88 20, 96 12, 104 8" stroke="#f87171" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      <circle cx="43" cy="8" r="2.6" fill="#ffd6df"/>
      <circle cx="105" cy="8" r="2.6" fill="#ffd6df"/>

      <!-- 左臂关节结构 -->
      <!-- 肩到肘 -->
      <path d="M44 68 C35 55, 30 40, 24 32" stroke="url(#lobsterRedDark)" stroke-width="12" stroke-linecap="round" fill="none"/>
      <!-- 肘关节球 -->
      <circle cx="24" cy="32" r="8" fill="#e3342f"/>
      <circle cx="24" cy="32" r="4" fill="#ff7d68"/>
      <!-- 肘到腕 -->
      <path d="M24 32 C20 25, 18 20, 16 12" stroke="url(#lobsterRedDark)" stroke-width="10" stroke-linecap="round" fill="none"/>

      <!-- 右臂关节结构 -->
      <path d="M104 68 C113 55, 118 40, 124 32" stroke="url(#lobsterRedDark)" stroke-width="12" stroke-linecap="round" fill="none"/>
      <circle cx="124" cy="32" r="8" fill="#e3342f"/>
      <circle cx="124" cy="32" r="4" fill="#ff7d68"/>
      <path d="M124 32 C128 25, 130 20, 132 12" stroke="url(#lobsterRedDark)" stroke-width="10" stroke-linecap="round" fill="none"/>

      <!-- 左大钳子 -->
      <g id="left-claw" transform="translate(-1 2) rotate(-15 22 28)">
        <!-- 腕关节球 -->
        <circle cx="20" cy="30" r="10" fill="#d72626"/>

        <!-- 外侧夹片 -->
        <g id="left-pincer-outer" transform="translate(0 0)">
          <!-- 外壳主体 -->
          <path d="M20 36 C-2 36, -6 16, 2 6 C8 -4, 22 -6, 28 4 C32 10, 36 28, 20 36 Z" fill="url(#lobsterRed)"/>
          <!-- 高光 -->
          <path d="M20 32 C4 32, 2 18, 6 10 C10 4, 20 2, 24 8 C27 12, 30 26, 20 32 Z" fill="#ffb8a6" opacity="0.5"/>
        </g>

        <!-- 内侧夹片（可活动） -->
        <g id="left-pincer-inner" transform="translate(0 0) rotate(15 22 30)">
          <!-- 主体变大，和外侧对称 -->
          <path d="M20 36 C42 36, 46 16, 38 6 C32 -4, 18 -6, 12 4 C8 10, 4 28, 20 36 Z" fill="url(#lobsterRed)"/>
          <!-- 阴影增加立体感 -->
          <path d="M20 36 C42 36, 46 16, 38 6 C32 -4, 18 -6, 12 4 C8 10, 4 28, 20 36 Z" fill="#7f1d1d" opacity="0.15"/>
          <path d="M20 32 C36 32, 38 18, 34 10 C30 4, 20 2, 16 8 C13 12, 10 26, 20 32 Z" fill="#ffffff" opacity="0.8"/>
        </g>
      </g>

      <!-- 右大钳子 -->
      <g id="right-claw" transform="translate(149 2) scale(-1 1) rotate(-15 22 28)">
        <circle cx="20" cy="30" r="10" fill="#d72626"/>

        <g id="right-pincer-outer" transform="translate(0 0)">
          <path d="M20 36 C-2 36, -6 16, 2 6 C8 -4, 22 -6, 28 4 C32 10, 36 28, 20 36 Z" fill="url(#lobsterRed)"/>
          <path d="M20 32 C4 32, 2 18, 6 10 C10 4, 20 2, 24 8 C27 12, 30 26, 20 32 Z" fill="#ffb8a6" opacity="0.5"/>
        </g>

        <g id="right-pincer-inner" transform="translate(0 0) rotate(15 22 30)">
          <path d="M20 36 C42 36, 46 16, 38 6 C32 -4, 18 -6, 12 4 C8 10, 4 28, 20 36 Z" fill="url(#lobsterRed)"/>
          <path d="M20 36 C42 36, 46 16, 38 6 C32 -4, 18 -6, 12 4 C8 10, 4 28, 20 36 Z" fill="#7f1d1d" opacity="0.15"/>
          <path d="M20 32 C36 32, 38 18, 34 10 C30 4, 20 2, 16 8 C13 12, 10 26, 20 32 Z" fill="#ffffff" opacity="0.8"/>
        </g>
      </g>

      <circle cx="74" cy="53" r="34" fill="url(#lobsterRed)"/>
      <ellipse cx="74" cy="47" rx="24" ry="16" fill="#ff8a77" opacity="0.4"/>

      <g id="eyes-open">
        <ellipse cx="60" cy="46" rx="12" ry="14" fill="#ffffff"/>
        <ellipse cx="88" cy="46" rx="12" ry="14" fill="#ffffff"/>
        <circle cx="63" cy="49" r="7" fill="#111827"/>
        <circle cx="85" cy="49" r="7" fill="#111827"/>
        <circle cx="65.5" cy="45.8" r="2.1" fill="#ffffff"/>
        <circle cx="87.5" cy="45.8" r="2.1" fill="#ffffff"/>
      </g>

      <g id="eyes-closed" opacity="0">
        <path d="M49 48 Q60 42 71 48" stroke="#7f1d1d" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M77 48 Q88 42 99 48" stroke="#7f1d1d" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>

      <path d="M54 62 Q74 80 94 62" stroke="#7a0f12" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M58 63 Q74 73 90 63" stroke="#fff7f4" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="103" cy="61" r="5.8" fill="#ff8ea0" opacity="0.42"/>

      <ellipse cx="74" cy="96" rx="23" ry="27" fill="url(#lobsterRedDark)"/>
      <ellipse cx="74" cy="90" rx="16" ry="10" fill="#ff8d78" opacity="0.38"/>
      <path d="M57 104 Q74 112 91 104" stroke="#d62020" stroke-width="3.2" fill="none" opacity="0.5"/>

      <path d="M56 74 C46 80, 34 85, 28 92" stroke="url(#lobsterRedDark)" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      <path d="M92 74 C102 80, 114 85, 120 92" stroke="url(#lobsterRedDark)" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      <path d="M53 83 C42 88, 33 96, 28 104" stroke="url(#lobsterRedDark)" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <path d="M95 83 C106 88, 115 96, 120 104" stroke="url(#lobsterRedDark)" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <path d="M54 92 C46 96, 40 104, 38 113" stroke="url(#lobsterRedDark)" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M94 92 C102 96, 108 104, 110 113" stroke="url(#lobsterRedDark)" stroke-width="5" stroke-linecap="round" fill="none"/>

      <path d="M66 119 C62 112, 58 110, 53 110 C49 110, 46 113, 46 117 C46 122, 51 124, 57 124 C61 124, 64 123, 66 119 Z" fill="url(#lobsterRedDark)"/>
      <path d="M82 119 C86 112, 90 110, 95 110 C99 110, 102 113, 102 117 C102 122, 97 124, 91 124 C87 124, 84 123, 82 119 Z" fill="url(#lobsterRedDark)"/>
      <path d="M66 119 Q60 123 53 123" stroke="#ff9b8f" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.55"/>
      <path d="M82 119 Q88 123 95 123" stroke="#ff9b8f" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.55"/>
    </g>
  </svg>`;

  container.innerHTML = svg;
  document.body.appendChild(container);

  const eyesOpen = container.querySelector('#eyes-open');
  const eyesClosed = container.querySelector('#eyes-closed');
  const leftClawInner = container.querySelector('#left-pincer-inner');
  const rightClawInner = container.querySelector('#right-pincer-inner');

  let x = Math.random() * (window.innerWidth - W);
  let y = Math.random() * Math.max(120, window.innerHeight - H - 80) + 40;
  let vx = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED;
  let vy = (Math.random() - 0.5) * 0.32;
  let facingLeft = vx < 0;
  let isMoving = true;
  let walkCycle = 0;
  let pauseTimer = 0;
  let nextBlinkAt = performance.now() + 800 + Math.random() * BLINK_INTERVAL;
  let blinkUntil = 0;

  // 光点（食物）状态
  let currentFood = null;
  let foodSpawnTimer = 0;
  let eatingAnimUntil = 0;

  function clearFood(food) {
    if (!food) return;
    food.el.style.opacity = '0';
    setTimeout(() => {
      if (food.el.parentNode) {
        food.el.parentNode.removeChild(food.el);
      }
    }, 300);
    if (currentFood === food) {
      currentFood = null;
    }
  }

  function spawnFood() {
    if (currentFood) return;

    const margin = 64;
    const maxX = Math.max(margin, window.innerWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - margin);
    const fx = Math.random() * (maxX - margin) + margin;
    const fy = Math.random() * (maxY - margin) + margin;

    const foodEl = document.createElement('div');
    Object.assign(foodEl.style, {
      position: 'absolute',
      left: fx + 'px',
      top: fy + 'px',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: '#fbbf24',
      boxShadow: '0 0 12px 4px rgba(251, 191, 36, 0.6), 0 0 4px 2px #fff',
      transform: 'translate(-50%, -50%)',
      transition: 'opacity 0.3s',
      opacity: '0'
    });

    foodContainer.appendChild(foodEl);
    requestAnimationFrame(() => {
      foodEl.style.opacity = '1';
    });

    currentFood = { x: fx, y: fy, el: foodEl, spawnedAt: performance.now() };
  }

  function loop(ts) {
    update(ts);
    render(ts);
    requestAnimationFrame(loop);
  }

  function update(ts) {
    // 处理进食动画
    if (ts < eatingAnimUntil) {
      isMoving = false;
      walkCycle += 0.25; // 兴奋地快速舞动钳子
      return;
    }

    // 处理光点生成
    if (!currentFood) {
      if (ts > foodSpawnTimer) {
        if (Math.random() < 0.02) { // 每帧一定概率生成
          spawnFood();
        }
      }
    } else {
      const lobsterCx = x + W / 2;
      const lobsterCy = y + H / 2;
      const dx = currentFood.x - lobsterCx;
      const dy = currentFood.y - lobsterCy;
      const dist = Math.hypot(dx, dy);
      const foodAge = ts - currentFood.spawnedAt;

      if (dist < 56) {
        const eatenFood = currentFood;
        clearFood(eatenFood);
        eatingAnimUntil = ts + 1500;
        foodSpawnTimer = ts + 3000 + Math.random() * 5000;
      } else if (foodAge > 12000) {
        clearFood(currentFood);
        foodSpawnTimer = ts + 1500 + Math.random() * 2500;
      } else {
        isMoving = true;
        const speed = MOVE_SPEED * 1.5;
        vx = (dx / Math.max(dist, 1)) * speed;
        vy = (dy / Math.max(dist, 1)) * speed;
      }
    }

    if (isMoving && !currentFood && Math.random() < 0.005) {
      isMoving = false;
      pauseTimer = 80 + Math.random() * 90;
    }

    if (!isMoving) {
      pauseTimer -= 1;
      if (pauseTimer <= 0) {
        isMoving = true;
        const angle = (Math.random() - 0.5) * Math.PI * 0.9;
        vx = Math.cos(angle) * (facingLeft ? -MOVE_SPEED : MOVE_SPEED);
        vy = Math.sin(angle) * 0.36;
      }
    }

    if (isMoving && !currentFood && Math.random() < 0.012) {
      vx += (Math.random() - 0.5) * 0.35;
      vy += (Math.random() - 0.5) * 0.07;
      vx = Math.max(-MOVE_SPEED * 1.3, Math.min(MOVE_SPEED * 1.3, vx));
      vy = Math.max(-0.42, Math.min(0.42, vy));
    }

    if (isMoving) {
      x += vx;
      y += vy;
      walkCycle += 0.12;
    } else {
      walkCycle += 0.04;
      vy *= 0.92;
    }

    if (x <= 0) {
      x = 0;
      vx = Math.abs(vx);
      facingLeft = false;
    } else if (x >= window.innerWidth - W) {
      x = window.innerWidth - W;
      vx = -Math.abs(vx);
      facingLeft = true;
    }

    if (y <= 16) {
      y = 16;
      vy = Math.abs(vy);
    } else if (y >= window.innerHeight - H - 16) {
      y = window.innerHeight - H - 16;
      vy = -Math.abs(vy);
    }

    if (vx < -0.05) facingLeft = true;
    if (vx > 0.05) facingLeft = false;

    if (ts >= nextBlinkAt) {
      blinkUntil = ts + BLINK_DURATION;
      nextBlinkAt = ts + BLINK_INTERVAL + Math.random() * 1800;
    }
  }

  function render(ts) {
    const bob = Math.sin(walkCycle) * BOB_AMP;
    const wobble = Math.sin(walkCycle * 0.8) * WOBBLE_AMP;
    const blink = ts < blinkUntil;

    // 庆祝进食的特殊动画
    let clawOpen = 0;
    if (ts < eatingAnimUntil) {
      clawOpen = Math.abs(Math.sin(walkCycle * 5)) * 40; // 快速大幅度开合
    } else {
      // 减慢平时开合速度，频率乘以 0.5（原来是 2），更加悠哉
      // 追逐食物时走得快，自然开合得快一点
      const speedFactor = currentFood ? 1.5 : 0.5;
      clawOpen = Math.abs(Math.sin(walkCycle * speedFactor)) * 25;
    }

    if (eyesOpen && eyesClosed) {
      eyesOpen.setAttribute('opacity', blink ? '0' : '1');
      eyesClosed.setAttribute('opacity', blink ? '1' : '0');
    }
    if (leftClawInner && rightClawInner) {
      // 根据新的几何结构调整旋转中心为(20, 32)，即钳口底部交界处
      leftClawInner.setAttribute('transform', `rotate(${15 + clawOpen} 20 32)`);
      rightClawInner.setAttribute('transform', `rotate(${15 + clawOpen} 20 32)`);
    }

    container.style.left = Math.round(x) + 'px';
    container.style.top = Math.round(y + bob) + 'px';
    container.style.transform = `translateZ(0) scaleX(${facingLeft ? -1 : 1}) rotate(${wobble * (facingLeft ? -1 : 1) * 0.14}deg)`;
  }

  window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth - W);
    y = Math.min(y, window.innerHeight - H - 16);
  });

  container.style.left = x + 'px';
  container.style.top = y + 'px';
  requestAnimationFrame(loop);
})();
