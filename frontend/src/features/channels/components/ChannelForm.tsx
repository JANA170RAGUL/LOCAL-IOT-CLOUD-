import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Card, CardContent, 
  MenuItem, IconButton, Divider, Grid 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { channelsApi, ChannelField } from '../api/channels';

export const ChannelForm: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'enterprise'>('private');
  
  const [fields, setFields] = useState<ChannelField[]>([
    { field_key: 'field1', name: '', unit: '', data_type: 'float' }
  ]);

  const addField = () => {
    if (fields.length >= 8) return;
    setFields([
      ...fields, 
      { field_key: `field${fields.length + 1}`, name: '', unit: '', data_type: 'float' }
    ]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    // Re-index field keys
    const reindexed = newFields.map((f, i) => ({ ...f, field_key: `field${i + 1}` }));
    setFields(reindexed);
  };

  const updateField = (index: number, key: keyof ChannelField, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty fields
      const validFields = fields.filter(f => f.name.trim() !== '');
      const channel = await channelsApi.createChannel({
        name,
        description,
        visibility,
        fields: validFields
      });
      navigate(`/channels/${channel.id}`);
    } catch (error) {
      console.error("Failed to create channel", error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/channels')} sx={{ mb: 2 }}>
        Back to Channels
      </Button>
      
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Create Channel</Typography>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>General Information</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth label="Channel Name" required 
                  value={name} onChange={(e) => setName(e.target.value)} 
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth label="Description" multiline rows={3} 
                  value={description} onChange={(e) => setDescription(e.target.value)} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  fullWidth select label="Visibility" 
                  value={visibility} onChange={(e) => setVisibility(e.target.value as 'public'|'private'|'enterprise')}
                  required
                >
                  <MenuItem value="public">Public (Open Read Access)</MenuItem>
                  <MenuItem value="private">Private (API Key Required)</MenuItem>
                  <MenuItem value="enterprise">Enterprise (JWT + RBAC Required)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Fields</Typography>
              <Button 
                startIcon={<AddIcon />} 
                onClick={addField} 
                disabled={fields.length >= 8}
                variant="outlined" size="small"
              >
                Add Field
              </Button>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Channels can have up to 8 fields. Each field maps to an incoming telemetry stream (e.g. Temperature).
            </Typography>

            {fields.map((field, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 2 }}>
                    <Typography sx={{ fontWeight: 'bold' }} color="textSecondary">{field.field_key.toUpperCase()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <TextField 
                      fullWidth size="small" label="Name (e.g. Temperature)" required
                      value={field.name} onChange={(e) => updateField(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <TextField 
                      fullWidth size="small" label="Unit (e.g. °C)" 
                      value={field.unit || ''} onChange={(e) => updateField(index, 'unit', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <TextField 
                      fullWidth select size="small" label="Type" 
                      value={field.data_type} onChange={(e) => updateField(index, 'data_type', e.target.value)}
                    >
                      <MenuItem value="float">Float</MenuItem>
                      <MenuItem value="int">Integer</MenuItem>
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 1 }}>
                    <IconButton color="error" onClick={() => removeField(index)} disabled={fields.length === 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
                {index < fields.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" sx={{ mr: 2 }} onClick={() => navigate('/channels')}>Cancel</Button>
          <Button variant="contained" type="submit" size="large">Save Channel</Button>
        </Box>
      </form>
    </Box>
  );
};
