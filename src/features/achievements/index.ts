import * as Discord from "discord.js";
import type { Feature } from "../../types";
import type Store from "../../store";

import type { AchievementState as FortuneState } from "../fortune";
import type { AchievementState as WordState } from "../word";
import type { AchievementState as BallState } from "../magic-8-ball";
import type { AchievementState as RobinState } from "../is-robin-working";
import type { AchievementState as NumberwangState } from "../numberwang";
import type { AchievementState as WeatherState } from "../weather";
import type { AchievementState as QuoteState } from "../quote";

import Emitter from "../../utils/emitter";

interface UserAchievements {
  fortune: FortuneState & { __achieved?: string[] };
  quote: QuoteState & { __achieved?: string[] };
  numberwang: NumberwangState & { __achieved?: string[] };
  weather: WeatherState & { __achieved?: string[] };
  ball: BallState & { __achieved?: string[] };
  robin: RobinState & { __achieved?: string[] };
  word: WordState & { __achieved?: string[] };
}

interface Achievement<T> {
  constraint: (v: T) => boolean;
  progress: (v: T) => number;
  role: {
    name: string;
    reason: string;
    color?: number;
  };
}

interface AchievementGroup<T> {
  initialState: T;
  achievements: Achievement<T>[];
}

type AuthorID = string;
export interface State {
  achievements: Record<AuthorID, Partial<UserAchievements>>;
}

type Groups = keyof UserAchievements;

type Events = {
  new_achievement: [string, string];
};

function column(size: number, content: string) {
  const spaces = size - content.length;
  console.log("Size", size, spaces, content);
  return content + " ".repeat(spaces);
}

function formatColumns(rows: (string | number)[][]): string[] {
  let lengthPerColumn: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    for (let c = 0; c < row.length; c++) {
      if (lengthPerColumn[c] === undefined) lengthPerColumn.push(0);

      const value = row[c]!.toString();
      lengthPerColumn[c] = Math.max(lengthPerColumn[c]!, value.length);
    }
  }

  return rows.map((columns) =>
    columns
      .map((value, i) => column(lengthPerColumn[i]!, value.toString()))
      .join(" ")
  );
}

function clamp(min: number, max: number, value: number) {
  return value >= min && value <= max ? value : value >= max ? max : min;
}

export class Achievements extends Emitter<Events> {
  private groups: Record<string, AchievementGroup<any>> = {};
  private roles: Record<string, Discord.Role[] | undefined> = {};

  constructor(private store: Store) {
    super();
  }

  public getProgress = (authorId: string): string[] => {
    const keys = Object.keys(this.groups);
    keys.sort();

    const out: [string, string][] = [];

    const userAchievements = this.store.get().achievements[authorId] || {};
    for (const key of keys) {
      const group = this.groups[key]!;
      const state = userAchievements[key as Groups] || {
        ...group.initialState,
      };

      for (const achievement of group.achievements) {
        const progress = parseInt(
          (clamp(0, 1, achievement.progress(state)) * 100) as any
        ).toString();

        out.push([achievement.role.name, progress + "%"]);
      }
    }

    return formatColumns(out);
  };

  public setAchievements = <Key extends Groups>(
    id: Key,
    group: AchievementGroup<UserAchievements[Key]>
  ) => {
    this.groups[id] = group;
  };

  public append = async <Key extends Groups>(
    id: Key,
    message: Discord.Message,
    updater: (v: UserAchievements[Key]) => UserAchievements[Key]
  ) => {
    const group = this.groups[id];
    if (!group) return;

    const { id: authorId } = message.author;
    const appendedAchievements: Achievement<UserAchievements[Key]>[] = [];

    await this.store.update(async (state) => {
      const userGroups = state.achievements[authorId] || {};

      const __achieved = userGroups[id]?.__achieved || [];
      const nextGroup = updater(
        userGroups[id] || {
          __achieved,
          ...group.initialState,
        }
      );

      nextGroup.__achieved = __achieved;
      userGroups[id] = nextGroup;
      state.achievements[authorId] = userGroups;

      const achieved = new Set(__achieved || []);

      for (const achievement of group.achievements) {
        if (
          !achieved.has(achievement.role.name) &&
          achievement.constraint(nextGroup)
        ) {
          __achieved.push(achievement.role.name);
          appendedAchievements.push(achievement);
        }
      }

      return state;
    });

    if (appendedAchievements.length === 0) return;

    return this.propagateAchievements(message, appendedAchievements);
  };

  private propagateAchievements = async (
    message: Discord.Message,
    achievements: Achievement<any>[]
  ) => {
    const { id: authorId } = message.author;
    const roles = await this.getRoles(message.guild!);

    const rolesByName = roles.reduce<Record<string, Discord.Role | undefined>>(
      (m, role) => {
        m[role.name] = role;
        return m;
      },
      {}
    );

    const nameCheck = new Set(roles.map((role) => role.name));
    const replies: string[] = [];

    for (const achievement of achievements) {
      if (!nameCheck.has(achievement.role.name)) {
        const role = await message.guild?.roles.create(achievement.role);

        if (role) {
          rolesByName[role.name] = role;
        }
      }

      const role = rolesByName[achievement.role.name];
      if (role) {
        message.member?.roles.add(role);
      }

      this.emit("new_achievement", authorId, achievement.role.name);
      replies.push(
        `User just earned a new trophy! 🎉🎉\n\`${achievement.role.name}\``
      );
    }

    // This is so features don't have to call achievements append in the end,
    // and can do it... almost whenever and the message will still pop up after the fact.
    // Nice 8)
    setTimeout(() => {
      for (const reply of replies) message.reply(reply);
    }, 1000);
  };

  private getRoles = async (guild: Discord.Guild) => {
    if (this.roles[guild.id]) return this.roles[guild.id]!;

    const fetchedRoles = await guild.roles.fetch();
    const roles = Array.from(fetchedRoles?.values() || []);

    this.roles[guild.id] = roles;

    return roles;
  };
}

export const feature: Feature = {
  name: "Achievements",
  warmUp: (context) => {
    const defaultState: State = {
      achievements: {},
    };

    return context.store.update((state) => ({
      ...defaultState,
      ...state,
    }));
  },

  reactions: [
    {
      check: /^!achievements$/i,
      handler: async (context, message) => {
        const authorId = message.author.id;

        const progress = context.achievements.getProgress(authorId);

        message.reply(
          "Your trophy progress:\n```" + progress.join("\n") + "```"
        );
      },
    },
  ],
};

export default feature;
