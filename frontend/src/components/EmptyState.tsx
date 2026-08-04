import type { FC, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title = 'No records found',
  subtitle = 'Create one to get started.',
  icon,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 1.5,
      color: 'text.secondary',
    }}
  >
    {icon ?? <InboxIcon sx={{ fontSize: 56, opacity: 0.35 }} />}
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
      {title}
    </Typography>
    <Typography variant="body2">{subtitle}</Typography>
  </Box>
);
