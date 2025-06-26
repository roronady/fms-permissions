import React from 'react';
import { DollarSign, Ruler, Package } from 'lucide-react';

interface CabinetGridProps {
  cabinets: any[];
  onCabinetClick: (cabinet: any) => void;
}

const CabinetGrid: React.FC<CabinetGridProps> = ({ cabinets, onCabinetClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cabinets.map((cabinet) => (
        <div 
          key={cabinet.id} 
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onCabinetClick(cabinet)}
        >
          <div className="relative h-48 bg-gray-100">
            {cabinet.image_url ? (
              <img 
                src={cabinet.image_url} 
                alt={cabinet.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Cabinet+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}
            {cabinet.is_popular && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                Popular
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{cabinet.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{cabinet.category}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-700">
                <Ruler className="h-4 w-4 mr-1" />
                <span className="text-xs">{cabinet.dimensions}</span>
              </div>
              <div className="flex items-center font-medium text-gray-900">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>{cabinet.base_price.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {cabinet.materials.slice(0, 3).map((material: string, index: number) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {material}
                  </span>
                ))}
                {cabinet.materials.length > 3 && (
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    +{cabinet.materials.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CabinetGrid;