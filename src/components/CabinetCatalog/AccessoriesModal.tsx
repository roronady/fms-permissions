import React, { useState, useEffect } from 'react';
import { X, Package, Save, Plus, Trash2, DollarSign } from 'lucide-react';
import { cabinetCatalogService } from '../../services/cabinetCatalogService';

interface AccessoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  modelId: number | null;
}

interface Accessory {
  id: number;
  accessory_item_id: number;
  accessory_name: string;
  accessory_sku: string;
  accessory_base_price: number;
  quantity_per_cabinet: number;
  cost_factor_per_unit: number;
}

interface InventoryAccessory {
  id: number;
  name: string;
  sku: string;
  unit_price: number;
  category_name?: string;
  image_url?: string;
}

const AccessoriesModal: React.FC<AccessoriesModalProps> = ({ isOpen, onClose, onSuccess, modelId }) => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [availableAccessories, setAvailableAccessories] = useState<InventoryAccessory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cabinetModelName, setCabinetModelName] = useState('');
  const [newAccessory, setNewAccessory] = useState({
    accessory_item_id: 0,
    quantity_per_cabinet: 1,
    cost_factor_per_unit: 0
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
      
      // Load accessories for this model
      const modelAccessories = modelDetails.accessories || [];
      setAccessories(modelAccessories);
      
      // Load available accessories from inventory
      const availableAccs = await cabinetCatalogService.getAvailableAccessories();
      setAvailableAccessories(availableAccs);
      
      // Reset new accessory form
      setNewAccessory({
        accessory_item_id: 0,
        quantity_per_cabinet: 1,
        cost_factor_per_unit: 0
      });
      
      setError('');
    } catch (error) {
      console.error('Error loading accessories data:', error);
      setError('Failed to load accessories data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccessory = async () => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      if (!newAccessory.accessory_item_id) {
        setError('Please select an accessory');
        setLoading(false);
        return;
      }
      
      await cabinetCatalogService.addAccessoryToCabinetModel(
        modelId,
        newAccessory.accessory_item_id,
        newAccessory.quantity_per_cabinet,
        newAccessory.cost_factor_per_unit
      );
      
      // Reload data
      await loadData();
      
      // Reset form
      setNewAccessory({
        accessory_item_id: 0,
        quantity_per_cabinet: 1,
        cost_factor_per_unit: 0
      });
      
      setError('');
    } catch (error) {
      console.error('Error adding accessory:', error);
      setError(error instanceof Error ? error.message : 'Failed to add accessory');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccessory = async (accessoryId: number) => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      await cabinetCatalogService.removeAccessoryFromCabinetModel(modelId, accessoryId);
      
      // Reload data
      await loadData();
      
      setError('');
    } catch (error) {
      console.error('Error removing accessory:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove accessory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccessory = async (accessoryId: number, quantity: number, costFactor: number) => {
    if (!modelId) return;
    
    try {
      setLoading(true);
      
      await cabinetCatalogService.addAccessoryToCabinetModel(
        modelId,
        accessoryId,
        quantity,
        costFactor
      );
      
      // Reload data
      await loadData();
      
      setError('');
    } catch (error) {
      console.error('Error updating accessory:', error);
      setError(error instanceof Error ? error.message : 'Failed to update accessory');
    } finally {
      setLoading(false);
    }
  };

  // Filter out accessories that are already added
  const filteredAvailableAccessories = availableAccessories.filter(
    acc => !accessories.some(a => a.accessory_item_id === acc.id)
  );

  if (!isOpen || !modelId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Accessories</h2>
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

          {/* Add New Accessory */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-3">Add Accessory</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accessory *
                </label>
                <select
                  value={newAccessory.accessory_item_id}
                  onChange={(e) => setNewAccessory({...newAccessory, accessory_item_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Select Accessory</option>
                  {filteredAvailableAccessories.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.sku}) - ${acc.unit_price.toFixed(2)}
                    </option>
                  ))}
                </select>
                {filteredAvailableAccessories.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No available accessories. Add hardware accessories in Inventory first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Per Cabinet *
                </label>
                <input
                  type="number"
                  value={newAccessory.quantity_per_cabinet}
                  onChange={(e) => setNewAccessory({...newAccessory, quantity_per_cabinet: parseInt(e.target.value) || 1})}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Cost Per Unit
                </label>
                <input
                  type="number"
                  value={newAccessory.cost_factor_per_unit}
                  onChange={(e) => setNewAccessory({...newAccessory, cost_factor_per_unit: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddAccessory}
                disabled={loading || newAccessory.accessory_item_id === 0}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Accessory
              </button>
            </div>
          </div>

          {/* Current Accessories */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Current Accessories</h3>
            {accessories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Package className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No accessories added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accessories.map((accessory) => (
                  <div key={accessory.accessory_item_id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{accessory.accessory_name}</h4>
                        <p className="text-sm text-gray-500">SKU: {accessory.accessory_sku}</p>
                        <p className="text-sm text-gray-500">Base Price: ${accessory.accessory_base_price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAccessory(accessory.accessory_item_id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Per Cabinet
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={accessory.quantity_per_cabinet}
                            onChange={(e) => {
                              const newAccessories = accessories.map(a => 
                                a.accessory_item_id === accessory.accessory_item_id 
                                  ? {...a, quantity_per_cabinet: parseInt(e.target.value) || 1} 
                                  : a
                              );
                              setAccessories(newAccessories);
                            }}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Cost Per Unit
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={accessory.cost_factor_per_unit}
                            onChange={(e) => {
                              const newAccessories = accessories.map(a => 
                                a.accessory_item_id === accessory.accessory_item_id 
                                  ? {...a, cost_factor_per_unit: parseFloat(e.target.value) || 0} 
                                  : a
                              );
                              setAccessories(newAccessories);
                            }}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleUpdateAccessory(
                          accessory.accessory_item_id, 
                          accessory.quantity_per_cabinet,
                          accessory.cost_factor_per_unit
                        )}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Update
                      </button>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessoriesModal;