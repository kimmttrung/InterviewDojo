require('dotenv/config');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

async function main() {
  const result = await pool.query(`
    select
      u.id as user_id,
      u.email,
      u.name,
      mp.id as mentor_profile_id,
      mp.approval_status,
      count(distinct cp.id)::int as plan_count,
      count(distinct s.id)::int as slot_count
    from users u
    left join mentor_profiles mp on mp.user_id = u.id
    left join coaching_plans cp on cp.mentor_id = mp.id and cp.is_active = true
    left join slots s on s.mentor_id = u.id
    where u.role = 'MENTOR'
    group by u.id, u.email, u.name, mp.id, mp.approval_status
    order by u.id
  `);

  console.table(result.rows);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
