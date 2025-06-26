import React, { useState, useEffect } from 'react';
import { X, Package, Save, Plus, Trash2, DollarSign } from 'lucide-react';
import { cabinetCatalogService } from '../../services/cabinetCatalogService';

interface MaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  modelId: number | null;
}

interface Material {
  id: number;
  material_item_id: number;
  material_name: string;
  material_sku: string;
  material_base_price: number;
  cost_factor_per_sqft: number;
}

interface InventoryMaterial {
  id: number;
  name: string;
  sku: string;
  unit_price: number;
  category_name?: string;
  image_url?: string;
}

const MaterialsModal: React.FC<MaterialsModalProps> = ({ isOpen, onClose, onSuccess, modelId }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<InventoryMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cabinetModelName, setCabinetModelName] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    material_item_id: 0,
    cost_factor_per_sqft: 1.0
  });

  useEffect(() => {
    if (isOpen && modelId) {
      loadData();
    }
  }, [isOpen, modelId]);

  const loadData = async () => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      // Load cabinet model details
      const modelDetails = await cabinetCatalogService.getCabinetModel(modelId);
      setCabinetModelName(modelDetails.name);
      
      // Load materials for this model
      const modelMaterials = modelDetails.materials || [];
      setMaterials(modelMaterials);
      
      // Load available materials from inventory
      const availableMats = await cabinetCatalogService.getAvailableMaterials();
      setAvailableMaterials(availableMats);
      
      // Reset new material form
      setNewMaterial({
        material_item_id: 0,
        cost_factor_per_sqft: 1.0
      });
      
      setError('');
    } catch (error) {
      console.error('Error loading materials data:', error);
      setError('Failed to load materials data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      if (!newMaterial.material_item_id) {
        setError('Please select a material');
        setLoading(false);
        return;
      }
      
      await cabinetCatalogService.addMaterialToCabinetModel(
        modelId,
        newMaterial.material_item_id,
        newMaterial.cost_factor_per_sqft
      );
      
      // Reload data
      await loadData();
      
      // Reset form
      setNewMaterial({
        material_item_id: 0,
        cost_factor_per_sqft: 1.0
      });
      
      setError('');
    } catch (error) {
      console.error('Error adding material:', error);
      setError(error instanceof Error ? error.message : 'Failed to add material');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMaterial = async (materialId: number) => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      await cabinetCatalogService.removeMaterialFromCabinetModel(modelId, materialId);
      
      // Reload data
      await loadData();
      
      setError('');
    } catch (error) {
      console.error('Error removing material:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove material');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaterial = async (materialId: number, costFactor: number) => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      await cabinetCatalogService.addMaterialToCabinetModel(
        modelId,
        materialId,
        costFactor
      );
      
      // Reload data
      await loadData();
      
      setError('');
    } catch (error) {
      console.error('Error updating material:', error);
      setError(error instanceof Error ? error.message : 'Failed to update material');
    } finally {
      setLoading(false);
    }
  };

  // Filter out materials that are already added
  const filteredAvailableMaterials = availableMaterials.filter(
    mat => !materials.some(m => m.material_item_id === mat.id)
  );

  if (!isOpen || !modelId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Materials</h2>
              <p className="text-sm text-gray-600">{cabinetModelName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Add New Material */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-3">Add Material</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material *
                </label>
                <select
                  value={newMaterial.material_item_id}
                  onChange={(e) => setNewMaterial({...newMaterial, material_item_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Select Material</option>
                  {filteredAvailableMaterials.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.sku}) - ${mat.unit_price.toFixed(2)}
                    </option>
                  ))}
                </select>
                {filteredAvailableMaterials.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No available materials. Add sheet materials in Inventory first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Factor (per sq ft) *
                </label>
                <input
                  type="number"
                  value={newMaterial.cost_factor_per_sqft}
                  onChange={(e) => setNewMaterial({...newMaterial, cost_factor_per_sqft: parseFloat(e.target.value) || 0})}
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddMaterial}
                disabled={loading || newMaterial.material_item_id === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Material
              </button>
            </div>
          </div>

          {/* Current Materials */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Current Materials</h3>
            {materials.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Package className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No materials added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div key={material.material_item_id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{material.material_name}</h4>
                        <p className="text-sm text-gray-500">SKU: {material.material_sku}</p>
                        <p className="text-sm text-gray-500">Base Price: ${material.material_base_price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMaterial(material.material_item_id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Factor (per sq ft)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={material.cost_factor_per_sqft}
                          onChange={(e) => {
                            const newMaterials = materials.map(m => 
                              m.material_item_id === material.material_item_id 
                                ? {...m, cost_factor_per_sqft: parseFloat(e.target.value) || 0} 
                                : m
                            );
                            setMaterials(newMaterials);
                          }}
                          min="0.01"
                          step="0.01"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleUpdateMaterial(material.material_item_id, material.cost_factor_per_sqft)}
                          className="ml-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialsModal;