import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

interface ExportButtonProps {
  data: any;
  filename: string;
  title?: string;
  // Optional: name of the array property on `data` to export (e.g. 'recentActivity' or 'recentLogins').
  // If provided and present on `data`, that array will be exported. If omitted, component
  // will try a small set of sensible defaults before falling back to the previous heuristics.
  exportArrayKey?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, filename, title = "Export Data", exportArrayKey }) => {
  const [exporting, setExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Determine rows to send to server explicitly so server CSV logic is deterministic.
      let rowsToExport: any = data;

      // If caller provided an explicit array, use it
      if (Array.isArray(data)) {
        rowsToExport = data;
      } else if (exportArrayKey && data && Array.isArray(data[exportArrayKey])) {
        rowsToExport = data[exportArrayKey];
      } else if (data && Array.isArray(data.recentActivity)) {
        // Prefer recentActivity (this is what's shown in the RecentActivity component)
        rowsToExport = data.recentActivity;
      } else if (data && Array.isArray(data.recentLogins)) {
        // Some dashboard views show recentLogins in a table (stats tab)
        rowsToExport = data.recentLogins;
      } else if (data && typeof data === 'object') {
        // Fallback: pick the first array property if any
        const firstArray = Object.values(data).find((v: any) => Array.isArray(v));
        if (firstArray) rowsToExport = firstArray;
      }

      // Request server to stream CSV matching current filters/pagination
      const token = localStorage.getItem('token');
      fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ format: 'csv', filename, data: rowsToExport })
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Export failed');
        }
        return res.blob();
      }).then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }).catch((error) => {
        console.error('CSV export error:', error);
        alert('Failed to export CSV');
      });
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