import { $, expect } from "@wdio/globals";

describe("smoke", () => {
  it("launches and shows the app header", async () => {
    const header = await $("header span");
    await expect(header).toHaveText("brunopad");
  });
});
