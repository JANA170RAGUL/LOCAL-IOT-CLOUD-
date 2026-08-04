import React, { useState } from 'react';
import { Box, Card, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PageHeader } from '../components/PageHeader';
import { HierarchySelector, type HierarchySelection } from '../components/HierarchySelector';
import { RuleTable } from '../features/rules/components/RuleTable';
import { RuleFilters } from '../features/rules/components/RuleFilters';
import { RuleForm } from '../features/rules/components/RuleForm';
import { useRulesQuery, useCreateRuleMutation, useUpdateRuleMutation } from '../features/rules/hooks/useRules';
import type { RuleFilterParams, BackendRule } from '../features/rules/types';

export const RuleBuilder: React.FC = () => {
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
  });

  const selectedProjectId = selection.projectId;
  
  const [filters, setFilters] = useState<RuleFilterParams>({
    page: 1,
    page_size: 10,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BackendRule | undefined>();

  const { data, isLoading } = useRulesQuery(selectedProjectId, filters);
  const createMutation = useCreateRuleMutation();
  const updateMutation = useUpdateRuleMutation();

  const handleOpenCreate = () => {
    setEditingRule(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (rule: BackendRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (editingRule) {
      updateMutation.mutate({ ruleId: editingRule.id, data: formData });
    } else {
      createMutation.mutate({ projectId: selectedProjectId, data: formData });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Rule Builder"
        subtitle="Automate actions and alerts based on live telemetry data"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            disabled={!selectedProjectId}
          >
            Add Rule
          </Button>
        }
      />

      <Box sx={{ mb: 4 }}>
        <HierarchySelector
          selection={selection}
          onChange={setSelection}
          maxDepth="project"
          variant="dropdown"
        />
      </Box>

      {selectedProjectId ? (
        <Card sx={{ p: 3 }}>
          <RuleFilters filters={filters} onFilterChange={setFilters} />
          
          <RuleTable
            rules={data?.items || []}
            total={data?.total || 0}
            page={filters.page || 1}
            pageSize={filters.page_size || 10}
            loading={isLoading}
            onPageChange={(page) => setFilters({ ...filters, page })}
            onPageSizeChange={(page_size) => setFilters({ ...filters, page_size, page: 1 })}
            onEdit={handleOpenEdit}
          />
        </Card>
      ) : (
        <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          Please select a project to view and manage automation rules.
        </Card>
      )}

      {formOpen && (
        <RuleForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingRule}
          title={editingRule ? 'Edit Rule' : 'Create Rule'}
        />
      )}
    </Box>
  );
};
