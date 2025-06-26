import { runQuery } from '../database/connection.js';

/**
 * Calculate the cost of a cabinet based on its model, dimensions, material, and accessories
 * 
 * @param {number} cabinetModelId - ID of the cabinet model
 * @param {Object} dimensions - Object containing width, height, and depth in inches
 * @param {number} materialId - ID of the selected material
 * @param {Array} selectedAccessories - Array of {accessory_item_id, quantity} objects
 * @returns {Object} - Object containing total cost and cost breakdown
 */
export const calculateCabinetCost = async (cabinetModelId, dimensions, materialId, selectedAccessories) => {
  try {
    // Get cabinet model details
    const cabinetModels = await runQuery(
      'SELECT * FROM cabinet_models WHERE id = ?',
      [cabinetModelId]
    );
    
    if (cabinetModels.length === 0) {
      throw new Error('Cabinet model not found');
    }
    
    const cabinetModel = cabinetModels[0];
    
    // Validate dimensions against model constraints
    const { width, height, depth } = dimensions;
    
    if (width < cabinetModel.min_width || width > cabinetModel.max_width) {
      throw new Error(`Width must be between ${cabinetModel.min_width} and ${cabinetModel.max_width} inches`);
    }
    
    if (height < cabinetModel.min_height || height > cabinetModel.max_height) {
      throw new Error(`Height must be between ${cabinetModel.min_height} and ${cabinetModel.max_height} inches`);
    }
    
    if (depth < cabinetModel.min_depth || depth > cabinetModel.max_depth) {
      throw new Error(`Depth must be between ${cabinetModel.min_depth} and ${cabinetModel.max_depth} inches`);
    }
    
    // Get material details and cost factor
    const materialDetails = await runQuery(`
      SELECT 
        m.cost_factor_per_sqft,
        i.name as material_name,
        i.unit_price as material_base_price
      FROM cabinet_model_materials m
      JOIN inventory_items i ON m.material_item_id = i.id
      WHERE m.cabinet_model_id = ? AND m.material_item_id = ?
    `, [cabinetModelId, materialId]);
    
    if (materialDetails.length === 0) {
      throw new Error('Selected material is not available for this cabinet model');
    }
    
    const material = materialDetails[0];
    
    // Calculate surface area in square feet (convert from inches)
    // For a simple cabinet, we'll calculate the 6 sides (top, bottom, left, right, back, front)
    const widthFt = width / 12;
    const heightFt = height / 12;
    const depthFt = depth / 12;
    
    const surfaceArea = (
      (widthFt * depthFt * 2) + // top and bottom
      (heightFt * depthFt * 2) + // left and right sides
      (widthFt * heightFt * 2)   // front and back
    );
    
    // Calculate material cost
    const materialCost = surfaceArea * material.cost_factor_per_sqft;
    
    // Calculate base cost from the cabinet model
    const baseCost = cabinetModel.base_cost;
    
    // Calculate accessories cost
    let accessoriesCost = 0;
    const accessoriesBreakdown = [];
    
    if (selectedAccessories && selectedAccessories.length > 0) {
      // Get all accessory details for this cabinet model
      const accessoryDetails = await runQuery(`
        SELECT 
          a.accessory_item_id,
          a.quantity_per_cabinet,
          a.cost_factor_per_unit,
          i.name as accessory_name,
          i.unit_price as accessory_base_price
        FROM cabinet_model_accessories a
        JOIN inventory_items i ON a.accessory_item_id = i.id
        WHERE a.cabinet_model_id = ?
      `, [cabinetModelId]);
      
      // Create a map for quick lookup
      const accessoryMap = new Map();
      accessoryDetails.forEach(acc => {
        accessoryMap.set(acc.accessory_item_id, acc);
      });
      
      // Calculate cost for each selected accessory
      for (const selected of selectedAccessories) {
        const accessory = accessoryMap.get(selected.accessory_item_id);
        
        if (!accessory) {
          throw new Error(`Accessory ID ${selected.accessory_item_id} is not available for this cabinet model`);
        }
        
        const quantity = selected.quantity || accessory.quantity_per_cabinet;
        const accessoryCost = quantity * (accessory.accessory_base_price + accessory.cost_factor_per_unit);
        
        accessoriesCost += accessoryCost;
        
        accessoriesBreakdown.push({
          id: selected.accessory_item_id,
          name: accessory.accessory_name,
          quantity,
          unit_price: accessory.accessory_base_price,
          cost_factor: accessory.cost_factor_per_unit,
          total_cost: accessoryCost
        });
      }
    }
    
    // Calculate total cost
    const totalCost = baseCost + materialCost + accessoriesCost;
    
    // Return cost breakdown
    return {
      total_cost: totalCost,
      breakdown: {
        base_cost: baseCost,
        material: {
          id: materialId,
          name: material.material_name,
          surface_area_sqft: surfaceArea,
          cost_factor_per_sqft: material.cost_factor_per_sqft,
          total_cost: materialCost
        },
        accessories: accessoriesBreakdown
      },
      dimensions: {
        width,
        height,
        depth
      }
    };
  } catch (error) {
    console.error('Error calculating cabinet cost:', error);
    throw error;
  }
};

/**
 * Generate a virtual BOM for a cabinet
 * This can be used to create actual BOMs for production
 * 
 * @param {number} cabinetModelId - ID of the cabinet model
 * @param {Object} dimensions - Object containing width, height, and depth
 * @param {number} materialId - ID of the selected material
 * @param {Array} selectedAccessories - Array of {accessory_item_id, quantity} objects
 * @returns {Object} - Virtual BOM structure
 */
export const generateCabinetBOM = async (cabinetModelId, dimensions, materialId, selectedAccessories) => {
  try {
    // Get cabinet model details
    const cabinetModels = await runQuery(
      'SELECT * FROM cabinet_models WHERE id = ?',
      [cabinetModelId]
    );
    
    if (cabinetModels.length === 0) {
      throw new Error('Cabinet model not found');
    }
    
    const cabinetModel = cabinetModels[0];
    
    // Get material details
    const materialDetails = await runQuery(`
      SELECT 
        i.id,
        i.name,
        i.sku,
        i.unit_id,
        u.name as unit_name
      FROM inventory_items i
      LEFT JOIN units u ON i.unit_id = u.id
      WHERE i.id = ?
    `, [materialId]);
    
    if (materialDetails.length === 0) {
      throw new Error('Material not found');
    }
    
    const material = materialDetails[0];
    
    // Calculate material quantity based on dimensions
    const { width, height, depth } = dimensions;
    const surfaceAreaSqFt = (
      ((width / 12) * (depth / 12) * 2) + // top and bottom
      ((height / 12) * (depth / 12) * 2) + // left and right sides
      ((width / 12) * (height / 12) * 2)   // front and back
    );
    
    // Get accessory details
    const accessories = [];
    
    if (selectedAccessories && selectedAccessories.length > 0) {
      for (const selected of selectedAccessories) {
        const accessoryDetails = await runQuery(`
          SELECT 
            i.id,
            i.name,
            i.sku,
            i.unit_id,
            u.name as unit_name
          FROM inventory_items i
          LEFT JOIN units u ON i.unit_id = u.id
          WHERE i.id = ?
        `, [selected.accessory_item_id]);
        
        if (accessoryDetails.length > 0) {
          accessories.push({
            ...accessoryDetails[0],
            quantity: selected.quantity
          });
        }
      }
    }
    
    // Create virtual BOM
    return {
      name: `Custom ${cabinetModel.name} (${width}W x ${height}H x ${depth}D)`,
      description: `Custom cabinet based on ${cabinetModel.name} model`,
      components: [
        {
          item_id: material.id,
          item_name: material.name,
          item_sku: material.sku,
          quantity: surfaceAreaSqFt,
          unit_id: material.unit_id,
          unit_name: material.unit_name,
          component_type: 'item'
        },
        ...accessories.map(acc => ({
          item_id: acc.id,
          item_name: acc.name,
          item_sku: acc.sku,
          quantity: acc.quantity,
          unit_id: acc.unit_id,
          unit_name: acc.unit_name,
          component_type: 'item'
        }))
      ],
      operations: [
        {
          operation_name: 'Cut Materials',
          description: 'Cut all cabinet panels to size',
          estimated_time_minutes: 45,
          labor_rate: 25
        },
        {
          operation_name: 'Assemble Cabinet',
          description: 'Assemble cabinet structure',
          estimated_time_minutes: 60,
          labor_rate: 25
        },
        {
          operation_name: 'Install Hardware',
          description: 'Install hinges, handles, and other hardware',
          estimated_time_minutes: 30,
          labor_rate: 25
        },
        {
          operation_name: 'Finishing',
          description: 'Apply edge banding and finishing touches',
          estimated_time_minutes: 45,
          labor_rate: 25
        }
      ]
    };
  } catch (error) {
    console.error('Error generating cabinet BOM:', error);
    throw error;
  }
};