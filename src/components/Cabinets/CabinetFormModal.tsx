import React, { useState, useEffect } from 'react';
import { X, Package, Save, Plus, Trash2, Upload } from 'lucide-react';
import { cabinetService } from '../../services/cabinetService';

interface CabinetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cabinet?: any;
}

const CabinetFormModal: React.FC<CabinetFormModalProps> = ({ isOpen, onClose, onSuccess, cabinet }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    default_width: 24,
    default_height: 34.5,
    default_depth: 24,
    min_width: 12,
    max_width: 36,
    min_height: 30,
    max_height: 42,
    min_depth: 20,
    max_depth: 30,
    base_price: 299.99,
    default_material: '',
    is_popular: false,
    image_url: ''
  });

  const [materials, setMaterials] = useState<string[]>(['Maple', 'Oak', 'Cherry', 'Birch', 'MDF']);
  const [newMaterial, setNewMaterial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (cabinet) {
        // Edit mode - populate form with cabinet data
        setFormData({
          name: cabinet.name || '',
          category: cabinet.category || '',
          description: cabinet.description || '',
          default_width: cabinet.default_width || 24,
          default_height: cabinet.default_height || 34.5,
          default_depth: cabinet.default_depth || 24,
          min_width: cabinet.min_width || 12,
          max_width: cabinet.max_width || 36,
          min_height: cabinet.min_height || 30,
          max_height: cabinet.max_height || 42,
          min_depth: cabinet.min_depth || 20,
          max_depth: cabinet.max_depth || 30,
          base_price: cabinet.base_price || 299.99,
          default_material: cabinet.default_material || '',
          is_popular: cabinet.is_popular || false,
          image_url: cabinet.image_url || ''
        });
        setMaterials(cabinet.materials || ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF']);
        setImagePreview(cabinet.image_url || null);
      } else {
        // Create mode - reset form
        resetForm();
      }
    }
  }, [isOpen, cabinet]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      default_width: 24,
      default_height: 34.5,
      default_depth: 24,
      min_width: 12,
      max_width: 36,
      min_height: 30,
      max_height: 42,
      min_depth: 20,
      max_depth: 30,
      base_price: 299.99,
      default_material: '',
      is_popular: false,
      image_url: ''
    });
    setMaterials(['Maple', 'Oak', 'Cherry', 'Birch', 'MDF']);
    setNewMaterial('');
    setError('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim() && !materials.includes(newMaterial.trim())) {
      setMaterials(prev => [...prev, newMaterial.trim()]);
      setNewMaterial('');
    }
  };

  const handleRemoveMaterial = (material: string) => {
    setMaterials(prev => prev.filter(m => m !== material));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name) {
        throw new Error('Cabinet name is required');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }
      if (materials.length === 0) {
        throw new Error('At least one material is required');
      }
      if (!formData.default_material) {
        throw new Error('Default material is required');
      }
      if (!materials.includes(formData.default_material)) {
        throw new Error('Default material must be in the materials list');
      }

      // In a real implementation, you would upload the image first
      // and get back a URL to include in the cabinet data
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        // This would be an actual image upload in a real implementation
        // const uploadResult = await cabinetService.uploadImage(imageFile);
        // finalImageUrl = uploadResult.imageUrl;
        
        // For now, just use the preview URL
        finalImageUrl = imagePreview || '';
      }

      const cabinetData = {
        ...formData,
        image_url: finalImageUrl,
        materials
      };

      if (cabinet) {
        // Update existing cabinet
        await cabinetService.updateCabinet(cabinet.id, cabinetData);
      } else {
        // Create new cabinet
        await cabinetService.createCabinet(cabinetData);
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save cabinet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-6xl flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {cabinet ? 'Edit Cabinet' : 'Add New Cabinet'}
            </h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cabinet Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Base Cabinet 24\""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
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
                    placeholder="Enter cabinet description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price ($) *
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_popular"
                    name="is_popular"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_popular: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="is_popular" className="ml-2 text-sm text-gray-700">
                    Mark as Popular
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cabinet Image
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center">
                        <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="h-5 w-5 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 600x400px
                      </p>
                    </div>
                    
                    <div>
                      {(imagePreview || formData.image_url) && (
                        <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                          <div className="relative h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            <img 
                              src={imagePreview || formData.image_url} 
                              alt="Cabinet preview" 
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Cabinet+Image';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensions and Materials */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Dimensions and Materials</h3>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Default Dimensions (inches)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <input
                        type="number"
                        name="default_width"
                        value={formData.default_width}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <input
                        type="number"
                        name="default_height"
                        value={formData.default_height}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Depth</label>
                      <input
                        type="number"
                        name="default_depth"
                        value={formData.default_depth}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Dimension Constraints (inches)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Width</label>
                      <input
                        type="number"
                        name="min_width"
                        value={formData.min_width}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Width</label>
                      <input
                        type="number"
                        name="max_width"
                        value={formData.max_width}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Height</label>
                      <input
                        type="number"
                        name="min_height"
                        value={formData.min_height}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Height</label>
                      <input
                        type="number"
                        name="max_height"
                        value={formData.max_height}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Depth</label>
                      <input
                        type="number"
                        name="min_depth"
                        value={formData.min_depth}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Depth</label>
                      <input
                        type="number"
                        name="max_depth"
                        value={formData.max_depth}
                        onChange={handleInputChange}
                        min="1"
                        step="0.1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Materials</h4>
                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">Default Material *</label>
                    <select
                      name="default_material"
                      value={formData.default_material}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Default Material</option>
                      {materials.map((material, index) => (
                        <option key={index} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {materials.map((material, index) => (
                      <div key={index} className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        <span>{material}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(material)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add new material"
                    />
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
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
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : (cabinet ? 'Update Cabinet' : 'Create Cabinet')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetFormModal;