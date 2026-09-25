import type { RequestExecutor } from "../http";

export abstract class BaseResource {
  constructor(protected readonly http: RequestExecutor) {}
}
