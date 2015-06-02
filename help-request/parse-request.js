var formidable = require("formidable");

module.exports = function(req,next){
  var form = new formidable.IncomingForm();
  var finlist;
  function destroy(e,val){
    busboy.removeListener("finish",finlist);
    next(e,val);
  }
  form.onPart = function(part) {
    if(!(part.name in paths)) return;
    if (!part.filename) return form.handlePart(part);
    destroy(new Error("didn't expect a file"));
  };
  form.on("field", function(name, value) {
    if(fieldname !== "description") destroy(new Error("only expect description"));
    destroy(void 0, value);
  });
  form.on("end", finlist = function(name, value) {
    next(new Error("expected a description"));
  });
  form.on("error",next);
  form.parse(req);
};
