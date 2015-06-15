var io = require('socket.io-client');
var sa = require('superagent');
var open = require("open");
var url = require("url");
var cp = require("child_process");
var PT = require("stream").PassThrough;
/*
TODO: This needs to be set to the actual url
*/
var stdms = "localhost:8123";
var big_brother_url = "http://stuStatic:pass@localhost:8123";

var io;

//The purpose for this is generally to make sure any calls have auth headers
module.exports.authorize = function(href){
  big_brother_url = href;
  process.stdout.write("ready");
};

module.exports.initialize = function(){
// This will be useful for when we want to force quit bigbrother after the schoolday
  var EE = require("events").EventEmitter;
  io = new EE();
//	MASTER_SERVER = require('socket.io-client')(big_brother_url);

  var cl,el;
  io.once('connect', cl = function(){
    MASTER_SERVER.removeListener('error',el);
    next(void(0),io);
  });
  io.once('error', el = function(e){
    MASTER_SERVER.removeListener('error',cl);
    next(e);
  });
};

module.exports.requestHelp = function(subject,description,snapshot,next){
  console.log(big_brother_url+"HelpRequest");
  var req = sa.post(big_brother_url+"HelpRequest")
    .set("Transfer-Encoding","chunked")
    .field("subject",subject)
    .field("description",description)
    .field("snapshot.snapshotType","helprequest")
    .attach("snapshot.tar",snapshot,"snapshot.tar");
  req.end(next);
};

module.exports.sendCommit = function(subject,hash,message,root,next){
  var stdo = cp
    .spawn("git",["diff", hash+"^", hash],{cwd:root})
    .stdout.pipe(new PT());
  stdo.pause();
  var req = sa
    .post(big_brother_url+"Commit")
    .set("Transfer-Encoding","chunked")
    .field("subject",subject)
    .field("hash",hash)
    .field("commitMessage",message)
//    .attach("test",commit.test.stdout,"test.txt")
    .attach("raw",stdo,"diff.txt");
  req.end(next);
};

module.exports.sendFSDiff = function(subject,type,path,root,next){
  var stdo = cp
    .spawn("git",["diff", "HEAD", path],{cwd:root})
    .stdout.pipe(new PT());
  stdo.pause();
  var req = sa
    .post(big_brother_url+"FSDiff")
    .set("Transfer-Encoding","chunked")
    .field("subject",subject)
    .field("fs_type",type)
    .field("path",path)
//    .attach("test",fsdiff.test.stdout,"test.txt")
    .attach("raw",stdo,"diff.txt");
  req.end(next);
};

module.exports.createProject = function(subject,root,next){
  require("../Abstract/snapshot")(root,function(err,tar){
    if(err) return next(err);
    console.log(big_brother_url+"Project");
    var req = sa.post(big_brother_url+"Project")
      .set("Transfer-Encoding","chunked")
      .field("subject",subject)
      .field("cwd.snapshotType","cwd")
      .attach("cwd.tar",tar,"snapshot.tar");
    req.end(next);
  });
};

/*
  TODO: THIS IS REALLY BAD
    I'm sending the entire tar directory every filesave
    What should be the algorithm is....
      -Figure out what file changed
      -Send the event to the foreign server
    The issue is
      -My Snapshot Model is crap
      -reliance on arrays make it particularly week
      -Use of object to maintain the filesystem is cute but unmaintainable
        -Especially unmaintainable from a delete, file move, and put request when using
*/

module.exports.updateProject = function(id,root,next){
  require("../Abstract/snapshot")(root,function(err,tar){
    if(err) return next(err);
    console.log(big_brother_url+"Project");
    var req = sa.put(big_brother_url+"Project/"+id)
      .set("Transfer-Encoding","chunked")
      .attach("cwd.tar",tar,"snapshot.tar");
    req.end(next);
  });
};
