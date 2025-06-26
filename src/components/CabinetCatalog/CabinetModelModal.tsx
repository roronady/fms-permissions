import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';
import { cabinetCatalogService } from '../../services/cabinetCatalogService';

interface CabinetModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cabinetModel?: any;
}

const CabinetModelModal: React.FC<CabinetModelModalProps> = ({ isOpen, onClose, onSuccess, cabinetModel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_width: 24,
    default_height: 30,
    default_depth: 24,
    min_width: 12,
    max_width: 48,
    min_height: 15,
    max_height: 42,
    min_depth: 12,
    max_depth: 36,
    base_cost: 50
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cabinetModel) {
      setFormData({
        name: cabinetModel.name || '',
        description: cabinetModel.description || '',
        default_width: cabinetModel.default_width || 24,
        default_height: cabinetModel.default_height || 30,
        default_depth: cabinetModel.default_depth || 24,
        min_width: cabinetModel.min_width || 12,
        max_width: cabinetModel.max_width || 48,
        min_height: cabinetModel.min_height || 15,
        max_height: cabinetModel.max_height || 42,
        min_depth: cabinetModel.min_depth || 12,
        max_depth: cabinetModel.max_depth || 36,
        base_cost: cabinetModel.base_cost || 50
      });
    } else {
      setFormData({
        name: '',
        description: '',
        default_width: 24,
        default_height: 30,
        default_depth: 24,
        min_width: 12,
        max_width: 48,
        min_height: 15,
        max_height: 42,
        min_depth: 12,
        max_depth: 36,
        base_cost: 50
      });
    }
    setError('');
  }, [cabinetModel, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate dimensions
      if (formData.min_width > formData.default_width || formData.default_width > formData.max_width) {
        throw new Error('Width values must satisfy: min ≤ default ≤ max');
      }
      
      if (formData.min_height > formData.default_height || formData.default_height > formData.max_height) {
        throw new Error('Height values must satisfy: min ≤ default ≤ max');
      }
      
      if (formData.min_depth > formData.default_depth || formData.default_depth > formData.max_depth) {
        throw new Error('Depth values must satisfy: min ≤ default ≤ max');
      }

      if (cabinetModel) {
        await cabinetCatalogService.updateCabinetModel(cabinetModel.id, formData);
      } else {
        await cabinetCatalogService.createCabinetModel(formData);
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save cabinet model');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_') && !name.includes('description') ? parseFloat(value) || 0 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {cabinetModel ? 'Edit Cabinet Model' : 'Add Cabinet Model'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cabinet Model Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Base Cabinet, Wall Cabinet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Cost ($)
              </label>
              <input
                type="number"
                name="base_cost"
                value={formData.base_cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Base cost for this cabinet model"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the fixed cost component, regardless of dimensions or materials
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Default Dimensions (inches)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Width *
                  </label>
                  <input
                    type="number"
                    name="default_width"
                    value={formData.default_width}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Height *
                  </label>
                  <input
                    type="number"
                    name="default_height"
                    value={formData.default_height}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Depth *
                  </label>
                  <input
                    type="number"
                    name="default_depth"
                    value={formData.default_depth}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Dimension Constraints (inches)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Width *
                  </label>
                  <input
                    type="number"
                    name="min_width"
                    value={formData.min_width}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Height *
                  </label>
                  <input
                    type="number"
                    name="min_height"
                    value={formData.min_height}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Depth *
                  </label>
                  <input
                    type="number"
                    name="min_depth"
                    value={formData.min_depth}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Width *
                  </label>
                  <input
                    type="number"
                    name="max_width"
                    value={formData.max_width}
                    onChange={handleInputChange}
                    required
                    min={formData.min_width}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Height *
                  </label>
                  <input
                    type="number"
                    name="max_height"
                    value={formData.max_height}
                    onChange={handleInputChange}
                    required
                    min={formData.min_height}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Depth *
                  </label>
                  <input
                    type="number"
                    name="max_depth"
                    value={formData.max_depth}
                    onChange={handleInputChange}
                    required
                    min={formData.min_depth}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : (cabinetModel ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CabinetModelModal;