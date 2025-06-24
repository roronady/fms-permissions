import { runStatement, runQuery } from './connection.js';
import bcrypt from 'bcryptjs';
import { addSampleInventoryData, addSampleBOMData } from './sample-data.js';
import { createInitialSchema } from './migrations/initial-schema.js';
import { createInventoryTables } from './migrations/inventory-tables.js';
import { createAuditTables } from './migrations/audit-tables.js';
import { createDefaultData } from './migrations/default-data.js';
import { createSubcategoriesData } from './migrations/subcategories-data.js';
import { createRequisitionTables } from './migrations/requisition-tables.js';
import { createDepartmentTables } from './migrations/department-tables.js';
import { createPriceHistoryTables } from './migrations/price-history-tables.js';
import { createPurchaseOrderTables } from './migrations/purchase-order-tables.js';
import { createBOMTables } from './migrations/create-bom-tables.js';
import { createStockMovementsTable } from './migrations/stock-movements-table.js';
import { createProductionOrdersTables } from './migrations/production-orders-tables.js';
import { addItemTypeToInventory } from './migrations/add-item-type-to-inventory.js';

const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    execute: createInitialSchema
  },
  {
    version: 2,
    name: 'inventory_items',
    execute: createInventoryTables
  },
  {
    version: 3,
    name: 'audit_trail',
    execute: createAuditTables
  },
  {
    version: 4,
    name: 'default_data',
    execute: createDefaultData
  },
  {
    version: 5,
    name: 'subcategories_data',
    execute: createSubcategoriesData
  },
  {
    version: 6,
    name: 'requisitions_tables',
    execute: createRequisitionTables
  },
  {
    version: 7,
    name: 'departments_table',
    execute: createDepartmentTables
  },
  {
    version: 8,
    name: 'price_history_table',
    execute: createPriceHistoryTables
  },
  {
    version: 12,
    name: 'purchase_orders_tables',
    execute: createPurchaseOrderTables
  },
  {
    version: 13,
    name: 'bom_tables',
    execute: createBOMTables
  },
  {
    version: 14,
    name: 'stock_movements_table',
    execute: createStockMovementsTable
  },
  {
    version: 15,
    name: 'production_orders_tables',
    execute: createProductionOrdersTables
  },
  {
    version: 16,
    name: 'add_item_type_to_inventory',
    execute: addItemTypeToInventory
  }
];

export const runMigrations = async () => {
  try {
    // Create migrations table if it doesn't exist
    await runStatement(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedMigrations = await runQuery('SELECT version FROM migrations ORDER BY version');
    const executedVersions = executedMigrations.map(m => m.version);

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedVersions.includes(migration.version)) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.execute();
        } catch (error) {
          console.error(`Error executing migration ${migration.version}:`, error);
          throw error;
        }

        // Record migration as executed
        await runStatement(
          'INSERT INTO migrations (version, name) VALUES (?, ?)',
          [migration.version, migration.name]
        );

        console.log(`Migration ${migration.version} completed`);
      }
    }

    // Create default admin user AFTER migrations have run to ensure users table exists
    const existingAdmin = await runQuery('SELECT * FROM users WHERE username = ?', ['admin']);
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await runStatement(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@wms.local', hashedPassword, 'admin']
      );
      console.log('Default admin user created');
    }

    // Add sample inventory data - this will check if data exists first
    await addSampleInventoryData();

    // Add sample BOM data AFTER admin user is created
    await addSampleBOMData();

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};