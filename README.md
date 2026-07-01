# PranaPredict AI
AI health risk prediction full-stack project.
Frontend is built with React and Vite in frontend/src.
Backend is built with Node.js and Express in backend/src.
Supabase is used for user data management and as a primary database.
Prediction logic combines a risk calculator with an LLM service.
Report and email modules generate and share health summaries.
Core user screens include Dashboard, History, Profile, and Report.
APIs are structured with routes, controllers, services, and middleware.
Frontend and backend each have separate package and env configuration.


# PranaPredict AI Frontend Test Suite

## Test Coverage Summary

### ✅ Completed Test Files (6 files, 56+ passing tests)

1. **AuthContext.test.jsx** (6 tests) ✅
   - Authentication initialization
   - Sign-up functionality
   - Sign-in with password
   - Sign-out with localStorage cleanup
   - Profile updates with optimistic rollback

2. **bmiCalculator.test.js** (6 tests) ✅
   - BMI calculation accuracy
   - Edge case handling (null/zero)
   - BMI category classification

3. **HealthForm.test.jsx** (1 comprehensive integration test) ✅
   - Multi-step form navigation (6 steps)
   - Dynamic BMI recalculation
   - Form validation
   - Final submission workflow

4. **analyticsUtils.test.js** (26 tests) ✅
   - Data normalization for different field types:
     - Number fields (BMI, age, water intake, sleep)
     - Blood pressure parsing (systolic extraction)
     - Cholesterol category mapping
     - Activity level mapping
   - Date formatting
   - Statistics calculations (avg, min, max, latest)

5. **TrendCharts.test.jsx** (17 tests, 12 passing) ⚠️
   - Report sorting by date
   - Statistics calculations (assessments, average, latest)
   - Trend direction calculation (up/down/same)
   - Risk level distribution counting
   - Chart data generation
   - Theme-aware styling
   - **Note**: Some tests need minor adjustments for text matching in nested elements

6. **ThemeContext.test.jsx** (10 tests) ✅
   - Initial theme detection (localStorage, system preference)
   - Theme toggle functionality
   - DOM attribute updates
   - localStorage persistence

### 🚧 Partial Tests (needs fixes)

7. **api.test.js** - API module testing
   - Session management
   - Request interceptors
   - Prediction API with cancellation
   - Reports pagination
   - Email notifications
   - Admin APIs
   - **Status**: Mocking setup needs adjustment

8. **Navbar.test.jsx** - Navigation component
   - Authentication state rendering
   - Mobile menu toggle
   - Theme toggle integration
   - Sign-out workflow
   - **Status**: Mock syntax needs fixing

9. **routeProtection.test.jsx** - Route guards
   - ProtectedRoute (auth required)
   - PublicRoute (redirect if authenticated)
   - AdminRoute (admin-only access)
   - **Status**: Mock syntax needs fixing

---

## Test Statistics

- **Total Test Files**: 9
- **Passing Tests**: 56+
- **Total Tests Written**: 74+
- **Test Coverage Areas**:
  - ✅ Context providers (Auth, Theme)
  - ✅ Utility functions (BMI, analytics data normalization)
  - ✅ Complex components (HealthForm, TrendCharts)
  - ⚠️ API layer (needs mock fixes)
  - ⚠️ Navigation/Routing (needs mock fixes)

---

## Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

---

##Issues to Fix

### 1. API Test Mocking
**File**: `Test/api.test.js`
**Issue**: Axios mock needs to be set up before module import
**Fix**: Move axios.create mock before importing the api module

### 2. Hook Mocking Syntax
**Files**: `Test/Navbar.test.jsx`, `Test/routeProtection.test.jsx`
**Issue**: Vi.mock needs proper default export structure
**Current workaround**: Use named mock function before import

### 3. Nested Text Matching
**File**: `Test/TrendCharts.test.jsx`
**Issue**: Testing Library can't find text split across elements (e.g., trend arrows)
**Fix**: Use `getAllByText` or query by test-id instead of exact text match

### 4. Date Formatting Edge Cases
**File**: `Test/analyticsUtils.test.js`
**Issue**: `new Date(null)` creates valid date in some environments
**Fix**: Add explicit null/undefined checks before Date construction

---

## Components Still Need Testing

### High Priority
1. **pdfReportGenerator.js** - PDF generation logic
2. **Dashboard.jsx** - Form submission handling
3. **History.jsx** - Report listing with pagination
4. **Analytics.jsx** - Data visualization logic
5. **RiskResult.jsx** - Risk display component

### Medium Priority
6. **Profile.jsx** - Profile update logic
7. **Login.jsx** / **Signup.jsx** - Auth form flows
8. **AdminDashboard.jsx** - Admin statistics
9. **AdminUsers.jsx** - User management
10. **AdminAnalytics.jsx** - Admin data viz

### Low Priority
11. **Landing.jsx** - Mostly presentational
12. **HealthTips.jsx** - Content display
13. **AdminSidebar.jsx** - Navigation component

---

## Test Best Practices Applied

1. **Isolation**: Each test is independent with proper setup/cleanup
2. **Mocking**: External dependencies (Supabase, Axios) are mocked
3. **Coverage**: Tests cover happy paths, edge cases, and error scenarios
4. **Clarity**: Descriptive test names explain what is being tested
5. **Organization**: Tests grouped by feature/component with clear structure
6. **Integration**: Some tests (HealthForm, AuthContext) test full user flows

---

## Future Improvements

1. **Coverage Reporting**: Add Istanbul/c8 for visual coverage reports
2. **E2E Tests**: Add Playwright tests for critical user journeys
3. **Visual Regression**: Consider Percy or Chromatic for UI testing
4. **Performance**: Add performance benchmarks for heavy components
5. **Accessibility**: Add axe-core for a11y testing

---

## Dependencies Used

- **vitest**: Test runner (faster than Jest)
- **@testing-library/react**: Component testing utilities
- **@testing-library/user-event**: Simulate user interactions
- **@testing-library/jest-dom**: Custom matchers
- **happy-dom**: Fast DOM implementation for tests
- **msw**: Mock Service Worker (for future API mocking)

---

## Notes

- Tests run in parallel by default (vitest feature)
- `jsdom` environment is configured for React component testing
- Global test setup in `src/setupTests.js`
- Vitest config merges with Vite config for shared settings

---

**Last Updated**: January 2026
**Test Suite Version**: 1.0
**Framework**: Vitest + React Testing Library











