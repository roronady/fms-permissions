import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  FileText, 
  Trash2, 
  Edit,
  DollarSign,
  Download,
  ShoppingCart,
  Layers
} from 'lucide-react';
import { cabinetCatalogService } from '../../services/cabinetCatalogService';
import { useAuth } from '../../contexts/AuthContext';
import CabinetCustomizerModal from './CabinetCustomizerModal';
import NewProjectModal from './NewProjectModal';

interface KitchenProject {
  id: number;
  name: string;
  client_id: number;
  client_name: string;
  status: string;
  total_estimated_cost: number;
  notes: string;
  cabinet_count: number;
  created_at: string;
  updated_at: string;
}

interface Cabinet {
  id: number;
  kitchen_project_id: number;
  cabinet_model_id: number;
  model_name: string;
  custom_width: number;
  custom_height: number;
  custom_depth: number;
  selected_material_id: number;
  material_name: string;
  material_image: string;
  selected_accessories: any[];
  calculated_cost: number;
  notes: string;
  created_at: string;
}

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
  material_options_count: number;
  accessory_options_count: number;
}

const KitchenDesignerPage: React.FC = () => {
  const [projects, setProjects] = useState<KitchenProject[]>([]);
  const [cabinetModels, setCabinetModels] = useState<CabinetModel[]>([]);
  const [activeProject, setActiveProject] = useState<KitchenProject | null>(null);
  const [projectCabinets, setProjectCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [selectedCabinetModel, setSelectedCabinetModel] = useState<CabinetModel | null>(null);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadProjects();
    loadCabinetModels();
  }, []);

  useEffect(() => {
    if (activeProject) {
      loadProjectDetails(activeProject.id);
    }
  }, [activeProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await cabinetCatalogService.getKitchenProjects();
      setProjects(projectsData);
      
      // Set the first project as active if there's no active project
      if (projectsData.length > 0 && !activeProject) {
        setActiveProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error loading kitchen projects:', error);
      setError('Failed to load kitchen projects');
    } finally {
      setLoading(false);
    }
  };

  const loadCabinetModels = async () => {
    try {
      const models = await cabinetCatalogService.browseCabinetModels();
      setCabinetModels(models);
    } catch (error) {
      console.error('Error loading cabinet models:', error);
      setError('Failed to load cabinet models');
    }
  };

  const loadProjectDetails = async (projectId: number) => {
    try {
      setLoading(true);
      const projectDetails = await cabinetCatalogService.getKitchenProject(projectId);
      setProjectCabinets(projectDetails.cabinets || []);
    } catch (error) {
      console.error('Error loading project details:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleProjectCreated = async () => {
    await loadProjects();
    setShowNewProjectModal(false);
  };

  const handleSelectProject = (project: KitchenProject) => {
    setActiveProject(project);
  };

  const handleAddCabinet = (model: CabinetModel) => {
    if (!activeProject) {
      setError('Please select or create a project first');
      return;
    }
    
    setSelectedCabinetModel(model);
    setEditingCabinet(null);
    setShowCabinetModal(true);
  };

  const handleEditCabinet = (cabinet: Cabinet) => {
    // Find the cabinet model
    const model = cabinetModels.find(m => m.id === cabinet.cabinet_model_id);
    if (!model) {
      setError('Cabinet model not found');
      return;
    }
    
    setSelectedCabinetModel(model);
    setEditingCabinet(cabinet);
    setShowCabinetModal(true);
  };

  const handleDeleteCabinet = async (cabinetId: number) => {
    if (!activeProject) return;
    
    if (confirm('Are you sure you want to remove this cabinet from the project?')) {
      try {
        setLoading(true);
        await cabinetCatalogService.removeCabinetFromProject(activeProject.id, cabinetId);
        await loadProjectDetails(activeProject.id);
        await loadProjects(); // Refresh project list to update cabinet count and total cost
      } catch (error) {
        console.error('Error removing cabinet:', error);
        setError('Failed to remove cabinet');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCabinetAdded = async () => {
    if (!activeProject) return;
    
    await loadProjectDetails(activeProject.id);
    await loadProjects(); // Refresh project list to update cabinet count and total cost
    setShowCabinetModal(false);
  };

  const handleGenerateInvoice = async (format: 'pdf' | 'excel' = 'pdf') => {
    if (!activeProject) return;
    
    try {
      await cabinetCatalogService.generateInvoice(activeProject.id, format);
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice');
    }
  };

  const handleConvertToBOMs = async () => {
    if (!activeProject) return;
    
    try {
      setLoading(true);
      const result = await cabinetCatalogService.convertProjectToBOMs(activeProject.id);
      alert(`Successfully created ${result.boms.length} BOMs from this kitchen project`);
    } catch (error) {
      console.error('Error converting to BOMs:', error);
      setError('Failed to convert project to BOMs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProjectStatus = async (status: string) => {
    if (!activeProject) return;
    
    try {
      setLoading(true);
      await cabinetCatalogService.updateProjectStatus(activeProject.id, status);
      await loadProjects();
      
      // Update active project with new status
      const updatedProject = projects.find(p => p.id === activeProject.id);
      if (updatedProject) {
        setActiveProject(updatedProject);
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'ordered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Designer</h1>
          <p className="text-gray-600">Design custom kitchens with parametric cabinets</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              loadProjects();
              loadCabinetModels();
            }}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleNewProject}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Kitchen Project
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Projects Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">My Kitchen Projects</h2>
            </div>
            <div className="p-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No projects yet</p>
                  <button
                    onClick={handleNewProject}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <div 
                      key={project.id} 
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeProject?.id === project.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => handleSelectProject(project)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-xs text-gray-500">
                            {project.cabinet_count} cabinets | ${project.total_estimated_cost.toFixed(2)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cabinet Models */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Available Cabinet Models</h2>
            </div>
            <div className="p-4">
              {cabinetModels.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No cabinet models available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cabinetModels.map(model => (
                    <div 
                      key={model.id} 
                      className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{model.name}</h3>
                          <p className="text-xs text-gray-500">
                            {model.default_width}″W × {model.default_height}″H × {model.default_depth}″D
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddCabinet(model)}
                          disabled={!activeProject}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                          title={activeProject ? "Add to project" : "Select a project first"}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span className="mr-2">{model.material_options_count} materials</span>
                        <span>{model.accessory_options_count} accessories</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-3">
          {activeProject ? (
            <div className="space-y-6">
              {/* Project Header */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{activeProject.name}</h2>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(activeProject.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(activeProject.status)}`}>
                      {activeProject.status}
                    </span>
                    <div className="relative group">
                      <button className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                        <button
                          onClick={() => handleUpdateProjectStatus('draft')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Set as Draft
                        </button>
                        <button
                          onClick={() => handleUpdateProjectStatus('quoted')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Set as Quoted
                        </button>
                        <button
                          onClick={() => handleUpdateProjectStatus('ordered')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Set as Ordered
                        </button>
                        <button
                          onClick={() => handleUpdateProjectStatus('completed')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Set as Completed
                        </button>
                        <button
                          onClick={() => handleUpdateProjectStatus('cancelled')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Set as Cancelled
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateInvoice('pdf')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF Invoice
                  </button>
                  <button
                    onClick={handleConvertToBOMs}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Convert to BOMs
                  </button>
                </div>
              </div>

              {/* Project Cabinets */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Cabinets in this Project</h3>
                  <div className="text-lg font-bold text-green-600">
                    Total: ${activeProject.total_estimated_cost.toFixed(2)}
                  </div>
                </div>
                <div className="p-6">
                  {projectCabinets.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No cabinets added yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select a cabinet model from the sidebar to add it to your project.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projectCabinets.map(cabinet => (
                        <div key={cabinet.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="font-medium text-gray-900">{cabinet.model_name}</h4>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditCabinet(cabinet)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Edit Cabinet"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCabinet(cabinet.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Remove Cabinet"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between mb-2">
                              <div className="text-sm text-gray-600">
                                {cabinet.custom_width}″W × {cabinet.custom_height}″H × {cabinet.custom_depth}″D
                              </div>
                              <div className="font-medium text-green-600">
                                ${cabinet.calculated_cost.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              Material: {cabinet.material_name}
                            </div>
                            {cabinet.selected_accessories && cabinet.selected_accessories.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Accessories:</span> {cabinet.selected_accessories.length} items
                              </div>
                            )}
                            {cabinet.notes && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {cabinet.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Project Selected</h3>
              <p className="mt-1 text-gray-500">
                Select an existing project from the sidebar or create a new one to get started.
              </p>
              <button
                onClick={handleNewProject}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSuccess={handleProjectCreated}
      />

      <CabinetCustomizerModal
        isOpen={showCabinetModal}
        onClose={() => setShowCabinetModal(false)}
        onSuccess={handleCabinetAdded}
        projectId={activeProject?.id || 0}
        cabinetModel={selectedCabinetModel}
        cabinet={editingCabinet}
      />
    </div>
  );
};

export default KitchenDesignerPage;