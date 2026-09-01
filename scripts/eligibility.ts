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
