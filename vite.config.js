import { resolve } from 'path';

export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html')
      }
    }
  }
};
