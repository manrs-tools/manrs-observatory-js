// Code generated from internal models; DO NOT EDIT.
import type { CategoryScores } from "./report";

export interface ASDetailRow {
  asn: number;
  holder: string;
  organisation: string;
  economy: string;
  rir: string;
  region: string;
  scores?: CategoryScores | null;
  visible: boolean;
  claimed?: boolean;
  hasOpenApplication?: boolean;
}

export interface ASDetailsFilter {
  asns?: number[];
  economies?: string;
  manrs?: string;
  month?: string;
  region?: string;
  rir?: string;
  scope?: string;
  severity?: string;
  subRegion?: string;
}

export interface ComparisonDataPoint {
  format: string;
  groupID: string;
  implemented: boolean;
  metricID: string;
  monthID: string;
  scenarioID: string;
  value?: number | null;
}

export interface ComparisonGeoFilter {
  selection?: string[];
  type?: string;
}

export interface ComparisonGroup {
  title: string;
  dataPoints: ComparisonDataPoint[];
}

export interface ComparisonScenario {
  id: string;
  selection: ComparisonSelection;
}

export interface ComparisonSelection {
  geo?: ComparisonGeoFilter | null;
  timeRange: ComparisonTimeRange;
}

export interface ComparisonTimeRange {
  start: string;
  duration: number;
}

export interface DashboardCulprits {
  total: number;
}

export interface DashboardFilterAS {
  asn: number;
  organization: string;
}

export interface DashboardFilters {
  ases: DashboardFilterAS[];
  datesAvailable?: DatesAvailable | null;
  geo?: GeoData | null;
  manrs: DashboardMANRSOption[];
  month: string;
}

export interface DashboardFiltersFilter {
  month?: string;
  type?: string;
}

export interface DashboardIRR {
  total: number;
  registered: number;
  unregistered: number;
}

export interface DashboardIncidents {
  routeMisoriginations: number;
  routeLeaks: number;
  bogonAnnouncements: number;
}

export interface DashboardMANRSOption {
  label: string;
  value: string;
}

export interface DashboardROV {
  valid: number;
}

export interface DashboardRPKI {
  total: number;
  valid: number;
  unknown: number;
  invalid: number;
}

export interface DashboardStatistics {
  keyFigures: KeyFigure[];
  incidents: DashboardIncidents;
  culprits: DashboardCulprits;
  irr: DashboardIRR;
  rpki: DashboardRPKI;
  rov: DashboardROV;
}

export interface DatesAvailable {
  dataRange: string[];
  incompleteMonths: string[];
}

export interface GeoData {
  id: string;
  type: string;
  data: GeoDataPoint[];
}

export interface GeoDataPoint {
  id: string;
  lat: number;
  lng: number;
  measures: GeoMeasure[];
}

export interface GeoMeasure {
  id: string;
  value: number;
  severities: GeoMeasureSeverity[];
}

export interface GeoMeasureSeverity {
  id: string;
  count: number;
  percentage: number;
}

export interface KeyFigure {
  id: string;
  value: number;
  trend?: number | null;
  severities: KeyFigureSeverity[];
}

export interface KeyFigureSeverity {
  id: string;
  count: number;
  percentage: number;
}

export interface StatsHistory {
  statistics: StatsHistoryStat[];
  history: StatsHistoryMetric[];
  coverage: StatsHistoryCoverage[];
  participantsByType: StatsHistoryParticipantPoint[];
}

export interface StatsHistoryCoverage {
  monthID: string;
  asns: number;
  asnsWithIncidents: number;
  claimedASNs: number;
}

export interface StatsHistoryFilter {
  asns?: string;
  manrs?: string;
  region?: string;
}

export interface StatsHistoryMetric {
  id: string;
  public: StatsHistoryPublic[];
}

export interface StatsHistoryParticipantPoint {
  monthID: string;
  type: string;
  count: number;
}

export interface StatsHistoryPoint {
  id: string;
  monthID: string;
  value: number;
}

export interface StatsHistoryPublic {
  monthID: string;
  id: string;
  count: number;
  percentage: number;
}

export interface StatsHistoryStat {
  id: string;
  format: string;
  history: StatsHistoryPoint[];
  synthetic: boolean;
}
