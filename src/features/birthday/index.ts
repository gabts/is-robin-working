import { SlashCommandBuilder } from "discord.js";
import { Feature } from "../../types";

interface Birthday {
  month: number;
  day: number;
}

export interface State {
  birthdays: Record<string, Birthday>;
}

export const feature: Feature = {
  name: "brithday",
  commands: [
    {
      command: () => {
        const cmd = new SlashCommandBuilder()
          .setName("birthday")
          .setDescription("Set your birthday!");

        cmd.addIntegerOption((option) =>
          option
            .setName("month")
            .setDescription("Your birthday month (1-12)")
            .setMinValue(1)
            .setMaxValue(12)
            .setRequired(true)
        );

        cmd.addIntegerOption((option) =>
          option
            .setName("day")
            .setDescription("Your birthday day (1-31)")
            .setMinValue(1)
            .setMaxValue(31)
            .setRequired(true)
        );

        return cmd;
      },
      handler: async (context, command) => {
        console.log(command);
        console.log(" /birthday command");

        let month = -1;
        let day = -1;

        for (const option of command.options.data) {
          if (typeof option.value !== "number") continue;

          if (option.name === "month") {
            month = option.value;
            continue;
          }

          if (option.name === "day") {
            day = option.value;
            continue;
          }
        }

        console.log("> date:", day);

        context.store.update((state) => {
          state.birthdays[command.user.id] = {
            day,
            month,
          };

          return state;
        });

        console.log(context.store.get());

        command.reply({
          content: `registered your birthday as ${day}/${month}`,
          ephemeral: true,
        });
      },
    },
    {
      command: () => {
        const cmd = new SlashCommandBuilder()
          .setName("list-birthdays")
          .setDescription("List all birthdays!");

        return cmd;
      },
      handler: async (context, command) => {
        const birthdays = context.store.get().birthdays;

        let msg = "";

        for (const userId of Object.keys(birthdays)) {
          const { day, month } = birthdays[userId]!;
          if (msg) msg += "\n";
          msg += `<@${userId}>: ${day}/${month}`;
        }

        command.reply({ content: msg, ephemeral: true });
      },
    },
  ],
  reactions: [
    {
      check: /^!next-birthday$/i,
      handler: async (context, message, match) => {
        const { birthdays } = context.store.get();

        const nextBd = Object.keys(birthdays).reduce<
          null | (Birthday & { userId: string })
        >((acc, userId) => {
          const bd = birthdays[userId]!;
          if (acc && (bd.month > acc.month || bd.day > acc.day)) return acc;
          return { ...bd, userId };
        }, null);

        if (!nextBd) {
          message.reply("No birthdays found :(");
          return;
        }

        const { userId, day, month } = nextBd;

        message.reply(`Next birthday is <@${userId}> at ${day}/${month}!`);
      },
    },
  ],
};

export default feature;
