<!-- owt:start -->
# Plan: Agent E2E harness (priority)

Status: approved
Runtime: host-waived
<!-- When the last task is ticked, set Status: done and move this file to
     docs/plans/history/ in the same commit (archived plans are read-only records). -->
Origin: conversation with user 2026-10-01; ADR-0005
Spec: -

Priority over docs/plans/brunopad-mvp.md: tasks 10-12 of the MVP plan are
deferred until this plan is done (MVP plan carries a matching deferral
note).

## Tasks

Ordered; "Blocked by" lists task numbers that must finish first.

- [ ] 1. Harness: wdio + tauri-service, debug plugins, smoke test
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. Dev-deps: @wdio/cli, @wdio/tauri-service (pin exact at execution).
       2. Rust: tauri-plugin-wdio-webdriver + tauri-plugin-wdio, wired in
          src-tauri/src/lib.rs ONLY for debug builds (cfg(debug_assertions)
          or similar); no release linkage.
       3. e2e/: wdio.config.ts with the 'tauri' service, appBinaryPath
          pointing at src-tauri/target/debug, driverProvider 'embedded'.
       4. npm script "e2e": build debug (tauri build --debug --no-bundle),
          then wdio run.
       5. First spec (smoke): app window launches, no crash, a known
          root element is visible.
       Verify: npm run e2e -> green on host -->
- [ ] 2. Test-state strategy: fixture user workspace + IPC mocking
  Blocked by: 1
  <!-- mini-plan filled at execution time:
       Steps:
       1. Decide + implement how tests point the app at a repo-internal
          fixture workspace (e.g. e2e/fixtures/) instead of the real user
          DB state: mock the dialog IPC (tauri-service mocking) and/or
          seed user_workspaces.
       2. Second spec: workspace path renders from the seeded state.
       Verify: npm run e2e -> green; no write outside e2e/fixtures -->
- [ ] 3. Port pending MVP runtime smokes to e2e specs
  Blocked by: 2
  <!-- Port what is WebDriver-safe: sidebar tree render, CRUD via context
       menu, watcher refresh, file open -> pane, markdown round-trip
       (read text, not DnD). DnD-dependent checks stay user-run for now.
       Verify: npm run e2e -> green; MVP plan smokes marked agent-covered -->
- [ ] 4. BlockNote typing/slash-menu specs (absorb MVP task 10's agent-runnable half)
  Blocked by: 3
  <!-- Typing "#"+space / "-"+space / "1."+space, slash menu open+filter,
       save round-trip to disk as raw markdown. Block drag explicitly
       excluded (DnD flakiness, ADR-0005) - user-run remains.
       Verify: npm run e2e -> green -->

## Notes

- ADR-0005 produced (WebDriver over Playwright; embedded provider;
  IPC mocking for native dialogs; DnD deferred).
- MVP plan tasks 10-12 resume after this plan; task 10's user checklist
  shrinks to only the DnD items.
<!-- owt:end -->
