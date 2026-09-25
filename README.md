# MANRS Observatory JavaScript SDK

[![Build](https://github.com/manrs-tools/manrs-observatory-js/actions/workflows/build.yml/badge.svg)](https://github.com/manrs-tools/manrs-observatory-js/actions/workflows/build.yml)
[![Test](https://github.com/manrs-tools/manrs-observatory-js/actions/workflows/test.yml/badge.svg)](https://github.com/manrs-tools/manrs-observatory-js/actions/workflows/test.yml)
[![Node](https://img.shields.io/badge/node-24%2B-339933?logo=node.js&logoColor=white)](package.json)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

TypeScript/JavaScript SDK for the [MANRS Observatory](https://observatory.manrs.org) API, the platform that tracks [MANRS](https://www.manrs.org) (Mutually Agreed Norms for Routing Security) participant conformance, ASN scoring, RPKI/ROA validation, and routing security incidents.

This is the public SDK: it covers every publicly available Observatory endpoint (autonomous systems, participants, ROAs, stats, tickets, and more). It's used the same way whether you're building tooling around your own participant data or just querying public Observatory data.

Ships as dual ESM/CJS with TypeScript declarations, and has no runtime dependencies.

**Useful links:**

- [API reference](https://observatory.manrs.org/api/v2/docs)
- [MANRS documentation](https://docs.manrs.org/)

## Requirements

- Node.js 24+, or any environment providing a `fetch`-compatible implementation (browsers, Deno, Bun, Cloudflare Workers). No polyfill is bundled; see the `fetch` [client option](#client-options) to supply your own.
- An Observatory API key (see [Authentication](#authentication)).

## Installation

```bash
npm install manrs-observatory
```

Or install directly from GitHub:

```bash
npm install github:manrs-tools/manrs-observatory-js
```

Installing from GitHub runs the package's `prepare` script, which builds `dist/` (ESM, CJS, and type declarations), so no extra setup is needed.

## Authentication

All requests require an API key. You can obtain one by logging in:

```ts
import { Client } from "manrs-observatory";

const client = new Client();
const key = await client.auth.login("you@example.com", "your-password");
client.setApiKey(key.key!);
```

Or pass a key directly if you already have one:

```ts
const client = new Client({ apiKey: "your-api-key" });
```

Long-lived keys can be minted and rotated through [`client.keys`](#resource-coverage) once you're authenticated.

## Quick start

```ts
import { Client, ParticipantStatusApproved } from "manrs-observatory";

const client = new Client({ apiKey: "your-api-key" });

const participants = await client.participants.find({
  status: ParticipantStatusApproved,
  limit: 10,
});
for (const p of participants) {
  console.log(`${p.name} (${p.id}): ASNs=${p.asns}`);
}
```

## SDK guide

Everything is exported from the package root: the `Client`, the `ManrsError` type, the `PageIterator`, and every request/response type and constant. There are no subpath imports to remember.

### Client options

```ts
new Client({
  apiKey: "your-api-key", // sent as `Authorization: Bearer <apiKey>`
  baseUrl: "...", // override the API base URL (defaults to production)
  timeoutMs: 30_000, // per-request timeout
  retries: 3, // retry attempts for idempotent requests on network errors or 502/503/504
  debug: false, // log request/response info to stderr
  fetch: myFetch, // custom fetch implementation (defaults to the global fetch)
});
```

`client.setApiKey(key)` and `client.setTimeout(ms)` update an existing client in place. `client.getVersion()` returns the API server's version string, which is handy as a connectivity check.

> **Note:** `debug: true` logs full request and response details with sensitive fields (`password`, `apiKey`, `key`, `token`, `secret`) masked as `***REDACTED***`. All other payload data is logged verbatim, so still avoid enabling it where logs are broadly accessible.

### Filtering

Every `find`/`findPaged` method takes a plain filter object, serialized into query parameters automatically: arrays are comma-joined (`explode: false` semantics, matching the OpenAPI spec), `Date` values are encoded as ISO 8601, booleans as `"true"`/`"false"`, and `undefined`/`null` fields are omitted entirely. Passing no filter sends no query parameters.

```ts
const ases = await client.ases.find({ economies: ["US", "CA"], limit: 50 });
// GET /ases?economies=US%2CCA&limit=50
```

Filter shapes are typed (`ASFilter`, `ParticipantFilter`, `TicketFilter`, …), so a misspelled or unsupported field is a compile error rather than a silently ignored query parameter.

Two parameter formats are easy to get wrong. `month` and `reportMonth` query parameters are RFC 3339 timestamps (`"2026-05-01T00:00:00Z"`); the time component is ignored, and a bare `"2026-05"` is rejected with a 422. Note that `stats.filters()` returns months as `"2026-05"`, so append `-01T00:00:00Z` before passing one back. `region` parameters are lowercase slugs (`arin`, `europe`, `central-asia`); any other casing is silently ignored and the response covers every region.

### Pagination

Every listing method has a corresponding `findPaged` variant returning a `PageIterator`, which is both an async iterable and exposes `.toArray()`. Pages are fetched lazily as you consume items, so you never manage page tokens manually.

```ts
// Iterate over every approved participant across all pages
for await (const p of client.participants.findPaged({ status: "approved" })) {
  console.log(p.name);
}
```

**Stop early** without fetching unnecessary pages:

```ts
import type { ROA } from "manrs-observatory";

const firstFifty: ROA[] = [];
for await (const roa of client.roas.findPaged()) {
  firstFifty.push(roa);
  if (firstFifty.length >= 50) break;
}
```

**Collect into an array**, optionally capped:

```ts
const all = await client.participants.findPaged().toArray();
const firstFifty = await client.roas.findPaged().toArray(50);
```

### Error handling

All API errors throw `ManrsError`, which carries the HTTP status code and the full response body, with no separate error type to unwrap:

```ts
import { Client, ManrsError } from "manrs-observatory";

const client = new Client({ apiKey: "your-api-key" });

try {
  const p = await client.participants.get("unknown-id");
} catch (err) {
  if (err instanceof ManrsError) {
    console.log(err.message); // human-readable message
    console.log(err.statusCode); // e.g. 404
    console.log(err.body); // full JSON response body
  }
}
```

Some endpoints and fields are gated server-side by the role on the account behind your API key; a request your key isn't authorized for comes back as a `ManrsError` with a 401 or 403 status.

### Constants

Fields the API defines as enumerations have named constants, so you don't have to hardcode wire strings:

```ts
import {
  ParticipantStatusApproved,
  ParticipantTypeNetOps,
  TicketStatusOpen,
  TicketPriorityHigh,
  FeedbackTypeLegitimateUpdate,
  UserRoleParticipant,
  MetricTypeM1,
} from "manrs-observatory";
```

Participant statuses and types, ticket queues/types/priorities/statuses, incident feedback types, user roles and statuses, and MANRS metric types are all covered.

## Basic usage

### Participants

```ts
import { Client, ParticipantStatusApproved, ParticipantTypeNetOps } from "manrs-observatory";

const client = new Client({ apiKey: "your-api-key" });

// List approved network operators
const participants = await client.participants.find({
  type: ParticipantTypeNetOps,
  status: ParticipantStatusApproved,
  limit: 20,
});
for (const p of participants) {
  console.log(p.name, p.asns);
}

// Fetch one by ID
const p = await client.participants.get("participant-id");
console.log(p.name, p.status);

// Fetch one with its action declaration, member users, invites and testimonial
const details = await client.participants.getDetails("participant-id");
console.log(details.users?.length, details.pendingASNs);

// The public "MANRS Participant" badge as an SVG document; no API key required.
// Participants that are not yet approved get a blank 1x1 placeholder.
const svg = await client.participants.badge("participant-id", { layout: "card", style: "dark" });
```

### Autonomous Systems

```ts
const client = new Client({ apiKey: "your-api-key" });

// Fetch a single AS by ASN
const as = await client.ases.get(13335);
console.log(as.name, as.region, as.rir);

// List ASes filtered by economy
const ases = await client.ases.find({ economies: ["US"], limit: 50 });

// Per-ASN MANRS score breakdown
const scores = await client.ases.scores({ asns: [13335] });

// Detailed scores for one ASN, and the six months of category scores behind them
const detail = await client.ases.scoresDetailed({ asn: 13335 });
const history = await client.ases.scoreHistory({ asn: 13335 });

// Routing incidents for an ASN
const incidents = await client.ases.incidents({ asns: [13335] });
```

### Route Origin Authorizations (ROAs)

```ts
const client = new Client({ apiKey: "your-api-key" });

// ROAs for an ASN
const roas = await client.roas.find({ asns: [13335] });
for (const roa of roas) {
  console.log(roa.ipPrefix, roa.maxLength, roa.notAfter);
}

// Aggregate ROA stats
const stats = await client.roas.stats({ asn: 13335 });
console.log(stats.entity.label, stats.entity.value);
```

### Statistics and dashboard

```ts
const client = new Client({ apiKey: "your-api-key" });

// Dashboard summary for a region (lowercase slug: an RIR, UN region or UN sub-region)
const summary = await client.stats.summary({ region: "arin" });
console.log("Misoriginations:", summary.incidents.routeMisoriginations);
console.log(`RPKI valid: ${summary.rpki.valid}/${summary.rpki.total}`);

// Observatory-wide monthly overview
const overview = await client.stats.overview();

// Historical score data for an ASN
const history = await client.stats.history({ asns: "13335" });

// Which report months have data
const { dataRange, incompleteMonths } = await client.stats.filters();

// Every dashboard filter control at once: dates, selectable ASes, geo data, MANRS scopes
const filters = await client.stats.dashboardFilters({ month: "2026-05-01T00:00:00Z", type: "economy" });

// Compare a baseline selection against alternative scenarios; scenario IDs must be UUIDs
const baseline = { timeRange: { start: "2026-03", duration: 6 }, geo: { type: "economy", selection: ["NL"] } };
const alternative = { timeRange: { start: "2026-03", duration: 6 }, geo: { type: "economy", selection: ["DE"] } };
const groups = await client.stats.comparison(baseline, [{ id: crypto.randomUUID(), selection: alternative }]);
```

### Incident feedback

```ts
import { Client, FeedbackTypeLegitimateUpdate } from "manrs-observatory";

const client = new Client({ apiKey: "your-api-key" });

// Submit feedback on a routing incident
const feedback = await client.incidentFeedback.create({
  incidentID: "incident-id",
  reportMonth: "2024-01",
  asn: 13335,
  feedbackType: FeedbackTypeLegitimateUpdate,
  cleared: false,
  comment: "Planned route change, not a hijack.",
});

// List feedback for an incident
for (const f of await client.incidentFeedback.find({ incidentID: "incident-id" })) {
  console.log(f.id, f.feedbackType, f.comment);
}
```

### Tickets

```ts
import {
  Client,
  TicketTypeTicket,
  TicketQueueGeneral,
  TicketPriorityMedium,
  TicketStatusOpen,
  TicketStatusClosed,
} from "manrs-observatory";

const client = new Client({ apiKey: "your-api-key" });

// Create a ticket
const ticket = await client.tickets.create({
  subject: "Routing issue with AS65001",
  type: TicketTypeTicket,
  queue: TicketQueueGeneral,
  priority: TicketPriorityMedium,
  status: TicketStatusOpen,
});

// List open tickets
for (const t of await client.tickets.find({ status: [TicketStatusOpen] })) {
  console.log(t.id, t.subject);
}

// Reply to a ticket
await client.tickets.createReply({
  ticketID: ticket.id!,
  message: "We are investigating.",
});

// Close a ticket
await client.tickets.update(ticket.id!, { status: TicketStatusClosed });
```

## Development

```bash
npm install     # install dependencies
npm run build   # build ESM + CJS output and type declarations to dist/
npm run dev     # rebuild on change
npm test        # run the vitest suite
npm run typecheck
```

Tests mock HTTP at the `fetch` boundary, so the suite runs offline and never touches the live API.

Model types under [`models/`](models/) are generated from the Observatory's OpenAPI schema; treat them as generated output rather than editing them by hand.

## License

[Apache-2.0](LICENSE) © Global Cyber Alliance
