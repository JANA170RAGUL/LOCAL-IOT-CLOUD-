import React, { useState } from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const AiChatWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hi! I am your AI Assistant. Ask me anything about your platform.' }
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages([...messages, { role: 'user', text: query }, { role: 'ai', text: 'Thinking... (Mock Response)' }]);
    setQuery('');
  };

  const suggestions = [
    "Why is Pump 2 overheating?",
    "Explain today's alerts.",
    "Show devices with high vibration.",
    "Compare energy usage this week."
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 1 }}>
      <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
        <SmartToyIcon sx={{ mr: 1 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{config.title || 'AI Assistant'}</Typography>
      </Box>

      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((m, idx) => (
          <Box key={idx} sx={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <Typography variant="body2" sx={{ 
              p: 1, 
              borderRadius: 2, 
              bgcolor: m.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              color: m.role === 'user' ? '#0d47a1' : 'text.primary',
              borderBottomRightRadius: m.role === 'user' ? 0 : undefined,
              borderBottomLeftRadius: m.role === 'ai' ? 0 : undefined,
            }}>
              {m.text}
            </Typography>
          </Box>
        ))}
        {messages.length === 1 && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Suggestions:</Typography>
            {suggestions.map((s, idx) => (
              <Typography key={idx} variant="caption" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => setQuery(s)}>
                "{s}"
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Ask AI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
        />
        <IconButton color="primary" onClick={handleSend} sx={{ ml: 1 }}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export const AiChatWidgetManifest: WidgetManifest = {
  type: 'ai-chat',
  name: 'AI Chat Assistant',
  category: 'AI',
  subcategory: 'Interactive',
  description: 'Embedded AI assistant for natural language queries.',
  icon: SmartToyIcon,
  component: AiChatWidget,
  defaultWidth: 4,
  defaultHeight: 5,
  minWidth: 3,
  minHeight: 4,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-chat',
    title: 'Copilot'
  }
};
