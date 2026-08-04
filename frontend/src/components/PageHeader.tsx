import type { FC, ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: ReactNode;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  actionDisabled?: boolean;
  action?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  children,
  actionLabel,
  actionIcon,
  onAction,
  actionDisabled,
  action,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      mb: 4,
      gap: 2,
      flexWrap: 'wrap',
    }}
  >
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {title}
      </Typography>
      {(subtitle || description) && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle || description}
        </Typography>
      )}
    </Box>
    {children || action}
    {!(children || action) && actionLabel && onAction && (
      <Button
        variant="contained"
        startIcon={actionIcon ?? <AddIcon />}
        onClick={onAction}
        disabled={actionDisabled}
        sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);
