/**
 * Wandering Pixel Lobster
 * Big cartoon-style lobster that roams freely around the homepage
 */

(function() {
  const W = 168;
  const H = 120;
  const MOVE_SPEED = 1.8;
  const FRAME_RATE = 16;

  const el = document.createElement('div');
  el.id = 'wandering-lobster';
  el.innerHTML = `<img src="/lobster_big.png" alt="" style="width:${W}px;height:${H}px;image-rendering:pixelated;pointer-events:none;">`;
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '0',
    pointerEvents: 'none',
    opacity: '0.9',
    willChange: 'left, top',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
  });
  document.body.appendChild(el);

  let x = Math.random() * (window.innerWidth - W);
  let y = Math.random() * (window.innerHeight - H);
  let vx = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED;
  let vy = (Math.random() - 0.5) * MOVE_SPEED * 0.5;
  let facingLeft = vx < 0;
  let bobPhase = 0;
  let isMoving = true;

  el.style.left = x + 'px';
  el.style.top = y + 'px';

  function randomDirection() {
    const angle = Math.random() * Math.PI * 2;
    vx = Math.cos(angle) * MOVE_SPEED;
    vy = Math.sin(angle) * MOVE_SPEED * 0.5;
    if (Math.random() < 0.1) { vx = 0; vy = 0; }
  }

  setInterval(() => {
    // Bobbing animation (up-down)
    bobPhase += 0.15;
    const bob = Math.sin(bobPhase) * 3;

    // Move
    if (Math.random() < 0.01) randomDirection();
    if (vx === 0 && vy === 0 && Math.random() < 0.03) {
      vx = (Math.random() > 0.5 ? 1 : -1) * MOVE_SPEED;
    }

    x += vx;
    y += vy;

    // Bounce
    if (x <= 0) { x = 0; vx = Math.abs(vx); facingLeft = false; }
    if (x >= window.innerWidth - W) { x = window.innerWidth - W; vx = -Math.abs(vx); facingLeft = true; }
    if (y <= 0) { y = 0; vy = Math.abs(vy); }
    if (y >= window.innerHeight - H) { y = window.innerHeight - H; vy = -Math.abs(vy); }

    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y + bob) + 'px';
    el.style.transform = `scaleX(${facingLeft ? -1 : 1})`;
  }, 1000 / FRAME_RATE);

  window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth - W);
    y = Math.min(y, window.innerHeight - H);
  });
})();
