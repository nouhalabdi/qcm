const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  year: { type: String, required: true }, // مثلاً: 1ère Année
  semester: { type: String, required: true },
  imageUrl: { type: String, default: '' }, // صورة الوحدة التي طلبتها (لأناقة الصفحة)
}, { timestamps: true });

module.exports = mongoose.model('Module', ModuleSchema);