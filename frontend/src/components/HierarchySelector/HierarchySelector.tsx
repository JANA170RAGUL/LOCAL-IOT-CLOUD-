import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid, Breadcrumbs, Typography, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useOrganizationsQuery } from '../../features/organizations/hooks/useOrganizations';
import { useTenantsQuery } from '../../features/tenants/hooks/useTenants';
import { useProjectsQuery } from '../../features/projects/hooks/useProjects';
import { useGatewaysQuery } from '../../features/gateways/hooks/useGateways';
import { useDevicesQuery } from '../../features/devices/hooks/useDevices';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

export interface HierarchySelection {
  orgId: string;
  tenantId: string;
  projectId: string;
  gatewayId: string;
  deviceId?: string;
}

export interface HierarchySelectorProps {
  selection: HierarchySelection;
  onChange?: (selection: HierarchySelection) => void;
  maxDepth?: 'tenant' | 'project' | 'gateway' | 'device';
  variant?: 'dropdown' | 'breadcrumb';
}

export const HierarchySelector: React.FC<HierarchySelectorProps> = ({
  selection,
  onChange,
  maxDepth = 'device',
  variant = 'dropdown',
}) => {
  const { orgId, tenantId, projectId, gatewayId, deviceId = '' } = selection;

  const { data: orgsData, isLoading: orgsLoading } = useOrganizationsQuery(1, 200, {});
  const { data: tenantsData, isLoading: tenantsLoading } = useTenantsQuery(orgId, 1, 200, {});
  const { data: projectsData, isLoading: projectsLoading } = useProjectsQuery(tenantId, 1, 200, {});
  const { data: gatewaysData, isLoading: gatewaysLoading } = useGatewaysQuery(projectId, 1, 200, {});
  const { data: devicesData, isLoading: devicesLoading } = useDevicesQuery(gatewayId, 1, 200, {});

  const user = useAuthStore((state) => state.user);
  const isVendorRole = user?.role === 'Developer' || user?.role === 'Admin' || user?.role === 'Super Admin';
  const hasSingleOrg = orgsData?.items.length === 1;

  React.useEffect(() => {
    // Auto-select the org if only one is available and none is currently selected
    if (hasSingleOrg && !orgId && orgsData.items[0].id) {
      handleOrgChange(orgsData.items[0].id);
    }
  }, [hasSingleOrg, orgId, orgsData]);

  const handleOrgChange = (newOrgId: string) => {
    if (onChange) {
      onChange({
        orgId: newOrgId,
        tenantId: '',
        projectId: '',
        gatewayId: '',
        deviceId: '',
      });
    }
  };

  const handleTenantChange = (newTenantId: string) => {
    if (onChange) {
      onChange({
        ...selection,
        tenantId: newTenantId,
        projectId: '',
        gatewayId: '',
        deviceId: '',
      });
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    if (onChange) {
      onChange({
        ...selection,
        projectId: newProjectId,
        gatewayId: '',
        deviceId: '',
      });
    }
  };

  const handleGatewayChange = (newGatewayId: string) => {
    if (onChange) {
      onChange({
        ...selection,
        gatewayId: newGatewayId,
        deviceId: '',
      });
    }
  };

  const handleDeviceChange = (newDeviceId: string) => {
    if (onChange) {
      onChange({
        ...selection,
        deviceId: newDeviceId,
      });
    }
  };

  const showTenant = maxDepth === 'tenant' || maxDepth === 'project' || maxDepth === 'gateway' || maxDepth === 'device';
  const showProject = maxDepth === 'project' || maxDepth === 'gateway' || maxDepth === 'device';
  const showGateway = maxDepth === 'gateway' || maxDepth === 'device';
  const showDevice = maxDepth === 'device';

  if (variant === 'breadcrumb') {
    const orgName = orgsData?.items.find((o) => o.id === orgId)?.name || 'Unknown Org';
    const tenantName = tenantsData?.items.find((t) => t.id === tenantId)?.name || 'Unknown Tenant';
    const projectName = projectsData?.items.find((p) => p.id === projectId)?.name || 'Unknown Project';
    const gatewayName = gatewaysData?.items.find((g) => g.id === gatewayId)?.name || 'Unknown Gateway';
    const deviceName = devicesData?.items.find((d) => d.id === deviceId)?.name || 'Unknown Device';

    const crumbs = [];
    if (orgId) crumbs.push(orgName);
    if (tenantId && showTenant) crumbs.push(tenantName);
    if (projectId && showProject) crumbs.push(projectName);
    if (gatewayId && showGateway) crumbs.push(gatewayName);
    if (deviceId && showDevice) crumbs.push(deviceName);

    return (
      <Box sx={{ py: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Typography key={index} color={isLast ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: isLast ? 600 : 400, fontSize: '0.875rem' }}>
                {crumb}
              </Typography>
            );
          })}
        </Breadcrumbs>
      </Box>
    );
  }

  // Dropdown variant
  let columnCount = 1;
  if (showTenant) columnCount++;
  if (showProject) columnCount++;
  if (showGateway) columnCount++;
  if (showDevice) columnCount++;
  
  const xsSize = 12;
  const smSize = 12 / Math.min(columnCount, 3); // Max 3 per row on tablet
  const mdSize = 12 / Math.min(columnCount, 5); // Fit up to 5 on desktop

  return (
    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
      <Grid size={{ xs: xsSize, sm: smSize, md: mdSize }}>
        <FormControl fullWidth size="small" disabled={hasSingleOrg && !isVendorRole}>
          <InputLabel id="hier-org-label">Organization</InputLabel>
          <Select
            labelId="hier-org-label"
            label="Organization"
            value={orgId}
            onChange={(e) => handleOrgChange(e.target.value)}
            disabled={orgsLoading || (hasSingleOrg && !isVendorRole)}
          >
            <MenuItem value="">— Select —</MenuItem>
            {orgsData?.items.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {showTenant && (
        <Grid size={{ xs: xsSize, sm: smSize, md: mdSize }}>
          <FormControl fullWidth size="small" disabled={!orgId || tenantsLoading}>
            <InputLabel id="hier-tenant-label">Tenant</InputLabel>
            <Select
              labelId="hier-tenant-label"
              label="Tenant"
              value={tenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
            >
              <MenuItem value="">— Select —</MenuItem>
              {tenantsData?.items.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      {showProject && (
        <Grid size={{ xs: xsSize, sm: smSize, md: mdSize }}>
          <FormControl fullWidth size="small" disabled={!tenantId || projectsLoading}>
            <InputLabel id="hier-project-label">Project</InputLabel>
            <Select
              labelId="hier-project-label"
              label="Project"
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              <MenuItem value="">— Select —</MenuItem>
              {projectsData?.items.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      {showGateway && (
        <Grid size={{ xs: xsSize, sm: smSize, md: mdSize }}>
          <FormControl fullWidth size="small" disabled={!projectId || gatewaysLoading}>
            <InputLabel id="hier-gateway-label">Gateway</InputLabel>
            <Select
              labelId="hier-gateway-label"
              label="Gateway"
              value={gatewayId}
              onChange={(e) => handleGatewayChange(e.target.value)}
            >
              <MenuItem value="">— Select —</MenuItem>
              {gatewaysData?.items.map((gateway) => (
                <MenuItem key={gateway.id} value={gateway.id}>
                  {gateway.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      {showDevice && (
        <Grid size={{ xs: xsSize, sm: smSize, md: mdSize }}>
          <FormControl fullWidth size="small" disabled={!gatewayId || devicesLoading}>
            <InputLabel id="hier-device-label">Device</InputLabel>
            <Select
              labelId="hier-device-label"
              label="Device"
              value={deviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              <MenuItem value="">— Select —</MenuItem>
              {devicesData?.items.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
    </Grid>
  );
};
