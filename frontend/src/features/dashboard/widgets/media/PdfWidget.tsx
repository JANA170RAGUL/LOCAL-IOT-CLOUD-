import React from 'react';
import { Box, Typography } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const PdfWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // In a real app, config would store the PDF URL
  const pdfUrl = (config as any).pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <PictureAsPdfIcon sx={{ mr: 1, color: 'error.main' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }} noWrap>
          {config.title || 'PDF Viewer'}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, backgroundColor: '#525659' }}>
        <object 
          data={pdfUrl} 
          type="application/pdf" 
          width="100%" 
          height="100%"
        >
          <iframe 
            src={pdfUrl} 
            width="100%" 
            height="100%" 
            title="PDF Fallback"
            style={{ border: 'none' }}
          >
            <Typography sx={{ p: 2, color: 'white' }}>
              This browser does not support PDFs. Please download the PDF to view it.
            </Typography>
          </iframe>
        </object>
      </Box>
    </Box>
  );
};

export const PdfWidgetManifest: WidgetManifest = {
  type: 'pdf',
  name: 'PDF Viewer',
  category: 'Media',
  description: 'Embeds a PDF document (e.g. manuals, SOPs).',
  icon: PictureAsPdfIcon,
  component: PdfWidget,
  defaultWidth: 4,
  defaultHeight: 5,
  configurable: true,
  defaultConfig: {
    type: 'pdf',
    timeRange: '15m',
    refresh: 'live'
  }
};
