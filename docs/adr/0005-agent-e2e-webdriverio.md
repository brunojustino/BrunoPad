# Agent E2E testing: WebdriverIO + @wdio/tauri-service, not Playwright

Agent-driven development keeps failing at runtime verification: every MVP
task carries a "runtime smoke (user-run)" that stays pending, and UI bugs
(SQLITE_BUSY double-load, missing sql/fs capabilities, fs scope errors)
surfaced only at the Tauri layer. Agents need a runnable way to exercise
the real app binary. We adopt E2E testing through WebdriverIO with the
official `@wdio/tauri-service`, driving the debug build of the real app
on the host per ADR-0004.

Playwright is rejected: it supports Electron via its bundled Chromium,
but Tauri renders in the OS webview (WebView2 on Windows), which is not
a Playwright target. The community workaround (launch with
`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port`, attach
Playwright over CDP) works only intermittently, is unmaintained, and
gives no IPC mocking or log capture.

Driver provider: `external` (`tauri-driver`), not the `embedded`
provider. The embedded `tauri-plugin-wdio-webdriver` was the first
choice (no external driver at all), but it is structurally broken with
our pinned stack: the crate (1.4.0, including its upstream main) pins
webview2-com 0.38 / windows 0.61, while tauri 2.12.1 re-exports
webview2-com 0.39 (windows 0.62) - a type clash that fails to compile.
Reconsidering tauri-driver: its manual msedgedriver version dance is
automated away by the service (`autoInstallTauriDriver: true` plus
automatic msedgedriver download matched to the evergreen WebView2
runtime), so the original objection no longer holds.

Status: reversed (2026-10-01)

## Reversal (2026-10-01)

The harness was removed the same day it was adopted. Agent-driven e2e
runs kept wedging agent sessions, and debugging surfaced structural
problems: app code invokes through `__TAURI_INTERNALS__` (ESM), which
the plugin's interception does not cover, so unmocked native dialogs
block tests indefinitely; and each run leaked a tauri-driver/
msedgedriver process pair, accumulating across runs. A wall-clock
wrapper bounded the runs but did not make the harness productive.
Decision: remove the harness entirely; verification returns to
user-run runtime smokes (MVP plan tasks 10-12 resume).

## Consequences

- `tauri-plugin-wdio` is wired into the app in debug builds for
  `browser.tauri.execute()`, IPC mocking, and log capture; it is not
  linked into release builds.
- Registration order matters: `tauri-plugin-log` must be registered
  before `tauri-plugin-wdio` (the log plugin must claim the global
  logger first; wdio's own guard then skips its logger cooperatively).
  Both live in a debug-only block.
- Native dialogs (plugin-dialog) are invisible to WebDriver: tests mock
  the IPC layer instead of automating the picker; anything native gets
  a user-run smoke, unchanged.
- Drag-and-drop (mosaic splits, BlockNote block drag) is known-flaky in
  WebDriver; e2e specs use synthetic event helpers or fall back to
  user-run checks. Covered behavior is tracked per task, not assumed.
- The app DB the tests target must point at a repo-internal fixture
  workspace, never a real user folder (per agent-constraints.md).
