import React from 'react';
import { Box, Card, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
// @ts-ignore
import { Responsive as ResponsiveOriginal, useContainerWidth } from 'react-grid-layout';
const Responsive = ResponsiveOriginal as any;

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { WidgetRenderer } from '../widgets';
import type { BackendWidget } from '../api/widget';
import type { WidgetConfig, WidgetType } from '../types';



export interface DashboardCanvasProps {
  widgets: BackendWidget[];
  isEditing: boolean;
  onLayoutChange: (layout: GridLayout[]) => void;
  onEditWidget: (widget: BackendWidget) => void;
  onDeleteWidget: (widgetId: string) => void;
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  widgets,
  isEditing,
  onLayoutChange,
  onEditWidget,
  onDeleteWidget,
}) => {
  const { width: containerWidth, containerRef } = useContainerWidth() as any;

  // Convert backend widgets to react-grid-layout format
  const layout: GridLayout[] = widgets.map((w) => ({
    i: w.id,
    x: w.position_x,
    y: w.position_y,
    w: w.width,
    h: w.height,
  }));

  // Convert backend widgets to frontend WidgetConfig format for WidgetRenderer
  const mapToConfig = (w: BackendWidget): WidgetConfig => ({
    id: w.id,
    title: w.title || w.name,
    type: w.widget_type as WidgetType,
    deviceId: w.query_config?.deviceId || '',
    sensorCode: w.query_config?.sensorCode || '',
    timeRange: w.query_config?.timeRange || '1h',
    refresh: w.display_config?.refresh || 'live',
    color: w.display_config?.color,
    aggregation: w.query_config?.aggregation,
  });

  return (
    <Box ref={containerRef} sx={{ minHeight: 'calc(100vh - 200px)', bgcolor: 'background.default', borderRadius: 1 }}>
      {widgets.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography color="text.secondary">
            No widgets on this dashboard. Click "Add Widget" to begin.
          </Typography>
        </Box>
      ) : (
        <Responsive
          width={containerWidth || 1200}
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange as any}
          isDraggable={isEditing}
          isResizable={isEditing}
          margin={[16, 16]}
        >
          {widgets.map((w) => (
            <Card
              key={w.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isEditing ? 3 : 1,
                border: isEditing ? '1px dashed' : '1px solid',
                borderColor: isEditing ? 'primary.main' : 'divider',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}
            >
              <Box
                className="widget-drag-handle"
                sx={{
                  p: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: isEditing ? 'grab' : 'default',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 1 }}>
                  {w.title || w.name}
                </Typography>
                
                {isEditing && (
                  <Box>
                    <IconButton size="small" onClick={() => onEditWidget(w)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDeleteWidget(w.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Box sx={{ flexGrow: 1, p: 2, position: 'relative' }}>
                <WidgetRenderer config={mapToConfig(w)} />
              </Box>
            </Card>
          ))}
        </Responsive>
      )}
    </Box>
  );
};
