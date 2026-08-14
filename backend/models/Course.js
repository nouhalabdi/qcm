const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  year: { type: String, required: true }, // 1ère, 2ème, etc.
  moduleName: { type: String, required: true },
  pdfUrl: { type: String }, // رابط ملف PDF
  videoUrl: { type: String }, // رابط فيديو (YouTube أو Vimeo)
  imageUrl: { type: String }, // صورة توضيحية
  summary: { type: String }, // ملخص الدرس
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);