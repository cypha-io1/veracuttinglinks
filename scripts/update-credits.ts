import { pool } from '../lib/db.js';

async function updateSMSCredits() {
  try {
    const res = await pool.query(
      `UPDATE "CommunicationCreditBalance" SET "smsCredits" = 108 WHERE id = 1 RETURNING *`
    );
    console.log('Updated CommunicationCreditBalance:', res.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error updating credits:', error);
    process.exit(1);
  }
}

updateSMSCredits();
