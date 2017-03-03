// Batch NSTORM into ThunderSTORM script by Christophe Leterrier
// Split and translate txt localization files from Nikon NSTORM to .csv ThunderSTORM localization files
// Calls F-NStxtSplit.js and F-NStxtTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// get arguments if called from macro: (xydrift, warp, zdrift, zfactor)
if (typeof(getArgument) == "function") {
	called = true;
	args = getArgument();
	argarray = args.split(",");
}
else
	called = false;

// Output format
outFormat = "TS";
extFormat = "txt";

// Path to ChriSTORM folder
var plugDir = IJ.getDirectory("plugins");
var csPath = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator;
var routinePath = csPath + "Routines" + File.separator;

// Default options
xydrift_def = true;
warp_def = true;
zdrift_def = true;
zfactor_def = 2;
ppc_def = 0.1248;

// Get input directory (dialog or argument)
if (called == false) {
	var dc = new DirectoryChooser("Choose a folder");
	var inDir = dc.getDirectory() + File.separator;
}
else {
	inDir = argarray[0];
}
var inDirFile = new File(inDir);
var parDir = inDirFile.getParent() + File.separator;

// Options (dialog or arguments)
var gd = new GenericDialog("Translator Options");
if (called == false) {	
	gd.addCheckbox("Use drift-corrected XY coordinates", xydrift_def);
	gd.addCheckbox("Use warp-corrected coordinates", warp_def);
	gd.addCheckbox("Use drift-corrected Z coordinates", zdrift_def);
	gd.addNumericField("Z uncertainty factor", zfactor_def, 1, 3, "* XY uncertainty");
	gd.addNumericField("Photons per count", ppc_def, 4, 6, "ph/ADU");
	gd.showDialog();
	var xydrift = gd.getNextBoolean();
	var warp = gd.getNextBoolean();
	var zdrift = gd.getNextBoolean();
	var zfactor = gd.getNextNumber();
	var ppc = gd.getNextNumber();
}
else {
	xydrift = argarray[1];
	warp = argarray[2];
	zdrift = argarray[3];
	zfactor = argarray[4];
	ppc = argarray[5];
}
 
if (gd.wasOKed() || called == true) {

	// Start
	var startTime = new Date().getTime();

	IJ.log("\n\n*** Batch N-STORM into ThunderSTORM started ***");
	IJ.log("Input folder: " + inDir);


	// Batch Split

	// Get the split function path and load
	var splitterJS = "F-NStxtSplit.js";
	var splitterPath = routinePath + splitterJS;
	IJ.log("\nSplitter path:" + routinePath + splitterJS);
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


	// Batch Translate

	// Get the translate function path and load
	var translateJS = "F-NStxtTranslate.js";
	var translatePath = routinePath + translateJS;
	IJ.log("\nTranslator path:" + routinePath + translateJS);
	load(translatePath);

	// Define input folder, define and create output folder
	// input folder for translation is the output folder from previous step (split)
	var outDirTranslate = parDir + "Locs " + outFormat + File.separator;
	IJ.log("Translate input folder: " + outDirSplit);
	IJ.log("Translate output folder: " + outDirTranslate);
	var outDirTFile = new File(outDirTranslate);
	if (!outDirTFile.exists()) {
			outDirTFile.mkdir();
		}

	// Get the file list from the input folder, batch process them using the translate function
	var fileQueueT = getExtFiles(outDirSplit, "txt");
	for (var f = 0; f < fileQueueT.length; f++) {
		inPath = fileQueueT[f];
		NStxtTranslate(inPath, outDirTranslate, outFormat, xydrift, warp, zdrift, zfactor, ppc);
	}

	// End
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;
	IJ.log("\n*** Batch N-STORM into ThunderSTORM ended after " + Time / 1000 + " s ***\n\n\n");
	out = outDirTranslate;

}


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