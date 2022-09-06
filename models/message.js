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
    // console.log(input);
    return result.suggest.suggestions[0].options.map(option => option.text);
  }

  // console.log(input);

  // console.log(result.suggest.suggestions[0].options[0]._source.suggest.input);

  //clauses suggestion
  const suggestions = result.suggest.suggestions[0].options.map(option => ({
    title: option._source.suggest.input,
    number: option._source.number,
    body: option._source.body,
  }));

  return suggestions;
}

async function matchedClauses(input) {
  const {
    hits: { hits: result },
  } = await es.search({
    index: 'matchedclauses',
    body: {
      size: 5,
      query: {
        match: {
          body: `${input}`,
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
