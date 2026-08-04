import type { ReactNode } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Typography,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EmptyState } from '../EmptyState';

export interface ColumnDefinition<T> {
  field?: keyof T;
  header: string;
  width?: number | string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function DataTable<T>({
  rows,
  columns,
  loading = false,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your filters or create a new record.',
}: DataTableProps<T>) {
  const theme = useTheme();

  return (
    <Paper sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', width: '100%' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell key={idx} align={col.align || 'left'} style={{ width: col.width }}>
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ p: 0, border: 0 }}>
                  <Box sx={{ py: 4 }}>
                    <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIdx) => (
                <TableRow key={rowIdx} hover>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} align={col.align || 'left'}>
                      {col.render
                        ? col.render(row)
                        : col.field
                        ? String(row[col.field] as any)
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, page - 1)} // MUI expects 0-indexed page
          onPageChange={(_event, newPage) => onPageChange(newPage + 1)} // convert back to 1-indexed
          rowsPerPage={pageSize}
          onRowsPerPageChange={(event) => {
            onPageSizeChange(parseInt(event.target.value, 10));
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Paper>
  );
}
