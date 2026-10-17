import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commandsApi } from '../api/commands';
import { CommandCreate, DeviceCommand } from '../types/command';
import { useSnackbar } from 'notistack';

export const useCommandsKeys = {
  all: ['commands'] as const,
  lists: () => [...useCommandsKeys.all, 'list'] as const,
  list: (deviceId: string) => [...useCommandsKeys.lists(), deviceId] as const,
};

export const useCommandHistoryQuery = (deviceId: string) => {
  return useQuery({
    queryKey: useCommandsKeys.list(deviceId),
    queryFn: () => commandsApi.getDeviceCommands(deviceId),
    enabled: !!deviceId,
    // Poll every 2 seconds if there are commands in progress ("QUEUED", "SENT", "ACKNOWLEDGED")
    refetchInterval: (query) => {
      const data = query.state.data as DeviceCommand[] | undefined;
      const hasPending = data?.some((cmd) => {
        const status = (cmd.status || '').toString().toUpperCase();
        return status === 'QUEUED' || status === 'SENT' || status === 'ACKNOWLEDGED';
      });
      return hasPending ? 2000 : false;
    },
  });
};

export const useIssueCommandMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (command: CommandCreate) => commandsApi.issueCommand(deviceId, command),
    onSuccess: (data) => {
      enqueueSnackbar(`Command ${data.command_type || data.command} queued successfully`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: useCommandsKeys.list(deviceId) });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.detail || 'Failed to issue command',
        { variant: 'error' }
      );
    },
  });
};

export const useCancelCommandMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (commandId: string) => commandsApi.cancelCommand(commandId),
    onSuccess: () => {
      enqueueSnackbar('Command cancelled successfully', { variant: 'info' });
      queryClient.invalidateQueries({ queryKey: useCommandsKeys.list(deviceId) });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.detail || 'Failed to cancel command',
        { variant: 'error' }
      );
    },
  });
};
