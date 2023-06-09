import { Feature } from "../../types";

type Player = 1 | 2;
type Tile = 0 | Player;
type Board = Tile[][];

interface Game {
  board: Board;
  turn: 1 | 2;
}

const games = new Map<string, Game>();

function r(board: Board, row: number, col: number) {
  const tile = board[row]![col]!;
  return tile === 1 ? "x" : tile === 2 ? "o" : " ";
}

function renderBoard(b: Board) {
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

function checkFinished(board: Board, player: Player) {
  // any horizontal line
  if (board.some((row) => row.every((tile) => tile === player))) return true;

  // any vertical line
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      if (board[row]![col] !== player) break;
      if (row === 2) return true;
    }
  }

  // diagonal line
  if (
    board[0]![0] === player &&
    board[1]![1] === player &&
    board[2]![2] === player
  ) {
    return true;
  }

  // other diagonal line
  if (
    board[0]![2] === player &&
    board[1]![1] === player &&
    board[2]![0] === player
  ) {
    return true;
  }

  return false;
}

const feature: Feature = {
  name: "TicTacToe",
  reactions: [
    {
      check: /^!tic-tac-toe$/i,
      handler: (_context, message) => {
        const currentGame = games.get(message.channelId);
        if (currentGame) return;

        const board: Board = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];

        games.set(message.channelId, {
          board,
          turn: 1,
        });

        message.channel.send(
          "game started. player 1s turn.\n" + renderBoard(board)
        );
      },
    },
    {
      check: /^!tic-tac-toe stop$/i,
      handler: (_context, message) => {
        games.delete(message.channelId);
        message.reply("tic tac toe game stopped.");
      },
    },
    {
      check: /^([A-C][1-3]|[1-3][A-C])$/i,
      handler: (_context, message, match) => {
        const game = games.get(message.channelId);
        if (!game) return;

        const [row, col] = match[0]
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
          message.channel.send(
            `player ${game.turn} wins! 🎉🎉🎉 \n` + renderBoard(game.board)
          );
          games.delete(message.channelId);
          return;
        }

        game.turn = game.turn === 1 ? 2 : 1;

        message.channel.send(
          `player ${game.turn}s turn. \n` + renderBoard(game.board)
        );
      },
    },
  ],
};

export default feature;
