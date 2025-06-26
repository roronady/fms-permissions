import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Package, 
  Layers,
  DollarSign,
  Save,
  X
} from 'lucide-react';
import { cabinetCatalogService } from '../../services/cabinetCatalogService';
import { inventoryService } from '../../services/inventoryService';
import CabinetModelModal from './CabinetModelModal';
import MaterialsModal from './MaterialsModal';
import AccessoriesModal from './AccessoriesModal';

interface CabinetModel {
  id: number;
  name: string;
  description: string;
  default_width: number;
  default_height: number;
  default_depth: number;
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  min_depth: number;
  max_depth: number;
  base_cost: number;
  material_count: number;
  accessory_count: number;
  created_at: string;
  updated_at: string;
}

const CabinetModelsTab: React.FC = () => {
  const [cabinetModels, setCabinetModels] = useState<CabinetModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showAccessoriesModal, setShowAccessoriesModal] = useState(false);
  const [editingModel, setEditingModel] = useState<CabinetModel | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCabinetModels();
  }, []);

  const fetchCabinetModels = async () => {
    try {
      setLoading(true);
      const models = await cabinetCatalogService.getCabinetModels();
      setCabinetModels(models);
    } catch (error) {
      console.error('Error fetching cabinet models:', error);
      alert('Failed to fetch cabinet models');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete cabinet model "${name}"?`)) {
      try {
        await cabinetCatalogService.deleteCabinetModel(id);
        fetchCabinetModels();
      } catch (error) {
        console.error('Error deleting cabinet model:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete cabinet model');
      }
    }
  };

  const handleEdit = (model: CabinetModel) => {
    setEditingModel(model);
    setShowModelModal(true);
  };

  const handleManageMaterials = (modelId: number) => {
    setSelectedModelId(modelId);
    setShowMaterialsModal(true);
  };

  const handleManageAccessories = (modelId: number) => {
    setSelectedModelId(modelId);
    setShowAccessoriesModal(true);
  };

  const handleAdd = () => {
    setEditingModel(null);
    setShowModelModal(true);
  };

  const handleModalClose = () => {
    setShowModelModal(false);
    setEditingModel(null);
  };

  const handleMaterialsModalClose = () => {
    setShowMaterialsModal(false);
    setSelectedModelId(null);
  };

  const handleAccessoriesModalClose = () => {
    setShowAccessoriesModal(false);
    setSelectedModelId(null);
  };

  const handleModalSuccess = () => {
    fetchCabinetModels();
    handleModalClose();
  };

  const handleMaterialsModalSuccess = () => {
    fetchCabinetModels();
    handleMaterialsModalClose();
  };

  const handleAccessoriesModalSuccess = () => {
    fetchCabinetModels();
    handleAccessoriesModalClose();
  };

  const filteredModels = cabinetModels.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cabinet Models</h2>
          <p className="text-sm text-gray-600">Manage parametric cabinet models for the catalog</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchCabinetModels}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cabinet Model
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search cabinet models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cabinet Models Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cabinet Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions (W×H×D)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accessories
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredModels.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{model.name}</div>
                        <div className="text-sm text-gray-500">{model.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Default: {model.default_width}″ × {model.default_height}″ × {model.default_depth}″
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: {model.min_width}″-{model.max_width}″W, {model.min_height}″-{model.max_height}″H, {model.min_depth}″-{model.max_depth}″D
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      {model.base_cost.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {model.material_count} materials
                      </span>
                      <button
                        onClick={() => handleManageMaterials(model.id)}
                        className="ml-2 text-blue-600 hover:text-blue-900 text-xs"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {model.accessory_count} accessories
                      </span>
                      <button
                        onClick={() => handleManageAccessories(model.id)}
                        className="ml-2 text-purple-600 hover:text-purple-900 text-xs"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(model)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit Cabinet Model"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(model.id, model.name)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Cabinet Model"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cabinetModels.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cabinet models found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first cabinet model.
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Cabinet Model
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CabinetModelModal
        isOpen={showModelModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        cabinetModel={editingModel}
      />

      <MaterialsModal
        isOpen={showMaterialsModal}
        onClose={handleMaterialsModalClose}
        onSuccess={handleMaterialsModalSuccess}
        modelId={selectedModelId}
      />

      <AccessoriesModal
        isOpen={showAccessoriesModal}
        onClose={handleAccessoriesModalClose}
        onSuccess={handleAccessoriesModalSuccess}
        modelId={selectedModelId}
      />
    </div>
  );
};

export default CabinetModelsTab;