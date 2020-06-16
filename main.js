const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const app = express();

const protocol = process.env.PROTOCOL || 'http';
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const dbUri = process.env.MONGDB_URI || 'mongodb://localhost/skribul';


const saveSchema = new mongoose.Schema({
  image: Buffer,
  slug: {
    type: String,
    default: function () {
      return randomstring.generate(8);
    }
  }
});

saveSchema.methods.toJSON = function () {
  return {
    image: this.image.toString(),
    slug: this.slug
  };
}

const Save = mongoose.model('Save', saveSchema);

app.set('view engine', 'pug');

app.use(express.json({
  limit: '50mb',
  parameterLimit: 50000
}));
app.use(express.urlencoded({
  limit: '50mb'
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.render('index'));

app.get('/:slug', async (req, res) => {
  const slug = req.params['slug'];

  const save = await Save.findOne({
    slug
  });

  if (!save) {
    // throw
    console.log('Not Found');
  }

  return res.render('view', save.toJSON());
})

app.put('/api/saves', async (req, res) => {
  const {
    image
  } = req.body;

  const item = await Save.create({
    image: new Buffer(new Buffer(image, 'binary').toString('base64'), 'base64')
  });

  return res.json(item.toJSON());
});

app.get('/api/saves/:slug', async (req, res) => {
  const slug = req.params['slug'];

  const save = await Save.findOne({
    slug
  });

  if (!save) {
    // throw
  }

  return res.json(save.toJSON());
});

const server = new http.Server(app);

server.listen(port, host, () => {

  mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  console.log(`Server running on ${protocol}://${host}:${port}`);
});