var defaults = [
  /*port:*/8213,
  /*start:*/1,
  /*end:*/254
];
/*
  what would be nice here is some lazy lists....
*/


var lookforLocal = function(port,start,end,next){
  var ips = [];
  // Lazy list here pls
  lookforLocal.commonIpAddresses.forEach(function(ip){
    lookforLocal.commonCClassParts.forEach(function(part){
      ips.push(ip.replace(/\d+$/, part))
    });
  });
  async.detect(ips,function(ip,next){
    $.ajax({
      url:"http://"+ip,
      timeout:timeout
    }).done(next.bind(next,true))
    .error(function(x,t,m){
      next(t==="timeout");
    });
  }, function(){
    if(!found) return next(new Error("could not find the router"));
    var ips = [];
    //Lazy list here pls
    for (var i = config.start; i <= config.end; i++) {
      ips.push(result.replace(/\d+$/, i));
    }
    async.filter(ips,function(ip,next){
      $.ajax({
        url:"http://"+ip+"/are-you-here",
        timeout:timeout
      }).done(function(obj){
        next(obj === "yes I am");
      }).error(next.bind(next,false)));
    },next)
  })
}

lookforLocal.commonIpAddresses = [
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

lookforLocal.commonCClassParts = [1, 2, 3, 10, 11, 12, 20, 21, 22, 50, 51, 52, 100, 101, 102, 150, 151, 152, 200, 201, 202];
