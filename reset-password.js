const bcrypt = require('bcrypt');
const db = require('./app/db');

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.log('Usage: node reset-password.js <username> <newpassword>');
  process.exit(1);
}

bcrypt.hash(newPassword, 10).then(hash => {
  return db.none('UPDATE users SET password = $1 WHERE username = $2', [hash, username]);
}).then(() => {
  console.log(`Password for "${username}" reset successfully.`);
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
