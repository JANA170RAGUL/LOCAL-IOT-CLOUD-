import type { TelemetryPoint } from '../types';

/**
 * Converts an array of TelemetryPoints into a CSV blob and triggers a browser download.
 */
export const exportTelemetryToCSV = (data: TelemetryPoint[], filename = 'telemetry_export.csv') => {
  if (!data || data.length === 0) return;

  const headers = ['Timestamp', 'Sensor Code', 'Sensor Type', 'Value', 'Raw Value'];
  
  const csvRows = [headers.join(',')];

  data.forEach((point) => {
    const row = [
      new Date(point.timestamp).toISOString(),
      `"${point.sensor_code}"`,
      `"${point.sensor_type}"`,
      point.value,
      point.raw_value
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Trigger download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
