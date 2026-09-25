// Code generated from internal models; DO NOT EDIT.

export const TrendAsc = "Asc";

export const TrendDesc = "Desc";

export const TrendNone = "None";

export interface ASNScoreHistoryPoint {
  month: string;
  filtering?: number | null;
  antiSpoofing?: number | null;
  coordination?: number | null;
  routingInformationIRR?: number | null;
  routingInformationRPKI?: number | null;
}

export interface TrendData {
  value: number;
  trend: TrendDirection;
  severity: string;
  previous?: number | null;
  change?: number | null;
  changePercent?: number | null;
}

export type TrendDirection = string;
