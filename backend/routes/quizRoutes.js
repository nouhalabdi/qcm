const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// 1. جلب QCMs (avec filtre isIA)
router.get('/', async (req, res) => {
  try {
    const { lessonId, moduleId, type, isIA } = req.query;
    let filter = {};
    if (lessonId) filter.lessonId = lessonId;
    if (moduleId) filter.moduleId = moduleId;
    if (type) filter.type = type;
    if (isIA !== undefined) {
      filter.isIA = isIA === 'true'; // convertir string en booléen
    }

    const quizzes = await Quiz.find(filter).populate('lessonId').sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Ajouter un QCM
router.post('/', async (req, res) => {
  try {
    const newQuiz = new Quiz(req.body);
    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Modifier un QCM
router.put('/:id', async (req, res) => {
  try {
    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'QCM non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Supprimer un QCM
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'QCM non trouvé' });
    res.json({ message: 'QCM supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Récupérer un QCM par ID
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Examen non trouvé' });
    }
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Classement pour un QCM
router.get('/:id/ranking', async (req, res) => {
  try {
    const quizId = req.params.id;
    const users = await User.find({ 'completedQuizzes.quizId': quizId })
      .select('username pseudo year completedQuizzes');

    const rankings = users.map(user => {
      const completed = user.completedQuizzes.find(q => q.quizId.toString() === quizId);
      return {
        userId: user._id,
        username: user.username,
        pseudo: user.pseudo,
        year: user.year,
        score: completed ? Math.round((completed.score / 100) * 100) : 0
      };
    });

    rankings.sort((a, b) => b.score - a.score);
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;