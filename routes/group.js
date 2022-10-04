const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  createGroupRule,
  addParticipantsRule,
  deleteParticipantsRule,
  leaveGroupRule,
} = require('../middlewares/validation');
const { tryCatch } = require('../utils/helper');
const {
  createGroup,
  getGroup,
  getGroupParticipants,
  addParticipants,
  deleteParticipants,
  leaveGroup,
} = require('../controllers/group');

router.use(checkJwt);

router.get('/group', tryCatch(getGroup));

router.get('/group/participants', tryCatch(getGroupParticipants));

router.use(checkJson);

router.route('/group').post(createGroupRule(), tryCatch(createGroup));

router
  .route('/group/participants')
  .put(addParticipantsRule(), tryCatch(addParticipants))
  .delete(deleteParticipantsRule(), tryCatch(deleteParticipants));

router.put('/group/leave', leaveGroupRule(), tryCatch(leaveGroup));

module.exports = router;
