import { resolve } from 'path';

export default {
  server: {
    watch: {
      ignored: ['**/backend/**']
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html')
      }
    }
  }
};
