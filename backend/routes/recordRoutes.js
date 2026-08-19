'use strict';

const express = require('express');
const router = express.Router();
const getUsageUserKey = require('../middleware/usageAuth');
const { saveRecord, getTimeline, getEstimate, getLatest } = require('../controllers/recordController');

// Apply the same auth middleware used by usageRoutes.js
// (supports both JWT Bearer token AND X-User-Id header)
router.use(getUsageUserKey);

// ── GET /api/records/latest ──────────────────────────────────────────────────
// Must be defined BEFORE /:id-style routes to avoid ambiguity
router.get('/latest', getLatest);

// ── GET /api/records/timeline?month=YYYY-MM ──────────────────────────────────
router.get('/timeline', getTimeline);

// ── GET /api/records/estimate?month=YYYY-MM ──────────────────────────────────
router.get('/estimate', getEstimate);

// ── POST /api/records ────────────────────────────────────────────────────────
router.post('/', saveRecord);

module.exports = router;
