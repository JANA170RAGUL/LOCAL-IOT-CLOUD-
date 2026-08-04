import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Box, Button, TextField, Typography, Alert, InputAdornment, 
  CircularProgress, Checkbox, FormControlLabel, Link,
  useTheme, useMediaQuery, GlobalStyles, Divider, IconButton
} from '@mui/material';
import { 
  Email, Lock, Cloud, Sensors, Storage, ViewQuilt, Security, Sync,
  ShowChart, Timeline, Speed, Public, Memory, SettingsInputAntenna,
  Google, GitHub, Microsoft
} from '@mui/icons-material';
import { login, getMe } from '../features/auth/api/auth';
import { useAuthStore } from '../features/auth/store/useAuthStore';

const globalStyles = (
  <GlobalStyles
    styles={{
      '@keyframes meshAnimation': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      '@keyframes float': {
        '0%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-15px)' },
        '100%': { transform: 'translateY(0px)' },
      },
      '@keyframes pulseData': {
        '0%': { opacity: 0.3 },
        '50%': { opacity: 1 },
        '100%': { opacity: 0.3 },
      },
      '.mesh-bg': {
        background: 'linear-gradient(120deg, #38BDF8, #8B5CF6, #EC4899, #FDBA74)',
        backgroundSize: '300% 300%',
        animation: 'meshAnimation 18s ease infinite',
      },
      '.glass-panel': {
        backdropFilter: 'blur(30px)',
        background: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
        borderRadius: '28px',
      },
      '.glass-card': {
        backdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
      },
      '.glass-input .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        color: '#1e293b',
        fontWeight: 500,
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: '1px' },
        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
        '&.Mui-focused fieldset': { borderColor: '#8B5CF6', borderWidth: '2px' },
        '&.Mui-focused': {
           backgroundColor: 'rgba(255, 255, 255, 0.4)',
           boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.2)'
        }
      },
      '.glass-input input::placeholder': { color: 'rgba(0,0,0,0.4)', opacity: 1 },
      '.glass-input .MuiSvgIcon-root': { color: 'rgba(0, 0, 0, 0.5)' }
    }}
  />
);

const MockDashboard = () => (
  <Box sx={{ 
    flex: 1, 
    ml: 4, 
    display: { xs: 'none', lg: 'flex' }, 
    flexDirection: 'column', 
    gap: 2,
    p: 3,
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography sx={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>System Overview</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: '20px', background: 'rgba(255,255,255,0.15)' }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'pulseData 2s infinite' }} />
        <Typography sx={{ fontSize: '0.8rem', color: 'white', fontWeight: 500 }}>All Systems Online</Typography>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box className="glass-card" sx={{ flex: 1, p: 2 }}>
        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', mb: 1 }}>Connected Devices</Typography>
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: 'white' }}>128</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#4ADE80' }}>+12 this week</Typography>
      </Box>
      <Box className="glass-card" sx={{ flex: 1, p: 2 }}>
        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', mb: 1 }}>Data Points</Typography>
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: 'white' }}>8.45K</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#4ADE80' }}>+15.2%</Typography>
      </Box>
    </Box>

    <Box className="glass-card" sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', mb: 2 }}>Sensor Analytics</Typography>
      {/* Mock Chart Area */}
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 1, height: '100px' }}>
        {[40, 60, 30, 80, 50, 90, 70, 45, 85, 60, 95].map((h, i) => (
          <Box key={i} sx={{ flex: 1, height: `${h}%`, background: 'rgba(255,255,255,0.3)', borderRadius: '4px', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
          </Box>
        ))}
        {/* Mock line SVG */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <path d="M 0,60 Q 20,40 40,70 T 80,20 T 120,50 T 160,10 T 200,30 T 240,55 T 280,15 T 320,40 T 360,5" fill="none" stroke="#F472B6" strokeWidth="2" />
        </svg>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', gap: 2 }}>
      <Box className="glass-card" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Public sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 40 }} />
        <Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Global Nodes</Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Active</Typography>
        </Box>
      </Box>
      <Box className="glass-card" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Speed sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 40 }} />
        <Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Avg Latency</Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>12ms</Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await login({ email, password });
      useAuthStore.setState({ token: access_token });
      const user = await getMe();
      setAuth(access_token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const features = [
    { title: 'Real-Time Monitoring', subtitle: 'Live data from your IoT devices.', icon: <Sensors /> },
    { title: 'Local Cloud Computing', subtitle: 'Run your cloud locally offline.', icon: <Storage /> },
    { title: 'Multi-Tenant Architecture', subtitle: 'Isolated workspaces & teams.', icon: <ViewQuilt /> },
    { title: 'Secure Authentication', subtitle: 'Enterprise-grade security.', icon: <Security /> },
    { title: 'Offline Data Sync', subtitle: 'Store locally, sync when back.', icon: <Sync /> }
  ];

  return (
    <Box className="mesh-bg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 }, fontFamily: "'Inter', 'Poppins', sans-serif", position: 'relative', overflow: 'hidden' }}>
      {globalStyles}
      
      {/* Ambient Floating Orbs */}
      <Box sx={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: '#F472B6', filter: 'blur(100px)', opacity: 0.6, animation: 'float 8s ease-in-out infinite alternate', borderRadius: '50%' }} />
      <Box sx={{ position: 'absolute', bottom: '15%', right: '15%', width: '400px', height: '400px', background: '#38BDF8', filter: 'blur(120px)', opacity: 0.6, animation: 'float 12s ease-in-out infinite alternate-reverse', borderRadius: '50%' }} />
      <Box sx={{ position: 'absolute', top: '40%', left: '50%', width: '250px', height: '250px', background: '#8B5CF6', filter: 'blur(90px)', opacity: 0.5, animation: 'float 10s ease-in-out infinite alternate', borderRadius: '50%' }} />

      {/* Grid Overlay for Texture */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, white 20%, transparent 80%)'
      }} />

      <Box sx={{ display: 'flex', width: '100%', maxWidth: '1400px', zIndex: 10, gap: { lg: 6, xl: 8 } }}>
        
        {/* =========================================================================
            LEFT SIDE: Brand, Features & Dashboard Preview
            ========================================================================= */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', pt: 2 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Cloud sx={{ fontSize: '56px', color: 'white', filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.5))' }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
              Local IoT Cloud
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', mb: 6, fontWeight: 500, letterSpacing: '0.5px' }}>
            Smart • Secure • Offline • Real-Time
          </Typography>

          <Box sx={{ display: 'flex', flex: 1 }}>
            {/* Feature Cards Stack */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '320px' }}>
              {features.map((feature, idx) => (
                <Box key={idx} className="glass-card" sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2, '&:hover': { transform: 'translateX(8px)' } }}>
                  <Box sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                    color: 'white', border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {React.cloneElement(feature.icon as React.ReactElement, { fontSize: 'small' })}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                      {feature.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      {feature.subtitle}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Mock Dashboard Preview Element */}
            <MockDashboard />
          </Box>
        </Box>

        {/* =========================================================================
            RIGHT SIDE: Premium Glass Login Card
            ========================================================================= */}
        <Box sx={{ flex: isMobile ? '1' : '0 0 480px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box className="glass-panel" sx={{ width: '100%', maxWidth: '480px', p: { xs: 4, sm: 6 }, position: 'relative' }}>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ 
                width: 72, height: 72, borderRadius: '50%', 
                background: 'linear-gradient(135deg, #38BDF8 0%, #EC4899 100%)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 8px 24px rgba(236,72,153,0.4)', border: '2px solid rgba(255,255,255,0.8)'
              }}>
                <Cloud sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </Box>

            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1, textAlign: 'center', letterSpacing: '-0.5px' }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5, textAlign: 'center' }}>
              Sign in to access your dashboard
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#991b1b', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '12px' }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: 'white', mb: 1, fontSize: '0.95rem', fontWeight: 600 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  className="glass-input"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="name@company.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: 'white', mb: 1, fontSize: '0.95rem', fontWeight: 600 }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  className="glass-input"
                  variant="outlined"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <FormControlLabel 
                  control={<Checkbox size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: 'white' } }} />} 
                  label={<Typography sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>Remember Me</Typography>} 
                />
                <Link href="#" underline="hover" sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </Box>

              <Button 
                fullWidth 
                type="submit" 
                disabled={loading}
                sx={{ 
                  py: 2,
                  borderRadius: '16px',
                  background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
                  backgroundSize: '200% auto',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '1px',
                  boxShadow: '0 10px 25px rgba(139,92,246,0.4)',
                  transition: 'all 0.4s ease',
                  '&:hover': {
                    backgroundPosition: 'right center',
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow: '0 15px 35px rgba(139,92,246,0.6)',
                  },
                  '&:disabled': {
                    background: 'rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.5)',
                    boxShadow: 'none'
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={22} sx={{ color: 'white' }} />
                    <span>Connecting...</span>
                  </Box>
                ) : (
                  'SIGN IN →'
                )}
              </Button>

              <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>or continue with</Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                <IconButton sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { background: 'rgba(255,255,255,0.4)', transform: 'translateY(-2px)' }, transition: 'all 0.2s', width: 48, height: 48, borderRadius: '12px' }}>
                  <Google />
                </IconButton>
                <IconButton sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { background: 'rgba(255,255,255,0.4)', transform: 'translateY(-2px)' }, transition: 'all 0.2s', width: 48, height: 48, borderRadius: '12px' }}>
                  <Microsoft />
                </IconButton>
                <IconButton sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { background: 'rgba(255,255,255,0.4)', transform: 'translateY(-2px)' }, transition: 'all 0.2s', width: 48, height: 48, borderRadius: '12px' }}>
                  <GitHub />
                </IconButton>
              </Box>

            </form>
          </Box>
          <Box sx={{ position: 'absolute', bottom: 20, textAlign: 'center', width: '100%' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500 }}>
              Version 1.0<br/>
              © 2026 Local IoT Cloud Platform
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
