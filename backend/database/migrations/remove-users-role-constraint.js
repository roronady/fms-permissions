import { runStatement, runQuery } from '../connection.js';

export const removeUsersRoleConstraint = async () => {
  /*
    # Remove role constraint from users table

    1. Changes
      - Remove the CHECK constraint on the role column in the users table
      - This allows for dynamic roles beyond the hardcoded 'admin', 'manager', and 'user'
    
    2. Purpose
      - Enable dynamic role creation and assignment
      - Support custom roles with specific permission sets
  */

  try {
    console.log('Starting migration to remove role constraint from users table...');

    // Since SQLite doesn't support dropping constraints directly,
    // we need to recreate the table without the constraint

    // First, check if the users table exists
    const tableExists = await runQuery(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `);

    if (tableExists.length === 0) {
      console.log('Users table does not exist, skipping migration');
      return;
    }

    // Get the current table schema
    const tableInfo = await runQuery(`PRAGMA table_info(users)`);
    
    // Start a transaction
    await runStatement('BEGIN TRANSACTION');

    try {
      // Create a new table without the CHECK constraint
      await runStatement(`
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          failed_login_attempts INTEGER DEFAULT 0,
          lockout_until DATETIME DEFAULT NULL,
          password_reset_token TEXT DEFAULT NULL,
          password_reset_expires DATETIME DEFAULT NULL,
          last_login DATETIME DEFAULT NULL
        )
      `);

      // Copy data from the old table to the new one
      await runStatement(`
        INSERT INTO users_new 
        SELECT * FROM users
      `);

      // Drop the old table
      await runStatement('DROP TABLE users');

      // Rename the new table to the original name
      await runStatement('ALTER TABLE users_new RENAME TO users');

      // Recreate indexes
      await runStatement('CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)');

      // Commit the transaction
      await runStatement('COMMIT');
      
      console.log('✅ Successfully removed role constraint from users table');
    } catch (error) {
      // Rollback the transaction on error
      await runStatement('ROLLBACK');
      console.error('Error removing role constraint:', error);
      throw error;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};