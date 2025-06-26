import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save, Plus, Trash2 } from 'lucide-react';

interface PricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'dimension' | 'material' | 'accessory';
  factor: number;
  description: string;
}

const PricingRulesModal: React.FC<PricingRulesModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [newRule, setNewRule] = useState<PricingRule>({
    id: '',
    name: '',
    type: 'dimension',
    factor: 1,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPricingRules();
    }
  }, [isOpen]);

  const loadPricingRules = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/pricing-rules`, {
      //   headers: getAuthHeaders(),
      // });
      // const data = await handleResponse(response);
      // setRules(data);
      
      // For now, use mock data
      setRules([
        {
          id: '1',
          name: 'Width Adjustment',
          type: 'dimension',
          factor: 0.05,
          description: 'Price increases by 5% per inch over default width'
        },
        {
          id: '2',
          name: 'Height Adjustment',
          type: 'dimension',
          factor: 0.03,
          description: 'Price increases by 3% per inch over default height'
        },
        {
          id: '3',
          name: 'Depth Adjustment',
          type: 'dimension',
          factor: 0.04,
          description: 'Price increases by 4% per inch over default depth'
        },
        {
          id: '4',
          name: 'Cherry Premium',
          type: 'material',
          factor: 1.3,
          description: 'Cherry wood costs 30% more than base material'
        },
        {
          id: '5',
          name: 'MDF Discount',
          type: 'material',
          factor: 0.7,
          description: 'MDF costs 30% less than base material'
        }
      ]);
    } catch (error) {
      console.error('Error loading pricing rules:', error);
      setError('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setNewRule(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleAddRule = async () => {
    try {
      if (!newRule.name) {
        setError('Rule name is required');
        return;
      }
      
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/pricing-rules`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify(newRule),
      // });
      // const data = await handleResponse(response);
      
      // For now, just add to local state
      const ruleWithId = {
        ...newRule,
        id: Date.now().toString()
      };
      
      setRules(prev => [...prev, ruleWithId]);
      
      // Reset form
      setNewRule({
        id: '',
        name: '',
        type: 'dimension',
        factor: 1,
        description: ''
      });
    } catch (error) {
      console.error('Error adding pricing rule:', error);
      setError(error instanceof Error ? error.message : 'Failed to add pricing rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      // In a real implementation, this would call the backend API
      // await fetch(`${API_BASE}/cabinets/pricing-rules/${id}`, {
      //   method: 'DELETE',
      //   headers: getAuthHeaders(),
      // });
      
      // For now, just remove from local state
      setRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete pricing rule');
    }
  };

  const handleSaveRules = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In a real implementation, this would call the backend API
      // await fetch(`${API_BASE}/cabinets/pricing-rules/batch`, {
      //   method: 'PUT',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify({ rules }),
      // });
      
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
    } catch (error) {
      console.error('Error saving pricing rules:', error);
      setError(error instanceof Error ? error.message : 'Failed to save pricing rules');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Pricing Rules</h2>
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
          <div className="p-4 sm:p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Pricing Rules Explanation */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">About Pricing Rules</h3>
              <p className="text-sm text-blue-700">
                Pricing rules determine how cabinet prices are calculated based on dimensions, materials, and accessories.
                Dimension rules apply a factor per unit change, material rules apply a multiplier to the base price,
                and accessory rules are fixed add-ons.
              </p>
            </div>

            {/* Add New Rule */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Pricing Rule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newRule.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Width Adjustment"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type *
                  </label>
                  <select
                    name="type"
                    value={newRule.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="dimension">Dimension</option>
                    <option value="material">Material</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Factor/Multiplier *
                  </label>
                  <input
                    type="number"
                    name="factor"
                    value={newRule.factor}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1.1 for 10% increase"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={newRule.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Explain how this rule affects pricing"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </button>
              </div>
            </div>

            {/* Existing Rules */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Pricing Rules</h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No pricing rules defined yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rule Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Factor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rule.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rule.type === 'dimension' ? 'bg-blue-100 text-blue-800' :
                              rule.type === 'material' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rule.factor.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {rule.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete Rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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
              onClick={handleSaveRules}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingRulesModal;