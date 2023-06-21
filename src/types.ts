import * as Discord from "discord.js";
import type { Achievements } from "./features/achievements";
import type Store from "./store";

export interface Context {
  store: Store;
  achievements: Achievements;
}

export type CommandHandler = (
  context: Context,
  command: Discord.CommandInteraction<Discord.CacheType>
) => void | Promise<void>;

export type ReactionHandler = (
  context: Context,
  message: Discord.Message,
  match: RegExpMatchArray
) => void | Promise<void>;

export type Feature = {
  name: string;
  skip?: boolean;
  warmUp?: (context: Context) => void | Promise<void>;
  commands?: {
    command: string;
    description: string;
    handler: CommandHandler;
  }[];
  reactions?: {
    check: RegExp;
    handler: ReactionHandler;
  }[];
};
