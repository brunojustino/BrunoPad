import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const cargoBin = path.join(process.env.USERPROFILE ?? "", ".cargo", "bin");
if (existsSync(cargoBin) && !process.env.Path?.includes(cargoBin)) {
  process.env.Path = `${cargoBin}${path.delimiter}${process.env.Path ?? ""}`;
}

const appBinaryPath = path.resolve("src-tauri/target/debug/brunopad.exe");

export const config = {
  specs: ["./specs/**/*.spec.ts"],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": { application: appBinaryPath },
    },
  ],
  services: [
    [
      "tauri",
      {
        appBinaryPath,
        driverProvider: "external",
        autoInstallTauriDriver: true,
      },
    ],
  ],
  reporters: ["spec"],
  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },
  onPrepare: () => {
    spawnSync(
      "npm",
      ["run", "tauri", "build", "--", "--debug", "--no-bundle"],
      {
        cwd: path.resolve("."),
        stdio: "inherit",
        shell: true,
      },
    );
  },
};
