# Bug Audit (`frontend` + `backend`)

## Scope and evidence
- Reviewed all source/config files in `frontend` and `backend` (excluding lock/build artifacts).
- Runtime/automation evidence used:
  - `frontend`: `npm run lint` (fails), `npm run build` (passes)
  - `backend`: recursive `node --check` syntax validation (passes all `.js` files)

## Confirmed bugs

1. **History page timeout fires after successful fetch**  
   - **Severity:** High  
   - **Status:** Fixed
   - **File:** `frontend/src/pages/History.jsx`  
   - **Problem:** `safetyTimer` is created but never cleared when `fetchReports()` succeeds, so the timeout can still set `error` and `loading` later even after data is loaded.

2. **History page error state is sticky across retries/pages**  
   - **Severity:** Medium  
   - **Status:** Fixed
   - **File:** `frontend/src/pages/History.jsx`  
   - **Problem:** `error` is set on failure but not reset before/after successful fetches, so old errors can remain visible when new data loads correctly.

3. **Invalid input handling can throw server error instead of 400**  
   - **Severity:** High  
   - **Status:** Fixed
   - **File:** `backend/src/controllers/predictionController.js`  
   - **Problem:** Validation failure path accesses `parseResult.error.errors`, but current `zod` exposes issues through `parseResult.error.issues`; this can crash the handler on bad input.


5. **Frontend lint fails due to dead code and regex escape issue**  
   - **Severity:** Low  
   - **Status:** Fixed
   - **File:** `frontend/src/utils/pdfReportGenerator.js`  
   - **Problem:** `parseListItems` is defined but unused; plus an unnecessary escape in the regex at bold-field parsing causes lint failure. CI/lint gate will fail until fixed.
