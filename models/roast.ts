// Code generated from internal models; DO NOT EDIT.

export interface ROAStat {
  asn: number;
  coveringROAs: string[];
  ipPrefix: string;
  ipVersion: number;
  sourceDate: string;
  state: string;
}

export interface ROAStatFilter {
  limit?: number;
  asns?: number[];
  ipPrefix?: string;
  ipVersion?: number;
  sourceDate?: string;
  sourceDateFrom?: string;
  sourceDateTo?: string;
  state?: string;
}
