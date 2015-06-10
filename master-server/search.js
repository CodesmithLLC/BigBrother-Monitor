var lookForLocals = require("./scouter");

lookForLocals(8123,1,254,function(e,ips){
  if(e) throw e;
  if(ips.length === 0) throw new Error("No IP Found");
  if(ips.length > 1) return displayChoices(ips);
  window.location.replace("http://"+ips[0]+":8123");
});

function displayChoices(ips){
  /*
    TODO: Despite the function name, this will not display choices
  */
  window.location.replace("http://"+ips[0]+":8123");
}
