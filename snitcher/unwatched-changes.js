var cp = require("child_process");
var split = require("split");
var async = require("async");
var state = require("./state.json");


module.exports = checkForUnAddedCommits;

function checkForUnAddedCommits(next){
  if(!(this.subject in state.projects)){
    return this.newProject(next);
  }
  var self = this;
  var before = [];
  var found = false;

  var c = cp.spawn("git",
    ["log", "--pretty=format:\"%H %B\""],
    {cwd:this.path,stdio:'pipe'}
  );
  c.stdout.pipe(split()).on("data",function(line){
    if(found !== false)
      return console.log("data after found");
    line = line.toString("utf8");
    var i = line.indexOf(" ");
    var hash = line.substring(0,i);
    var message = line.substring(i+1);
    console.log(hash,state.projects[self.subject].commit);
    if(hash !== state.projects[self.subject].commit){
      before.unshift([hash,message]);
    }
    found = line;
    c.kill();
  });
  c.on("close",function(){
    if(found === false){
      return next(new Error("We think we have a valid commit, but doesn't exist in history"));
    }else{
      before.forEach(function(ari){
        self.emit("commit",self.subject,ari[0],ari[1],self.path);
      });
    }
    next();
    //We start with 0, but we want to end right before the found element
  });
  c.on("error",next);
}