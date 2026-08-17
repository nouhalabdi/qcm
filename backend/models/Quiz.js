const mongoose = require('mongoose');

// سؤال واحد (مدمج داخل الـ Quiz مباشرة)
const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, default: '' }, // ✅ غير إلزامي، يمكن أن يكون فارغاً
  explanation: { type: String, default: '' },
  explanationImages: [{ type: String }],
  questionImages: [{ type: String }] // ✅ إضافة صور السؤال
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  type: { type: String, enum: ['lesson', 'module', 'simulation'], required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  year: { type: String, required: true },
  title: { type: String, default: '' }, // ✅ إضافة عنوان اختياري للـ QCM
  durationMinutes: { type: Number, required: true },
  authorName: { type: String, default: 'Inconnu' },
  correctionMode: { type: String, enum: ['immediate', 'deferred'], required: true },
  questions: [QuestionSchema],
  isIA: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
