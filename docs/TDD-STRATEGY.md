# TDD Strategy for Colemearchy Blog Automation

Generated: 2025-10-19T14:12:57.111Z

Okay, let's build a pragmatic TDD strategy for your blog automation project. We'll focus on the most impactful areas first, balance speed with quality, and choose tools that fit your solo development context.

## 1. TDD Philosophy (For This Project Size)

*   **Embrace Pragmatism:** Aim for *sufficient* testing, not *perfect* testing. Time is a real constraint.
*   **Prioritize Core Logic:** Focus TDD efforts on the core business logic of content creation and processing. Think: AI interactions, data transformations, and critical database interactions.
*   **"Test-Drive" New Features:**  Absolutely enforce TDD for any *new* functionality.  This will prevent future regressions and ensure your code is well-designed.
*   **Refactor Existing Code Incrementally:**  Don't try to retrofit TDD to everything at once. Prioritize the parts of the codebase you touch most frequently or that are most likely to break.  Add tests as you refactor.
*   **Automation is Key:**  Emphasize automated tests in your CI/CD pipeline. This provides the constant feedback loop necessary for confidence.
*   **Value Integration Tests:** Focus on ensuring different components of your system talk to each other correctly.
*   **Accept Imperfection:** Acknowledge AI's inherent randomness and focus on testing AI's *outputs*, not internal mechanisms.

## 2. Testing Pyramid Breakdown

Here's a suggested balance for your project, keeping in mind the time constraints:

*   **Unit Tests (50%):**
    *   **What:** Pure functions, utility functions, data transformation logic, and individual components.
    *   **Coverage Goal:** Aim for 80-90% code coverage within these isolated units.  This gives you a solid foundation.
    *   **Example:** Test functions that sanitize text, calculate video lengths, or format data for database storage.
*   **Integration Tests (40%):**
    *   **What:**
        *   API Routes: Test handling of requests and responses (e.g., YouTube API requests, Gemini API requests)
        *   Database Interactions: Verify data is correctly written, read, and updated in PostgreSQL via Prisma.
        *   End-to-End Testing of Core Business Logic: Tests to ensure that core AI-powered features (YouTube->Blog, Auto-Translate) are working as expected
    *   **Focus:** Test how different modules interact, especially when external services are involved.
    *   **Example:** Test that calling a specific API route triggers the expected database update.
*   **E2E Tests (10%):**
    *   **What:**  Simulate full user workflows through your application.
    *   **Worth It?** Yes, *but selectively*. Focus on the *most critical user journeys*.
        *   **Example:** Submit a YouTube video URL, verify a blog post is created, translated, and published.  Verify an ad blocker is detected when visiting a page.
    *   **Caution:** E2E tests can be slow and brittle. Keep them concise and well-maintained.
    *   **Level of Effort:** These tests require more setup time than Unit or Integration, so be selective about what warrants this type of test.

## 3. Tech Stack + Tooling

*   **Testing Framework:** **Vitest**. It's fast, compatible with the Vite ecosystem (which Next.js is built on), TypeScript-friendly, and offers excellent mocking capabilities. The syntax will be familiar if you're coming from Jest.  Bun:test is also interesting, but Vitest is more mature and has better documentation right now.
*   **Mocking:**
    *   **Vitest Mocks:** Use Vitest's built-in `vi.mock` and `vi.fn` for mocking functions and modules.
    *   **`msw` (Mock Service Worker):** This is *crucial* for mocking API requests from the YouTube API and Gemini API *at the network level*. `msw` intercepts HTTP requests and provides predictable responses, so you don't hammer the real APIs during testing.  This is especially important because of rate limiting.
    *   **Prisma Mocking:** Use `prisma-mock` or similar library to create an in-memory Prisma client for your tests.  This prevents your tests from affecting your real database.
*   **CI/CD:**
    *   **GitHub Actions:**
        *   Create a workflow that runs tests on every pull request.
        *   Add a step to check code coverage (using a tool like `c8` or `nyc`).
        *   Consider adding linting and formatting steps to ensure code consistency.
        *   Set up badges to display test status and coverage on your repository.

## 4. 3-Phase Implementation Roadmap

**Phase 1 (Week 1): Setup + Critical Tests**

1.  **Setup Vitest & Mocking:**
    *   Install Vitest and `msw`.
    *   Configure Vitest in your Next.js project.
    *   Set up `msw` to intercept YouTube and Gemini API requests.
    *   Install `prisma-mock` and configure.
2.  **Core Logic Tests:**
    *   Identify 2-3 *critical* functions (e.g., YouTube transcript processing, AI prompt generation).
    *   Write unit tests for these functions, focusing on happy paths and edge cases.
3.  **GitHub Actions Integration:**
    *   Create a basic GitHub Actions workflow that runs Vitest on push/pull requests.
    *   Add a code coverage check.

**Phase 2 (Week 2): Expand Coverage**

1.  **API Route Integration Tests:**
    *   Write integration tests for key API routes (e.g., the route that triggers the YouTube->Blog post conversion).
    *   Use `msw` to mock the external API responses.
    *   Use `prisma-mock` to verify database interactions.
2.  **Critical Feature Tests:**
    *   Pick one major feature (e.g., automated translation).
    *   Write tests that cover the entire workflow, from input to output.
3.  **Refactor & Add Tests:**
    *   Refactor older code and add unit tests for any functions you touch.

**Phase 3 (Week 3+): TDD Culture + Automation**

1.  **Enforce TDD:**  Mandatory TDD for *all* new features.
2.  **Coverage Monitoring:** Regularly review code coverage reports and identify areas for improvement.
3.  **E2E Test Automation:**  Implement a few key E2E tests for critical user flows.
4.  **Refactor & Improve:** Continuously refactor code and improve test quality.
5.  **Knowledge Sharing:** Document the TDD process and tooling for future team members (even if it's just you for now).

## 5. Example: Shorts Regeneration (`regenerate-shorts-daily.mjs`)

Here's how you could approach TDD for the Shorts regeneration script:

**Tests to Write:**

1.  **`should fetch eligible videos from database`**: Tests that the query to retrieve videos that meet the time since last short generation criteria is correct.
2.  **`should skip video if YouTube API fails`**: Tests that the program continues despite an API error by mocking the YouTube API error.
3.  **`should skip video if Gemini API fails`**: Tests that the program continues despite an API error by mocking the Gemini API error.
4.  **`should generate a short description with Gemini AI`**: Tests that the correct prompt is being used with the AI, and that the data returned looks how we expect it to.
5.  **`should upload short to YouTube API`**: Tests that the YouTube API is being called correctly with the right headers and video data.
6.  **`should update video in database with new short details`**: Tests that the correct ID of the video is being used to update the short post_url and short_published_date columns.
7.  **`should handle YouTube API rate limits gracefully`**: Tests what happens when the YouTube API has an error code indicating it is rate limited (429).

**Mocking:**

*   **YouTube API:** Use `msw` to intercept the API requests and return pre-defined responses (success, error, rate limit).
*   **Gemini API:** Use `msw` to intercept the API requests and return pre-defined responses.
*   **Prisma:** Use `prisma-mock` to mock the database calls (fetch videos, update video).

**TDD Approach (Example: `should fetch eligible videos from database`):**

```typescript
// regenerate-shorts-daily.test.ts

import { regenerateShorts } from '../regenerate-shorts-daily'; // Assuming you move logic into a function
import { PrismaClient } from '@prisma/client';
import { MockClient } from 'prisma-mock';
import { vi, describe, it, expect } from 'vitest';

// Mock Prisma
const prisma = new PrismaClient() as MockClient;

describe('regenerateShorts', () => {
  it('should fetch eligible videos from database', async () => {
    // Arrange
    const mockVideos = [
      { id: 1, title: 'Test Video 1', last_short_published_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)},
      { id: 2, title: 'Test Video 2', last_short_published_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)},
    ];

    prisma.video.findMany = vi.fn().mockResolvedValue(mockVideos);

    // Act
    await regenerateShorts(prisma);

    // Assert
    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          last_short_published_date: {
            lte: expect.any(Date),
          },
        },
      })
    );
  });
});
```

## 6. Quality Gates & Standards

*   **Minimum Test Coverage:** Aim for 70% overall code coverage.  Higher for critical modules.  Enforce this in your CI/CD.
*   **Required Test Types:**
    *   New features: Unit tests *and* integration tests (at minimum).
    *   Refactor: Unit tests for any modified functions.
    *   Bug fixes:  A test that specifically reproduces the bug *and* verifies the fix.
*   **"Skip Tests" Exceptions:**  *Rarely*.
    *   Only for very small, inconsequential changes (e.g., minor UI tweaks).
    *   Requires a comment explaining why the tests are being skipped.
    *   Always prefer writing a test if there's *any* doubt.

## 7. Pragmatic Tradeoffs

*   **Solo Developer Time:**  Accept that you won't achieve 100% test coverage immediately.  Prioritize ruthlessly.
*   **AI Non-Determinism:**
    *   Focus on testing the *shape* and *content* of the AI's outputs, not the exact words.
    *   Use regular expressions or fuzzy matching to compare the generated text.
    *   Focus on tests that ensure the AI provides valid output, such as valid JSON or expected data types.
*   **API Quotas:**
    *   Use `msw` to minimize real API calls during testing.
    *   If necessary, create a small set of "seed" videos in your test database that you can use repeatedly for testing.
    *   Stagger tests to avoid exceeding rate limits.

By focusing on core logic, using `msw` for realistic API mocking, and prioritizing automation, you can build a solid TDD foundation that improves code quality without sacrificing velocity. Good luck!
