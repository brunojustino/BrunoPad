# Agent E2E testing: WebdriverIO + @wdio/tauri-service, not Playwright

Agent-driven development keeps failing at runtime verification: every MVP
task carries a "runtime smoke (user-run)" that stays pending, and UI bugs
(SQLITE_BUSY double-load, missing sql/fs capabilities, fs scope errors)
surfaced only at the Tauri layer. Agents need a runnable way to exercise
the real app binary. We adopt E2E testing through WebdriverIO with the
official `@wdio/tauri-service`, driving the debug build of the real app
(embedded WebDriver provider), running on the host per ADR-0004.

Playwright is rejected: it supports Electron via its bundled Chromium,
but Tauri renders in the OS webview (WebView2 on Windows), which is not
a Playwright target. The community workaround (launch with
`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port`, attach
Playwright over CDP) works only intermittently, is unmaintained, and
gives no IPC mocking or log capture. `tauri-driver` driven manually is
rejected on Windows because it requires msedgedriver to track the
WebView2 runtime version; the service's embedded provider (via
`tauri-plugin-wdio-webdriver`) removes that dependency entirely.

Status: accepted

## Consequences

- Two optional Rust plugins (`tauri-plugin-wdio-webdriver`,
  `tauri-plugin-wdio`) are wired into the app in debug builds for
  `browser.tauri.execute()`, IPC mocking, and log capture; they are not
  linked into release builds.
- Native dialogs (plugin-dialog) are invisible to WebDriver: tests mock
  the IPC layer instead of automating the picker; anything native gets
  a user-run smoke, unchanged.
- Drag-and-drop (mosaic splits, BlockNote block drag) is known-flaky in
  WebDriver; e2e specs use synthetic event helpers or fall back to
  user-run checks. Covered behavior is tracked per task, not assumed.
- The app DB the tests target must point at a repo-internal fixture
  workspace, never a real user folder (per agent-constraints.md).
