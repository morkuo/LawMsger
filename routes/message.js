const router = require('express').Router();
const { checkJwt } = require('../middlewares/validation');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const { getHistoryMessages, getMoreMessages, uploadFiles } = require('../controllers/message');

router.get('/message', tryCatch(checkJwt), tryCatch(getHistoryMessages));

router.get('/message/more', tryCatch(checkJwt), tryCatch(getMoreMessages));

router.post('/message/upload', tryCatch(checkJwt), upload.any('images'), tryCatch(uploadFiles));

module.exports = router;
