const express = require('express');
const router = express.Router();
const Usage = require('../models/Usage');
const getUsageUserKey = require('../middleware/usageAuth');

router.use(getUsageUserKey);

router.get('/', async (req, res) => {
  try {
    const usage = await Usage.find({ user: req.usageUserKey }).sort({ createdAt: -1 });
    res.json(usage);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category, name, watt, time } = req.body;

    if (!category || !name || !watt || !time) {
      return res.status(400).json({
        message: 'category, name, watt, and time are required',
      });
    }

    const usage = await Usage.create({
      user: req.usageUserKey,
      category,
      name,
      watt,
      time,
    });

    res.status(201).json(usage);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const usage = await Usage.findOneAndDelete({
      _id: req.params.id,
      user: req.usageUserKey,
    });

    if (!usage) {
      return res.status(404).json({
        message: 'Usage not found',
      });
    }

    res.json({
      message: 'Usage deleted',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
