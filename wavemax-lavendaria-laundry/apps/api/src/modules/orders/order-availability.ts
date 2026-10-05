export interface UnavailableOrderList {
  items: readonly never[];
  coverage: {
    state: "unavailable";
    reason: "WDF_API_NOT_CONNECTED";
    source: "WDF POS";
    reportedTotal: null;
    returnedCount: 0;
    lastSuccessfulSync: null;
  };
  page: {
    nextCursor: null;
    hasMore: false;
  };
}

export function unavailableOrderList(): UnavailableOrderList {
  return {
    items: [],
    coverage: {
      state: "unavailable",
      reason: "WDF_API_NOT_CONNECTED",
      source: "WDF POS",
      reportedTotal: null,
      returnedCount: 0,
      lastSuccessfulSync: null,
    },
    page: {
      nextCursor: null,
      hasMore: false,
    },
  };
}
