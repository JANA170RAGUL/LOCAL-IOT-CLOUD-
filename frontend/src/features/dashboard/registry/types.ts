import React from 'react';
import type { WidgetConfig } from '../types';
import type { SvgIconComponent } from '@mui/icons-material';

export type WidgetCategory = 
  | 'Charts'
  | 'Gauges'
  | 'Industrial'
  | 'Media'
  | 'Maps'
  | 'KPI'
  | 'AI'
  | 'Utility';

export interface WidgetManifest {
  /** Unique string identifying the widget (e.g. 'line', 'tank_level') */
  type: string;
  
  /** Human readable name for the widget editor */
  name: string;
  
  /** Category grouping in the marketplace / editor */
  category: WidgetCategory;
  
  /** Optional secondary grouping */
  subcategory?: string;
  
  /** Brief description of what the widget does */
  description: string;
  
  /** MUI Icon to represent the widget */
  icon: SvgIconComponent;
  
  /** The React component responsible for rendering the widget in the dashboard */
  component: React.ComponentType<{ config: WidgetConfig }>;
  
  /** (Optional) A custom configuration panel component to show in the editor */
  configComponent?: React.ComponentType<{ config: WidgetConfig; onChange: (config: WidgetConfig) => void }>;
  
  /** Default settings when instantiating this widget for the first time */
  defaultConfig: Partial<WidgetConfig>;

  /** List of telemetry types this widget supports (e.g., ['temperature', 'humidity']) */
  supportedTelemetry?: string[];

  /** Recommended default width for the dashboard grid */
  defaultWidth?: number;

  /** Recommended default height for the dashboard grid */
  defaultHeight?: number;

  /** Indicates if this widget has a configurable settings panel */
  configurable?: boolean;

  /** Indicates if clicking this widget requires a confirmation dialog (SCADA Controls) */
  requiresConfirmation?: boolean;

  /** MQTT or Command Topic to send the instruction to */
  commandTopic?: string;

  /** List of valid command strings this widget can dispatch (e.g. ['ON', 'OFF']) */
  supportedCommands?: string[];

  /** If true, the widget will wait in "Sending" state until the backend confirms execution */
  requiresResponse?: boolean;

  /** Identifies if this widget issues commands to devices */
  supportsCommands?: boolean;

  /** Indicates if this widget supports real-time live data */
  supportsRealtime?: boolean;

  /** Indicates if this widget supports querying historical time ranges */
  supportsHistory?: boolean;

  /** Minimum supported width in grid columns */
  minWidth?: number;

  /** Minimum supported height in grid rows */
  minHeight?: number;

  /** Indicates if this widget renders well on small mobile screens */
  supportsMobile?: boolean;
}
