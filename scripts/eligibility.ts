export const LOCATION_ELIGIBILITY_STATUSES = [
  "open_remote",
  "local",
  "location_exception_candidate",
  "hard_location_block",
  "unclear",
] as const;

export type LocationEligibilityStatus = (typeof LOCATION_ELIGIBILITY_STATUSES)[number];

export interface LocationEligibility {
  status: LocationEligibilityStatus;
  reason?: string;
}

export interface Eligibility {
  location?: LocationEligibility;
}

export function isLocationEligibilityStatus(value: string): value is LocationEligibilityStatus {
  return (LOCATION_ELIGIBILITY_STATUSES as readonly string[]).includes(value);
}

export function normalizeEligibility(input: unknown): Eligibility | undefined {
  if (input === undefined || input === null || typeof input !== "object") return undefined;
  const raw = input as { location?: { status?: unknown; reason?: unknown } };
  if (raw.location === undefined || raw.location === null) return undefined;

  const status = raw.location.status;
  if (typeof status !== "string" || !isLocationEligibilityStatus(status)) {
    throw new Error(
      `eligibility.location.status must be one of ${LOCATION_ELIGIBILITY_STATUSES.join(", ")}, got ${JSON.stringify(status)}`
    );
  }

  const reason = typeof raw.location.reason === "string" ? raw.location.reason.trim() : "";
  return { location: reason ? { status, reason } : { status } };
}

/** Boards whose postings hire from the candidate's own country by default (DOU lists Ukraine-hiring
 * roles; its "за кордоном" / "віддалено" is where the company is, not a scope). */
export const LOCAL_BOARD_SOURCES: ReadonlySet<string> = new Set(["douua"]);

/** A local board's posting is never a `location_exception_candidate`: that label is dropped, so the
 * record keeps the default (no label). An explicit restriction still stands as `hard_location_block`. */
export function eligibilityForSource(source: string, eligibility: Eligibility | undefined): Eligibility | undefined {
  if (LOCAL_BOARD_SOURCES.has(source) && eligibility?.location?.status === "location_exception_candidate") return undefined;
  return eligibility;
}
