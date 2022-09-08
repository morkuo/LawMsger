const es = require('../utils/es');
const { suggestions, matchedClauses } = require('../models/message');
require('dotenv').config;

const messageSize = 15;

const getHistoryMessages = async (req, res) => {
  const { contactUserId } = req.query;

  const {
    hits: { hits: result },
  } = await es.search({
    index: 'message',
    size: messageSize,
    sort: {
      'created_at': 'desc',
    },
    query: {
      bool: {
        should: [
          {
            bool: {
              filter: [
                { term: { sender_id: req.userdata.id } },
                { term: { receiver_id: contactUserId } },
              ],
            },
          },
          {
            bool: {
              filter: [
                { term: { sender_id: contactUserId } },
                { term: { receiver_id: req.userdata.id } },
              ],
            },
          },
        ],
      },
    },
  });

  const messages = result.map(doc => doc._source);

  const response = {
    data: messages,
  };

  res.json(response);
};

const getMoreMessages = async (req, res) => {
  const { contactUserId, baselineTime } = req.query;

  // console.log(baselineTime);
  // const contactUserId = '5zes_oIBewLNoasY_gsd';

  const {
    hits: { hits: result },
  } = await es.search({
    index: 'message',
    size: 20,
    sort: {
      'created_at': 'desc',
    },
    query: {
      bool: {
        should: [
          {
            bool: {
              filter: [
                { term: { sender_id: req.userdata.id } },
                { term: { receiver_id: contactUserId } },
                {
                  range: {
                    created_at: {
                      lt: baselineTime,
                    },
                  },
                },
              ],
            },
          },
          {
            bool: {
              filter: [
                { term: { sender_id: contactUserId } },
                { term: { receiver_id: req.userdata.id } },
                {
                  range: {
                    created_at: {
                      lt: baselineTime,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const messages = result.map(doc => doc._source);

  const response = {
    data: messages,
  };

  res.json(response);
};

const getSuggestions = async (req, res) => {
  const { input, index } = req.query;

  const result = await suggestions(input, index);

  res.json(result);
};

const getMatchedClauses = async (req, res) => {
  const { input } = req.query;

  if (!input) return res.status(400).json({ error: 'input should not be empty' });

  const result = await matchedClauses(input);

  res.json(result);
};

const uploadFiles = async (req, res) => {
  const fileUrls = req.files.map(file => file.location);

  res.json({ data: fileUrls });
};

module.exports = {
  getHistoryMessages,
  getMoreMessages,
  getSuggestions,
  getMatchedClauses,
  uploadFiles,
};
