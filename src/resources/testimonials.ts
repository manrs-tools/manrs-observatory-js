import type { Testimonial, TestimonialFilter } from "../../models";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class TestimonialsResource extends BaseResource {
  /** Return all testimonials matching the filter. */
  async find(filter?: TestimonialFilter): Promise<Testimonial[]> {
    const data = await this.http.get<{ testimonials?: Testimonial[] }>(
      buildPath("testimonials", toQueryString(filter)),
    );
    return data.testimonials ?? [];
  }

  /** Return a paginated iterator over testimonials. */
  findPaged(filter?: TestimonialFilter): PageIterator<Testimonial> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ testimonials?: Testimonial[]; nextPageToken?: string }>(
        buildPath("testimonials", query),
      );
      return { items: data.testimonials ?? [], nextPageToken: data.nextPageToken };
    });
  }
}
