// Configuration CRACO pour ajouter l'alias @ pointant vers src/
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      // @ pointe vers le dossier src/
      '@': path.resolve(__dirname, 'src'),
    },
  },
};
