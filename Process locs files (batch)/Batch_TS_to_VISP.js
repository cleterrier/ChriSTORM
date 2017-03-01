// Batch ThunderSTORM to VISP script by Christophe Leterrier
// Translate ThunderSTORM .csv localization files to .2dlp/.3dlp VISP files
// Calls F-TSTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Output format
outFormat = "VISP";
extFormat = "csv";

// Dialog
var dc = new DirectoryChooser("Choose a folder");
var inDir = dc.getDirectory() + File.separator;
var inDirFile = new File(inDir);
var parDir = inDirFile.getParent() + File.separator;

// Start
var startTime = new Date().getTime();

IJ.log("\n\n*** Batch ThunderSTORM to VISP started ***");
IJ.log("Input folder: " + inDir);

// Localize the SR folder to get the path to script functions
var plugDir = IJ.getDirectory("plugins");
plugDir = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Get the translate function path and load
var translateJS = "F-TSTranslate.js";
var translatePath = plugDir + translateJS;
IJ.log("\nTranslator path:" + plugDir + translateJS);
load(translatePath);

// Define input folder, define and create output folder
// input folder for translation is the output folder from previous step (split)
var outDirTranslate = parDir + "Locs " + outFormat + File.separator;
IJ.log("Translate input folder: " + inDir);
IJ.log("Translate output folder: " + outDirTranslate);
var outDirTFile = new File(outDirTranslate);
if (!outDirTFile.exists()) {
		outDirTFile.mkdir();
	}

// Get the file list from the input folder, batch process them using the translate function
var fileQueueT = getExtFiles(inDir, extFormat);
for (var f = 0; f < fileQueueT.length; f++) {
	inPath = fileQueueT[f];
	TSTranslate(inPath, outDirTranslate, outFormat);
}

// End
var stopTime = new Date().getTime();
var Time = stopTime - startTime;
IJ.log("\n*** Batch ThunderSTORM to VISP ended after " + Time / 1000 + " s ***");



function getExtFiles(dirst, inext) {
		var dir = new File(dirst);
		var allfiles = dir.listFiles();
		var extFiles = new Array();
		for (var i = 0 ; i < allfiles.length; i++) {
				var name = allfiles[i].getName();
				var ext = name.substring(name.lastIndexOf(".")+1);
				if (ext == inext) {
						extFiles.push(allfiles[i]);
				}
		}
		return extFiles;
}