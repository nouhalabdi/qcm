const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz'); // ✅ استخدام موديل Quiz بدلاً من QuizQuestion

// GET /api/stats - إحصائيات حقيقية للوحة تحكم الأدمن
router.get('/', async (req, res) => {
  try {
    // 1. عدد الطلبة الكلي (بلا الأدمن)
    const totalStudents = await User.countDocuments({ role: { $ne: 'admin' } });

    // 2. عدد الطلبة المشتركين (isSubscribed: true)
    const totalSubscribed = await User.countDocuments({ role: { $ne: 'admin' }, isSubscribed: true });

    // 3. عدد الوحدات (Modules)
    const totalModules = await Module.countDocuments();

    // 4. عدد الامتحانات (QCMs) الكلي – نستخدم Quiz.countDocuments()
    const totalQuizzes = await Quiz.countDocuments();

    // 5. منحنى شهري حقيقي: الطلبة الجداد + الامتحانات المضافة (لآخر 7 أشهر)
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // عدد الطلبة المسجلين شهرياً
    const registrations = await User.aggregate([
      { $match: { role: { $ne: 'admin' }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // عدد الامتحانات (Quizzes) المضافة شهرياً
    const quizzesAdded = await Quiz.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyRegistrations = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const foundStudents = registrations.find(
        r => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1
      );
      const foundQuizzes = quizzesAdded.find(
        r => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1
      );
      monthlyRegistrations.push({
        name: monthNames[d.getMonth()],
        students: foundStudents ? foundStudents.count : 0,
        quizzes: foundQuizzes ? foundQuizzes.count : 0
      });
    }

    res.json({
      totalStudents,
      totalSubscribed,
      totalModules,
      totalQuizQuestions: totalQuizzes, // ✅ تم تغيير الاسم للحفاظ على التوافق مع الواجهة
      monthlyRegistrations
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;