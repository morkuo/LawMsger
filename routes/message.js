const router = require('express').Router();
const checkJwt = require('../middlewares/checkJwt');
const { tryCatch } = require('../utils/helper');
const {
  getHistoryMessages,
  getMoreMessages,
  getSuggestions,
  getMatchedClauses,
} = require('../controllers/message');

router.get('/message', checkJwt, tryCatch(getHistoryMessages));

router.get('/message/more', checkJwt, tryCatch(getMoreMessages));

router.get('/message/suggest', tryCatch(getSuggestions));

router.get('/message/match', tryCatch(getMatchedClauses));

module.exports = router;
