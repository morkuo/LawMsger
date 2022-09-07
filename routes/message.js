const router = require('express').Router();
const checkJwt = require('../middlewares/checkJwt');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const {
  getHistoryMessages,
  getMoreMessages,
  getSuggestions,
  getMatchedClauses,
  uploadFiles,
} = require('../controllers/message');

router.get('/message', checkJwt, tryCatch(getHistoryMessages));

router.get('/message/more', checkJwt, tryCatch(getMoreMessages));

router.get('/message/suggest', tryCatch(getSuggestions));

router.get('/message/match', tryCatch(getMatchedClauses));

router.post('/message/upload', upload.any('images'), tryCatch(uploadFiles));

module.exports = router;
