#!/usr/bin/env node
import { Command } from "commander";
import { registerInitCommand } from "./commands/init";
import { registerWizardCommand } from "./commands/wizard";

const program = new Command();

program
  .name("phalnx")
  .description("Scaffold a new phalnx-protected AI agent project")
  .version("0.1.0");

registerInitCommand(program);
registerWizardCommand(program);

program.parse();
