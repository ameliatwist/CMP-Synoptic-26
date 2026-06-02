initOptions = {
    shema: "Schema name here"
}
const pgp = require("pg-promise")();

const db = pgp({
  user: "",
  host: "",
  database: "",
  password: "",
  port: 4444,
});

module.exports = db;