# Scaling to 10,000 creators

10,000 registered creators is a modest workload for a stateless Node.js API
and managed MongoDB, provided reads and writes are bounded and monitored. Keep
the frontend and API horizontally scalable behind their hosting provider's
load balancer; JWT authentication already avoids server-side session affinity.

The current live-campaign list cache helps repeated public reads. Use a
managed Redis service shared by every API instance, keep the cache short-lived,
and invalidate it after campaign creation and payout changes. Add cache hit,
Redis availability, API latency, and MongoDB query metrics so cache failures
or slow queries are visible. Redis should remain an optimization, not the
source of truth.

Add cursor pagination before campaign or submission collections grow
substantially. Ensure indexes support the actual filters and sort order:
campaign live/budget/creation-time queries, submissions by creator and
creation time, and the existing unique campaign/post URL constraint. Review
MongoDB query plans and connection-pool sizes under load instead of increasing
limits speculatively.

Payout correctness is more important than raw throughput. Keep the atomic
campaign-budget condition and transaction so concurrent creators cannot
overspend a campaign. A very popular campaign may become a write hotspot;
measure transaction conflicts and retries, then consider queuing payout
updates per campaign if they become material. Never cache budget balances as
authoritative data.

Load-test expected peak traffic, set request/body limits and rate limits, and
alert on error rates, transaction failures, database saturation, and Redis
fallbacks. These steps scale the existing design without changing payout
semantics; actual capacity should be confirmed against measured usage and the
selected MongoDB and Redis plans.
