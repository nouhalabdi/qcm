const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// إعداد التخزين (حفظ الملفات في مجلد uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ فلترة أوسع: أي نوع صورة، فيديو، أو PDF (بدل قائمة مغلقة كانت ترفض فيديوهات كتيرة)
const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf';
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  if (isPdf || isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 } // ✅ 1 جيجا بدل 50 ميجا (كافي لفيديوهات الدروس)
});

// مسار رفع ملف واحد
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu ou type non autorisé.' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ معالج أخطاء Multer (حجم كبير جداً، نوع مرفوض...) - يرجع JSON بدل صفحة HTML
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;