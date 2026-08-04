import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Grid, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { PageHeader } from '../components/PageHeader';
import { WidgetEditor } from '../features/dashboard/builder/WidgetEditor';
import { WidgetRenderer } from '../features/dashboard/widgets';
import type { WidgetConfig } from '../features/dashboard/types';

export const WidgetsPreviewPage: React.FC = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('preview_widgets');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('preview_widgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleSaveWidget = (config: WidgetConfig) => {
    setWidgets((prev) => [...prev, config]);
    setEditorOpen(false);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id));
  };

  return (
    <Box>
      <PageHeader
        title="Widget Library Preview"
        subtitle="Sprint 10.1: Previewing autonomous widgets before grid layout integration."
        actionLabel="Add Widget"
        onAction={() => setEditorOpen(true)}
      />

      {widgets.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed grey', borderRadius: 2 }}>
          <Typography color="text.secondary">No widgets added yet. Click "Add Widget" to create one.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {widgets.map((widget) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={widget.id}>
              <Card sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{widget.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {widget.type.toUpperCase()} • {widget.sensorCode}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDeleteWidget(widget.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
                  <WidgetRenderer config={widget} />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <WidgetEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveWidget}
      />
    </Box>
  );
};
