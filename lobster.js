/**
 * Wandering Pixel Lobster - Animated Sprite Edition
 * A pixel art lobster with walking animation that roams the homepage
 */

(function() {
  // ─── Config ───────────────────────────────────────────────
  const SPRITE_W    = 180;   // frame width in px (display)
  const SPRITE_H    = 87;    // frame height in px
  const SHEET_COLS = 6;      // frames per row
  const ANIM_FPS    = 10;    // walk cycle speed
  const MOVE_SPEED  = 2.5;   // px per frame
  const SCALE       = 1;     // 1 = natural size
  const WALK_FRAME_MS = 1000 / ANIM_FPS;
  // ─────────────────────────────────────────────────────────

  const W = SPRITE_W * SCALE;
  const H = SPRITE_H * SCALE;

  // Create container
  const container = document.createElement('div');
  container.id = 'wandering-lobster';
  
  // Create canvas for animation
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.pointerEvents = 'none';
  
  container.appendChild(canvas);
  Object.assign(container.style, {
    position: 'fixed',
    zIndex: '0',
    pointerEvents: 'none',
    opacity: '0.9',
    willChange: 'left, top',
  });
  document.body.appendChild(container);

  // State
  let x = Math.random() * (window.innerWidth  - W);
  let y = Math.random() * (window.innerHeight - H);
  let vx = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED;
  let vy = (Math.random() - 0.5) * MOVE_SPEED * 0.5;
  let facingLeft = vx < 0;
  let frame = 0;
  let lastFrameTime = 0;
  let isWalking = true;

  // Load sprite sheet
  const sheet = new Image();
  sheet.src = '/lobster_sheet.png';
  sheet.decode().then(() => {
    requestAnimationFrame(gameLoop);
  });

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function gameLoop(timestamp) {
    update(timestamp);
    render();
    requestAnimationFrame(gameLoop);
  }

  function update(timestamp) {
    // Walk animation frame
    if (timestamp - lastFrameTime >= WALK_FRAME_MS) {
      frame = (frame + 1) % SHEET_COLS;
      lastFrameTime = timestamp;
    }

    // Randomly change direction occasionally
    if (Math.random() < 0.008) {
      const angle = Math.random() * Math.PI * 2;
      vx = Math.cos(angle) * MOVE_SPEED;
      vy = Math.sin(angle) * MOVE_SPEED * 0.6;
    }

    // Occasionally pause (standing still)
    if (Math.random() < 0.005) {
      vx = 0;
      vy = 0;
      isWalking = false;
    } else if (vx !== 0 || vy !== 0) {
      isWalking = true;
    }

    // Move
    x += vx;
    y += vy;

    // Bounce
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

    // Update position
    container.style.left = Math.round(x) + 'px';
    container.style.top  = Math.round(y) + 'px';

    // Flip based on direction
    if (vx < 0)  facingLeft = true;
    if (vx > 0)  facingLeft = false;

    container.style.transform = `scaleX(${facingLeft ? -1 : 1})`;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // Source position in sprite sheet
    const srcX = frame * SPRITE_W;
    const srcY = 0;

    ctx.drawImage(
      sheet,
      srcX, srcY, SPRITE_W, SPRITE_H,  // source rect
      0,    0,    W,    H             // dest rect (scaled)
    );
  }

  // Handle resize
  window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth  - W);
    y = Math.min(y, window.innerHeight - H);
  });

  // Initial position
  container.style.left = x + 'px';
  container.style.top  = y + 'px';
})();
