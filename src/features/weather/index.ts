import type { Client, Message } from "discord.js";
import * as qs from "querystring";
import * as constants from "../../constants";
import { Store, StoreState } from "../../state";
import * as utils from "../../utils";
import type { DiscordSlashCommand } from "../../main";

function convertKPHtoMS(value: number): string {
  // km/hour -> 1000m/3600s -> 10/36 -> 5/18 -> 0.2777777777777778
  return (value * 0.2777777777777778).toFixed(1);
}

interface UserState {
  defaultLocation?: string;
}

export interface State {
  weather: Record<string, UserState>;
}

interface Context {
  api: ReturnType<typeof wrap>;
}

interface ExtendedRequestInit extends RequestInit {
  query?: {
    key?: string;
    q?: string;
  };
}

async function replyWeather(context: Context, event: Message, query: string) {
  const weather = await getCurrentWeather(context.api, query);

  const { name, region } = weather.location;
  const {
    temp_c,
    condition: { text: condition },
    wind_kph,
    wind_dir,
    humidity,
    cloud,
  } = weather.current;

  event.reply(
    `Weather in ${name}, ${region}: ${condition}, temperature: ${temp_c}c, wind: ${convertKPHtoMS(
      wind_kph
    )}m/s going ${wind_dir}, humidity: ${humidity}%, clouds: ${cloud}%`
  );
}

const reactions: {
  check: RegExp;
  callback: (
    context: Context,
    state: StoreState,
    match: RegExpMatchArray,
    event: Message
  ) => Promise<void>;
}[] = [
  {
    check: /^!weather$/i,
    callback: async (context, state, match, event) => {
      if (!event.author) return;

      const user = state.weather[event.author.id];

      if (!user || !user.defaultLocation) {
        event.reply(
          `There's no location stored for user.\nSet default location with \`!weather set <location query>\`\nwhere <location query> is e.g.: \`motala, ostergotland\` or \`58.4446,14.8949\`\nSee full docs here: https://www.weatherapi.com/docs/`
        );
        return;
      }

      await replyWeather(context, event, user.defaultLocation);
    },
  },

  {
    check: /^!weather set (.+)$/i,
    callback: async (context, state, match, event) => {
      const userId = event.author.id;
      const query = match[1];

      if (!query) return;

      await Store.update((state) => {
        const user: UserState = state.weather[userId] || {};
        user.defaultLocation = query;

        return {
          weather: {
            ...state.weather,
            [userId]: user,
          },
        };
      });

      event.reply(
        `Weather location set for ${utils.getDisplayName(event)} to: ${query}`
      );
    },
  },

  {
    check: /^!weather (.+)$/i,
    callback: async (context, state, match, event) => {
      const query = match[1];
      if (!query) return;
      await replyWeather(context, event, query);
    },
  },
];

async function processMessage(context: Context, event: Message) {
  if (!event.author) return;
  if (event.author.id === constants.APPLICATION_ID) return;

  const state = Store.get();
  const content = event.content.trim();

  try {
    for (const reaction of reactions) {
      const match = content.match(reaction.check);

      if (match) {
        await reaction.callback(context, state, match, event);
        return;
      }
    }
  } catch (err) {
    console.error("Failed to process fortune:", err);
  }
}

async function getCurrentWeather(
  request: Context["api"],
  weatherQuery: string
) {
  const weather = await request("/current.json", {
    query: {
      q: weatherQuery,
    },
  });

  return weather;
}

async function warmup() {
  const defaultState: State = {
    weather: {},
  };

  return Store.update((state) => {
    return {
      ...defaultState,
      ...state,
    };
  });
}

const wrap = (api: { key: string; root: string }) => {
  const query: ExtendedRequestInit["query"] = {
    key: api.key,
  };

  return async (path: string, incomingOptions: ExtendedRequestInit = {}) => {
    const opts: ExtendedRequestInit = {
      ...incomingOptions,

      query: {
        ...query,
        ...(incomingOptions.query || {}),
      },

      headers: {
        accept: "application/json",
        ...(incomingOptions.headers || {}),
      },
    };

    const endpoint = api.root + path + "?" + qs.stringify(opts.query);

    const res = await fetch(endpoint, opts);

    return res.json();
  };
};

function use(apiKey: string, client: Client, commands: DiscordSlashCommand[]) {
  const api = wrap({
    key: apiKey,
    root: "https://api.weatherapi.com/v1",
  });

  const context: Context = { api };

  client.on("messageCreate", (event) => processMessage(context, event));

  client.on("ready", async () => {
    try {
      await warmup();
    } catch (err) {
      console.error("Failed to start fortune:", err);
      process.exit(1);
    }
  });
}

export default {
  use,
};
