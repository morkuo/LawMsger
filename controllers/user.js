const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const es = require('../utils/es');
const { promisePool } = require('../utils/mysql');
const { jwtSign } = require('../utils/helper');
const {
  getOrganizationUserDataByEmail,
  deleteOrganizationUserData,
  getESUserDataByEmail,
  deleteUserByEmail,
} = require('../models/user');
require('dotenv').config;

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({ region: 'ap-northeast-1' });

const saltRounds = 10;

const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { name, email, password } = req.body;
  const organizationId = process.env.NEW_USER_ORGANIZATION_ID || req.userdata.organizationId;
  const picture = '';

  // check whether the email exists in RDS or ES
  const emailList = await getOrganizationUserDataByEmail(email, organizationId);
  if (emailList.length !== 0) return res.status(409).json({ error: 'email exists' });

  const resultEmail = await getESUserDataByEmail(organizationId, email);
  if (resultEmail) return res.status(409).json({ error: 'email exists' });

  // hash password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const sql = `INSERT INTO user (email, password, organization_id) VALUES (?, ?, ?);`;
  const [resultSql] = await promisePool.execute(sql, [email, hashedPassword, organizationId]);

  const result = await es[organizationId].index({
    index: 'user',
    document: {
      name,
      email,
      password: hashedPassword,
      picture,
      role: +process.env.NEW_USER_ADMIN_ROLE || 1,
      socket_id: null,
    },
  });

  res.status(201).json({ data: 'created' });
};

const signIn = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { email, password, organizationName } = req.body;

  //check whether the email exists
  const sql = `SELECT * FROM user JOIN organization ON user.organization_id = organization.id WHERE user.email = ? AND organization.name = ?;`;
  const [resultSql] = await promisePool.execute(sql, [email, organizationName]);

  //get current user's organization id
  if (!resultSql[0]) return res.status(401).json({ error: 'wrong email or password' });
  const { organization_id: organizationId } = resultSql[0];
  const result = await getESUserDataByEmail(organizationId, email);

  //email does not exist
  if (!resultSql.length) return res.status(401).json({ error: 'wrong email or password' });
  if (!result) return res.status(401).json({ error: 'wrong email or password' });

  //check password is correct or not
  const isCorrectPassword = await bcrypt.compare(password, resultSql[0].password);
  if (!isCorrectPassword) return res.status(401).json({ error: 'wrong email or password' });

  // Generate Token String
  const jwtPayload = {
    id: result._id,
    name: result._source.name,
    email: result._source.email,
    picture: result._source.picture,
    role: result._source.role,
    organizationId: resultSql[0].id,
    created_at: result._source.created_at,
  };

  const jwtToken = await jwtSign(jwtPayload, process.env.JWT_SECRET, {
    expiresIn: +process.env.JWT_EXPIRAION,
  });

  // response to client
  const response = {
    data: {
      access_token: jwtToken,
      access_expired: process.env.JWT_EXPIRAION,
      user: jwtPayload,
    },
  };

  res.json(response);
};

const getUserData = async (req, res) => {
  const response = {
    data: req.userdata,
  };

  res.json(response);
};

// const getUserPicture = async (req, res) => {
//   const response = {
//     data: req.userdata,
//   };

//   res.json(response);
// };

const updateUserPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { oldPassword, newPassword, confirm } = req.body;

  if (newPassword !== confirm) return res.status(400).json({ error: 'new password should match' });

  //get old password
  const result = await getESUserDataByEmail(req.userdata.organizationId, req.userdata.email);

  //check password is correct or not
  const isCorrectPassword = await bcrypt.compare(oldPassword, result._source.password);
  if (!isCorrectPassword) return res.status(401).json({ error: 'wrong current password' });

  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  //update mysql
  const sql = `UPDATE user SET password = ? WHERE organization_id = ? AND email = ?`;
  const resultSql = await promisePool.execute(sql, [
    hashedPassword,
    req.userdata.organizationId,
    req.userdata.email,
  ]);

  const resultUpdate = await es[req.userdata.organizationId].updateByQuery({
    index: 'user',
    script: {
      lang: 'painless',
      source: `ctx._source.password = '${hashedPassword}'`,
    },
    query: {
      term: { '_id': req.userdata.id },
    },
  });

  if (!resultUpdate.updated) return res.status(500).json({ error: 'failed' });

  res.json({
    data: 'updated',
  });
};

const updateUserPicture = async (req, res) => {
  const [profilePicture] = req.files;

  if (!profilePicture) return res.status(400).json({ error: 'no picture found' });

  const key = profilePicture.key;

  const result = await es[req.userdata.organizationId].updateByQuery({
    index: 'user',
    script: {
      lang: 'painless',
      source: `ctx._source.picture = '${key}'`,
    },
    query: {
      term: { '_id': req.userdata.id },
    },
  });

  if (!result.updated) return res.status('500').json({ error: 'server error' });

  const command = new GetObjectCommand({
    Bucket: profilePicture.bucket,
    Key: `${profilePicture.key}`,
    Expires: 60 * 60,
  });
  const url = await getSignedUrl(client, command, { expiresIn: 30 });

  res.json({
    data: 'updated',
    picture: { location: url, key: profilePicture.key },
  });
};

const deleteUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { email } = req.body;

  //check whether the email exists
  const resultEmail = await getESUserDataByEmail(req.userdata.organizationId, email);

  if (!resultEmail) return res.status(400).json({ error: 'email not found' });

  const resultSql = await deleteOrganizationUserData(req.userdata.organizationId, email);
  const resultUser = await deleteUserByEmail(req.userdata.organizationId, 'user', email);

  if (!resultUser.deleted) return res.status(500).json({ error: 'failed' });

  const resultStarred = await es[req.userdata.organizationId].deleteByQuery({
    index: 'star',
    body: {
      query: {
        term: { 'contact_user_id': resultEmail._id },
      },
    },
  });

  res.json({ data: 'deleted' });
};

module.exports = {
  signIn,
  createUser,
  getUserData,
  updateUserPassword,
  updateUserPicture,
  deleteUser,
};
