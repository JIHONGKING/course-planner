// src/lib/performance/exportSystem.ts

export interface ExportOptions {
    format: 'csv' | 'json' | 'html';
    timeRange?: {
      start: number;
      end: number;
    };
    categories?: string[];
  }
  
  export class PerformanceExporter {
    static async exportData(data: any, options: ExportOptions): Promise<string> {
      switch (options.format) {
        case 'csv':
          return this.exportToCSV(data, options);
        case 'json':
          return this.exportToJSON(data, options);
        case 'html':
          return this.exportToHTML(data, options);
        default:
          throw new Error('Unsupported export format');
      }
    }
  
    private static async exportToCSV(data: any, options: ExportOptions): Promise<string> {
      const rows = [['Timestamp', 'Operation', 'Duration', 'Category']];
      
      // 성능 메트릭 데이터 변환
      Object.entries(data.operations).forEach(([category, operationData]: [string, any]) => {
        operationData.trend.forEach((item: any) => {
          rows.push([
            new Date(item.timestamp).toISOString(),
            category,
            item.duration.toString(),
            category
          ]);
        });
      });
  
      // CSV 형식으로 변환
      return rows.map(row => row.join(',')).join('\n');
    }
  
    private static async exportToJSON(data: any, options: ExportOptions): Promise<string> {
      return JSON.stringify(data, null, 2);
    }
  
    private static async exportToHTML(data: any, options: ExportOptions): Promise<string> {
      const template = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Performance Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
            </style>
          </head>
          <body>
            <h1>Performance Report</h1>
            <h2>Generated on: ${new Date().toLocaleString()}</h2>
            <table>
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Average Duration</th>
                  <th>Max Duration</th>
                  <th>Total Operations</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(data.operations)
                  .map(([category, stats]: [string, any]) => `
                    <tr>
                      <td>${category}</td>
                      <td>${stats.stats.averageDuration.toFixed(2)}ms</td>
                      <td>${stats.stats.maxDuration}ms</td>
                      <td>${stats.stats.count}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
  
      return template;
    }
  
    static downloadFile(content: string, filename: string, type: string) {
      const blob = new Blob([content], { type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }