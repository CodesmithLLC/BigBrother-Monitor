
var async = require("async");
var MASTER_SERVER = require("./master-server");
var authorized = false;
var open = require("open");
var url = require("url");
/*
  npm install -g codesmith
  codesmith bigbrother

	https://www.npmjs.com/package/background-service-runner

*/

//globals here are fine
var STUDENT_PORTAL_LISTENER, snitcher, MASTER_SERVER_URL;

async.series([
	createStudentPortalListener,
	startOurMonitor,
	updateProject,
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
	STUDENT_PORTAL_LISTENER.post("/send-help-request",function(req,res,next){
		require("./help-request/route")(snitcher,req,res,next);
	});

	var t = setTimeout(function(){
		require("./Abstract/scouter")(function(text){
			return text === "yes I am";
		},8123,1,254,function(e,ips){
			if(e) throw e;
			stdms = ips[0]+":8123";
			open("http://"+stdms);
		});
	},10*1000);

	STUDENT_PORTAL_LISTENER.post("/token",function(req,res){
		console.log("post token");
		console.log(req.body.token);
		if(t){
			clearTimeout(t);
			t = false;
		}
		if(!req.body.href){
			return res.status().end();
		}
		MASTER_SERVER_URL = "http://"+req.body.user+":"+req.body.token+"@"+url.parse(req.body.href).host;
		MASTER_SERVER_URL = url.parse(MASTER_SERVER_URL);
		console.log(MASTER_SERVER_URL);

		MASTER_SERVER.authorize(MASTER_SERVER_URL.href);
		res.status(200).end();
		next();
	});
	STUDENT_PORTAL_LISTENER.use(function(err,req,res,next){
		if(err) console.error(err.stack);
		next();
	});
	STUDENT_PORTAL_LISTENER.listen(8001);
}

/*

	TODO: Handle Branch changes

*/

function startOurMonitor(next){
	console.log("starting out monitor");
	var cp = require("child_process");
	var PT = require("stream").PassThrough;
	snitcher = new (require("./snitcher"))(process.cwd());
	/*
		TODO: This is getting freaking ugly
	*/
	snitcher.on("new-project",function(subject,head,root,next){
		console.log("creating project");
		MASTER_SERVER.createProject(subject,root,next);
	});
	snitcher.on("commit",function(subject,head,message,root){
		/*
			testRunner(self.path,function(err,test_res){
			TODO: Reimplement tests when all tests can be run with "npm test"
		*/
		MASTER_SERVER.sendCommit(subject,head,message,root,function(e,res){
			if(e) throw e;
			console.log("success");
		});
	});
	snitcher.on("fsdiff",function(subject,type,path,root){
		/*
			var testRunner = require("./snitcher/testrunner");
			testRunner(self.path,function(err,test_res){
			TODO: Reimplement tests when all tests can be run with "npm test"
		*/
		MASTER_SERVER.sendFSDiff(subject,type,path,root,function(e,res){
			if(e) throw e;
			console.log("success");
		});
		MASTER_SERVER.updateProject(snitcher.getId(),root,function(e,res){
			if(e) throw e;
			console.log("success");
		});
	});
	process.on("exit",function(){
		console.log("exiting");
		snitcher.close();
	});
	snitcher.start(next);
}

function updateProject(next){
	console.log("updating project");
	MASTER_SERVER.updateProject(snitcher.getId(),snitcher.path,next);
}
