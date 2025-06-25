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

export const userService = {
  async getUsers() {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    // Ensure we always return an array
    return Array.isArray(result) ? result : [];
  },

  async createUser(userData: any) {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  async updateUser(id: number, userData: any) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  async deleteUser(id: number) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Permission management methods
  async getPermissions() {
    const response = await fetch(`${API_BASE}/users/permissions`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async getRolePermissions() {
    const response = await fetch(`${API_BASE}/users/role-permissions`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async updateRolePermissions(rolePermissions: any[]) {
    const response = await fetch(`${API_BASE}/users/role-permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rolePermissions }),
    });

    return handleResponse(response);
  },

  async getUserPermissions(userId: number) {
    const response = await fetch(`${API_BASE}/users/${userId}/permissions`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async updateUserPermissions(userId: number, permissions: string[]) {
    const response = await fetch(`${API_BASE}/users/${userId}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });

    return handleResponse(response);
  },

  // New methods for dynamic roles
  async getRoles() {
    const response = await fetch(`${API_BASE}/users/roles`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : ['admin', 'manager', 'user'];
  },

  async createRole(role: string, permissions: string[] = []) {
    const response = await fetch(`${API_BASE}/users/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role, permissions }),
    });

    return handleResponse(response);
  },

  async deleteRole(role: string) {
    const response = await fetch(`${API_BASE}/users/roles/${role}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // User-specific permissions
  async getUserSpecificPermissions(userId: number) {
    const response = await fetch(`${API_BASE}/users/${userId}/specific-permissions`, {
      headers: getAuthHeaders(),
    });

    const result = await handleResponse(response);
    return Array.isArray(result) ? result : [];
  },

  async updateUserSpecificPermissions(userId: number, permissions: any[]) {
    const response = await fetch(`${API_BASE}/users/${userId}/specific-permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });

    return handleResponse(response);
  }
};