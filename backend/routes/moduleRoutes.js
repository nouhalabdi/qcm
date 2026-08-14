const express = require('express');
const router = express.Router();
const Module = require('../models/Module');

// 1. جلب جميع الوحدات (يمكن تصفيتها حسب السنة)
router.get('/', async (req, res) => {
  try {
    const { year, semester } = req.query;
    let filter = {};
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    
    const modules = await Module.find(filter).sort({ createdAt: -1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 2. جلب وحدة واحدة بواسطة الـ ID (تمت الإضافة)
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module non trouvé' });
    }
    res.json(module);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. إضافة وحدة جديدة
router.post('/', async (req, res) => {
  try {
    const newModule = new Module(req.body);
    await newModule.save();
    res.status(201).json(newModule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. تعديل وحدة
router.put('/:id', async (req, res) => {
  try {
    const updatedModule = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedModule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. حذف وحدة
router.delete('/:id', async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.json({ message: 'Module supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;