/** Scope the CLI's otherwise unbound Podman mappings to loopback. */
export function loopbackPorts(args) {
  const result = [...args];
  if (!["run", "create"].includes(result[0])) return result;
  const flags = new Set([
    "--rm",
    "-d",
    "--detach",
    "-i",
    "--interactive",
    "-t",
    "--tty",
  ]);
  const valued = new Set([
    "--name",
    "--hostname",
    "-e",
    "--env",
    "--env-file",
    "-v",
    "--volume",
    "--volumes-from",
    "--tmpfs",
    "--expose",
    "--health-cmd",
    "--health-interval",
    "--health-timeout",
    "--health-retries",
    "--health-start-period",
    "--health-start-interval",
    "--restart",
    "--security-opt",
    "--add-host",
    "--network",
    "--network-alias",
    "--label",
    "--entrypoint",
    "--memory",
    "--memory-swap",
    "--cpus",
    "--user",
    "--workdir",
    "-w",
  ]);
  const bind = (value) => {
    if (/^\d+:\d+(?:\/(?:tcp|udp))?$/.test(value)) return `127.0.0.1:${value}`;
    if (/^(?:127\.0\.0\.1|\[::1\]):\d*:\d+(?:\/(?:tcp|udp))?$/.test(value))
      return value;
    throw new Error(
      "Unsupported local published port; explicit loopback binding required.",
    );
  };
  for (let index = 1; index < result.length; index += 1) {
    if (result[index] === "--" || !result[index].startsWith("-")) break;
    if (result[index] === "-p" || result[index] === "--publish") {
      const value = result[index + 1];
      if (value !== undefined) result[++index] = bind(value);
    } else if (result[index].startsWith("--publish=")) {
      result[index] =
        `--publish=${bind(result[index].slice("--publish=".length))}`;
    } else if (valued.has(result[index])) {
      index += 1;
    } else if (!flags.has(result[index]) && !result[index].includes("=")) {
      throw new Error(
        `Unsupported local container option: ${result[index]}; review port binding before starting.`,
      );
    }
  }
  return result;
}
