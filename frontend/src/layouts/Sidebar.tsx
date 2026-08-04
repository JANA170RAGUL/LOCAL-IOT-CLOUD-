import React, { useState } from 'react';
import { NavLink } from 'react-router';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, GlobalStyles, Collapse, Tooltip
} from '@mui/material';
import {
  Home, Sensors, Insights, NotificationsActive, Assessment,
  Business, CorporateFare, Folder, Hub, Router,
  Memory, SmartToy, Visibility, Group, Security, ReceiptLong,
  Settings, Person, DarkMode, Help, ExitToApp,
  Cloud, ExpandMore, ExpandLess, Circle, Notifications
} from '@mui/icons-material';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useNavigate } from 'react-router';

const DRAWER_WIDTH = 320;

const sidebarGlobalStyles = (
  <GlobalStyles
    styles={{
      '@keyframes sidebarMesh': {
        '0%': { backgroundPosition: '0% 0%' },
        '50%': { backgroundPosition: '100% 100%' },
        '100%': { backgroundPosition: '0% 0%' },
      },
      '@keyframes pulseData': {
        '0%': { opacity: 0.4 },
        '50%': { opacity: 1 },
        '100%': { opacity: 0.4 },
      },
      '.sidebar-bg': {
        background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        backgroundSize: '300% 300%',
        animation: 'sidebarMesh 20s ease infinite',
        position: 'relative',
        overflow: 'hidden',
      },
      '.nav-item': {
        borderRadius: '12px',
        margin: '4px 16px',
        minHeight: '52px',
        padding: '8px 16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid transparent',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        color: 'rgba(255, 255, 255, 0.95)',
      },
      '.nav-item:hover': {
        background: 'rgba(255, 255, 255, 0.1)',
        transform: 'translateX(4px)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      '.nav-item.active': {
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: 'inset 4px 0 0 0 #ffffff, 0 6px 16px rgba(0,0,0,0.15)',
      },
      '.nav-icon': {
        color: 'inherit',
        minWidth: '40px',
        transition: 'all 0.25s ease',
      },
      '.nav-item.active .nav-icon': {
        color: '#ffffff',
        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
      },
      '.glass-divider': {
        margin: '12px 20px',
        borderColor: 'rgba(255, 255, 255, 0.15)',
      },
      '.sidebar-scroll': {
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '5px' },
        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.3)' }
      }
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
    administration: false
  });

  const handleToggle = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'monitoring',
      title: 'Monitoring',
      items: [
        { text: 'Dashboard', path: '/', icon: <Home /> },
        { text: 'Telemetry', path: '/telemetry', icon: <Sensors /> },
        { text: 'Analytics', path: '/analytics', icon: <Insights /> },
        { text: 'Alerts', path: '/alerts', icon: <NotificationsActive /> },
        { text: 'Reports', path: '/reports', icon: <Assessment /> },
      ]
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure',
      items: [
        { text: 'Organizations', path: '/organizations', icon: <Business /> },
        { text: 'Tenants', path: '/tenants', icon: <CorporateFare /> },
        { text: 'Projects', path: '/projects', icon: <Folder /> },
        { text: 'Channels', path: '/channels', icon: <Hub /> },
        { text: 'Gateways', path: '/gateways', icon: <Router /> },
      ]
    },
    {
      id: 'aiServices',
      title: 'AI Services',
      items: [
        { text: 'Models', path: '/ai/models', icon: <Memory /> },
        { text: 'AI Assistant', path: '/ai/assistant', icon: <SmartToy /> },
        { text: 'Vision', path: '/ai/vision', icon: <Visibility /> },
      ]
    },
    {
      id: 'administration',
      title: 'Administration',
      items: [
        { text: 'Users', path: '/users', icon: <Group /> },
        { text: 'Roles', path: '/roles', icon: <Security /> },
        { text: 'Audit Logs', path: '/audit', icon: <ReceiptLong /> },
      ]
    }
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
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 30px rgba(0,0,0,0.3)',
        },
      }}
    >
      {sidebarGlobalStyles}
      
      <Box className="sidebar-bg" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Subtle Background Blobs */}
        <Box sx={{ position: 'absolute', top: '5%', left: '-10%', width: '200px', height: '200px', background: '#ffffff', filter: 'blur(100px)', opacity: 0.15 }} />
        <Box sx={{ position: 'absolute', bottom: '10%', right: '-10%', width: '200px', height: '200px', background: '#ffcc00', filter: 'blur(100px)', opacity: 0.2 }} />

        {/* Content Wrapper */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Top Fixed Area: Branding & Status */}
          <Box sx={{ flexShrink: 0 }}>
            {/* Logo Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, pt: 4, pb: 3 }}>
              <Box sx={{ 
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                p: 1.5, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <Cloud sx={{ color: '#ffffff', fontSize: 32 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  Local IoT Cloud
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.5px', textTransform: 'uppercase', mt: 0.5 }}>
                  Super Admin
                </Typography>
              </Box>
            </Box>

            {/* Enlarged IoT Status Widget */}
            <Box sx={{ px: 3, mb: 2 }}>
              <Box sx={{ 
                background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)',
                borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)',
                p: 2, display: 'flex', flexDirection: 'column', gap: 1.2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 500 }}>Cloud</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Circle sx={{ color: '#4ADE80', fontSize: 10, filter: 'drop-shadow(0 0 4px #4ADE80)', animation: 'pulseData 2s infinite' }} />
                    <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>Connected</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 500 }}>MQTT</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Circle sx={{ color: '#4ADE80', fontSize: 10, filter: 'drop-shadow(0 0 4px #4ADE80)' }} />
                    <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>Online</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 500 }}>Devices</Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>1,256</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 500 }}>AI Engine</Typography>
                  <Typography sx={{ color: '#FDBA74', fontSize: '0.9rem', fontWeight: 700 }}>Running</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 3, mb: 1 }} />

          {/* Scrollable Navigation Area */}
          <Box className="sidebar-scroll" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <List disablePadding>
              {navGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <ListItemButton 
                    onClick={() => handleToggle(group.id)}
                    sx={{ px: 3, py: 1.5, '&:hover': { background: 'transparent' } }}
                    disableRipple
                  >
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {group.title}
                        </Typography>
                      }
                    />
                    {openGroups[group.id] ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />}
                  </ListItemButton>
                  
                  <Collapse in={openGroups[group.id]} timeout={250} unmountOnExit>
                    <List component="div" disablePadding sx={{ pb: 1.5 }}>
                      {group.items.map((item) => (
                        <ListItem key={item.text} disablePadding>
                          <ListItemButton component={NavLink} to={item.path} className="nav-item">
                            <ListItemIcon className="nav-icon">
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontFamily: "'Inter', 'Poppins', sans-serif", color: 'inherit' }}>
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

          {/* Fixed Bottom Footer */}
          <Box sx={{ 
            flexShrink: 0,
            p: 2, 
            background: 'rgba(255,255,255,0.08)', 
            backdropFilter: 'blur(15px)',
            borderTop: '1px solid rgba(255,255,255,0.15)' 
          }}>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/settings" className="nav-item" sx={{ minHeight: '44px', padding: '6px 16px' }}>
                  <ListItemIcon className="nav-icon"><Settings sx={{ fontSize: 22 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'inherit' }}>Settings</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/profile" className="nav-item" sx={{ minHeight: '44px', padding: '6px 16px' }}>
                  <ListItemIcon className="nav-icon"><Person sx={{ fontSize: 22 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'inherit' }}>Profile</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/alerts" className="nav-item" sx={{ minHeight: '44px', padding: '6px 16px' }}>
                  <ListItemIcon className="nav-icon"><Notifications sx={{ fontSize: 22 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'inherit' }}>Notifications</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/help" className="nav-item" sx={{ minHeight: '44px', padding: '6px 16px' }}>
                  <ListItemIcon className="nav-icon"><Help sx={{ fontSize: 22 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: 'inherit' }}>Help</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  className="nav-item" 
                  sx={{ 
                    minHeight: '44px', padding: '6px 16px', mt: 1,
                    color: '#ffffff', background: 'rgba(255, 59, 48, 0.8)',
                    boxShadow: '0 4px 12px rgba(255,59,48,0.3)',
                    '&:hover': { background: 'rgba(255, 59, 48, 1)', color: '#ffffff', transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(255,59,48,0.4)' } 
                  }}
                  onClick={() => {
                    useAuthStore.getState().logout();
                    navigate('/login');
                  }}
                >
                  <ListItemIcon className="nav-icon" sx={{ color: 'inherit' }}><ExitToApp sx={{ fontSize: 22 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'inherit' }}>Logout</Typography>} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

        </Box>
      </Box>
    </Drawer>
  );
};
