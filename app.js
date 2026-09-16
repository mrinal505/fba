// Motion & Accessibility Controls
const motion = document.querySelector('#motion');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

let paused = reduced.matches;

function updateMotion() {
  const isPaused = paused || document.hidden;
  document.body.classList.toggle('paused', isPaused);
  if (motion) {
    motion.setAttribute('aria-pressed', String(paused));
    motion.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
  }
}

if (motion) {
  motion.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
}

reduced.addEventListener('change', () => {
  paused = reduced.matches;
  updateMotion();
});

document.addEventListener('visibilitychange', updateMotion);
updateMotion();

// Hero 3D Perspective Tilt on Pointer Move
const scene = document.querySelector('.scene');
const visual = document.querySelector('.visual');

if (visual && scene) {
  visual.addEventListener('pointermove', event => {
    if (paused || reduced.matches || !finePointer.matches) return;
    const rect = visual.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
    const yRatio = 0.5 - (event.clientY - rect.top) / rect.height;
    scene.style.setProperty('--scene-y', `${xRatio * 22}deg`);
    scene.style.setProperty('--scene-x', `${yRatio * 14}deg`);
  });

  visual.addEventListener('pointerleave', () => {
    scene.style.setProperty('--scene-x', '0deg');
    scene.style.setProperty('--scene-y', '0deg');
  });
}

// Work Cards 3D Tilt
document.querySelectorAll('.work-card').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (paused || reduced.matches || !finePointer.matches) return;
    const rect = card.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
    const yRatio = 0.5 - (event.clientY - rect.top) / rect.height;
    card.style.setProperty('--tilt-x', `${yRatio * 10}deg`);
    card.style.setProperty('--tilt-y', `${xRatio * 12}deg`);
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

// Pause Decorative Animations when Offscreen (CPU/GPU Optimization)
if ('IntersectionObserver' in window && visual) {
  const visualObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        visual.classList.toggle('motion-hidden', !entry.isIntersecting);
      });
    },
    { rootMargin: '100px' }
  );
  visualObserver.observe(visual);
}

// Reels Modal Dialog & Instagram Embed
const dialog = document.querySelector('#reel-dialog');
const player = document.querySelector('#reel-player');
const closeBtn = document.querySelector('#close-reel');
const originalReelLink = document.querySelector('#original-reel');
const dialogTitle = document.querySelector('#reel-dialog-title');
let triggerButton = null;

if (dialog && player) {
  document.querySelectorAll('.reel-open').forEach(button => {
    button.addEventListener('click', () => {
      triggerButton = button;
      const id = button.dataset.reel;
      const title = button.dataset.title || 'Watch reel';

      if (!/^[a-zA-Z0-9_-]+$/.test(id)) return;

      if (dialogTitle) dialogTitle.textContent = title;
      if (originalReelLink) {
        originalReelLink.href = `https://www.instagram.com/reel/${id}/`;
      }

      // Build fallback cover & status
      const cover = button.querySelector('img')?.cloneNode(true) || document.createElement('div');
      cover.className = 'player-cover';
      cover.setAttribute('alt', '');

      const status = document.createElement('p');
      status.className = 'player-status';
      status.textContent = 'Loading Instagram reel… You can also watch directly using the button above.';

      const frame = document.createElement('iframe');
      frame.title = title;
      frame.src = `https://www.instagram.com/reel/${id}/embed/`;
      frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.hidden = true;

      frame.addEventListener(
        'load',
        () => {
          frame.hidden = false;
          cover.remove();
          status.remove();
        },
        { once: true }
      );

      player.replaceChildren(cover, status, frame);

      setTimeout(() => {
        if (status.isConnected) {
          status.textContent = 'Preview taking long? Click "Watch on Instagram" above to view directly.';
        }
      }, 7000);

      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => dialog.close());
  }

  // Backdrop click dismiss (mousedown + mouseup check prevents accidental close during drag)
  let isBackdropClick = false;
  dialog.addEventListener('mousedown', event => {
    const rect = dialog.getBoundingClientRect();
    isBackdropClick =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
  });

  dialog.addEventListener('mouseup', event => {
    if (isBackdropClick) {
      const rect = dialog.getBoundingClientRect();
      const clickOutside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (clickOutside) {
        dialog.close();
      }
    }
    isBackdropClick = false;
  });

  dialog.addEventListener('close', () => {
    // Unload iframe immediately to stop audio/video
    player.replaceChildren();
    document.body.style.overflow = '';
    if (triggerButton) {
      triggerButton.focus({ preventScroll: true });
    }
  });
}

// Reel Track Navigation & Keyboard Controls
const track = document.querySelector('.reel-track');
const prevBtn = document.querySelector('#reel-prev');
const nextBtn = document.querySelector('#reel-next');

if (track && prevBtn && nextBtn) {
  function scrollReels(direction) {
    const card = track.querySelector('.reel-card');
    const scrollAmount = card ? card.getBoundingClientRect().width + 24 : 320;
    track.scrollBy({
      left: direction * scrollAmount,
      behavior: reduced.matches ? 'instant' : 'smooth',
    });
  }

  prevBtn.addEventListener('click', () => scrollReels(-1));
  nextBtn.addEventListener('click', () => scrollReels(1));

  function updateArrows() {
    prevBtn.disabled = track.scrollLeft < 6;
    nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 6;
  }

  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  window.addEventListener('load', updateArrows);
  updateArrows();

  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollReels(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
}
