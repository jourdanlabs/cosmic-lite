export const VERSION = 'intake-core/0.1.0';
export const FIELDS = ['permitted', 'need', 'benefitLow', 'benefitHigh', 'costLow', 'costHigh',
  'effortDays', 'deliveryDays', 'mechanism', 'outcomeMetric'] as const;
export type Field = typeof FIELDS[number];
export type Value = string | number | boolean;
export type Evidence = {
  id: string; subjectId: string; field: Field; value: Value;
  sourceRef: string; sourceHash: string; issuer: string;
  observedAt: string; expiresAt: string;
};
export type Intake = {
  id: string; title: string; owner: string; team: string; priority: number;
  dependencyIds: string[]; deadlineDays: number | null;
  evidence: Evidence[];
};
export type Snapshot = { schema: 'intake/v1'; asOf: string; items: Intake[] };
export type Policy = {
  schema: 'intake-policy/v1'; version: string;
  authorityByField: Record<Field, string[]>;
  capacityDaysByTeam: Record<string, number>;
  horizonDays: number; benefitRealizationBps: number; costStressBps: number;
  minNetBenefit: number; valueUnit: string; benefitHorizon: string;
  rejectWhen: ('permitted' | 'need')[];
};
export type Problem = { code: string; detail: string; field?: Field; evidenceIds?: string[] };
export type Fact =
  | { status: 'KNOWN'; value: Value; evidenceIds: string[] }
  | { status: 'UNKNOWN' | 'CONFLICT'; evidenceIds: string[] };
export type Facts = Record<Field, Fact>;
export type Decision = 'BUILD' | 'REJECT' | 'DEFER' | 'NEEDS_EVIDENCE';
export type Resolution = {
  owner: string; question: string; engine: string; code: string;
  field?: Field; evidenceIds?: string[];
};
export type Evaluation = {
  id: string; priority: number; decision: Decision;
  reasons: Resolution[]; facts: Facts;
  trace: Record<string, unknown>;
};
export type Receipt = {
  schema: 'decision-receipt/v1'; engineVersion: string;
  runtime: string; sourceTreeHash: string; asOf: string;
  inputHash: string; policyHash: string;
  evaluations: Evaluation[]; remainingCapacityDays: Record<string, number>;
  receiptHash: string;
};
