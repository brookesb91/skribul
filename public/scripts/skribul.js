/**
 * @returns {HTMLCanvasElement}
 */
const getCanvas = () => document.getElementById('canvas');

const getContext = () => getCanvas().getContext('2d');

const getRect = () => getCanvas().getBoundingClientRect();

const getOverlay = () => document.getElementById('overlay');

const toggleOverlay = (toggle) => {
  if (toggle) {
    getOverlay().classList.add('visible');
  } else {
    getOverlay().classList.remove('visible');
  }
};

const isTouch = () => 'ontouchstart' in window;

getCanvas().width = document.body.clientWidth;
getCanvas().height = document.body.clientHeight;

getContext().save();
getContext().fillStyle = 'white';
getContext().fillRect(0, 0, getCanvas().width, getCanvas().height);
getContext().restore();

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

const getInputEventNames = () => (isTouch() ? TOUCH_EVENTS : MOUSE_EVENTS);

const setStyle = (color) => (getContext().fillStyle = color);

const clearCanvas = () => {
  const {
    width,
    height
  } = getCanvas();
  getContext().clearRect(0, 0, width, height);
};

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

const share = async (link) => {
  if ('share' in navigator) {
    await navigator.share({
      title: 'Skribul',
      url: link
    });
  } else if ('clipboard' in navigator) {
    await navigator.clipboard.writeText(link);
    alert(`Link copied to clipboard`);
  }
}

const colors = document.querySelectorAll('.color[data-color]');

/**
 *
 * @param {String} selector Query Selector
 * @param {NodeListOf<Element>} elements Elements to query
 * @returns {NodeListOf<Element>}
 */
const querySelectorFrom = (selector, elements) => {
  return [].filter.call(elements, element => element.matches(selector));
}

colors.forEach(el => {
  const color = el.getAttribute('data-color');
  el.addEventListener('click', () => {
    const active = querySelectorFrom('.active', colors)[0];
    !!active && active.classList.remove('active');
    el.classList.add('active');
    setStyle(color);
  });
});

colors[0].click();

getCanvas().addEventListener(getInputEventNames().start, drawStart, {
  passive: true
});
getCanvas().addEventListener(getInputEventNames().end, drawEnd, {
  passive: true
});