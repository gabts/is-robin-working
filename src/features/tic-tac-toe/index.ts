import type { Client, Message } from "discord.js";
import * as constants from "../../constants";
import { getDisplayName } from "../../utils";

type Tile = 0 | 1 | 2;

interface Game {
  board: Tile[][];
  turn: 1 | 2;
}

const games = new Map<string, Game>();

function r(board: Tile[][], row: number, col: number) {
  const tile = board[row]![col]!;
  return tile === 1 ? "x" : tile === 2 ? "o" : " ";
}

function renderBoard(b: Tile[][]) {
  let str = "```";
  str += "\n   1   2   3";
  str += `\nA  ${r(b, 0, 0)} | ${r(b, 0, 1)} | ${r(b, 0, 2)}`;
  str += "\n  -----------";
  str += `\nB  ${r(b, 1, 0)} | ${r(b, 1, 1)} | ${r(b, 1, 2)}`;
  str += "\n  -----------";
  str += `\nC  ${r(b, 2, 0)} | ${r(b, 2, 1)} | ${r(b, 2, 2)}`;
  str += "```";
  return str;
}

function checkFinished(board: Tile[][], player: 1 | 2) {
  for (const row of board) {
    if (row.every((tile) => tile === player)) return true;
  }

  if (
    board[0]![0] === player &&
    board[1]![1] === player &&
    board[2]![2] === player
  ) {
    return true;
  }

  if (
    board[0]![2] === player &&
    board[1]![1] === player &&
    board[2]![0] === player
  ) {
    return true;
  }

  return false;
}

const reactions: {
  check: RegExp;
  callback: (event: Message, content: string) => void;
}[] = [
  {
    check: /^!tic-tac-toe$/i,
    callback: (event, content) => {
      const currentGame = games.get(event.channelId);
      if (currentGame) return;

      const board: Tile[][] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      games.set(event.channelId, {
        board,
        turn: 1,
      });

      event.channel.send(
        "game started. player 1s turn.\n" + renderBoard(board)
      );
    },
  },
  {
    check: /^([A-C][1-3]|[1-3][A-C])$/i,
    callback: (event, content) => {
      const game = games.get(event.channelId);
      if (!game) return;

      const [row, col] = content
        .split("")
        .map((s) => s.toLowerCase())
        .reduce(
          (acc, val) => {
            switch (val) {
              case "b":
                acc[0] = 1;
                break;
              case "c":
                acc[0] = 2;
                break;
              case "2":
                acc[1] = 1;
                break;
              case "3":
                acc[1] = 2;
                break;
            }
            return acc;
          },
          [0, 0]
        );

      if (game.board[row]![col] !== 0) return;

      game.board[row]![col] = game.turn;

      if (checkFinished(game.board, game.turn)) {
        event.channel.send(
          `player ${game.turn} wins! 🎉🎉🎉 \n` + renderBoard(game.board)
        );
        return;
      }

      game.turn = game.turn === 1 ? 2 : 1;

      event.channel.send(
        `player ${game.turn}s turn. \n` + renderBoard(game.board)
      );
    },
  },
];

function use(client: Client) {
  client.on("messageCreate", (event) => {
    if (event.author.id === constants.APPLICATION_ID) return;

    const content = event.content.trim();

    for (const reaction of reactions) {
      if (reaction.check.test(content)) {
        reaction.callback(event, content);
        return;
      }
    }
  });
}

export default {
  use,
};