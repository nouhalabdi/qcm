const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'reussite-qcms',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'],
    resource_type: 'auto'
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }
    const fileUrl = req.file.path || req.file.secure_url;
    console.log('📁 Fichier uploadé sur Cloudinary:', req.file.filename);
    console.log('🔗 URL:', fileUrl);
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('❌ Erreur upload:', err);
    res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
  }
});

router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }
    const files = req.files.map(file => ({
      url: file.path || file.secure_url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    console.log(`📁 ${files.length} fichiers uploadés sur Cloudinary`);
    res.json({ files });
  } catch (err) {
    console.error('❌ Erreur upload multiple:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:publicId', async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ message: 'Fichier supprimé', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;