import apiClient from '@/services/api/axios';

export interface ReportFilter {
    organization_id?: string;
    tenant_id?: string;
    project_id?: string;
    gateway_id?: string;
    device_id?: string;
    sensor_id?: string;
    start_date?: string;
    end_date?: string;
}

export interface ReportRequest {
    report_type: string;
    format?: string;
    filters?: ReportFilter;
}

export const reportsApi = {
    exportReport: async (request: ReportRequest): Promise<void> => {
        const response = await apiClient.post(`/reports/export/${request.format}`, request, {
            responseType: 'blob'
        });
        
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const extension = request.format === 'excel' ? 'xlsx' : request.format;
        a.download = `${request.report_type}_report.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
};
