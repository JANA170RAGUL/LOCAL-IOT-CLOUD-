import React, { useState } from 'react';
import { Card, Box, Typography, Tabs, Tab, Stack } from '@mui/material';
import GeneralSettingsForm from './components/GeneralSettingsForm';
import MQTTConfigForm from './components/MQTTConfigForm';
import EmailConfigForm from './components/EmailConfigForm';
import AuditLogTable from './components/AuditLogTable';
import HealthDashboard from './components/HealthDashboard';
import LicenseDashboard from './components/LicenseDashboard';
import {
  CogIcon,
  ServerIcon,
  MailIcon,
  ShieldCheckIcon,
  HeartIcon,
  ColorSwatchIcon,
  KeyIcon,
  DatabaseIcon
} from '@heroicons/react/outline';

const tabs = [
  { id: 'general', name: 'General', icon: CogIcon },
  { id: 'mqtt', name: 'MQTT', icon: ServerIcon },
  { id: 'email', name: 'Email', icon: MailIcon },
  { id: 'branding', name: 'Branding', icon: ColorSwatchIcon },
  { id: 'license', name: 'License', icon: KeyIcon },
  { id: 'backup', name: 'Backup', icon: DatabaseIcon },
  { id: 'audit', name: 'Audit Logs', icon: ShieldCheckIcon },
  { id: 'health', name: 'System Health', icon: HeartIcon },
];

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState('general');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsForm />;
      case 'mqtt':
        return <MQTTConfigForm />;
      case 'email':
        return <EmailConfigForm />;
      case 'audit':
        return <AuditLogTable />;
      case 'health':
        return <HealthDashboard />;
      case 'license':
        return <LicenseDashboard />;
      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>This settings module is under construction.</Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Platform Administration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage global platform settings and configurations.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        <Box sx={{ width: { xs: '100%', lg: 256 }, flexShrink: 0 }}>
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={activeTab}
            onChange={handleChange}
            sx={{
              borderRight: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: 'left',
                minHeight: 48,
                px: 2,
                textTransform: 'none',
                fontWeight: 'medium',
              }
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Icon style={{ width: 20, height: 20 }} />
                      {tab.name}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Card sx={{ height: '100%', minHeight: 500, p: 3 }}>
            {renderContent()}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
