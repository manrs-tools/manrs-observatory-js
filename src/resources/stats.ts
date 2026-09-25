import type {
  ComparisonGroup,
  ComparisonScenario,
  ComparisonSelection,
  DashboardFilters,
  DashboardFiltersFilter,
  DashboardStatistics,
  DatesAvailable,
  ScoresSummaryFilter,
  StatsHistory,
  StatsHistoryFilter,
  StatsOverview,
} from "../../models";
import { ManrsError } from "../errors";
import { buildPath, toQueryString } from "../query";
import { BaseResource } from "./base-resource";

/** Per-action MANRS conformance scores for all approved participants matching a programme filter. */
export interface ConformanceScoresResult {
  measurementDate?: string;
  participants?: unknown[];
  type?: string;
}

export class StatsResource extends BaseResource {
  /** Return the available date filters for the dashboard. */
  async filters(filter?: DashboardFiltersFilter): Promise<DatesAvailable> {
    const data = await this.http.get<DashboardFilters>(buildPath("filters", toQueryString(filter)));
    if (!data.datesAvailable) {
      throw new ManrsError('filters response missing "datesAvailable"', 200, {});
    }
    return data.datesAvailable;
  }

  /** Return every dashboard filter control: available dates, selectable ASes, geo data and MANRS scopes. */
  dashboardFilters(filter?: DashboardFiltersFilter): Promise<DashboardFilters> {
    return this.http.get<DashboardFilters>(buildPath("filters", toQueryString(filter)));
  }

  /** Return per-action MANRS conformance for all approved participants. */
  async conformance(participantType?: string): Promise<ConformanceScoresResult> {
    const path = buildPath("scores/conformance", toQueryString({ type: participantType }));
    return this.http.get<ConformanceScoresResult>(path);
  }

  /** Return aggregated dashboard statistics. */
  async summary(filter?: ScoresSummaryFilter): Promise<DashboardStatistics> {
    const data = await this.http.get<{ scores?: DashboardStatistics }>(
      buildPath("scores/summary", toQueryString(filter)),
    );
    if (!data.scores) {
      throw new ManrsError('summary response missing "scores"', 200, {});
    }
    return data.scores;
  }

  /**
   * Return comparison data for the given selection and scenarios. `manrs` scopes every
   * scenario to `"participants"` or `"non-participants"`; omit it to include all ASes.
   */
  async comparison(
    selection: ComparisonSelection,
    scenarios?: ComparisonScenario[],
    manrs?: string,
  ): Promise<ComparisonGroup[]> {
    const data = await this.http.post<{ groups?: ComparisonGroup[] }>("stats/comparison", {
      selection,
      scenarios,
      manrs,
    });
    return data.groups ?? [];
  }

  /** Return historical statistics. */
  async history(filter?: StatsHistoryFilter): Promise<StatsHistory> {
    const data = await this.http.get<{ history?: StatsHistory }>(
      buildPath("stats/history", toQueryString(filter)),
    );
    if (!data.history) {
      throw new ManrsError('history response missing "history"', 200, {});
    }
    return data.history;
  }

  /** Return Observatory-wide monthly statistics. */
  async overview(): Promise<StatsOverview> {
    const data = await this.http.get<{ overview?: StatsOverview }>("stats/overview");
    if (!data.overview) {
      throw new ManrsError('overview response missing "overview"', 200, {});
    }
    return data.overview;
  }
}
