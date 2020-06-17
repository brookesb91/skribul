const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const cron = require('node-cron');
const app = express();

const protocol = process.env.PROTOCOL || 'http';
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost/skribul';
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

const saveSchema = new mongoose.Schema({
  image: Buffer,
  slug: {
    type: String,
    default: function () {
      return randomstring.generate(8);
    }
  },
  expiresAt: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 60);
      return date;
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

  return res.render('view', {
    ...save.toJSON(),
    base: baseURL
  });
});


app.get('/preview/:slug', async (req, res) => {
  const slug = req.params['slug'];
  const save = await Save.findOne({
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
})

app.put('/api/saves', async (req, res) => {
  const {
    image
  } = req.body;

  const {
    slug
  } = await Save.create({
    image: Buffer.from(Buffer.from(image, 'binary').toString('base64'), 'base64')
  });

  return res.json({
    slug
  });
});

const server = new http.Server(app);

server.listen(port, host, () => {

  mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  console.log(`Server running on ${protocol}://${host}:${port}`);

  cron.schedule('* * * * *', async () => {
    await Save.deleteMany({
      expiresAt: {
        $lt: new Date()
      }
    });
  })

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received.');
    console.log('Closing http server...');

    server.close(() => {
      console.log('Http server closed.');
      console.log('Stopping running jobs...');
      job.stop();
      console.log('Stopped running jobs.');
      console.log('Closing MongoDB connection...');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      })
    })
  });
});