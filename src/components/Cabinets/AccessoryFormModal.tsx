import React, { useState } from 'react';
import { X, Package, Save, Upload } from 'lucide-react';

interface AccessoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessory?: any;
}

const AccessoryFormModal: React.FC<AccessoryFormModalProps> = ({ isOpen, onClose, onSuccess, accessory }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    compatible_categories: [] as string[],
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Categories that accessories can be compatible with
  const cabinetCategories = [
    'Base Cabinet',
    'Wall Cabinet',
    'Pantry Cabinet',
    'Corner Cabinet',
    'Island Cabinet'
  ];

  React.useEffect(() => {
    if (isOpen) {
      if (accessory) {
        // Edit mode
        setFormData({
          name: accessory.name || '',
          description: accessory.description || '',
          price: accessory.price || 0,
          compatible_categories: accessory.compatible_categories || [],
          image_url: accessory.image_url || ''
        });
        setImagePreview(accessory.image_url || null);
      } else {
        // Create mode
        resetForm();
      }
    }
  }, [isOpen, accessory]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      compatible_categories: [],
      image_url: ''
    });
    setError('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
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

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const categories = [...prev.compatible_categories];
      if (categories.includes(category)) {
        return {
          ...prev,
          compatible_categories: categories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          compatible_categories: [...categories, category]
        };
      }
    });
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
        throw new Error('Accessory name is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than zero');
      }
      if (formData.compatible_categories.length === 0) {
        throw new Error('Select at least one compatible cabinet category');
      }

      // In a real implementation, you would upload the image first
      // and get back a URL to include in the accessory data
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        // This would be an actual image upload in a real implementation
        // const uploadResult = await accessoryService.uploadImage(imageFile);
        // finalImageUrl = uploadResult.imageUrl;
        
        // For now, just use the preview URL
        finalImageUrl = imagePreview || '';
      }

      const accessoryData = {
        ...formData,
        image_url: finalImageUrl
      };

      // In a real implementation, this would call the backend API
      // if (accessory) {
      //   await accessoryService.updateAccessory(accessory.id, accessoryData);
      // } else {
      //   await accessoryService.createAccessory(accessoryData);
      // }

      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save accessory');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-2xl flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {accessory ? 'Edit Accessory' : 'Add New Accessory'}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accessory Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Soft-Close Hinges"
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
                placeholder="Enter accessory description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compatible Cabinet Types *
              </label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                {cabinetCategories.map((category, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${index}`}
                      checked={formData.compatible_categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`category-${index}`} className="ml-2 text-sm text-gray-700">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accessory Image
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
                    Recommended size: 300x300px
                  </p>
                </div>
                
                <div>
                  {(imagePreview || formData.image_url) && (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <div className="relative h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src={imagePreview || formData.image_url} 
                          alt="Accessory preview" 
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Accessory';
                          }}
                        />
                      </div>
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
              {loading ? 'Saving...' : (accessory ? 'Update Accessory' : 'Create Accessory')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessoryFormModal;