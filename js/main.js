if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/go/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

tf.setBackend('webgl').then(() => {
  if (tf.getBackend() !== 'webgl') {
    tf.setBackend('cpu');
  }
});

initGoban();
resizeCanvas();
