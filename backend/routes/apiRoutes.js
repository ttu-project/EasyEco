const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GET API Working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'POST API Working' });
});

module.exports = router;