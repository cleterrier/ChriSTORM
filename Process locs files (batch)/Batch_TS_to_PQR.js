// Batch ThunderSTORM to PDB-PQR script by Christophe Leterrier
// Translate ThunderSTORM .csv localization files to PDB-PQR ChimeraX files
// Calls F-TSTranslate-PQR.js

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Input format
extFormat = "csv";

// Default options values
unc_def = 6; // precision SD

// Dialog
var dc = new DirectoryChooser("Choose a folder");
var inDir = dc.getDirectory() + File.separator;
var inDirFile = new File(inDir);
var parDir = inDirFile.getParent() + File.separator;

// Options
var gd = new GenericDialog("PDB/PQR Translator Options");
gd.addNumericField("Use fixed precision", unc_def, 1, 4, "nm SD");
gd.showDialog();
var unc = gd.getNextNumber();

if (gd.wasOKed()) {

	// Start
	var startTime = new Date().getTime();
	
	IJ.log("\n\n*** Batch ThunderSTORM to PQR started ***");
	IJ.log("Input folder: " + inDir);
	
	// Localize the SR folder to get the path to script functions
	var plugDir = IJ.getDirectory("imagej");
	var plugDir = plugDir + "scripts" + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	
	// Get the translate function path and load
	var translateJS = "F-TranslateTS-PQR.js";
	var translatePath = plugDir + translateJS;
	IJ.log("\nTranslator path:" + plugDir + translateJS);
	load(translatePath);
	
	// Define input folder, define and create output folder
	// input folder for translation is the output folder from previous step (split)
	var outDirTranslate = parDir + "Locs PQR" + File.separator;
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
		TSTranslatePQR(inPath, outDirTranslate, unc);
	}
	
	// End
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;
	IJ.log("\n*** Batch ThunderSTORM to PQR ended after " + Time / 1000 + " s ***");

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
