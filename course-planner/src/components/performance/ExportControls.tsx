// src/components/performance/ExportControls.tsx

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { PerformanceExporter, type ExportOptions } from '@/lib/performance/exportSystem';

interface ExportControlsProps {
  data: any;
  onExport?: () => void;
}

export function ExportControls({ data, onExport }: ExportControlsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'html'>('json');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const options: ExportOptions = {
        format: exportFormat,
        timeRange: {
          start: Date.now() - 24 * 60 * 60 * 1000, // 마지막 24시간
          end: Date.now()
        }
      };

      const content = await PerformanceExporter.exportData(data, options);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `performance-report-${timestamp}`;
      
      let type: string;
      switch (exportFormat) {
        case 'csv':
          type = 'text/csv';
          PerformanceExporter.downloadFile(content, `${filename}.csv`, type);
          break;
        case 'json':
          type = 'application/json';
          PerformanceExporter.downloadFile(content, `${filename}.json`, type);
          break;
        case 'html':
          type = 'text/html';
          PerformanceExporter.downloadFile(content, `${filename}.html`, type);
          break;
      }

      onExport?.();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-500" />
          Export Performance Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setExportFormat('json')}
              className={`flex items-center justify-center p-3 rounded-lg border ${
                exportFormat === 'json' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FileJson className="h-5 w-5 mr-2" />
              JSON
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex items-center justify-center p-3 rounded-lg border ${
                exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              CSV
            </button>
            <button
              onClick={() => setExportFormat('html')}
              className={`flex items-center justify-center p-3 rounded-lg border ${
                exportFormat === 'html'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              HTML
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}