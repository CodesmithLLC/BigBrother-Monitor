var fs = require("fs");
var cp = require("child_process");
var Snitcher = require("../snitcher");
var async = require("async");
var parseDiff = require("diff-parse");
var rimraf = require("rimraf");
var assert = require("assert");

var dir = __dirname+"/temp";
var count = 0;
var queue = [];

var f;
var events = [
  {type:"fs-add",list:"fsdiff",trigger:function(){
    f = Math.floor(Math.random()*100000).toString(16);
    fs.close(fs.openSync(dir+"/"+f+".txt", 'w'),function(){});
  }},{type:"fs-save",list:"fsdiff",trigger:function(){
    fs.writeFile(dir+"/"+f+".txt", "one.txt",function(){
      fs.writeFile(dir+"/"+f+"-2.txt", "two.txt",function(){});
    });
  }},{type:"fs-rem",list:"fsdiff",trigger:function(){
    fs.unlink(dir+"/"+f+".txt",function(){});
  }},{type:"commit",list:"commit",trigger:function(){
    cp.exec("git add --all",{cwd:dir,env:process.env},function(err,stdout,stdin){
      if(err) throw err;
      cp.exec("git commit -m \"committing "+f+"\"",{cwd:dir,env:process.env},function(){});
    });
  }},
];

var snitcher,central_command,citizen_listener;

var tests = [
  ['should throw an error when not inside a git repository',badConstruct],
  ['should not throw an error when inside a git repository',goodConstruct],
  ['should not emit events',async.eachSeries.bind(events,shouldntEmitEvent)],
  ['should start without issue since the constructor was ok',function(done){
    snitcher.start(done);
  }],
  ['should emit events',async.eachSeries.bind(events,shouldEmitEvent)],
];

initialize(function(e){
  if(e) throw e;
  async.filterSeries(tests,function(test,next){
    process.stdout.write(test[0]+": ");
    test[1](function(e){
      if(e){
        console.log("FAILED: ",e.stack);
      }else{
        console.log("Passed");
      }
      next(!e);
    });
  },function(res){
    console.log(Math.floor(100*(res.length/tests.length))+"% Passed");
    cleanup(function(e){
      if(e) throw e;
      process.exit();
    });
  });
});

/*
describe('Snitcher', function() {
  before(initialize);
  after(cleanup);
  describe('#constructor', function(){
    it('should throw an error when not inside a git repository',badConstruct);
    it('should not throw an error when inside a git repository',goodConstruct);
    var t;
    it("should not emit events",function(done){
      this.timeout(0);
      async.eachSeries(events,shouldntEmitEvent,done);
    });
    it("should start without issue since the constructor was ok",function(done){
      snitcher.start(done);
    });
    it("should emit events",function(done){
      this.timeout(0);
      async.eachSeries(events,shouldEmitEvent,done);
    });
  });
});

*/

function initialize (next){
  fs.stat(dir,function(e){
    if(e) return fs.mkdir(dir,next);
    rimraf(dir, function(e){
      if(e) throw e;
      fs.mkdir(dir,next);
    });
  });
}

function cleanup (next){
  snitcher.close();
  rimraf(dir, next);
}

function badConstruct(done){
  try{
    snitcher = Snitcher(dir);
    done(new Error("did not throw an error"));
  }catch(e){
    return done();
  }
}

function goodConstruct(done){
  cp.exec("git init",{cwd:dir,env:process.env},function(err,stdout,stderr){
    if(err) return done(err);
    cp.exec("git remote add origin http://happytown.com",{cwd:dir,env:process.env},function(err,stdout){
      if(err) return done(err);
      try{
        snitcher = Snitcher(dir);
        done();
      }catch(e){
        done(e);
      }
    });
  });
}

function shouldntEmitEvent(item,next){
  var t = setTimeout(function(){
    snitcher.removeAllListeners(item.list);
    next();
  },500);
  snitcher.on(item.list,function(){
    clearTimeout(t);
    next(new Error("recieved an "+item.type));
  });
  item.trigger();
}

function shouldEmitEvent(item,next){
  var t = setTimeout(function(){
          snitcher.removeAllListeners(item.list);
    next(new Error("did not emit "+item.type));
  },500);
  snitcher.on(item.list,function(){
    clearTimeout(t);
    next();
  });
  item.trigger();
}
