// Behaviour for every [data-swiper]: prev/next buttons, arrow keys, page counter,
// and mouse drag on desktop (touch devices already swipe natively via scroll-snap).

const DRAG_THRESHOLD_PX = 6;

function initSwiper(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-track]');
  if (!track || track.dataset.ready) return;
  track.dataset.ready = '1';

  const current = root.querySelector('[data-current]');
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const total = track.children.length;

  const index = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = (i: number) =>
    track.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * track.clientWidth, behavior: 'smooth' });
  const sync = () => {
    const i = index();
    if (current) current.textContent = String(i + 1);
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === total - 1;
  };

  // Buttons may sit on top of a clickable card, so stop the click from reaching the card link.
  const onButton = (step: number) => (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    go(index() + step);
  };
  prev?.addEventListener('click', onButton(-1));
  next?.addEventListener('click', onButton(1));
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index() + 1);
    if (e.key === 'ArrowLeft') go(index() - 1);
  });

  // Mouse drag to swipe.
  let startX = 0;
  let startLeft = 0;
  let pointerId: number | null = null;
  let dragged = false;
  track.querySelectorAll('img').forEach((img) => (img.draggable = false));

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    dragged = false;
  });
  track.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId) return;
    const dx = e.clientX - startX;
    if (!dragged && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      dragged = true;
      track.setPointerCapture(e.pointerId);
      track.classList.add('dragging');
    }
    if (dragged) track.scrollLeft = startLeft - dx;
  });
  const endDrag = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    if (!dragged) return;
    track.classList.remove('dragging');
    const dx = e.clientX - startX;
    const base = Math.round(startLeft / track.clientWidth);
    go(Math.abs(dx) > track.clientWidth * 0.12 ? base + (dx < 0 ? 1 : -1) : base);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  // A drag must not count as a click on the slide link underneath.
  track.addEventListener(
    'click',
    (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    },
    true,
  );

  sync();
}

document.querySelectorAll<HTMLElement>('[data-swiper]').forEach(initSwiper);
