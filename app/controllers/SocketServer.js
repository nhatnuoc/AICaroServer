
const express = require("express");
const server = require('http').Server(express);
const io = require('socket.io')(server);
const userModel = require('../models/User');
const appConfig = require("../configs/app");

let allMoves = new Array(appConfig.caro_table.row_nums);
let allUsers = [];

let checkGameResult = (point) => {
  if (checkHorizontal(point) || checkVertical(point) || checkDiagonalLeft(point) || checkDiagonalRight(point)) {
    return point.type;
  }
  return "";
}

let checkHorizontal = (point) => {
  console.log("---check horizontal");
  let resultCount = 1;
  let newX = parseInt(point.x) - 1;
  let newY = parseInt(point.y);
  let type = point.type;
  console.log("point: " + point.type);

  while (newX >= 0 && allMoves[newX][newY] === type) {
    console.log("all moves 1: " + allMoves[newX][newY]);
    resultCount++;
    newX--;
  }
  console.log("new x 1: " + newX);
  newX = parseInt(point.x) + 1;
  newY = parseInt(point.y);
  console.log("new x 2: " + newX);
  while (newX < appConfig.caro_table.row_nums && allMoves[newX][newY] === type) {
    console.log("all moves 2: " + allMoves[newX + 1][newY]);
    resultCount++;
    newX++;
  }

  console.log("caro size " + appConfig.caro_table.row_nums);
  console.log("result count: " + resultCount);
  console.log("---end check horizontal");
  return resultCount >= 5;
}

let checkVertical = (point) => {
  console.log("---check vertical");
  let resultCount = 1;
  let newX = parseInt(point.x);
  let newY = parseInt(point.y) - 1;
  let type = point.type;
  while (newY >= 0 && allMoves[newX][newY] === type) {
    resultCount++;
    newY--;
  }
  newX = parseInt(point.x);
  newY = parseInt(point.y) + 1;
  while (newY < appConfig.caro_table.col_nums && allMoves[newX][newY] === type) {
    resultCount++;
    newY++;
  }
  console.log("---end check vertical");
  return resultCount >= 5;
}

let checkDiagonalLeft = (point) => {
  console.log("---check diagonal left");
  let resultCount = 1;
  let newX = parseInt(point.x) - 1;
  let newY = parseInt(point.y) - 1;
  let type = point.type;
  while (newX >= 0 && newY >= 0 && allMoves[newX][newY] === type) {
    resultCount++;
    newY--;
    newX--;
  }
  newX = parseInt(point.x) + 1;
  newY = parseInt(point.y) + 1;
  while (newX < appConfig.caro_table.row_nums && newY < appConfig.caro_table.col_nums && allMoves[newX][newY] === type) {
    resultCount++;
    newY++;
    newX++;
  }

  console.log("---end check diagonal left");
  return resultCount >= 5;
}

let checkDiagonalRight = (point) => {
  console.log("---check diagonal right");

  let resultCount = 1;
  let newX = parseInt(point.x) - 1;
  let newY = parseInt(point.y) + 1;
  let type = point.type;
  while (newX >= 0 && newY < appConfig.caro_table.col_nums && allMoves[newX][newY] === type) {
    resultCount++;
    newY++;
    newX--;
  }
  newX = parseInt(point.x) + 1;
  newY = parseInt(point.y) - 1;
  while (newX < appConfig.caro_table.row_nums && newY >= 0 && allMoves[newX][newY] === type) {
    resultCount++;
    newY--;
    newX++;
  }

  console.log("---end check diagonal right");
  return resultCount >= 5;
}

let resetCaroBoard = () => {
  allMoves = new Array(appConfig.caro_table.row_nums);
  for (let i = 0; i < appConfig.caro_table.row_nums; i++) {
    allMoves[i] = new Array(appConfig.caro_table.col_nums);
  }
}

let createNewGame = () => {
  resetCaroBoard();
  allUsers = [];
}

let socketServer = () => {
  return new Promise((resolve, reject) => {
    io.on('connection', (socket)  => {
      let timer;
      let isMoved = false;

      let team = socket.handshake.query.team;
      for (var user in allUsers) {
        if (user.team == team) {
          io.to(socket.id).emit("connect_refuse");
          socket.disconnect();
          return;
        }
      }

      if ((typeof team !== 'undefined' && team) || team != "host") {
        io.emit("new_user_connected", {
          team : team
        })
      }

      createNewGame();

      let newUser = userModel.newUser(team)
      allUsers.push(newUser);

      socket.on("move", point => {
        isMoved = true;

        // allPoints.push(point);
        var turn = point.type == "x" ? "o" : "x";
        let newX = point.x;
        let newY = point.y;
        let checkType = point.type;
        allMoves[newX][newY] = checkType;
        let gameResult = checkGameResult(point);
        console.log("--all move: \n" + allMoves);
        console.log("--");
        console.log("game result " + gameResult);
        io.emit("change_turn", {
          point       : point,
          turn        : turn,
          gameResult  : gameResult
        });

        setTimeout(() => {
          if (!isMoved) {
            io.emit("time_out", {
              gameResult : point.type
            });
            createNewGame();
          }
        }, 10000);

        if (gameResult != "") {
          createNewGame();
        }
      });

      socket.on("disconnect", () => {
        let index = allUsers.indexOf(newUser);
        allUsers.splice(index, 1);
        socket.disconnect();
        io.emit("team_disconnected", {
          team : team
        });
      });

    });

    server.listen(3000, () => {
      resolve();
    });
    server.on("error", (error) => {
      reject(error);
    })
  })
}

module.exports = socketServer;
