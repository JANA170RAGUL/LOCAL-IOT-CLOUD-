import React, { useState } from 'react';
import { Box, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';


import { PageHeader } from '../components/PageHeader';
import { HierarchySelector } from '../components/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector';
import { DashboardCanvas } from '../features/dashboard/builder/DashboardCanvas';
import type { GridLayout } from '../features/dashboard/builder/DashboardCanvas';
import { WidgetEditor } from '../features/dashboard/builder/WidgetEditor';

import { useDashboardsQuery, useCreateDashboardMutation } from '../features/dashboard/hooks/useDashboard';
import {
  useWidgetsQuery,
  useCreateWidgetMutation,
  useUpdateWidgetMutation,
  useDeleteWidgetMutation
} from '../features/dashboard/hooks/useWidgets';
import { createWidget } from '../features/dashboard/api/widget';
import type { BackendWidget, WidgetCreatePayload, WidgetUpdatePayload } from '../features/dashboard/api/widget';
import type { WidgetConfig } from '../features/dashboard/types';

export const DashboardBuilder: React.FC = () => {
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<BackendWidget | null>(null);

  const [editorError, setEditorError] = useState<string | null>(null);

  // Queries
  const { data: dashboards, isLoading: isDashboardsLoading } = useDashboardsQuery(selection.projectId || '');
  const { data: widgets = [], isLoading: isWidgetsLoading } = useWidgetsQuery(selectedDashboardId);

  // Mutations
  const createDashboardMutation = useCreateDashboardMutation(selection.projectId || '');
  const createMutation = useCreateWidgetMutation(selectedDashboardId);
  const updateMutation = useUpdateWidgetMutation(selectedDashboardId);
  const deleteMutation = useDeleteWidgetMutation(selectedDashboardId);

  const handleCreateDashboard = () => {
    if (!selection.projectId) return;
    const newCode = `dash_${Date.now()}`;
    createDashboardMutation.mutate(
      { code: newCode, name: 'New Dashboard' },
      {
        onSuccess: (data) => {
          setSelectedDashboardId(data.id);
          setIsEditing(true);
        }
      }
    );
  };

  // Handle auto-selecting the first dashboard if available
  React.useEffect(() => {
    if (dashboards && dashboards.length > 0 && !selectedDashboardId) {
      setSelectedDashboardId(dashboards[0].id);
    } else if (!dashboards || dashboards.length === 0) {
      setSelectedDashboardId('');
    }
  }, [dashboards, selectedDashboardId]);

  const handleLayoutChange = (newLayout: GridLayout[]) => {
    if (!isEditing || !selectedDashboardId) return;

    // Only patch widgets that changed position
    newLayout.forEach((l) => {
      const w = widgets.find(widget => widget.id === l.i);
      if (w && (w.position_x !== l.x || w.position_y !== l.y || w.width !== l.w || w.height !== l.h)) {
        updateMutation.mutate({
          widgetId: w.id,
          payload: {
            position_x: l.x,
            position_y: l.y,
            width: l.w,
            height: l.h,
          }
        });
      }
    });
  };

  const handleSaveWidget = (config: WidgetConfig) => {
    setEditorError(null);

    // Map Frontend WidgetConfig to Backend Payload
    const payload: WidgetCreatePayload | WidgetUpdatePayload = {
      code: `wgt_${Date.now()}`,
      name: config.title,
      title: config.title,
      widget_type: config.type,
      data_source: 'telemetry',
      query_config: {
        deviceId: config.deviceId,
        sensorCode: config.sensorCode,
        timeRange: config.timeRange,
        aggregation: config.aggregation || 'mean',
      },
      display_config: {
        color: config.color,
        refresh: config.refresh,
      },
      position_x: editingWidget ? editingWidget.position_x : 0,
      position_y: editingWidget ? editingWidget.position_y : 9999, // Append to bottom
      width: editingWidget ? editingWidget.width : 4,
      height: editingWidget ? editingWidget.height : 3,
    };

    if (!selectedDashboardId && !editingWidget) {
      if (!selection.projectId) {
        setEditorError('Please select Organization -> Tenant -> Project first.');
        return;
      }
      // Auto-create a dashboard if none exists
      const newCode = `dash_${Date.now()}`;
      createDashboardMutation.mutate(
        { code: newCode, name: 'Default Dashboard' },
        {
          onSuccess: (newDash) => {
            setSelectedDashboardId(newDash.id);
            createWidget(newDash.id, payload as WidgetCreatePayload)
              .then(() => {
                setEditorOpen(false);
                setEditingWidget(null);
                setEditorError(null);
              })
              .catch((err: any) => {
                setEditorError(err.response?.data?.detail || err.message || 'Failed to save widget');
              });
          },
          onError: (err: any) => {
            setEditorError(err.response?.data?.detail || err.message || 'Failed to create dashboard');
          }
        }
      );
      return;
    }

    const options = {
      onSuccess: () => {
        setEditorOpen(false);
        setEditingWidget(null);
        setEditorError(null);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.detail || err.message || 'Failed to save widget';
        setEditorError(msg);
      }
    };

    if (editingWidget) {
      updateMutation.mutate({ widgetId: editingWidget.id, payload: payload as WidgetUpdatePayload }, options);
    } else {
      createMutation.mutate(payload as WidgetCreatePayload, options);
    }
  };

  const handleEditWidget = (widget: BackendWidget) => {
    setEditingWidget(widget);
    setEditorOpen(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    deleteMutation.mutate(widgetId);
  };

  const mapToConfig = (w: BackendWidget | null): Partial<WidgetConfig> | undefined => {
    if (!w) return undefined;
    return {
      id: w.id,
      title: w.title || w.name,
      type: w.widget_type as any,
      deviceId: w.query_config?.deviceId || '',
      sensorCode: w.query_config?.sensorCode || '',
      timeRange: w.query_config?.timeRange || '1h',
      refresh: w.display_config?.refresh || 'live',
      color: w.display_config?.color,
      aggregation: w.query_config?.aggregation,
    };
  };

  return (
    <Box>
      <PageHeader
        title="Dashboard Builder"
        subtitle="Dynamically construct real-time dashboards."
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateDashboard}
              disabled={!selection.projectId || createDashboardMutation.isPending}
            >
              New Dashboard
            </Button>
            <Button
              variant={isEditing ? 'contained' : 'outlined'}
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={() => setIsEditing(!isEditing)}
              disabled={!selectedDashboardId}
            >
              {isEditing ? 'Finish Editing' : 'Edit Layout'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => { setEditingWidget(null); setEditorOpen(true); }}
              disabled={!selection.projectId}
            >
              Add Widget
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 3 }}>
        <HierarchySelector selection={selection} onChange={setSelection} maxDepth="project" variant="dropdown" />
      </Box>

      {selection.projectId && isDashboardsLoading && <CircularProgress size={24} />}

      {selection.projectId && dashboards && dashboards.length > 1 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Select Dashboard:
          </Typography>
          <select
            value={selectedDashboardId}
            onChange={(e) => setSelectedDashboardId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </Box>
      )}
      
      {selection.projectId && dashboards?.length === 0 && (
        <Alert 
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={handleCreateDashboard} disabled={createDashboardMutation.isPending}>
              Create Dashboard
            </Button>
          }
        >
          No dashboards found in this project. Click &quot;Add Widget&quot; or &quot;Create Dashboard&quot; to auto-generate one!
        </Alert>
      )}

      {selectedDashboardId && (
        <Box sx={{ mt: 2 }}>
          {isWidgetsLoading ? (
            <CircularProgress />
          ) : (
            <DashboardCanvas
              widgets={widgets}
              isEditing={isEditing}
              onLayoutChange={handleLayoutChange}
              onEditWidget={handleEditWidget}
              onDeleteWidget={handleDeleteWidget}
            />
          )}
        </Box>
      )}

      {/* Widget Editor Dialog */}
      <WidgetEditor
        open={editorOpen}
        initialValues={mapToConfig(editingWidget)}
        onClose={() => { setEditorOpen(false); setEditingWidget(null); setEditorError(null); }}
        onSave={handleSaveWidget}
        error={editorError}
      />
    </Box>
  );
};
