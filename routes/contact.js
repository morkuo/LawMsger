const router = require('express').Router();
const { checkJwt } = require('../middlewares/validation');
const { tryCatch } = require('../utils/helper');
const { getAllContacts, getStarContacts } = require('../controllers/contact');

router.use(checkJwt);

router.get('/contact', tryCatch(getAllContacts));
router.get('/contact/star', tryCatch(getStarContacts));

module.exports = router;
