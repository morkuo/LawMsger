const es = require('../utils/es');

async function suggestions(organizationId, input, index) {
  const {
    suggest: {
      suggestions: [result],
    },
  } = await es[organizationId].search({
    index: index || 'words',
    body: {
      suggest: {
        suggestions: {
          prefix: `${input}`,
          completion: {
            field: 'suggest',
          },
        },
      },
    },
  });

  //words suggestion
  if (!index) {
    return result.options.map(option => option.text);
  }

  //clauses suggestion
  const suggestions = result.options.map(option => ({
    title: option._source.suggest.input.replace(option._source.number, ''),
    number: option._source.number,
    body: option._source.body,
  }));

  return suggestions;
}

async function matchedClauses(organizationId, input) {
  const now = new Date();
  const origin = now.toISOString();

  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'matchedclauses',
    body: {
      size: 5,
      query: {
        function_score: {
          query: {
            match: {
              body: `${input}`,
            },
          },
          functions: [
            {
              exp: {
                last_searched: {
                  origin,
                  offset: '7d',
                  scale: '25d',
                  decay: 0.2,
                },
              },
            },
          ],
          boost_mode: 'multiply',
        },
      },
    },
  });

  // clauses suggestion
  const matchclauses = result.map(option => ({
    title: option._source.title,
    number: option._source.number,
    body: option._source.body.replace(`${option._source.title}${option._source.number}：`, ''),
  }));

  return matchclauses;
}

module.exports = {
  suggestions,
  matchedClauses,
};
