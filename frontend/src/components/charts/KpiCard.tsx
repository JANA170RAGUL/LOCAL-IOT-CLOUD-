import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import { ArrowUpward, ArrowDownward, Remove } from '@mui/icons-material';

export interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit = '',
  delta,
  deltaLabel = 'vs previous',
}) => {
  const theme = useTheme();

  let deltaColor = theme.palette.text.secondary;
  let DeltaIcon = Remove;

  if (delta !== undefined) {
    if (delta > 0) {
      deltaColor = theme.palette.success.main;
      DeltaIcon = ArrowUpward;
    } else if (delta < 0) {
      deltaColor = theme.palette.error.main;
      DeltaIcon = ArrowDownward;
    }
  }

  return (
    <Card sx={{ bgcolor: 'background.default', border: `1px solid ${theme.palette.divider}` }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mr: 1 }}>
            {typeof value === 'number' ? Number(value).toFixed(2) : value}
          </Typography>
          {unit && (
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              {unit}
            </Typography>
          )}
        </Box>

        {delta !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <DeltaIcon sx={{ color: deltaColor, fontSize: '1rem', mr: 0.5 }} />
            <Typography variant="body2" sx={{ color: deltaColor, fontWeight: 600, mr: 1 }}>
              {Math.abs(delta).toFixed(2)}
              {unit}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {deltaLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
