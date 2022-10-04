const router = require('express').Router();
const { checkJwt } = require('../middlewares/validation');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const {
  getHistoryMessages,
  getMoreMessages,
  uploadFiles,
  getGroupHistoryMessages,
  getGroupMoreMessages,
} = require('../controllers/message');

router.use(tryCatch(checkJwt));

router.get('/message', tryCatch(getHistoryMessages));

router.get('/message/more', tryCatch(getMoreMessages));

router.post('/message/upload', upload.any('images'), tryCatch(uploadFiles));

router.get('/groupmessage', tryCatch(getGroupHistoryMessages));

router.get('/groupmessage/more', tryCatch(getGroupMoreMessages));

module.exports = router;
