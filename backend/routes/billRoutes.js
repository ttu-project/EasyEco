'use strict';

const express = require('express');
const router = express.Router();
const getUsageUserKey = require('../middleware/usageAuth');
const { calculateBill } = require('../controllers/billController');

router.use(getUsageUserKey);

router.post('/calculate', calculateBill);
router.get('/calculate', calculateBill);
router.get('/estimated-total', calculateBill);

module.exports = router;
