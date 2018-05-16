// Single NSTORM SplitSeq script by Christophe Leterrier
// Split channels in txt localization files from Nikon N-STORM sequential acquisition
// Calls F-NSseqSplit.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);

var od = new OpenDialog("Choose an N-STORM txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nSplitterSeq input file path:" + path);

var plugDir = IJ.getDirectory("imagej");
plugDir = plugDir + "scripts" + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
var splitJS = "F-NSseqSplit.js";
var splitPath = plugDir + splitJS;
IJ.log("SplitterSeq path:" + plugDir + splitJS);
load(splitPath);

NSseqSplit(path, directory);
IJ.log("*** Single NS splitseq end ***");
