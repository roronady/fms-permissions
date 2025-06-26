import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search,
  DollarSign,
  Ruler,
  Settings
} from 'lucide-react';
import { cabinetService } from '../../services/cabinetService';
import { useAuth } from '../../contexts/AuthContext';
import CabinetFormModal from './CabinetFormModal';
import AccessoryFormModal from './AccessoryFormModal';
import PricingRulesModal from './PricingRulesModal';

const CabinetAdmin: React.FC = () => {
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<any>(null);
  const { hasPermission } = useAuth();

  useEffect(() => {
    loadCabinets();
  }, [searchTerm]);

  const loadCabinets = async () => {
    try {
      setLoading(true);
      const data = await cabinetService.getCabinets({
        search: searchTerm
      });
      setCabinets(data);
    } catch (error) {
      console.error('Error loading cabinets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCabinet = (cabinet: any) => {
    setSelectedCabinet(cabinet);
    setShowCabinetModal(true);
  };

  const handleDeleteCabinet = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete cabinet "${name}"?`)) {
      try {
        await cabinetService.deleteCabinet(id);
        loadCabinets();
      } catch (error) {
        console.error('Error deleting cabinet:', error);
        alert('Failed to delete cabinet');
      }
    }
  };

  const handleModalSuccess = () => {
    loadCabinets();
    setShowCabinetModal(false);
    setShowAccessoryModal(false);
    setShowPricingModal(false);
    setSelectedCabinet(null);
  };

  if (!hasPermission('cabinet.manage')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You don't have permission to access the cabinet administration panel.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabinet Administration</h1>
          <p className="text-gray-600">Manage cabinet models, accessories, and pricing rules</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPricingModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Pricing Rules
          </button>
          <button
            onClick={() => setShowAccessoryModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Accessory
          </button>
          <button
            onClick={() => {
              setSelectedCabinet(null);
              setShowCabinetModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cabinet
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search cabinets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <button
              onClick={loadCabinets}
              className="w-full sm:w-auto flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Cabinets Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cabinet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materials
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : cabinets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No cabinets found
                  </td>
                </tr>
              ) : (
                cabinets.map((cabinet) => (
                  <tr key={cabinet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          {cabinet.image_url ? (
                            <img 
                              src={cabinet.image_url} 
                              alt={cabinet.name} 
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Cabinet';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cabinet.name}</div>
                          <div className="text-sm text-gray-500">{cabinet.is_popular ? 'Popular' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cabinet.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Ruler className="h-4 w-4 text-gray-400 mr-1" />
                        {cabinet.default_width}W × {cabinet.default_height}H × {cabinet.default_depth}D
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                        {cabinet.base_price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {cabinet.materials.slice(0, 3).map((material: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {material}
                          </span>
                        ))}
                        {cabinet.materials.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            +{cabinet.materials.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditCabinet(cabinet)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit Cabinet"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCabinet(cabinet.id, cabinet.name)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Cabinet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CabinetFormModal
        isOpen={showCabinetModal}
        onClose={() => {
          setShowCabinetModal(false);
          setSelectedCabinet(null);
        }}
        onSuccess={handleModalSuccess}
        cabinet={selectedCabinet}
      />

      <AccessoryFormModal
        isOpen={showAccessoryModal}
        onClose={() => setShowAccessoryModal(false)}
        onSuccess={handleModalSuccess}
      />

      <PricingRulesModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default CabinetAdmin;