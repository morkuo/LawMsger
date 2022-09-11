const { jwtVerify } = require('../utils/helper');
const { getUserDataByEmail } = require('../models/user');
require('dotenv').config();

async function checkJwt(req, res, next) {
  let token = req.get('Authorization');

  //check authorization type
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'no token found' });
  }

  //remove type string
  token = token.replace('Bearer ', '');

  //parse token to retrieve userdata
  try {
    req.userdata = await jwtVerify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'wrong token' });
  }

  next();
}

async function checkJson(req, res, next) {
  if (!req.is('application/json')) return res.status(400).json({ error: 'not json type' });
  next();
}

async function checkRole(req, res, next) {
  if (req.userdata.role !== -1) return res.status(403).json({ error: 'forbidden' });
  next();
}

module.exports = { checkJwt, checkJson, checkRole };
