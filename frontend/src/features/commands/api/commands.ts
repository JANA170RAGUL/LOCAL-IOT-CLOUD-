import apiClient from '../../../services/api/axios';
import { DeviceCommand, CommandCreate } from '../types/command';

export const commandsApi = {
  issueCommand: async (deviceId: string, command: CommandCreate): Promise<DeviceCommand> => {
    const response = await apiClient.post(`/commands/${deviceId}`, command);
    return response.data;
  },

  getDeviceCommands: async (deviceId: string, limit = 50, skip = 0): Promise<DeviceCommand[]> => {
    const response = await apiClient.get(`/commands/device/${deviceId}`, {
      params: { limit, skip },
    });
    return response.data;
  },
};
