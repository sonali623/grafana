export type VariableType =
  | 'query'
  | 'adhoc'
  | 'constant'
  | 'datasource'
  | 'interval'
  | 'textbox'
  | 'custom'
  | 'system'
  | 'drilldown';

export interface VariableModel {
  type: VariableType;
  name: string;
  label?: string;
}
