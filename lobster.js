/**
 * Wandering Pixel Lobster
 * A pixel art lobster that roams freely around the homepage background
 */

(function() {
  // Configuration
  const LOBSTER_WIDTH = 120;
  const LOBSTER_HEIGHT = 58;
  const MOVE_SPEED = 1.2; // pixels per frame
  const FRAME_RATE = 20; // fps

  // Create lobster element
  const lobster = document.createElement('div');
  lobster.id = 'wandering-lobster';
  lobster.innerHTML = '<img src="/lobster.png" alt="" style="width:120px;height:58px;image-rendering:pixelated;pointer-events:none;">';
  
  // Styling
  Object.assign(lobster.style, {
    position: 'fixed',
    zIndex: '0',
    pointerEvents: 'none',
    opacity: '0.8',
    transition: 'transform 0.08s linear',
    willChange: 'left, top',
  });

  document.body.appendChild(lobster);

  // State
  let x = Math.random() * (window.innerWidth - LOBSTER_WIDTH);
  let y = Math.random() * (window.innerHeight - LOBSTER_HEIGHT);
  let vx = (Math.random() - 0.5) * MOVE_SPEED * 2;
  let vy = (Math.random() - 0.5) * MOVE_SPEED * 2;
  let facingLeft = true;

  // Initialize position
  lobster.style.left = x + 'px';
  lobster.style.top = y + 'px';

  function randomDirection() {
    const angle = Math.random() * Math.PI * 2;
    const speed = MOVE_SPEED * (0.5 + Math.random() * 0.5);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    
    // Occasionally pause
    if (Math.random() < 0.08) {
      vx = 0;
      vy = 0;
    }
  }

  function update() {
    // Random direction changes
    if (Math.random() < 0.015) {
      randomDirection();
    }

    // Move
    x += vx;
    y += vy;

    // Bounce off edges
    if (x <= 0) {
      x = 0;
      vx = Math.abs(vx);
      facingLeft = false;
    } else if (x >= window.innerWidth - LOBSTER_WIDTH) {
      x = window.innerWidth - LOBSTER_WIDTH;
      vx = -Math.abs(vx);
      facingLeft = true;
    }

    if (y <= 0) {
      y = 0;
      vy = Math.abs(vy);
    } else if (y >= window.innerHeight - LOBSTER_HEIGHT) {
      y = window.innerHeight - LOBSTER_HEIGHT;
      vy = -Math.abs(vy);
    }

    // Flip sprite based on direction
    lobster.style.left = x + 'px';
    lobster.style.top = y + 'px';
    lobster.style.transform = `scaleX(${facingLeft ? -1 : 1})`;
  }

  // Run animation loop
  setInterval(update, 1000 / FRAME_RATE);

  // Handle resize
  window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth - LOBSTER_WIDTH);
    y = Math.min(y, window.innerHeight - LOBSTER_HEIGHT);
  });

  // Initial direction
  randomDirection();
})();
