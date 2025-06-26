import { runStatement } from '../connection.js';

export const createCabinetTables = async () => {
  const sql = `
    /*
      # Create Cabinet Catalog System

      1. New Tables
        - \`cabinet_models\` - Main cabinet model definitions
        - \`cabinet_model_materials\` - Material options for cabinet models
        - \`cabinet_model_accessories\` - Accessory options for cabinet models
        - \`kitchen_projects\` - Client kitchen design projects
        - \`kitchen_project_cabinets\` - Individual cabinets within a kitchen project
      
      2. Features
        - Parametric cabinet models with adjustable dimensions
        - Dynamic cost calculation based on materials and dimensions
        - Kitchen project management
        - Integration with inventory system
    */

    -- Cabinet Models table
    CREATE TABLE IF NOT EXISTS cabinet_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      default_width REAL NOT NULL,
      default_height REAL NOT NULL,
      default_depth REAL NOT NULL,
      min_width REAL NOT NULL,
      max_width REAL NOT NULL,
      min_height REAL NOT NULL,
      max_height REAL NOT NULL,
      min_depth REAL NOT NULL,
      max_depth REAL NOT NULL,
      base_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cabinet Model Materials table
    CREATE TABLE IF NOT EXISTS cabinet_model_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_model_id INTEGER NOT NULL,
      material_item_id INTEGER NOT NULL,
      cost_factor_per_sqft REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cabinet_model_id) REFERENCES cabinet_models(id) ON DELETE CASCADE,
      FOREIGN KEY (material_item_id) REFERENCES inventory_items(id),
      UNIQUE(cabinet_model_id, material_item_id)
    );

    -- Cabinet Model Accessories table
    CREATE TABLE IF NOT EXISTS cabinet_model_accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_model_id INTEGER NOT NULL,
      accessory_item_id INTEGER NOT NULL,
      quantity_per_cabinet INTEGER NOT NULL,
      cost_factor_per_unit REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cabinet_model_id) REFERENCES cabinet_models(id) ON DELETE CASCADE,
      FOREIGN KEY (accessory_item_id) REFERENCES inventory_items(id),
      UNIQUE(cabinet_model_id, accessory_item_id)
    );

    -- Kitchen Projects table
    CREATE TABLE IF NOT EXISTS kitchen_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'quoted', 'ordered', 'completed', 'cancelled')),
      total_estimated_cost REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id)
    );

    -- Kitchen Project Cabinets table
    CREATE TABLE IF NOT EXISTS kitchen_project_cabinets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kitchen_project_id INTEGER NOT NULL,
      cabinet_model_id INTEGER NOT NULL,
      custom_width REAL NOT NULL,
      custom_height REAL NOT NULL,
      custom_depth REAL NOT NULL,
      selected_material_id INTEGER NOT NULL,
      selected_accessories TEXT, -- JSON string storing array of {accessory_item_id, quantity}
      calculated_cost REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kitchen_project_id) REFERENCES kitchen_projects(id) ON DELETE CASCADE,
      FOREIGN KEY (cabinet_model_id) REFERENCES cabinet_models(id),
      FOREIGN KEY (selected_material_id) REFERENCES inventory_items(id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_cabinet_models_name ON cabinet_models(name);
    CREATE INDEX IF NOT EXISTS idx_cabinet_model_materials_model ON cabinet_model_materials(cabinet_model_id);
    CREATE INDEX IF NOT EXISTS idx_cabinet_model_materials_material ON cabinet_model_materials(material_item_id);
    CREATE INDEX IF NOT EXISTS idx_cabinet_model_accessories_model ON cabinet_model_accessories(cabinet_model_id);
    CREATE INDEX IF NOT EXISTS idx_cabinet_model_accessories_accessory ON cabinet_model_accessories(accessory_item_id);
    CREATE INDEX IF NOT EXISTS idx_kitchen_projects_client ON kitchen_projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_kitchen_projects_status ON kitchen_projects(status);
    CREATE INDEX IF NOT EXISTS idx_kitchen_project_cabinets_project ON kitchen_project_cabinets(kitchen_project_id);
    CREATE INDEX IF NOT EXISTS idx_kitchen_project_cabinets_model ON kitchen_project_cabinets(cabinet_model_id);
  `;

  const statements = sql.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await runStatement(statement.trim());
    }
  }
};