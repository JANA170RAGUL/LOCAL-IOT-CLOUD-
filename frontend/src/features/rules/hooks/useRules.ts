import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRules, getRule, createRule, updateRule, deleteRule } from '../api/rule';
import type { RuleCreate, RuleUpdate, RuleFilterParams } from '../types';

export const ruleKeys = {
  all: ['rules'] as const,
  lists: () => [...ruleKeys.all, 'list'] as const,
  list: (projectId: string, filters: RuleFilterParams) => [...ruleKeys.lists(), projectId, filters] as const,
  details: () => [...ruleKeys.all, 'detail'] as const,
  detail: (id: string) => [...ruleKeys.details(), id] as const,
};

export const useRulesQuery = (projectId: string, filters: RuleFilterParams) => {
  return useQuery({
    queryKey: ruleKeys.list(projectId, filters),
    queryFn: () => listRules(projectId, filters),
    enabled: !!projectId,
  });
};

export const useRuleQuery = (ruleId: string) => {
  return useQuery({
    queryKey: ruleKeys.detail(ruleId),
    queryFn: () => getRule(ruleId),
    enabled: !!ruleId,
  });
};

export const useCreateRuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: RuleCreate }) => createRule(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};

export const useUpdateRuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: RuleUpdate }) => updateRule(ruleId, data),
    onSuccess: (updatedRule) => {
      queryClient.setQueryData(ruleKeys.detail(updatedRule.id), updatedRule);
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};

export const useDeleteRuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.lists() });
    },
  });
};
