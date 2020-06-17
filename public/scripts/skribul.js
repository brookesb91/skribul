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
}

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
  end: 'touchend'
};

const MOUSE_EVENTS = {
  move: 'mousemove',
  start: 'mousedown',
  end: 'mouseup'
};

const getInputEventNames = () => isTouch() ? TOUCH_EVENTS : MOUSE_EVENTS;

const INPUT_MOVE = getInputEventNames().move;
const INPUT_START = getInputEventNames().start;
const INPUT_END = getInputEventNames().end;

const setStyle = (color) => getContext().fillStyle = color;

const clearCanvas = () => {
  const {
    width,
    height
  } = getCanvas();
  getContext().clearRect(0, 0, width, height);
};

const drawStart = (e) => getCanvas().addEventListener(INPUT_MOVE, startPath);

const drawEnd = (e) => getCanvas().removeEventListener(INPUT_MOVE, startPath);

const startPath = (e) => {
  const pos = getInputPos(e);
  getContext().fillRect(pos.x - 1, pos.y - 1, 3, 3);
};

const getInputPos = (e) => isTouch() ? getTouchPos(e) : getMousePos(e);

const getTouchPos = (e) => {
  const {
    left,
    top
  } = getRect();
  return {
    x: e.touches[0].clientX - left,
    y: e.touches[0].clientY - top
  }
}

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
}

const save = async () => {
  toggleOverlay(true);

  const image = getCanvas().toDataURL('image/png');
  const payload = {
    image
  };

  const res = await fetch('api/saves', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  const link = new URL(data.slug, window.location);

  toggleOverlay(false);

  await navigator.clipboard.writeText(link);

  alert(`Link copied to clipboard`);

  window.location.href = `/${data.slug}`;
}

getCanvas().addEventListener(INPUT_START, drawStart);

getCanvas().addEventListener(INPUT_END, drawEnd);