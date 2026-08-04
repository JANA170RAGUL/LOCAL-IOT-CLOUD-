import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, Box, Typography, TextField, Grid } from '@mui/material';
import { Button } from '@/components/Button';
import { FileText, Table, FileSpreadsheet } from 'lucide-react';
import { reportsApi, ReportFilter } from '@/features/reports/api/reports';
import { useSnackbar } from 'notistack';

import { useLicenseStatus } from '@/features/settings/api/license';
import { Alert } from '@mui/material';

export const Reports = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReportFilter>({});

  const { data: licenseStatus } = useLicenseStatus();
  const isLicensed = licenseStatus?.status === 'ACTIVE' && licenseStatus?.features?.reports;

  const handleGenerate = async (reportType: string, format: string) => {
    setIsGenerating(`${reportType}-${format}`);
    try {
      await reportsApi.exportReport({
        report_type: reportType,
        format: format,
        filters: filters
      });
      enqueueSnackbar(`${reportType} report generated successfully`, { variant: 'success' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`Failed to generate ${reportType} report`, { variant: 'error' });
    } finally {
      setIsGenerating(null);
    }
  };

  const reportSections = [
    { title: 'Telemetry Report', type: 'telemetry', description: 'Export sensor telemetry data including averages, mins, and maxes.' },
    { title: 'Device Report', type: 'devices', description: 'Export device inventory, firmware status, and health.' },
    { title: 'Alert Report', type: 'alerts', description: 'Export critical and warning alerts along with resolution times.' },
    { title: 'Rule Report', type: 'rules', description: 'Export automation rules and trigger statistics.' },
    { title: 'Gateway Report', type: 'gateways', description: 'Export gateway status and uptime metrics.' },
    { title: 'Dashboard Snapshot', type: 'dashboard', description: 'Export an executive summary of current platform KPIs.' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader 
        title="Reports Engine" 
        description="Generate professional PDF, Excel, and CSV reports."
      />

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Filters</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Apply filters before generating your report. (Future sprints will connect these to active dropdowns)
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField 
              fullWidth
              size="small"
              placeholder="Organization ID" 
              onChange={(e) => setFilters({...filters, organization_id: e.target.value})}
              disabled={!isLicensed}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField 
              type="date" 
              fullWidth
              size="small"
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              disabled={!isLicensed}
            />
          </Grid>
        </Grid>
      </Card>

      {!isLicensed && (
        <Alert severity="warning">
          The Reports Engine is a premium feature. Please upgrade your license to unlock advanced PDF, Excel, and CSV report generation.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {reportSections.map((section) => (
          <Card key={section.type} sx={{ p: 3, opacity: isLicensed ? 1 : 0.6 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
              <Box sx={{ mb: { xs: 2, md: 0 } }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{section.title}</Typography>
                <Typography variant="body2" color="text.secondary">{section.description}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button 
                  onClick={() => handleGenerate(section.type, 'pdf')}
                  disabled={isGenerating !== null || !isLicensed}
                  variant="outlined"
                  startIcon={<FileText size={16} />}
                >
                  Generate PDF
                </Button>
                <Button 
                  onClick={() => handleGenerate(section.type, 'excel')}
                  disabled={isGenerating !== null || !isLicensed}
                  variant="outlined"
                  color="success"
                  startIcon={<FileSpreadsheet size={16} />}
                >
                  Generate Excel
                </Button>
                <Button 
                  onClick={() => handleGenerate(section.type, 'csv')}
                  disabled={isGenerating !== null || !isLicensed}
                  variant="outlined"
                  startIcon={<Table size={16} />}
                >
                  Generate CSV
                </Button>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Reports;
