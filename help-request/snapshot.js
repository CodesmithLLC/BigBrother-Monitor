var fs = require("fs");
var minimatch = require("minimatch");
var tar = require("tar-fs");

var isWhiteSpace = /^\s*$/;

module.exports = function(path,next){
  fs.readFile(path+"/.gitignore",{encoding:"utf8"},function(err,ignores){
    if(err) return next(err);
    var globMatches = [];
    ignores.split("\n").forEach(function(ignore){
      if(isWhiteSpace.test(ignore)) return;
      globMatches.push(minimatch.filter(ignore, {matchBase: true}));
    });
    return next(void(0),tar.pack(path,{
      ignore:function(name){
        if(/\.git(?:\/.*)$/.test(name)) return true;
        if(/lib\//.test(name)) return true;
        return globMatches.some(function(fn){
          return fn(name);
        });
      }
    }));
  });
};
