import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  RefreshCw,
  Filter,
  Search,
  Grid,
  List,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CabinetList from './CabinetList';
import CabinetGrid from './CabinetGrid';
import CabinetFilters from './CabinetFilters';
import CabinetDetailModal from './CabinetDetailModal';
import { cabinetService } from '../../services/cabinetService';

const CabinetCatalog: React.FC = () => {
  const [cabinets, setCabinets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    material: 'all',
    priceRange: [0, 5000]
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState<any>(null);
  const { hasPermission } = useAuth();

  useEffect(() => {
    loadCabinets();
  }, [searchTerm, filters]);

  const loadCabinets = async () => {
    try {
      setLoading(true);
      const data = await cabinetService.getCabinets({
        search: searchTerm,
        category: filters.category !== 'all' ? filters.category : undefined,
        material: filters.material !== 'all' ? filters.material : undefined,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1]
      });
      setCabinets(data);
    } catch (error) {
      console.error('Error loading cabinets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCabinetClick = (cabinet: any) => {
    setSelectedCabinet(cabinet);
    setShowDetailModal(true);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabinet Catalog</h1>
          <p className="text-gray-600">Browse and customize kitchen cabinets</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'}`}
              title="Grid View"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'}`}
              title="List View"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={loadCabinets}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          {hasPermission('cabinet.create') && (
            <button
              onClick={() => {/* Navigate to cabinet creation page */}}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cabinet
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
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
              onClick={() => {/* Open filters modal/drawer */}}
              className="w-full md:w-auto flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Cabinet Filters */}
      <CabinetFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Cabinet List/Grid */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : cabinets.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cabinets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <CabinetGrid 
            cabinets={cabinets} 
            onCabinetClick={handleCabinetClick} 
          />
        ) : (
          <CabinetList 
            cabinets={cabinets} 
            onCabinetClick={handleCabinetClick} 
          />
        )}
      </div>

      {/* Cabinet Detail Modal */}
      <CabinetDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        cabinet={selectedCabinet}
      />
    </div>
  );
};

export default CabinetCatalog;