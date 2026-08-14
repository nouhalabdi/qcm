const mongoose = require('mongoose');

// نسخة لغوية (فرنسية/إنجليزية) لسنة معينة
const LanguageVersionSchema = new mongoose.Schema({
  language: { type: String, enum: ['fr', 'en'], required: true },
  // جميع الحقول أصبحت مصفوفات من كائنات { url, name }
  pdf: [{ url: String, name: String }],
  video: [{ url: String, name: String }],
  summary: [{ url: String, name: String }],
  td: [{ url: String, name: String }],
  correction: [{ url: String, name: String }],
  other: [{ url: String, name: String }],
  ai: [{ url: String, name: String }],          // دروس / ملخصات IA (يمكن تخصيصها)
  aiSummary: [{ url: String, name: String }]    // ✅ Résumé IA (فئة منفصلة)
});

// محتوى خاص بسنة معينة
const YearContentSchema = new mongoose.Schema({
  year: { type: String, required: true },
  versions: [LanguageVersionSchema]
});

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: false, default: 'Sans titre' },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  order: { type: Number, required: true },
  yearContents: [YearContentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Lesson', LessonSchema);