import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  FileText, 
  Package,
  RefreshCw,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { cabinetService } from '../../services/cabinetService';

interface CartItem {
  id: string;
  cabinet_id: number;
  cabinet_name: string;
  width: number;
  height: number;
  depth: number;
  material: string;
  accessories: string[];
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
}

const CabinetCart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cart`, {
      //   headers: getAuthHeaders(),
      // });
      // const data = await handleResponse(response);
      // setCartItems(data.items);
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setCartItems([
        {
          id: '1',
          cabinet_id: 1,
          cabinet_name: 'Base Cabinet 24"',
          width: 24,
          height: 34.5,
          depth: 24,
          material: 'Maple',
          accessories: ['Soft-Close Hinges (Pair)', 'Pull-Out Drawer'],
          quantity: 2,
          unit_price: 349.99,
          total_price: 699.98,
          image_url: 'https://images.pexels.com/photos/5824883/pexels-photo-5824883.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '2',
          cabinet_id: 3,
          cabinet_name: 'Pantry Cabinet 84"',
          width: 24,
          height: 84,
          depth: 24,
          material: 'Cherry',
          accessories: ['Adjustable Shelf', 'Door Handles (Each)'],
          quantity: 1,
          unit_price: 649.99,
          total_price: 649.99,
          image_url: 'https://images.pexels.com/photos/6489107/pexels-photo-6489107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        }
      ]);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, change: number) => {
    try {
      const item = cartItems.find(item => item.id === itemId);
      if (!item) return;
      
      const newQuantity = Math.max(1, item.quantity + change);
      
      // In a real implementation, this would call the backend API
      // await fetch(`${API_BASE}/cart/update-quantity`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify({ itemId, quantity: newQuantity }),
      // });
      
      // For now, just update local state
      setCartItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            total_price: item.unit_price * newQuantity
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      // In a real implementation, this would call the backend API
      // await fetch(`${API_BASE}/cart/remove-item`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify({ itemId }),
      // });
      
      // For now, just update local state
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    }
  };

  const handleGenerateQuote = async () => {
    try {
      setGeneratingQuote(true);
      
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cart/generate-quote`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      // });
      // const result = await handleResponse(response);
      // window.open(result.quote_url, '_blank');
      
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a simple data URL with a text representation of the quote
      const quoteText = `
KITCHEN CABINET QUOTE

Date: ${new Date().toLocaleDateString()}
Quote #: Q-${Date.now().toString().substring(6)}
Valid for: 30 days

ITEMS:
${cartItems.map(item => `
${item.cabinet_name} (${item.width}"W × ${item.height}"H × ${item.depth}"D)
Material: ${item.material}
Accessories: ${item.accessories.join(', ') || 'None'}
Quantity: ${item.quantity}
Unit Price: $${item.unit_price.toFixed(2)}
Item Total: $${item.total_price.toFixed(2)}
`).join('\n')}

SUMMARY:
Subtotal: $${cartItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
Tax (7%): $${(cartItems.reduce((sum, item) => sum + item.total_price, 0) * 0.07).toFixed(2)}
TOTAL: $${(cartItems.reduce((sum, item) => sum + item.total_price, 0) * 1.07).toFixed(2)}

Thank you for your business!
      `;
      
      const blob = new Blob([quoteText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating quote:', error);
      setError('Failed to generate quote');
    } finally {
      setGeneratingQuote(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessingOrder(true);
      
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cart/checkout`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      // });
      // const result = await handleResponse(response);
      // window.location.href = result.checkout_url;
      
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Order processed successfully! In a real application, you would be redirected to a payment page.');
      
      // Clear cart
      setCartItems([]);
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process order');
    } finally {
      setProcessingOrder(false);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600">Review and manage your cabinet selections</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadCart}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Cart Content */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-2 text-gray-500">
              Add some cabinets to your cart to get started.
            </p>
            <button
              onClick={() => window.location.href = '/cabinets'}
              className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="h-4 w-4 mr-2" />
              Browse Cabinets
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Cabinet Image */}
                  <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.cabinet_name} 
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=Cabinet';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Cabinet Details */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{item.cabinet_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.width}"W × {item.height}"H × {item.depth}"D • {item.material}
                        </p>
                        
                        {item.accessories.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Accessories:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.accessories.map((accessory, index) => (
                                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {accessory}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 sm:mt-0 flex flex-col items-end">
                        <div className="text-lg font-medium text-gray-900">${item.unit_price.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">per unit</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-4 border-t border-gray-100">
                      {/* Quantity Controls */}
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 mr-3">Quantity:</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 border border-gray-300 rounded-l-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center py-1 border-t border-b border-gray-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 border border-gray-300 rounded-r-lg text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Price and Remove */}
                      <div className="flex items-center mt-4 sm:mt-0">
                        <div className="text-lg font-bold text-gray-900 mr-4">
                          ${item.total_price.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Order Summary */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (7%)</span>
                  <span className="text-gray-900">${(getTotalPrice() * 0.07).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">${(getTotalPrice() * 1.07).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleGenerateQuote}
                  disabled={generatingQuote}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingQuote ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {generatingQuote ? 'Generating...' : 'Generate Quote'}
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processingOrder}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingOrder ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {processingOrder ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinetCart;