if (process.argv[2] === 'start') process.env.NODE_ENV = 'production';
else if (process.argv[2] === 'dev') process.env.NODE_ENV = 'development';

const nodemon = require('nodemon');
nodemon('--exec ts-node --files bin/www.ts');

nodemon
  .on('start', () => console.log('[nodemon] App has started'))
  .on('quit', () => console.log('[nodemon] App has started'))
  .on('restart', (files) =>
    console.log('[nodemon] App restarted due to:', files)
  );
