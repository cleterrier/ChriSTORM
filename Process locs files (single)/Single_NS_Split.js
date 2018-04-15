// Single NSTORM Split script by Christophe Leterrier
// Split channels in txt localization files from Nikon N-STORM
// Calls F-NStxtSplit.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);

var od = new OpenDialog("Choose an N-STORM txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nSplitter input file path:" + path);

var plugDir = IJ.getDirectory("imagej");
plugDir = plugDir + "scripts" + File.separator + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
var splitJS = "F-NStxtSplit.js";
var splitPath = plugDir + splitJS;
IJ.log("Splitter path:" + plugDir + splitJS);
load(splitPath);

NStxtSplit(path, directory);
IJ.log("*** Single NS split end ***");
