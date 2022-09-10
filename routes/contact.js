const router = require('express').Router();
const checkJwt = require('../middlewares/checkJwt');
const { tryCatch } = require('../utils/helper');
const { getAllContacts, getStarContacts } = require('../controllers/contact');

router.get('/contact', tryCatch(checkJwt), tryCatch(getAllContacts));
router.get('/contact/star', tryCatch(checkJwt), tryCatch(getStarContacts));

module.exports = router;
