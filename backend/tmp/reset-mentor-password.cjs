require('dotenv/config');

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const email = process.argv[2];
const password = process.argv[3] ?? '123456';

if (!email) {
  console.error('Usage: node tmp/reset-mentor-password.cjs <email> [password]');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

async function main() {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      update users
      set password = $1
      where email = $2
        and role = 'MENTOR'
      returning id, email, name, role
    `,
    [hashedPassword, email],
  );

  if (result.rowCount === 0) {
    throw new Error(`Mentor not found: ${email}`);
  }

  console.table(result.rows);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
