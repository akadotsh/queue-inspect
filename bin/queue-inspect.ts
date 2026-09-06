#!/usr/bin/env bun

import packageJson from "../package.json" with { type: "json" };

const args = new Set(Bun.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Queue Inspect

Inspect and manage BullMQ queues from your terminal.

Usage:
  queue-inspect
  queue-inspect --help
  queue-inspect --version

Queue Inspect prompts for a Redis URL when it starts. Redis commonly listens at
redis://localhost:6379.`);
} else if (args.has("--version") || args.has("-v")) {
  console.log(packageJson.version);
} else {
  await import("../ui/index");
}
