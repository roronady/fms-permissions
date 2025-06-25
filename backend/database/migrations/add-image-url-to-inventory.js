import { runStatement, runQuery } from '../connection.js';

export const addImageUrlToInventory = async () => {
  const sql = `
    /*
      # Add image_url column to inventory_items table

      1. Changes
        - Add \`image_url\` column to \`inventory_items\` table
        - This column stores a path to an image of the inventory item
        - Default value is NULL
      
      2. Purpose
        - Allow storing references to locally saved item images
        - Support image preview in the inventory interface
        - Keep images separate from database for better backup management
    */

    -- Add image_url column to inventory_items table if it doesn't exist
    ALTER TABLE inventory_items ADD COLUMN image_url TEXT DEFAULT NULL;
  `;

  // Check if column already exists before attempting to add it
  const checkColumnSql = `SELECT COUNT(*) as count FROM pragma_table_info('inventory_items') WHERE name = 'image_url'`;
  
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
    }
  } catch (error) {
    // If the column already exists, SQLite will throw an error, which we can safely ignore
    if (!error.message.includes('duplicate column name')) {
      throw error;
    }
  }
};