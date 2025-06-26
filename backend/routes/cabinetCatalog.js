import express from 'express';
import { runQuery, runStatement } from '../database/connection.js';
import { authenticateToken, requireAdmin, checkPermission } from '../middleware/auth.js';
import { logAuditTrail } from '../utils/audit.js';
import { calculateCabinetCost, generateCabinetBOM } from '../utils/cabinetCalculator.js';
import { generatePDF } from '../utils/pdf-generator.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ===== ADMIN ROUTES =====

// Get all cabinet models (admin)
router.get('/models', checkPermission('master_data.view'), async (req, res) => {
  try {
    const models = await runQuery(`
      SELECT 
        cm.*,
        COUNT(DISTINCT cmm.id) as material_count,
        COUNT(DISTINCT cma.id) as accessory_count
      FROM cabinet_models cm
      LEFT JOIN cabinet_model_materials cmm ON cm.id = cmm.cabinet_model_id
      LEFT JOIN cabinet_model_accessories cma ON cm.id = cma.cabinet_model_id
      GROUP BY cm.id
      ORDER BY cm.name
    `);
    
    res.json(models);
  } catch (error) {
    console.error('Error fetching cabinet models:', error);
    res.status(500).json({ error: 'Failed to fetch cabinet models' });
  }
});

// Get single cabinet model with materials and accessories (admin)
router.get('/models/:id', checkPermission('master_data.view'), async (req, res) => {
  try {
    const modelId = req.params.id;
    
    // Get cabinet model
    const models = await runQuery('SELECT * FROM cabinet_models WHERE id = ?', [modelId]);
    
    if (models.length === 0) {
      return res.status(404).json({ error: 'Cabinet model not found' });
    }
    
    const model = models[0];
    
    // Get materials for this model
    const materials = await runQuery(`
      SELECT 
        cmm.*,
        i.name as material_name,
        i.sku as material_sku,
        i.unit_price as material_base_price,
        i.item_type
      FROM cabinet_model_materials cmm
      JOIN inventory_items i ON cmm.material_item_id = i.id
      WHERE cmm.cabinet_model_id = ?
    `, [modelId]);
    
    // Get accessories for this model
    const accessories = await runQuery(`
      SELECT 
        cma.*,
        i.name as accessory_name,
        i.sku as accessory_sku,
        i.unit_price as accessory_base_price,
        i.item_type
      FROM cabinet_model_accessories cma
      JOIN inventory_items i ON cma.accessory_item_id = i.id
      WHERE cma.cabinet_model_id = ?
    `, [modelId]);
    
    res.json({
      ...model,
      materials,
      accessories
    });
  } catch (error) {
    console.error('Error fetching cabinet model details:', error);
    res.status(500).json({ error: 'Failed to fetch cabinet model details' });
  }
});

// Create cabinet model (admin)
router.post('/models', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const {
      name,
      description,
      default_width,
      default_height,
      default_depth,
      min_width,
      max_width,
      min_height,
      max_height,
      min_depth,
      max_depth,
      base_cost
    } = req.body;
    
    if (!name || !default_width || !default_height || !default_depth) {
      return res.status(400).json({ error: 'Name and default dimensions are required' });
    }
    
    const result = await runStatement(`
      INSERT INTO cabinet_models (
        name, description, default_width, default_height, default_depth,
        min_width, max_width, min_height, max_height, min_depth, max_depth,
        base_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      description || '',
      default_width,
      default_height,
      default_depth,
      min_width || default_width * 0.5,
      max_width || default_width * 2,
      min_height || default_height * 0.5,
      max_height || default_height * 2,
      min_depth || default_depth * 0.5,
      max_depth || default_depth * 2,
      base_cost || 0
    ]);
    
    await logAuditTrail('cabinet_models', result.id, 'INSERT', null, req.body, req.user.id);
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Cabinet model created successfully' 
    });
  } catch (error) {
    console.error('Error creating cabinet model:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Cabinet model name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create cabinet model' });
    }
  }
});

// Update cabinet model (admin)
router.put('/models/:id', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const modelId = req.params.id;
    const {
      name,
      description,
      default_width,
      default_height,
      default_depth,
      min_width,
      max_width,
      min_height,
      max_height,
      min_depth,
      max_depth,
      base_cost
    } = req.body;
    
    // Get current model for audit trail
    const currentModels = await runQuery('SELECT * FROM cabinet_models WHERE id = ?', [modelId]);
    if (currentModels.length === 0) {
      return res.status(404).json({ error: 'Cabinet model not found' });
    }
    
    await runStatement(`
      UPDATE cabinet_models SET
        name = ?,
        description = ?,
        default_width = ?,
        default_height = ?,
        default_depth = ?,
        min_width = ?,
        max_width = ?,
        min_height = ?,
        max_height = ?,
        min_depth = ?,
        max_depth = ?,
        base_cost = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      description || '',
      default_width,
      default_height,
      default_depth,
      min_width,
      max_width,
      min_height,
      max_height,
      min_depth,
      max_depth,
      base_cost || 0,
      modelId
    ]);
    
    await logAuditTrail('cabinet_models', modelId, 'UPDATE', currentModels[0], req.body, req.user.id);
    
    res.json({ message: 'Cabinet model updated successfully' });
  } catch (error) {
    console.error('Error updating cabinet model:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Cabinet model name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update cabinet model' });
    }
  }
});

// Delete cabinet model (admin)
router.delete('/models/:id', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const modelId = req.params.id;
    
    // Get current model for audit trail
    const currentModels = await runQuery('SELECT * FROM cabinet_models WHERE id = ?', [modelId]);
    if (currentModels.length === 0) {
      return res.status(404).json({ error: 'Cabinet model not found' });
    }
    
    // Check if model is used in any kitchen projects
    const usedInProjects = await runQuery(
      'SELECT COUNT(*) as count FROM kitchen_project_cabinets WHERE cabinet_model_id = ?',
      [modelId]
    );
    
    if (usedInProjects[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete cabinet model that is used in kitchen projects',
        usedCount: usedInProjects[0].count
      });
    }
    
    // Delete model (materials and accessories will be deleted via CASCADE)
    await runStatement('DELETE FROM cabinet_models WHERE id = ?', [modelId]);
    
    await logAuditTrail('cabinet_models', modelId, 'DELETE', currentModels[0], null, req.user.id);
    
    res.json({ message: 'Cabinet model deleted successfully' });
  } catch (error) {
    console.error('Error deleting cabinet model:', error);
    res.status(500).json({ error: 'Failed to delete cabinet model' });
  }
});

// Get available materials (admin)
router.get('/materials', checkPermission('master_data.view'), async (req, res) => {
  try {
    const materials = await runQuery(`
      SELECT 
        i.*,
        c.name as category_name,
        u.name as unit_name
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units u ON i.unit_id = u.id
      WHERE i.item_type = 'sheet_material'
      ORDER BY i.name
    `);
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get available accessories (admin)
router.get('/accessories', checkPermission('master_data.view'), async (req, res) => {
  try {
    const accessories = await runQuery(`
      SELECT 
        i.*,
        c.name as category_name,
        u.name as unit_name
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units u ON i.unit_id = u.id
      WHERE i.item_type = 'hardware_accessory'
      ORDER BY i.name
    `);
    
    res.json(accessories);
  } catch (error) {
    console.error('Error fetching accessories:', error);
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
});

// Add or update material for cabinet model (admin)
router.post('/models/:id/materials', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const modelId = req.params.id;
    const { material_item_id, cost_factor_per_sqft } = req.body;
    
    if (!material_item_id || cost_factor_per_sqft === undefined) {
      return res.status(400).json({ error: 'Material ID and cost factor are required' });
    }
    
    // Check if cabinet model exists
    const models = await runQuery('SELECT * FROM cabinet_models WHERE id = ?', [modelId]);
    if (models.length === 0) {
      return res.status(404).json({ error: 'Cabinet model not found' });
    }
    
    // Check if material exists and is of the correct type
    const materials = await runQuery(
      'SELECT * FROM inventory_items WHERE id = ? AND item_type = ?',
      [material_item_id, 'sheet_material']
    );
    
    if (materials.length === 0) {
      return res.status(400).json({ error: 'Material not found or not a sheet material' });
    }
    
    // Check if this material is already linked to this model
    const existingLinks = await runQuery(
      'SELECT * FROM cabinet_model_materials WHERE cabinet_model_id = ? AND material_item_id = ?',
      [modelId, material_item_id]
    );
    
    if (existingLinks.length > 0) {
      // Update existing link
      await runStatement(
        'UPDATE cabinet_model_materials SET cost_factor_per_sqft = ? WHERE cabinet_model_id = ? AND material_item_id = ?',
        [cost_factor_per_sqft, modelId, material_item_id]
      );
      
      res.json({ message: 'Material updated successfully' });
    } else {
      // Create new link
      const result = await runStatement(
        'INSERT INTO cabinet_model_materials (cabinet_model_id, material_item_id, cost_factor_per_sqft) VALUES (?, ?, ?)',
        [modelId, material_item_id, cost_factor_per_sqft]
      );
      
      res.status(201).json({ 
        id: result.id, 
        message: 'Material added successfully' 
      });
    }
  } catch (error) {
    console.error('Error adding/updating material:', error);
    res.status(500).json({ error: 'Failed to add/update material' });
  }
});

// Remove material from cabinet model (admin)
router.delete('/models/:id/materials/:materialId', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const modelId = req.params.id;
    const materialId = req.params.materialId;
    
    await runStatement(
      'DELETE FROM cabinet_model_materials WHERE cabinet_model_id = ? AND material_item_id = ?',
      [modelId, materialId]
    );
    
    res.json({ message: 'Material removed successfully' });
  } catch (error) {
    console.error('Error removing material:', error);
    res.status(500).json({ error: 'Failed to remove material' });
  }
});

// Add or update accessory for cabinet model (admin)
router.post('/models/:id/accessories', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const modelId = req.params.id;
    const { accessory_item_id, quantity_per_cabinet, cost_factor_per_unit } = req.body;
    
    if (!accessory_item_id || !quantity_per_cabinet) {
      return res.status(400).json({ error: 'Accessory ID and quantity are required' });
    }
    
    // Check if cabinet model exists
    const models = await runQuery('SELECT * FROM cabinet_models WHERE id = ?', [modelId]);
    if (models.length === 0) {
      return res.status(404).json({ error: 'Cabinet model not found' });
    }
    
    // Check if accessory exists and is of the correct type
    const accessories = await runQuery(
      'SELECT * FROM inventory_items WHERE id = ? AND item_type = ?',
      [accessory_item_id, 'hardware_accessory']
    );
    
    if (accessories.length === 0) {
      return res.status(400).json({ error: 'Accessory not found or not a hardware accessory' });
    }
    
    // Check if this accessory is already linked to this model
    const existingLinks = await runQuery(
      'SELECT * FROM cabinet_model_accessories WHERE cabinet_model_id = ? AND accessory_item_id = ?',
      [modelId, accessory_item_id]
    );
    
    if (existingLinks.length > 0) {
      // Update existing link
      await runStatement(
        'UPDATE cabinet_model_accessories SET quantity_per_cabinet = ?, cost_factor_per_unit = ? WHERE cabinet_model_id = ? AND accessory_item_id = ?',
        [quantity_per_cabinet, cost_factor_per_unit || 0, modelId, accessory_item_id]
      );
      
      res.json({ message: 'Accessory updated successfully' });
    } else {
      // Create new link
      const result = await runStatement(
        'INSERT INTO cabinet_model_accessories (cabinet_model_id, accessory_item_id, quantity_per_cabinet, cost_factor_per_unit) VALUES (?, ?, ?, ?)',
        [modelId, accessory_item_id, quantity_per_cabinet, cost_factor_per_unit || 0]
      );
      
      res.status(201).json({ 
        id: result.id, 
        message: 'Accessory added successfully' 
      });
    }
  } catch (error) {
    console.error('Error adding/updating accessory:', error);
    res.status(500).json({ error: 'Failed to add/update accessory' });
  }
});

// Remove accessory from cabinet model (admin)
router.delete('/models/:id/accessories/:accessoryId', checkPermission('master_data.manage_categories'), async (req, res) => {
  try {
    const modelId = req.params.id;
    const accessoryId = req.params.accessoryId;
    
    await runStatement(
      'DELETE FROM cabinet_model_accessories WHERE cabinet_model_id = ? AND accessory_item_id = ?',
      [modelId, accessoryId]
    );
    
    res.json({ message: 'Accessory removed successfully' });
  } catch (error) {
    console.error('Error removing accessory:', error);
    res.status(500).json({ error: 'Failed to remove accessory' });
  }
});

// ===== CLIENT ROUTES =====

// Browse available cabinet models (client)
router.get('/browse', async (req, res) => {
  try {
    const models = await runQuery(`
      SELECT 
        cm.*,
        COUNT(DISTINCT cmm.id) as material_options_count,
        COUNT(DISTINCT cma.id) as accessory_options_count
      FROM cabinet_models cm
      LEFT JOIN cabinet_model_materials cmm ON cm.id = cmm.cabinet_model_id
      LEFT JOIN cabinet_model_accessories cma ON cm.id = cma.cabinet_model_id
      GROUP BY cm.id
      ORDER BY cm.name
    `);
    
    res.json(models);
  } catch (error) {
    console.error('Error fetching cabinet models:', error);
    res.status(500).json({ error: 'Failed to fetch cabinet models' });
  }
});

// Get available materials for a cabinet model (client)
router.get('/models/:id/materials', async (req, res) => {
  try {
    const modelId = req.params.id;
    
    const materials = await runQuery(`
      SELECT 
        cmm.material_item_id as id,
        cmm.cost_factor_per_sqft,
        i.name,
        i.description,
        i.sku,
        i.unit_price as base_price,
        i.image_url
      FROM cabinet_model_materials cmm
      JOIN inventory_items i ON cmm.material_item_id = i.id
      WHERE cmm.cabinet_model_id = ?
      ORDER BY i.name
    `, [modelId]);
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials for cabinet model:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get available accessories for a cabinet model (client)
router.get('/models/:id/accessories', async (req, res) => {
  try {
    const modelId = req.params.id;
    
    const accessories = await runQuery(`
      SELECT 
        cma.accessory_item_id as id,
        cma.quantity_per_cabinet,
        cma.cost_factor_per_unit,
        i.name,
        i.description,
        i.sku,
        i.unit_price as base_price,
        i.image_url
      FROM cabinet_model_accessories cma
      JOIN inventory_items i ON cma.accessory_item_id = i.id
      WHERE cma.cabinet_model_id = ?
      ORDER BY i.name
    `, [modelId]);
    
    res.json(accessories);
  } catch (error) {
    console.error('Error fetching accessories for cabinet model:', error);
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
});

// Calculate cabinet cost (client)
router.post('/calculate', async (req, res) => {
  try {
    const { cabinet_model_id, dimensions, material_id, selected_accessories } = req.body;
    
    if (!cabinet_model_id || !dimensions || !material_id) {
      return res.status(400).json({ error: 'Cabinet model, dimensions, and material are required' });
    }
    
    const costBreakdown = await calculateCabinetCost(
      cabinet_model_id,
      dimensions,
      material_id,
      selected_accessories || []
    );
    
    res.json(costBreakdown);
  } catch (error) {
    console.error('Error calculating cabinet cost:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate cabinet cost' });
  }
});

// ===== KITCHEN PROJECT ROUTES =====

// Get all kitchen projects for the current user
router.get('/projects', async (req, res) => {
  try {
    const projects = await runQuery(`
      SELECT 
        kp.*,
        u.username as client_name,
        COUNT(kpc.id) as cabinet_count
      FROM kitchen_projects kp
      LEFT JOIN users u ON kp.client_id = u.id
      LEFT JOIN kitchen_project_cabinets kpc ON kp.id = kpc.kitchen_project_id
      WHERE kp.client_id = ?
      GROUP BY kp.id
      ORDER BY kp.updated_at DESC
    `, [req.user.id]);
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching kitchen projects:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen projects' });
  }
});

// Create a new kitchen project
router.post('/projects', async (req, res) => {
  try {
    const { name, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const result = await runStatement(`
      INSERT INTO kitchen_projects (name, client_id, notes)
      VALUES (?, ?, ?)
    `, [name, req.user.id, notes || '']);
    
    await logAuditTrail('kitchen_projects', result.id, 'INSERT', null, req.body, req.user.id);
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Kitchen project created successfully' 
    });
  } catch (error) {
    console.error('Error creating kitchen project:', error);
    res.status(500).json({ error: 'Failed to create kitchen project' });
  }
});

// Get a specific kitchen project with its cabinets
router.get('/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get project details
    const projects = await runQuery(`
      SELECT kp.*, u.username as client_name
      FROM kitchen_projects kp
      LEFT JOIN users u ON kp.client_id = u.id
      WHERE kp.id = ? AND kp.client_id = ?
    `, [projectId, req.user.id]);
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    const project = projects[0];
    
    // Get cabinets for this project
    const cabinets = await runQuery(`
      SELECT 
        kpc.*,
        cm.name as model_name,
        i.name as material_name,
        i.image_url as material_image
      FROM kitchen_project_cabinets kpc
      JOIN cabinet_models cm ON kpc.cabinet_model_id = cm.id
      JOIN inventory_items i ON kpc.selected_material_id = i.id
      WHERE kpc.kitchen_project_id = ?
      ORDER BY kpc.created_at
    `, [projectId]);
    
    // Parse selected_accessories JSON for each cabinet
    const cabinetsWithParsedAccessories = cabinets.map(cabinet => ({
      ...cabinet,
      selected_accessories: cabinet.selected_accessories ? JSON.parse(cabinet.selected_accessories) : []
    }));
    
    res.json({
      ...project,
      cabinets: cabinetsWithParsedAccessories
    });
  } catch (error) {
    console.error('Error fetching kitchen project:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen project' });
  }
});

// Add a cabinet to a kitchen project
router.post('/projects/:id/add-cabinet', async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      cabinet_model_id,
      custom_width,
      custom_height,
      custom_depth,
      selected_material_id,
      selected_accessories,
      notes
    } = req.body;
    
    if (!cabinet_model_id || !custom_width || !custom_height || !custom_depth || !selected_material_id) {
      return res.status(400).json({ error: 'Cabinet model, dimensions, and material are required' });
    }
    
    // Check if project exists and belongs to the current user
    const projects = await runQuery(
      'SELECT * FROM kitchen_projects WHERE id = ? AND client_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    // Calculate cabinet cost
    const costBreakdown = await calculateCabinetCost(
      cabinet_model_id,
      { width: custom_width, height: custom_height, depth: custom_depth },
      selected_material_id,
      selected_accessories || []
    );
    
    // Insert cabinet
    const result = await runStatement(`
      INSERT INTO kitchen_project_cabinets (
        kitchen_project_id,
        cabinet_model_id,
        custom_width,
        custom_height,
        custom_depth,
        selected_material_id,
        selected_accessories,
        calculated_cost,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId,
      cabinet_model_id,
      custom_width,
      custom_height,
      custom_depth,
      selected_material_id,
      JSON.stringify(selected_accessories || []),
      costBreakdown.total_cost,
      notes || ''
    ]);
    
    // Update project total cost
    await updateProjectTotalCost(projectId);
    
    res.status(201).json({ 
      id: result.id, 
      cost: costBreakdown.total_cost,
      message: 'Cabinet added to project successfully' 
    });
  } catch (error) {
    console.error('Error adding cabinet to project:', error);
    res.status(500).json({ error: error.message || 'Failed to add cabinet to project' });
  }
});

// Update a cabinet in a kitchen project
router.put('/projects/:id/update-cabinet/:cabinetId', async (req, res) => {
  try {
    const projectId = req.params.id;
    const cabinetId = req.params.cabinetId;
    const {
      custom_width,
      custom_height,
      custom_depth,
      selected_material_id,
      selected_accessories,
      notes
    } = req.body;
    
    // Check if project exists and belongs to the current user
    const projects = await runQuery(
      'SELECT * FROM kitchen_projects WHERE id = ? AND client_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    // Check if cabinet exists and belongs to the project
    const cabinets = await runQuery(
      'SELECT * FROM kitchen_project_cabinets WHERE id = ? AND kitchen_project_id = ?',
      [cabinetId, projectId]
    );
    
    if (cabinets.length === 0) {
      return res.status(404).json({ error: 'Cabinet not found in this project' });
    }
    
    const cabinet = cabinets[0];
    
    // Calculate new cabinet cost
    const costBreakdown = await calculateCabinetCost(
      cabinet.cabinet_model_id,
      { 
        width: custom_width || cabinet.custom_width, 
        height: custom_height || cabinet.custom_height, 
        depth: custom_depth || cabinet.custom_depth 
      },
      selected_material_id || cabinet.selected_material_id,
      selected_accessories || JSON.parse(cabinet.selected_accessories || '[]')
    );
    
    // Update cabinet
    await runStatement(`
      UPDATE kitchen_project_cabinets SET
        custom_width = ?,
        custom_height = ?,
        custom_depth = ?,
        selected_material_id = ?,
        selected_accessories = ?,
        calculated_cost = ?,
        notes = ?
      WHERE id = ?
    `, [
      custom_width || cabinet.custom_width,
      custom_height || cabinet.custom_height,
      custom_depth || cabinet.custom_depth,
      selected_material_id || cabinet.selected_material_id,
      JSON.stringify(selected_accessories || JSON.parse(cabinet.selected_accessories || '[]')),
      costBreakdown.total_cost,
      notes || cabinet.notes || '',
      cabinetId
    ]);
    
    // Update project total cost
    await updateProjectTotalCost(projectId);
    
    res.json({ 
      message: 'Cabinet updated successfully',
      cost: costBreakdown.total_cost
    });
  } catch (error) {
    console.error('Error updating cabinet:', error);
    res.status(500).json({ error: error.message || 'Failed to update cabinet' });
  }
});

// Remove a cabinet from a kitchen project
router.delete('/projects/:id/remove-cabinet/:cabinetId', async (req, res) => {
  try {
    const projectId = req.params.id;
    const cabinetId = req.params.cabinetId;
    
    // Check if project exists and belongs to the current user
    const projects = await runQuery(
      'SELECT * FROM kitchen_projects WHERE id = ? AND client_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    // Check if cabinet exists and belongs to the project
    const cabinets = await runQuery(
      'SELECT * FROM kitchen_project_cabinets WHERE id = ? AND kitchen_project_id = ?',
      [cabinetId, projectId]
    );
    
    if (cabinets.length === 0) {
      return res.status(404).json({ error: 'Cabinet not found in this project' });
    }
    
    // Delete cabinet
    await runStatement(
      'DELETE FROM kitchen_project_cabinets WHERE id = ?',
      [cabinetId]
    );
    
    // Update project total cost
    await updateProjectTotalCost(projectId);
    
    res.json({ message: 'Cabinet removed successfully' });
  } catch (error) {
    console.error('Error removing cabinet:', error);
    res.status(500).json({ error: 'Failed to remove cabinet' });
  }
});

// Update kitchen project status
router.put('/projects/:id/status', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status, notes } = req.body;
    
    if (!status || !['draft', 'quoted', 'ordered', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    // Check if project exists and belongs to the current user
    const projects = await runQuery(
      'SELECT * FROM kitchen_projects WHERE id = ? AND client_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    // Update project status
    await runStatement(`
      UPDATE kitchen_projects SET
        status = ?,
        notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, notes, notes, projectId]);
    
    await logAuditTrail('kitchen_projects', projectId, 'UPDATE', 
      { status: projects[0].status }, 
      { status, notes }, 
      req.user.id
    );
    
    res.json({ message: 'Project status updated successfully' });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// Generate invoice for a kitchen project
router.get('/projects/:id/generate-invoice', async (req, res) => {
  try {
    const projectId = req.params.id;
    const format = req.query.format || 'pdf'; // 'pdf' or 'excel'
    
    // Check if project exists and belongs to the current user
    const projects = await runQuery(`
      SELECT kp.*, u.username as client_name, u.email as client_email
      FROM kitchen_projects kp
      LEFT JOIN users u ON kp.client_id = u.id
      WHERE kp.id = ? AND kp.client_id = ?
    `, [projectId, req.user.id]);
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    const project = projects[0];
    
    // Get cabinets for this project with details
    const cabinets = await runQuery(`
      SELECT 
        kpc.*,
        cm.name as model_name,
        cm.description as model_description,
        i.name as material_name,
        i.sku as material_sku
      FROM kitchen_project_cabinets kpc
      JOIN cabinet_models cm ON kpc.cabinet_model_id = cm.id
      JOIN inventory_items i ON kpc.selected_material_id = i.id
      WHERE kpc.kitchen_project_id = ?
      ORDER BY kpc.created_at
    `, [projectId]);
    
    if (cabinets.length === 0) {
      return res.status(400).json({ error: 'Project has no cabinets to generate invoice for' });
    }
    
    // Parse selected_accessories JSON for each cabinet and get accessory details
    const cabinetsWithDetails = await Promise.all(cabinets.map(async (cabinet) => {
      const selectedAccessories = JSON.parse(cabinet.selected_accessories || '[]');
      
      if (selectedAccessories.length > 0) {
        // Get accessory details
        const accessoryIds = selectedAccessories.map(acc => acc.accessory_item_id);
        const accessoryDetails = await runQuery(`
          SELECT id, name, sku, unit_price
          FROM inventory_items
          WHERE id IN (${accessoryIds.join(',')})
        `);
        
        // Create a map for quick lookup
        const accessoryMap = new Map();
        accessoryDetails.forEach(acc => {
          accessoryMap.set(acc.id, acc);
        });
        
        // Enhance selected accessories with details
        const enhancedAccessories = selectedAccessories.map(acc => {
          const details = accessoryMap.get(acc.accessory_item_id);
          return {
            ...acc,
            name: details?.name || 'Unknown Accessory',
            sku: details?.sku || 'N/A',
            unit_price: details?.unit_price || 0,
            total_price: (details?.unit_price || 0) * (acc.quantity || 1)
          };
        });
        
        return {
          ...cabinet,
          accessories: enhancedAccessories
        };
      }
      
      return {
        ...cabinet,
        accessories: []
      };
    }));
    
    if (format === 'pdf') {
      // Generate PDF invoice
      const invoiceData = {
        title: `Kitchen Project Invoice: ${project.name}`,
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          client: project.client_name,
          email: project.client_email,
          date: new Date().toLocaleDateString(),
          notes: project.notes
        },
        cabinets: cabinetsWithDetails.map(cabinet => ({
          model: cabinet.model_name,
          dimensions: `${cabinet.custom_width}"W x ${cabinet.custom_height}"H x ${cabinet.custom_depth}"D`,
          material: cabinet.material_name,
          accessories: cabinet.accessories.map(acc => `${acc.name} (${acc.quantity})`).join(', '),
          cost: cabinet.calculated_cost
        })),
        totalCost: project.total_estimated_cost
      };
      
      // Generate PDF
      const pdfBuffer = await generateCabinetInvoicePDF(invoiceData);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="kitchen_invoice_${projectId}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      // For Excel format, we would use a library like exceljs
      // This is a placeholder for future implementation
      res.status(501).json({ error: 'Excel format not yet implemented' });
    } else {
      res.status(400).json({ error: 'Invalid format. Use "pdf" or "excel"' });
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Convert kitchen project to BOMs
router.post('/projects/:id/convert-to-boms', checkPermission('bom.create'), async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Check if project exists and belongs to the current user
    const projects = await runQuery(
      'SELECT * FROM kitchen_projects WHERE id = ? AND client_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Kitchen project not found' });
    }
    
    const project = projects[0];
    
    // Get cabinets for this project
    const cabinets = await runQuery(
      'SELECT * FROM kitchen_project_cabinets WHERE kitchen_project_id = ?',
      [projectId]
    );
    
    if (cabinets.length === 0) {
      return res.status(400).json({ error: 'Project has no cabinets to convert to BOMs' });
    }
    
    // Create BOMs for each cabinet
    const createdBOMs = [];
    
    for (const cabinet of cabinets) {
      // Generate virtual BOM
      const virtualBOM = await generateCabinetBOM(
        cabinet.cabinet_model_id,
        {
          width: cabinet.custom_width,
          height: cabinet.custom_height,
          depth: cabinet.custom_depth
        },
        cabinet.selected_material_id,
        JSON.parse(cabinet.selected_accessories || '[]')
      );
      
      // Create BOM in the database
      const bomResult = await runStatement(`
        INSERT INTO bill_of_materials (
          name,
          description,
          finished_product_id,
          version,
          status,
          unit_cost,
          labor_cost,
          overhead_cost,
          total_cost,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        virtualBOM.name,
        virtualBOM.description,
        null, // No finished product ID
        '1.0',
        'active',
        0, // These will be calculated later
        0,
        0,
        0,
        req.user.id
      ]);
      
      const bomId = bomResult.id;
      
      // Add components to BOM
      for (const component of virtualBOM.components) {
        await runStatement(`
          INSERT INTO bom_components (
            bom_id,
            item_id,
            component_bom_id,
            quantity,
            unit_id,
            waste_factor,
            notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          bomId,
          component.item_id,
          null, // No component BOM ID
          component.quantity,
          component.unit_id,
          0.05, // Default waste factor
          `From kitchen project ${project.name}`
        ]);
      }
      
      // Add operations to BOM
      for (let i = 0; i < virtualBOM.operations.length; i++) {
        const operation = virtualBOM.operations[i];
        await runStatement(`
          INSERT INTO bom_operations (
            bom_id,
            operation_name,
            description,
            sequence_number,
            estimated_time_minutes,
            labor_rate
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          bomId,
          operation.operation_name,
          operation.description,
          i + 1, // Sequence number
          operation.estimated_time_minutes,
          operation.labor_rate
        ]);
      }
      
      createdBOMs.push({
        id: bomId,
        name: virtualBOM.name
      });
    }
    
    res.json({
      message: `Successfully created ${createdBOMs.length} BOMs from kitchen project`,
      boms: createdBOMs
    });
  } catch (error) {
    console.error('Error converting project to BOMs:', error);
    res.status(500).json({ error: 'Failed to convert project to BOMs' });
  }
});

// ===== HELPER FUNCTIONS =====

// Update the total cost of a kitchen project
async function updateProjectTotalCost(projectId) {
  try {
    // Calculate total cost from all cabinets
    const result = await runQuery(`
      SELECT SUM(calculated_cost) as total_cost
      FROM kitchen_project_cabinets
      WHERE kitchen_project_id = ?
    `, [projectId]);
    
    const totalCost = result[0]?.total_cost || 0;
    
    // Update project
    await runStatement(`
      UPDATE kitchen_projects SET
        total_estimated_cost = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [totalCost, projectId]);
    
    return totalCost;
  } catch (error) {
    console.error('Error updating project total cost:', error);
    throw error;
  }
}

// Generate PDF invoice for a kitchen project
async function generateCabinetInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Add header
      doc.fontSize(20).text(invoiceData.title, { align: 'center' });
      doc.moveDown();
      
      // Add project info
      doc.fontSize(12).text(`Project: ${invoiceData.project.name}`);
      doc.fontSize(12).text(`Client: ${invoiceData.project.client}`);
      doc.fontSize(12).text(`Date: ${invoiceData.project.date}`);
      doc.fontSize(12).text(`Status: ${invoiceData.project.status}`);
      doc.moveDown();
      
      // Add cabinets table
      doc.fontSize(14).text('Cabinet Details', { underline: true });
      doc.moveDown();
      
      // Table headers
      const tableTop = doc.y;
      const tableHeaders = ['Cabinet Model', 'Dimensions', 'Material', 'Accessories', 'Cost'];
      const columnWidths = [120, 100, 100, 150, 80];
      
      let currentY = tableTop;
      
      // Draw headers
      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        let x = 50;
        for (let j = 0; j < i; j++) {
          x += columnWidths[j];
        }
        doc.text(header, x, currentY);
      });
      
      currentY += 20;
      doc.font('Helvetica');
      
      // Draw rows
      invoiceData.cabinets.forEach((cabinet, index) => {
        // Check if we need a new page
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        let x = 50;
        doc.text(cabinet.model, x, currentY);
        
        x += columnWidths[0];
        doc.text(cabinet.dimensions, x, currentY);
        
        x += columnWidths[1];
        doc.text(cabinet.material, x, currentY);
        
        x += columnWidths[2];
        doc.text(cabinet.accessories, x, currentY, { width: columnWidths[3] });
        
        // Adjust currentY based on the height of the accessories text
        const textHeight = doc.heightOfString(cabinet.accessories, { width: columnWidths[3] });
        const rowHeight = Math.max(20, textHeight);
        
        x += columnWidths[3];
        doc.text(`$${cabinet.cost.toFixed(2)}`, x, currentY);
        
        currentY += rowHeight + 5;
        
        // Draw line between rows
        if (index < invoiceData.cabinets.length - 1) {
          doc.moveTo(50, currentY - 2)
             .lineTo(50 + columnWidths.reduce((a, b) => a + b, 0), currentY - 2)
             .stroke();
        }
      });
      
      // Add total
      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica-Bold').text(`Total Estimated Cost: $${invoiceData.totalCost.toFixed(2)}`, { align: 'right' });
      
      // Add notes if any
      if (invoiceData.project.notes) {
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text('Notes:');
        doc.font('Helvetica').text(invoiceData.project.notes);
      }
      
      // Add footer
      doc.fontSize(10).text(
        'This is a proforma invoice for estimation purposes only. Actual costs may vary.',
        50, 
        doc.page.height - 50,
        { align: 'center' }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default router;