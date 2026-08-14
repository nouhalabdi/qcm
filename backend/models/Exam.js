const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: { type: String, default: 'Examen du Module' },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  year: { type: String, required: true }, // e.g., 2023-2024
  durationMinutes: { type: Number, required: true },
  authorName: { type: String, default: 'Inconnu' },
  explanation: { type: String, default: '' },
  questions: [{ type: mongoose.Schema.Types.Mixed }] // تخزين الأسئلة التي تم إدخالها بصيغة JSON
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);