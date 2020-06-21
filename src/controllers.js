const Sharp = require('sharp');
const models = require('./models');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ENV = process.env.NODE_ENV;

const render = (res, name, data = {}) => {
  return res.render(name, {
    ...data,
    BASE_URL,
    ENV
  });
};

/**
 * Render the editor view.
 * @param {Express.Request} req The request.
 * @param {Express.Response} res The response.
 */
const index = async (req, res) => render(res, 'editor');

/**
 * View an existing save that has a matching slug
 * and render it in the editor.
 * @param {Express.Request} req The request.
 * @param {Express.Response} res The response.
 */
const view = async (req, res) => {
  const slug = req.params.slug;

  const save = await models.Save.findOne({
    slug
  });

  if (!save) {
    return res.redirect('/');
  }

  return render(res, 'view', {
    ...save.toJSON()
  });
};

/**
 * Return a raw image for an existing save
 * with the given slug.
 * @param {Express.Request} req The request.
 * @param {Express.Response} res The response.
 */
const preview = async (req, res) => {
  const slug = req.params.slug;

  const save = await models.Save.findOne({
    slug
  });

  if (!save) {
    return res.status(404);
  }

  const buffer = save.image.toString().replace(/^data:image\/png;base64,/, '');
  const img = await createImage(buffer).toBuffer();

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });

  res.end(img);
};

const createImage = (source) => {
  return Sharp(Buffer.from(source, 'base64'))
    .flatten({
      background: {
        r: 255,
        g: 255,
        b: 255
      }
    })
    .resize({
      width: 1200,
      height: 600,
      background: {
        r: 255,
        g: 255,
        b: 255
      },
      fit: Sharp.fit.contain
    }).png().trim();
};

/**
 * Save a new drawing and return its slug.
 * @param {Express.Request} req The request.
 * @param {Express.Response} res The response.
 */
const save = async (req, res) => {
  const {
    image
  } = req.body;

  const {
    slug
  } = await models.Save.create({
    image: Buffer.from(Buffer.from(image, 'binary').toString('base64'), 'base64')
  });

  return res.json({
    slug
  });
};

/**
 * View the last 12 saved items.
 * @param {Express.Request} req The request
 * @param {Express.Response} res The response
 */
const browse = async (req, res) => {
  const items = await models.Save
    .find({})
    .skip(0)
    .limit(12);

  return render(res, 'browse', {
    items: items.map(i => i.toJSON())
  });
};

module.exports = {
  index,
  view,
  save,
  preview,
  browse
};