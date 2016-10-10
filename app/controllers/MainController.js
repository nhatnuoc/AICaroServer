const express = require("express");
const point = require("../models/Point");
const appConfig = require("../configs/app");

module.exports = () => {
  let router = express.Router();

  router.get("/", (req, res) => {

    res.render("index.html", {
      // users : users,
      // points : points
      table_size : appConfig.caro_table
    });
  })

  router.get("/play/:team_id", (req, res) => {
    res.render("team.html", {
      team       : req.params.team_id,
      table_size : appConfig.caro_table
    });
  });

  return router;
}
