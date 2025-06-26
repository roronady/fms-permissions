const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (text.trim() === '') {
    return {};
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON:', text);
    throw new Error('Invalid JSON response');
  }
};

export const cabinetCatalogService = {
  // Cabinet Models (Admin)
  async getCabinetModels() {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async getCabinetModel(id: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async createCabinetModel(model: any) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(model),
    });

    return handleResponse(response);
  },

  async updateCabinetModel(id: number, model: any) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(model),
    });

    return handleResponse(response);
  },

  async deleteCabinetModel(id: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Materials (Admin)
  async getAvailableMaterials() {
    const response = await fetch(`${API_BASE}/cabinet-catalog/materials`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async getMaterialsForCabinetModel(modelId: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${modelId}/materials`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async addMaterialToCabinetModel(modelId: number, materialId: number, costFactorPerSqFt: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${modelId}/materials`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        material_item_id: materialId,
        cost_factor_per_sqft: costFactorPerSqFt
      }),
    });

    return handleResponse(response);
  },

  async removeMaterialFromCabinetModel(modelId: number, materialId: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${modelId}/materials/${materialId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Accessories (Admin)
  async getAvailableAccessories() {
    const response = await fetch(`${API_BASE}/cabinet-catalog/accessories`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async getAccessoriesForCabinetModel(modelId: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${modelId}/accessories`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async addAccessoryToCabinetModel(modelId: number, accessoryId: number, quantityPerCabinet: number, costFactorPerUnit: number = 0) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${modelId}/accessories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        accessory_item_id: accessoryId,
        quantity_per_cabinet: quantityPerCabinet,
        cost_factor_per_unit: costFactorPerUnit
      }),
    });

    return handleResponse(response);
  },

  async removeAccessoryFromCabinetModel(modelId: number, accessoryId: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/models/${modelId}/accessories/${accessoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Client-facing APIs
  async browseCabinetModels() {
    const response = await fetch(`${API_BASE}/cabinet-catalog/browse`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async calculateCabinetCost(cabinetModelId: number, dimensions: any, materialId: number, selectedAccessories: any[] = []) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/calculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        cabinet_model_id: cabinetModelId,
        dimensions,
        material_id: materialId,
        selected_accessories: selectedAccessories
      }),
    });

    return handleResponse(response);
  },

  // Kitchen Projects
  async getKitchenProjects() {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async createKitchenProject(project: any) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(project),
    });

    return handleResponse(response);
  },

  async getKitchenProject(id: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async addCabinetToProject(projectId: number, cabinet: any) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects/${projectId}/add-cabinet`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cabinet),
    });

    return handleResponse(response);
  },

  async updateCabinetInProject(projectId: number, cabinetId: number, cabinet: any) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects/${projectId}/update-cabinet/${cabinetId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cabinet),
    });

    return handleResponse(response);
  },

  async removeCabinetFromProject(projectId: number, cabinetId: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects/${projectId}/remove-cabinet/${cabinetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async updateProjectStatus(projectId: number, status: string, notes?: string) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects/${projectId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    return handleResponse(response);
  },

  async generateInvoice(projectId: number, format: 'pdf' | 'excel' = 'pdf') {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/cabinet-catalog/projects/${projectId}/generate-invoice?format=${format}`;
    
    // Create a hidden anchor element to trigger download
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `kitchen_invoice_${projectId}.${format}`;
    
    // Add authorization header via fetch and convert to blob
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate invoice');
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    a.href = objectUrl;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  },

  async convertProjectToBOMs(projectId: number) {
    const response = await fetch(`${API_BASE}/cabinet-catalog/projects/${projectId}/convert-to-boms`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  }
};