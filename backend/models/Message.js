const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },

  // ✅ مرفقات: صور أو PDF
  attachments: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'pdf'], required: true },
    name: { type: String, default: '' }
  }],

  // ✅ إعجابات (قائمة IDs الطلبة اللي عجبهم الرد)
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);