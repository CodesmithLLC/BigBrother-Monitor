//For now this is not used
//There is a lot of work that goes into this
// 1) Windows, mac and Linux
// 2) APM algorithm - based off interval and off last X strokes
// 3) Making sure it doesn't eat too much resources


//https://github.com/Bornholm/node-keyboard

//https://github.com/arvydas/node-hid/tree/develop
var kbs = checkForAvailableKeyboards();

kbs.forEach(function(kb){
  kb.on("stroke", function(){
    kb.apmUpdate(); //pretty difficult
    kb.lastStroke = Date.now();
  });
});

setInterval(function(){
  var main_and_helper = findCurrentMainAndHelper(kbs);
  if(main_and_helper.helper.lastInteraction() > 30*1000*60){
    displayDesktopNotification("Should Switch Keyboard");
  }
});
