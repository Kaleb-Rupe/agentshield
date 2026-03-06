import * as fs from "fs";
import * as path from "path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function detectPackageManager(): PackageManager {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "bun.lockb"))) return "bun";
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";

  const agent = process.env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";

  return "npm";
}

export function validateProjectName(name: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return "Project name cannot be empty";
  }
  if (name.length > 214) {
    return "Project name must be 214 characters or fewer";
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return "Project name must be lowercase alphanumeric with hyphens, starting with a letter or number";
  }
  return undefined;
}

export function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn";
    case "bun":
      return "bun install";
    default:
      return "npm install";
  }
}

export function getRunCommand(pm: PackageManager, script: string): string {
  switch (pm) {
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    case "bun":
      return `bun run ${script}`;
    default:
      return `npm run ${script}`;
  }
}
