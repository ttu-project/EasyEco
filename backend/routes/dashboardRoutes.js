'use strict';

const express = require('express');
const router = express.Router();
const getUsageUserKey = require('../middleware/usageAuth');
const { getDashboardData } = require('../controllers/billController');

router.use(getUsageUserKey);

router.get('/', getDashboardData);

module.exports = router;
