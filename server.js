
var async = require("async");
var MASTER_SERVER = require("./master-server");

var authorized = false;
/*
  npm install -g codesmith
  codesmith bigbrother

	https://www.npmjs.com/package/background-service-runner

*/

//globals here are fine
var STUDENT_PORTAL_LISTENER, snitcher;

async.parallel([
	startOurSnitcher,
	createStudentPortalListener,
//	listenToStartASnitcher
],function(err){
	if(err) throw err;
});

function createStudentPortalListener(next){
	var express = require("express");
	STUDENT_PORTAL_LISTENER = express();
	STUDENT_PORTAL_LISTENER.use(function(req,res,next){
		console.log(req.url);
		res
		.set("Access-Control-Allow-Methods: POST GET")
		.set("Access-Control-Allow-Origin", "*")
		.set("Access-Control-Allow-Headers","Origin, Content-Type");
		next();
	});
	STUDENT_PORTAL_LISTENER.use(express.static(__dirname+"/test_tools"));

	STUDENT_PORTAL_LISTENER.use(require('body-parser')());
	STUDENT_PORTAL_LISTENER.post("/send-help-request",
		require("./help-request/route").bind(void 0,snitcher)
	);
	STUDENT_PORTAL_LISTENER.post("/token",function(req,res){
		MASTER_SERVER.authorize(req.body);
		res.status(200).end();
	});

	STUDENT_PORTAL_LISTENER.listen(8001);
}

function startOurSnitcher(next){
	snitcher = new (require("./snitcher"))(process.cwd());
	snitcher.on("commit",function(commit){
		MASTER_SERVER.sendCommit(commit);
	});
	snitcher.on("fsdiff",function(diff){
		MASTER_SERVER.sendFSDiff(diff);
	});
	snitcher.start(next);

	process.on("exit",function(){
		console.log("exiting");
		snitcher.close();
	});
}
