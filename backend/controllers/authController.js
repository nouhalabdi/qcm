const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { notifyUser } = require('../utils/notify');

// ✅ دالة مساعدة: تبعث إشعار لكل الأدمنز (يمكن يكون عندك أكثر من أدمن)
async function notifyAllAdmins(io, { title, body }) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await notifyUser(io, admin._id, {
        title,
        body,
        conversationType: 'system',
        conversationTitle: title
      });
    }
  } catch (err) {
    console.error('❌ Erreur notification admin :', err);
  }
}

// 1. تسجيل طالب جديد (Register)
exports.register = async (req, res) => {
  try {
    const { username, email, password, year } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      year,
      isSubscribed: false // ❗ الحماية: مستخدم جديد غير مشترك
    });

    await newUser.save();

    // ✅ إشعار الأدمن بتسجيل طالب جديد
    const io = req.app.get('io');
    await notifyAllAdmins(io, {
      title: 'Nouvelle inscription 🎓',
      body: `${username} (${email}) vient de s'inscrire — Année : ${year}.`
    });

    res.status(201).json({ 
      message: "Inscription réussie ! Veuillez vous connecter.",
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. تسجيل الدخول (Login)
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    if (deviceId && !user.deviceIds.includes(deviceId)) {
      const isFirstDevice = user.deviceIds.length === 0;
      user.deviceIds.push(deviceId);
      await user.save();

      // ✅ إشعار الأدمن فقط إذا كان هذا جهاز إضافي (مش أول جهاز يسجل بيه الطالب)
      if (!isFirstDevice) {
        const io = req.app.get('io');
        await notifyAllAdmins(io, {
          title: 'Connexion depuis un nouvel appareil ⚠️',
          body: `${user.username} (${user.email}) s'est connecté depuis un nouvel appareil — ${user.deviceIds.length} appareil(s) au total.`
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: "Connexion réussie !",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        year: user.year,
        role: user.role,
        isSubscribed: user.isSubscribed
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. تسجيل الدخول باستخدام Google (جديد مع الحماية)
exports.googleLogin = async (req, res) => {
  try {
    const { email, displayName } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // إذا كان حسابًا جديدًا (لم يسجل من قبل)
      const newUser = new User({
        username: displayName || "Étudiant",
        email: email,
        password: "google_oauth_placeholder",
        year: "Non spécifié",
        isSubscribed: false, // ❗ الحماية: غير مشترك
        role: 'student'
      });
      user = await newUser.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        year: user.year,
        isSubscribed: user.isSubscribed
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};