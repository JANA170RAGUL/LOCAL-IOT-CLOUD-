import type { FC } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardHome } from '../pages/DashboardHome';
import { OrganizationList } from '../pages/OrganizationList';
import { OrganizationDetails } from '../pages/OrganizationDetails';
import { TenantList } from '../pages/TenantList';
import { TenantDetails } from '../pages/TenantDetails';
import { ProjectList } from '../pages/ProjectList';
import { ProjectDetails } from '../pages/ProjectDetails';
import { GatewayList } from '../pages/GatewayList';
import { GatewayDetails } from '../pages/GatewayDetails';
import { DeviceList } from '../pages/DeviceList';
import { DeviceDetails } from '../pages/DeviceDetails';
import { SensorList } from '../pages/SensorList';
import { SensorDetails } from '../pages/SensorDetails';
import { TelemetryHistory } from '../pages/TelemetryHistory';
import { WidgetsPreviewPage } from '../pages/WidgetsPreviewPage';
import { DashboardBuilder } from '../pages/DashboardBuilder';
import { AlertCenter } from '../pages/AlertCenter';
import { RuleBuilder } from '../pages/RuleBuilder';
import { Users } from '../pages/users/Users';
import { CreateUser } from '../pages/users/CreateUser';
import { EditUser } from '../pages/users/EditUser';
import { UserDetails } from '../pages/users/UserDetails';
import { Profile } from '../pages/profile/Profile';
import { Analytics } from '../pages/analytics/Analytics';
import { Reports } from '../pages/reports/Reports';
import { ChannelList } from '../features/channels/components/ChannelList';
import { ChannelForm } from '../features/channels/components/ChannelForm';
import { ChannelDetails } from '../features/channels/components/ChannelDetails';
import { Box, Typography } from '@mui/material';

const PlaceholderPage: FC<{ title: string }> = ({ title }) => (
  <Box>
    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      This module is under construction. Future sprints will implement full business CRUD services.
    </Typography>
  </Box>
);

import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import SettingsLayout from '../pages/settings/SettingsLayout';
import { PublicChannelView } from '../pages/public/PublicChannelView';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/public/channel/:id',
    element: <PublicChannelView />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <DashboardHome />,
      },
      {
        path: '/organizations',
        element: <OrganizationList />,
      },
      {
        path: '/organizations/:id',
        element: <OrganizationDetails />,
      },
      {
        path: '/tenants',
        element: <TenantList />,
      },
      {
        path: '/tenants/:id',
        element: <TenantDetails />,
      },
      {
        path: '/projects',
        element: <ProjectList />,
      },
      {
        path: '/projects/:id',
        element: <ProjectDetails />,
      },
      {
        path: '/channels',
        element: <ChannelList />,
      },
      {
        path: '/channels/new',
        element: <ChannelForm />,
      },
      {
        path: '/channels/:id',
        element: <ChannelDetails />,
      },
      {
        path: '/gateways',
        element: <GatewayList />,
      },
      {
        path: '/gateways/:id',
        element: <GatewayDetails />,
      },
      {
        path: '/devices',
        element: <DeviceList />,
      },
      {
        path: '/devices/:id',
        element: <DeviceDetails />,
      },
      {
        path: '/sensors',
        element: <SensorList />,
      },
      {
        path: '/sensors/:id',
        element: <SensorDetails />,
      },
      {
        path: '/dashboards',
        element: <DashboardBuilder />,
      },
      {
        path: '/widgets',
        element: <WidgetsPreviewPage />,
      },
      {
        path: '/telemetry',
        element: <TelemetryHistory />,
      },
      {
        path: '/alerts',
        element: <AlertCenter />,
      },
      {
        path: '/rules',
        element: <RuleBuilder />,
      },
      {
        path: '/users',
        element: <Users />,
      },
      {
        path: '/users/create',
        element: <CreateUser />,
      },
      {
        path: '/users/:id/edit',
        element: <EditUser />,
      },
      {
        path: '/users/:id',
        element: <UserDetails />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/settings',
        element: <SettingsLayout />,
      },
      {
        path: '/analytics',
        element: <Analytics />,
      },
      {
        path: '/reports',
        element: <Reports />,
      },
      {
        path: '/help',
        element: <PlaceholderPage title="Help & Support" />,
      },
      {
        path: '/roles',
        element: <PlaceholderPage title="Roles Management" />,
      },
      {
        path: '/audit',
        element: <PlaceholderPage title="Audit Logs" />,
      },
      {
        path: '/ai/models',
        element: <PlaceholderPage title="AI Models" />,
      },
      {
        path: '/ai/assistant',
        element: <PlaceholderPage title="AI Assistant" />,
      },
      {
        path: '/ai/vision',
        element: <PlaceholderPage title="Computer Vision" />,
      },
    ],
  },
]);
