import { runStatement } from '../connection.js';

export const addItemTypeToInventory = async () => {
  const sql = `
    /*
      # Add item_type column to inventory_items table

      1. Changes
        - Add \`item_type\` column to \`inventory_items\` table
        - This column categorizes items as raw_material, semi_finished_product, or finished_product
        - Default value is 'raw_material' for backward compatibility
        - Add CHECK constraint to ensure valid values
      
      2. Purpose
        - Explicitly categorize inventory items by their type
        - Support filtering and reporting by item type
        - Enable production workflows based on item type
    */

    -- Add item_type column to inventory_items table
    ALTER TABLE inventory_items ADD COLUMN item_type TEXT NOT NULL DEFAULT 'raw_material' 
      CHECK (item_type IN ('raw_material', 'semi_finished_product', 'finished_product'));

    -- Create index for better performance when filtering by item type
    CREATE INDEX IF NOT EXISTS idx_inventory_items_item_type ON inventory_items(item_type);
  `;

  const statements = sql.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await runStatement(statement.trim());
    }
  }
};