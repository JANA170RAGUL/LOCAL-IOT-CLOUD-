export type RuleConditionOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'BETWEEN' | 'OUTSIDE RANGE';
export type RuleSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type RuleActionType = 'CREATE_ALERT' | 'EMAIL' | 'WEBHOOK' | 'MQTT_PUBLISH' | 'SMS' | 'PUSH_NOTIFICATION';

export interface BackendRule {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string | null;
  sensor_id: string;
  condition: RuleConditionOperator;
  threshold: number;
  severity: RuleSeverity;
  enabled: boolean;
  cooldown_seconds: number;
  action_type: RuleActionType;
  action_config: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RuleCreate {
  code: string;
  name: string;
  description?: string;
  sensor_id: string;
  condition: RuleConditionOperator;
  threshold: number;
  severity: RuleSeverity;
  enabled: boolean;
  cooldown_seconds: number;
  action_type: RuleActionType;
  action_config: Record<string, any>;
}

export interface RuleUpdate extends Partial<RuleCreate> {
  status?: string;
}

export interface RuleFilterParams {
  status?: string;
  enabled?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface RuleListResponse {
  total: number;
  page: number;
  page_size: number;
  items: BackendRule[];
}
