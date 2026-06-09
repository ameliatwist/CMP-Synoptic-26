const bcrypt = require('bcrypt');
const db = require('./app/db');

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.log('Usage: node reset-council-password.js <username> <newpassword>');
  process.exit(1);
}

bcrypt.hash(newPassword, 10).then(hash => {
  return db.none('UPDATE council_staff SET password = $1 WHERE username = $2', [hash, username]);
}).then(() => {
  console.log(`Council password for "${username}" reset successfully.`);
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
