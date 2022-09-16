const es = require('../utils/es');

async function suggestions(input, index) {
  const result = await es.search({
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
    return result.suggest.suggestions[0].options.map(option => option.text);
  }

  //clauses suggestion
  const suggestions = result.suggest.suggestions[0].options.map(option => ({
    title: option._source.suggest.input.replace(option._source.number, ''),
    number: option._source.number,
    body: option._source.body,
  }));

  return suggestions;
}

async function matchedClauses(input) {
  const now = new Date();
  const origin = now.toISOString();

  const {
    hits: { hits: result },
  } = await es.search({
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
    body: option._source.body,
  }));

  return matchclauses;
}

module.exports = {
  suggestions,
  matchedClauses,
};
