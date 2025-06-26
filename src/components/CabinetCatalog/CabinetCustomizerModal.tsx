import React, { useState, useEffect } from 'react';
import { X, Package, Save, Ruler, DollarSign } from 'lucide-react';
import { cabinetCatalogService } from '../../services/cabinetCatalogService';

interface CabinetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  cabinetModel: any;
  cabinet?: any;
}

interface Material {
  id: number;
  name: string;
  description: string;
  cost_factor_per_sqft: number;
  base_price: number;
  image_url?: string;
}

interface Accessory {
  id: number;
  name: string;
  description: string;
  quantity_per_cabinet: number;
  cost_factor_per_unit: number;
  base_price: number;
  image_url?: string;
}

interface SelectedAccessory {
  accessory_item_id: number;
  quantity: number;
}

const CabinetCustomizerModal: React.FC<CabinetCustomizerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId, 
  cabinetModel,
  cabinet
}) => {
  const [formData, setFormData] = useState({
    custom_width: 0,
    custom_height: 0,
    custom_depth: 0,
    selected_material_id: 0,
    notes: ''
  });

  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [costBreakdown, setCostBreakdown] = useState<any>(null);

  useEffect(() => {
    if (isOpen && cabinetModel) {
      // Initialize form with default values or existing cabinet values
      if (cabinet) {
        // Editing existing cabinet
        setFormData({
          custom_width: cabinet.custom_width,
          custom_height: cabinet.custom_height,
          custom_depth: cabinet.custom_depth,
          selected_material_id: cabinet.selected_material_id,
          notes: cabinet.notes || ''
        });
        setSelectedAccessories(cabinet.selected_accessories || []);
      } else {
        // New cabinet
        setFormData({
          custom_width: cabinetModel.default_width,
          custom_height: cabinetModel.default_height,
          custom_depth: cabinetModel.default_depth,
          selected_material_id: 0,
          notes: ''
        });
        setSelectedAccessories([]);
      }
      
      // Load available materials and accessories
      loadMaterialsAndAccessories();
    }
  }, [isOpen, cabinetModel, cabinet]);

  // Recalculate cost when dimensions, material, or accessories change
  useEffect(() => {
    if (isOpen && cabinetModel && formData.selected_material_id) {
      calculateCost();
    }
  }, [formData.custom_width, formData.custom_height, formData.custom_depth, formData.selected_material_id, selectedAccessories]);

  const loadMaterialsAndAccessories = async () => {
    if (!cabinetModel) return;
    
    try {
      setLoading(true);
      
      // Load materials
      const materials = await cabinetCatalogService.getMaterialsForCabinetModel(cabinetModel.id);
      setAvailableMaterials(materials);
      
      // Set default material if none selected
      if (!formData.selected_material_id && materials.length > 0) {
        setFormData(prev => ({
          ...prev,
          selected_material_id: materials[0].id
        }));
      }
      
      // Load accessories
      const accessories = await cabinetCatalogService.getAccessoriesForCabinetModel(cabinetModel.id);
      setAvailableAccessories(accessories);
      
      setError('');
    } catch (error) {
      console.error('Error loading materials and accessories:', error);
      setError('Failed to load materials and accessories');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = async () => {
    if (!cabinetModel || !formData.selected_material_id) return;
    
    try {
      setCalculating(true);
      
      const costData = await cabinetCatalogService.calculateCabinetCost(
        cabinetModel.id,
        {
          width: formData.custom_width,
          height: formData.custom_height,
          depth: formData.custom_depth
        },
        formData.selected_material_id,
        selectedAccessories
      );
      
      setCostBreakdown(costData);
    } catch (error) {
      console.error('Error calculating cost:', error);
      // Don't set error state to avoid disrupting the UI
    } finally {
      setCalculating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For dimension inputs, ensure they're within the model's constraints
    if (['custom_width', 'custom_height', 'custom_depth'].includes(name)) {
      const numValue = parseFloat(value);
      const dimension = name.replace('custom_', '');
      const min = cabinetModel[`min_${dimension}`];
      const max = cabinetModel[`max_${dimension}`];
      
      if (numValue < min) {
        setError(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} must be at least ${min} inches`);
        return;
      }
      
      if (numValue > max) {
        setError(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} cannot exceed ${max} inches`);
        return;
      }
      
      setError('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'selected_material_id' ? parseInt(value) : 
              ['custom_width', 'custom_height', 'custom_depth'].includes(name) ? parseFloat(value) : 
              value
    }));
  };

  const handleAccessoryChange = (accessoryId: number, quantity: number) => {
    // If quantity is 0, remove the accessory
    if (quantity === 0) {
      setSelectedAccessories(prev => prev.filter(a => a.accessory_item_id !== accessoryId));
      return;
    }
    
    // Check if accessory is already selected
    const existingIndex = selectedAccessories.findIndex(a => a.accessory_item_id === accessoryId);
    
    if (existingIndex >= 0) {
      // Update existing accessory
      setSelectedAccessories(prev => prev.map((a, i) => 
        i === existingIndex ? { ...a, quantity } : a
      ));
    } else {
      // Add new accessory
      setSelectedAccessories(prev => [...prev, { accessory_item_id: accessoryId, quantity }]);
    }
  };

  const getAccessoryQuantity = (accessoryId: number) => {
    const accessory = selectedAccessories.find(a => a.accessory_item_id === accessoryId);
    return accessory ? accessory.quantity : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId || !cabinetModel) {
      setError('Missing project or cabinet model');
      return;
    }
    
    if (!formData.selected_material_id) {
      setError('Please select a material');
      return;
    }
    
    try {
      setLoading(true);
      
      if (cabinet) {
        // Update existing cabinet
        await cabinetCatalogService.updateCabinetInProject(
          projectId,
          cabinet.id,
          {
            custom_width: formData.custom_width,
            custom_height: formData.custom_height,
            custom_depth: formData.custom_depth,
            selected_material_id: formData.selected_material_id,
            selected_accessories: selectedAccessories,
            notes: formData.notes
          }
        );
      } else {
        // Add new cabinet
        await cabinetCatalogService.addCabinetToProject(
          projectId,
          {
            cabinet_model_id: cabinetModel.id,
            custom_width: formData.custom_width,
            custom_height: formData.custom_height,
            custom_depth: formData.custom_depth,
            selected_material_id: formData.selected_material_id,
            selected_accessories: selectedAccessories,
            notes: formData.notes
          }
        );
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving cabinet:', error);
      setError(error instanceof Error ? error.message : 'Failed to save cabinet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cabinetModel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-5xl flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {cabinet ? 'Edit Cabinet' : 'Add Cabinet to Project'}
              </h2>
              <p className="text-sm text-gray-600">{cabinetModel.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Dimensions and Materials */}
              <div className="space-y-6">
                {/* Dimensions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Ruler className="h-5 w-5 text-gray-500 mr-2" />
                    Dimensions (inches)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width *
                      </label>
                      <input
                        type="number"
                        name="custom_width"
                        value={formData.custom_width}
                        onChange={handleInputChange}
                        min={cabinetModel.min_width}
                        max={cabinetModel.max_width}
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Range: {cabinetModel.min_width}″ - {cabinetModel.max_width}″
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height *
                      </label>
                      <input
                        type="number"
                        name="custom_height"
                        value={formData.custom_height}
                        onChange={handleInputChange}
                        min={cabinetModel.min_height}
                        max={cabinetModel.max_height}
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Range: {cabinetModel.min_height}″ - {cabinetModel.max_height}″
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Depth *
                      </label>
                      <input
                        type="number"
                        name="custom_depth"
                        value={formData.custom_depth}
                        onChange={handleInputChange}
                        min={cabinetModel.min_depth}
                        max={cabinetModel.max_depth}
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Range: {cabinetModel.min_depth}″ - {cabinetModel.max_depth}″
                      </p>
                    </div>
                  </div>
                </div>

                {/* Materials */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Material Selection</h3>
                  {availableMaterials.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No materials available for this cabinet model</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Material *
                        </label>
                        <select
                          name="selected_material_id"
                          value={formData.selected_material_id}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Material</option>
                          {availableMaterials.map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} - ${material.base_price.toFixed(2)}/unit
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.selected_material_id > 0 && (
                        <div className="mt-2">
                          {availableMaterials.find(m => m.id === formData.selected_material_id)?.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {availableMaterials.find(m => m.id === formData.selected_material_id)?.description}
                            </p>
                          )}
                          {availableMaterials.find(m => m.id === formData.selected_material_id)?.image_url && (
                            <div className="mt-2 h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={availableMaterials.find(m => m.id === formData.selected_material_id)?.image_url} 
                                alt="Material preview" 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=No+Image';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any special instructions or notes about this cabinet"
                  />
                </div>
              </div>

              {/* Right Column - Accessories and Cost */}
              <div className="space-y-6">
                {/* Accessories */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Accessories</h3>
                  {availableAccessories.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No accessories available for this cabinet model</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {availableAccessories.map(accessory => (
                        <div key={accessory.id} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{accessory.name}</h4>
                              <p className="text-xs text-gray-500">
                                Base price: ${accessory.base_price.toFixed(2)}/unit
                              </p>
                              {accessory.description && (
                                <p className="text-xs text-gray-600 mt-1">{accessory.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleAccessoryChange(
                                  accessory.id, 
                                  Math.max(0, getAccessoryQuantity(accessory.id) - 1)
                                )}
                                className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="text-sm font-medium w-6 text-center">
                                {getAccessoryQuantity(accessory.id)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAccessoryChange(
                                  accessory.id, 
                                  getAccessoryQuantity(accessory.id) + 1
                                )}
                                className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full text-blue-700 hover:bg-blue-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                    Cost Breakdown
                  </h3>
                  {calculating ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : costBreakdown ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Base Cost:</span>
                        <span className="text-sm font-medium">${costBreakdown.breakdown.base_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Material Cost:</span>
                        <span className="text-sm font-medium">${costBreakdown.breakdown.material.total_cost.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500 pl-4">
                        {costBreakdown.breakdown.material.surface_area_sqft.toFixed(2)} sq ft × 
                        ${costBreakdown.breakdown.material.cost_factor_per_sqft.toFixed(2)}/sq ft
                      </div>
                      {costBreakdown.breakdown.accessories.length > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Accessories Cost:</span>
                            <span className="text-sm font-medium">
                              ${costBreakdown.breakdown.accessories.reduce((sum: number, acc: any) => sum + acc.total_cost, 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 pl-4 space-y-1">
                            {costBreakdown.breakdown.accessories.map((acc: any, index: number) => (
                              <div key={index}>
                                {acc.name}: {acc.quantity} × ${(acc.unit_price + acc.cost_factor).toFixed(2)}/unit = ${acc.total_cost.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-base font-medium text-gray-700">Total Cost:</span>
                        <span className="text-lg font-bold text-green-600">${costBreakdown.total_cost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Select dimensions and material to see cost breakdown</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.selected_material_id}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : (cabinet ? 'Update Cabinet' : 'Add to Project')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetCustomizerModal;