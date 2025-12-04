// src/tracing.js
'use strict';

// src/tracing.js
'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const { resourceFromAttributes } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

const serviceName = process.env.OTEL_SERVICE_NAME || 'otel-node-demo';
const serviceVersion = process.env.npm_package_version || '0.0.0';

const jaegerEndpoint =
  process.env.OTEL_EXPORTER_JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';

const traceExporter = new JaegerExporter({ endpoint: jaegerEndpoint });

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
  }),
});

const startResult = sdk.start();

if (startResult && typeof startResult.then === 'function') {
  startResult
    .then(() => console.log(`[otel] tracing initialized: service=${serviceName} endpoint=${jaegerEndpoint}`))
    .catch((err) => console.error('[otel] failed to start', err));
} else {
  console.log(`[otel] tracing initialized: service=${serviceName} endpoint=${jaegerEndpoint}`);
}


process.on('SIGTERM', async () => { await sdk.shutdown(); process.exit(0); });
process.on('SIGINT', async () => { await sdk.shutdown(); process.exit(0); });

