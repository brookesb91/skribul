const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');

const { connectDB } = require('./src/models');
const controllers = require('./src/controllers');
const { forceSsl } = require('./src/middleware');

const env = process.env.NODE_ENV || 'development';
const protocol = process.env.PROTOCOL || 'http';
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const isProduction = env === 'production';

const app = express();

app.set('view engine', 'pug');

app.use(express.json({ limit: '50mb' }));

app.use(
  express.urlencoded({
    limit: '50mb',
    extended: true,
  })
);

if (isProduction) {
  app.use(forceSsl);
}

app.use(
  express.static(path.join(__dirname, 'web', 'public'), { redirect: false })
);

app.get('/sitemap.xml', controllers.sitemap);

app.get('/', controllers.index);
// app.get('/browse', controllers.browse);
app.get('/:slug', controllers.view);
app.get('/preview/:slug', controllers.preview);
app.post('/api/saves', controllers.save);

const server = new http.Server(app);

/* eslint-disable no-console */
server.listen(port, host, async () => {
  await connectDB();

  console.log(`Server running on ${protocol}://${host}:${port}`);

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received.');
    console.log('Closing http server...');

    server.close(() => {
      console.log('Http server closed.');
      console.log('Closing MongoDB connection...');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  });
});
