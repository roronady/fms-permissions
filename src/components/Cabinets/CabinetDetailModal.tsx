import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Ruler, 
  DollarSign, 
  Plus, 
  Minus, 
  ShoppingCart,
  Save,
  FileText,
  Check
} from 'lucide-react';
import { cabinetService } from '../../services/cabinetService';

interface CabinetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabinet: any;
}

const CabinetDetailModal: React.FC<CabinetDetailModalProps> = ({ isOpen, onClose, cabinet }) => {
  const [customization, setCustomization] = useState({
    width: 0,
    height: 0,
    depth: 0,
    material: '',
    accessories: [] as string[],
    quantity: 1
  });
  const [availableAccessories, setAvailableAccessories] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (isOpen && cabinet) {
      // Reset state when modal opens with a new cabinet
      setCustomization({
        width: cabinet.default_width || 0,
        height: cabinet.default_height || 0,
        depth: cabinet.default_depth || 0,
        material: cabinet.default_material || '',
        accessories: [],
        quantity: 1
      });
      setTotalPrice(cabinet.base_price || 0);
      setAddedToCart(false);
      
      // Load available accessories
      loadAccessories();
    }
  }, [isOpen, cabinet]);

  useEffect(() => {
    if (cabinet) {
      calculatePrice();
    }
  }, [customization]);

  const loadAccessories = async () => {
    try {
      setLoading(true);
      const accessories = await cabinetService.getCabinetAccessories(cabinet.id);
      setAvailableAccessories(accessories);
    } catch (error) {
      console.error('Error loading accessories:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    try {
      if (!cabinet) return;
      
      const priceData = await cabinetService.calculateCabinetPrice({
        cabinet_id: cabinet.id,
        width: customization.width,
        height: customization.height,
        depth: customization.depth,
        material: customization.material,
        accessories: customization.accessories,
        quantity: customization.quantity
      });
      
      setTotalPrice(priceData.total_price);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    setCustomization(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomization(prev => ({
      ...prev,
      material: e.target.value
    }));
  };

  const handleAccessoryToggle = (accessoryId: string) => {
    setCustomization(prev => {
      const accessories = [...prev.accessories];
      if (accessories.includes(accessoryId)) {
        return {
          ...prev,
          accessories: accessories.filter(id => id !== accessoryId)
        };
      } else {
        return {
          ...prev,
          accessories: [...accessories, accessoryId]
        };
      }
    });
  };

  const handleQuantityChange = (change: number) => {
    setCustomization(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + change)
    }));
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      await cabinetService.addToCart({
        cabinet_id: cabinet.id,
        customization
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuote = async () => {
    try {
      setLoading(true);
      const quoteUrl = await cabinetService.generateQuote({
        cabinet_id: cabinet.id,
        customization
      });
      
      // Open the quote in a new tab
      window.open(quoteUrl, '_blank');
    } catch (error) {
      console.error('Error generating quote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cabinet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-6xl flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">{cabinet.name}</h2>
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
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cabinet Image and Details */}
              <div>
                <div className="bg-gray-100 rounded-lg overflow-hidden h-80 mb-4">
                  {cabinet.image_url ? (
                    <img 
                      src={cabinet.image_url} 
                      alt={cabinet.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Cabinet+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-gray-300" />
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cabinet Details</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Category:</span> {cabinet.category}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Description:</span> {cabinet.description}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Default Dimensions:</span> {cabinet.default_width}W × {cabinet.default_height}H × {cabinet.default_depth}D
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Base Price:</span> ${cabinet.base_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Available Materials:</span> {cabinet.materials.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customization Options */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Customize Your Cabinet</h3>
                
                {/* Dimensions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Dimensions (inches)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <input
                        type="number"
                        min={cabinet.min_width || 10}
                        max={cabinet.max_width || 60}
                        value={customization.width}
                        onChange={(e) => handleDimensionChange('width', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <input
                        type="number"
                        min={cabinet.min_height || 10}
                        max={cabinet.max_height || 96}
                        value={customization.height}
                        onChange={(e) => handleDimensionChange('height', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Depth</label>
                      <input
                        type="number"
                        min={cabinet.min_depth || 10}
                        max={cabinet.max_depth || 30}
                        value={customization.depth}
                        onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Material Selection */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Material</h4>
                  <select
                    value={customization.material}
                    onChange={handleMaterialChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Material</option>
                    {cabinet.materials.map((material: string, index: number) => (
                      <option key={index} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Accessories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Accessories</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : availableAccessories.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No accessories available for this cabinet</p>
                    ) : (
                      availableAccessories.map((accessory) => (
                        <div key={accessory.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`accessory-${accessory.id}`}
                              checked={customization.accessories.includes(accessory.id)}
                              onChange={() => handleAccessoryToggle(accessory.id)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor={`accessory-${accessory.id}`} className="ml-2 text-sm text-gray-700">
                              {accessory.name}
                            </label>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            +${accessory.price.toFixed(2)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Quantity */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quantity</h4>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={customization.quantity <= 1}
                      className="p-2 border border-gray-300 rounded-l-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={customization.quantity}
                      onChange={(e) => setCustomization(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-16 text-center py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 border border-gray-300 rounded-r-lg text-gray-600 hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Price Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Base Price:</span>
                    <span className="text-sm text-gray-900">${cabinet.base_price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Customization:</span>
                    <span className="text-sm text-gray-900">${(totalPrice - cabinet.base_price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <span className="text-sm text-gray-900">× {customization.quantity}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-100 flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total Price:</span>
                    <span className="text-lg font-bold text-blue-700">${(totalPrice * customization.quantity).toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={loading || addedToCart}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : addedToCart ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Adding...' : addedToCart ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleGenerateQuote}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Generating...' : 'Generate Quote'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CabinetDetailModal;