// Batch NSTORM into ThunderSTORM script by Christophe Leterrier
// Split and translate txt localization files from Nikon NSTORM to .csv ThunderSTORM localization files
// Calls F-NSseqSplit.js, F-NStxtSplit.js, and F-NStxtTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// get arguments if called from macro: (seq, xydrift, warp, zdrift, zfactor, ppc, xcorr)
if (typeof(getArgument) == "function") {
	called = true;
	args = getArgument();
	argarray = args.split(",");
}
else
	called = false;

// Output format
var outFormat = "TS";
var extFormat = "txt";

// Path to ChriSTORM folder
var plugDir = IJ.getDirectory("imagej");
var csPath = plugDir + "scripts" + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator;
var routinePath = csPath + "Routines" + File.separator;

// Default options
var seq_def = false;
var xydrift_def = true;
var warp_def = true;
var zdrift_def = true;
var zfactor_def = 2;
var xcorr_def = 1.01615;


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
	gd.addCheckbox("Sequential acquisition channels", seq_def);
	gd.addCheckbox("Use drift-corrected XY coordinates", xydrift_def);
	gd.addCheckbox("Use warp-corrected coordinates", warp_def);
	gd.addCheckbox("Use drift-corrected Z coordinates", zdrift_def);
	gd.addNumericField("Z uncertainty factor", zfactor_def, 1, 3, "* XY uncertainty");
	gd.addNumericField("Astigmatic compression correction (1 for none)", xcorr_def, 5, 7, "" );
	gd.addMessage("(3D only, 1.01615 for NSTORM#1, 0.955 for NSTORM#2)");
	gd.showDialog();
	var seq = gd.getNextBoolean();
	var xydrift = gd.getNextBoolean();
	var warp = gd.getNextBoolean();
	var zdrift = gd.getNextBoolean();
	var zfactor = gd.getNextNumber();
	var xcorr = gd.getNextNumber();
}
else {
	seq = argarray[1];
	xydrift = argarray[2];
	warp = argarray[3];
	zdrift = argarray[4];
	zfactor = argarray[5];
	xcorr = argarray[6];
}

if (gd.wasOKed() || called == true) {

	// Start
	var startTime = new Date().getTime();

	IJ.log("\n\n*** Batch N-STORM into ThunderSTORM started ***");
	IJ.log("Input folder: " + inDir);


	// Batch Split

	// Get the split function path and load
	if (seq == false) {
		var splitterJS = "F-NStxtSplit.js";
		var splitterPath = routinePath + splitterJS;
		IJ.log("\nSplitter path:" + routinePath + splitterJS);
		load(splitterPath);
	}
	else {
		var splitter1JS = "F-NSseqSplit.js";
		var splitterJS = "F-NStxtSplit.js";
		var splitter1Path = routinePath + splitter1JS;
		var splitterPath = routinePath + splitterJS;
		IJ.log("\nSequence Splitter  path:" + routinePath + splitter1JS);
		IJ.log("\Channel Splitter path:" + routinePath + splitterJS);
		load(splitter1Path);
		load(splitterPath);
	}


	// Define input folder, define and create output folder
	var inDirSplit = inDir;
	IJ.log("Split input folder: " + inDirSplit);
	if (seq == false) {
		var outDirSplit = parDir + "Locs Split" + File.separator;
		IJ.log("Split output folder: " + outDirSplit);
		var outDirSplitFile = new File(outDirSplit);
		if (!outDirSplitFile.exists()) {
				outDirSplitFile.mkdir();
			}
	}
	else {
		var outDirSplit1 = parDir + "Locs Seq Split" + File.separator;
		var outDirSplit = parDir + "Locs Split" + File.separator;
		IJ.log("Split Seq output folder: " + outDirSplit1);
		IJ.log("Split Chan output folder: " + outDirSplit);
		var outDirSplit1File = new File(outDirSplit1);
		if (!outDirSplit1File.exists()) {
				outDirSplit1File.mkdir();
			}
		var outDirSplitFile = new File(outDirSplit);
		if (!outDirSplitFile.exists()) {
				outDirSplitFile.mkdir();
			}
	}

	// Get the file list from the input folder, batch process them using the split function

	if (seq == true) {
		IJ.log("\nSequential Splitting...");
		var fileQueueS1 = getExtFiles(inDirSplit, extFormat);
		for (var f = 0; f < fileQueueS1.length; f++) {
			var inPath1 = fileQueueS1[f];
			NSseqSplit(inPath1, outDirSplit1);
		}
		inDirSplit = outDirSplit1;
	}

	IJ.log("\nChannel Splitting...");
	var fileQueueS = getExtFiles(inDirSplit, extFormat);
	for (var f = 0; f < fileQueueS.length; f++) {
		var inPath = fileQueueS[f];
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
	var	inDirTranslate = outDirSplit;
	var outDirTranslate = parDir + "Locs " + outFormat + File.separator;
	IJ.log("Translate input folder: " + inDirTranslate);
	IJ.log("Translate output folder: " + outDirTranslate);
	var outDirTFile = new File(outDirTranslate);
	if (!outDirTFile.exists()) {
			outDirTFile.mkdir();
		}

	// Get the file list from the input folder, batch process them using the translate function
	var fileQueueT = getExtFiles(inDirTranslate, "txt");
	for (var f = 0; f < fileQueueT.length; f++) {
		inPath = fileQueueT[f];
		NStxtTranslate(inPath, outDirTranslate, outFormat, xydrift, warp, zdrift, zfactor, xcorr);
	}

	// End
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;
	IJ.log("\n*** Batch N-STORM into ThunderSTORM ended after " + Time / 1000 + " s ***\n\n\n");
	if (called == true) out = outDirTranslate;

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
