var fs = require("fs");
var cp = require("child_process");
var Snitcher = require("../snitcher");
var async = require("async");
var parseDiff = require("diff-parse");
var rimraf = require("rimraf");
var assert = require("assert");

var dir = __dirname+"/temp2";

var snitcher,central_command,citizen_listener;

var events = [
  {
    name: "fs create should fail",
    list: "fsdiff",
    trigger:function(){
      fs.writeFile(dir+"/one.txt","one.txt");
      return dir+"/one.txt";
    },
    diffCheck:function(d){ return d === "fs-add"; },
    fails:true
  },
  {
    name: "fs create should pass",
    list: "fsdiff",
    trigger:function(){
      fs.writeFile(dir+"/two.txt","two.txt");
      return dir+"/two.txt";
    },
    diffCheck:function(d){ return d === "fs-add"; },
    fails:false
  },
  {
    name: "fs save",
    list: "fsdiff",
    trigger:function(){
      fs.writeFile(dir+"/one.txt","one");
      return dir+"/one.txt";
    },
    diffCheck:parseDiff,
    fails:true
  },
  {
    name: "fs save",
    list: "fsdiff",
    trigger:function(){
      fs.writeFile(dir+"/one.txt","one.txt");
      return dir+"/one.txt";
    },
    diffCheck:parseDiff,
    fails:false
  },
  {
    name: "fs delete",
    list: "fsdiff",
    init:function(){
      fs.closeSync(fs.openSync(dir+"/three.txt", 'w'));
    },
    trigger:function(){
      fs.unlink(dir+"/three.txt");
      return dir+"/three.txt";
    },
    diffCheck:function(d){return d === "fs-rem";},
    fails:false
  },
  {
    name: "fs delete",
    list: "fsdiff",
    trigger:function(){
      fs.unlink(dir+"/one.txt");
      return dir+"/one.txt";
    },
    diffCheck:function(d){return d === "fs-rem";},
    fails:true
  },
  {
    name: "git commit",
    list: "commit",
    trigger:function(){
      cp.exec("git add --all",{cwd:dir},function(){
        cp.exec("git commit -m \"committing 1\"",{cwd:dir});
      });
    },
    diffCheck:parseDiff,
    fails:true
  },
  {
    name: "git commit",
    list: "commit",
    init:function(){
      fs.writeFileSync(dir+"/one.txt","one.txt");
    },
    trigger:function(){
      cp.exec("git add --all",{cwd:dir},function(){
        cp.exec("git commit -m \"committing 2\"",{cwd:dir});
      });
    },
    diffCheck:parseDiff,
    fails:false
  },
];

initialize(function(e){
  if(e) throw e;
  async.filterSeries(events, function(test,next){
    process.stdout.write(test.name+": ");
    runEvent(test,function(e){
      if(e){
        console.log("FAILED: ",e.stack);
      }else{
        console.log("Passed");
      }
      next(!e);
    });
  }, cleanup);
});


function initialize(done){
  function fin(e){
    if(e) return done(e);
    fs.mkdir(dir,function(e){
      if(e) return done(e);
      cp.exec("git init",{cwd:dir},function(e){
        if(e) return done(e);
        cp.exec("git remote add origin http://happytown.com",{cwd:dir},function(e){
          if(e) return done(e);
          fs.createReadStream(__dirname+'/../mock_test.js')
          .pipe(fs.createWriteStream(dir+'/test.js'))
          .on("finish",function(){
            cp.exec("git add --all; git commit -m \"first\"",{cwd:dir},function(e){
              if(e) return done(e);
              snitcher = Snitcher(dir);
              setTimeout(function(){
                snitcher.start(done);
              },100);
            });
          }).on("error",done);
        });
      });
    });
  }
  fs.stat(dir,function(e){
    if(!e) return rimraf(dir, fin);
    fin();
  });
}

function cleanup(res){
  snitcher.close();
  console.log(Math.floor(100*(res.length/events.length))+"% Passed");
  rimraf(dir,function(err){
    if(err) throw err;
    process.exit();
  });
}

function runEvent(item,next){
  if(item.init) item.init();
  var t, l,input;
  t = setTimeout(function(){
    snitcher.removeAllListeners(item.list);
    next(new Error("did not emit an event"));
  },1000);
  snitcher.once(item.list,function(d){
    clearTimeout(t);
    try{
      checkData(input,d,item.diffCheck,item.fails);
      next();
    }catch(e){
      next(e);
    }
  });
  input = item.trigger();
}

function checkData(inputpath,diff,diffHandler,pf){
  console.log(diff);
  [
    {key:"subject",test:function(){}},
    {key:"path",test:function(){
      assert(diff.path === inputpath,"["+diff.path+","+inputpath+"] should be equal");
    }},
    {key:"diff",test:function(){
      assert.doesNotThrow(function(){
        diffHandler(diff.diff);
      },"diff should be ok");
    }},
    {key:"test",test:function(){
      if(pf){
        assert(diff.test.stats.failures > 0, "test should be passing");
      }else{
        assert(diff.test.stats.failures === 0,"test should be failing");
      }
    }},
  ].forEach(function(item){
    assert(typeof diff[item.key] !== "undefined","should have a "+item.key);
    item.test();
  });
}

/*
describe('Snitcher', function() {
  before(initialize);
  after(cleanup);
  describe('#events',function(){
    var diff;
    it("should start emit an event when a file is created",runEvent.bind(events[0]));
    it("should have a passing test",runEvent.bind(events[1]));
    it("should start emit an event when a file is modified",runEvent.bind(events[2]));
    it("should have a passing test",runEvent.bind(events[3]));
    it("should emit an event when a file is deleted",runEvent.bind(events[4]));
    it("should have a failing test",runEvent.bind(events[5]));
    it("should emit an event when a commit is made deleted",runEvent.bind(events[6]));
    it("should have a passing test",runEvent.bind(events[7]));
  });
});


function checkFailData(inputpath,diff,diffHandler,pf){
  ["subject","path","test","diff"].forEach(function(key){
    it("should have a "+key,function(){
      assert(typeof diff[key] !== "undefined");
    });
  });
  it("path should be correct",function(){
    assert(diff.path === inputpath);
  });
  it("diff should be ok",function(){
    assert(diffHandler(diff.diff));
  });
  it("test should be "+(pf?"passing":"failing"),function(){
    if(pf){
      assert(diff.test.stats.failures > 0);
    }else{
      assert(diff.test.stats.failures === 0);
    }
  });
}
*/
