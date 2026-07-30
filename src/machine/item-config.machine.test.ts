import { describe, it, expect } from "vitest";
import { createActor } from "@esm.sh/xstate";
import { itemConfigMachine } from "./item-config.machine";
import { gigiMenuConfig } from "../domain/gigi-menu-config";

const plain = gigiMenuConfig.items.find((i) => i.id === "pizza-plain")!;
const halfAndHalf = gigiMenuConfig.items.find((i) => i.id === "pizza-half-and-half")!;

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
  it("can return an optional single choice to its original state", () => {
    const a = createActor(itemConfigMachine, { input: { item: plain } }).start();
    a.send({ type: "SET_SINGLE", groupId: "doneness", optionId: "well-done" });
    expect(a.getSnapshot().context.groups.doneness).toBe("well-done");
    a.send({ type: "SET_SINGLE", groupId: "doneness", optionId: null });
    expect(a.getSnapshot().context.groups.doneness).toBeNull();
  });
  it("requires and independently stores both half selections", () => {
    const a = createActor(itemConfigMachine, { input: { item: halfAndHalf } }).start();
    a.send({ type: "CONFIRM" });
    expect(a.getSnapshot().status).toBe("active");

    a.send({ type: "SET_SINGLE", groupId: "halfLeft", optionId: "pizza-plain" });
    expect(a.getSnapshot().context.groups.halfLeft).toBe("pizza-plain");
    a.send({ type: "CONFIRM" });
    expect(a.getSnapshot().status).toBe("active");

    a.send({ type: "SET_SINGLE", groupId: "halfRight", optionId: "pizza-deluxe" });
    expect(a.getSnapshot().context.groups.halfRight).toBe("pizza-deluxe");
    a.send({ type: "CONFIRM" });
    expect(a.getSnapshot().status).toBe("done");
  });
});
