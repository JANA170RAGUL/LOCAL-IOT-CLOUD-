import type { TelemetryPoint } from '../types';

/**
 * Converts an array of TelemetryPoints into a CSV blob and triggers a browser download.
 */
export const exportTelemetryToCSV = (
  data: (TelemetryPoint | any)[], 
  filename = 'telemetry_export.csv',
  fallbackSensorCode?: string,
  fallbackSensorType?: string
) => {
  if (!data || data.length === 0) return;

  const headers = ['Timestamp', 'Sensor Code', 'Sensor Type', 'Value', 'Raw Value'];
  
  const csvRows = [headers.join(',')];

  data.forEach((point) => {
    const rawCode = point.sensor_code ?? point.sensorCode ?? point.sensor ?? point.code ?? fallbackSensorCode;
    const rawType = point.sensor_type ?? point.sensorType ?? point.type ?? fallbackSensorType;

    const sensorCode = (rawCode !== undefined && rawCode !== null && String(rawCode) !== 'undefined' && String(rawCode) !== 'null')
      ? String(rawCode)
      : (fallbackSensorCode || 'UNKNOWN');

    const sensorType = (rawType !== undefined && rawType !== null && String(rawType) !== 'undefined' && String(rawType) !== 'null')
      ? String(rawType)
      : (fallbackSensorType || 'sensor');

    const value = point.value !== undefined && point.value !== null ? point.value : '';
    const rawValue = point.raw_value !== undefined && point.raw_value !== null ? point.raw_value : value;

    let timestampStr = '';
    if (point.timestamp) {
      try {
        timestampStr = new Date(point.timestamp).toISOString();
      } catch (e) {
        timestampStr = String(point.timestamp);
      }
    } else {
      timestampStr = new Date().toISOString();
    }

    const row = [
      timestampStr,
      `"${sensorCode}"`,
      `"${sensorType}"`,
      value,
      rawValue
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
