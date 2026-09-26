#!/usr/bin/env bun

import packageJson from "../package.json" with { type: "json" };

const args = new Set(Bun.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Queue Inspect

Inspect BullMQ and RabbitMQ queues from your terminal.

Usage:
  queue-inspect
  queue-inspect --help
  queue-inspect --version

Queue Inspect accepts redis:// URLs for BullMQ and RabbitMQ Management API URLs
such as http://guest:guest@localhost:15672.`);
} else if (args.has("--version") || args.has("-v")) {
  console.log(packageJson.version);
} else {
  await import("../ui/index");
}
