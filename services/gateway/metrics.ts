import { Logger } from './logger.js';

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface CounterMetric {
  name: string;
  help: string;
  labels?: Record<string, string>;
  increment(value?: number): void;
}

export interface GaugeMetric {
  name: string;
  help: string;
  labels?: Record<string, string>;
  set(value: number): void;
  increment(value?: number): void;
  decrement(value?: number): void;
}

export interface HistogramMetric {
  name: string;
  help: string;
  labels?: Record<string, string>;
  buckets?: number[];
  observe(value: number): void;
}

export class MetricsRegistry {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  createCounter(
    name: string,
    help: string,
    labels: Record<string, string> = {}
  ): CounterMetric {
    const key = this.getMetricKey(name, labels);
    if (this.counters.has(key)) {
      throw new Error(`Counter ${name} with labels already exists`);
    }

    const counter = new Counter(name, help, labels, this.logger);
    this.counters.set(key, counter);
    return counter;
  }

  createGauge(
    name: string,
    help: string,
    labels: Record<string, string> = {}
  ): GaugeMetric {
    const key = this.getMetricKey(name, labels);
    if (this.gauges.has(key)) {
      throw new Error(`Gauge ${name} with labels already exists`);
    }

    const gauge = new Gauge(name, help, labels, this.logger);
    this.gauges.set(key, gauge);
    return gauge;
  }

  createHistogram(
    name: string,
    help: string,
    options: {
      labels?: Record<string, string>;
      buckets?: number[];
    } = {}
  ): HistogramMetric {
    const key = this.getMetricKey(name, options.labels || {});
    if (this.histograms.has(key)) {
      throw new Error(`Histogram ${name} with labels already exists`);
    }

    const histogram = new Histogram(
      name,
      help,
      options.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      options.labels || {},
      this.logger
    );
    this.histograms.set(key, histogram);
    return histogram;
  }

  getCounter(name: string, labels: Record<string, string> = {}): CounterMetric {
    const key = this.getMetricKey(name, labels);
    const counter = this.counters.get(key);
    if (!counter) {
      throw new Error(`Counter ${name} with labels does not exist`);
    }
    return counter;
  }

  getGauge(name: string, labels: Record<string, string> = {}): GaugeMetric {
    const key = this.getMetricKey(name, labels);
    const gauge = this.gauges.get(key);
    if (!gauge) {
      throw new Error(`Gauge ${name} with labels does not exist`);
    }
    return gauge;
  }

  getHistogram(name: string, labels: Record<string, string> = {}): HistogramMetric {
    const key = this.getMetricKey(name, labels);
    const histogram = this.histograms.get(key);
    if (!histogram) {
      throw new Error(`Histogram ${name} with labels does not exist`);
    }
    return histogram;
  }

  // Export metrics for Prometheus scraping
  exportMetrics(): string {
    const timestamp = Date.now();
    let output = '# HELP and TYPE definitions\n';

    // Export counters
    for (const counter of this.counters.values()) {
      const labelsStr = this.formatLabels(counter.labels);
      output += `# HELP ${counter.name} ${counter.help}\n`;
      output += `# TYPE ${counter.name} counter\n`;
      output += `${counter.name}${labelsStr} ${(counter as Counter).value} ${timestamp}\n\n`;
    }

    // Export gauges
    for (const gauge of this.gauges.values()) {
      const labelsStr = this.formatLabels(gauge.labels);
      output += `# HELP ${gauge.name} ${gauge.help}\n`;
      output += `# TYPE ${gauge.name} gauge\n`;
      output += `${gauge.name}${labelsStr} ${(gauge as Gauge).value} ${timestamp}\n\n`;
    }

    // Export histograms
    for (const histogram of this.histograms.values()) {
      const labelsStr = this.formatLabels(histogram.labels);
      output += `# HELP ${histogram.name} ${histogram.help}\n`;
      output += `# TYPE ${histogram.name} histogram\n`;

      // Count and sum
      output += `${histogram.name}_count${labelsStr} ${(histogram as Histogram).count} ${timestamp}\n`;
      output += `${histogram.name}_sum${labelsStr} ${(histogram as Histogram).sum} ${timestamp}\n`;

      // Buckets
      for (let i = 0; i < (histogram as Histogram).buckets.length; i++) {
        const bucketValue = (histogram as Histogram).bucketValues[i];
        const bucketLabel = `${this.formatLabels(histogram.labels)},le="${(histogram as Histogram).buckets[i] === Infinity ? '+Inf' : (histogram as Histogram).buckets[i]}"`;
        output += `${histogram.name}_bucket${bucketLabel} ${bucketValue} ${timestamp}\n`;
      }
      output += '\n';
    }

    return output;
  }

  private getMetricKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.keys(labels)
      .sort()
      .map(key => `${key}=${labels[key]}`)
      .join(',');
    return `${name}{${sortedLabels}}`;
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const formatted = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    return `{${formatted}}`;
  }
}

class Counter implements CounterMetric {
  public value = 0;

  constructor(
    public name: string,
    public help: string,
    public labels: Record<string, string>,
    private logger: Logger
  ) {}

  increment(value = 1): void {
    this.value += value;
  }
}

class Gauge implements GaugeMetric {
  public value = 0;

  constructor(
    public name: string,
    public help: string,
    public labels: Record<string, string>,
    private logger: Logger
  ) {}

  set(value: number): void {
    this.value = value;
  }

  increment(value = 1): void {
    this.value += value;
  }

  decrement(value = 1): void {
    this.value -= value;
  }
}

class Histogram implements HistogramMetric {
  public count = 0;
  public sum = 0;
  public bucketValues: number[] = [];

  constructor(
    public name: string,
    public help: string,
    public buckets: number[],
    public labels: Record<string, string>,
    private logger: Logger
  ) {
    this.bucketValues = new Array(buckets.length + 1).fill(0); // +1 for +Inf bucket
  }

  observe(value: number): void {
    this.count++;
    this.sum += value;

    // Update buckets
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        this.bucketValues[i]++;
      }
    }
    // Always increment the +Inf bucket
    this.bucketValues[this.buckets.length]++;
  }
}

// Default metrics registry
export const metricsRegistry = new MetricsRegistry(new Logger());

// Pre-defined metrics
export const requestCounter = metricsRegistry.createCounter(
  'gateway_requests_total',
  'Total number of requests processed by the gateway',
  { method: 'all', status: 'all' }
);

export const requestDuration = metricsRegistry.createHistogram(
  'gateway_request_duration_seconds',
  'Duration of requests processed by the gateway',
  {
    buckets: [0.1, 0.5, 1, 2, 5],
  }
);

export const toolExecutionCounter = metricsRegistry.createCounter(
  'gateway_tool_executions_total',
  'Total number of tool executions',
  { tool: 'all', namespace: 'all', status: 'all' }
);

export const activeServers = metricsRegistry.createGauge(
  'gateway_active_servers',
  'Number of actively running server processes',
  { namespace: 'all' }
);

export const cacheHits = metricsRegistry.createCounter(
  'gateway_cache_hits_total',
  'Total number of cache hits',
  { cache_type: 'all' }
);

export const cacheMisses = metricsRegistry.createCounter(
  'gateway_cache_misses_total',
  'Total number of cache misses',
  { cache_type: 'all' }
);

// Health endpoint metrics
export const healthCounter = metricsRegistry.createCounter(
  'gateway_health_requests_total',
  'Total number of health check requests',
  { namespace: 'all', tool: 'all', status: 'all' }
);

// Rate limit metrics
export const rateLimitHits = metricsRegistry.createCounter(
  'gateway_rate_limit_hits',
  'Number of times rate limits were hit',
  { namespace: 'all', tool: 'all' }
);
