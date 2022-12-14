const multer = require('multer');
const { s3 } = require('../utils/aws');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const apiMap = {
  'user/picture': profilePicture,
  'firm/picture': firmPicture,
  'message/upload': messageFile,
};
const bucketMap = {
  'user/picture': 'law-msger-frontend',
  'firm/picture': 'law-msger-frontend',
  'message/upload': 'law-msger',
};

function profilePicture(req, file, cb) {
  const isImage = checkFileType(file);

  if (!isImage) {
    const error = new Error('Only jpg gif png are allowed');
    error.name = 'MulterError';

    cb(null, false);
    cb(error);
  }

  cb(null, `profile_picture/${req.userdata.id}.jpg`);
}

function firmPicture(req, file, cb) {
  const isImage = checkFileType(file);

  if (!isImage) return;

  cb(null, `firm_picture/${req.userdata.organizationId}.jpg`);
}

function messageFile(req, file, cb) {
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

  cb(null, Date.now().toString() + `-${uuidv4().slice(0, 5)}` + path.extname(file.originalname));
}

function checkFileType(file) {
  const filetypes = /jpeg|jpg|png|gif/;

  const isImgExt = filetypes.test(path.extname(file.originalname).toLowerCase());
  const isImgType = filetypes.test(file.mimetype);

  if (isImgExt && isImgType) return true;

  return false;
}

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: function (req, file, cb) {
      const url = req.originalUrl.slice(5);
      const bucketName = bucketMap[url];
      cb(null, bucketName);
    },
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const url = req.originalUrl.slice(5);
      apiMap[url](req, file, cb);
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
