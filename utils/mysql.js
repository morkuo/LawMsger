const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool(
  {
    host: process.env.USER_DB_HOST,
    user: process.env.USER_DB_USERNAME,
    password: process.env.USER_DB_PASSWORD,
    database: process.env.USER_DB_NAME,
  },
  { debug: true }
);

const promisePool = pool.promise();

checkConnection().then(connection => {
  if (connection) console.log('MySQL connected');
});

async function checkConnection() {
  const sql = `SELECT 1`;
  const [result] = await promisePool.execute(sql);

  if (result[0]['1'] === 1) return 1;
  else return 0;
}

module.exports = { promisePool, pool, checkConnection };
