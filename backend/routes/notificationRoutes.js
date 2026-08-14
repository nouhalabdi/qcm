const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// 1. جلب آخر إشعارات المستخدم
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Identifiant manquant.' });
    const notifs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. حذف إشعار واحد
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. حذف كل إشعارات المستخدم
router.delete('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Identifiant manquant.' });
    await Notification.deleteMany({ userId });
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;