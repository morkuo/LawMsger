const router = require('express').Router();
const { checkJwt } = require('../middlewares/validation');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const {
  getPrivateMessages,
  getMoreMessages,
  uploadFiles,
  getGroupHistoryMessages,
  getGroupMoreMessages,
} = require('../controllers/message');

router.use(checkJwt);

router.get('/message', tryCatch(getPrivateMessages));

router.get('/message/more', tryCatch(getMoreMessages));

router.post('/message/upload', upload.any('images'), tryCatch(uploadFiles));

router.get('/groupmessage', tryCatch(getGroupHistoryMessages));

router.get('/groupmessage/more', tryCatch(getGroupMoreMessages));

module.exports = router;
