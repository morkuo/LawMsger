const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  createGroupRule,
  updateParticipantsRule,
  leaveGroupRule,
} = require('../middlewares/validation');
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

router.use(checkJson);

router
  .route('/group')
  .post(createGroupRule(), tryCatch(createGroup))
  .put(updateParticipantsRule(), tryCatch(updateParticipants));

router.put('/group/leave', leaveGroupRule(), tryCatch(leaveGroup));

module.exports = router;
