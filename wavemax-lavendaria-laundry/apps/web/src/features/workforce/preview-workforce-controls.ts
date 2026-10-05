import type { Dispatch, SetStateAction } from "react";

import type { PreviewWorkforceState } from "./preview-workforce";

export interface PreviewWorkforceControls {
  state: PreviewWorkforceState;
  setState: Dispatch<SetStateAction<PreviewWorkforceState>>;
  employeeId: string;
  managerId: string;
}
