// Single ThunderSTORM to VISP script by Christophe Leterrier
// calls F-TSTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

var od = new OpenDialog("Choose an N-STORM txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nTranslator input file path:" + path);

var plugDir = IJ.getDirectory("imagej");
plugDir = plugDir + "scripts" + File.separator + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
var translateJS = "F-TSTranslate.js";
var translatePath = plugDir + translateJS;
IJ.log("Translator path:" + plugDir + translateJS);
load(translatePath);

TSTranslate(path, directory, "VISP");
IJ.log("Single NS to TS end");
