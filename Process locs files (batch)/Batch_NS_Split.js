// Batch NSTORM Split script by Christophe Leterrier
// Split Nikon NSTORM localization files into mono-channel NSTORM localization files
// Calls F-NStxtSplit.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);

// Output format
extFormat = "txt";
// Dialog
var dc = new DirectoryChooser("Choose a folder");
var inDir = dc.getDirectory() + File.separator;
var inDirFile = new File(inDir);
var parDir = inDirFile.getParent() + File.separator;

// Start
var startTime = new Date().getTime();

IJ.log("\n\n*** Batch NSTORM Split started ***");
IJ.log("Input folder: " + inDir);

// Localize the SR folder to get the path to script functions
var plugDir = IJ.getDirectory("plugins");
plugDir = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;


// Batch Split

// Get the split function path and load
var splitterJS = "F-NStxtSplit.js";
var splitterPath = plugDir + splitterJS;
IJ.log("\nSplitter path:" + plugDir + splitterJS);
load(splitterPath);

// Define input folder, define and create output folder
var inDirSplit = inDir;
IJ.log("Split input folder: " + inDirSplit);
var outDirSplit = parDir + "Locs Split" + File.separator;
IJ.log("Split output folder: " + outDirSplit);
var outDirSplitFile = new File(outDirSplit);
if (!outDirSplitFile.exists()) {
		outDirSplitFile.mkdir();
	}

// Get the file list from the input folder, batch process them using the split function
var fileQueueS = getExtFiles(inDirSplit, extFormat);
for (var f = 0; f < fileQueueS.length; f++) {
	inPath = fileQueueS[f];
	NStxtSplit(inPath, outDirSplit);
}

// End
var stopTime = new Date().getTime();
var Time = stopTime - startTime;
IJ.log("\n*** Batch NSTORM Split ended after " + Time / 1000 + " s ***");



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