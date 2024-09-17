const browserSync = require('browser-sync').create();

browserSync.init({
    proxy: 'localhost:3000',
    files: ['client/**/*'],
    port: 3001,
    open: true, // We'll open the browser manually after both processes start
    notify: false
});

console.log('Browser-Sync is running on http://localhost:3001');