import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Alert
} from '@mui/material';
import { notificationApi } from '../../../features/notifications/api/notifications';

export const NotificationHistory: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', page, rowsPerPage],
    queryFn: () => notificationApi.getHistory(page * rowsPerPage, rowsPerPage)
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error) {
    return <Alert severity="error">Failed to load notification history</Alert>;
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: '12px', boxShadow: 'none' }}>
      <CardContent sx={{ p: 3, pb: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          Notification History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Recent alerts and communications sent to you.
        </Typography>

        <TableContainer sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Loading notifications...
                  </TableCell>
                </TableRow>
              ) : !data?.items || data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No notifications found.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{row.channel}</TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        color={
                          row.status === 'SENT' ? 'success' :
                          row.status === 'PENDING' ? 'warning' : 'error'
                        }
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <TablePagination
            component="div"
            count={data?.total || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              border: 'none',
              '.MuiTablePagination-toolbar': {
                px: 0,
                minHeight: 44,
                gap: 0.5,
              },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.8125rem',
                margin: 0,
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
