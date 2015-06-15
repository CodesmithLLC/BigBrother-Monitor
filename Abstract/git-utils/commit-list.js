var cp = require("child_process");
var split = require("split");

module.exports = function(cwd){
  var c = cp
    .spawn("git",["log", "--pretty=format:\"%H %B\""],{cwd:cwd,stdio:'pipe'});
  c.lines = c.stdout.pipe(split());
  return c;
};
