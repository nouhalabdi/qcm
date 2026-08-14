const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const { notifyUser } = require('../utils/notify');

// --- Récupérer tous les étudiants (pour l'admin) ---
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .populate({ path: 'completedQuizzes.quizId', select: 'type year moduleId lessonId' })
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Mettre à jour le profil (pour l'étudiant) ---
router.put('/profile', async (req, res) => {
  try {
    const { _id, username, phone, pseudo } = req.body;
    if (!_id) return res.status(400).json({ message: 'Identifiant utilisateur manquant.' });
    const updatedUser = await User.findByIdAndUpdate(_id, { username, phone, pseudo }, { new: true, runValidators: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
  }
});

// --- 1. Marquer un cours comme lu ---
router.put('/read/:lessonId', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const lessonId = req.params.lessonId;
    const alreadyRead = user.readLessons.some(
      item => item.lessonId && item.lessonId.toString() === lessonId
    );
    
    if (!alreadyRead) {
      user.readLessons.push({ 
        lessonId: lessonId, 
        readAt: new Date() 
      });
      
      user.markModified('readLessons');
      await user.save();
    }
    res.json({ message: 'Cours marqué comme lu' });
  } catch (err) { 
    console.error('Erreur lors du marquage de lecture:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// --- 2. Ajouter/Retirer un favori (leçon) ---
router.put('/favorite/:lessonId', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const index = user.favoriteLessons.indexOf(req.params.lessonId);
    if (index > -1) user.favoriteLessons.splice(index, 1);
    else user.favoriteLessons.push(req.params.lessonId);
    await user.save();
    res.json(user.favoriteLessons);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 2bis. Ajouter/Retirer un QCM des favoris ---
router.put('/favorite-quiz/:quizId', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const index = user.favoriteQuizzes.indexOf(req.params.quizId);
    if (index > -1) user.favoriteQuizzes.splice(index, 1);
    else user.favoriteQuizzes.push(req.params.quizId);
    await user.save();
    res.json(user.favoriteQuizzes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 3. Enregistrer une note ---
router.put('/quiz-note', async (req, res) => {
  try {
    const { userId, quizId, noteText, moduleId, type } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const existing = user.quizNotes.find(n => n.quizId.toString() === quizId);
    if (existing) {
      existing.noteText = noteText;
      if (moduleId) existing.moduleId = moduleId;
      if (type) existing.type = type;
    } else {
      user.quizNotes.push({ quizId, moduleId, type, noteText });
    }
    await user.save();
    res.json(user.quizNotes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/quiz-note/:quizId', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Identifiant utilisateur manquant.' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    user.quizNotes = user.quizNotes.filter(n => n.quizId.toString() !== req.params.quizId);
    await user.save();
    res.json(user.quizNotes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 4. Gérer la To-Do List ---
router.put('/todo', async (req, res) => {
  try {
    const { userId, todoList } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    user.todoList = todoList;
    await user.save();
    res.json(user.todoList);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 5. Annotations PDF ---
router.put('/annotation', async (req, res) => {
  try {
    const { userId, fileUrl, annotationData } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const existing = user.annotations.find(a => a.fileUrl === fileUrl);
    if (existing) existing.data = annotationData;
    else user.annotations.push({ fileUrl, data: annotationData });
    await user.save();
    res.json(user.annotations);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/annotation', async (req, res) => {
  try {
    const { userId, fileUrl } = req.query;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const annotation = user.annotations.find(a => a.fileUrl === fileUrl);
    res.json(annotation ? annotation.data : null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 6. ✅ Enregistrer un fichier personnalisé (version modifiée par l'étudiant) ---
router.put('/custom-file', async (req, res) => {
  try {
    const { userId, fileUrl, lessonId, year } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    user.customFiles.push({ fileUrl, originalLessonId: lessonId, year });
    await user.save();
    res.json(user.customFiles);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 7. Enregistrer le résultat d'un QCM ---
router.put('/quiz-result', async (req, res) => {
  try {
    const { userId, quizId, type, score, timeTaken } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    user.completedQuizzes.push({
      quizId,
      type,
      score,
      date: new Date(),
      timeTaken: timeTaken || 0
    });
    await user.save();

    res.json({ message: 'Score enregistré avec succès', score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 8. Profil + Statistiques réelles ---
router.get('/profile/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Identifiant utilisateur manquant.' });
    
    const user = await User.findById(userId)
      .populate('readLessons.lessonId')
      .populate('favoriteLessons')
      .populate('favoriteQuizzes')
      .populate('completedQuizzes.quizId');
      
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const modules = await Module.find({ year: user.year });
    const moduleIds = modules.map(m => m._id);
    const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });

    const lessonsRead = user.readLessons.length;
    const totalExamsCompleted = user.completedQuizzes.filter(q => q.type === 'module').length;
    const totalLessonQCMsCompleted = user.completedQuizzes.filter(q => q.type === 'lesson').length;
    const progress = totalLessons > 0 ? Math.round((lessonsRead / totalLessons) * 100) : 0;
    
    let averageScore = 0;
    if (user.completedQuizzes.length > 0) {
      const totalScore = user.completedQuizzes.reduce((acc, q) => acc + q.score, 0);
      averageScore = Math.round((totalScore / user.completedQuizzes.length) * 100);
    }

    res.json({
      progress, 
      completedExams: totalExamsCompleted, 
      completedLessonQCMs: totalLessonQCMsCompleted,
      averageScore, 
      lessonsRead, 
      totalLessons, 
      quizNotes: user.quizNotes,
      favoriteLessons: user.favoriteLessons, 
      favoriteQuizzes: user.favoriteQuizzes, 
      todoList: user.todoList,
      completedQuizzes: user.completedQuizzes,
      readLessons: user.readLessons,
      customFiles: user.customFiles
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Mettre à jour l'état de l'abonnement (pour l'admin) ---
router.put('/:userId', async (req, res) => {
  try {
    const { isSubscribed } = req.body;
    const before = await User.findById(req.params.userId).select('isSubscribed');
    if (!before) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const user = await User.findByIdAndUpdate(req.params.userId, { isSubscribed }, { new: true }).select('-password');
    if (!before.isSubscribed && isSubscribed) {
      const io = req.app.get('io');
      try {
        await notifyUser(io, user._id, {
          title: 'Abonnement activé',
          body: 'Votre abonnement a été activé ✅',
          conversationType: 'system',
          conversationTitle: 'Abonnement activé'
        });
      } catch (notifyErr) { console.error('Erreur de notification :', notifyErr); }
    }
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;