# Waiver: brunopad runs on the host

Tauri produces a native desktop binary: a container cannot build or
exercise the Windows (or future mobile) targets, and the Rust + WebView
toolchain is the deliverable's own runtime. ADR-0002's Docker default
is therefore waived for this project: plans carry `Runtime:
host-waived` by default and all verification runs on the host.

Status: accepted

## Consequences

- The trade-off of ADR-0002 (reproducibility) is accepted as lost for
  the app target; verification relies on committed toolchain
  requirements (rust-toolchain.toml / package.json pins).
- Individual building blocks (pure TS packages) may still use Docker
  where painless, but it is not required.
