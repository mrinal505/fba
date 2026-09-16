// Motion & Accessibility Preferences
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
  if (isPaused) {
    if (typeof revealFullHeading === 'function') revealFullHeading();
    if (typeof streamTimer !== 'undefined' && streamTimer) {
      clearTimeout(streamTimer);
      streamTimer = null;
    }
  } else if (typeof headingTyped !== 'undefined' && headingTyped) {
    if (typeof streamTimer !== 'undefined' && !streamTimer && typeof tickStream === 'function') {
      tickStream();
    }
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

// Hero 3D Perspective Tilt on Pointer Move & Mobile Touch
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

  // Mobile Device Orientation Gyro Tilt (if supported & motion enabled)
  if (window.DeviceOrientationEvent && !finePointer.matches) {
    window.addEventListener(
      'deviceorientation',
      event => {
        if (paused || reduced.matches || !event.gamma || !event.beta) return;
        const gamma = Math.max(-20, Math.min(20, event.gamma));
        const beta = Math.max(-20, Math.min(20, event.beta - 45));
        scene.style.setProperty('--scene-y', `${gamma * 0.4}deg`);
        scene.style.setProperty('--scene-x', `${-beta * 0.3}deg`);
      },
      { passive: true }
    );
  }
}

// Work Cards 3D Interactive Tilt
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

// Battery & GPU Saver (Pause visual animations when off-screen)
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

      // Build cover thumbnail & status
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
          status.textContent = 'Preview taking long? Tap "Watch on Instagram App" above to view directly.';
        }
      }, 7000);

      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => dialog.close());
  }

  // Backdrop click dismiss (safe coordinate detection)
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
    const scrollAmount = card ? card.getBoundingClientRect().width + 22 : 300;
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

// Circular Scroll Progress Ring & Floating Back to Top
const floatingTop = document.querySelector('#floating-top');
const progressCircle = document.querySelector('.progress-ring-bar');

if (floatingTop && progressCircle) {
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = circumference;

  function handleScrollProgress() {
    const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;

    if (scrollTotal > 0) {
      const progress = Math.min(1, Math.max(0, currentScroll / scrollTotal));
      const offset = circumference - progress * circumference;
      progressCircle.style.strokeDashoffset = offset;
    }

    if (currentScroll > 400) {
      floatingTop.classList.add('visible');
    } else {
      floatingTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleScrollProgress, { passive: true });

  floatingTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: reduced.matches ? 'instant' : 'smooth',
    });
  });
}

// Section 03 Alphabet-by-Alphabet Typewriter Animation
const aboutSection = document.querySelector('#about');
const headingLines = document.querySelectorAll('#about .typewriter-line');
const streamEl = document.querySelector('#typewriter-stream');

const streamPhrases = [
  'Festivals & Durga Puja',
  'Street Food & Local Cafés',
  'Untold Stories of Barakar',
  'People & Culture of Asansol',
  'High-Energy Viral Reels',
];

let streamIndex = 0;
let charIndex = 0;
let isDeleting = false;
let streamTimer = null;
let headingTyped = false;
let headingTimer = null;
let currentHeadingCursor = null;

function revealFullHeading() {
  if (headingTimer) {
    clearTimeout(headingTimer);
    headingTimer = null;
  }
  if (currentHeadingCursor) {
    currentHeadingCursor.remove();
    currentHeadingCursor = null;
  }
  headingLines.forEach(line => {
    line.textContent = line.dataset.typeText || line.textContent;
  });
  headingTyped = true;
}

function typeHeadingAlphabetByAlphabet(callback) {
  if (headingTyped) {
    if (callback) callback();
    return;
  }
  headingTyped = true;

  if (paused || reduced.matches) {
    revealFullHeading();
    if (callback) callback();
    return;
  }

  // Clear text initially for typing
  headingLines.forEach(line => {
    line.textContent = '';
  });

  const headingCursor = document.createElement('span');
  headingCursor.className = 'heading-cursor';
  headingCursor.setAttribute('aria-hidden', 'true');
  headingCursor.textContent = '|';
  currentHeadingCursor = headingCursor;

  let currentLineIdx = 0;
  let currentLetterIdx = 0;

  function typeNextLetter() {
    if (paused || reduced.matches) {
      revealFullHeading();
      if (callback) callback();
      return;
    }

    if (currentLineIdx >= headingLines.length) {
      headingCursor.remove();
      currentHeadingCursor = null;
      if (callback) callback();
      return;
    }

    const currentLine = headingLines[currentLineIdx];
    const fullText = currentLine.dataset.typeText || '';

    if (!currentLine.contains(headingCursor)) {
      currentLine.appendChild(headingCursor);
    }

    if (currentLetterIdx < fullText.length) {
      const char = fullText.charAt(currentLetterIdx);
      headingCursor.insertAdjacentText('beforebegin', char);
      currentLetterIdx++;
      headingTimer = setTimeout(typeNextLetter, 45 + Math.random() * 25);
    } else {
      currentLineIdx++;
      currentLetterIdx = 0;
      headingTimer = setTimeout(typeNextLetter, 220);
    }
  }

  headingTimer = setTimeout(typeNextLetter, 120);
}

function tickStream() {
  if (!streamEl) return;

  if (paused || reduced.matches) {
    streamEl.textContent = streamPhrases[streamIndex];
    return;
  }

  const currentPhrase = streamPhrases[streamIndex];

  if (!isDeleting) {
    streamEl.textContent = currentPhrase.substring(0, charIndex + 1);
    charIndex++;

    if (charIndex === currentPhrase.length) {
      isDeleting = true;
      streamTimer = setTimeout(tickStream, 2200);
      return;
    }
    streamTimer = setTimeout(tickStream, 65 + Math.random() * 20);
  } else {
    streamEl.textContent = currentPhrase.substring(0, charIndex - 1);
    charIndex--;

    if (charIndex === 0) {
      isDeleting = false;
      streamIndex = (streamIndex + 1) % streamPhrases.length;
      streamTimer = setTimeout(tickStream, 400);
      return;
    }
    streamTimer = setTimeout(tickStream, 35);
  }
}

function initSection3Typewriter() {
  if (!aboutSection) return;

  if ('IntersectionObserver' in window) {
    const aboutObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            typeHeadingAlphabetByAlphabet(() => {
              tickStream();
            });
            aboutObserver.unobserve(aboutSection);
          }
        });
      },
      { threshold: 0.15 }
    );
    aboutObserver.observe(aboutSection);
  } else {
    typeHeadingAlphabetByAlphabet(() => {
      tickStream();
    });
  }
}

initSection3Typewriter();
