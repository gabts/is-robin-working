const fs = require("fs");
const utils = require("./utils");

const state = {
  isWorking: false,
  lastUpdateMs: new Date().getTime(),
};

function writeStateCache() {
  fs.writeFile("./cache.json", JSON.stringify(state), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

// read cached state to preserve state between restarts
fs.readFile("./cache.json", (err, data) => {
  if (err) {
    // first time setup, cache doesn't exist yet
    writeStateCache();
    return;
  }

  const cachedState = JSON.parse(data.toString("utf8"));
  console.log("found cached state", cachedState);
  state.isWorking = cachedState.isWorking;
  state.lastUpdateMs = cachedState.lastUpdateMs;
});

function updateStateIsWorking(bool) {
  state.isWorking = bool;
  writeStateCache();
}

// checks if date has changed and toggles working state
function refreshState() {
  console.log("running update!");

  const lastUpdateDate = new Date(state.lastUpdateMs).getDate();
  const today = new Date();
  const date = today.getDate();

  if (date === lastUpdateDate) return;

  state.lastUpdateMs = today.getTime();

  if (utils.isWeekend(today)) return;

  updateStateIsWorking(!state.isWorking);
}

// interval to automatically toggle if robin is working next work day
setInterval(refreshState, 1000 * 60 * 60);

module.exports = {
  state,
  refreshState,
  updateStateIsWorking,
};
