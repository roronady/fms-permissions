import express from 'express';
import { runQuery, runStatement } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditTrail } from '../utils/audit.js';
import { 
  calculateTotalValue,
  handleInventoryExport,
  handleInventoryImport
} from '../utils/inventoryHelpers.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all inventory items with search and filters
router.get('/items', async (req, res) => {
  try {
    const { search, category, supplier, lowStock, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT 
        i.*,
        c.name as category_name,
        sc.name as subcategory_name,
        u.name as unit_name,
        l.name as location_name,
        s.name as supplier_name,
        CASE WHEN i.quantity <= i.min_quantity THEN 1 ELSE 0 END as is_low_stock,
        (
          SELECT price 
          FROM price_history ph1 
          WHERE ph1.item_id = i.id 
          AND ph1.created_at < (
            SELECT MAX(ph2.created_at) 
            FROM price_history ph2 
            WHERE ph2.item_id = i.id
          )
          ORDER BY ph1.created_at DESC 
          LIMIT 1
        ) as last_price,
        (
          SELECT ROUND(AVG(price), 2)
          FROM price_history ph3
          WHERE ph3.item_id = i.id
        ) as average_price
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN subcategories sc ON i.subcategory_id = sc.id
      LEFT JOIN units u ON i.unit_id = u.id
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      sql += ` AND (i.name LIKE ? OR i.sku LIKE ? OR i.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ` AND i.category_id = ?`;
      params.push(category);
    }

    if (supplier) {
      sql += ` AND i.supplier_id = ?`;
      params.push(supplier);
    }

    if (lowStock === 'true') {
      sql += ` AND i.quantity <= i.min_quantity`;
    }

    sql += ` ORDER BY i.updated_at DESC`;

    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const items = await runQuery(sql, params);
    
    // Calculate total_value based on price priority for each item
    const itemsWithCalculatedValue = items.map(item => ({
      ...item,
      total_value: calculateTotalValue(
        item.quantity,
        item.unit_price,
        item.last_price,
        item.average_price
      )
    }));
    
    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM inventory_items i
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countSql += ` AND (i.name LIKE ? OR i.sku LIKE ? OR i.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      countSql += ` AND i.category_id = ?`;
      countParams.push(category);
    }

    if (supplier) {
      countSql += ` AND i.supplier_id = ?`;
      countParams.push(supplier);
    }

    if (lowStock === 'true') {
      countSql += ` AND i.quantity <= i.min_quantity`;
    }

    const countResult = await runQuery(countSql, countParams);
    const total = countResult[0].total;

    const response = {
      items: itemsWithCalculatedValue || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: Math.ceil((total || 0) / parseInt(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get single inventory item
router.get('/items/:id', async (req, res) => {
  try {
    const items = await runQuery(`
      SELECT 
        i.*,
        c.name as category_name,
        sc.name as subcategory_name,
        u.name as unit_name,
        l.name as location_name,
        s.name as supplier_name,
        (
          SELECT price 
          FROM price_history ph1 
          WHERE ph1.item_id = i.id 
          AND ph1.created_at < (
            SELECT MAX(ph2.created_at) 
            FROM price_history ph2 
            WHERE ph2.item_id = i.id
          )
          ORDER BY ph1.created_at DESC 
          LIMIT 1
        ) as last_price,
        (
          SELECT ROUND(AVG(price), 2)
          FROM price_history ph3
          WHERE ph3.item_id = i.id
        ) as average_price
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN subcategories sc ON i.subcategory_id = sc.id
      LEFT JOIN units u ON i.unit_id = u.id
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = items[0];
    item.total_value = calculateTotalValue(
      item.quantity,
      item.unit_price,
      item.last_price,
      item.average_price
    );

    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create inventory item
router.post('/items', async (req, res) => {
  try {
    const {
      name, sku, description, category_id, subcategory_id,
      unit_id, location_id, supplier_id, quantity,
      min_quantity, max_quantity, unit_price
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Name and SKU are required' });
    }

    // Calculate initial total value
    const totalValue = calculateTotalValue(quantity || 0, unit_price || 0, null, null);

    const result = await runStatement(`
      INSERT INTO inventory_items (
        name, sku, description, category_id, subcategory_id,
        unit_id, location_id, supplier_id, quantity,
        min_quantity, max_quantity, unit_price, total_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, sku, description, category_id, subcategory_id,
      unit_id, location_id, supplier_id, quantity || 0,
      min_quantity || 0, max_quantity || 1000, unit_price || 0, totalValue
    ]);

    // Add price history entry
    if (unit_price && unit_price > 0) {
      await runStatement(`
        INSERT INTO price_history (item_id, price) VALUES (?, ?)
      `, [result.id, unit_price]);
    }

    await logAuditTrail('inventory_items', result.id, 'INSERT', null, req.body, req.user.id);

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').to('inventory_updates').emit('item_created', {
        id: result.id,
        ...req.body
      });
    }

    res.status(201).json({ id: result.id, message: 'Item created successfully' });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create inventory item' });
    }
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Get current item for audit trail
    const currentItems = await runQuery(`
      SELECT i.*,
        (SELECT ROUND(AVG(price), 2) FROM price_history WHERE item_id = i.id) as average_price,
        (SELECT price FROM price_history WHERE item_id = i.id ORDER BY created_at DESC LIMIT 1) as last_price
      FROM inventory_items i WHERE i.id = ?
    `, [itemId]);
    
    if (currentItems.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentItem = currentItems[0];
    
    const {
      name, sku, description, category_id, subcategory_id,
      unit_id, location_id, supplier_id, quantity,
      min_quantity, max_quantity, unit_price
    } = req.body;

    // Calculate new total value
    const totalValue = calculateTotalValue(
      quantity,
      unit_price,
      currentItem.last_price,
      currentItem.average_price
    );

    await runStatement(`
      UPDATE inventory_items SET
        name = ?, sku = ?, description = ?, category_id = ?, subcategory_id = ?,
        unit_id = ?, location_id = ?, supplier_id = ?, quantity = ?,
        min_quantity = ?, max_quantity = ?, unit_price = ?, total_value = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, sku, description, category_id, subcategory_id,
      unit_id, location_id, supplier_id, quantity,
      min_quantity, max_quantity, unit_price, totalValue, itemId
    ]);

    // Add price history entry if price changed
    if (unit_price && unit_price !== currentItem.unit_price) {
      await runStatement(`
        INSERT INTO price_history (item_id, price) VALUES (?, ?)
      `, [itemId, unit_price]);
    }

    await logAuditTrail('inventory_items', itemId, 'UPDATE', currentItem, req.body, req.user.id);

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').to('inventory_updates').emit('item_updated', {
        id: itemId,
        ...req.body
      });
    }

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  }
});

// Delete inventory item
router.delete('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Get current item for audit trail
    const currentItems = await runQuery('SELECT * FROM inventory_items WHERE id = ?', [itemId]);
    if (currentItems.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await runStatement('DELETE FROM inventory_items WHERE id = ?', [itemId]);
    await logAuditTrail('inventory_items', itemId, 'DELETE', currentItems[0], null, req.user.id);

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').to('inventory_updates').emit('item_deleted', { id: itemId });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Get dropdown data
router.get('/dropdown-data', async (req, res) => {
  try {
    const [categories, subcategories, units, locations, suppliers] = await Promise.all([
      runQuery('SELECT * FROM categories ORDER BY name'),
      runQuery('SELECT * FROM subcategories ORDER BY name'),
      runQuery('SELECT * FROM units ORDER BY name'),
      runQuery('SELECT * FROM locations ORDER BY name'),
      runQuery('SELECT * FROM suppliers ORDER BY name')
    ]);

    res.json({
      categories: categories || [],
      subcategories: subcategories || [],
      units: units || [],
      locations: locations || [],
      suppliers: suppliers || []
    });
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    res.status(500).json({ error: 'Failed to fetch dropdown data' });
  }
});

// Export to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { columns, title } = req.query;
    const options = {
      columns: columns ? columns.split(',') : undefined,
      title: title || undefined
    };
    
    await handleInventoryExport(req, res, 'csv', options);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Import from CSV
router.post('/import/csv', async (req, res) => {
  try {
    await handleInventoryImport(req, res);
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// Generate PDF report
router.get('/export/pdf', async (req, res) => {
  try {
    const { columns, title } = req.query;
    const options = {
      columns: columns ? columns.split(',') : undefined,
      title: title || undefined
    };
    
    await handleInventoryExport(req, res, 'pdf', options);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;