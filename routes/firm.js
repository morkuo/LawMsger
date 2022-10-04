const router = require('express').Router();
const { checkJwt, checkRole } = require('../middlewares/validation');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const { updateFirmPicture } = require('../controllers/firm');
require('dotenv').config();

router.post(
  '/firm/picture',
  tryCatch(checkJwt),
  checkRole,
  upload.any('images'),
  tryCatch(updateFirmPicture)
);

module.exports = router;
