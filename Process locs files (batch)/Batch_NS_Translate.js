// Batch NSTORM to ThunderSTORM script by Christophe Leterrier
// Translate NSTORM .txt localization files to .csv ThunderSTORM localization files (with no splitting before)
// Calls F-NStxtTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Output format
var outFormat = "TS";
var extFormat = "txt";

// Default options
var xydrift_def = true;
var warp_def = true;
var zdrift_def = true;
var zfactor_def = 2;
var ppc_def = 0.1248;
var xcorr_def = true;

// Dialog
var dc = new DirectoryChooser("Choose a folder");
var inDir = dc.getDirectory() + File.separator;
var inDirFile = new File(inDir);
var parDir = inDirFile.getParent() + File.separator;

// Options
var gd = new GenericDialog("Translator Options");
gd.addCheckbox("Use drift-corrected XY coordinates", xydrift_def);
gd.addCheckbox("Use warp-corrected coordinates", warp_def);
gd.addCheckbox("Use drift-corrected Z coordinates", zdrift_def);
gd.addNumericField("Z uncertainty factor", zfactor_def, 1, 3, "* XY uncertainty");
gd.addNumericField("Photons per count", ppc_def, 4, 6, "ph/ADU");
gd.addCheckbox("Correct astigmatism compression", xcorr_def);
gd.showDialog();
var xydrift = gd.getNextBoolean();
var warp = gd.getNextBoolean();
var zdrift = gd.getNextBoolean();
var zfactor = gd.getNextNumber();
var ppc = gd.getNextNumber();
var xcorr = gd.getNextBoolean();

if (gd.wasOKed()) {

	// Start
	var startTime = new Date().getTime();

	IJ.log("\n\n*** Batch N-STORM to ThunderSTORM started ***");
	IJ.log("Input folder: " + inDir);

	// Localize the SR folder to get the path to script functions
	var plugDir = IJ.getDirectory("plugins");
	plugDir = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

	// Batch Translate

	// Get the translate function path and load
	var translateJS = "F-NStxtTranslate.js";
	var translatePath = plugDir + translateJS;
	IJ.log("\nTranslator path:" + plugDir + translateJS);
	load(translatePath);

	// Define input folder, define and create output folder
	// input folder for translation is the output folder from previous step (split)
	var inDirTranslate = inDir;
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
		NStxtTranslate(inPath, outDirTranslate, outFormat, xydrift, warp, zdrift, zfactor, ppc, xcorr);
	}

	// End
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;
	IJ.log("\n*** Batch N-STORM to ThunderSTORM ended after " + Time / 1000 + " s ***");

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