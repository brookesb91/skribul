const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const app = express();

const models = require('./src/models');
const controllers = require('./src/controllers');

const env = process.env.NODE_ENV || 'development';
const protocol = process.env.PROTOCOL || 'http';
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost/skribul';

app.set('view engine', 'pug');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

const forceSsl = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

if (env === 'production') {
  app.use(forceSsl);
}

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', controllers.index);
app.get('/:slug', controllers.view);
app.get('/preview/:slug', controllers.preview)
app.post('/api/saves', controllers.save);

const server = new http.Server(app);

server.listen(port, host, () => {

  mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  console.log(`Server running on ${protocol}://${host}:${port}`);

  const job = cron.schedule('* * * * *', async () => {
    await models.Save.deleteMany({
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