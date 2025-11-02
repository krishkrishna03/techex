import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface ExportButtonProps {
  data: any;
  filename: string;
  title?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, filename, title = "Export Data" }) => {
  const [exporting, setExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Convert data to CSV format
      const csvContent = convertToCSV(data);
      downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV');
    } finally {
      setExporting(false);
      setShowOptions(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Create PDF content
      const pdfContent = await convertToPDF(data, title);
      downloadFile(pdfContent, `${filename}.pdf`, 'application/pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
      setShowOptions(false);
    }
  };

  const convertToCSV = (data: any) => {
    if (!data || typeof data !== 'object') return '';
    
    const rows = [];
    
    // Add overview data
    if (data.overview) {
      rows.push(['Metric', 'Value']);
      Object.entries(data.overview).forEach(([key, value]) => {
        rows.push([key.replace(/([A-Z])/g, ' $1').trim(), value]);
      });
      rows.push(['']); // Empty row
    }
    
    // Add platform growth data
    if (data.platformGrowth) {
      rows.push(['Platform Growth (Last 30 Days)', '']);
      Object.entries(data.platformGrowth).forEach(([key, value]) => {
        rows.push([key.replace(/([A-Z])/g, ' $1').trim(), value]);
      });
      rows.push(['']); // Empty row
    }
    
    // Add recent activity
    if (data.recentActivity && Array.isArray(data.recentActivity)) {
      rows.push(['Recent Activity', '', '', '']);
      rows.push(['Type', 'Description', 'Details', 'Time']);
      data.recentActivity.forEach((activity: any) => {
        rows.push([
          activity.type,
          activity.description,
          activity.details,
          activity.timeAgo
        ]);
      });
    }
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const convertToPDF = async (data: any, title: string) => {
    // Simple PDF generation using HTML to PDF conversion
    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            .metric { display: flex; justify-content: space-between; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          ${data.overview ? `
            <h2>Overview Statistics</h2>
            ${Object.entries(data.overview).map(([key, value]) => 
              `<div class="metric"><span>${key.replace(/([A-Z])/g, ' $1').trim()}:</span><span>${value}</span></div>`
            ).join('')}
          ` : ''}
          
          ${data.platformGrowth ? `
            <h2>Platform Growth (Last 30 Days)</h2>
            ${Object.entries(data.platformGrowth).map(([key, value]) => 
              `<div class="metric"><span>${key.replace(/([A-Z])/g, ' $1').trim()}:</span><span>${value}</span></div>`
            ).join('')}
          ` : ''}
          
          ${data.recentActivity ? `
            <h2>Recent Activity</h2>
            <table>
              <tr><th>Type</th><th>Description</th><th>Details</th><th>Time</th></tr>
              ${data.recentActivity.map((activity: any) => 
                `<tr>
                  <td>${activity.type}</td>
                  <td>${activity.description}</td>
                  <td>${activity.details}</td>
                  <td>${activity.timeAgo}</td>
                </tr>`
              ).join('')}
            </table>
          ` : ''}
        </body>
      </html>
    `;
    
    return htmlContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={exporting}
        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
      >
        {exporting ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Download size={16} />
        )}
        Export
      </button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-2">
              <button
                onClick={exportToCSV}
                disabled={exporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <FileSpreadsheet size={16} />
                Export as CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <FileText size={16} />
                Export as PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;