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

- [x] 1. Harness: wdio + tauri-service, debug plugins, smoke test
  Blocked by: -
  <!-- mini-plan filled at execution time:
       Steps:
       1. npm i -D @wdio/cli@9.30.1 @wdio/tauri-service@1.4.0
          (webdriverio@9.30.1 resolves as peer dep; all pinned exact).
       2. src-tauri/Cargo.toml: new section
          [target.'cfg(debug_assertions)'.dependencies] with
          tauri-plugin-wdio = "1.4.0" and
          tauri-plugin-wdio-webdriver = "1.4.0" (exact pins, debug-only
          per plugin docs - release builds exclude the crates entirely).
       3. src-tauri/src/lib.rs: after the base builder chain, under
          #[cfg(debug_assertions)], register both:
          builder.plugin(tauri_plugin_wdio::init())
               .plugin(tauri_plugin_wdio_webdriver::init()).
          (Builder::plugin returns Self, so the re-binding pattern from
          the plugin docs works inside run().)
       4. src-tauri/capabilities/default.json: add
          wdio:allow-execute, wdio:allow-log-frontend,
          wdio:allow-debug-plugin, wdio:allow-get-active-window-label,
          wdio:allow-get-window-states, wdio:allow-list-windows,
          wdio-webdriver:default.
       5. e2e/wdio.conf.ts: WebdriverIO.Config with
          services: [['tauri', { appBinaryPath:
          'src-tauri/target/debug/brunopad.exe', driverProvider:
          'embedded' }]], mocha bdd, spec reporter, maxInstances 1;
          onPrepare spawns `npm run tauri build -- -- --debug
          --no-bundle` (docs pattern) so the debug binary always exists.
       6. e2e/specs/smoke.spec.ts: launch app, assert the top-bar
          "brunopad" header text is visible (stable regardless of
          whether the dev DB already has a persisted user workspace;
          the workspace-dependent assertions land in task 2).
       7. package.json: script "e2e": "wdio run e2e/wdio.conf.ts".
       Files: package.json, package-lock.json, src-tauri/Cargo.toml,
       src-tauri/Cargo.lock, src-tauri/src/lib.rs,
       src-tauri/capabilities/default.json, e2e/wdio.conf.ts,
       e2e/specs/smoke.spec.ts
       Risks: first build compiles two new plugin crates (compile-time
       cost only). If ACL validation rejects the wdio permissions in
       non-debug builds, fall back to the docs' feature-flag pattern
       (features.wdio + optional deps) - decision noted in plan Notes.
       Verify:
       - npm run build -> exit 0
       - cargo check (PATH prefix) -> exit 0
       - npm run e2e -> green (app window opens, smoke spec passes) -->
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

- Task 1 (2026-10-01): deviations from mini-plan -
  (1) `tauri-plugin-wdio-webdriver` (embedded provider) does not compile
  with our pinned stack: the crate (incl. upstream main) pins
  webview2-com 0.38/windows 0.61 while tauri 2.12.1 re-exports
  webview2-com 0.39 (windows 0.62) - type clash, 15 rustc errors.
  Dropped it; using the service's `driverProvider: 'external'` +
  `autoInstallTauriDriver: true`. ADR-0005 amended accordingly. The
  service auto-downloads and syncs msedgedriver (154.0.4258.48) to the
  evergreen WebView2 runtime, so the goal the embedded provider served
  is met anyway.
  (2) App panic on debug-binary launch: tauri-plugin-log (was in the
  setup hook) failed after tauri-plugin-wdio claimed the global logger
  first (plugins initialize before setup). Fix: tauri-plugin-log moved
  into the builder chain BEFORE the wdio plugin (debug-only block);
  wdio's own "skip if logger set" guard then cooperates. Release builds
  unaffected (whole block is debug-only).
  (3) Added runner/framework/reporter dev-deps the service path needs:
  @wdio/local-runner, @wdio/mocha-framework, @wdio/spec-reporter (all
  9.30.1). wdio.conf.ts also self-heals the cargo PATH gap on this
  machine (prepends ~\.cargo\bin when missing). Verify: npm run build
  green, cargo check green, npm run e2e green (smoke: 1 passing,
  ~13s test time; total run dominated by the Rust debug build).
  Known noise: service teardown logs "Failed to clear mock store /
  restoreAllMocks" errors after session close - harmless, test result
  unaffected.
- ADR-0005 produced (WebDriver over Playwright; external tauri-driver
  provider after embedded proved incompatible; IPC mocking for native
  dialogs; DnD deferred).
- MVP plan tasks 10-12 resume after this plan; task 10's user checklist
  shrinks to only the DnD items.
<!-- owt:end -->
