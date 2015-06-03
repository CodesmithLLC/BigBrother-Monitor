#!/usr/bin/env node

var fs = require('fs'),
	program = require('commander'),
	spawn = require('child_process').spawn,
	pidStore = __dirname+"/pid",
	open = require("open");

if(!fs.existsSync(__dirname+"/debug")){
	fs.mkdirSync(__dirname+"/debug");
}

program
.command('stop')
.action(function () {

	try{
		var pid = fs.readFileSync(pidStore).toString("utf8");
		fs.unlinkSync(pidStore);
		process.kill(pid);
	}catch(e){
		console.log("You likely don't have Big Brother around");
		//console.error(e);
	}
	console.log("Big Brother is no longer watching");
});


program
.command('start')
.action(function(){
	try{
		var pid = fs.readFileSync(pidStore).toString("utf8");
		fs.unlinkSync(pidStore);
		process.kill(pid);
		console.log("killed old brother");
	}catch(e){
	}
	var	d = Date.now(),
			out = fs.openSync(__dirname+'/debug/'+d+'.out.log', 'a'),
			err = fs.openSync(__dirname+'/debug/'+d+'.err.log', 'a');

	var child = spawn('node', [__dirname+'/server'], {
		detached: true,
		stdio: [ 'ignore', out, err ],
		env:process.env,
		gid:process.getgid(),
		uid:process.getuid(),
	});
	fs.writeFileSync(pidStore, child.pid.toString());
	child.unref();
	fs.createReadStream(__dirname+"/assets/illuminati.txt")
	.on("end",function(){
		console.log("Big Brother is watching @_@");
	}).pipe(process.stdout);
});

program.command('debug').action(function(){
	require(__dirname+"/server");
});

program.version('0.0.1').parse(process.argv);
