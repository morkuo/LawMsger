const { jwtVerify } = require('../utils/helper');
require('dotenv').config();

async function checkJwt(req, res, next) {
  let token = req.get('Authorization');

  //check authorization type
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Wrong Authorization type. No token found.' });
  }

  //remove type string
  token = token.replace('Bearer ', '');

  //parse token to retrieve userdata
  req.userdata = await jwtVerify(token, process.env.JWT_SECRET);

  next();
}

module.exports = checkJwt;
