const {
  getPrivateMessagesByUserId,
  getPrivateMessagesByUserIdMore,
  getGroupMessagesByGroupId,
  getGroupMessagesByGroupIdMore,
  updatePrivateMessagesIsRead,
  updateGroupMessagesIsRead,
} = require('../models/message');
const { getGroupById } = require('../models/group');
require('dotenv').config;
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3, GetObjectCommand } = require('../utils/aws');

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
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

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

const getPrivateMessagesMore = async (req, res) => {
  const { contactUserId, baselineTime } = req.query;
  const { organizationId, id: userId } = req.userdata;

  const result = await getPrivateMessagesByUserIdMore(
    organizationId,
    userId,
    contactUserId,
    baselineTime
  );

  const messages = await generateS3PresignedUrl(result);

  res.json({
    data: messages,
  });
};

const getGroupMessages = async (req, res) => {
  const { groupId } = req.query;
  const { organizationId, id: userId } = req.userdata;

  // check whether the user is member of the group
  const resultUser = await getGroupById(organizationId, groupId);
  if (!resultUser._source.participants.includes(userId)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const result = await getGroupMessagesByGroupId(organizationId, groupId);

  const messages = await generateS3PresignedUrl(result);

  await updateGroupMessagesIsRead(organizationId, userId, groupId);

  res.json({
    data: messages,
  });
};

const getGroupMessagesMore = async (req, res) => {
  const { groupId, baselineTime } = req.query;
  const { organizationId, id: userId } = req.userdata;

  const result = await getGroupMessagesByGroupIdMore(organizationId, groupId, baselineTime);

  const messages = await generateS3PresignedUrl(result);

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
    const url = await getSignedUrl(s3, command, { expiresIn: 30 });

    filesInfo.push({ location: url, key: file.key, originalName: file.originalname });
  }

  res.json({ data: filesInfo });
};

module.exports = {
  getPrivateMessages,
  getGroupMessages,
  getPrivateMessagesMore,
  getGroupMessagesMore,
  uploadFiles,
};
