/**
 * Wandering Pixel Lobster - Animated Sprite Edition
 * 6-frame walk cycle, canvas rendering, natural movement
 */
(function() {
  const FW = 240;   // frame width in px (60*4)
  const FH = 116;   // frame height in px (29*4)
  const COLS = 6;   // frames per row
  const WALK_FPS = 12;   // walk cycle speed
  const MOVE_SPEED = 2.2;
  const BOB_AMP = 3;     // vertical bobbing amplitude
  const FRAME_MS = 1000 / WALK_FPS;

  const W = FW, H = FH;

  const container = document.createElement('div');
  container.id = 'wandering-lobster';
  Object.assign(container.style, {
    position: 'fixed', zIndex: '0', pointerEvents: 'none',
    opacity: '0.92', willChange: 'left, top',
    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
  });

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.imageRendering = 'pixelated';
  container.appendChild(canvas);
  document.body.appendChild(container);

  // State
  let x = Math.random() * (window.innerWidth - W);
  let y = Math.random() * (window.innerHeight - H);
  let vx = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED;
  let vy = (Math.random() - 0.5) * MOVE_SPEED * 0.4;
  let facingLeft = vx < 0;
  let frame = 0;
  let lastFrameTime = 0;
  let isMoving = true;
  let walkCycle = 0;  // 0-1 for bobbing phase
  let pauseTimer = 0;

  const sheet = new Image();
  sheet.src = '/lobster_sheet.png';
  sheet.decode().then(() => requestAnimationFrame(loop));

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function loop(ts) {
    update(ts);
    render();
    requestAnimationFrame(loop);
  }

  function update(ts) {
    // Walk animation frame advance
    if (ts - lastFrameTime >= FRAME_MS) {
      if (isMoving) frame = (frame + 1) % COLS;
      lastFrameTime = ts;
    }

    // Random pause
    if (isMoving && Math.random() < 0.006) {
      isMoving = false;
      pauseTimer = 80 + Math.random() * 120;  // frames to stay still
    }
    if (!isMoving) {
      pauseTimer--;
      if (pauseTimer <= 0) {
        isMoving = true;
        // New direction after pause
        const angle = Math.random() * Math.PI * 2;
        vx = Math.cos(angle) * MOVE_SPEED;
        vy = Math.sin(angle) * MOVE_SPEED * 0.5;
      }
    }

    // Random direction wobble while moving
    if (isMoving && Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2;
      const speed = MOVE_SPEED * (0.6 + Math.random() * 0.5);
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed * 0.5;
    }

    // Move
    if (isMoving) {
      x += vx;
      y += vy;
    }

    // Bounce off edges
    if (x <= 0) {
      x = 0; vx = Math.abs(vx); facingLeft = false;
    } else if (x >= window.innerWidth - W) {
      x = window.innerWidth - W; vx = -Math.abs(vx); facingLeft = true;
    }
    if (y <= 0) {
      y = 0; vy = Math.abs(vy);
    } else if (y >= window.innerHeight - H) {
      y = window.innerHeight - H; vy = -Math.abs(vy);
    }

    // Walk cycle phase for bobbing (increases while moving)
    if (isMoving) {
      walkCycle += 0.18;
    } else {
      // Gentle breathing while paused
      walkCycle += 0.03;
    }
    const bob = Math.sin(walkCycle) * BOB_AMP;

    // Direction
    if (vx < 0) facingLeft = true;
    if (vx > 0) facingLeft = false;

    container.style.left = Math.round(x) + 'px';
    container.style.top  = Math.round(y + bob) + 'px';
    container.style.transform = `scaleX(${facingLeft ? -1 : 1})`;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    const sx = frame * FW;
    ctx.drawImage(sheet, sx, 0, FW, FH, 0, 0, W, H);
  }

  window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth - W);
    y = Math.min(y, window.innerHeight - H);
  });

  container.style.left = x + 'px';
  container.style.top  = y + 'px';
})();
