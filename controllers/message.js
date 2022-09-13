const es = require('../utils/es');
const { suggestions, matchedClauses } = require('../models/message');
require('dotenv').config;
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({ region: 'ap-northeast-1' });

const messageSize = 15;

async function generateS3PresignedUrl(result) {
  let filesInfo = [];
  for (let message of result) {
    const files = await JSON.parse(message._source.files);

    if (files.data.length !== 0) {
      for (let file of files.data) {
        //Generate S3 Presigned url to open an access window (control by expiresIn)
        const command = new GetObjectCommand({
          Bucket: 'law-msger',
          Key: `${file.key}`,
          Expires: 60 * 60,
          ResponseContentDisposition: `attachment; filename="${file.originalName}"`,
        });
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });

        filesInfo.push({ location: url, key: file.key, originalName: file.originalName });
      }
      message._source.files = JSON.stringify({ data: filesInfo });
      filesInfo = [];
    }
  }

  return result.map(doc => doc._source);
}

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

  // console.log(resultUpdate);

  const messages = await generateS3PresignedUrl(result);

  const response = {
    data: messages,
  };

  res.json(response);

  //after responsing messages, update isRead to true
  const resultUpdate = await es.updateByQuery({
    index: 'message',
    script: {
      source: `ctx._source.isRead = true`,
      lang: 'painless',
    },
    query: {
      bool: {
        filter: [
          { term: { sender_id: contactUserId } },
          { term: { receiver_id: req.userdata.id } },
          { term: { isRead: false } },
        ],
      },
    },
  });
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

  const messages = await generateS3PresignedUrl(result);

  const response = {
    data: messages,
  };

  res.json(response);
};

const getGroupHistoryMessages = async (req, res) => {
  const { groupId } = req.query;

  //check whether the user is member of the group
  const {
    hits: {
      hits: [resultUser],
    },
  } = await es.search({
    index: 'group',
    sort: {
      'created_at': 'desc',
    },
    query: {
      term: { _id: groupId },
    },
  });

  console.log(resultUser);

  if (!resultUser._source.participants.includes(req.userdata.id)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const {
    hits: { hits: result },
  } = await es.search({
    index: 'groupmessage',
    size: messageSize,
    sort: {
      'created_at': 'desc',
    },
    query: {
      term: { group_id: groupId },
    },
  });

  // console.log(resultUpdate);

  const messages = await generateS3PresignedUrl(result);

  const response = {
    data: messages,
  };

  res.json(response);

  //after responsing messages, update isRead, add current user into isRead
  // const resultUpdate = await es.updateByQuery({
  //   index: 'message',
  //   script: {
  //     source: `ctx._source.isRead = true`,
  //     lang: 'painless',
  //   },
  //   query: {
  //     bool: {
  //       filter: [
  //         { term: { sender_id: contactUserId } },
  //         { term: { receiver_id: req.userdata.id } },
  //         { term: { isRead: false } },
  //       ],
  //     },
  //   },
  // });
};

const uploadFiles = async (req, res) => {
  const filesInfo = [];
  for (let file of req.files) {
    //S3 Presigned url
    const command = new GetObjectCommand({
      Bucket: file.bucket,
      Key: `${file.key}`,
      Expires: 60 * 60,
      ResponseContentDisposition: `attachment; filename="${file.originalname}"`,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 30 });

    filesInfo.push({ location: url, key: file.key, originalName: file.originalname });
  }

  res.json({ data: filesInfo });
};

module.exports = {
  getHistoryMessages,
  getGroupHistoryMessages,
  getMoreMessages,
  uploadFiles,
};
