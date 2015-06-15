var cp = require("child_process");

module.exports = function(number, skip, next){
  cp.exec("git",["log", "--pretty=oneline","-n",number,"--skip",skip],function(e,stdout,stderr){
    if(e) return next(e);
    stdout = stdout.toString("utf8");
    var i = stdout.indexOf(" ");
    next(void 0,{
      message: stdout.substring(i+1),
      hash: stdout.substring(0,i)
    });
  });
};