import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  AlertTriangle,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Columns,
  History,
  Settings,
  Plus as PlusIcon,
  Minus,
  Filter
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { useSocket } from '../../contexts/SocketContext';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import StockMovementModal from './StockMovementModal';
import StockAdjustmentModal from './StockAdjustmentModal';
import ColumnCustomizerModal from './ColumnCustomizerModal';
import { useLocation } from 'react-router-dom';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description?: string;
  category_name?: string;
  subcategory_name?: string;
  unit_name?: string;
  location_name?: string;
  supplier_name?: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
  last_price?: number;
  average_price?: number;
  total_value: number;
  is_low_stock: boolean;
  item_type: string;
  updated_at: string;
}

interface Column {
  id: string;
  label: string;
  visible: boolean;
  width: number;
  order: number;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'name', label: 'Item Name', visible: true, width: 200, order: 1 },
  { id: 'sku', label: 'SKU', visible: true, width: 120, order: 2 },
  { id: 'category_name', label: 'Category', visible: true, width: 120, order: 3 },
  { id: 'subcategory_name', label: 'Subcategory', visible: false, width: 120, order: 4 },
  { id: 'quantity', label: 'Quantity', visible: true, width: 100, order: 5 },
  { id: 'unit_name', label: 'Unit', visible: true, width: 80, order: 6 },
  { id: 'location_name', label: 'Location', visible: true, width: 120, order: 7 },
  { id: 'supplier_name', label: 'Supplier', visible: false, width: 150, order: 8 },
  { id: 'unit_price', label: 'Unit Price', visible: true, width: 100, order: 9 },
  { id: 'last_price', label: 'Last Price', visible: false, width: 100, order: 10 },
  { id: 'average_price', label: 'Avg Price', visible: false, width: 100, order: 11 },
  { id: 'total_value', label: 'Total Value', visible: true, width: 120, order: 12 },
  { id: 'min_quantity', label: 'Min Qty', visible: false, width: 100, order: 13 },
  { id: 'max_quantity', label: 'Max Qty', visible: false, width: 100, order: 14 },
  { id: 'item_type', label: 'Item Type', visible: true, width: 130, order: 15 },
  { id: 'status', label: 'Status', visible: true, width: 100, order: 16 },
  { id: 'actions', label: 'Actions', visible: true, width: 120, order: 17 }
];

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemType, setSelectedItemType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockMovementModal, setShowStockMovementModal] = useState(false);
  const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);
  const [showColumnCustomizerModal, setShowColumnCustomizerModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const { socket } = useSocket();
  const location = useLocation();

  useEffect(() => {
    loadItems();
    loadCategories();
    loadColumnPreferences();
    
    // Check if we should open the add modal from navigation state
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      // Clear the state to prevent reopening on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [searchTerm, selectedCategory, selectedItemType, pagination.page, location.state]);

  useEffect(() => {
    if (socket) {
      socket.on('item_created', loadItems);
      socket.on('item_updated', loadItems);
      socket.on('item_deleted', loadItems);

      return () => {
        socket.off('item_created');
        socket.off('item_updated');
        socket.off('item_deleted');
      };
    }
  }, [socket]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedItemType !== 'all') params.itemType = selectedItemType;

      const response = await inventoryService.getItems(params);
      setItems(response.items);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await inventoryService.getDropdownData();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadColumnPreferences = async () => {
    try {
      const savedColumns = await inventoryService.getColumnPreferences();
      if (savedColumns) {
        setColumns(savedColumns);
      }
    } catch (error) {
      console.error('Error loading column preferences:', error);
    }
  };

  const handleSaveColumnPreferences = async (updatedColumns: Column[]) => {
    try {
      await inventoryService.saveColumnPreferences(updatedColumns);
      setColumns(updatedColumns);
    } catch (error) {
      console.error('Error saving column preferences:', error);
    }
  };

  const handleDeleteItem = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await inventoryService.deleteItem(id);
        loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const handleEditItem = (id: number) => {
    setEditingItemId(id);
    setShowEditModal(true);
  };

  const handleViewStockMovement = (id: number) => {
    setSelectedItemId(id);
    setShowStockMovementModal(true);
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowStockAdjustmentModal(true);
  };

  const handleAddItemClick = () => {
    setShowAddModal(true);
  };

  const handleExportCSV = async () => {
    try {
      // Get visible columns for export
      const visibleColumns = columns
        .filter(col => col.visible && col.id !== 'actions')
        .sort((a, b) => a.order - b.order)
        .map(col => col.id);
      
      const columnWidths = columns
        .filter(col => col.visible && col.id !== 'actions')
        .map(col => ({ id: col.id, width: col.width }));
      
      const blob = await inventoryService.exportCSV(visibleColumns, columnWidths);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'inventory_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Get visible columns for export
      const visibleColumns = columns
        .filter(col => col.visible && col.id !== 'actions')
        .sort((a, b) => a.order - b.order)
        .map(col => col.id);
      
      const columnWidths = columns
        .filter(col => col.visible && col.id !== 'actions')
        .map(col => ({ id: col.id, width: col.width }));
      
      const blob = await inventoryService.exportPDF(visibleColumns, 'Inventory Report', columnWidths);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'inventory_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await inventoryService.importCSV(file);
      alert(`Import completed: ${result.imported} items imported, ${result.errors.length} errors`);
      loadItems();
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Failed to import CSV');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const getStatusColor = (item: InventoryItem) => {
    if (item.quantity === 0) return 'bg-red-100 text-red-800';
    if (item.is_low_stock) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.is_low_stock) return 'Low Stock';
    return 'In Stock';
  };

  const getPriceTrend = (currentPrice: number, lastPrice?: number) => {
    if (!lastPrice || lastPrice === 0) return null;
    
    if (currentPrice > lastPrice) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (currentPrice < lastPrice) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };
  
  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'raw_material': return 'Raw Material';
      case 'semi_finished_product': return 'Semi-Finished';
      case 'finished_product': return 'Finished Product';
      default: return itemType;
    }
  };
  
  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case 'raw_material': return 'bg-blue-100 text-blue-800';
      case 'semi_finished_product': return 'bg-purple-100 text-purple-800';
      case 'finished_product': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get visible columns sorted by order
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  const totalItems = items.length;
  const inStockItems = items.filter(item => item.quantity > 0 && !item.is_low_stock).length;
  const lowStockItems = items.filter(item => item.is_low_stock && item.quantity > 0).length;
  const outOfStockItems = items.filter(item => item.quantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your inventory items</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowColumnCustomizerModal(true)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Columns className="w-4 h-4 mr-2" />
            Columns
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={loadItems}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={handleAddItemClick}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-gray-900">{inStockItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Item Types</option>
              <option value="raw_material">Raw Materials</option>
              <option value="semi_finished_product">Semi-Finished Products</option>
              <option value="finished_product">Finished Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map(column => (
                      <th 
                        key={column.id} 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ width: `${column.width}px`, minWidth: `${column.width}px` }}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.map(column => {
                        switch (column.id) {
                          case 'name':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                </div>
                              </td>
                            );
                          case 'sku':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.sku}
                              </td>
                            );
                          case 'category_name':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.category_name || 'Uncategorized'}
                              </td>
                            );
                          case 'subcategory_name':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.subcategory_name || '-'}
                              </td>
                            );
                          case 'quantity':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  {item.quantity} {item.unit_name && `${item.unit_name}`}
                                  {item.is_low_stock && item.quantity > 0 && (
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                                  )}
                                </div>
                              </td>
                            );
                          case 'unit_name':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.unit_name || '-'}
                              </td>
                            );
                          case 'location_name':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.location_name || '-'}
                              </td>
                            );
                          case 'supplier_name':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.supplier_name || '-'}
                              </td>
                            );
                          case 'unit_price':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  ${item.unit_price.toFixed(2)}
                                  {getPriceTrend(item.unit_price, item.last_price) && (
                                    <span className="ml-2">
                                      {getPriceTrend(item.unit_price, item.last_price)}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          case 'last_price':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.last_price ? `$${item.last_price.toFixed(2)}` : '-'}
                              </td>
                            );
                          case 'average_price':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.average_price ? `$${item.average_price.toFixed(2)}` : '-'}
                              </td>
                            );
                          case 'total_value':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${item.total_value.toFixed(2)}
                              </td>
                            );
                          case 'min_quantity':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.min_quantity}
                              </td>
                            );
                          case 'max_quantity':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.max_quantity}
                              </td>
                            );
                          case 'item_type':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getItemTypeColor(item.item_type)}`}>
                                  {getItemTypeLabel(item.item_type)}
                                </span>
                              </td>
                            );
                          case 'status':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                                  {getStatusText(item)}
                                </span>
                              </td>
                            );
                          case 'actions':
                            return (
                              <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleEditItem(item.id)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Edit Item"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleStockAdjustment(item)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                    title="Adjust Stock"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleViewStockMovement(item.id)}
                                    className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                    title="View Stock Movement History"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteItem(item.id, item.name)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            );
                          default:
                            return <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>;
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {items.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory !== 'all' || selectedItemType !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by adding your first inventory item.'
                  }
                </p>
                <button
                  onClick={handleAddItemClick}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </button>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onItemAdded={loadItems}
      />

      <EditItemModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItemId(null);
        }}
        onItemUpdated={loadItems}
        itemId={editingItemId}
      />

      <StockMovementModal
        isOpen={showStockMovementModal}
        onClose={() => {
          setShowStockMovementModal(false);
          setSelectedItemId(null);
        }}
        itemId={selectedItemId}
      />

      <StockAdjustmentModal
        isOpen={showStockAdjustmentModal}
        onClose={() => {
          setShowStockAdjustmentModal(false);
          setSelectedItem(null);
        }}
        onSuccess={loadItems}
        item={selectedItem}
      />

      <ColumnCustomizerModal
        isOpen={showColumnCustomizerModal}
        onClose={() => setShowColumnCustomizerModal(false)}
        onSave={handleSaveColumnPreferences}
        columns={columns}
      />
    </div>
  );
};

export default Inventory;