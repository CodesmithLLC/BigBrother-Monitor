var cp = require("child_process");

module.exports = function(cwd,next){
  cp.exec("git remote show origin",{cwd:cwd},function(e,stdout,stderr){
    if(e) return next(e);
    stdout = stdout.toString("utf8");
    stdout = stdout.substring(stdout.indexOf("Fetch URL: ")+11);
    stdout = stdout.substring(0,stdout.indexOf("\n"));
    next(void 0, stdout);
  });
};