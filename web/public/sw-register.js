if (navigator && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(() => console.log('Service Worker Registered Successfully'))
    .catch((error) =>
      console.log('Failed To Register Service Worker With Error: ', error)
    );
}
