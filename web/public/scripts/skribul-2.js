const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const BRUSH_SIZE = 2;
const BRUSH_PRESSURE = 1;
const COLOR = [0, 0, 0];

canvas.height = SCREEN_HEIGHT;
canvas.width = SCREEN_WIDTH;

class Brush {
  /**
   *
   * @param {CanvasRenderingContext2D} context Rendering context.
   */
  constructor(context) {
    this.context = context;
    this.mouseX = SCREEN_WIDTH / 2;
    this.mouseY = SCREEN_HEIGHT / 2;

    this.painters = [];

    this.painters = new Array(50).fill().map(() => ({
      dx: SCREEN_WIDTH / 2,
      dy: SCREEN_HEIGHT / 2,
      ax: 0,
      ay: 0,
      div: 0.1,
      ease: Math.random() * 0.1 + 0.5,
    }));

    this.interval = setInterval(this.update.bind(this), 1000 / 60);
  }

  update() {
    this.context.lineWidth = BRUSH_SIZE;
    this.context.strokeStyle = `rgba(${COLOR[0]}, ${COLOR[1]}, ${COLOR[2]}, ${
      0.05 * BRUSH_PRESSURE
    })`;

    for (let i = 0; i < this.painters.length; i++) {
      this.context.beginPath();
      this.context.moveTo(this.painters[i].dx, this.painters[i].dy);

      this.painters[i].dx -= this.painters[i].ax =
        (this.painters[i].ax +
          (this.painters[i].dx - this.mouseX) * this.painters[i].div) *
        this.painters[i].ease;

      this.painters[i].dy -= this.painters[i].ay =
        (this.painters[i].ay +
          (this.painters[i].dy - this.mouseY) * this.painters[i].div) *
        this.painters[i].ease;
      this.context.lineTo(this.painters[i].dx, this.painters[i].dy);
      this.context.stroke();
    }
  }

  strokeStart(mouseX, mouseY) {
    this.mouseX = mouseX;
    this.mouseY = mouseY;

    for (let i = 0; i < this.painters.length; i++) {
      this.painters[i].dx = mouseX;
      this.painters[i].dy = mouseY;
    }
  }

  stroke(mouseX, mouseY) {
    this.mouseX = mouseX;
    this.mouseY = mouseY;
  }

  strokeEnd() {}
}

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

const render = (dataURI) => {
  const image = new Image();
  image.onload = () => ctx.drawImage(image, 0, 0);
  image.src = dataURI;
};

const save = async () => {
  toggleOverlay(true);

  const image = canvas.toDataURL('image/png');
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
      url: link,
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

const brush = new Brush(ctx);

function onCanvasMouseDown(event) {
  brush.strokeStart(event.clientX, event.clientY);
  window.addEventListener('mousemove', onCanvasMouseMove, false);
  window.addEventListener('mouseup', onCanvasMouseUp, false);
}

function onCanvasMouseUp() {
  brush.strokeEnd();
  window.removeEventListener('mousemove', onCanvasMouseMove, false);
  window.removeEventListener('mouseup', onCanvasMouseUp, false);
}

function onCanvasMouseMove(event) {
  brush.stroke(event.clientX, event.clientY);
}

function onCanvasTouchStart(event) {
  if (event.touches.length == 1) {
    event.preventDefault();

    brush.strokeStart(event.touches[0].pageX, event.touches[0].pageY);

    window.addEventListener('touchmove', onCanvasTouchMove, false);
    window.addEventListener('touchend', onCanvasTouchEnd, false);
  }
}

function onCanvasTouchMove(event) {
  if (event.touches.length == 1) {
    brush.stroke(event.touches[0].pageX, event.touches[0].pageY);
  }
}

function onCanvasTouchEnd(event) {
  if (event.touches.length == 0) {
    brush.strokeEnd();

    window.removeEventListener('touchmove', onCanvasTouchMove, false);
    window.removeEventListener('touchend', onCanvasTouchEnd, false);
  }
}

canvas.addEventListener('mousedown', onCanvasMouseDown, false);
canvas.addEventListener('touchstart', onCanvasTouchStart, false);
