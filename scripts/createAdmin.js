require('dotenv').config();
const AdminUser = require('../src/models/AdminUser');
const { connectDB, disconnectDB } = require('../src/config/db');

function parseCliArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return null;
}

async function run() {
  const email = (
    parseCliArg('--email') ||
    process.env.INITIAL_ADMIN_EMAIL ||
    ''
  )
    .toLowerCase()
    .trim();
  const password =
    parseCliArg('--password') || process.env.INITIAL_ADMIN_PASSWORD || '';
  const name =
    parseCliArg('--name') ||
    process.env.INITIAL_ADMIN_NAME ||
    'Modu Pro Administrator';

  if (!email || !password) {
    console.error(
      'Usage: node scripts/createAdmin.js --email <email> --password <password> [--name "Admin Name"]\n' +
        'Or set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in server/.env'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Administrator password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();
    const passwordHash = await AdminUser.hashPassword(password);

    const admin = await AdminUser.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          email,
          passwordHash,
          role: 'super_admin',
          isActive: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(
      `[createAdmin] Provisioned administrator account: ${admin.name} <${admin.email}> (role: ${admin.role})`
    );
  } catch (err) {
    console.error('[createAdmin] Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();
