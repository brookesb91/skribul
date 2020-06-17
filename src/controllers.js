const models = require('./models');
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

const index = async (req, res) => res.render('index');

const view = async (req, res) => {
  const slug = req.params['slug'];

  const save = await models.Save.findOne({
    slug
  });

  if (!save) {
    return res.redirect('/');
  }

  return res.render('view', {
    ...save.toJSON(),
    base: baseURL
  });
};

const preview = async (req, res) => {
  const slug = req.params['slug'];
  const save = await models.Save.findOne({
    slug
  });

  if (!save) {
    return res.status(404);
  }

  const img = Buffer.from(save.image.toString().replace(/^data:image\/png;base64,/, ''), 'base64');

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });

  res.end(img);
};

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

module.exports = {
  index,
  view,
  save,
  preview
};