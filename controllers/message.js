const es = require('../utils/es');
const {
  getPrivateMessagesByUserId,
  getGroupMessagesByGroupId,
  updatePrivateMessagesIsRead,
  updateGroupMessagesIsRead,
} = require('../models/message');
const { getGroupById } = require('../models/group');
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
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
            file.originalName
          )}"`,
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

const getPrivateMessages = async (req, res) => {
  const { contactUserId } = req.query;
  const { organizationId, id: userId } = req.userdata;

  const result = await getPrivateMessagesByUserId(organizationId, userId, contactUserId);

  const messages = await generateS3PresignedUrl(result);

  await updatePrivateMessagesIsRead(organizationId, userId, contactUserId);

  res.json({
    data: messages,
  });
};

const getMoreMessages = async (req, res) => {
  const { contactUserId, baselineTime } = req.query;

  // console.log(baselineTime);
  // const contactUserId = '5zes_oIBewLNoasY_gsd';

  const {
    hits: { hits: result },
  } = await es[req.userdata.organizationId].search({
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

const getGroupMoreMessages = async (req, res) => {
  const { groupId, baselineTime } = req.query;

  const {
    hits: { hits: result },
  } = await es[req.userdata.organizationId].search({
    index: 'groupmessage',
    size: 20,
    sort: {
      'created_at': 'desc',
    },
    query: {
      bool: {
        filter: [
          { term: { group_id: groupId } },
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
  });

  const messages = await generateS3PresignedUrl(result);

  const response = {
    data: messages,
  };

  res.json(response);
};

const getGroupMessages = async (req, res) => {
  const { groupId } = req.query;
  const { organizationId, id: userId } = req.userdata;

  // check whether the user is member of the group
  const resultUser = getGroupById(organizationId, groupId);
  if (!resultUser._source.participants.includes(userId)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const result = await getGroupMessagesByGroupId(organizationId, groupId);

  const messages = await generateS3PresignedUrl(result);

  const messagesUnreadByUser = result
    .filter(msg => !msg._source.isRead.includes(userId))
    .map(msg => ({ term: { _id: msg._id } }));

  //update isRead, add current user into isRead
  await updateGroupMessagesIsRead(organizationId, userId, messagesUnreadByUser);

  res.json({
    data: messages,
  });
};

const uploadFiles = async (req, res) => {
  const filesInfo = [];

  if (!req.files) return res.status(400).json({ error: 'file error' });

  for (let file of req.files) {
    //S3 Presigned url
    const command = new GetObjectCommand({
      Bucket: file.bucket,
      Key: `${file.key}`,
      Expires: 60 * 60,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.originalname)}"`,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 30 });

    filesInfo.push({ location: url, key: file.key, originalName: file.originalname });
  }

  res.json({ data: filesInfo });
};

module.exports = {
  getPrivateMessages,
  getGroupMessages,
  getMoreMessages,
  getGroupMoreMessages,
  uploadFiles,
};
