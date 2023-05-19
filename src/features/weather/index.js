const qs = require("querystring");

const { spawn, getDisplayName } = require("../../utils");
const Store = require("../../state");

function getDate(d) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
}

function convertKPHtoMS(value) {
  // km/hour -> 1000m/3600s -> 10/36 -> 5/18 -> 0.2777777777777778
  return (value * 0.2777777777777778).toFixed(1);
}

async function replyWeather(context, event, query) {
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

const reactions = [
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
    callback: async (context, _state, match, event) => {
      const userId = event.author.id;
      const query = match[1];

      await Store.update((state) => {
        const user = state.weather[userId] || {};
        user.defaultLocation = query;

        return {
          weather: {
            ...state.weather,
            [userId]: user,
          },
        };
      });

      event.reply(
        `Weather location set for ${getDisplayName(event)} to: ${query}`
      );
    },
  },

  {
    check: /^!weather (.+)$/i,
    callback: async (context, state, match, event) => {
      await replyWeather(context, event, match[1]);
    },
  },
];

async function processMessage(context, event) {
  if (!event.author) return;
  if (event.author.id === "1107944006735904798") return;

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

async function getCurrentWeather(request, weatherQuery) {
  const weather = await request("/current.json", {
    query: {
      q: weatherQuery,
    },
  });

  return weather;
}

function use(config, client) {
  const api = wrap({
    key: config.weatherToken,
    root: "https://api.weatherapi.com/v1",
  });

  const context = { api };

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

async function warmup() {
  const defaultState = {
    weather: {},
  };

  return Store.update((state) => {
    return {
      ...defaultState,
      ...state,
    };
  });
}

const wrap = (api) => {
  const query = {
    key: api.key,
  };

  return async (path, incomingOptions = {}) => {
    const opts = {
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

module.exports = {
  use,
  processMessage,
  warmup,
};