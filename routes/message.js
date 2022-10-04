const router = require('express').Router();
const { checkJwt } = require('../middlewares/validation');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const {
  getPrivateMessages,
  getPrivateMessagesMore,
  getGroupMessages,
  getGroupMessagesMore,
  uploadFiles,
} = require('../controllers/message');

router.use(checkJwt);

router.get('/message', tryCatch(getPrivateMessages));

router.get('/message/more', tryCatch(getPrivateMessagesMore));

router.get('/groupmessage', tryCatch(getGroupMessages));

router.get('/groupmessage/more', tryCatch(getGroupMessagesMore));

router.post('/message/upload', upload.any('images'), tryCatch(uploadFiles));

module.exports = router;
