import React from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { useAuthStore as useStoreAuth } from '../features/auth/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../features/notifications/api/notifications';
import { formatDistanceToNow } from 'date-fns';
import { alpha, useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';
import type { ThemeType } from '../store/themeStore';

export const Header: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useThemeStore();
  const { user, logout } = useStoreAuth();
  
  const [themeAnchorEl, setThemeAnchorEl] = React.useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenThemeMenu = (event: React.MouseEvent<HTMLElement>) => {
    setThemeAnchorEl(event.currentTarget);
  };

  const handleCloseThemeMenu = () => {
    setThemeAnchorEl(null);
  };

  const handleSelectTheme = (mode: ThemeType) => {
    setThemeMode(mode);
    handleCloseThemeMenu();
  };

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'history'],
    queryFn: () => notificationApi.getHistory(0, 5)
  });
  
  const unreadCount = notifData?.total || 0; // Simplified for now since API doesn't distinguish unread

  return (
    <AppBar
      position="sticky"
      sx={{
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
        {/* Left Side: Search Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.text.primary, 0.05),
            borderRadius: '8px',
            px: 2,
            py: 0.5,
            width: 300,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search resources, alerts..."
            sx={{ fontSize: '0.9rem', width: '100%', color: 'inherit' }}
          />
        </Box>

        {/* Right Side: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Theme Palette Toggle */}
          <Tooltip title="Switch Theme Palette">
            <IconButton onClick={handleOpenThemeMenu} color="inherit">
              <PaletteIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={themeAnchorEl}
            open={Boolean(themeAnchorEl)}
            onClose={handleCloseThemeMenu}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem
              selected={themeMode === 'light'}
              onClick={() => handleSelectTheme('light')}
            >
              Light Mode
            </MenuItem>
            <MenuItem
              selected={themeMode === 'dark'}
              onClick={() => handleSelectTheme('dark')}
            >
              Dark Mode
            </MenuItem>
            <MenuItem
              selected={themeMode === 'enterprise-blue'}
              onClick={() => handleSelectTheme('enterprise-blue')}
            >
              Enterprise Blue
            </MenuItem>
          </Menu>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={() => setNotifAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { width: 350, maxHeight: 400 } } }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Notifications</Typography>
            </Box>
            {notifData?.items?.length ? (
              notifData.items.map((notif) => (
                <MenuItem key={notif.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5, borderBottom: 1, borderColor: 'divider' }} onClick={() => setNotifAnchorEl(null)}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{notif.subject}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal', mt: 0.5 }}>
                    {notif.body}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ mt: 1 }}>
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </Typography>
                </MenuItem>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No new notifications</Typography>
              </Box>
            )}
          </Menu>

          {/* Profile */}
          <Box 
            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
            sx={{ display: 'flex', alignItems: 'center', ml: 1, gap: 1.5, cursor: 'pointer', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Avatar
              alt={user?.first_name || 'User'}
              sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main, color: '#ffffff' }}
            >
              {user ? `${user.first_name[0]}${user.last_name[0]}` : 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {user ? `${user.first_name} ${user.last_name}` : 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                {user?.role || 'Guest'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={() => setProfileAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { setProfileAnchorEl(null); navigate('/profile'); }}>
              My Profile
            </MenuItem>
            <MenuItem onClick={() => { setProfileAnchorEl(null); logout(); navigate('/login'); }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
