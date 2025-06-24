import { runStatement } from '../connection.js';

export const createSubcategoriesData = async () => {
  // First, ensure the categories exist before inserting subcategories
  const categoriesSQL = `
    INSERT OR IGNORE INTO categories (name, description) VALUES 
    ('Electronics', 'Electronic devices and components'),
    ('Office Supplies', 'Office and administrative supplies');
  `;

  await runStatement(categoriesSQL);

  const sql = `
    -- Insert subcategories for Electronics (only if category exists)
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Computers', c.id, 'Desktop computers, laptops, and accessories'
    FROM categories c WHERE c.name = 'Electronics';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Mobile Devices', c.id, 'Smartphones, tablets, and mobile accessories'
    FROM categories c WHERE c.name = 'Electronics';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Audio Equipment', c.id, 'Speakers, headphones, and audio systems'
    FROM categories c WHERE c.name = 'Electronics';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Cables & Connectors', c.id, 'Various cables, adapters, and connectors'
    FROM categories c WHERE c.name = 'Electronics';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Components', c.id, 'Electronic components and circuit boards'
    FROM categories c WHERE c.name = 'Electronics';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Networking', c.id, 'Routers, switches, and network equipment'
    FROM categories c WHERE c.name = 'Electronics';

    -- Insert subcategories for Office Supplies
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Stationery', c.id, 'Pens, pencils, paper, and writing materials'
    FROM categories c WHERE c.name = 'Office Supplies';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Filing & Storage', c.id, 'Folders, binders, and storage solutions'
    FROM categories c WHERE c.name = 'Office Supplies';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Printing Supplies', c.id, 'Ink cartridges, toner, and paper'
    FROM categories c WHERE c.name = 'Office Supplies';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Desk Accessories', c.id, 'Organizers, staplers, and desk items'
    FROM categories c WHERE c.name = 'Office Supplies';
    
    INSERT OR IGNORE INTO subcategories (name, category_id, description) 
    SELECT 'Presentation Materials', c.id, 'Whiteboards, markers, and presentation tools'
    FROM categories c WHERE c.name = 'Office Supplies';
  `;

  const statements = sql.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await runStatement(statement.trim());
    }
  }
};