# Observability Assignment (OpenTelemetry + Node + Express + Mongo + Jaeger)

## Overview
This repo demonstrates distributed tracing with OpenTelemetry in a Node.js + Express service that calls MongoDB, exporting traces to Jaeger.

## Prereqs
- Node.js + npm
- Docker (running)

## Run Jaeger + Mongo
bash
docker compose up -d


## Run the app on port 3031 (local)

## Set environment variables and start the server:

export PORT=3031
export OTEL_SERVICE_NAME="otel-node-demo"
export OTEL_EXPORTER_JAEGER_ENDPOINT="http://localhost:14268/api/traces"
export MONGODB_URI="mongodb://localhost:27017/otel_demo"

npm start


## Server should be available at:

http://localhost:3031

## Generate sample traffic (creates traces)

curl http://localhost:3031/ping

curl "http://localhost:3031/slow?ms=400"

curl -X POST http://localhost:3031/items \
  -H "content-type: application/json" \
  -d '{"name":"apple"}'

curl http://localhost:3031/items


## View traces in Jaeger

### Open Jaeger UI: http://localhost:16686

Select service: otel-node-demo

Click Find Traces

GET /ping

GET /slow (includes custom/manual span)

POST /items and GET /items (includes MongoDB spans)
