//https://github.com/substack/node-git-emit/issues/2
var fs = require("fs");
//var testRunner = require("./testrunner");
var simpleGit = require("simple-git");
var chokidar = require("chokidar");
var cp = require("child_process");
var pathutil = require("path");
var gitEmit = require("git-emit");
var EE = require("events").EventEmitter;
var PT = require("stream").PassThrough;


function Snitcher(path){
	if(!(this instanceof Snitcher)) return new Snitcher(path);
	EE.call(this);
	var subject = cp.execSync(
		"git config --get remote.origin.url",{cwd:path}
	).toString("utf8");
	if(!subject) throw new Error("Big Brother should be run from within a git repository");
	this.subject = subject;
	this.path = pathutil.resolve(path);
	this.gdir = pathutil.resolve(path+"/.git");
	if(!fs.statSync(this.gdir).isDirectory()){
		throw new Error("Big brother should be started in a git repository");
	}
}

Snitcher.prototype = Object.create(EE.prototype);
Snitcher.prototype.constructor = Snitcher;

Snitcher.prototype.start = function(next){
	var self = this;
	this.git_handle = simpleGit(this.path);
	this.git_ee = gitEmit(this.gdir);
	this.fs_watch = chokidar.watch(this.path, {
		ignored: /[\/\\]\.|[\/\\]node_modules|\.log$/,
		ignoreInitial:true
	});

	this.git_ee.on("post-commit",function(){
		var stdo = cp
			.spawn("git",["diff", "HEAD^", "HEAD"],{cwd:self.path})
			.stdout.pipe(new PT());
		stdo.pause();
//		testRunner(self.path,function(err,test_res){
//			if(err) self.emit("error",err);
			self.emit("commit",{
				subject:self.subject,
				message: cp.execSync("git log -1 --pretty=%B").toString("utf8"),
				diff:stdo,
//				test:test_res
			});
//		});
	});

	this.fs_watch.on('add', function(path) {
		var stdo = cp
			.spawn("git",["diff", "HEAD", path],{cwd:self.path})
			.stdout.pipe(new PT());
		stdo.pause();
//		testRunner(self.path,function(err,test_res){
//			if(err) self.emit("error",err);
			self.emit("fsdiff",{
				subject:self.subject,
				type:"add",
				diff:stdo,
				path:path,
//				test:test_res
			});
//		});
	}).on('change', function(path) {
		var stdo = cp
			.spawn("git",["diff", "HEAD", path],{cwd:self.path})
			.stdout.pipe(new PT());
		stdo.pause();
//		testRunner(self.path,function(err,test_res){
//			if(err) self.emit("error",err);
			self.emit("fsdiff",{
				subject:self.subject,
				type:"save",
				diff:stdo,
				path:path,
//				test:test_res
			});
//		});
	}).on('unlink', function(path) {
		var stdo = cp
			.spawn("git",["diff", "HEAD", path],{cwd:self.path})
			.stdout.pipe(new PT());
		stdo.pause();
//		testRunner(self.path,function(err,test_res){
//			if(err) self.emit("error",err);
			self.emit("fsdiff",{
				subject:self.subject,
				type:"rem",
				diff:stdo,
				path:path,
//				test:test_res
			});
//		});
	});
	setImmediate(next);
};

Snitcher.prototype.close = function(){
	this.git_ee.close();
	this.fs_watch.close();
};

module.exports = Snitcher;
