import { useState, useEffect } from 'react';
import { Column } from '../components/Common/ColumnCustomizer';
import { columnPreferenceService } from '../services/columnPreferenceService';

export const useColumnPreferences = (
  pageId: string,
  defaultColumns: Column[]
) => {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const savedColumns = await columnPreferenceService.getColumnPreferences(pageId);
        
        if (savedColumns && savedColumns.length > 0) {
          // Merge saved preferences with default columns to handle any new columns added
          const mergedColumns = defaultColumns.map(defaultCol => {
            const savedCol = savedColumns.find((col: Column) => col.id === defaultCol.id);
            return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
          });
          
          setColumns(mergedColumns);
        }
      } catch (error) {
        console.error('Error loading column preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [pageId, defaultColumns]);

  const handleSaveColumnPreferences = async (updatedColumns: Column[]) => {
    try {
      await columnPreferenceService.saveColumnPreferences(pageId, updatedColumns);
      setColumns(updatedColumns);
    } catch (error) {
      console.error('Error saving column preferences:', error);
    }
  };

  // Get visible columns sorted by order
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  return {
    columns,
    visibleColumns,
    showColumnCustomizer,
    setShowColumnCustomizer,
    handleSaveColumnPreferences,
    loading
  };
};