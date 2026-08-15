const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { register, login, googleLogin } = require('../controllers/authController');

// ✅ تمت إزالة أي كود خاص بـ CORS هنا، لأن الميدلوير العام في server.js يتولى كل شيء

// مسار التسجيل
router.post('/register', register);
// مسار الدخول
router.post('/login', login);
// مسار دخول Google
router.post('/google', googleLogin);

// مسار التحقق من الجلسة
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé (Token manquant)' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.id || decoded._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable dans la base' });
    }

    res.json(user);
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
});

module.exports = router;