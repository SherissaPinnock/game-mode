import type { Question } from '../types'

export const questions: Question[] = [
  // ─── Easy ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    question: 'What is the default HTTP port Grafana listens on?',
    options: ['80', '8080', '3000', '9090'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 2,
    question: 'PromQL stands for?',
    options: [
      'Prometheus Query Language',
      'Prometheus Quick Log',
      'Protocol Query Layer',
      'Proxy Query Language',
    ],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    id: 3,
    question: 'Which PromQL function calculates the per-second rate of a counter over a time range?',
    options: ['delta()', 'rate()', 'increase()', 'deriv()'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 4,
    question: 'What does a Prometheus `up` metric value of 0 indicate?',
    options: ['Target is healthy', 'Scrape succeeded', 'Target is unreachable', 'Metric is deprecated'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 5,
    question: 'In Grafana, what is a "panel"?',
    options: [
      'A settings page',
      'A single visualization unit on a dashboard',
      'A data source connection',
      'A user role',
    ],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 6,
    question: 'Which Prometheus metric type can only increase (or reset to zero)?',
    options: ['Gauge', 'Histogram', 'Summary', 'Counter'],
    correctIndex: 3,
    difficulty: 'easy',
  },
  {
    id: 7,
    question: 'What is Loki\'s primary role in the Grafana LGTM stack?',
    options: ['Metrics storage', 'Log aggregation', 'Distributed tracing', 'Alert routing'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 8,
    question: 'Which PromQL function returns the total increase of a counter over a time window (not a per-second rate)?',
    options: ['rate()', 'delta()', 'increase()', 'resets()'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 9,
    question: 'Which Grafana panel type is best for displaying a single current value prominently?',
    options: ['Time series', 'Bar gauge', 'Stat', 'Histogram'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 10,
    question: 'What does `sum(metric)` do in PromQL?',
    options: [
      'Counts the number of series',
      'Sums all values across all matching series',
      'Returns the maximum value',
      'Computes the average',
    ],
    correctIndex: 1,
    difficulty: 'easy',
  },

  // ─── Medium ─────────────────────────────────────────────────────────────────
  {
    id: 11,
    question: 'What does `increase(http_requests_total[5m])` return?',
    options: [
      'Average requests per second over 5 min',
      'Total new requests over the last 5 minutes',
      'Peak requests/s in the 5 min window',
      'Number of unique request paths',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 12,
    question: 'How does `irate()` differ from `rate()` in PromQL?',
    options: [
      'irate works on gauges, rate on counters',
      'irate uses only the last 2 data points for an instant rate',
      'irate extrapolates beyond the scrape range',
      'irate requires a histogram metric',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 13,
    question: 'What is Tempo\'s role in the Grafana observability stack?',
    options: ['Metrics aggregation', 'Log searching', 'Distributed tracing backend', 'Alert routing'],
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 14,
    question: 'What does `absent(up{job="api"})` return when the target IS running?',
    options: ['1', '0', 'Empty / no result', 'The current uptime value'],
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 15,
    question: '`histogram_quantile(0.99, rate(http_duration_seconds_bucket[5m]))` computes?',
    options: [
      'Average request latency',
      'Maximum latency spike',
      '99th percentile request duration',
      'Total request count',
    ],
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 16,
    question: 'What is a Prometheus recording rule used for?',
    options: [
      'Sending email alerts',
      'Pre-computing expensive queries as a new stored metric',
      'Defining scrape intervals',
      'Setting data retention policy',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 17,
    question: 'What does the `by (job)` clause do in `sum(metric) by (job)`?',
    options: [
      'Filters series to only those with a job label',
      'Keeps the job label, sums everything else away',
      'Sorts the output by job name',
      'Takes the max per job',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 18,
    question: 'What is Alertmanager primarily responsible for?',
    options: [
      'Evaluating alert rules against Prometheus data',
      'Scraping metric targets',
      'Deduplication, grouping, and routing of alerts',
      'Storing raw metric data',
    ],
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 19,
    question: 'In Grafana, a dashboard variable like `$namespace` allows you to?',
    options: [
      'Set a static label filter compile-time',
      'Dynamically filter panels across the whole dashboard',
      'Create a new datasource',
      'Define a new recording rule',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 20,
    question: 'What is exemplar data in Prometheus?',
    options: [
      'A metric sample at a fixed time interval',
      'High-cardinality metadata (e.g. trace ID) attached to a specific metric observation',
      'A pre-computed aggregation rule',
      'A scrape timeout configuration',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 21,
    question: 'What does `label_replace(metric, "dst", "$1", "src", "(.*)")` do?',
    options: [
      'Deletes the src label',
      'Copies the src label value into dst using a regex capture',
      'Renames the metric itself',
      'Applies a constant string to dst',
    ],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 22,
    question: 'Prometheus\'s native storage format is best described as?',
    options: [
      'A distributed SQL database',
      'An in-memory key-value cache',
      'A local time-series database (TSDB)',
      'A columnar analytics engine',
    ],
    correctIndex: 2,
    difficulty: 'medium',
  },

  // ─── Hard ───────────────────────────────────────────────────────────────────
  {
    id: 23,
    question: 'High cardinality in Prometheus means?',
    options: [
      'Many data points stored over a long time range',
      'A large number of unique label value combinations for a single metric',
      'High memory usage from histogram buckets',
      'Many recording rules being evaluated simultaneously',
    ],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 24,
    question: 'Given only `instance` and `job` labels, are `sum without (instance)` and `sum by (job)` equivalent?',
    options: [
      'Yes — they produce the same result when only those two labels exist',
      'No — `without` always keeps more labels',
      'No — `by` only works on counters',
      'No — they differ in how they handle missing labels',
    ],
    correctIndex: 0,
    difficulty: 'hard',
  },
  {
    id: 25,
    question: 'What does Prometheus `remote_write` do?',
    options: [
      'Pulls metrics from a remote Prometheus instance',
      'Pushes local samples to a remote storage endpoint in real time',
      'Syncs alert rules to Alertmanager',
      'Copies dashboard configs to Grafana Cloud',
    ],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 26,
    question: 'How long after a Prometheus target stops being scraped does it enter the stale state?',
    options: ['1 minute', '2 minutes', '5 minutes', '10 minutes'],
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 27,
    question: 'What is the key conceptual difference between `delta()` and `increase()`?',
    options: [
      'delta is for counters; increase is for gauges',
      'delta measures the change in a gauge; increase measures the growth of a counter',
      'delta uses rate() internally; increase does not',
      'They are fully interchangeable',
    ],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 28,
    question: 'What is a Grafana Mixin in the jsonnet ecosystem?',
    options: [
      'A custom Grafana panel plugin written in Go',
      'A reusable, shareable set of dashboards, alerts, and recording rules for a technology',
      'A Grafana theme override file',
      'A datasource proxy configuration layer',
    ],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 29,
    question: 'The PromQL subquery syntax `rate(metric[5m:1m])` means?',
    options: [
      'Compute rate over 5 min sampled every second',
      'Instant rate at the 5-minute mark only',
      'Evaluate rate() over a 5-minute window with 1-minute resolution steps',
      '5 minute interval with a 1 minute lookback per step',
    ],
    correctIndex: 2,
    difficulty: 'hard',
  },
  {
    id: 30,
    question: 'What is Grafana Mimir?',
    options: [
      'A log shipper for Kubernetes pods',
      'A horizontally scalable, long-term Prometheus-compatible metrics backend',
      'A distributed tracing collector',
      'A Grafana frontend reverse proxy',
    ],
    correctIndex: 1,
    difficulty: 'hard',
  },
]

export function pickQuestions(count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const pool: Question[] = []
  while (pool.length < count) pool.push(...shuffled)
  return pool.slice(0, count)
}
