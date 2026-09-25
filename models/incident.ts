// Code generated from internal models; DO NOT EDIT.

export const MetricTypeM1 = "M1";

export const MetricTypeM1C = "M1C";

export const MetricTypeM2GRIP = "M2_GRIP";

export const MetricTypeM2CGRIP = "M2C_GRIP";

export const MetricTypeM3 = "M3";

export const MetricTypeM3C = "M3C";

export const MetricTypeM3Admin = "M3_ADMIN";

export const MetricTypeM3CAdmin = "M3C_ADMIN";

export const MetricTypeM4 = "M4";

export const MetricTypeM4C = "M4C";

export const MetricTypeM4Admin = "M4_ADMIN";

export const MetricTypeM4CAdmin = "M4C_ADMIN";

export interface IncidentRow {
  asn: number;
  id: string;
  metricType: string;
  isCulprit: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  ipPrefix: string;
  ipVersion?: number;
  paths?: string[];
  type?: string;
  cleared?: boolean;
}

export interface IncidentSummaryRow {
  asn: number;
  asnHolder: string;
  m1: number;
  m1c: number;
  m2: number;
  m2c: number;
}
