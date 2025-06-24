import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Plus, 
  Search, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  DollarSign,
  Play,
  FileText,
  Layers,
  Columns
} from 'lucide-react';
import { productionOrderService } from '../../services/productionService';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import CreateProductionOrderModal from './CreateProductionOrderModal';
import ViewProductionOrderModal from './ViewProductionOrderModal';
import EditProductionOrderModal from './EditProductionOrderModal';
import IssueMaterialsModal from './IssueMaterialsModal';
import CompleteProductionModal from './CompleteProductionModal';
import BOMsTab from '../MasterData/BOMsTab';
import { useLocation } from 'react-router-dom';
import ColumnCustomizerModal, { Column } from '../Common/ColumnCustomizer';
import { useColumnPreferences } from '../../hooks/useColumnPreferences';

interface ProductionOrder {
  id: number;
  order_number: string;
  title: string;
  description: string;
  bom_id: number;
  bom_name: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  quantity: number;
  start_date: string;
  due_date: string;
  completion_date: string;
  finished_product_id: number;
  finished_product_name: string;
  finished_product_sku: string;
  planned_cost: number;
  actual_cost: number;
  material_count: number;
  operation_count: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'order_number', label: 'Order Number', visible: true, width: 180, order: 1 },
  { id: 'product', label: 'Product', visible: true, width: 180, order: 2 },
  { id: 'bom', label: 'BOM', visible: true, width: 150, order: 3 },
  { id: 'priority', label: 'Priority', visible: true, width: 100, order: 4 },
  { id: 'status', label: 'Status', visible: true, width: 120, order: 5 },
  { id: 'quantity', label: 'Quantity', visible: true, width: 100, order: 6 },
  { id: 'planned_cost', label: 'Planned Cost', visible: true, width: 120, order: 7 },
  { id: 'due_date', label: 'Due Date', visible: true, width: 120, order: 8 },
  { id: 'created_by', label: 'Created By', visible: false, width: 150, order: 9 },
  { id: 'created_at', label: 'Created', visible: false, width: 150, order: 10 },
  { id: 'actions', label: 'Actions', visible: true, width: 150, order: 11 }
];

const Production: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'boms'>('orders');
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [stats, setStats] = useState({
    total_orders: 0,
    draft_count: 0,
    planned_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    total_planned_cost: 0,
    total_actual_cost: 0,
    avg_completion_time_days: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const { 
    columns, 
    visibleColumns, 
    showColumnCustomizer, 
    setShowColumnCustomizer, 
    handleSaveColumnPreferences 
  } = useColumnPreferences('production_order_columns', DEFAULT_COLUMNS);

  const { socket } = useSocket();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (activeTab === 'orders') {
      loadProductionOrders();
      loadStats();
    }
    
    // Check if we should open modals from navigation state
    if (location.state) {
      if (location.state.openCreateModal) {
        setShowCreateModal(true);
      }
      if (location.state.viewProductionOrder) {
        const orderId = location.state.viewProductionOrder;
        handleViewById(orderId);
      }
      // Clear the state to prevent reopening on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [searchTerm, statusFilter, pagination.page, location.state, activeTab]);

  useEffect(() => {
    if (socket) {
      socket.on('production_order_created', loadProductionOrders);
      socket.on('production_order_updated', loadProductionOrders);
      socket.on('production_order_deleted', loadProductionOrders);

      return () => {
        socket.off('production_order_created');
        socket.off('production_order_updated');
        socket.off('production_order_deleted');
      };
    }
  }, [socket]);

  const loadProductionOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await productionOrderService.getProductionOrders(params);
      setProductionOrders(response.productionOrders);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading production orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await productionOrderService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewById = async (id: number) => {
    try {
      const data = await productionOrderService.getProductionOrder(id);
      if (data) {
        setSelectedOrder(data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching production order:', error);
    }
  };

  const handleView = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEdit = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleIssueMaterials = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowIssueModal(true);
  };

  const handleCompleteProduction = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setShowCompleteModal(true);
  };

  const handleDelete = async (order: ProductionOrder) => {
    if (confirm(`Are you sure you want to delete production order "${order.order_number}"?`)) {
      try {
        await productionOrderService.deleteProductionOrder(order.id);
        loadProductionOrders();
        loadStats();
      } catch (error) {
        console.error('Error deleting production order:', error);
        alert('Failed to delete production order');
      }
    }
  };

  const handleStatusUpdate = async (order: ProductionOrder, newStatus: string) => {
    try {
      await productionOrderService.updateStatus(order.id, newStatus);
      loadProductionOrders();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleModalSuccess = () => {
    loadProductionOrders();
    loadStats();
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowIssueModal(false);
    setShowCompleteModal(false);
    setSelectedOrder(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-500" />;
      case 'planned': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'draft': return <FileText className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Permission helpers
  const canEdit = (order: ProductionOrder) => {
    return ['draft', 'planned'].includes(order.status) && 
           (user?.role === 'admin' || user?.role === 'manager');
  };

  const canDelete = (order: ProductionOrder) => {
    return ['draft', 'cancelled'].includes(order.status) && 
           (user?.role === 'admin' || user?.role === 'manager');
  };

  const canIssueMaterials = (order: ProductionOrder) => {
    return ['planned', 'in_progress'].includes(order.status) && 
           (user?.role === 'admin' || user?.role === 'manager');
  };

  const canCompleteProduction = (order: ProductionOrder) => {
    return order.status === 'in_progress' && 
           (user?.role === 'admin' || user?.role === 'manager');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Management</h1>
          <p className="text-gray-600">Manage manufacturing production orders and bills of materials</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'orders' && (
            <button
              onClick={() => setShowColumnCustomizer(true)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </button>
          )}
          <button
            onClick={() => activeTab === 'orders' ? loadProductionOrders() : null}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          {activeTab === 'orders' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Production Order
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Factory className="h-5 w-5 mr-2" />
              Production Orders
            </button>
            <button
              onClick={() => setActiveTab('boms')}
              className={`${
                activeTab === 'boms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Layers className="h-5 w-5 mr-2" />
              Bills of Materials
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'orders' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <Factory className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <Play className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.in_progress_count}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completed_count}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${stats.total_planned_cost ? stats.total_planned_cost.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search production orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Production Orders Table */}
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
                          {productionOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              {visibleColumns.map(column => {
                                switch (column.id) {
                                  case 'order_number':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                                          <div className="text-sm text-gray-500">{order.title}</div>
                                        </div>
                                      </td>
                                    );
                                  case 'product':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{order.finished_product_name || 'N/A'}</div>
                                          <div className="text-sm text-gray-500">{order.finished_product_sku || ''}</div>
                                        </div>
                                      </td>
                                    );
                                  case 'bom':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.bom_name || 'N/A'}
                                      </td>
                                    );
                                  case 'priority':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                                          {order.priority}
                                        </span>
                                      </td>
                                    );
                                  case 'status':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          {getStatusIcon(order.status)}
                                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  case 'quantity':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.quantity}
                                      </td>
                                    );
                                  case 'planned_cost':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${order.planned_cost ? order.planned_cost.toFixed(2) : '0.00'}
                                      </td>
                                    );
                                  case 'due_date':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                          {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'Not set'}
                                        </div>
                                      </td>
                                    );
                                  case 'created_by':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.created_by_name || 'Unknown'}
                                      </td>
                                    );
                                  case 'created_at':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </td>
                                    );
                                  case 'actions':
                                    return (
                                      <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-1">
                                          {/* View Button - Always available */}
                                          <button
                                            onClick={() => handleView(order)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                            title="View Details"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </button>

                                          {/* Edit Button */}
                                          {canEdit(order) && (
                                            <button
                                              onClick={() => handleEdit(order)}
                                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                              title="Edit Order"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </button>
                                          )}

                                          {/* Status Transition Buttons */}
                                          {order.status === 'draft' && (
                                            <button
                                              onClick={() => handleStatusUpdate(order, 'planned')}
                                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                              title="Move to Planned"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </button>
                                          )}

                                          {/* Issue Materials Button */}
                                          {canIssueMaterials(order) && (
                                            <button
                                              onClick={() => handleIssueMaterials(order)}
                                              className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors"
                                              title="Issue Materials"
                                            >
                                              <Package className="h-4 w-4" />
                                            </button>
                                          )}

                                          {/* Complete Production Button */}
                                          {canCompleteProduction(order) && (
                                            <button
                                              onClick={() => handleCompleteProduction(order)}
                                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                              title="Complete Production"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </button>
                                          )}

                                          {/* Delete Button */}
                                          {canDelete(order) && (
                                            <button
                                              onClick={() => handleDelete(order)}
                                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                              title="Delete Order"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          )}

                                          {/* Cancel Button */}
                                          {['draft', 'planned', 'in_progress'].includes(order.status) && (
                                            <button
                                              onClick={() => handleStatusUpdate(order, 'cancelled')}
                                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                              title="Cancel Order"
                                            >
                                              <XCircle className="h-4 w-4" />
                                            </button>
                                          )}
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

                    {productionOrders.length === 0 && (
                      <div className="text-center py-12">
                        <Factory className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No production orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Get started by creating your first production order.'
                          }
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Production Order
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
            </>
          ) : (
            <BOMsTab />
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateProductionOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditProductionOrderModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleModalSuccess}
        productionOrder={selectedOrder}
      />

      <ViewProductionOrderModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOrder(null);
        }}
        productionOrder={selectedOrder}
      />

      <IssueMaterialsModal
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleModalSuccess}
        productionOrder={selectedOrder}
      />

      <CompleteProductionModal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleModalSuccess}
        productionOrder={selectedOrder}
      />

      <ColumnCustomizerModal
        isOpen={showColumnCustomizer}
        onClose={() => setShowColumnCustomizer(false)}
        onSave={handleSaveColumnPreferences}
        columns={columns}
        title="Customize Production Order Columns"
      />
    </div>
  );
};

export default Production;