# Queue Inspect

Queue Inspect is a terminal interface for inspecting and managing BullMQ queues
in Redis.

## Features

- Connect to Redis and discover BullMQ queues.
- Browse, filter, and monitor queues and jobs with automatic refresh.
- View and set global queue concurrency.
- Search jobs by ID or name and inspect job details and logs.
- Add, delete, and retry jobs.
- Pause, resume, rate limit, clean, empty, or obliterate queues.

## Built with

- Bun and TypeScript
- React and OpenTUI
- BullMQ and Redis

## Requirements

- [Bun](https://bun.sh/) 1.4 or later.
- A running Redis instance containing the BullMQ queues you want to manage.

Redis commonly listens on port `6379`. Queue Inspect connects to Redis but does
not start or manage the Redis server itself. For a local, unsecured Redis
instance, use:

```text
redis://localhost:6379
```

Remote, authenticated, and TLS connections can be supplied as `redis://` or
`rediss://` URLs.

## Install from source

```sh
git clone https://github.com/akadotsh/tokai.git queue-inspect
cd queue-inspect
bun install
```

## Usage

Make sure Redis is running, then start Queue Inspect:

```sh
bun run start
```

Enter the Redis URL on the connection screen and press Enter. Queue Inspect
discovers BullMQ queues from that Redis instance automatically.

> [!CAUTION]
> Queue Inspect can modify queues and jobs. Cleaning, emptying, deleting, and
> obliterating data can be destructive, so verify the Redis connection before
> confirming those actions.

## Development

Install dependencies and run the application in watch mode:

```sh
bun install
bun run dev
```

Before submitting a change, run all project checks:

```sh
bun run lint
bun run typecheck
bun test
```

Linting uses Biome's recommended rules and enforces a maximum cognitive
complexity score of 15 per function.

## License

MIT
