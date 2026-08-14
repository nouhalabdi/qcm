const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // ✅ Ajouté pour vérifier le token
const User = require('../models/User'); // ✅ Ajouté pour interroger la base de données
const { register, login, googleLogin } = require('../controllers/authController');

// مسار التسجيل
router.post('/register', register);
// مسار الدخول
router.post('/login', login);
// مسار دخول Google
router.post('/google', googleLogin);

// ✅ مسار جديد للتحقق من صحة الجلسة وحماية حساب الأدمن
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé (Token manquant)' });
    }

    // استخدم نفس مفتاح التشفير الموجود في authController
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    // جلب بيانات المستخدم الحقيقية من قاعدة البيانات (بدون كلمة المرور)
    const user = await User.findById(decoded.id || decoded._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable dans la base' });
    }

    // إرجاع البيانات الصحيحة (بما في ذلك role: 'admin')
    res.json(user);
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
});

module.exports = router;