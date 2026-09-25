// Code generated from internal models; DO NOT EDIT.
import type { ASNTrendData } from "./audit";

export const IncidentAcceptableDuration = 1800;

export const IncidentAcceptableScore = 0.5;

export const IncidentTolerantDuration = 86400;

export const IncidentTolerantScore = 1.0;

export const DefaultGRIPWeight = 1.0;

export const DefaultWeight = 0.5;

export const MinTrendDataPoints = 2;

export const RPKIScorePenalty = 10;

export const AntiSpoofingOkThreshold = 0.600001;

export const AntiSpoofingWarnThreshold = 0.6;

export const CoordinationOkThreshold = 0.999;

export const FilteringOkThreshold = 0.799;

export const FilteringWarnThreshold = 0.599;

export const RoutingInformationOkThreshold = 0.899;

export const RoutingInformationWarnThreshold = 0.499;

export const OneHundred = 100.0;

export interface ASNActionScores {
  m1: number;
  m1c: number;
  m2GRIP: number;
  m2cGRIP: number;
  m3: number;
  m3c: number;
  m3Admin: number;
  m3cAdmin: number;
  m4: number;
  m4c: number;
  m4Admin: number;
  m4cAdmin: number;
  m5?: number | null;
  m7IRR?: number | null;
  m7RPKI?: number | null;
  m7RPKIN?: number | null;
  m7Conflict?: number | null;
  m8?: number | null;
  m9: number;
}

export interface ASNMetrics {
  totalIRRRoutes: number;
  routeLeaks: number;
  bogonAnnouncements: number;
  adminBogonAnnouncements: number;
}

export interface ASNROVSample {
  economyCode: string;
  validRate: number;
  samples: number;
  totalIRRRoutes: number;
  routeLeaks: number;
  bogonAnnouncements: number;
}

export interface ASNRoutingDetail {
  totalIRRRoutes: number;
  registeredIRRRoutes: number;
  unregisteredIRRRoutes: number;
  unregisteredPrefixes?: string[];
  conflictingPrefixes?: ConflictingIRRPrefix[];
  registeredRPKIRoutes: number;
  validRPKIRoutes: number;
  unknownRPKIRoutes: number;
  invalidRPKIRoutes: number;
  invalidPrefixes?: InvalidRPKIPrefix[];
  unknownPrefixes?: string[];
  bogons?: BogonDetail[];
}

export interface ASNScoreDetail {
  actions?: ASNActionScores | null;
  contactInfoValid?: boolean | null;
  incidents?: IncidentCounts | null;
  metrics?: ASNMetrics | null;
  routing?: ASNRoutingDetail | null;
  rovSamples?: ASNROVSample[];
  scores?: CategoryScores | null;
  trend?: ASNTrendData | null;
}

export interface ASNScoreSummary {
  asn: number;
  asnHolder: string;
  participantName: string;
  scores?: CategoryScores | null;
  actions?: ASNActionScores | null;
  incidents?: IncidentCounts | null;
}

export interface BogonDetail {
  asn?: number;
  ipPrefix?: string;
  class: string;
  role: string;
}

export interface CategoryScores {
  filtering?: ScoreWithSeverity | null;
  coordination?: ScoreWithSeverity | null;
  antiSpoofing?: ScoreWithSeverity | null;
  routingInformationIRR?: ScoreWithSeverity | null;
  routingInformationRPKI?: ScoreWithSeverity | null;
}

export interface ConflictingIRRPrefix {
  irrSources: string[];
  ipPrefix: string;
  rpkiState: string;
}

export interface CoveringROA {
  asn: number;
  maxLength: number;
  ipPrefix: string;
}

export interface IncidentCounts {
  routeLeaks: number;
  routeLeaksAccomplice: number;
  routeMisoriginations: number;
  routeMisoriginationsAccomplice: number;
  total: number;
}

export interface IncidentSummaryFilter {
  reportMonth?: string;
  asns?: number[];
}

export interface IncidentsFilter {
  asns?: number[];
  month?: string;
  ids?: string[];
}

export interface InvalidRPKIPrefix {
  coveringRoas: CoveringROA[];
  ipPrefix: string;
  state: string;
}

export interface ScoreWithSeverity {
  value: unknown;
  severity: string;
}

export interface ScoresDetailsFilter {
  asn?: number;
  month?: string;
}

export interface ScoresFilter {
  limit?: number;
  month?: string;
  asns?: number[];
  economies?: string[];
  region?: string;
  participantIDs?: string[];
}

export interface ScoresSummaryFilter {
  asns?: number[];
  economies?: string[];
  manrs?: string;
  month?: string;
  region?: string;
}
