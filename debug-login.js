const bcrypt = require('bcrypt');
const db = require('./app/db');

async function test() {
  const staff = await db.oneOrNone('SELECT * FROM council_staff WHERE username = $1', ['admin']);
  console.log('Staff found:', !!staff);
  if (!staff) { process.exit(1); }
  console.log('Stored hash:', staff.password);
  const match = await bcrypt.compare('Password123', staff.password);
  console.log('Password123 matches:', match);

  // Also test the full loginAny flow
  const jobs = require('./app/jobs/data');
  const result = await jobs.push({ type: jobs.TYPE_LOGIN_ANY, login: 'admin', password: 'Password123' });
  console.log('loginAny result:', JSON.stringify(result));
  process.exit(0);
}

test().catch(e => { console.error(e.message); process.exit(1); });
