const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function hashPasswords() {
  const host = process.env.MYSQL_HOST === 'localhost' ? '127.0.0.1' : process.env.MYSQL_HOST;
  
  console.log("Connecting to the database...");
  const connection = await mysql.createConnection({
    host: host,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306')
  });

  try {
    console.log("Fetching users...");
    // We only select users whose password is NOT 'API Login google'
    // and whose password does not already start with bcrypt prefix '$2a$'
    const [users] = await connection.execute(
      `SELECT user_id, user_name, password 
       FROM users_data 
       WHERE password != 'API Login google' 
       AND password NOT LIKE '$2a$%'`
    );

    console.log(`Found ${users.length} users with plain-text passwords.`);

    for (const user of users) {
      console.log(`Hashing password for user: ${user.user_name} (ID: ${user.user_id})...`);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      await connection.execute(
        `UPDATE users_data SET password = ? WHERE user_id = ?`,
        [hashedPassword, user.user_id]
      );
      console.log(`Successfully updated password for user: ${user.user_name}`);
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}

hashPasswords();
