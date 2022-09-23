async function getAllUser(organizationId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'user',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        match_all: {},
      },
    },
  });
  return result;
}

module.exports = {
  getAllUser,
};
