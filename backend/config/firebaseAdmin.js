const { cert, getApps, initializeApp } = require('firebase-admin/app');
const serviceAccount = require('../serviceAccountKEY.json');

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

module.exports = {};
