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

  // Always expect JSON for API responses
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

export const inventoryService = {
  async getItems(params: any = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/inventory/items?${queryString}`, {
        headers: getAuthHeaders(),
      });

      const result = await handleResponse(response);
      // Ensure we always return the expected structure with arrays
      return {
        items: Array.isArray(result?.items) ? result.items : [],
        pagination: result?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }
      };
    } catch (error) {
      console.error('Error fetching items:', error);
      // Return safe defaults on error
      return {
        items: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      };
    }
  },

  async getItem(id: number) {
    try {
      const response = await fetch(`${API_BASE}/inventory/items/${id}`, {
        headers: getAuthHeaders(),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching item:', error);
      return null;
    }
  },

  async createItem(item: any) {
    const response = await fetch(`${API_BASE}/inventory/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    return handleResponse(response);
  },

  async updateItem(id: number, item: any) {
    const response = await fetch(`${API_BASE}/inventory/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    return handleResponse(response);
  },

  async deleteItem(id: number) {
    const response = await fetch(`${API_BASE}/inventory/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async getDropdownData() {
    try {
      const response = await fetch(`${API_BASE}/inventory/dropdown-data`, {
        headers: getAuthHeaders(),
      });

      const result = await handleResponse(response);
      // Ensure all arrays are properly initialized
      return {
        categories: Array.isArray(result?.categories) ? result.categories : [],
        subcategories: Array.isArray(result?.subcategories) ? result.subcategories : [],
        units: Array.isArray(result?.units) ? result.units : [],
        locations: Array.isArray(result?.locations) ? result.locations : [],
        suppliers: Array.isArray(result?.suppliers) ? result.suppliers : []
      };
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      // Return safe defaults on error
      return {
        categories: [],
        subcategories: [],
        units: [],
        locations: [],
        suppliers: []
      };
    }
  },

  async exportCSV(columns?: string[]) {
    const token = localStorage.getItem('token');
    let url = `${API_BASE}/inventory/export/csv`;
    
    // Add columns parameter if provided
    if (columns && columns.length > 0) {
      const columnsParam = columns.join(',');
      url += `?columns=${encodeURIComponent(columnsParam)}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    return response.blob();
  },

  async importCSV(file: File) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/inventory/import/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  },

  async exportPDF(columns?: string[], title?: string) {
    const token = localStorage.getItem('token');
    let url = `${API_BASE}/inventory/export/pdf`;
    
    // Add parameters if provided
    const params = new URLSearchParams();
    if (columns && columns.length > 0) {
      params.append('columns', columns.join(','));
    }
    if (title) {
      params.append('title', title);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    return response.blob();
  },

  async generateCustomReport(options: {
    columns: string[];
    title: string;
    format: 'pdf' | 'csv';
  }) {
    if (options.format === 'pdf') {
      return this.exportPDF(options.columns, options.title);
    } else {
      return this.exportCSV(options.columns);
    }
  }
};