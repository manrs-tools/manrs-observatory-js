import type {
  ROA,
  ROAFilter,
  ROARecordsFilter,
  ROAStat,
  ROAStatFilter,
  ROAStatsDetail,
  ROAStatsFilter,
  ROAStatsRecord,
} from "../../models";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class RoasResource extends BaseResource {
  /** Return all Route Origin Authorizations matching the filter. */
  async find(filter?: ROAFilter): Promise<ROA[]> {
    const data = await this.http.get<{ roas?: ROA[] }>(buildPath("roas", toQueryString(filter)));
    return data.roas ?? [];
  }

  /** Return a paginated iterator over ROAs. */
  findPaged(filter?: ROAFilter): PageIterator<ROA> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ roas?: ROA[]; nextPageToken?: string }>(buildPath("roas", query));
      return { items: data.roas ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Return aggregate ROA stats for a scope (ASN, economy, or region). */
  async stats(filter?: ROAStatsFilter): Promise<ROAStatsDetail> {
    const data = await this.http.get<{ summary?: ROAStatsDetail }>(
      buildPath("stats/roas", toQueryString(filter)),
    );
    if (!data.summary) {
      throw new ManrsError('stats response missing "summary"', 200, {});
    }
    return data.summary;
  }

  /** Return per-prefix ROA validation records matching the filter. */
  async findPrefixRecords(filter?: ROARecordsFilter): Promise<ROAStatsRecord[]> {
    const data = await this.http.get<{ records?: ROAStatsRecord[] }>(
      buildPath("stats/roas/records", toQueryString(filter)),
    );
    return data.records ?? [];
  }

  /** Return a paginated iterator over per-prefix ROA validation records. */
  findPrefixRecordsPaged(filter?: ROARecordsFilter): PageIterator<ROAStatsRecord> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ records?: ROAStatsRecord[]; nextPageToken?: string }>(
        buildPath("stats/roas/records", query),
      );
      return { items: data.records ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Return per-announcement RPKI validation records. */
  async findAnnouncementRecords(filter?: ROAStatFilter): Promise<ROAStat[]> {
    const data = await this.http.get<{ stats?: ROAStat[] }>(buildPath("roa-stats", toQueryString(filter)));
    return data.stats ?? [];
  }

  /** Return a paginated iterator over per-announcement RPKI validation records. */
  findAnnouncementRecordsPaged(filter?: ROAStatFilter): PageIterator<ROAStat> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ stats?: ROAStat[]; nextPageToken?: string }>(
        buildPath("roa-stats", query),
      );
      return { items: data.stats ?? [], nextPageToken: data.nextPageToken };
    });
  }
}
