var cp = require("child_process");



module.exports = function(commitprev, commitlate, cwd, next){
  return cp.spawn("git",["diff", commitprev, commitlate],{cwd:cwd,stdio:'pipe'});
};