const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'reussite-qcms';
    let resource_type = 'auto';

    if (file.mimetype === 'application/pdf') {
      folder = 'reussite-qcms/pdfs';
      resource_type = 'raw';
    } else if (file.mimetype.startsWith('image/')) {
      folder = 'reussite-qcms/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'reussite-qcms/videos';
      resource_type = 'video';
    }

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: Date.now() + '-' + Math.random().toString(36).substring(2, 10),
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorise.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier recu.' });
    }

    console.log('Fichier uploade sur Cloudinary :', req.file.path);

    res.json({
      url: req.file.path,
      public_id: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('Erreur upload :', err);
    res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
  }
});

router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier recu.' });
    }

    const files = req.files.map(function (file) {
      return {
        url: file.path,
        public_id: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    res.json({ files: files });
  } catch (err) {
    console.error('Erreur upload multiple :', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:public_id', async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.public_id);
    const types = ['image', 'raw', 'video'];
    let deleted = false;

    for (let i = 0; i < types.length; i++) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: types[i],
        });
        if (result.result === 'ok') {
          deleted = true;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (deleted) {
      res.json({ message: 'Fichier supprime avec succes.' });
    } else {
      res.status(404).json({ error: 'Fichier non trouve sur Cloudinary.' });
    }
  } catch (err) {
    console.error('Erreur suppression Cloudinary :', err);
    res.status(500).json({ error: err.message });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (max 1GB).' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
