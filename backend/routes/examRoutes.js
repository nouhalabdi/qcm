const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');

// جلب الامتحانات
router.get('/', async (req, res) => {
  try {
    const { moduleId } = req.query;
    let filter = {};
    if (moduleId) filter.moduleId = moduleId;
    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة امتحان جديد
router.post('/', async (req, res) => {
  try {
    // تأكد من استقبال البيانات من الـ Front-end
    const newExam = new Exam(req.body);
    await newExam.save();
    res.status(201).json(newExam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;