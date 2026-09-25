// Code generated from internal models; DO NOT EDIT.

export interface AS {
  id: number;
  economy: string;
  name: string;
  notes?: string;
  organization: string;
  region: string;
  rir: string;
  verifiedBy?: string;
  visible: boolean;
  claimeeIDNetOps?: string;
  claimeeIDIXP?: string;
  claimeeIDCDN?: string;
  claimeeIDVendor?: string;
}

export interface ASFilter {
  limit?: number;
  economies?: string[];
  rirs?: string[];
}
