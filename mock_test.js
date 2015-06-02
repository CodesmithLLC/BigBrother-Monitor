var fs = require("fs");

var files;
describe("dir",function(){
  var counter = 0;
  var expected = ["one.txt","two.txt"];
  files = fs.readdirSync(".");
  it("should have the correct amount of files",function(){
    if(files.length !== expected.length) throw new Error(files.length+"!=="+expected.length);
    files.forEach(function(file){
      if(expected.indexOf(file) !== -1) counter++;
    });
  });
  it("should have files with the correct names",function(){
    if(counter < expected) throw new Error("not all expected files were there");
  });
  it("should have files that are equal to their name",function(){
    files.forEach(function(file){
      if(fs.readFileSync(file).toString("utf8") !== file){
        throw new Error("file was not equal to its name");
      }
    });
  });
});
