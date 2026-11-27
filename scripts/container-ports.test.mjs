import test from "node:test";
import assert from "node:assert/strict";
import { loopbackPorts } from "./container-ports.mjs";
test("binds only run/create default published ports", () => {
  for (const command of ["run", "create"]) {
    assert.deepEqual(
      loopbackPorts([
        command,
        "-p",
        "54321:8000",
        "--publish=53:53/udp",
        "image",
      ]),
      [
        command,
        "-p",
        "127.0.0.1:54321:8000",
        "--publish=127.0.0.1:53:53/udp",
        "image",
      ],
    );
  }
});
test("preserves pulls, explicit bindings and command separator", () => {
  for (const args of [
    ["pull", "image"],
    ["run", "-p", "127.0.0.1:1:2", "image"],
    ["run", "-p", "[::1]:1:2", "image"],
    ["run", "--", "image", "-p", "1:2"],
  ]) {
    assert.deepEqual(loopbackPorts(args), args);
  }
});
test("does not mutate caller arguments or manufacture incomplete flags", () => {
  const args = Object.freeze(["run", "--publish"]);
  assert.deepEqual(loopbackPorts(args), args);
});

test("does not rewrite container commands or option values", () => {
  const args = [
    "create",
    "--name",
    "sample",
    "-e",
    "-p",
    "-p",
    "1:2",
    "image",
    "-p",
    "3:4",
  ];
  assert.deepEqual(loopbackPorts(args), [
    "create",
    "--name",
    "sample",
    "-e",
    "-p",
    "-p",
    "127.0.0.1:1:2",
    "image",
    "-p",
    "3:4",
  ]);
});

test("rejects unsupported and non-loopback publish forms", () => {
  for (const value of ["8080", "8000-8002:8000-8002", "0.0.0.0:1:2"]) {
    assert.throws(() => loopbackPorts(["run", "-p", value, "image"]));
  }
});

test("supports CLI test-runner workdir alias without touching container arguments", () => {
  assert.deepEqual(
    loopbackPorts([
      "run",
      "--rm",
      "-w",
      "/tests",
      "-p",
      "1:2",
      "image",
      "-w",
      "/inside",
    ]),
    [
      "run",
      "--rm",
      "-w",
      "/tests",
      "-p",
      "127.0.0.1:1:2",
      "image",
      "-w",
      "/inside",
    ],
  );
});
