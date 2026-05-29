import { SorobanRpc, Contract } from "@stellar/stellar-sdk";
import { config } from "./config";
import {
  getLastCursor,
  insertEvents,
  updateCursor,
  StoredEvent,
} from "./db";
import { parseRawEvent, ParsedEvent } from "./parser";

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 10_000;

let running = true;
let shutdownForced = false;

/**
 * Convert a ParsedEvent to a StoredEvent for database insertion.
 */
function toStoredEvent(parsed: ParsedEvent): StoredEvent {
  return {
    contract_id: parsed.contractId,
    topic_1: parsed.topic1,
    topic_2: parsed.topic2,
    event_name: parsed.eventName,
    event_topics: parsed.eventTopics,
    event_data: parsed.data,
    ledger: parsed.ledger,
    timestamp: parsed.timestamp,
    cursor: parsed.cursor,
  };
}

/**
 * Build the event filters for the getEvents request.
 * Each contract ID gets its own filter entry.
 */
function buildFilters(
  contractIds: string[]
): SorobanRpc.Api.EventFilter[] {
  return contractIds.map((id) => ({
    type: "contract" as const,
    contractIds: [id],
  }));
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a value between min and max (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Fetch and process a batch of events from Soroban RPC.
 * Returns the number of events processed.
 */
async function pollEvents(
  server: SorobanRpc.Server,
  contractIds: string[],
  lastCursor: string | null,
  lastLedger: number | null
): Promise<{ eventsProcessed: number; newCursor: string | null; newLedger: number | null }> {
  const filters = buildFilters(contractIds);

  const requestParams: SorobanRpc.Server.GetEventsRequest = {
    filters,
    limit: 100,
  };

  // Use cursor if available, otherwise fall back to startLedger
  if (lastCursor) {
    requestParams.cursor = lastCursor;
  } else {
    requestParams.startLedger = lastLedger || 1;
  }

  const response = await server.getEvents(requestParams);
  const events = response.events || [];

  if (events.length === 0) {
    return { eventsProcessed: 0, newCursor: lastCursor, newLedger: lastLedger };
  }

  const parsedEvents: ParsedEvent[] = events.map((event) => {
    let contractId = "";
    if (event.contractId) {
      contractId =
        event.contractId instanceof Contract
          ? event.contractId.contractId()
          : String(event.contractId);
    }
    return parseRawEvent({
      contractId,
      topic: event.topic,
      value: event.value,
      ledger: event.ledger,
      pagingToken: event.pagingToken,
    });
  });

  const storedEvents = parsedEvents.map(toStoredEvent);
  await insertEvents(storedEvents);

  const lastEvent = parsedEvents[parsedEvents.length - 1];
  const newCursor = lastEvent.cursor;
  const newLedger = lastEvent.ledger;

  if (newCursor) {
    await updateCursor(newCursor, newLedger);
  }

  for (const parsed of parsedEvents) {
    const eventName = parsed.eventName || `${parsed.topic1}:${parsed.topic2}`;
    console.log(
      `[Ledger ${parsed.ledger}] ${eventName} from ${parsed.contractId}`
    );
  }

  return { eventsProcessed: events.length, newCursor, newLedger };
}

/**
 * Compute the next adaptive poll interval.
 *
 * When events were found in the last poll the interval resets to the configured
 * minimum so the listener stays responsive during bursts of activity.
 *
 * When no events are found the interval grows by `backoffFactor` up to
 * `maxIntervalMs` to avoid burning RPC budget during idle periods.
 *
 * @param currentIntervalMs  The interval used for the poll that just completed.
 * @param eventsFound        Whether at least one event was returned.
 * @param minIntervalMs      Lower bound (active / fast polling).
 * @param maxIntervalMs      Upper bound (idle / slow polling).
 * @param backoffFactor      Multiplicative step applied on an empty poll.
 * @returns Next interval in milliseconds.
 */
export function computeNextInterval(
  currentIntervalMs: number,
  eventsFound: boolean,
  minIntervalMs: number,
  maxIntervalMs: number,
  backoffFactor: number
): number {
  if (eventsFound) {
    // Reset to fast polling immediately when activity is detected.
    return minIntervalMs;
  }

  // Grow interval exponentially, capped at the maximum.
  const next = currentIntervalMs * backoffFactor;
  return clamp(Math.round(next), minIntervalMs, maxIntervalMs);
}

/**
 * Main event listener loop.
 * Polls the Soroban RPC for contract events and stores them in the database.
 * Uses adaptive polling: the interval shrinks when events are found and grows
 * when the chain is idle, avoiding wasted RPC calls.
 */
export async function startListener(): Promise<void> {
  const {
    sorobanRpcUrl,
    contractIds,
    minPollIntervalMs,
    maxPollIntervalMs,
    pollBackoffFactor,
  } = config;

  if (contractIds.length === 0) {
    console.error(
      "No contract IDs configured. Cannot start event listener."
    );
    return;
  }

  const server = new SorobanRpc.Server(sorobanRpcUrl);
  console.log(`Connecting to Soroban RPC at ${sorobanRpcUrl}`);
  console.log(`Watching ${contractIds.length} contract(s)`);
  console.log(
    `Adaptive polling: min=${minPollIntervalMs}ms  max=${maxPollIntervalMs}ms  backoff=${pollBackoffFactor}x`
  );

  // Load last cursor from DB
  let { cursor: lastCursor, lastLedger } = await getLastCursor();

  if (lastCursor) {
    console.log(`Resuming from cursor: ${lastCursor} (ledger ${lastLedger})`);
  } else {
    console.log("No previous cursor found. Starting from the beginning.");
  }

  let consecutiveErrors = 0;
  // Start at the minimum interval so we catch early events quickly.
  let currentPollIntervalMs = minPollIntervalMs;

  while (running) {
    try {
      const result = await pollEvents(server, contractIds, lastCursor, lastLedger);

      if (result.eventsProcessed > 0) {
        console.log(`Processed ${result.eventsProcessed} event(s)`);
        lastCursor = result.newCursor;
        lastLedger = result.newLedger;
      }

      // Reset error backoff on success.
      consecutiveErrors = 0;

      // Compute next adaptive poll interval and log when it changes.
      const nextInterval = computeNextInterval(
        currentPollIntervalMs,
        result.eventsProcessed > 0,
        minPollIntervalMs,
        maxPollIntervalMs,
        pollBackoffFactor
      );

      if (nextInterval !== currentPollIntervalMs) {
        const direction = nextInterval > currentPollIntervalMs ? "backing off" : "resuming fast poll";
        console.log(
          `[adaptive-poll] ${direction}: ${currentPollIntervalMs}ms → ${nextInterval}ms`
        );
        currentPollIntervalMs = nextInterval;
      }

      await sleep(currentPollIntervalMs);
    } catch (err) {
      consecutiveErrors++;
      const backoffMs = Math.min(
        BASE_BACKOFF_MS * Math.pow(2, consecutiveErrors - 1),
        MAX_BACKOFF_MS
      );

      console.error(
        `Error polling events (attempt ${consecutiveErrors}, retrying in ${backoffMs}ms):`,
        err instanceof Error ? err.message : err
      );

      await sleep(backoffMs);
    }
  }

  console.log("Event listener stopped.");
}

/**
 * Request a graceful shutdown of the listener loop.
 */
export function stopListener(): void {
  running = false;
}

/**
 * Wait for in-flight events to complete, then resolve.
 */
export async function waitForCompletion(): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (!running || shutdownForced) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      shutdownForced = true;
      resolve();
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
  });
}

/**
 * Handle process signals for graceful shutdown.
 */
export function setupSignalHandlers(): void {
  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    stopListener();
    await waitForCompletion();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("Received SIGINT, shutting down gracefully...");
    stopListener();
    await waitForCompletion();
    process.exit(0);
  });
}
