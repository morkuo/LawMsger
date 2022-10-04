const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  createGroupRule,
  updateParticipantsRule,
  leaveGroupRule,
} = require('../middlewares/validation');
const { body: check } = require('express-validator');
const { tryCatch } = require('../utils/helper');
const {
  createGroup,
  getGroup,
  getGroupParticipants,
  updateParticipants,
  leaveGroup,
} = require('../controllers/group');

router.use(tryCatch(checkJwt));

router.get('/group', tryCatch(getGroup));

router.get('/group/participants', tryCatch(getGroupParticipants));

router.post('/group', tryCatch(checkJson), createGroupRule(), tryCatch(createGroup));

router.put('/group', tryCatch(checkJson), updateParticipantsRule(), tryCatch(updateParticipants));

router.put('/group/leave', tryCatch(checkJson), leaveGroupRule(), tryCatch(leaveGroup));

module.exports = router;
