import React, { useState, useEffect } from 'react';
import { Sliders } from 'lucide-react';
import { cabinetService } from '../../services/cabinetService';

interface CabinetFiltersProps {
  filters: {
    category: string;
    material: string;
    priceRange: [number, number];
  };
  onFilterChange: (filters: any) => void;
}

const CabinetFilters: React.FC<CabinetFiltersProps> = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const filterOptions = await cabinetService.getFilterOptions();
      setCategories(filterOptions.categories || []);
      setMaterials(filterOptions.materials || []);
      setMaxPrice(filterOptions.maxPrice || 5000);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ category: e.target.value });
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ material: e.target.value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = parseInt(e.target.value);
    const newPriceRange = [...filters.priceRange] as [number, number];
    newPriceRange[index] = newValue;
    
    // Ensure min <= max
    if (index === 0 && newPriceRange[0] > newPriceRange[1]) {
      newPriceRange[0] = newPriceRange[1];
    } else if (index === 1 && newPriceRange[1] < newPriceRange[0]) {
      newPriceRange[1] = newPriceRange[0];
    }
    
    onFilterChange({ priceRange: newPriceRange });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center mb-4">
        <Sliders className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Filters</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cabinet Type
          </label>
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Material Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material
          </label>
          <select
            value={filters.material}
            onChange={handleMaterialChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Materials</option>
            {materials.map((material, index) => (
              <option key={index} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>
        
        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </label>
          <div className="space-y-4">
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={filters.priceRange[0]}
              onChange={(e) => handlePriceChange(e, 0)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceChange(e, 1)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetFilters;