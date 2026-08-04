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
    // Poll every 3 seconds if there are commands in "Queued" or "Sent" status
    refetchInterval: (query) => {
      const data = query.state.data as DeviceCommand[] | undefined;
      const hasPending = data?.some((cmd) => cmd.status === 'Queued' || cmd.status === 'Sent');
      return hasPending ? 3000 : false;
    },
  });
};

export const useIssueCommandMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (command: CommandCreate) => commandsApi.issueCommand(deviceId, command),
    onSuccess: (data) => {
      enqueueSnackbar(`Command ${data.command_type} issued successfully`, { variant: 'success' });
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
