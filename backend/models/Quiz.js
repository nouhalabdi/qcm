const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  // 🔹 دعم إجابات متعددة
  correctAnswers: [{ type: String }], // مصفوفة الإجابات الصحيحة
  correctAnswer: { type: String, default: '' }, // للتوافق مع الإصدار القديم
  explanation: { type: String, default: '' },
  explanationImages: [{ type: String }],
  questionImages: [{ type: String }]
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  type: { type: String, enum: ['lesson', 'module', 'simulation'], required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  year: { type: String, default: '' },
  title: { type: String, default: '' },
  durationMinutes: { type: Number, required: true },
  authorName: { type: String, default: 'Inconnu' },
  correctionMode: { type: String, enum: ['immediate', 'deferred'], required: true },
  questions: [QuestionSchema],
  isIA: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
