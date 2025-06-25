import { runStatement, runQuery } from '../connection.js';

export const addUserSecurityEnhancements = async () => {
  const sql = `
    /*
      # Add security enhancements to users table

      1. Changes
        - Add \`failed_login_attempts\` column to \`users\` table to track consecutive failed login attempts
        - Add \`lockout_until\` column to \`users\` table to store account lockout expiration time
        - Add \`password_reset_token\` column to \`users\` table for password reset functionality
        - Add \`password_reset_expires\` column to \`users\` table to store token expiration time
        - Add \`last_login\` column to \`users\` table to track user login activity
      
      2. Purpose
        - Enhance security by implementing account lockout after multiple failed login attempts
        - Enable secure password reset functionality
        - Track user login activity for security auditing
    */

    -- Add security columns to users table if they don't exist
    ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN lockout_until DATETIME DEFAULT NULL;
    ALTER TABLE users ADD COLUMN password_reset_token TEXT DEFAULT NULL;
    ALTER TABLE users ADD COLUMN password_reset_expires DATETIME DEFAULT NULL;
    ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL;

    -- Create index for password reset token lookups
    CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
  `;

  // Check if columns already exist before attempting to add them
  const checkColumnSql = `SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name = 'failed_login_attempts'`;
  
  try {
    const result = await runQuery(checkColumnSql);

    // Only run the migration if the column doesn't exist
    if (result[0].count === 0) {
      const statements = sql.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('/*'));
      for (const statement of statements) {
        if (statement.trim()) {
          await runStatement(statement.trim());
        }
      }
      console.log('✅ User security enhancements added successfully');
    } else {
      console.log('User security enhancements already exist');
    }
  } catch (error) {
    console.error('Error adding user security enhancements:', error);
    throw error;
  }
};