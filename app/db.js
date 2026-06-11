
const pgp = require("pg-promise")();

const db = pgp({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ecowaste",
  password: process.env.DB_PASSWORD || "QwErTy987",
  port: process.env.DB_PORT || 5432,
});

module.exports = db;
