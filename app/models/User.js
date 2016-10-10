const pointModel = require('./Point');

let addMove = (user, x, y) => {
  user.moves.push(pointModel.newPoint(x, y, team));
};

let newUser = (team) => {
  return {
    team : team,
    moves : []
  }
}

module.exports = {
  newUser : newUser,
  addMove : addMove
}
