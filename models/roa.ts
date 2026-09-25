// Code generated from internal models; DO NOT EDIT.

export interface ROA {
  asn: number;
  ipPrefix: string;
  ipVersion: number;
  maxLength: number;
  notAfter: string;
  notBefore: string;
  source: string;
  valid: boolean;
}

export interface ROAEconomyStats {
  total: number;
  invalid: number;
  unknown: number;
  valid: number;
  economy: string;
  label: string;
  byVersion?: ROAVersionStats[];
}

export interface ROAFilter {
  limit?: number;
  asns?: number[];
  ipPrefix?: string;
  ipVersion?: number;
  maxLength?: number;
  notAfter?: string;
  notBefore?: string;
  source?: string;
  sourceDate?: string;
  valid?: boolean;
}

export interface ROARecordsFilter {
  limit?: number;
  asn?: number;
  economy?: string;
  region?: string;
  status?: string;
  month?: string;
}

export interface ROAStatsDetail {
  total: number;
  invalid: number;
  unknown: number;
  valid: number;
  dateFetched?: string;
  entity?: ROAStatsEntity;
  byVersion?: ROAVersionStats[];
  byEconomy?: ROAEconomyStats[];
}

export interface ROAStatsEntity {
  label: string;
  type: string;
  value: string;
}

export interface ROAStatsFilter {
  asn?: number;
  economy?: string;
  region?: string;
  month?: string;
}

export interface ROAStatsRecord {
  asn: number;
  asnName: string;
  economy: string;
  ipPrefix: string;
  ipVersion: number;
  status: string;
}

export interface ROAVersionStats {
  total: number;
  invalid: number;
  unknown: number;
  valid: number;
  ipVersion: number;
}
