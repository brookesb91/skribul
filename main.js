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
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost/skribul';


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

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.render('index'));

app.get('/:slug', async (req, res) => {
  const slug = req.params['slug'];

  const save = await Save.findOne({
    slug
  });

  if (!save) {
    return res.redirect('/');
  }

  return res.render('view', save.toJSON());
})

app.put('/api/saves', async (req, res) => {
  const {
    image
  } = req.body;

  const item = await Save.create({
    image: Buffer.from(Buffer.from(image, 'binary').toString('base64'), 'base64')
  });

  return res.json(item.toJSON());
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