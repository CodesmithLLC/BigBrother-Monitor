//TestRunner

var cp = require("child_process");
var Mocha = require('mocha');
var fs = require("fs");
var path = require("path");

var mpDir = path.normalize(__dirname+"/../node_modules/.bin/mocha-phantomjs");
var mDir =  path.normalize(__dirname+"/../node_modules/.bin/mocha");

module.exports = function(path,next){
	var mocha = new Mocha({
    reporter: 'json'
	});
	var env = {};
	for(var key in process.env) {
		env[key] = process.env[key];
	}

	getIndexHTML(path, function(e,indexhtml){
		var test;
		if(!e){
			test = cp.spawn(mpDir,["-R","json",indexhtml],{cwd:path,env:process.env});
		}else{
			test = cp.spawn(mDir,["--reporter","json"],{cwd:path,env:process.env});
		}
		test.stdout.pipe(process.stdout);
		test.stderr.pipe(process.stdout);
		test.on("error",function(e){
			console.log("ignoring test errors");
			console.error(e);
		});
		next(void(0),test);
	});
/*
	console.log(path);
	mocha.reporter(JSONReporter).grep(/test\.js$|test\/.*$/).run(function(){
		console.log(arguments);
		throw stop;
	});
/*	*/
};

function getIndexHTML(path,next){
	fs.stat(path+"/test/index.html",function(e){
		if(!e) return next(void(0),"text/index.html");
		fs.stat(path+"/index.html",function(e){
			next(e,"index.html");
		});
	});
}
