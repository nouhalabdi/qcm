const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ✅ ===== حل CORS النهائي =====
// Middleware مخصص لـ CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('🟡 OPTIONS request:', req.url);
    return res.sendStatus(200);
  }
  next();
});

// CORS middleware إضافي
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// ✅ مسار اختبار
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CORS is working!',
    timestamp: new Date().toISOString()
  });
});

// ✅ الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ✅ إنشاء مجلد uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé');
}

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// ✅ مسار للتحقق من الملفات
app.get('/api/check-file/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: filePath, size: fs.statSync(filePath).size });
  } else {
    res.json({ exists: false });
  }
});

// ✅ Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('🟢 Client connecté:', socket.id);
  socket.on('join-user', (userId) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    console.log(`👤 Socket ${socket.id} rejoint user-${userId}`);
  });
  socket.on('join-room', (conversationId) => {
    socket.join(conversationId);
    console.log(`🔗 Socket ${socket.id} a rejoint la room ${conversationId}`);
  });
  socket.on('leave-room', (conversationId) => {
    socket.leave(conversationId);
  });
  socket.on('disconnect', () => {
    console.log('🔴 Client déconnecté:', socket.id);
  });
});

app.set('io', io);

// Import des routes
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const examRoutes = require('./routes/examRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const quizRoutes = require('./routes/quizRoutes');
const communityRoutes = require('./routes/communityRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/uploads', express.static(uploadsDir));

const User = require('./models/User');
const { notifyUser } = require('./utils/notify');

// ✅ مهمة مجدولة
cron.schedule('*/15 * * * *', async () => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const users = await User.find({
      todoList: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay },
          done: false,
          notified: false
        }
      }
    });

    for (const user of users) {
      const dueTasks = user.todoList.filter(t =>
        t.date >= startOfDay && t.date <= endOfDay && !t.done && !t.notified
      );
      if (dueTasks.length === 0) continue;

      await notifyUser(io, user._id, {
        title: 'Rappel To-Do List',
        body: dueTasks.length === 1
          ? `Rappel : "${dueTasks[0].text}" est prévu aujourd'hui 📝`
          : `Vous avez ${dueTasks.length} tâche(s) prévue(s) aujourd'hui 📝`,
        conversationType: 'system',
        conversationTitle: 'Rappel To-Do List'
      });

      dueTasks.forEach(t => { t.notified = true; });
      await user.save();
    }
  } catch (err) {
    console.error('❌ Erreur job cron:', err);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});