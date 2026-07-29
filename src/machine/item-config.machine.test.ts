import { describe, it, expect } from "vitest";
import { createActor } from "@esm.sh/xstate";
import { itemConfigMachine } from "./item-config.machine";
import { gigiMenuConfig } from "../domain/gigi-menu-config";

const plain = gigiMenuConfig.items.find((i) => i.id === "pizza-plain")!;

describe("itemConfigMachine", () => {
  it("defaults size and CONFIRM reaches confirmed", () => {
    const a = createActor(itemConfigMachine, { input: { item: plain } }).start();
    expect(a.getSnapshot().context.size).toBe("S");
    a.send({ type: "CONFIRM" });
    expect(a.getSnapshot().status).toBe("done");
  });
  it("TOGGLE_MULTI adds and removes an option", () => {
    const a = createActor(itemConfigMachine, { input: { item: plain } }).start();
    a.send({ type: "TOGGLE_MULTI", groupId: "extra1", optionId: "pepperoni" });
    expect(a.getSnapshot().context.groups.extra1).toEqual(["pepperoni"]);
    a.send({ type: "TOGGLE_MULTI", groupId: "extra1", optionId: "pepperoni" });
    expect(a.getSnapshot().context.groups.extra1).toEqual([]);
  });
  it("SET_SIZE changes size", () => {
    const a = createActor(itemConfigMachine, { input: { item: plain } }).start();
    a.send({ type: "SET_SIZE", sizeId: "L" });
    expect(a.getSnapshot().context.size).toBe("L");
  });
});
