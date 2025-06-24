import { runQuery, runStatement } from './connection.js';

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
        { name: 'Safety First Inc', contact_person: 'David Brown', email: 'david@safetyfirst.com', phone: '+1-555-0105', address: '654 Protection Way, Chicago, IL 60601' },
        { name: 'Cabinet Makers Supply', contact_person: 'Robert Johnson', email: 'robert@cabinetmakers.com', phone: '+1-555-0106', address: '789 Woodworking Lane, Portland, OR 97201' }
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
      // Raw Materials
      {
        name: 'Cabinet Grade Plywood 3/4"',
        sku: 'CAB-PLY-001',
        description: '4x8 sheet of 3/4" cabinet grade plywood, birch',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Sheets',
        quantity: 50,
        min_quantity: 10,
        max_quantity: 100,
        unit_price: 65.99,
        item_type: 'raw_material'
      },
      {
        name: 'Cabinet Hinges Soft-Close',
        sku: 'CAB-HINGE-001',
        description: 'Soft-close concealed cabinet hinges, 110° opening',
        category: 'Raw Materials',
        subcategory: 'Hardware',
        unit: 'Pairs',
        quantity: 200,
        min_quantity: 50,
        max_quantity: 500,
        unit_price: 4.99,
        item_type: 'raw_material'
      },
      {
        name: 'Cabinet Door Pulls',
        sku: 'CAB-PULL-001',
        description: 'Brushed nickel cabinet door pulls, 5" center to center',
        category: 'Raw Materials',
        subcategory: 'Hardware',
        unit: 'Pieces',
        quantity: 150,
        min_quantity: 30,
        max_quantity: 300,
        unit_price: 3.49,
        item_type: 'raw_material'
      },
      {
        name: 'Drawer Slides Full Extension',
        sku: 'CAB-SLIDE-001',
        description: 'Full extension drawer slides, 18", soft-close',
        category: 'Raw Materials',
        subcategory: 'Hardware',
        unit: 'Pairs',
        quantity: 120,
        min_quantity: 30,
        max_quantity: 250,
        unit_price: 12.99,
        item_type: 'raw_material'
      },
      {
        name: 'Cabinet Screws',
        sku: 'CAB-SCREW-001',
        description: 'Cabinet assembly screws, #8 x 1-1/4", 100 pack',
        category: 'Raw Materials',
        subcategory: 'Fasteners',
        unit: 'Boxes',
        quantity: 40,
        min_quantity: 10,
        max_quantity: 80,
        unit_price: 8.99,
        item_type: 'raw_material'
      },
      {
        name: 'Edge Banding',
        sku: 'CAB-EDGE-001',
        description: 'Pre-glued wood veneer edge banding, 50ft roll, birch',
        category: 'Raw Materials',
        subcategory: 'Finishing',
        unit: 'Rolls',
        quantity: 25,
        min_quantity: 5,
        max_quantity: 50,
        unit_price: 19.99,
        item_type: 'raw_material'
      },
      {
        name: 'Cabinet Back Panel',
        sku: 'CAB-BACK-001',
        description: '1/4" plywood for cabinet backs, 4x8 sheet',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Sheets',
        quantity: 30,
        min_quantity: 8,
        max_quantity: 60,
        unit_price: 32.99,
        item_type: 'raw_material'
      },
      {
        name: 'Cabinet Shelf Pins',
        sku: 'CAB-PIN-001',
        description: 'Metal shelf support pins, 100 pack',
        category: 'Raw Materials',
        subcategory: 'Hardware',
        unit: 'Boxes',
        quantity: 15,
        min_quantity: 3,
        max_quantity: 30,
        unit_price: 9.99,
        item_type: 'raw_material'
      },
      {
        name: 'Solid Wood - Maple',
        sku: 'WOOD-MAPLE-001',
        description: 'Solid maple lumber, 4/4 thickness, 8ft lengths',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Pieces',
        quantity: 75,
        min_quantity: 15,
        max_quantity: 150,
        unit_price: 45.99,
        item_type: 'raw_material'
      },
      {
        name: 'Wood Glue',
        sku: 'GLUE-WOOD-001',
        description: 'Professional grade wood glue, 1 gallon',
        category: 'Raw Materials',
        subcategory: 'Finishing',
        unit: 'Bottles',
        quantity: 20,
        min_quantity: 5,
        max_quantity: 40,
        unit_price: 18.99,
        item_type: 'raw_material'
      },
      
      // Semi-Finished Products
      {
        name: 'Cabinet Door - Shaker Style',
        sku: 'SEMI-DOOR-001',
        description: 'Unfinished shaker style cabinet door, 24"x30"',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Pieces',
        quantity: 25,
        min_quantity: 5,
        max_quantity: 50,
        unit_price: 45.99,
        item_type: 'semi_finished_product'
      },
      {
        name: 'Drawer Box Assembly',
        sku: 'SEMI-DRAWER-001',
        description: 'Pre-assembled drawer box, 18"x6"',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Pieces',
        quantity: 30,
        min_quantity: 10,
        max_quantity: 60,
        unit_price: 35.99,
        item_type: 'semi_finished_product'
      },
      {
        name: 'Cabinet Face Frame',
        sku: 'SEMI-FRAME-001',
        description: 'Pre-assembled face frame for 24" base cabinet',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Pieces',
        quantity: 20,
        min_quantity: 5,
        max_quantity: 40,
        unit_price: 28.99,
        item_type: 'semi_finished_product'
      },
      {
        name: 'Cabinet Side Panel',
        sku: 'SEMI-SIDE-001',
        description: 'Finished side panel for 30" tall cabinet',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Pieces',
        quantity: 40,
        min_quantity: 10,
        max_quantity: 80,
        unit_price: 32.99,
        item_type: 'semi_finished_product'
      },
      {
        name: 'Cabinet Shelf',
        sku: 'SEMI-SHELF-001',
        description: 'Adjustable cabinet shelf, 24"x16"',
        category: 'Raw Materials',
        subcategory: 'Wood',
        unit: 'Pieces',
        quantity: 60,
        min_quantity: 15,
        max_quantity: 120,
        unit_price: 18.99,
        item_type: 'semi_finished_product'
      },
      
      // Finished Products
      {
        name: 'Base Cabinet 24"',
        sku: 'CAB-BASE-24',
        description: 'Finished 24" base cabinet with door and drawer',
        category: 'Furniture',
        subcategory: 'Cabinets',
        unit: 'Pieces',
        quantity: 10,
        min_quantity: 2,
        max_quantity: 20,
        unit_price: 299.99,
        item_type: 'finished_product'
      },
      {
        name: 'Wall Cabinet 30"',
        sku: 'CAB-WALL-30',
        description: 'Finished 30" wall cabinet with adjustable shelves',
        category: 'Furniture',
        subcategory: 'Cabinets',
        unit: 'Pieces',
        quantity: 8,
        min_quantity: 2,
        max_quantity: 16,
        unit_price: 249.99,
        item_type: 'finished_product'
      },
      {
        name: 'Pantry Cabinet 84"',
        sku: 'CAB-PANTRY-84',
        description: 'Finished 84" tall pantry cabinet with adjustable shelves',
        category: 'Furniture',
        subcategory: 'Cabinets',
        unit: 'Pieces',
        quantity: 5,
        min_quantity: 1,
        max_quantity: 10,
        unit_price: 599.99,
        item_type: 'finished_product'
      },
      {
        name: 'Vanity Cabinet 36"',
        sku: 'CAB-VANITY-36',
        description: 'Finished 36" bathroom vanity cabinet',
        category: 'Furniture',
        subcategory: 'Cabinets',
        unit: 'Pieces',
        quantity: 6,
        min_quantity: 2,
        max_quantity: 12,
        unit_price: 349.99,
        item_type: 'finished_product'
      },
      {
        name: 'Kitchen Island 48"',
        sku: 'CAB-ISLAND-48',
        description: 'Finished 48" kitchen island with storage',
        category: 'Furniture',
        subcategory: 'Cabinets',
        unit: 'Pieces',
        quantity: 3,
        min_quantity: 1,
        max_quantity: 6,
        unit_price: 899.99,
        item_type: 'finished_product'
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
            min_quantity, max_quantity, unit_price, item_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          item.unit_price,
          item.item_type
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

    // Get user ID for created_by
    const users = await runQuery('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    const adminId = users[0]?.id || 1;

    // Get finished product IDs
    const finishedProducts = await runQuery(`
      SELECT id, name, sku FROM inventory_items 
      WHERE item_type = 'finished_product'
    `);

    // Get semi-finished product IDs
    const semiFinishedProducts = await runQuery(`
      SELECT id, name, sku FROM inventory_items 
      WHERE item_type = 'semi_finished_product'
    `);

    // Get raw material IDs
    const rawMaterials = await runQuery(`
      SELECT id, name, sku FROM inventory_items 
      WHERE item_type = 'raw_material'
    `);

    // Get unit IDs
    const units = await runQuery('SELECT id, name FROM units');
    const piecesUnit = units.find(u => u.name === 'Pieces')?.id || null;
    const sheetsUnit = units.find(u => u.name === 'Sheets')?.id || null;
    const pairsUnit = units.find(u => u.name === 'Pairs')?.id || null;
    const boxesUnit = units.find(u => u.name === 'Boxes')?.id || null;

    // Insert BOMs for semi-finished products
    const semiFinishedBOMs = [
      {
        name: 'Cabinet Door - Shaker Style',
        description: 'BOM for shaker style cabinet door',
        finished_product_id: semiFinishedProducts.find(p => p.name === 'Cabinet Door - Shaker Style')?.id,
        version: '1.0',
        status: 'active',
        overhead_cost: 5.00,
        created_by: adminId
      },
      {
        name: 'Drawer Box Assembly',
        description: 'BOM for standard drawer box',
        finished_product_id: semiFinishedProducts.find(p => p.name === 'Drawer Box Assembly')?.id,
        version: '1.0',
        status: 'active',
        overhead_cost: 3.50,
        created_by: adminId
      },
      {
        name: 'Cabinet Face Frame',
        description: 'BOM for cabinet face frame',
        finished_product_id: semiFinishedProducts.find(p => p.name === 'Cabinet Face Frame')?.id,
        version: '1.0',
        status: 'active',
        overhead_cost: 4.00,
        created_by: adminId
      }
    ];

    // Insert semi-finished product BOMs
    for (const bom of semiFinishedBOMs) {
      const result = await runStatement(`
        INSERT INTO bill_of_materials (
          name, description, finished_product_id, version, status, overhead_cost, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        bom.name,
        bom.description,
        bom.finished_product_id,
        bom.version,
        bom.status,
        bom.overhead_cost,
        bom.created_by
      ]);
      
      console.log(`✅ Added BOM: ${bom.name}`);
      
      // Add components for this BOM
      await addBOMComponents(result.id, rawMaterials, null, piecesUnit, sheetsUnit, pairsUnit, boxesUnit);
      
      // Add operations for this BOM
      await addBOMOperations(result.id);
    }

    // Insert BOMs for finished products
    const finishedProductBOMs = [
      {
        name: 'Base Cabinet 24"',
        description: 'BOM for standard 24-inch base cabinet',
        finished_product_id: finishedProducts.find(p => p.name === 'Base Cabinet 24"')?.id,
        version: '1.0',
        status: 'active',
        overhead_cost: 15.00,
        created_by: adminId
      },
      {
        name: 'Wall Cabinet 30"',
        description: 'BOM for standard 30-inch wall cabinet',
        finished_product_id: finishedProducts.find(p => p.name === 'Wall Cabinet 30"')?.id,
        version: '1.0',
        status: 'active',
        overhead_cost: 12.00,
        created_by: adminId
      },
      {
        name: 'Pantry Cabinet 84"',
        description: 'BOM for 84-inch pantry cabinet',
        finished_product_id: finishedProducts.find(p => p.name === 'Pantry Cabinet 84"')?.id,
        version: '1.0',
        status: 'active',
        overhead_cost: 25.00,
        created_by: adminId
      }
    ];

    // Insert finished product BOMs
    for (const bom of finishedProductBOMs) {
      const result = await runStatement(`
        INSERT INTO bill_of_materials (
          name, description, finished_product_id, version, status, overhead_cost, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        bom.name,
        bom.description,
        bom.finished_product_id,
        bom.version,
        bom.status,
        bom.overhead_cost,
        bom.created_by
      ]);
      
      console.log(`✅ Added BOM: ${bom.name}`);
      
      // Get semi-finished BOMs
      const semiBOMs = await runQuery('SELECT id, name FROM bill_of_materials WHERE name LIKE "Cabinet%" AND id != ?', [result.id]);
      
      // Add both raw materials and semi-finished components
      await addBOMComponents(result.id, rawMaterials, semiBOMs, piecesUnit, sheetsUnit, pairsUnit, boxesUnit);
      
      // Add operations for this BOM
      await addBOMOperations(result.id);
    }

    console.log('✅ Sample BOM data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample BOM data:', error);
  }
};

// Helper function to add BOM components
async function addBOMComponents(bomId, rawMaterials, semiBOMs, piecesUnit, sheetsUnit, pairsUnit, boxesUnit) {
  // Add raw material components
  for (let i = 0; i < Math.min(5, rawMaterials.length); i++) {
    const material = rawMaterials[i];
    const quantity = Math.random() * 5 + 0.5; // Random quantity between 0.5 and 5.5
    const wasteFactor = Math.random() * 0.2; // Random waste factor between 0 and 0.2 (0-20%)
    
    // Determine appropriate unit based on material name
    let unitId = piecesUnit;
    if (material.name.includes('Plywood') || material.name.includes('Panel')) {
      unitId = sheetsUnit;
    } else if (material.name.includes('Hinges') || material.name.includes('Slides')) {
      unitId = pairsUnit;
    } else if (material.name.includes('Screws') || material.name.includes('Pins')) {
      unitId = boxesUnit;
    }
    
    await runStatement(`
      INSERT INTO bom_components (
        bom_id, item_id, quantity, unit_id, waste_factor, notes, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      bomId,
      material.id,
      quantity,
      unitId,
      wasteFactor,
      `Component: ${material.name}`,
      i + 1
    ]);
  }
  
  // Add semi-finished components if available
  if (semiBOMs && semiBOMs.length > 0) {
    for (let i = 0; i < Math.min(2, semiBOMs.length); i++) {
      const semiBOM = semiBOMs[i];
      await runStatement(`
        INSERT INTO bom_components (
          bom_id, component_bom_id, quantity, unit_id, waste_factor, notes, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        bomId,
        semiBOM.id,
        1, // Usually just need 1 of each sub-assembly
        piecesUnit,
        0.05, // 5% waste factor
        `Sub-assembly: ${semiBOM.name}`,
        i + 6 // Start after raw materials
      ]);
    }
  }
}

// Helper function to add BOM operations
async function addBOMOperations(bomId) {
  const operations = [
    {
      operation_name: 'Cut Parts',
      description: 'Cut all cabinet parts to size',
      sequence_number: 1,
      estimated_time_minutes: 45,
      labor_rate: 25.00,
      machine_required: 'Table Saw',
      skill_level: 'intermediate'
    },
    {
      operation_name: 'Drill Holes',
      description: 'Drill shelf pin and hinge holes',
      sequence_number: 2,
      estimated_time_minutes: 30,
      labor_rate: 22.00,
      machine_required: 'Drill Press',
      skill_level: 'basic'
    },
    {
      operation_name: 'Sand Parts',
      description: 'Sand all parts to 220 grit',
      sequence_number: 3,
      estimated_time_minutes: 60,
      labor_rate: 18.00,
      machine_required: 'Random Orbital Sander',
      skill_level: 'basic'
    },
    {
      operation_name: 'Assemble Cabinet',
      description: 'Assemble cabinet box with glue and screws',
      sequence_number: 4,
      estimated_time_minutes: 90,
      labor_rate: 28.00,
      machine_required: 'Assembly Table',
      skill_level: 'intermediate'
    },
    {
      operation_name: 'Install Hardware',
      description: 'Install hinges, drawer slides, and handles',
      sequence_number: 5,
      estimated_time_minutes: 45,
      labor_rate: 25.00,
      machine_required: 'Hand Tools',
      skill_level: 'intermediate'
    },
    {
      operation_name: 'Final Inspection',
      description: 'Quality check and final adjustments',
      sequence_number: 6,
      estimated_time_minutes: 15,
      labor_rate: 30.00,
      machine_required: 'None',
      skill_level: 'advanced'
    }
  ];
  
  // Add 3-6 random operations for this BOM
  const numOperations = Math.floor(Math.random() * 4) + 3; // 3-6 operations
  for (let i = 0; i < numOperations; i++) {
    const operation = operations[i];
    await runStatement(`
      INSERT INTO bom_operations (
        bom_id, operation_name, description, sequence_number,
        estimated_time_minutes, labor_rate, machine_required, skill_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bomId,
      operation.operation_name,
      operation.description,
      operation.sequence_number,
      operation.estimated_time_minutes,
      operation.labor_rate,
      operation.machine_required,
      operation.skill_level
    ]);
  }
}

export const addSampleRequisitionsData = async () => {
  try {
    console.log('Adding sample requisition data...');

    // Check if we already have requisitions
    const existingRequisitions = await runQuery('SELECT COUNT(*) as count FROM requisitions');
    if (existingRequisitions[0].count > 0) {
      console.log('Sample requisition data already exists, skipping...');
      return;
    }

    // Get user IDs
    const users = await runQuery('SELECT id, username, role FROM users');
    const adminUser = users.find(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role === 'user');
    
    if (users.length === 0) {
      console.log('No users found, skipping requisition data...');
      return;
    }

    // Get department data
    const departments = await runQuery('SELECT id, name FROM departments');
    
    // Get inventory items
    const inventoryItems = await runQuery(`
      SELECT id, name, unit_price, unit_id FROM inventory_items 
      WHERE item_type = 'raw_material'
      LIMIT 50
    `);
    
    if (inventoryItems.length === 0) {
      console.log('No inventory items found, skipping requisition data...');
      return;
    }

    // Sample requisitions
    const sampleRequisitions = [
      {
        title: 'Monthly Office Supplies',
        description: 'Regular monthly office supply requisition',
        priority: 'medium',
        required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        department: departments[0]?.name || 'Information Technology',
        requester_id: regularUsers[0]?.id || adminUser.id,
        status: 'pending'
      },
      {
        title: 'Project Alpha Materials',
        description: 'Materials needed for Project Alpha cabinet production',
        priority: 'high',
        required_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        department: departments[1]?.name || 'Operations',
        requester_id: regularUsers[1]?.id || adminUser.id,
        status: 'pending'
      },
      {
        title: 'Emergency Hardware Restock',
        description: 'Urgent restock of critical hardware components',
        priority: 'urgent',
        required_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day from now
        department: departments[2]?.name || 'Maintenance',
        requester_id: regularUsers[0]?.id || adminUser.id,
        status: 'pending'
      },
      {
        title: 'Quarterly Inventory Replenishment',
        description: 'Regular quarterly inventory replenishment',
        priority: 'low',
        required_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        department: departments[3]?.name || 'Procurement',
        requester_id: regularUsers[1]?.id || adminUser.id,
        status: 'pending'
      },
      {
        title: 'New Project Setup',
        description: 'Materials for new kitchen cabinet project',
        priority: 'medium',
        required_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
        department: departments[0]?.name || 'Operations',
        requester_id: regularUsers[0]?.id || adminUser.id,
        status: 'approved'
      }
    ];

    // Insert requisitions and their items
    for (const req of sampleRequisitions) {
      const result = await runStatement(`
        INSERT INTO requisitions (
          title, description, priority, required_date, department,
          requester_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        req.title,
        req.description,
        req.priority,
        req.required_date,
        req.department,
        req.requester_id,
        req.status
      ]);
      
      const requisitionId = result.id;
      console.log(`✅ Added requisition: ${req.title}`);
      
      // Add 3-7 random items to each requisition
      const numItems = Math.floor(Math.random() * 5) + 3; // 3-7 items
      const selectedItems = [];
      
      // Ensure we don't add the same item twice
      while (selectedItems.length < numItems && selectedItems.length < inventoryItems.length) {
        const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
        if (!selectedItems.includes(randomItem)) {
          selectedItems.push(randomItem);
        }
      }
      
      for (const item of selectedItems) {
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 quantity
        const estimatedCost = item.unit_price || 0;
        
        await runStatement(`
          INSERT INTO requisition_items (
            requisition_id, item_id, quantity, estimated_cost, notes
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          requisitionId,
          item.id,
          quantity,
          estimatedCost,
          `Needed for ${req.title}`
        ]);
      }
      
      // If this is an approved requisition, update the status and add approval details
      if (req.status === 'approved') {
        await runStatement(`
          UPDATE requisitions SET
            status = 'approved',
            approver_id = ?,
            approval_date = CURRENT_TIMESTAMP,
            approval_notes = 'Approved for project needs'
          WHERE id = ?
        `, [adminUser.id, requisitionId]);
        
        // Update all items to approved
        await runStatement(`
          UPDATE requisition_items SET
            status = 'approved',
            approved_quantity = quantity,
            rejected_quantity = 0
          WHERE requisition_id = ?
        `, [requisitionId]);
      }
    }

    console.log('✅ Sample requisition data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample requisition data:', error);
  }
};

export const addSamplePurchaseOrdersData = async () => {
  try {
    console.log('Adding sample purchase order data...');

    // Check if we already have purchase orders
    const existingPOs = await runQuery('SELECT COUNT(*) as count FROM purchase_orders');
    if (existingPOs[0].count > 0) {
      console.log('Sample purchase order data already exists, skipping...');
      return;
    }

    // Get user IDs
    const users = await runQuery('SELECT id, username, role FROM users');
    const adminUser = users.find(u => u.role === 'admin');
    
    if (!adminUser) {
      console.log('No admin user found, skipping purchase order data...');
      return;
    }

    // Get supplier data
    const suppliers = await runQuery('SELECT id, name FROM suppliers');
    
    if (suppliers.length === 0) {
      console.log('No suppliers found, skipping purchase order data...');
      return;
    }

    // Get inventory items
    const inventoryItems = await runQuery(`
      SELECT id, name, sku, unit_price, unit_id FROM inventory_items 
      WHERE item_type = 'raw_material'
      LIMIT 50
    `);
    
    if (inventoryItems.length === 0) {
      console.log('No inventory items found, skipping purchase order data...');
      return;
    }

    // Get approved requisition
    const approvedRequisitions = await runQuery(`
      SELECT id, title FROM requisitions 
      WHERE status = 'approved'
      LIMIT 1
    `);

    // Sample purchase orders
    const samplePOs = [
      {
        title: 'Monthly Hardware Order',
        description: 'Regular monthly order of cabinet hardware',
        supplier_id: suppliers.find(s => s.name === 'Cabinet Makers Supply')?.id || suppliers[0].id,
        requisition_id: approvedRequisitions[0]?.id || null,
        status: 'draft',
        priority: 'medium',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        payment_terms: 'Net 30',
        shipping_address: '123 Manufacturing Way, Portland, OR 97201',
        created_by: adminUser.id
      },
      {
        title: 'Plywood Bulk Purchase',
        description: 'Bulk purchase of cabinet grade plywood',
        supplier_id: suppliers.find(s => s.name === 'Global Materials Ltd')?.id || suppliers[1].id,
        status: 'pending_approval',
        priority: 'high',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        payment_terms: 'Net 15',
        shipping_address: '123 Manufacturing Way, Portland, OR 97201',
        created_by: adminUser.id
      },
      {
        title: 'Specialty Hardware Order',
        description: 'Order of specialty hardware for custom project',
        supplier_id: suppliers.find(s => s.name === 'Industrial Equipment Co')?.id || suppliers[2].id,
        status: 'approved',
        priority: 'medium',
        order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        payment_terms: 'Net 30',
        shipping_address: '123 Manufacturing Way, Portland, OR 97201',
        created_by: adminUser.id,
        approved_by: adminUser.id,
        approval_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        approval_notes: 'Approved for production needs'
      },
      {
        title: 'Urgent Supplies Order',
        description: 'Urgent order of critical supplies',
        supplier_id: suppliers.find(s => s.name === 'Safety First Inc')?.id || suppliers[3].id,
        status: 'sent',
        priority: 'urgent',
        order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        expected_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        payment_terms: 'Net 15',
        shipping_address: '123 Manufacturing Way, Portland, OR 97201',
        created_by: adminUser.id,
        approved_by: adminUser.id,
        approval_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        sent_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        title: 'Quarterly Supplies Order',
        description: 'Regular quarterly order of supplies',
        supplier_id: suppliers.find(s => s.name === 'Office Supplies Plus')?.id || suppliers[4].id,
        status: 'partially_received',
        priority: 'low',
        order_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days ago
        expected_delivery_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        payment_terms: 'Net 30',
        shipping_address: '123 Manufacturing Way, Portland, OR 97201',
        created_by: adminUser.id,
        approved_by: adminUser.id,
        approval_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
        sent_date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString() // 17 days ago
      }
    ];

    // Generate PO numbers
    let poCounter = 1;
    const year = new Date().getFullYear();

    // Insert purchase orders and their items
    for (const po of samplePOs) {
      // Generate PO number
      const poNumber = `PO-${year}-${poCounter.toString().padStart(4, '0')}`;
      poCounter++;
      
      // Calculate totals based on items that will be added
      const numItems = Math.floor(Math.random() * 5) + 3; // 3-7 items
      const selectedItems = [];
      
      // Ensure we don't add the same item twice
      while (selectedItems.length < numItems && selectedItems.length < inventoryItems.length) {
        const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
        if (!selectedItems.includes(randomItem)) {
          selectedItems.push(randomItem);
        }
      }
      
      // Calculate subtotal
      let subtotal = 0;
      for (const item of selectedItems) {
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 quantity
        const unitPrice = item.unit_price || 0;
        subtotal += quantity * unitPrice;
      }
      
      const taxAmount = subtotal * 0.1; // 10% tax
      const shippingCost = Math.floor(Math.random() * 50) + 10; // $10-$60 shipping
      const totalAmount = subtotal + taxAmount + shippingCost;

      // Insert purchase order
      const result = await runStatement(`
        INSERT INTO purchase_orders (
          po_number, title, description, supplier_id, requisition_id,
          status, priority, order_date, expected_delivery_date,
          subtotal, tax_amount, shipping_cost, total_amount,
          payment_terms, shipping_address, created_by,
          approved_by, approval_date, approval_notes, sent_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        poNumber,
        po.title,
        po.description,
        po.supplier_id,
        po.requisition_id || null,
        po.status,
        po.priority,
        po.order_date,
        po.expected_delivery_date,
        subtotal,
        taxAmount,
        shippingCost,
        totalAmount,
        po.payment_terms,
        po.shipping_address,
        po.created_by,
        po.approved_by || null,
        po.approval_date || null,
        po.approval_notes || null,
        po.sent_date || null
      ]);
      
      const poId = result.id;
      console.log(`✅ Added purchase order: ${po.title} (${poNumber})`);
      
      // Add items to the purchase order
      for (const item of selectedItems) {
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 quantity
        const unitPrice = item.unit_price || 0;
        const totalPrice = quantity * unitPrice;
        
        // For partially received POs, set some received quantity
        let receivedQuantity = 0;
        if (po.status === 'partially_received') {
          receivedQuantity = Math.floor(quantity / 2); // Receive about half
        } else if (po.status === 'received') {
          receivedQuantity = quantity; // Receive all
        }
        
        await runStatement(`
          INSERT INTO purchase_order_items (
            po_id, item_id, item_name, item_description, sku,
            quantity, unit_price, total_price, received_quantity, unit_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          poId,
          item.id,
          item.name,
          `${item.name} for ${po.title}`,
          item.sku,
          quantity,
          unitPrice,
          totalPrice,
          receivedQuantity,
          item.unit_id
        ]);
      }
      
      // For partially received POs, add receiving records
      if (po.status === 'partially_received' || po.status === 'received') {
        const poItems = await runQuery('SELECT id, quantity FROM purchase_order_items WHERE po_id = ?', [poId]);
        
        for (const item of poItems) {
          const receivedQuantity = po.status === 'partially_received' ? 
            Math.floor(item.quantity / 2) : item.quantity;
          
          if (receivedQuantity > 0) {
            await runStatement(`
              INSERT INTO po_receiving (
                po_id, po_item_id, received_quantity, received_by,
                notes, batch_number, quality_check_passed
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              poId,
              item.id,
              receivedQuantity,
              adminUser.id,
              'Received in good condition',
              `BATCH-${poId}-${item.id}`,
              1 // Quality check passed
            ]);
          }
        }
      }
    }

    console.log('✅ Sample purchase order data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample purchase order data:', error);
  }
};

export const addSampleProductionOrdersData = async () => {
  try {
    console.log('Adding sample production order data...');

    // Check if we already have production orders
    const existingOrders = await runQuery('SELECT COUNT(*) as count FROM production_orders');
    if (existingOrders[0].count > 0) {
      console.log('Sample production order data already exists, skipping...');
      return;
    }

    // Get user IDs
    const users = await runQuery('SELECT id, username, role FROM users');
    const adminUser = users.find(u => u.role === 'admin');
    
    if (!adminUser) {
      console.log('No admin user found, skipping production order data...');
      return;
    }

    // Get BOMs for finished products
    const boms = await runQuery(`
      SELECT b.id, b.name, b.total_cost, i.id as product_id, i.name as product_name, i.sku as product_sku
      FROM bill_of_materials b
      LEFT JOIN inventory_items i ON b.finished_product_id = i.id
      WHERE b.status = 'active' AND i.item_type = 'finished_product'
    `);
    
    if (boms.length === 0) {
      console.log('No active BOMs found, skipping production order data...');
      return;
    }

    // Generate production order numbers
    let orderCounter = 1;
    const year = new Date().getFullYear();

    // Sample production orders
    const sampleOrders = [
      {
        title: 'Base Cabinet Production Run',
        description: 'Monthly production run of base cabinets',
        bom_id: boms.find(b => b.name.includes('Base Cabinet'))?.id || boms[0].id,
        status: 'draft',
        priority: 'medium',
        quantity: 10,
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days from now
        notes: 'Regular monthly production run',
        created_by: adminUser.id
      },
      {
        title: 'Wall Cabinet Production',
        description: 'Production of wall cabinets for Project XYZ',
        bom_id: boms.find(b => b.name.includes('Wall Cabinet'))?.id || boms[0].id,
        status: 'planned',
        priority: 'high',
        quantity: 15,
        start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        due_date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 17 days from now
        notes: 'High priority for Project XYZ',
        created_by: adminUser.id
      },
      {
        title: 'Pantry Cabinet Special Order',
        description: 'Custom pantry cabinets for Johnson residence',
        bom_id: boms.find(b => b.name.includes('Pantry'))?.id || boms[0].id,
        status: 'in_progress',
        priority: 'urgent',
        quantity: 5,
        start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
        notes: 'Custom order with special finishes',
        created_by: adminUser.id
      },
      {
        title: 'Base Cabinet Small Batch',
        description: 'Small batch of base cabinets for inventory',
        bom_id: boms.find(b => b.name.includes('Base Cabinet'))?.id || boms[0].id,
        status: 'completed',
        priority: 'low',
        quantity: 3,
        start_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days ago
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        completion_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        notes: 'Completed ahead of schedule',
        created_by: adminUser.id
      }
    ];

    // Insert production orders
    for (const order of sampleOrders) {
      // Generate order number
      const orderNumber = `PRO-${year}-${orderCounter.toString().padStart(4, '0')}`;
      orderCounter++;
      
      // Get BOM details
      const bom = boms.find(b => b.id === order.bom_id) || boms[0];
      const plannedCost = bom.total_cost * order.quantity;
      
      // Insert production order
      const result = await runStatement(`
        INSERT INTO production_orders (
          order_number, title, description, bom_id, status, priority,
          quantity, start_date, due_date, completion_date,
          finished_product_id, finished_product_name, finished_product_sku,
          planned_cost, actual_cost, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber,
        order.title,
        order.description,
        order.bom_id,
        order.status,
        order.priority,
        order.quantity,
        order.start_date,
        order.due_date,
        order.completion_date || null,
        bom.product_id,
        bom.product_name,
        bom.product_sku,
        plannedCost,
        order.status === 'completed' ? plannedCost : 0, // Set actual cost for completed orders
        order.notes,
        order.created_by
      ]);
      
      const orderId = result.id;
      console.log(`✅ Added production order: ${order.title} (${orderNumber})`);
      
      // Add production order items from BOM components
      await addProductionOrderItems(orderId, order.bom_id, order.quantity, order.status);
      
      // Add production order operations from BOM operations
      await addProductionOrderOperations(orderId, order.bom_id, order.status);
      
      // For completed orders, add completion record
      if (order.status === 'completed') {
        await runStatement(`
          INSERT INTO production_order_completions (
            production_order_id, quantity, completed_by,
            completion_date, quality_check_passed, batch_number, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          order.quantity,
          adminUser.id,
          order.completion_date,
          1, // Quality check passed
          `BATCH-${orderNumber}`,
          'Completed successfully'
        ]);
      }
    }

    console.log('✅ Sample production order data added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample production order data:', error);
  }
};

// Helper function to add production order items
async function addProductionOrderItems(orderId, bomId, quantity, status) {
  // Get BOM components
  const components = await runQuery(`
    SELECT 
      bc.*,
      i.name as item_name,
      i.sku as item_sku,
      u.id as unit_id,
      u.name as unit_name,
      CASE 
        WHEN bc.item_id IS NOT NULL THEN 'item'
        WHEN bc.component_bom_id IS NOT NULL THEN 'bom'
        ELSE NULL
      END as component_type
    FROM bom_components bc
    LEFT JOIN inventory_items i ON bc.item_id = i.id
    LEFT JOIN units u ON bc.unit_id = u.id
    WHERE bc.bom_id = ?
  `, [bomId]);
  
  // Insert production order items
  for (const component of components) {
    const requiredQuantity = component.quantity * quantity * (1 + component.waste_factor);
    
    // For in_progress or completed orders, set some issued quantity
    let issuedQuantity = 0;
    if (status === 'in_progress') {
      issuedQuantity = requiredQuantity * 0.7; // Issue about 70%
    } else if (status === 'completed') {
      issuedQuantity = requiredQuantity; // Issue all
    }
    
    // Determine status based on issued quantity
    let itemStatus = 'pending';
    if (issuedQuantity >= requiredQuantity) {
      itemStatus = 'issued';
    } else if (issuedQuantity > 0) {
      itemStatus = 'partial';
    }
    
    await runStatement(`
      INSERT INTO production_order_items (
        production_order_id, item_id, item_name, item_sku,
        component_type, component_bom_id, required_quantity, issued_quantity,
        unit_id, unit_name, unit_cost, total_cost, waste_factor, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      component.item_id || null,
      component.item_name || 'Unknown Item',
      component.item_sku || null,
      component.component_type,
      component.component_bom_id || null,
      requiredQuantity,
      issuedQuantity,
      component.unit_id || null,
      component.unit_name || null,
      component.unit_cost || 0,
      component.total_cost * quantity || 0,
      component.waste_factor || 0,
      itemStatus
    ]);
    
    // For in_progress or completed orders, add issue records
    if (issuedQuantity > 0) {
      await runStatement(`
        INSERT INTO production_order_issues (
          production_order_id, production_order_item_id,
          quantity, issued_by, notes
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        orderId,
        component.id, // This might need adjustment depending on your schema
        issuedQuantity,
        1, // Admin user ID
        'Issued for production'
      ]);
    }
  }
}

// Helper function to add production order operations
async function addProductionOrderOperations(orderId, bomId, status) {
  // Get BOM operations
  const operations = await runQuery(`
    SELECT * FROM bom_operations
    WHERE bom_id = ?
    ORDER BY sequence_number
  `, [bomId]);
  
  // Insert production order operations
  for (const operation of operations) {
    // Determine operation status based on production order status
    let operationStatus = 'pending';
    let actualStartDate = null;
    let actualEndDate = null;
    let actualTimeMinutes = null;
    
    if (status === 'in_progress') {
      // For in-progress orders, set earlier operations to completed, middle ones to in_progress, later ones to pending
      const sequencePosition = operation.sequence_number / operations.length;
      
      if (sequencePosition < 0.4) {
        operationStatus = 'completed';
        actualStartDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
        actualEndDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
        actualTimeMinutes = operation.estimated_time_minutes * (0.8 + Math.random() * 0.4); // 80-120% of estimate
      } else if (sequencePosition < 0.6) {
        operationStatus = 'in_progress';
        actualStartDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
      } else {
        operationStatus = 'pending';
      }
    } else if (status === 'completed') {
      // All operations completed for completed orders
      operationStatus = 'completed';
      actualStartDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days ago
      actualEndDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
      actualTimeMinutes = operation.estimated_time_minutes * (0.8 + Math.random() * 0.4); // 80-120% of estimate
    }
    
    await runStatement(`
      INSERT INTO production_order_operations (
        production_order_id, operation_name, description,
        sequence_number, status, planned_start_date, planned_end_date,
        actual_start_date, actual_end_date, estimated_time_minutes,
        actual_time_minutes, labor_rate, machine_required, skill_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      operation.operation_name,
      operation.description || null,
      operation.sequence_number || 1,
      operationStatus,
      null, // planned_start_date
      null, // planned_end_date
      actualStartDate,
      actualEndDate,
      operation.estimated_time_minutes || 0,
      actualTimeMinutes,
      operation.labor_rate || 0,
      operation.machine_required || null,
      operation.skill_level || 'basic',
    ]);
  }
}

// Function to add all sample data
export const addAllSampleData = async () => {
  await addSampleInventoryData();
  await addSampleBOMData();
  await addSampleRequisitionsData();
  await addSamplePurchaseOrdersData();
  await addSampleProductionOrdersData();
  console.log('✅ All sample data added successfully!');
};