// Code generated from internal models; DO NOT EDIT.

export interface MonthlyStat {
  month: string;
  participants: Record<string, ParticipantTypeCounts>;
  totalASNs: number;
  claimedASNs: number;
  asnsWithIncidents: number;
  updatedAt: string;
}

export interface ParticipantTypeCounts {
  count: number;
  asnsWithIncidents: number;
  participantsWithIncidents: number;
}

export interface StatsLiveCounts {
  participants: number;
  users: number;
  totalASNs: number;
  claimedASNs: number;
}

export interface StatsOverview {
  months: MonthlyStat[];
  live: StatsLiveCounts;
}
