import type { Message } from "discord.js";
import * as qs from "querystring";
import * as utils from "../../utils";

import { Feature } from "../../types";

export interface AchievementState {
  queries: number;
}

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

interface Context {
  api: ReturnType<typeof wrap>;
}

interface ExtendedRequestInit extends RequestInit {
  query?: {
    key?: string;
    q?: string;
  };
}

const apiKey = process.env.WEATHER_TOKEN;

const api = wrap({
  key: apiKey!,
  root: "https://api.weatherapi.com/v1",
});

async function replyWeather(event: Message, query: string) {
  const weather = await getCurrentWeather(api, query);

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

const feature: Feature = {
  name: "Weather",
  skip: !apiKey,
  warmUp: (context) => {
    context.achievements.setAchievements("weather", {
      initialState: {
        queries: 0,
      },

      achievements: [
        {
          constraint: (state) => state.queries >= 50,
          progress: (state) => state.queries / 50,
          role: {
            name: "Weather Boy",
            reason: "You'd really like to know the weather.",
          },
        },
      ],
    });

    const defaultState: State = {
      weather: {},
    };

    return context.store.update((state) => ({
      ...defaultState,
      ...state,
    }));
  },
  reactions: [
    {
      check: /^!weather set (.+)$/i,
      handler: async (context, message, match) => {
        const userId = message.author.id;
        const query = match[1];

        if (!query) return;

        await context.store.update((state) => {
          const user: UserState = state.weather[userId] || {};
          user.defaultLocation = query;

          return {
            weather: {
              ...state.weather,
              [userId]: user,
            },
          };
        });

        message.reply(
          `Weather location set for ${utils.getDisplayName(
            message
          )} to: ${query}`
        );
      },
    },

    {
      check: /^!weather (.+)$/i,
      handler: async (context, message, match) => {
        const query = match[1];
        if (!query) return;

        context.achievements.append("weather", message, (state) => {
          state.queries += 1;
          return state;
        });

        await replyWeather(message, query);
      },
    },

    {
      check: /^!weather$/i,
      handler: async (context, message) => {
        if (!message.author) return;

        const user = context.store.get().weather[message.author.id];

        if (!user || !user.defaultLocation) {
          message.reply(
            `There's no location stored for user.\nSet default location with \`!weather set <location query>\`\nwhere <location query> is e.g.: \`motala, ostergotland\` or \`58.4446,14.8949\`\nSee full docs here: https://www.weatherapi.com/docs/`
          );
          return;
        }

        context.achievements.append("weather", message, (state) => {
          state.queries += 1;
          return state;
        });

        await replyWeather(message, user.defaultLocation);
      },
    },
  ],
};

export default feature;
