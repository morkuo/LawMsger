const router = require('express').Router();
const checkJwt = require('../middlewares/checkJwt');
const { tryCatch } = require('../utils/helper');
const { signIn, createUser, getUserData } = require('../controllers/user');

router.post('/user', checkJwt, tryCatch(createUser));

router.post('/user/signin', tryCatch(signIn));

router.get('/user', tryCatch(checkJwt), tryCatch(getUserData));

module.exports = router;
