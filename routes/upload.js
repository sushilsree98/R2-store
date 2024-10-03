const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController.js');
const multer = require('multer');
const upload = multer();

router.post('/', upload.single('file'), uploadController.upload);
router.get('/events/:uploadId', uploadController.uploadEventStream);

module.exports = router

