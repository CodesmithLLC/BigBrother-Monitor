
var snapshot = require("./snapshot");
var parseReq = require("./parse-request");
var MASTER_SERVER = require("../master-server");

module.exports = function(snitcher,req,res,next){
  snapshot(snitcher.path,function(err,tar){
    if(err){
      console.error(err);
      return next(err);
    }
    console.log(req.body);
    MASTER_SERVER.requestHelp(
      snitcher.subject,
      req.body.description,
      tar,
    function(err,helpres){
      console.log("back?");
      if(err){
        console.log(err.message);
        return next(err);
      }
      res.status(200).end();
    });
  });
};
