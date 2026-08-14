const mongoose = require('mongoose');

const TDSchema = new mongoose.Schema({
  title: { type: String, required: true }, // عنوان الـ TD (مثلاً: TD 1: Anatomie)
  description: { type: String, default: '' }, // وصف مختصر للـ TD
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true }, // الربط بالدرس
  pdfUrl: { type: String, default: '' }, // رابط ملف الـ TD (الأسئلة)
  correctionUrl: { type: String, default: '' }, // رابط ملف تصحيح الـ TD
}, { timestamps: true });

module.exports = mongoose.model('TD', TDSchema);