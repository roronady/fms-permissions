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

export const columnPreferenceService = {
  async saveColumnPreferences(pageId: string, columns: any[]) {
    const response = await fetch(`${API_BASE}/inventory/column-preferences`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        preference_type: pageId,
        columns 
      }),
    });

    return handleResponse(response);
  },

  async getColumnPreferences(pageId: string) {
    try {
      const response = await fetch(`${API_BASE}/inventory/column-preferences?preference_type=${pageId}`, {
        headers: getAuthHeaders(),
      });

      const result = await handleResponse(response);
      return Array.isArray(result?.columns) ? result.columns : null;
    } catch (error) {
      console.error(`Error fetching column preferences for ${pageId}:`, error);
      return null;
    }
  }
};