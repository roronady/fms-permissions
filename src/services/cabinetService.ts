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

// Mock data for development until backend is implemented
const mockCabinets = [
  {
    id: 1,
    name: 'Base Cabinet 24"',
    category: 'Base Cabinet',
    description: 'Standard 24-inch base cabinet with adjustable shelves',
    default_width: 24,
    default_height: 34.5,
    default_depth: 24,
    min_width: 12,
    max_width: 36,
    min_height: 30,
    max_height: 42,
    min_depth: 20,
    max_depth: 30,
    base_price: 299.99,
    default_material: 'Maple',
    materials: ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF'],
    is_popular: true,
    dimensions: '24"W × 34.5"H × 24"D',
    image_url: 'https://images.pexels.com/photos/5824883/pexels-photo-5824883.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 2,
    name: 'Wall Cabinet 30"',
    category: 'Wall Cabinet',
    description: 'Standard 30-inch wall cabinet with adjustable shelves',
    default_width: 30,
    default_height: 30,
    default_depth: 12,
    min_width: 12,
    max_width: 42,
    min_height: 12,
    max_height: 42,
    min_depth: 12,
    max_depth: 15,
    base_price: 249.99,
    default_material: 'Oak',
    materials: ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF'],
    is_popular: false,
    dimensions: '30"W × 30"H × 12"D',
    image_url: 'https://images.pexels.com/photos/6969809/pexels-photo-6969809.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 3,
    name: 'Pantry Cabinet 84"',
    category: 'Pantry Cabinet',
    description: 'Tall pantry cabinet with adjustable shelves',
    default_width: 24,
    default_height: 84,
    default_depth: 24,
    min_width: 18,
    max_width: 36,
    min_height: 72,
    max_height: 96,
    min_depth: 20,
    max_depth: 30,
    base_price: 599.99,
    default_material: 'Cherry',
    materials: ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF'],
    is_popular: true,
    dimensions: '24"W × 84"H × 24"D',
    image_url: 'https://images.pexels.com/photos/6489107/pexels-photo-6489107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 4,
    name: 'Corner Cabinet 36"',
    category: 'Corner Cabinet',
    description: 'Corner cabinet with lazy susan',
    default_width: 36,
    default_height: 34.5,
    default_depth: 36,
    min_width: 33,
    max_width: 42,
    min_height: 30,
    max_height: 42,
    min_depth: 33,
    max_depth: 42,
    base_price: 449.99,
    default_material: 'Maple',
    materials: ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF'],
    is_popular: false,
    dimensions: '36"W × 34.5"H × 36"D',
    image_url: 'https://images.pexels.com/photos/6585764/pexels-photo-6585764.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 5,
    name: 'Sink Base Cabinet 36"',
    category: 'Base Cabinet',
    description: 'Base cabinet designed for sink installation',
    default_width: 36,
    default_height: 34.5,
    default_depth: 24,
    min_width: 24,
    max_width: 48,
    min_height: 30,
    max_height: 42,
    min_depth: 20,
    max_depth: 30,
    base_price: 349.99,
    default_material: 'Oak',
    materials: ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF'],
    is_popular: true,
    dimensions: '36"W × 34.5"H × 24"D',
    image_url: 'https://images.pexels.com/photos/6312364/pexels-photo-6312364.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 6,
    name: 'Island Cabinet 48"',
    category: 'Island Cabinet',
    description: 'Kitchen island cabinet with drawers and shelves',
    default_width: 48,
    default_height: 34.5,
    default_depth: 24,
    min_width: 36,
    max_width: 72,
    min_height: 30,
    max_height: 42,
    min_depth: 24,
    max_depth: 48,
    base_price: 799.99,
    default_material: 'Cherry',
    materials: ['Maple', 'Oak', 'Cherry', 'Birch', 'MDF'],
    is_popular: false,
    dimensions: '48"W × 34.5"H × 24"D',
    image_url: 'https://images.pexels.com/photos/7061072/pexels-photo-7061072.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  }
];

const mockAccessories = [
  { id: 'acc1', name: 'Soft-Close Hinges (Pair)', price: 12.99 },
  { id: 'acc2', name: 'Pull-Out Drawer', price: 49.99 },
  { id: 'acc3', name: 'Door Handles (Each)', price: 8.99 },
  { id: 'acc4', name: 'Adjustable Shelf', price: 19.99 },
  { id: 'acc5', name: 'Lazy Susan', price: 79.99 },
  { id: 'acc6', name: 'Pull-Out Trash Bin', price: 59.99 },
  { id: 'acc7', name: 'Spice Rack', price: 29.99 },
  { id: 'acc8', name: 'LED Under-Cabinet Lighting', price: 39.99 }
];

export const cabinetService = {
  async getCabinets(params: any = {}) {
    try {
      // In a real implementation, this would call the backend API
      // const queryString = new URLSearchParams(params).toString();
      // const response = await fetch(`${API_BASE}/cabinets?${queryString}`, {
      //   headers: getAuthHeaders(),
      // });
      // return handleResponse(response);
      
      // For now, return mock data with filtering
      let filteredCabinets = [...mockCabinets];
      
      // Apply search filter
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredCabinets = filteredCabinets.filter(cabinet => 
          cabinet.name.toLowerCase().includes(searchLower) || 
          cabinet.description.toLowerCase().includes(searchLower) ||
          cabinet.category.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply category filter
      if (params.category) {
        filteredCabinets = filteredCabinets.filter(cabinet => 
          cabinet.category === params.category
        );
      }
      
      // Apply material filter
      if (params.material) {
        filteredCabinets = filteredCabinets.filter(cabinet => 
          cabinet.materials.includes(params.material)
        );
      }
      
      // Apply price range filter
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        filteredCabinets = filteredCabinets.filter(cabinet => {
          const price = cabinet.base_price;
          if (params.minPrice !== undefined && price < params.minPrice) return false;
          if (params.maxPrice !== undefined && price > params.maxPrice) return false;
          return true;
        });
      }
      
      return filteredCabinets;
    } catch (error) {
      console.error('Error fetching cabinets:', error);
      return [];
    }
  },

  async getCabinet(id: number) {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/${id}`, {
      //   headers: getAuthHeaders(),
      // });
      // return handleResponse(response);
      
      // For now, return mock data
      const cabinet = mockCabinets.find(c => c.id === id);
      return cabinet || null;
    } catch (error) {
      console.error('Error fetching cabinet:', error);
      return null;
    }
  },

  async getFilterOptions() {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/filter-options`, {
      //   headers: getAuthHeaders(),
      // });
      // return handleResponse(response);
      
      // For now, return mock data
      const categories = Array.from(new Set(mockCabinets.map(c => c.category)));
      const materials = Array.from(new Set(mockCabinets.flatMap(c => c.materials)));
      const maxPrice = Math.max(...mockCabinets.map(c => c.base_price));
      
      return {
        categories,
        materials,
        maxPrice
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        categories: [],
        materials: [],
        maxPrice: 1000
      };
    }
  },

  async getCabinetAccessories(cabinetId: number) {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/${cabinetId}/accessories`, {
      //   headers: getAuthHeaders(),
      // });
      // return handleResponse(response);
      
      // For now, return mock data
      return mockAccessories;
    } catch (error) {
      console.error('Error fetching cabinet accessories:', error);
      return [];
    }
  },

  async calculateCabinetPrice(params: any) {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/calculate-price`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify(params),
      // });
      // return handleResponse(response);
      
      // For now, calculate price based on mock data
      const cabinet = mockCabinets.find(c => c.id === params.cabinet_id);
      if (!cabinet) throw new Error('Cabinet not found');
      
      // Base price
      let totalPrice = cabinet.base_price;
      
      // Dimension adjustments (simplified calculation)
      const widthFactor = params.width / cabinet.default_width;
      const heightFactor = params.height / cabinet.default_height;
      const depthFactor = params.depth / cabinet.default_depth;
      const dimensionFactor = (widthFactor + heightFactor + depthFactor) / 3;
      totalPrice = totalPrice * dimensionFactor;
      
      // Material adjustment
      const materialPriceFactors: {[key: string]: number} = {
        'Maple': 1.0,
        'Oak': 1.1,
        'Cherry': 1.3,
        'Birch': 0.9,
        'MDF': 0.7
      };
      const materialFactor = materialPriceFactors[params.material] || 1.0;
      totalPrice = totalPrice * materialFactor;
      
      // Add accessories
      if (params.accessories && params.accessories.length > 0) {
        const accessoriesTotal = params.accessories.reduce((sum: number, accId: string) => {
          const accessory = mockAccessories.find(a => a.id === accId);
          return sum + (accessory ? accessory.price : 0);
        }, 0);
        totalPrice += accessoriesTotal;
      }
      
      return {
        base_price: cabinet.base_price,
        dimension_adjustment: totalPrice - cabinet.base_price,
        material_adjustment: (materialFactor - 1) * cabinet.base_price,
        accessories_price: params.accessories.reduce((sum: number, accId: string) => {
          const accessory = mockAccessories.find(a => a.id === accId);
          return sum + (accessory ? accessory.price : 0);
        }, 0),
        total_price: Math.round(totalPrice * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating cabinet price:', error);
      return {
        total_price: 0
      };
    }
  },

  async addToCart(params: any) {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cart/add`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify(params),
      // });
      // return handleResponse(response);
      
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  async generateQuote(params: any) {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`${API_BASE}/cabinets/generate-quote`, {
      //   method: 'POST',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify(params),
      // });
      // const result = await handleResponse(response);
      // return result.quote_url;
      
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a simple data URL with a text representation of the quote
      const cabinet = mockCabinets.find(c => c.id === params.cabinet_id);
      if (!cabinet) throw new Error('Cabinet not found');
      
      const quoteText = `
QUOTE FOR CUSTOM CABINET

Cabinet: ${cabinet.name}
Category: ${cabinet.category}
Dimensions: ${params.customization.width}"W × ${params.customization.height}"H × ${params.customization.depth}"D
Material: ${params.customization.material}
Quantity: ${params.customization.quantity}

Accessories:
${params.customization.accessories.map((accId: string) => {
  const accessory = mockAccessories.find(a => a.id === accId);
  return accessory ? `- ${accessory.name}: $${accessory.price.toFixed(2)}` : '';
}).join('\n')}

Total Price: $${(await this.calculateCabinetPrice({
  cabinet_id: params.cabinet_id,
  width: params.customization.width,
  height: params.customization.height,
  depth: params.customization.depth,
  material: params.customization.material,
  accessories: params.customization.accessories,
  quantity: 1
})).total_price.toFixed(2)} each

GRAND TOTAL: $${((await this.calculateCabinetPrice({
  cabinet_id: params.cabinet_id,
  width: params.customization.width,
  height: params.customization.height,
  depth: params.customization.depth,
  material: params.customization.material,
  accessories: params.customization.accessories,
  quantity: 1
})).total_price * params.customization.quantity).toFixed(2)}

Quote generated on: ${new Date().toLocaleDateString()}
Valid for 30 days
      `;
      
      const blob = new Blob([quoteText], { type: 'text/plain' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating quote:', error);
      throw error;
    }
  },

  // Admin methods for cabinet management
  async createCabinet(cabinetData: any) {
    const response = await fetch(`${API_BASE}/cabinets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cabinetData),
    });

    return handleResponse(response);
  },

  async updateCabinet(id: number, cabinetData: any) {
    const response = await fetch(`${API_BASE}/cabinets/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cabinetData),
    });

    return handleResponse(response);
  },

  async deleteCabinet(id: number) {
    const response = await fetch(`${API_BASE}/cabinets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  }
};