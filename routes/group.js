const router = require('express').Router();
const { checkJwt } = require('../middlewares/validation');
const { tryCatch } = require('../utils/helper');
const { getGroup } = require('../controllers/group');

router.get('/group', tryCatch(checkJwt), tryCatch(getGroup));

module.exports = router;
