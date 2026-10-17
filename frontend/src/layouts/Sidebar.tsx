import React, { useState } from 'react';
import { NavLink } from 'react-router';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, GlobalStyles, Collapse
} from '@mui/material';
import {
  Home, Sensors, Insights, NotificationsActive, Assessment,
  Business, CorporateFare, Folder, Hub, Router,
  Memory, SmartToy, Visibility, Group, Security, ReceiptLong,
  Settings, Person, Help, ExitToApp,
  Cloud, ExpandMore, ExpandLess, Circle, Notifications,
  DeveloperBoard, Widgets, Tune, Psychology
} from '@mui/icons-material';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useNavigate } from 'react-router';

const DRAWER_WIDTH = 320;

const sidebarGlobalStyles = (
  <GlobalStyles
    styles={{
      '@keyframes pulseGlow': {
        '0%': { opacity: 0.4, transform: 'scale(1)' },
        '50%': { opacity: 0.9, transform: 'scale(1.05)' },
        '100%': { opacity: 0.4, transform: 'scale(1)' },
      },
      '.glass-sidebar': {
        background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%) !important',
        backdropFilter: 'blur(24px) saturate(180%) !important',
        WebkitBackdropFilter: 'blur(24px) saturate(180%) !important',
        borderRight: '1px solid rgba(255, 255, 255, 0.15) !important',
        position: 'relative',
        overflow: 'hidden',
        color: '#ffffff !important',
      },
      '.glass-nav-item': {
        borderRadius: '14px !important',
        margin: '4px 14px !important',
        minHeight: '46px !important',
        padding: '8px 14px !important',
        background: 'rgba(255, 255, 255, 0.06) !important',
        backdropFilter: 'blur(12px) !important',
        border: '1px solid rgba(255, 255, 255, 0.1) !important',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important',
        color: '#ffffff !important',
      },
      '.glass-nav-item:hover': {
        background: 'rgba(255, 255, 255, 0.14) !important',
        transform: 'translateX(4px) !important',
        border: '1px solid rgba(255, 255, 255, 0.25) !important',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3) !important',
        color: '#ffffff !important',
      },
      '.glass-nav-item.active': {
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.65) 0%, rgba(59, 130, 246, 0.45) 100%) !important',
        color: '#ffffff !important',
        border: '1px solid rgba(147, 197, 253, 0.6) !important',
        boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.5) !important',
      },
      '.glass-nav-icon': {
        color: '#93c5fd !important',
        minWidth: '36px',
        transition: 'all 0.25s ease',
      },
      '.glass-nav-item:hover .glass-nav-icon': {
        color: '#60a5fa !important',
        transform: 'scale(1.1)',
      },
      '.glass-nav-item.active .glass-nav-icon': {
        color: '#ffffff !important',
        filter: 'drop-shadow(0 0 8px rgba(147, 197, 253, 0.8))',
      },
      '.glass-divider': {
        borderColor: 'rgba(255, 255, 255, 0.18) !important',
        margin: '12px 18px !important',
      },
      '.sidebar-scroll-area': {
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: 'rgba(0, 0, 0, 0.1)' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px' },
        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255, 255, 255, 0.35)' },
      },
    }}
  />
);

interface NavItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    monitoring: true,
    infrastructure: true,
    aiServices: false,
    administration: false,
  });

  const handleToggle = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'monitoring',
      title: 'Monitoring & Visualization',
      items: [
        { text: 'Dashboard', path: '/', icon: <Home /> },
        { text: 'Widgets', path: '/widgets', icon: <Widgets /> },
        { text: 'Telemetry', path: '/telemetry', icon: <Sensors /> },
        { text: 'Analytics', path: '/analytics', icon: <Insights /> },
        { text: 'Alerts', path: '/alerts', icon: <NotificationsActive /> },
        { text: 'Rule Builder', path: '/rules', icon: <Tune /> },
        { text: 'Reports', path: '/reports', icon: <Assessment /> },
      ],
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure & Devices',
      items: [
        { text: 'Organizations', path: '/organizations', icon: <Business /> },
        { text: 'Tenants', path: '/tenants', icon: <CorporateFare /> },
        { text: 'Projects', path: '/projects', icon: <Folder /> },
        { text: 'Channels', path: '/channels', icon: <Hub /> },
        { text: 'Gateways', path: '/gateways', icon: <Router /> },
        { text: 'Devices', path: '/devices', icon: <DeveloperBoard /> },
        { text: 'Sensors', path: '/sensors', icon: <Sensors /> },
      ],
    },
    {
      id: 'aiServices',
      title: 'AI Services',
      items: [
        { text: 'AI Decision Engine', path: '/ai-engine', icon: <Psychology /> },
        { text: 'Models', path: '/ai/models', icon: <Memory /> },
        { text: 'AI Assistant', path: '/ai/assistant', icon: <SmartToy /> },
        { text: 'Vision', path: '/ai/vision', icon: <Visibility /> },
      ],
    },
    {
      id: 'administration',
      title: 'Administration',
      items: [
        { text: 'Users', path: '/users', icon: <Group /> },
        { text: 'Roles', path: '/roles', icon: <Security /> },
        { text: 'Audit Logs', path: '/audit', icon: <ReceiptLong /> },
      ],
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          backgroundColor: '#0f172a !important',
          color: '#ffffff !important',
        },
      }}
    >
      {sidebarGlobalStyles}

      <Box className="glass-sidebar" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Ambient Glowing Blobs for Glass Depth */}
        <Box
          sx={{
            position: 'absolute',
            top: '-5%',
            left: '-15%',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0) 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '-15%',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0) 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        {/* Content Wrapper */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Top Fixed Area: Header & Cloud Widget */}
          <Box sx={{ flexShrink: 0, p: 3, pb: 1.5 }}>
            
            {/* Branding Logo Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.2) 100%)',
                  backdropFilter: 'blur(12px)',
                  p: 1.25,
                  borderRadius: '16px',
                  border: '1px solid rgba(147, 197, 253, 0.4)',
                  boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cloud sx={{ color: '#ffffff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
                  Local IoT Cloud
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.8px', textTransform: 'uppercase', mt: 0.5 }}>
                  {user?.role || 'Super Admin'}
                </Typography>
              </Box>
            </Box>

            {/* IoT Status Glass Widget */}
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.2,
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>Cloud</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Circle sx={{ color: '#4ade80', fontSize: 8, filter: 'drop-shadow(0 0 6px #4ade80)' }} />
                  <Typography sx={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700 }}>Connected</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>MQTT Broker</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Circle sx={{ color: '#4ade80', fontSize: 8, filter: 'drop-shadow(0 0 6px #4ade80)' }} />
                  <Typography sx={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700 }}>Online</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>Active Devices</Typography>
                <Typography sx={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 800 }}>1,256</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500 }}>AI Engine</Typography>
                <Typography sx={{ color: '#fdba74', fontSize: '0.85rem', fontWeight: 800 }}>Running</Typography>
              </Box>
            </Box>
          </Box>

          {/* High-Contrast Glass Divider Bar */}
          <Divider className="glass-divider" />

          {/* Scrollable Navigation List */}
          <Box className="sidebar-scroll-area" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 0.5 }}>
            <List disablePadding>
              {navGroups.map((group, groupIdx) => (
                <React.Fragment key={group.id}>
                  {groupIdx > 0 && <Divider className="glass-divider" />}
                  
                  {/* Category Header */}
                  <ListItemButton
                    onClick={() => handleToggle(group.id)}
                    sx={{
                      px: 3,
                      py: 1.2,
                      '&:hover': { background: 'rgba(255, 255, 255, 0.05)' },
                      borderRadius: '10px',
                      mx: 1,
                    }}
                    disableRipple
                  >
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#94a3b8 !important',
                            textTransform: 'uppercase',
                            letterSpacing: '1.2px',
                            display: 'block',
                          }}
                        >
                          {group.title}
                        </Typography>
                      }
                    />
                    {openGroups[group.id] ? (
                      <ExpandLess sx={{ color: '#94a3b8', fontSize: 18 }} />
                    ) : (
                      <ExpandMore sx={{ color: '#94a3b8', fontSize: 18 }} />
                    )}
                  </ListItemButton>

                  <Collapse in={openGroups[group.id]} timeout={200} unmountOnExit>
                    <List component="div" disablePadding sx={{ pb: 1 }}>
                      {group.items.map((item) => (
                        <ListItem key={item.text} disablePadding>
                          <ListItemButton
                            component={NavLink}
                            to={item.path}
                            className="glass-nav-item"
                          >
                            <ListItemIcon className="glass-nav-icon">
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{
                                    fontSize: '0.925rem',
                                    fontWeight: 600,
                                    color: '#ffffff !important',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {item.text}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          </Box>

          {/* High-Contrast Bottom Divider */}
          <Divider className="glass-divider" />

          {/* Fixed Footer: Quick Settings & Logout */}
          <Box
            sx={{
              flexShrink: 0,
              p: 2,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/settings" className="glass-nav-item" sx={{ minHeight: '40px', py: 0.8 }}>
                  <ListItemIcon className="glass-nav-icon"><Settings sx={{ fontSize: 20 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff !important' }}>Settings</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/profile" className="glass-nav-item" sx={{ minHeight: '40px', py: 0.8 }}>
                  <ListItemIcon className="glass-nav-icon"><Person sx={{ fontSize: 20 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff !important' }}>Profile</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  className="glass-nav-item"
                  sx={{
                    minHeight: '42px',
                    py: 0.8,
                    mt: 1,
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%) !important',
                    border: '1px solid rgba(252, 165, 165, 0.4) !important',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.35) !important',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 1) 100%) !important',
                      transform: 'translateY(-1px) !important',
                    },
                  }}
                  onClick={() => {
                    useAuthStore.getState().logout();
                    navigate('/login');
                  }}
                >
                  <ListItemIcon className="glass-nav-icon" sx={{ color: '#ffffff !important' }}><ExitToApp sx={{ fontSize: 20 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff !important' }}>Logout</Typography>} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

        </Box>
      </Box>
    </Drawer>
  );
};
