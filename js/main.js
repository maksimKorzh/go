if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/go/service-worker.js')
}

tf.setBackend('webgl').then(() => {
  if (tf.getBackend() !== 'webgl') {
    tf.setBackend('cpu');
  }
});
