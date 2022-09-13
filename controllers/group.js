const es = require('../utils/es');
require('dotenv').config;

const getGroup = async (req, res) => {
  const {
    hits: { hits: result },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: {
          participants: req.userdata.id,
        },
      },
    },
  });

  //   console.log(result);

  //   const unreadMessagesQueryBody = users.reduce((querybody, user) => {
  //     querybody.push({ index: 'message' }),
  //       querybody.push({
  //         query: {
  //           bool: {
  //             filter: [
  //               { term: { sender_id: user._id } },
  //               { term: { receiver_id: req.userdata.id } },
  //               { term: { isRead: false } },
  //             ],
  //           },
  //         },
  //       });

  //     return querybody;
  //   }, []);

  //   const { responses } = await es.msearch({
  //     body: unreadMessagesQueryBody,
  //   });

  //   const unreadMessagesCount = responses.map(response => response.hits.total.value);

  let i = 0;
  const groups = result.map(group => ({
    id: group._id,
    host: group._source.host,
    name: group._source.name,
    participants: group._source.participants,
    // unread: unreadMessagesCount[i++],
  }));

  res.json(groups);
};

module.exports = { getGroup };