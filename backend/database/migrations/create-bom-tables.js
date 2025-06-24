import { runStatement } from '../connection.js';

export const createBOMTables = async () => {
  const sql = `
    /*
      # Create Bill of Materials (BOM) tables for manufacturing

      1. New Tables
        - \`bill_of_materials\`
          - \`id\` (integer, primary key)
          - \`name\` (text, unique, not null) - BOM name/identifier
          - \`description\` (text) - BOM description
          - \`finished_product_id\` (integer, foreign key to inventory_items) - Optional finished product
          - \`version\` (text) - BOM version (e.g., "1.0", "2.1")
          - \`status\` (text) - active, inactive, draft
          - \`unit_cost\` (decimal) - Calculated total cost of all components
          - \`labor_cost\` (decimal) - Labor cost for assembly
          - \`overhead_cost\` (decimal) - Overhead allocation
          - \`total_cost\` (decimal) - Total manufacturing cost
          - \`created_by\` (integer, foreign key to users)
          - \`created_at\` (timestamp)
          - \`updated_at\` (timestamp)

        - \`bom_components\`
          - \`id\` (integer, primary key)
          - \`bom_id\` (integer, foreign key to bill_of_materials)
          - \`item_id\` (integer, foreign key to inventory_items)
          - \`quantity\` (decimal, not null) - Required quantity of this component
          - \`unit_id\` (integer, foreign key to units)
          - \`unit_cost\` (decimal) - Cost per unit at time of BOM creation
          - \`total_cost\` (decimal) - Calculated total cost (quantity * unit_cost)
          - \`waste_factor\` (decimal) - Waste/scrap factor (e.g., 0.05 for 5% waste)
          - \`notes\` (text) - Component-specific notes
          - \`sort_order\` (integer) - Display order in BOM
          - \`created_at\` (timestamp)

        - \`bom_operations\`
          - \`id\` (integer, primary key)
          - \`bom_id\` (integer, foreign key to bill_of_materials)
          - \`operation_name\` (text, not null) - e.g., "Cut", "Drill", "Sand", "Assemble"
          - \`description\` (text) - Operation description
          - \`sequence_number\` (integer) - Order of operations
          - \`estimated_time_minutes\` (integer) - Time required for operation
          - \`labor_rate\` (decimal) - Cost per hour for this operation
          - \`machine_required\` (text) - Required equipment/machine
          - \`skill_level\` (text) - Required skill level
          - \`notes\` (text) - Operation notes
          - \`created_at\` (timestamp)

      2. Security
        - No RLS needed as these are master data tables
        - Access controlled through application-level permissions

      3. Features
        - Support for multi-level BOMs (BOM can reference other BOMs)
        - Version control for BOM revisions
        - Cost tracking and calculation
        - Manufacturing operations tracking
        - Waste factor consideration
        - Labor and overhead cost allocation
    */

    -- Bill of Materials main table
    CREATE TABLE IF NOT EXISTS bill_of_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      finished_product_id INTEGER,
      version TEXT DEFAULT '1.0',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
      unit_cost DECIMAL(12,4) DEFAULT 0,
      labor_cost DECIMAL(12,4) DEFAULT 0,
      overhead_cost DECIMAL(12,4) DEFAULT 0,
      total_cost DECIMAL(12,4) DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (finished_product_id) REFERENCES inventory_items(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- BOM Components table
    CREATE TABLE IF NOT EXISTS bom_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity DECIMAL(10,4) NOT NULL,
      unit_id INTEGER,
      unit_cost DECIMAL(10,4) DEFAULT 0,
      total_cost DECIMAL(12,4) DEFAULT 0,
      waste_factor DECIMAL(5,4) DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bom_id) REFERENCES bill_of_materials(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES inventory_items(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    -- BOM Operations table for manufacturing processes
    CREATE TABLE IF NOT EXISTS bom_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_id INTEGER NOT NULL,
      operation_name TEXT NOT NULL,
      description TEXT,
      sequence_number INTEGER DEFAULT 1,
      estimated_time_minutes INTEGER DEFAULT 0,
      labor_rate DECIMAL(8,2) DEFAULT 0,
      machine_required TEXT,
      skill_level TEXT DEFAULT 'basic' CHECK (skill_level IN ('basic', 'intermediate', 'advanced', 'expert')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bom_id) REFERENCES bill_of_materials(id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_bill_of_materials_status ON bill_of_materials(status);
    CREATE INDEX IF NOT EXISTS idx_bill_of_materials_finished_product ON bill_of_materials(finished_product_id);
    CREATE INDEX IF NOT EXISTS idx_bill_of_materials_created_by ON bill_of_materials(created_by);
    CREATE INDEX IF NOT EXISTS idx_bom_components_bom ON bom_components(bom_id);
    CREATE INDEX IF NOT EXISTS idx_bom_components_item ON bom_components(item_id);
    CREATE INDEX IF NOT EXISTS idx_bom_components_sort_order ON bom_components(bom_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_bom_operations_bom ON bom_operations(bom_id);
    CREATE INDEX IF NOT EXISTS idx_bom_operations_sequence ON bom_operations(bom_id, sequence_number);

    -- Insert sample BOM data for kitchen cabinet manufacturing
    INSERT OR IGNORE INTO bill_of_materials (name, description, version, status, created_by) VALUES 
    ('Base Cabinet 24"', 'Standard 24-inch base cabinet with door and drawer', '1.0', 'active', 1),
    ('Wall Cabinet 30"', 'Standard 30-inch wall cabinet with adjustable shelves', '1.0', 'active', 1),
    ('Drawer Box 18"', 'Standard 18-inch drawer box assembly', '1.0', 'active', 1),
    ('Cabinet Door 24x30', 'Raised panel cabinet door 24" x 30"', '1.0', 'active', 1),
    ('Face Frame Assembly', 'Standard face frame for base cabinet', '1.0', 'active', 1);

    -- Insert sample operations for cabinet manufacturing
    INSERT OR IGNORE INTO bom_operations (bom_id, operation_name, description, sequence_number, estimated_time_minutes, labor_rate, machine_required, skill_level) VALUES 
    (1, 'Cut Parts', 'Cut all cabinet parts to size', 1, 45, 25.00, 'Table Saw', 'intermediate'),
    (1, 'Drill Holes', 'Drill shelf pin and hinge holes', 2, 30, 22.00, 'Drill Press', 'basic'),
    (1, 'Sand Parts', 'Sand all parts to 220 grit', 3, 60, 18.00, 'Random Orbital Sander', 'basic'),
    (1, 'Assemble Cabinet', 'Assemble cabinet box with glue and screws', 4, 90, 28.00, 'Assembly Table', 'intermediate'),
    (1, 'Install Hardware', 'Install hinges, drawer slides, and handles', 5, 45, 25.00, 'Hand Tools', 'intermediate'),
    (1, 'Final Inspection', 'Quality check and final adjustments', 6, 15, 30.00, 'None', 'advanced');
  `;

  const statements = sql.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await runStatement(statement.trim());
    }
  }
};