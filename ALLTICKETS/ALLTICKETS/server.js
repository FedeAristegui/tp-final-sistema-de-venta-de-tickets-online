const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const assetsDir = path.join(__dirname, 'src', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assetsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `evento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se aceptan archivos PNG o JPG'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

app.post('/api/upload-evento-imagen', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const rutaAssets = `assets/${req.file.filename}`;
  
  res.json({
    success: true,
    ruta: rutaAssets,
    filename: req.file.filename
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de uploads escuchando en http://localhost:${PORT}`);
  console.log(`📁 Guardando imágenes en: ${assetsDir}`);
});
