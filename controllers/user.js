const { jwtSign, jwtVerify } = require('../utils/helper');
const { getUserDataByEmail, deleteUserByEmail } = require('../models/user');
const bcrypt = require('bcrypt');
const es = require('../utils/es');
require('dotenv').config;

const saltRounds = 10;

const createUser = async (req, res) => {
  if (req.userdata.role !== -1) return res.status(403).json({ error: 'Forbidden' });

  const { name, email, password } = req.body;
  const picture = '';

  // hash password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await es.index({
    index: 'user',
    document: {
      name,
      email,
      password: hashedPassword,
      picture,
      role: 1,
      socket_id: null,
    },
  });

  res.json({ data: 'Success' });
};

const signIn = async (req, res) => {
  const { email, password } = req.body;

  //check password

  //check whether the email exists
  const result = await getUserDataByEmail(email);

  //email does not exist
  if (!result) return res.status(403).json({ error: 'Wrong email or password' });

  //check password is correct or not
  const isCorrectPassword = await bcrypt.compare(password, result._source.password);
  if (!isCorrectPassword) return res.status(403).json({ error: 'Wrong email or password' });

  // Generate Token String
  const jwtPayload = {
    id: result._id,
    name: result._source.name,
    email: result._source.email,
    picture: result._source.picture,
    role: result._source.role,
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

const updateUserData = async (req, res) => {
  const { oldPassword, newPassword, confirm } = req.body;

  console.log(oldPassword, newPassword, confirm);

  if (!oldPassword || !newPassword || !confirm)
    return res.status(400).json({ error: 'no empty fields' });
  if (newPassword !== confirm) return res.status(400).json({ error: 'password shoud match' });

  //get old password
  const result = await getUserDataByEmail(req.userdata.email);

  //check password is correct or not
  const isCorrectPassword = await bcrypt.compare(oldPassword, result._source.password);
  if (!isCorrectPassword) return res.status(403).json({ error: 'wrong password' });

  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  const resultUpdate = await es.updateByQuery({
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
    data: 'success',
  });
};

const deleteUser = async (req, res) => {
  if (req.userdata.role !== -1) return res.status(403).json({ error: 'forbidden' });

  const { email } = req.body;

  //check whether the email exists
  const resultEmail = await getUserDataByEmail(email);

  if (!resultEmail) return res.status(400).json({ error: 'email not found' });

  const resultUser = await deleteUserByEmail('user', email);

  const resultStarred = await es.deleteByQuery({
    index: 'star',
    body: {
      query: {
        term: { 'contact_user_id': resultEmail._id },
      },
    },
  });

  if (!resultUser.deleted) return res.status(400).json({ error: 'failed' });

  res.json({ data: 'deleted' });
};

module.exports = { signIn, createUser, getUserData, updateUserData, deleteUser };
