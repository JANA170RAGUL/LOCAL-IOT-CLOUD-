import React from 'react';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
import { OperatorDashboard } from './dashboards/OperatorDashboard';
import { ViewerDashboard } from './dashboards/ViewerDashboard';
import { DeveloperDashboard } from './dashboards/DeveloperDashboard';

export const DashboardHome: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || 'Viewer';

  switch (userRole) {
    case 'Super Admin':
    case 'Admin':
    case 'Org Admin':
      // Admin-level users see the global platform overview
      return <SuperAdminDashboard />;
      
    case 'Operator':
      // Operators see active devices, alerts, and telemetry
      return <OperatorDashboard />;
      
    case 'Developer':
      // Developers see infrastructure health and backend metrics
      return <DeveloperDashboard />;
      
    case 'Viewer':
    default:
      // Viewers see read-only operational state
      return <ViewerDashboard />;
  }
};
