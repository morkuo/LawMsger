const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({ region: 'ap-northeast-1' });

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'law-msger',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(
        null,
        Date.now().toString() + `-${uuidv4().slice(0, 5)}` + path.extname(file.originalname)
      );
    },
  }),
  limits: {
    files: 3,
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  upload,
};
