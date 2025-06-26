import React from 'react';
import { DollarSign, Ruler, Package, ChevronRight } from 'lucide-react';

interface CabinetListProps {
  cabinets: any[];
  onCabinetClick: (cabinet: any) => void;
}

const CabinetList: React.FC<CabinetListProps> = ({ cabinets, onCabinetClick }) => {
  return (
    <div className="space-y-4">
      {cabinets.map((cabinet) => (
        <div 
          key={cabinet.id} 
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex"
          onClick={() => onCabinetClick(cabinet)}
        >
          <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gray-100 flex-shrink-0">
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
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{cabinet.name}</h3>
                {cabinet.is_popular && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Popular
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{cabinet.category}</p>
              <p className="text-sm text-gray-700 mb-3">{cabinet.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {cabinet.materials.map((material: string, index: number) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {material}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-700">
                <Ruler className="h-4 w-4 mr-1" />
                <span className="text-xs">{cabinet.dimensions}</span>
              </div>
              <div className="flex items-center">
                <div className="font-medium text-gray-900 mr-4">
                  <DollarSign className="h-4 w-4 text-green-600 inline" />
                  <span>{cabinet.base_price.toFixed(2)}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CabinetList;