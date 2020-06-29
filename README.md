# Skribul

![Skribul](logo.png)

## Share Your Doodles

Create and share your drawings across social media and chat platforms.

Optimised meta information allows full images to be rendered in apps that display a link preview.

Saved images are cleaned up with cron and exist in the database for 1 hour.

## Prerequisites

- NodeJS
- MongoDB server

## Running

### 1. Clone the repository

```bash
git clone https://github.com/brookesb91/skribul.git
```

### 2. Install dependencies

```bash
npm i
```

### 3. Start the server

```bash
npm run start
```

The app will be available on `localhost:3000`

## Environment Variables

`BASE_URL` - The base URL of the host environment. Default is `http://localhost:3000`.

`ENV` - The node environment. Default is `development`. Options are `development` or `production`.

`MONGODB_URI` - MongoDB URI. Default is `mongodb://localhost/skribul`
