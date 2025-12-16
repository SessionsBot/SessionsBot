// src/structures/ExtendedClient.ts
import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { SlashCommandBuilder } from "discord.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (...args: any[]) => Promise<void> | void;
  autocomplete?: (...args: any[]) => Promise<void> | void;
}

interface Button {
  data: { customId: string };
  execute: (...args: any[]) => Promise<void> | void;
}

export class ExtendedClient extends Client {
  public commands = new Collection<string, Command>();
  public buttons = new Collection<string, Button>();
}