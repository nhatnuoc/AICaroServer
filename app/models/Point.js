
let point = (x, y, type) => {
  return {
    x     : x,
    y     : y,
    type  : type    // x hoặc o hoặc rỗng
  }
}

module.exports = {
  newPoint : point
};
