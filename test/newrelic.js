'use strict';

exports.config = {
  app_name: ['NEXUS Support System'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  },
  browser_monitoring: {
    enabled: true
  },
  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
    stack_trace_threshold: 50,
    explain_enabled: true,
    explain_threshold: 500
  },
  error_collector: {
    enabled: true,
    capture_source: true
  },
  browser_monitoring: {
    enabled: true
  },
  apdex_t: 0.5,
  capture_params: true,
  attributes: {
    enabled: true,
    exclude: [
      'password',
      'secret',
      'token',
      'key'
    ]
  }
};
