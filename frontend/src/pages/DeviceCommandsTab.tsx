import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { useIssueCommandMutation, useCommandHistoryQuery } from '../features/commands/hooks/useCommands';
import { CommandStatusChip } from '../components/CommandStatusChip';
import dayjs from 'dayjs';

interface DeviceCommandsTabProps {
  deviceId: string;
}

export const DeviceCommandsTab: React.FC<DeviceCommandsTabProps> = ({ deviceId }) => {
  const { data: commands, isLoading: isHistoryLoading } = useCommandHistoryQuery(deviceId);
  const issueCommand = useIssueCommandMutation(deviceId);

  const [interval, setIntervalVal] = useState<string>('5');
  const [relayOn, setRelayOn] = useState<boolean>(false);

  const handleQuickCommand = (type: string) => {
    issueCommand.mutate({ command_type: type });
  };

  const handleRelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newState = e.target.checked;
    setRelayOn(newState);
    issueCommand.mutate({
      command_type: 'RELAY_SET',
      payload: { relay: 1, state: newState ? 'ON' : 'OFF' }
    });
  };

  const handleSendInterval = () => {
    issueCommand.mutate({
      command_type: 'SET_INTERVAL',
      payload: { interval_sec: parseInt(interval, 10) }
    });
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Quick Commands */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardHeader title="Quick Commands" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickCommand('RESTART')}
                    disabled={issueCommand.isPending}
                  >
                    Restart
                  </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={() => handleQuickCommand('FACTORY_RESET')}
                    disabled={issueCommand.isPending}
                  >
                    Factory Reset
                  </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => handleQuickCommand('SYNC_TIME')}
                    disabled={issueCommand.isPending}
                  >
                    Sync Time
                  </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    onClick={() => handleQuickCommand('CALIBRATE')}
                    disabled={issueCommand.isPending}
                  >
                    Calibrate
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Relay Controls */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardHeader title="Relay Controls" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Relay 1</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={relayOn}
                      onChange={handleRelayChange}
                      disabled={issueCommand.isPending}
                    />
                  }
                  label={relayOn ? 'ON' : 'OFF'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardHeader title="Sampling Interval" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Seconds"
                  type="number"
                  size="small"
                  value={interval}
                  onChange={(e) => setIntervalVal(e.target.value)}
                  disabled={issueCommand.isPending}
                />
                <Button
                  variant="outlined"
                  onClick={handleSendInterval}
                  disabled={issueCommand.isPending}
                >
                  Send
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Firmware */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardHeader title="Firmware" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" color="text.secondary">Version</Typography>
                <Typography variant="body1">1.2.4</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* History */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardHeader title="Command History" />
            <Divider />
            {isHistoryLoading ? (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Command</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commands?.map((cmd) => (
                      <TableRow key={cmd.id}>
                        <TableCell>{cmd.command_type}</TableCell>
                        <TableCell>
                          <CommandStatusChip status={cmd.status} />
                        </TableCell>
                        <TableCell>
                          {dayjs(cmd.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!commands || commands.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No commands history found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
