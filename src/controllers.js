const Sharp = require('sharp');
const {
  SitemapStream,
  streamToPromise
} = require('sitemap');
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
  const {
    width,
    height
  } = req.query;

  const slug = req.params.slug;

  const save = await models.Save.findOne({
    slug
  });

  if (!save) {
    return res.status(404);
  }

  const buffer = save.image.toString().replace(/^data:image\/png;base64,/, '');
  const img = await createImage(buffer, width, height).toBuffer();

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });

  res.end(img);
};

const createImage = (source, width = 1200, height = 600, background = {
  r: 255,
  g: 255,
  b: 255
}) => {
  return Sharp(Buffer.from(source, 'base64'))
    .flatten({
      background
    })
    .resize({
      width,
      height,
      background,
      fit: Sharp.fit.contain,
      withoutEnlargement: true
    }).png();
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

  const buffer = Buffer.from(Buffer.from(image, 'binary').toString('base64'), 'base64');

  const {
    slug
  } = await models.Save.create({
    image: buffer
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

const sitemap = async (req, res) => {
  const items = await models.Save.find({});

  const links = Array.from(items, item => ({
    url: `/${item.slug}/`,
    changefreq: 'always',
    img: {
      url: `/preview/${item.slug}`
    }
  }));

  const stream = new SitemapStream({
    hostname: BASE_URL
  });

  links.forEach(link => stream.write(link));
  stream.end();

  const data = await streamToPromise(stream);

  res.header('Content-Type', 'application/xml');
  res.send(data);
};

module.exports = {
  index,
  view,
  save,
  preview,
  browse,
  sitemap
};