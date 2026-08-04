import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, MoreVertical, Edit2, ShieldOff, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { userApi } from '@/features/users/api/user';
import type { User } from '@/features/users/types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Avatar
} from '@mui/material';

export function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.list({
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        page_size: 20
      });
      setUsers(data.items);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const canManageUsers = currentUser?.role === 'Super Admin' || currentUser?.role === 'Org Admin' || currentUser?.role === 'Admin';

  const handleDisable = async (id: string) => {
    if (confirm('Are you sure you want to disable this user?')) {
      try {
        await userApi.delete(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to disable user:', error);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader 
        title="Users" 
        description="Manage users and their permissions across the platform."
      >
        {canManageUsers && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Plus size={20} />}
            onClick={() => navigate('/users/create')}
          >
            Add User
          </Button>
        )}
      </PageHeader>

      <Card sx={{ p: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          variant="outlined"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }
          }}
        />
        <Select
          displayEmpty
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="Super Admin">Super Admin</MenuItem>
          <MenuItem value="Org Admin">Org Admin</MenuItem>
          <MenuItem value="Operator">Operator</MenuItem>
          <MenuItem value="Viewer">Viewer</MenuItem>
        </Select>
        <Select
          displayEmpty
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </Select>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">Loading users...</Typography>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No users found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ fontWeight: 'medium', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => navigate(`/users/${user.id}`)}
                        >
                          {user.first_name} {user.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={user.role} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {user.status === 'ACTIVE' ? (
                      <Chip 
                        size="small" 
                        icon={<CheckCircle2 size={14} />} 
                        label="Active" 
                        color="success" 
                      />
                    ) : (
                      <Chip 
                        size="small" 
                        icon={<ShieldOff size={14} />} 
                        label="Inactive" 
                        color="error" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      {canManageUsers && (
                        <>
                          <IconButton 
                            size="small" 
                            title="Edit User"
                            onClick={() => navigate(`/users/${user.id}/edit`)}
                          >
                            <Edit2 size={18} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            title="Disable User"
                            onClick={() => handleDisable(user.id)}
                          >
                            <ShieldOff size={18} />
                          </IconButton>
                        </>
                      )}
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <MoreVertical size={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages}
            </Typography>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, value) => setPage(value)} 
              color="primary" 
              shape="rounded"
            />
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}
