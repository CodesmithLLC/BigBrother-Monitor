var async = require("async");
var sa = require("superagent");

var commonIpAddresses = [
"192.168.0.0",    // D-Link, Linksys, Netgear, Senao, Trendtech,
"192.168.1.0",    // 3com, Asus, Dell, D-Link, Linksys, MSI, Speedtouch, Trendtech, US Robotics, Zytel,
"192.168.2.0",    // Belkin, Microsoft, Trendtech, US Robotics, Zyxel,
"192.168.10.0",   // Motorola, Trendtech, Zyxel
"192.168.11.0",   // Buffalo
"10.0.0.0",       // Speedtouch, Zyxel,
"10.0.1.0",       // Apple, Belkin, D-Link

"192.168.20.0",   // Motorola
"192.168.30.0",   // Motorola
"192.168.50.0",   // Motorola
"192.168.62.0",   // Motorola
"192.168.100.0",  // Motorola
"192.168.101.0",  // Motorola
"192.168.4.0",    // Zyxel
"192.168.8.0",    // Zyxel
"192.168.123.0",  // US Robotics
"192.168.254.0",  // Flowpoint
];

var commonCClassParts = [1, 2, 3, 10, 11, 12, 20, 21, 22, 50, 51, 52, 100, 101, 102, 150, 151, 152, 200, 201, 202];


var defaults = [
  /*port:*/8213,
  /*start:*/1,
  /*end:*/254
];
/*
  what would be nice here is some lazy lists....
*/


module.exports = function(port,start,end,next){
  var timeout = 5*1000;
  if(arguments.length < 1 || arguments.length > 4){
    throw new Error("Improper number of arguments");
  }
  if(arguments.length === 1){
    next = arguments[0];
    port = defaults[0];
    start = defaults[1];
    end = defaults[2];
  }else if(arguments.length === 2){
    next = arguments[1];
    start = defaults[1];
    end = defaults[2];
  }else if(arguments.length === 3){
    next = arguments[2];
    end = defaults[2];
  }

  var ips = [];
  // Lazy list here pls
  commonIpAddresses.forEach(function(ip){
    commonCClassParts.forEach(function(part){
      ips.push(ip.replace(/\d+$/, part));
    });
  });
  async.detect(ips,function(ip,next){
    sa.get("http://"+ip)
    .timeout(timeout)
    .end(function(e,res){
      if(e) return next(!("timeout" in e));
      next(true);
    });
  }, function(found){
    if(!found) return next(new Error("could not find the router"));
    var ips = [];
    //Lazy list here pls
    for (var i = start; i <= end; i++) {
      ips.push(found.replace(/\d+$/, i));
    }
    async.filter(ips,function(ip,next){
      sa.get("http://"+ip+":"+port+"/are-you-here")
      .timeout(timeout)
      .end(function(e,res){
        if(e){
          return next(false);
        }
        next(res.text === "yes I am");
      });
    },next.bind(next,void 0));
  });
};
