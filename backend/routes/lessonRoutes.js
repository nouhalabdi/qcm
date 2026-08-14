const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');

// 1. إضافة درس جديد (+ إشعار مخزّن وحي لكل طلبة السنة ديال الوحدة)
router.post('/', async (req, res) => {
  try {
    const { title, moduleId, order, yearContents } = req.body;
    const newLesson = new Lesson({ title, moduleId, order, yearContents });
    await newLesson.save();

    try {
      const io = req.app.get('io');
      const mod = await Module.findById(moduleId);
      if (mod) {
        const students = await User.find({ role: { $ne: 'admin' }, year: mod.year }).select('_id');
        for (const s of students) {
          await notifyUser(io, s._id, {
            title: 'Nouveau cours',
            body: `Nouvelle leçon disponible : "${newLesson.title}" (${mod.title})`,
            conversationType: 'system',
            conversationTitle: 'Nouveau cours'
          });
        }
      }
    } catch (notifyErr) {
      console.error('Erreur envoi notification nouvelle leçon :', notifyErr);
    }

    res.status(201).json(newLesson);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 2. جلب الدروس
router.get('/', async (req, res) => {
  try {
    const { moduleId, year } = req.query;
    let filter = {};
    if (moduleId) filter.moduleId = moduleId;
    if (year) filter['yearContents.year'] = year;

    const lessons = await Lesson.find(filter).sort({ order: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. تعديل درس موجود
router.put('/:id', async (req, res) => {
  try {
    const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedLesson) {
      return res.status(404).json({ message: 'Leçon non trouvée' });
    }
    res.json(updatedLesson);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. حذف درس
router.delete('/:id', async (req, res) => {
  try {
    const deletedLesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!deletedLesson) {
      return res.status(404).json({ message: 'Leçon non trouvée' });
    }
    res.json({ message: 'Leçon supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;