//https://github.com/substack/node-git-emit/issues/2
var fs = require("fs");
//var testRunner = require("./testrunner");
var chokidar = require("chokidar");
var cp = require("child_process");
var pathutil = require("path");
var gitEmit = require("git-emit");
var EE = require("events").EventEmitter;
var state = require("./state.json");


function Snitcher(path){
	if(!(this instanceof Snitcher)) return new Snitcher(path);
	EE.call(this);
	var subject = cp.execSync(
		"git config --get remote.origin.url",{cwd:path}
	).toString("utf8");
	if(!subject) throw new Error("Big Brother should be run from within a git repository");
	this.subject = subject;
	this.path = pathutil.normalize(path);
	this.gdir = pathutil.normalize(path+"/.git");
	if(!fs.statSync(this.gdir).isDirectory()){
		throw new Error("Big brother should be started in a git repository");
	}
}

Snitcher.prototype = Object.create(EE.prototype);
Snitcher.prototype.constructor = Snitcher;

Snitcher.prototype.start = function(next){
	var self = this;
	this.git_ee = gitEmit(this.gdir);
	this.fs_watch = chokidar.watch(this.path, {
		ignored: /[\/\\]\.|[\/\\]node_modules|\.log$/,
		ignoreInitial:true
	});

	this.on("commit",function(subject,head,message,path){
		state.projects[subject].commit = head;
	});

	this.git_ee.on("post-commit",function(){
		self.emit("commit",
			self.subject,
			cp.execSync("git log -1 --pretty=%H").toString("utf8"),
			cp.execSync("git log -1 --pretty=%B").toString("utf8"),
			self.path
		);
	});

	this.fs_watch.on('add', function(path) {
		self.emit("fsdiff",
			self.subject,
			"add",
			pathutil.relative(self.path,path),
			self.path
		);
	}).on('change', function(path) {
		self.emit("fsdiff",
			self.subject,
			"save",
			pathutil.relative(self.path,path),
			self.path
		);
	}).on('unlink', function(path) {
		self.emit("fsdiff",
			self.subject,
			"rem",
			pathutil.relative(self.path,path),
			self.path
		);
	}).on("ready",require("./unwatched-changes").bind(this,next));
};

Snitcher.prototype.newProject = function(next){
	state.projects[this.subject] = {
		commit: cp.execSync("git log -1 --pretty=%H").toString("utf8")
	};
	var self = this;
	this.emit("new-project",
		this.subject,
		state.projects[this.subject].commit,
		this.path,
		function(e,res){
			if(e) return next(e);
			state.projects[self.subject]._id = res.body._id;
			self.emit("commit",
				self.subject,
				state.projects[self.subject].commit,
				cp.execSync("git log -1 --pretty=%B").toString("utf8"),
				self.path
			);
		}
	);
};

Snitcher.prototype.getId = function(){
	return state.projects[this.subject]._id;
};

Snitcher.prototype.close = function(){
	this.git_ee.close();
	this.fs_watch.close();
	fs.writeFileSync(__dirname+"/state.json",JSON.stringify(state));
};


module.exports = Snitcher;
