import { runStatement, runQuery } from '../connection.js';

export const updateItemTypeForCabinets = async () => {
  /*
    # Update item_type in inventory_items for cabinet materials and accessories

    1. Changes
      - Modify the CHECK constraint on item_type to include 'sheet_material' and 'hardware_accessory'
      - This allows for proper categorization of cabinet materials and hardware
    
    2. Purpose
      - Support the cabinet catalog system
      - Allow filtering of inventory items by cabinet-specific types
  */

  try {
    console.log('Updating item_type for cabinet materials and accessories...');

    // Check if the column exists and has the constraint
    const tableInfo = await runQuery(`PRAGMA table_info(inventory_items)`);
    const itemTypeColumn = tableInfo.find(col => col.name === 'item_type');
    
    if (!itemTypeColumn) {
      console.log('item_type column not found in inventory_items table');
      return;
    }

    // Get the current CHECK constraint
    const currentConstraint = itemTypeColumn.dflt_value || '';
    
    // If the constraint already includes our new types, we can skip
    if (currentConstraint.includes('sheet_material') && currentConstraint.includes('hardware_accessory')) {
      console.log('item_type already includes sheet_material and hardware_accessory');
      return;
    }

    // Create a temporary table with the new constraint
    await runStatement(`
      CREATE TABLE IF NOT EXISTS inventory_items_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        description TEXT,
        category_id INTEGER,
        subcategory_id INTEGER,
        unit_id INTEGER,
        location_id INTEGER,
        supplier_id INTEGER,
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        max_quantity INTEGER DEFAULT 1000,
        unit_price DECIMAL(10,2) DEFAULT 0,
        total_value DECIMAL(10,2) DEFAULT 0,
        item_type TEXT NOT NULL DEFAULT 'raw_material' CHECK (item_type IN ('raw_material', 'semi_finished_product', 'finished_product', 'sheet_material', 'hardware_accessory')),
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `);

    // Copy data from the original table to the temporary table
    await runStatement(`
      INSERT INTO inventory_items_temp 
      SELECT * FROM inventory_items
    `);

    // Drop the original table
    await runStatement(`DROP TABLE inventory_items`);

    // Rename the temporary table to the original table name
    await runStatement(`ALTER TABLE inventory_items_temp RENAME TO inventory_items`);

    // Recreate indexes
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_item_type ON inventory_items(item_type)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_subcategory ON inventory_items(subcategory_id)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_unit ON inventory_items(unit_id)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location_id)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier_id)`);
    await runStatement(`CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku)`);

    console.log('✅ Successfully updated item_type to include sheet_material and hardware_accessory');
  } catch (error) {
    console.error('Error updating item_type for cabinets:', error);
    throw error;
  }
};