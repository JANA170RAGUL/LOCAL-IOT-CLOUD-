import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../../features/settings/api/settings';
import { format } from 'date-fns';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from '@mui/material';

export default function AuditLogTable() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', skip, limit],
    queryFn: () => settingsApi.getAuditLogs(skip, limit)
  });

  if (isLoading) return <Box sx={{ p: 2 }}><Typography>Loading audit logs...</Typography></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>Audit Logs</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Track important actions performed within the platform.
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>
                  {log.user_name || 'System'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                  {log.action}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}
                </TableCell>
              </TableRow>
            ))}
            {data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No audit logs found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {skip + 1} to {Math.min(skip + limit, data?.total || 0)} of {data?.total || 0} entries
          </Typography>
          <Pagination 
            count={Math.ceil((data?.total || 0) / limit)} 
            page={page} 
            onChange={(_, value) => setPage(value)} 
            color="primary" 
            shape="rounded"
          />
        </Box>
      </TableContainer>
    </Box>
  );
}
