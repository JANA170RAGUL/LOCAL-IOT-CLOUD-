import React, { useState } from 'react';
import { Box, Typography, TextField } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const NotesWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [note, setNote] = useState((config as any).initialNote || 'Replace Filter on Friday - Raj');

  return (
    <Box sx={{ height: '100%', p: 2, bgcolor: '#fff9c4', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#f57f17' }}>
        {config.title || 'Sticky Note'}
      </Typography>
      <TextField
        multiline
        fullWidth
        variant="standard"
        slotProps={{ input: { disableUnderline: true } as any }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        sx={{ flexGrow: 1, '& textarea': { height: '100% !important', color: '#000' } }}
      />
    </Box>
  );
};

export const NotesWidgetManifest: WidgetManifest = {
  type: 'notes',
  name: 'Sticky Note',
  category: 'Utility',
  description: 'A simple sticky note for operator messages.',
  icon: EditNoteIcon,
  component: NotesWidget,
  defaultWidth: 3,
  defaultHeight: 3,
  minWidth: 2,
  minHeight: 2,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'notes'
  }
};
