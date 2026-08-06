import React from 'react';
import { Outlet } from 'react-router';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIEngineFloatingButton } from '../components/AIEngineFloatingButton';

export const AppLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Permanent Navigation Drawer */}
      <Sidebar />

      {/* Main Viewport Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <Header />

        {/* Dynamic Scrollable Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            overflowY: 'auto',
            bgcolor: 'background.default',
            transition: 'background-color 0.3s ease',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Global Futuristic Floating AI Engine Button */}
      <AIEngineFloatingButton />
    </Box>
  );
};
