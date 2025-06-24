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
        { name: 'Woodcraft Supplies', contact_person: 'John Smith', email: 'john@woodcraft.com', phone: '+1-555-0101', address: '123 Lumber Lane, Portland, OR 97201' },
        { name: 'Cabinet Hardware Co', contact_person: 'Sarah Johnson', email: 'sarah@cabinethardware.com', phone: '+1-555-0102', address: '456 Hinge Ave, Chicago, IL 60601' },
        { name: 'Timber Products Inc', contact_person: 'Mike Wilson', email: 'mike@timberproducts.com', phone: '+1-555-0103', address: '789 Plywood Road, Seattle, WA 98101' },
        { name: 'Finishing Supplies Ltd', contact_person: 'Lisa Chen', email: 'lisa@finishingsupplies.com', phone: '+1-555-0104', address: '321 Stain Blvd, Los Angeles, CA 90210' },
        { name: 'Tool Warehouse', contact_person: 'David Brown', email: 'david@toolwarehouse.com', phone: '+1-555-0105', address: '654 Drill Way, Atlanta, GA 30301' }
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

    // Add categories if needed
    const woodworkingCategory = categories.find(c => c.name === 'Woodworking Materials');
    let woodworkingCategoryId;
    
    if (!woodworkingCategory) {
      const result = await runStatement(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        ['Woodworking Materials', 'Materials used in cabinet and furniture manufacturing']
      );
      woodworkingCategoryId = result.id;
    } else {
      woodworkingCategoryId = woodworkingCategory.id;
    }

    const hardwareCategory = categories.find(c => c.name === 'Cabinet Hardware');
    let hardwareCategoryId;
    
    if (!hardwareCategory) {
      const result = await runStatement(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        ['Cabinet Hardware', 'Hardware components for cabinets and furniture']
      );
      hardwareCategoryId = result.id;
    } else {
      hardwareCategoryId = hardwareCategory.id;
    }

    const finishingCategory = categories.find(c => c.name === 'Finishing Supplies');
    let finishingCategoryId;
    
    if (!finishingCategory) {
      const result = await runStatement(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        ['Finishing Supplies', 'Paints, stains, and finishing materials']
      );
      finishingCategoryId = result.id;
    } else {
      finishingCategoryId = finishingCategory.id;
    }

    // Add subcategories
    const subcategoriesData = [
      { name: 'Plywood', category_id: woodworkingCategoryId, description: 'Plywood sheets for cabinet construction' },
      { name: 'Solid Wood', category_id: woodworkingCategoryId, description: 'Solid wood boards and lumber' },
      { name: 'MDF', category_id: woodworkingCategoryId, description: 'Medium-density fiberboard sheets' },
      { name: 'Hinges', category_id: hardwareCategoryId, description: 'Cabinet door hinges' },
      { name: 'Pulls & Knobs', category_id: hardwareCategoryId, description: 'Cabinet handles and knobs' },
      { name: 'Drawer Slides', category_id: hardwareCategoryId, description: 'Drawer slide mechanisms' },
      { name: 'Paints', category_id: finishingCategoryId, description: 'Cabinet paints and primers' },
      { name: 'Stains', category_id: finishingCategoryId, description: 'Wood stains and dyes' },
      { name: 'Topcoats', category_id: finishingCategoryId, description: 'Varnishes, lacquers, and clear coats' }
    ];

    for (const subcategory of subcategoriesData) {
      const existingSubcategory = subcategories.find(sc => 
        sc.name === subcategory.name && sc.category_id === subcategory.category_id
      );
      
      if (!existingSubcategory) {
        await runStatement(
          'INSERT INTO subcategories (name, category_id, description) VALUES (?, ?, ?)',
          [subcategory.name, subcategory.category_id, subcategory.description]
        );
      }
    }

    // Refresh subcategories
    const updatedSubcategories = await runQuery('SELECT id, name, category_id FROM subcategories');

    // Helper function to get random item from array
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

    // Sample inventory items for cabinet manufacturing
    const sampleItems = [
      // Plywood
      {
        name: '3/4" Birch Plywood 4x8',
        sku: 'PLY-BIRCH-34',
        description: '3/4" thick birch plywood, 4\'x8\' sheet, cabinet grade',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Plywood')?.id,
        unit: 'Sheets',
        quantity: 45,
        min_quantity: 10,
        max_quantity: 100,
        unit_price: 64.99
      },
      {
        name: '1/2" Birch Plywood 4x8',
        sku: 'PLY-BIRCH-12',
        description: '1/2" thick birch plywood, 4\'x8\' sheet, cabinet grade',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Plywood')?.id,
        unit: 'Sheets',
        quantity: 32,
        min_quantity: 8,
        max_quantity: 80,
        unit_price: 54.99
      },
      {
        name: '3/4" Oak Plywood 4x8',
        sku: 'PLY-OAK-34',
        description: '3/4" thick red oak plywood, 4\'x8\' sheet, cabinet grade',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Plywood')?.id,
        unit: 'Sheets',
        quantity: 28,
        min_quantity: 5,
        max_quantity: 60,
        unit_price: 79.99
      },
      {
        name: '1/4" Maple Plywood 4x8',
        sku: 'PLY-MAPLE-14',
        description: '1/4" thick maple plywood, 4\'x8\' sheet, for cabinet backs',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Plywood')?.id,
        unit: 'Sheets',
        quantity: 36,
        min_quantity: 10,
        max_quantity: 80,
        unit_price: 42.99
      },
      
      // Solid Wood
      {
        name: 'Maple Board 1x4x8',
        sku: 'WOOD-MAPLE-148',
        description: '1"x4"x8\' solid maple board, S4S',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Solid Wood')?.id,
        unit: 'Pieces',
        quantity: 65,
        min_quantity: 15,
        max_quantity: 120,
        unit_price: 24.99
      },
      {
        name: 'Oak Board 1x3x6',
        sku: 'WOOD-OAK-136',
        description: '1"x3"x6\' solid red oak board, S4S',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Solid Wood')?.id,
        unit: 'Pieces',
        quantity: 48,
        min_quantity: 12,
        max_quantity: 100,
        unit_price: 18.99
      },
      
      // MDF
      {
        name: '3/4" MDF 4x8',
        sku: 'MDF-34-48',
        description: '3/4" medium density fiberboard, 4\'x8\' sheet',
        category_id: woodworkingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'MDF')?.id,
        unit: 'Sheets',
        quantity: 40,
        min_quantity: 10,
        max_quantity: 80,
        unit_price: 39.99
      },
      
      // Hinges
      {
        name: 'Soft-Close Hinge 110°',
        sku: 'HINGE-SC-110',
        description: '110° soft-close concealed hinge for frameless cabinets',
        category_id: hardwareCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Hinges')?.id,
        unit: 'Pairs',
        quantity: 250,
        min_quantity: 50,
        max_quantity: 500,
        unit_price: 4.99
      },
      {
        name: 'European Hinge 120°',
        sku: 'HINGE-EURO-120',
        description: '120° European style concealed cabinet hinge',
        category_id: hardwareCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Hinges')?.id,
        unit: 'Pairs',
        quantity: 180,
        min_quantity: 40,
        max_quantity: 400,
        unit_price: 3.49
      },
      
      // Pulls & Knobs
      {
        name: 'Stainless Bar Pull 5"',
        sku: 'PULL-SS-5',
        description: '5" stainless steel bar pull for cabinets and drawers',
        category_id: hardwareCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Pulls & Knobs')?.id,
        unit: 'Pieces',
        quantity: 320,
        min_quantity: 75,
        max_quantity: 600,
        unit_price: 2.99
      },
      {
        name: 'Round Knob 1.25"',
        sku: 'KNOB-RND-125',
        description: '1.25" round cabinet knob, brushed nickel finish',
        category_id: hardwareCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Pulls & Knobs')?.id,
        unit: 'Pieces',
        quantity: 280,
        min_quantity: 60,
        max_quantity: 500,
        unit_price: 1.99
      },
      
      // Drawer Slides
      {
        name: 'Soft-Close Drawer Slide 18"',
        sku: 'SLIDE-SC-18',
        description: '18" soft-close ball bearing drawer slides, full extension',
        category_id: hardwareCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Drawer Slides')?.id,
        unit: 'Pairs',
        quantity: 150,
        min_quantity: 30,
        max_quantity: 300,
        unit_price: 12.99
      },
      {
        name: 'Undermount Drawer Slide 22"',
        sku: 'SLIDE-UM-22',
        description: '22" undermount drawer slides with soft-close',
        category_id: hardwareCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Drawer Slides')?.id,
        unit: 'Pairs',
        quantity: 85,
        min_quantity: 20,
        max_quantity: 200,
        unit_price: 24.99
      },
      
      // Paints
      {
        name: 'Cabinet Paint White',
        sku: 'PAINT-CAB-WHT',
        description: 'Premium cabinet paint, white, 1 gallon',
        category_id: finishingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Paints')?.id,
        unit: 'Gallons',
        quantity: 24,
        min_quantity: 5,
        max_quantity: 50,
        unit_price: 45.99
      },
      {
        name: 'Cabinet Paint Gray',
        sku: 'PAINT-CAB-GRY',
        description: 'Premium cabinet paint, gray, 1 gallon',
        category_id: finishingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Paints')?.id,
        unit: 'Gallons',
        quantity: 18,
        min_quantity: 4,
        max_quantity: 40,
        unit_price: 45.99
      },
      
      // Stains
      {
        name: 'Wood Stain Dark Walnut',
        sku: 'STAIN-DW-QT',
        description: 'Wood stain, dark walnut color, 1 quart',
        category_id: finishingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Stains')?.id,
        unit: 'Quarts',
        quantity: 32,
        min_quantity: 8,
        max_quantity: 60,
        unit_price: 18.99
      },
      {
        name: 'Wood Stain Golden Oak',
        sku: 'STAIN-GO-QT',
        description: 'Wood stain, golden oak color, 1 quart',
        category_id: finishingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Stains')?.id,
        unit: 'Quarts',
        quantity: 28,
        min_quantity: 7,
        max_quantity: 55,
        unit_price: 18.99
      },
      
      // Topcoats
      {
        name: 'Polyurethane Clear Satin',
        sku: 'POLY-SAT-QT',
        description: 'Water-based polyurethane, clear satin finish, 1 quart',
        category_id: finishingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Topcoats')?.id,
        unit: 'Quarts',
        quantity: 22,
        min_quantity: 5,
        max_quantity: 45,
        unit_price: 24.99
      },
      {
        name: 'Lacquer Clear Gloss',
        sku: 'LAC-GLOSS-QT',
        description: 'Pre-catalyzed lacquer, clear gloss finish, 1 quart',
        category_id: finishingCategoryId,
        subcategory_id: updatedSubcategories.find(sc => sc.name === 'Topcoats')?.id,
        unit: 'Quarts',
        quantity: 16,
        min_quantity: 4,
        max_quantity: 35,
        unit_price: 29.99
      }
    ];

    // Insert sample items
    for (const item of sampleItems) {
      try {
        // Find matching unit
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
          item.category_id || null,
          item.subcategory_id || null,
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

    // Get admin user ID
    const adminUser = await runQuery('SELECT id FROM users WHERE username = ?', ['admin']);
    if (adminUser.length === 0) {
      console.error('Admin user not found, cannot add BOM data');
      return;
    }
    
    const adminId = adminUser[0].id;

    // Get suppliers data
    const suppliers = await runQuery('SELECT id, name FROM suppliers');

    // Get inventory items for components
    const plywood = await runQuery('SELECT id FROM inventory_items WHERE sku = ?', ['PLY-BIRCH-34']);
    const mdf = await runQuery('SELECT id FROM inventory_items WHERE sku = ?', ['MDF-34-48']);
    const hinges = await runQuery('SELECT id FROM inventory_items WHERE sku = ?', ['HINGE-SC-110']);
    const slides = await runQuery('SELECT id FROM inventory_items WHERE sku = ?', ['SLIDE-SC-18']);
    const pulls = await runQuery('SELECT id FROM inventory_items WHERE sku = ?', ['PULL-SS-5']);
    const paint = await runQuery('SELECT id FROM inventory_items WHERE sku = ?', ['PAINT-CAB-WHT']);
    
    // Insert sample BOM data for kitchen cabinet manufacturing
    await runStatement(`
      INSERT INTO bill_of_materials (name, description, version, status, created_by) VALUES 
      ('Base Cabinet 24"', 'Standard 24-inch base cabinet with door and drawer', '1.0', 'active', ?),
      ('Wall Cabinet 30"', 'Standard 30-inch wall cabinet with adjustable shelves', '1.0', 'active', ?),
      ('Drawer Box 18"', 'Standard 18-inch drawer box assembly', '1.0', 'active', ?),
      ('Cabinet Door 24x30', 'Raised panel cabinet door 24" x 30"', '1.0', 'active', ?),
      ('Face Frame Assembly', 'Standard face frame for base cabinet', '1.0', 'active', ?)
    `, [adminId, adminId, adminId, adminId, adminId]);

    // Get the BOM IDs
    const boms = await runQuery('SELECT id, name FROM bill_of_materials');
    
    // Add components to BOMs
    if (plywood.length > 0 && hinges.length > 0) {
      const baseCabinetBom = boms.find(b => b.name === 'Base Cabinet 24"');
      if (baseCabinetBom) {
        await runStatement(`
          INSERT INTO bom_components (bom_id, item_id, quantity, waste_factor, notes, sort_order) VALUES 
          (?, ?, 0.75, 0.1, 'For cabinet sides, bottom, and shelves', 1),
          (?, ?, 0.25, 0.05, 'For cabinet back', 2),
          (?, ?, 2, 0, 'For cabinet door', 3),
          (?, ?, 1, 0, 'For drawer box', 4)
        `, [
          baseCabinetBom.id, plywood[0].id,
          baseCabinetBom.id, mdf[0].id,
          baseCabinetBom.id, hinges[0].id,
          baseCabinetBom.id, slides[0].id
        ]);
      }
      
      const wallCabinetBom = boms.find(b => b.name === 'Wall Cabinet 30"');
      if (wallCabinetBom) {
        await runStatement(`
          INSERT INTO bom_components (bom_id, item_id, quantity, waste_factor, notes, sort_order) VALUES 
          (?, ?, 0.6, 0.1, 'For cabinet sides, top, bottom, and shelves', 1),
          (?, ?, 0.2, 0.05, 'For cabinet back', 2),
          (?, ?, 2, 0, 'For cabinet doors', 3)
        `, [
          wallCabinetBom.id, plywood[0].id,
          wallCabinetBom.id, mdf[0].id,
          wallCabinetBom.id, hinges[0].id
        ]);
      }
    }

    // Insert sample operations for cabinet manufacturing
    const baseCabinetBom = boms.find(b => b.name === 'Base Cabinet 24"');
    if (baseCabinetBom) {
      await runStatement(`
        INSERT INTO bom_operations (bom_id, operation_name, description, sequence_number, estimated_time_minutes, labor_rate, machine_required, skill_level) VALUES 
        (?, 'Cut Parts', 'Cut all cabinet parts to size', 1, 45, 25.00, 'Table Saw', 'intermediate'),
        (?, 'Drill Holes', 'Drill shelf pin and hinge holes', 2, 30, 22.00, 'Drill Press', 'basic'),
        (?, 'Sand Parts', 'Sand all parts to 220 grit', 3, 60, 18.00, 'Random Orbital Sander', 'basic'),
        (?, 'Assemble Cabinet', 'Assemble cabinet box with glue and screws', 4, 90, 28.00, 'Assembly Table', 'intermediate'),
        (?, 'Install Hardware', 'Install hinges, drawer slides, and handles', 5, 45, 25.00, 'Hand Tools', 'intermediate'),
        (?, 'Final Inspection', 'Quality check and final adjustments', 6, 15, 30.00, 'None', 'advanced')
      `, [
        baseCabinetBom.id, baseCabinetBom.id, baseCabinetBom.id, 
        baseCabinetBom.id, baseCabinetBom.id, baseCabinetBom.id
      ]);
    }

    // Add sample requisitions
    const adminUserId = adminUser[0].id;
    
    // Create a sample requisition
    const requisitionResult = await runStatement(`
      INSERT INTO requisitions (
        title, description, priority, required_date, department,
        requester_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'approved')
    `, [
      'Cabinet Hardware for Project #1234',
      'Hardware needed for kitchen remodel project #1234',
      'high',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      'Production',
      adminId
    ]);

    const requisitionId = requisitionResult.id;

    // Add requisition items
    if (hinges.length > 0 && pulls.length > 0 && slides.length > 0) {
      await runStatement(`
        INSERT INTO requisition_items (
          requisition_id, item_id, quantity, estimated_cost, notes, status, approved_quantity
        ) VALUES 
        (?, ?, 20, ?, 'For kitchen cabinet doors', 'approved', 20),
        (?, ?, 15, ?, 'For cabinet drawers and doors', 'approved', 15),
        (?, ?, 10, ?, 'For kitchen drawers', 'approved', 10)
      `, [
        requisitionId, hinges[0].id, 4.99 * 20,
        requisitionId, pulls[0].id, 2.99 * 15,
        requisitionId, slides[0].id, 12.99 * 10
      ]);
    }

    // Create a sample purchase order
    if (suppliers.length > 0) {
      const hardwareSupplier = suppliers.find(s => s.name === 'Cabinet Hardware Co');
      const supplierId = hardwareSupplier ? hardwareSupplier.id : suppliers[0].id;
      
      const poResult = await runStatement(`
        INSERT INTO purchase_orders (
          po_number, title, description, supplier_id, status,
          priority, order_date, expected_delivery_date, subtotal,
          tax_amount, shipping_cost, total_amount, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'PO-2025-0001',
        'Cabinet Hardware Order',
        'Order for Project #1234 kitchen remodel',
        supplierId,
        'sent',
        'high',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        500.00,
        50.00,
        25.00,
        575.00,
        adminId
      ]);

      const poId = poResult.id;

      // Add PO items
      if (hinges.length > 0 && pulls.length > 0 && slides.length > 0) {
        await runStatement(`
          INSERT INTO purchase_order_items (
            po_id, item_id, item_name, item_description, sku,
            quantity, unit_price, total_price, received_quantity
          ) VALUES 
          (?, ?, 'Soft-Close Hinge 110°', 'Soft-close concealed cabinet hinges', ?, 30, 4.99, 149.70, 15),
          (?, ?, 'Stainless Bar Pull 5"', 'Stainless steel cabinet pulls', ?, 25, 2.99, 74.75, 10),
          (?, ?, 'Soft-Close Drawer Slide 18"', 'Full extension drawer slides', ?, 20, 12.99, 259.80, 5)
        `, [
          poId, hinges[0].id, 'HINGE-SC-110',
          poId, pulls[0].id, 'PULL-SS-5',
          poId, slides[0].id, 'SLIDE-SC-18'
        ]);
      }
    }

    console.log('✅ Sample BOM data and related records added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample BOM data:', error);
  }
};