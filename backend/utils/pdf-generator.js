import PDFDocument from 'pdfkit';

export const generatePDF = async (items, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Get options
      const title = options.title || 'Inventory Report';
      const columns = options.columns || [
        'name', 'sku', 'category', 'quantity', 'unit_price', 'total_value', 'location'
      ];

      // Map column IDs to display names
      const columnLabels = {
        name: 'Name',
        sku: 'SKU',
        description: 'Description',
        category: 'Category',
        subcategory: 'Subcategory',
        unit: 'Unit',
        location: 'Location',
        supplier: 'Supplier',
        quantity: 'Qty',
        min_quantity: 'Min Qty',
        max_quantity: 'Max Qty',
        unit_price: 'Unit Price',
        total_value: 'Total Value'
      };

      // Header
      doc.fontSize(20).text(title, { align: 'center' });
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Summary
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const lowStockItems = items.filter(item => item.quantity <= item.min_quantity).length;

      doc.fontSize(14).text('Summary:', { underline: true });
      doc.fontSize(12)
         .text(`Total Items: ${totalItems}`)
         .text(`Total Value: $${totalValue.toFixed(2)}`)
         .text(`Low Stock Items: ${lowStockItems}`)
         .moveDown();

      // Table header
      const tableTop = doc.y;
      const itemHeight = 20;
      
      // Calculate column positions based on selected columns
      const columnPositions = {};
      const pageWidth = doc.page.width - 100; // 50px margin on each side
      const columnWidth = pageWidth / columns.length;
      
      columns.forEach((col, index) => {
        columnPositions[col] = 50 + (index * columnWidth);
      });
      
      // Draw header
      doc.fontSize(10).font('Helvetica-Bold');
      columns.forEach(col => {
        doc.text(columnLabels[col] || col, columnPositions[col], tableTop);
      });

      // Draw header line
      doc.moveTo(50, tableTop + 15)
         .lineTo(doc.page.width - 50, tableTop + 15)
         .stroke();

      // Table rows
      doc.font('Helvetica');
      let currentY = tableTop + 25;

      items.forEach((item, index) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
          
          // Redraw header on new page
          doc.fontSize(10).font('Helvetica-Bold');
          columns.forEach(col => {
            doc.text(columnLabels[col] || col, columnPositions[col], currentY);
          });
          
          doc.moveTo(50, currentY + 15)
             .lineTo(doc.page.width - 50, currentY + 15)
             .stroke();
             
          currentY += 25;
          doc.font('Helvetica');
        }

        // Draw each column value
        columns.forEach(col => {
          let value = '';
          
          switch(col) {
            case 'name':
              value = item.name?.substring(0, 15) || '';
              break;
            case 'sku':
              value = item.sku || '';
              break;
            case 'description':
              value = item.description?.substring(0, 20) || '';
              break;
            case 'category':
              value = item.category_name?.substring(0, 10) || '';
              break;
            case 'subcategory':
              value = item.subcategory_name?.substring(0, 10) || '';
              break;
            case 'unit':
              value = item.unit_name || '';
              break;
            case 'location':
              value = item.location_name?.substring(0, 12) || '';
              break;
            case 'supplier':
              value = item.supplier_name?.substring(0, 12) || '';
              break;
            case 'quantity':
              value = item.quantity?.toString() || '0';
              break;
            case 'min_quantity':
              value = item.min_quantity?.toString() || '0';
              break;
            case 'max_quantity':
              value = item.max_quantity?.toString() || '0';
              break;
            case 'unit_price':
              value = `$${(item.unit_price || 0).toFixed(2)}`;
              break;
            case 'total_value':
              value = `$${(item.total_value || 0).toFixed(2)}`;
              break;
            default:
              value = item[col]?.toString() || '';
          }
          
          doc.text(value, columnPositions[col], currentY);
        });

        currentY += itemHeight;

        // Add line every 5 rows
        if ((index + 1) % 5 === 0) {
          doc.moveTo(50, currentY - 5)
             .lineTo(doc.page.width - 50, currentY - 5)
             .stroke();
        }
      });

      // Footer
      doc.fontSize(8)
         .text(`Report generated by WMS - Page ${doc.bufferedPageRange().count}`, 
                50, doc.page.height - 50, { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};