// codama.mjs — Generate Kit-native client from Anchor IDL
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderVisitor } from "@codama/renderers-js";
import { createFromRoot } from "codama";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the committed Anchor IDL
const idlPath = join(__dirname, "..", "..", "target", "idl", "phalnx.json");
const anchorIdl = JSON.parse(readFileSync(idlPath, "utf-8"));

// Parse into Codama IDL
const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));

// Generate Kit-native JS client
const outputDir = join(__dirname, "src", "generated");
codama.accept(renderVisitor(outputDir));

console.log(`Generated Kit-native client in ${outputDir}`);
