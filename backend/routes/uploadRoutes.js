const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// ✅ تكوين Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'reussite-qcms', // اسم المجلد في Cloudinary
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'],
    resource_type: 'auto', // يكتشف تلقائياً نوع الملف (صورة، فيديو، PDF)
    public_id: (req, file) => {
      // توليد اسم فريد للملف
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = file.originalname.split('.').pop();
      return `${uniqueSuffix}-${file.originalname.substring(0, 20)}`;
    }
  }
});

// ✅ فلترة الملفات
const fileFilter = (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf';
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  
  if (isPdf || isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls PDF, images et vidéos sont acceptés.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 50 } // 50MB (Cloudinary gratuit permet jusqu'à 100MB)
});

// ✅ مسار رفع ملف واحد
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    // Cloudinary renvoie directement l'URL
    console.log('📁 Fichier uploadé sur Cloudinary:', req.file.filename);
    console.log('🔗 URL:', req.file.path);

    res.json({ 
      url: req.file.path, // URL du fichier sur Cloudinary
      public_id: req.file.filename, // ID du fichier (pour suppression future)
      format: req.file.format,
      bytes: req.file.size
    });

  } catch (err) {
    console.error('❌ Erreur upload Cloudinary:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ مسار رفع عدة ملفات
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const urls = req.files.map(file => ({
      url: file.path,
      public_id: file.filename,
      format: file.format,
      size: file.size
    }));

    res.json({ urls });

  } catch (err) {
    console.error('❌ Erreur upload multiple:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ مسار حذف ملف من Cloudinary
router.delete('/:public_id', async (req, res) => {
  try {
    const { public_id } = req.params;
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok') {
      res.json({ message: 'Fichier supprimé avec succès.' });
    } else {
      res.status(404).json({ error: 'Fichier non trouvé.' });
    }
  } catch (err) {
    console.error('❌ Erreur suppression Cloudinary:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ معالج الأخطاء
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (max 50MB).' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;