const { getAllUser, getStarredUser, getStarredUserData } = require('../models/contact');
const { getUnreadMessages } = require('../models/message');
require('dotenv').config;

const getAllContacts = async (req, res) => {
  const { organizationId, id: currentUserId } = req.userdata;

  const result = await getAllUser(organizationId);

  const users = result.filter(user => user._id !== currentUserId);

  //no other users other than current user
  if (users.length === 0) return res.json(users);

  const userIds = users.map(user => user._id);

  const responses = await getUnreadMessages(organizationId, currentUserId, userIds);

  const unreadMessagesCount = responses.map(response => response.hits.total.value);

  let i = 0;
  const contacts = users
    .map(user => ({
      id: user._id,
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
      socket_id: global.hashTable[user._id],
      unread: unreadMessagesCount[i++],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json(contacts);
};

const getStarContacts = async (req, res) => {
  const { organizationId, id: currentUserId } = req.userdata;

  const resultStar = await getStarredUser(organizationId, currentUserId);

  if (resultStar.length === 0) return res.json(resultStar);

  const stars = resultStar.map(star => star._source.contact_user_id);

  const resultStarDetail = await getStarredUserData(organizationId, stars);

  if (stars.length === 0) return res.json(stars);

  const resultStarDetailIds = resultStarDetail.map(star => star._id);

  const responses = await getUnreadMessages(organizationId, currentUserId, resultStarDetailIds);

  const unreadMessagesCount = responses.map(response => response.hits.total.value);

  let i = 0;
  const starDetails = resultStarDetail
    .map(star => ({
      id: star._id,
      name: star._source.name,
      email: star._source.email,
      picture: star._source.picture,
      socket_id: global.hashTable[star._id],
      unread: unreadMessagesCount[i++],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json(starDetails);
};

module.exports = { getAllContacts, getStarContacts };
