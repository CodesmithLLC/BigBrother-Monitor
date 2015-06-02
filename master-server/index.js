var io = require('socket.io-client');
var sa = require('superagent');

var stdms = "localhost:8123";
var big_brother_url = "http://stuStatic:pass@localhost:8123";

var io;

//The purpose for this is generally to make sure any calls have auth headers
module.exports.authorize = function(token){
  console.log(token);
  big_brother_url = "http://"+token.user+":"+token.token+"@"+stdms;
};

module.exports.initialize = function(){
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
  console.log(big_brother_url+"/HelRequest");
  var req = sa.post(big_brother_url+"/HelpRequest")
    .set("Transfer-Encoding","chunked")
    .field("subject",subject)
    .field("description",description)
    .attach("raw",snapshot,"snapshot.tar");
  req.end(next);
};

module.exports.sendCommit = function(commit){
  var req = sa
    .post(big_brother_url+"/Commit")
    .set("Transfer-Encoding","chunked")
    .field("subject",commit.subject)
    .field("commitMessage",commit.message)
//    .attach("test",commit.test.stdout,"test.txt")
    .attach("raw",commit.diff,"diff.txt");
  req.end(function(err,res){
    if(err) throw err;
    console.log("success");
  });
};

module.exports.sendFSDiff = function(fsdiff){
  var req = sa
    .post(big_brother_url+"/FSDiff")
    .set("Transfer-Encoding","chunked")
    .field("subject",fsdiff.subject)
    .field("path",fsdiff.path)
    .field("fs_type",fsdiff.type)
//    .attach("test",fsdiff.test.stdout,"test.txt")
    .attach("raw",fsdiff.diff,"diff.txt");
  req.end(function(err,res){
    if(err) throw err;
    console.log("success");
  });
};
