// Batch NSTORM into ThunderSTORM script by Christophe Leterrier
// Split and translate txt localization files from Nikon NSTORM to .csv ThunderSTORM localization files
// Calls F-NS2seqSplit.js, F-NS2txtSplit.js, and F-TranslateNS2-TS.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.ij.io.DirectoryChooser);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.io.OpenDialog)

// get arguments if called from macro: (seq, xydrift, warp, zdrift, zfactor, ppc, xcorr)
if (typeof(getArgument) == "function") {
	called = true;
	args = getArgument();
	argarray = args.split(",");
}
else
	called = false;

	// Default options
	var type5_def = false;
	var seq_def = false;
	var xydrift_def = true;
	var warp_def = true;
	var zdrift_def = true;
	var cppc_def = 0.23; // only used for STORM v5 (Hamamatsu Fusion has 0.23 e-/ADU gain)
	var zfactor_def = 2;
	var xcorr_def = 1.01615;

	// Name of the processing
	procName = "Translate NS to TS";

	// Extensions of the input files and output suffix
	inputExt = "txt";
	outFormat = "TS";

	// Where to find the routine JS in the plugins folder
	var routinePlace =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

	// Name of the output folder (added to the name of the input folder)
	var addFolder = "TS";

	// Choose file or folder dialog
	var od = new OpenDialog("Choose a folder of Nikon NSTORM txt loc files", "");
	var path = od.getPath(); // path of selected file
	var directory = od.getDirectory(); // path of containing folder
	var name = od.getFileName(); // name of detected file

	var dirFile = new File(directory);
	var dirName = dirFile.getName(); // name of the containing folder
	var parDir = dirFile.getParent(); // path to parent directory of the containing folder

	// Log
	IJ.log("\n*** " + procName + " started ***");
	IJ.log("\nInput path:" + path);
	IJ.log("Input directory:" + directory);
	IJ.log("Input name:" + name);


	// Options (dialog or arguments)
	var gd = new GenericDialog("Translator Options");
	if (called == false) {
		gd.addCheckbox("New NSTORM 5 file format", type5_def);
		gd.addCheckbox("Sequential acquisition channels", seq_def);
		gd.addCheckbox("Use drift-corrected XY coordinates", xydrift_def);
		gd.addCheckbox("Use warp-corrected coordinates", warp_def);
		gd.addCheckbox("Use drift-corrected Z coordinates", zdrift_def);
		gd.addNumericField("Overall camera gain (only for STORM v5)", cppc_def, 5, 7, "e-/ADU" );
		gd.addNumericField("Z uncertainty factor", zfactor_def, 1, 3, "* XY uncertainty");
		gd.addNumericField("Astigmatic compression correction (1 for none)", xcorr_def, 5, 7, "" );
		gd.addMessage("(3D only, 1.01615 for NSTORM#1, 0.955 for NSTORM#2)");
		gd.showDialog();
		var type5 = gd.getNextBoolean();
		var seq = gd.getNextBoolean();
		var xydrift = gd.getNextBoolean();
		var warp = gd.getNextBoolean();
		var zdrift = gd.getNextBoolean();
		var cppc = gd.getNextNumber();
		var zfactor = gd.getNextNumber();
		var xcorr = gd.getNextNumber();
	}
	else {
		var type5 = argarray[1]
		var seq = argarray[2];
		var xydrift = argarray[3];
		var warp = argarray[4];
		var zdrift = argarray[5];
		var cppc = argarray[6];
		var zfactor = argarray[7];
		var xcorr = argarray[8];
	}


if (gd.wasOKed() || called == true) {

	// Start
	var startTime = new Date().getTime();


	// Get routine folder path
	var plugDir = IJ.getDirectory("imagej");
	var routineFolder = plugDir + "scripts" + File.separator + routinePlace + File.separator;

	// Batch Split

	// Get the split function path and load
	if (seq == false) {
		var splitterJS = "F-NS2txtSplit.js";
		var splitterPath = routineFolder + splitterJS;
		IJ.log("\nSplitter path:" + routineFolder + splitterJS);
		load(splitterPath);
	}
	else {
		var splitter1JS = "F-NS2seqSplit.js";
		var splitterJS = "F-NS2txtSplit.js";
		var splitter1Path = routineFolder + splitter1JS;
		var splitterPath = routineFolder + splitterJS;
		IJ.log("\nSequence Splitter  path:" + routineFolder + splitter1JS);
		IJ.log("\Channel Splitter path:" + routineFolder + splitterJS);
		load(splitter1Path);
		load(splitterPath);
	}


	// Define input folder, define and create output folder
	var inDirSplit = directory;
	IJ.log("Split input folder: " + inDirSplit);
	if (seq == false) {
		var outDirSplit = parDir + File.separator + "Locs split" + File.separator;
		IJ.log("Split output folder: " + outDirSplit);
		var outDirSplitFile = new File(outDirSplit);
		if (!outDirSplitFile.exists()) {
				outDirSplitFile.mkdir();
			}
	}
	else {
		var outDirSplit1 = parDir + File.separator + "Locs seq split" + File.separator;
		var outDirSplit = parDir + File.separator + "Locs split" + File.separator;
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
		var fileQueueS1 = getExtFiles(inDirSplit, inputExt);
		for (var f = 0; f < fileQueueS1.length; f++) {
			var inPath1 = fileQueueS1[f];
			NS2seqSplit(inPath1, outDirSplit1);
		}
		inDirSplit = outDirSplit1;
	}

	IJ.log("\nChannel Splitting...");
	var fileQueueS = getExtFiles(inDirSplit, inputExt);
	for (var f = 0; f < fileQueueS.length; f++) {
		var inPath = fileQueueS[f];
		NS2txtSplit(inPath, outDirSplit);
	}


	// Batch Translate

	// Get the translate function path and load
	if (type5 == false) {
		var translateJS = "F-TranslateNS-TS.js";
	}
	else {
		var translateJS = "F-TranslateNS2-TS.js"
	}
	var translatePath = routineFolder + translateJS;
	IJ.log("\nTranslator path:" + routineFolder + translateJS);
	load(translatePath);

	// Define input folder, define and create output folder
	// input folder for translation is the output folder from previous step (split)
	var	inDirTranslate = outDirSplit;
	var outDirTranslate = parDir + File.separator + "Locs " + outFormat + File.separator;
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
		if (type5 == false)
			TranslateNSTS(inPath, outDirTranslate, outFormat, xydrift, warp, zdrift, zfactor, xcorr);
		else
			TranslateNS2TS(inPath, outDirTranslate, outFormat, cppc, xydrift, warp, zdrift, zfactor, xcorr);
	}

	// End
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;
	IJ.log("\n*** " + procName + " ended after " + Time / 1000 + " s ***\n\n\n");
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
