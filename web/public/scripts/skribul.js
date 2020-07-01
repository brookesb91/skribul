/* eslint-disable no-unused-vars */

/**
 * Gets the canvas element.
 * @returns {HTMLCanvasElement}
 */
const getCanvas = () => document.getElementById('canvas');

/**
 * Gets the current canvas rendering context.
 * @returns {CanvasRenderingContext2D}
 */
const getContext = () => getCanvas().getContext('2d');

/**
 * Gets the current canvas DOMRect.
 * @returns {DOMRect}
 */
const getRect = () => getCanvas().getBoundingClientRect();

/**
 * Get the loading overlay element.
 * @returns {HTMLElement}
 */
const getOverlay = () => document.getElementById('overlay');

/**
 * Toggles the loading overlay visibility.
 * @param {Boolean} toggle Show the overlay?
 * @returns {void}
 */
const toggleOverlay = (toggle) => {
  if (toggle) {
    getOverlay().classList.add('visible');
  } else {
    getOverlay().classList.remove('visible');
  }
};

/**
 * Determines if touch is supported on the current platform.
 * @returns {Boolean}
 */
const isTouch = () => 'ontouchstart' in window;

const setCanvasSize = () => {
  getCanvas().width = document.body.clientWidth;
  getCanvas().height = document.body.clientHeight;
};

const TOUCH_EVENTS = {
  move: 'touchmove',
  start: 'touchstart',
  end: 'touchend',
};

const MOUSE_EVENTS = {
  move: 'mousemove',
  start: 'mousedown',
  end: 'mouseup',
};

/**
 * @returns {typeof TOUCH_EVENTS | typeof MOUSE_EVENTS}
 */
const getInputEventNames = () => (isTouch() ? TOUCH_EVENTS : MOUSE_EVENTS);

/**
 * Set the canvas context fill style.
 * @param {String} color Color to set
 * @returns {void}
 */
const setStyle = (color) => (getContext().fillStyle = color);

const drawStart = (e) => getCanvas().addEventListener(getInputEventNames().move, startPath, {
  passive: true
});

const drawEnd = (e) => getCanvas().removeEventListener(getInputEventNames().move, startPath, {
  passive: true
});

const startPath = (e) => {
  const pos = getInputPos(e);
  getContext().fillRect(pos.x - 1, pos.y - 1, 3, 3);
};

const getInputPos = (e) => (isTouch() ? getTouchPos(e) : getMousePos(e));

const getTouchPos = (e) => {
  const {
    left,
    top
  } = getRect();
  return {
    x: e.touches[0].clientX - left,
    y: e.touches[0].clientY - top,
  };
};

const getMousePos = (e) => {
  const {
    left,
    top
  } = getRect();
  return {
    x: e.clientX - left,
    y: e.clientY - top,
  };
};


const render = (dataURI) => {
  const image = new Image();
  image.onload = () => getContext().drawImage(image, 0, 0);
  image.src = dataURI;
};

const save = async () => {
  toggleOverlay(true);

  const image = getCanvas().toDataURL('image/png');
  const payload = {
    image,
  };

  const res = await fetch('api/saves', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const link = new URL(data.slug, window.location);

  share(link);
  toggleOverlay(false);

  window.location.href = `/${data.slug}`;
};

/**
 * Attempt to open the share view.
 *
 * If share is not available, attempt to copy the
 * link to the clipboard.
 *
 * If neither is available, alert the user.
 *
 * @param {URL | String} link Link to share
 */
const share = async (link) => {
  if ('share' in navigator) {
    await navigator.share({
      title: 'Skribul',
      text: 'Check out my doodle',
      url: link
    });
  } else if ('clipboard' in navigator) {
    await navigator.clipboard.writeText(link);
    alert('Link copied to clipboard');
  } else {
    alert(`
      Automatic sharing is currently unavailable in your browser.
      Either copy the URL directly or open this page in a different browser.
    `);
  }
};

/**
 * @type {HTMLInputElement}
 */
const picker = document.querySelector('#color-picker');

picker.addEventListener('change', () => {
  const color = picker.value;
  setStyle(color);
}, {
  passive: true
});

setCanvasSize();

window.addEventListener('resize', setCanvasSize);

getCanvas().addEventListener(getInputEventNames().start, drawStart, {
  passive: true
});

getCanvas().addEventListener(getInputEventNames().end, drawEnd, {
  passive: true
});