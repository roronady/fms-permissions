import { runStatement, runQuery } from './connection.js';

export const addSampleInventoryData = async () => {
  try {
    console.log('Adding sample inventory data...');

    // Check if we already have inventory items
    const existingItems = await runQuery('SELECT COUNT(*) as count FROM inventory_items');
    if (existingItems[0].count > 0) {
      console.log('Sample data already exists, skipping...');
      return;
    }

    // Get IDs for foreign key references
    const categories = await runQuery('SELECT id, name FROM categories');
    const subcategories = await runQuery('SELECT id, name, category_id FROM subcategories');
    const units = await runQuery('SELECT id, name FROM units');
    const locations = await runQuery('SELECT id, name FROM locations');
    const suppliers = await runQuery('SELECT id, name FROM suppliers');

    // Add some sample suppliers first if none exist
    if (suppliers.length === 0) {
      const sampleSuppliers = [
        { name: 'TechCorp Solutions', contact_person: 'John Smith', email: 'john@techcorp.com', phone: '+1-555-0101', address: '123 Tech Street, Silicon Valley, CA 94000' },
        { name: 'Office Supplies Plus', contact_person: 'Sarah Johnson', email: 'sarah@officesupplies.com', phone: '+1-555-0102', address: '456 Business Ave, New York, NY 10001' },
        { name: 'Industrial Equipment Co', contact_person: 'Mike Wilson', email: 'mike@industrial.com', phone: '+1-555-0103', address: '789 Factory Road, Detroit, MI 48201' },
        { name: 'Global Materials Ltd', contact_person: 'Lisa Chen', email: 'lisa@globalmaterials.com', phone: '+1-555-0104', address: '321 Import Blvd, Los Angeles, CA 90210' },
        { name: 'Safety First Inc', contact_person: 'David Brown', email: 'david@safetyfirst.com', phone: '+1-555-0105', address: '654 Protection Way, Chicago, IL 60601' }
      ];

      for (const supplier of sampleSuppliers) {
        await runStatement(
          'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
          [supplier.name, supplier.contact_person, supplier.email, supplier.phone, supplier.address]
        );
      }

      // Refresh suppliers list
      const newSuppliers = await runQuery('SELECT id, name FROM suppliers');
      suppliers.push(...newSuppliers);
    }

    // Helper function to get random item from array
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

    // Sample inventory items
    const sampleItems = [
      // Electronics
      {
        name: 'Dell OptiPlex 7090 Desktop',
        sku: 'DELL-7090-001',
        description: 'High-performance desktop computer with Intel i7 processor, 16GB RAM, 512GB SSD',
        category: 'Electronics',
        subcategory: 'Computers',
        unit: 'Pieces',
        quantity: 25,
        min_quantity: 5,
        max_quantity: 50,
        unit_price: 899.99
      },
      {
        name: 'HP LaserJet Pro M404n',
        sku: 'HP-M404N-001',
        description: 'Monochrome laser printer with network connectivity',
        category: 'Electronics',
        subcategory: 'Components',
        unit: 'Pieces',
        quantity: 12,
        min_quantity: 3,
        max_quantity: 20,
        unit_price: 249.99
      },
      {
        name: 'Logitech MX Master 3 Mouse',
        sku: 'LOG-MX3-001',
        description: 'Advanced wireless mouse with precision tracking',
        category: 'Electronics',
        subcategory: 'Components',
        unit: 'Pieces',
        quantity: 45,
        min_quantity: 10,
        max_quantity: 100,
        unit_price: 99.99
      },
      {
        name: 'Samsung 27" 4K Monitor',
        sku: 'SAM-27-4K-001',
        description: '27-inch 4K UHD monitor with USB-C connectivity',
        category: 'Electronics',
        subcategory: 'Components',
        unit: 'Pieces',
        quantity: 18,
        min_quantity: 5,
        max_quantity: 30,
        unit_price: 329.99
      },
      {
        name: 'USB-C to HDMI Cable',
        sku: 'CABLE-USBC-HDMI-001',
        description: '6ft USB-C to HDMI cable for video output',
        category: 'Electronics',
        subcategory: 'Cables & Connectors',
        unit: 'Pieces',
        quantity: 75,
        min_quantity: 20,
        max_quantity: 150,
        unit_price: 19.99
      },

      // Office Supplies
      {
        name: 'A4 Copy Paper',
        sku: 'PAPER-A4-001',
        description: 'Premium white A4 copy paper, 80gsm, 500 sheets per ream',
        category: 'Office Supplies',
        subcategory: 'Stationery',
        unit: 'Boxes',
        quantity: 120,
        min_quantity: 30,
        max_quantity: 200,
        unit_price: 45.99
      },
      {
        name: 'Pilot G2 Gel Pens',
        sku: 'PEN-PILOT-G2-001',
        description: 'Black gel ink pens, 0.7mm tip, pack of 12',
        category: 'Office Supplies',
        subcategory: 'Stationery',
        unit: 'Boxes',
        quantity: 85,
        min_quantity: 15,
        max_quantity: 150,
        unit_price: 18.99
      },
      {
        name: 'Stapler Heavy Duty',
        sku: 'STAPLER-HD-001',
        description: 'Heavy duty stapler for up to 50 sheets',
        category: 'Office Supplies',
        subcategory: 'Desk Accessories',
        unit: 'Pieces',
        quantity: 32,
        min_quantity: 8,
        max_quantity: 60,
        unit_price: 24.99
      },
      {
        name: 'File Folders Letter Size',
        sku: 'FOLDER-LTR-001',
        description: 'Manila file folders, letter size, pack of 100',
        category: 'Office Supplies',
        subcategory: 'Filing & Storage',
        unit: 'Boxes',
        quantity: 55,
        min_quantity: 12,
        max_quantity: 100,
        unit_price: 32.99
      },

      // Tools
      {
        name: 'Dewalt 20V Cordless Drill',
        sku: 'DEWALT-20V-001',
        description: '20V MAX cordless drill with battery and charger',
        category: 'Tools',
        subcategory: 'Power Tools',
        unit: 'Pieces',
        quantity: 15,
        min_quantity: 3,
        max_quantity: 25,
        unit_price: 129.99
      },
      {
        name: 'Craftsman Screwdriver Set',
        sku: 'CRAFT-SCREW-001',
        description: '20-piece screwdriver set with various tips',
        category: 'Tools',
        subcategory: 'Hand Tools',
        unit: 'Pieces',
        quantity: 28,
        min_quantity: 5,
        max_quantity: 50,
        unit_price: 39.99
      },
      {
        name: 'Digital Calipers',
        sku: 'CALIPER-DIG-001',
        description: '6-inch digital calipers with LCD display',
        category: 'Tools',
        subcategory: 'Measuring Tools',
        unit: 'Pieces',
        quantity: 22,
        min_quantity: 5,
        max_quantity: 40,
        unit_price: 29.99
      },

      // Safety Equipment
      {
        name: 'Safety Hard Hats',
        sku: 'SAFETY-HAT-001',
        description: 'ANSI approved safety hard hats, white',
        category: 'Safety Equipment',
        subcategory: 'Personal Protective Equipment',
        unit: 'Pieces',
        quantity: 65,
        min_quantity: 15,
        max_quantity: 100,
        unit_price: 12.99
      },
      {
        name: 'Safety Glasses',
        sku: 'SAFETY-GLASS-001',
        description: 'Clear safety glasses with side shields',
        category: 'Safety Equipment',
        subcategory: 'Personal Protective Equipment',
        unit: 'Pieces',
        quantity: 95,
        min_quantity: 25,
        max_quantity: 150,
        unit_price: 8.99
      },
      {
        name: 'First Aid Kit',
        sku: 'FIRSTAID-001',
        description: 'Complete first aid kit for 25 people',
        category: 'Safety Equipment',
        subcategory: 'First Aid',
        unit: 'Pieces',
        quantity: 8,
        min_quantity: 2,
        max_quantity: 15,
        unit_price: 89.99
      },

      // Furniture
      {
        name: 'Ergonomic Office Chair',
        sku: 'CHAIR-ERG-001',
        description: 'Adjustable ergonomic office chair with lumbar support',
        category: 'Furniture',
        subcategory: 'Office Chairs',
        unit: 'Pieces',
        quantity: 35,
        min_quantity: 8,
        max_quantity: 60,
        unit_price: 199.99
      },
      {
        name: 'Standing Desk Converter',
        sku: 'DESK-STAND-001',
        description: 'Height adjustable standing desk converter',
        category: 'Furniture',
        subcategory: 'Desks & Tables',
        unit: 'Pieces',
        quantity: 20,
        min_quantity: 5,
        max_quantity: 35,
        unit_price: 149.99
      },

      // Cleaning Supplies
      {
        name: 'All-Purpose Cleaner',
        sku: 'CLEAN-ALL-001',
        description: 'Multi-surface all-purpose cleaner, 32oz spray bottle',
        category: 'Cleaning Supplies',
        subcategory: 'Cleaning Chemicals',
        unit: 'Bottles',
        quantity: 48,
        min_quantity: 12,
        max_quantity: 80,
        unit_price: 4.99
      },
      {
        name: 'Microfiber Cleaning Cloths',
        sku: 'CLOTH-MICRO-001',
        description: 'Pack of 12 microfiber cleaning cloths',
        category: 'Cleaning Supplies',
        subcategory: 'Cleaning Tools',
        unit: 'Boxes',
        quantity: 35,
        min_quantity: 8,
        max_quantity: 60,
        unit_price: 16.99
      },
      {
        name: 'Paper Towels',
        sku: 'TOWEL-PAPER-001',
        description: 'Premium paper towels, 8 rolls per pack',
        category: 'Cleaning Supplies',
        subcategory: 'Paper Products',
        unit: 'Boxes',
        quantity: 42,
        min_quantity: 10,
        max_quantity: 75,
        unit_price: 22.99
      }
    ];

    // Insert sample items
    for (const item of sampleItems) {
      try {
        // Find matching category
        const category = categories.find(c => c.name === item.category);
        const subcategory = subcategories.find(s => s.name === item.subcategory && s.category_id === category?.id);
        const unit = units.find(u => u.name === item.unit);
        const location = getRandomItem(locations);
        const supplier = getRandomItem(suppliers);

        await runStatement(`
          INSERT INTO inventory_items (
            name, sku, description, category_id, subcategory_id,
            unit_id, location_id, supplier_id, quantity,
            min_quantity, max_quantity, unit_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.name,
          item.sku,
          item.description,
          category?.id || null,
          subcategory?.id || null,
          unit?.id || null,
          location?.id || null,
          supplier?.id || null,
          item.quantity,
          item.min_quantity,
          item.max_quantity,
          item.unit_price
        ]);

        console.log(`✅ Added: ${item.name}`);
      } catch (error) {
        console.error(`❌ Failed to add ${item.name}:`, error.message);
      }
    }

    console.log('✅ Sample inventory data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
};

export const addSampleBOMData = async () => {
  try {
    console.log('Adding sample BOM data...');

    // Check if we already have BOM data
    const existingBOMs = await runQuery('SELECT COUNT(*) as count FROM bill_of_materials');
    if (existingBOMs[0].count > 0) {
      console.log('Sample BOM data already exists, skipping...');
      return;
    }

    // Insert sample BOM data for kitchen cabinet manufacturing
    await runStatement(`
      INSERT OR IGNORE INTO bill_of_materials (name, description, version, status, created_by) VALUES 
      ('Base Cabinet 24"', 'Standard 24-inch base cabinet with door and drawer', '1.0', 'active', 1),
      ('Wall Cabinet 30"', 'Standard 30-inch wall cabinet with adjustable shelves', '1.0', 'active', 1),
      ('Drawer Box 18"', 'Standard 18-inch drawer box assembly', '1.0', 'active', 1),
      ('Cabinet Door 24x30', 'Raised panel cabinet door 24" x 30"', '1.0', 'active', 1),
      ('Face Frame Assembly', 'Standard face frame for base cabinet', '1.0', 'active', 1)
    `);

    // Insert sample operations for cabinet manufacturing
    await runStatement(`
      INSERT OR IGNORE INTO bom_operations (bom_id, operation_name, description, sequence_number, estimated_time_minutes, labor_rate, machine_required, skill_level) VALUES 
      (1, 'Cut Parts', 'Cut all cabinet parts to size', 1, 45, 25.00, 'Table Saw', 'intermediate'),
      (1, 'Drill Holes', 'Drill shelf pin and hinge holes', 2, 30, 22.00, 'Drill Press', 'basic'),
      (1, 'Sand Parts', 'Sand all parts to 220 grit', 3, 60, 18.00, 'Random Orbital Sander', 'basic'),
      (1, 'Assemble Cabinet', 'Assemble cabinet box with glue and screws', 4, 90, 28.00, 'Assembly Table', 'intermediate'),
      (1, 'Install Hardware', 'Install hinges, drawer slides, and handles', 5, 45, 25.00, 'Hand Tools', 'intermediate'),
      (1, 'Final Inspection', 'Quality check and final adjustments', 6, 15, 30.00, 'None', 'advanced')
    `);

    console.log('✅ Sample BOM data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample BOM data:', error);
  }
};