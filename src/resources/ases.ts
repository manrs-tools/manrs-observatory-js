import type {
  AS,
  ASDetailRow,
  ASDetailsFilter,
  ASFilter,
  ASNScoreDetail,
  ASNScoreHistoryPoint,
  ASNScoreSummary,
  IncidentRow,
  IncidentsFilter,
  ScoresDetailsFilter,
  ScoresFilter,
} from "../../models";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class AsesResource extends BaseResource {
  /** Retrieve a single autonomous system by ASN. */
  async get(asn: number): Promise<AS> {
    const data = await this.http.get<{ as?: AS }>(`ases/${asn}`);
    if (!data.as) {
      throw new ManrsError(`AS ${asn} response missing "as"`, 200, {});
    }
    return data.as;
  }

  /** Return all autonomous systems matching the filter. */
  async find(filter?: ASFilter): Promise<AS[]> {
    const data = await this.http.get<{ ases?: AS[] }>(buildPath("ases", toQueryString(filter)));
    return data.ases ?? [];
  }

  /** Return a paginated iterator over autonomous systems. */
  findPaged(filter?: ASFilter): PageIterator<AS> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ ases?: AS[]; nextPageToken?: string }>(buildPath("ases", query));
      return { items: data.ases ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Return all approved ASNs. */
  async approvedAsns(): Promise<number[]> {
    const data = await this.http.get<{ asns?: number[] }>("asns");
    return data.asns ?? [];
  }

  /** Return score summaries for all ASNs matching the filter. */
  async scores(filter?: ScoresFilter): Promise<ASNScoreSummary[]> {
    const data = await this.http.get<{ scores?: ASNScoreSummary[] }>(buildPath("scores", toQueryString(filter)));
    return data.scores ?? [];
  }

  /** Return detailed score data for a single ASN. */
  async scoresDetailed(filter: ScoresDetailsFilter): Promise<ASNScoreDetail> {
    const data = await this.http.get<{ score?: ASNScoreDetail }>(
      buildPath("scores/details", toQueryString(filter)),
    );
    if (!data.score) {
      throw new ManrsError('scoresDetailed response missing "score"', 200, {});
    }
    return data.score;
  }

  /** Return the month-by-month score history behind a single ASN's detailed scores. */
  async scoreHistory(filter: ScoresDetailsFilter): Promise<ASNScoreHistoryPoint[]> {
    const data = await this.http.get<{ history?: ASNScoreHistoryPoint[] }>(
      buildPath("scores/details", toQueryString(filter)),
    );
    return data.history ?? [];
  }

  /** Return routing incidents for ASNs matching the filter. */
  async incidents(filter?: IncidentsFilter): Promise<IncidentRow[]> {
    const data = await this.http.get<{ incidents?: IncidentRow[] }>(buildPath("incidents", toQueryString(filter)));
    return data.incidents ?? [];
  }

  /** Return per-ASN detail rows for the stats/details listing. */
  async details(filter?: ASDetailsFilter): Promise<ASDetailRow[]> {
    const data = await this.http.get<{ data?: ASDetailRow[] }>(buildPath("stats/details", toQueryString(filter)));
    return data.data ?? [];
  }
}
