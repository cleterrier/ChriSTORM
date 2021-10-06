// Translate DOM to TS script by Christophe Leterrier
// Calls F-TranslateDOM-TS.js to translate a DOM localization file into a ThunderSTORM file

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Default values
var isBatchdef = 0;
var ppcdef = 0.1248; //photons per count to trasnlate camera ADU to photons (for intensity)

// Name of the processing
procName = "Translate DOM to TS";

// Extensions of the input files
inputExt = "txt";

// Where to find the routine JS in the plugins folder
var routineFolder =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Name of the routine JS that will be called
var routineJS = "F-TranslateDOM-TS.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "TS";

// Choose file or folder dialog
var od = new OpenDialog("Choose a DOM results file", "");
var path = od.getPath(); // path of selected file
var directory = od.getDirectory(); // path of containing folder
var name = od.getFileName(); // name of delected file

var dirFile = new File(directory);
var dirName = dirFile.getName(); // name of the containing folder
var parDir = dirFile.getParent(); // path to parent directory of the containing folder

// Log
IJ.log("\n*** " + procName + " started ***");
IJ.log("\nInput path:" + path);
IJ.log("Input directory:" + directory);
IJ.log("Input name:" + name);

// Options dialog
var gd = new GenericDialog(procName + ": options");
gd.addCheckbox("Batch mode", isBatchdef);
gd.addNumericField("Photons per ADU:", ppcdef, 4, 6, "");
gd.showDialog();
var isBatch = gd.getNextBoolean();
var ppc = gd.getNextNumber();

if (isBatch == 0) IJ.log("Processing a single file, path:" + path);
else IJ.log("Batch processing a folder, path:" + directory);

if (gd.wasOKed()) {

	// Start timer
	var startTime = new Date().getTime();

	// Get routine path and load the routine JS
	var plugDir = IJ.getDirectory("imagej");
	plugDir = plugDir + "scripts" + File.separator + routineFolder;
	var routinePath = plugDir + routineJS;
	IJ.log("Routine path:" + routinePath);
	load(routinePath);

	if (isBatch == 0) {
		// Process the single file
		TranslateDOMTS(path, directory, ppc);
	}
	else {
		// Define input folder, define and create output folder
		// input folder for translation is the output folder from previous step (split)
		var outDir = parDir + File.separator + dirName + " " + addFolder + File.separator;
		IJ.log("Transform input folder: " + directory);
		IJ.log("Transform output folder: " + outDir);
		var outDirFile = new File(outDir);
		if (!outDirFile.exists()) {
				outDirFile.mkdir();
			}

		// Get the file list from the input folder, batch process them using the translate function
		var fileQueue = getExtFiles(directory, inputExt);
		for (var f = 0; f < fileQueue.length; f++) {
			inPath = fileQueue[f];
			IJ.log("\n");
			TranslateDOMTS(inPath, outDir, ppc);
		}
	}

	// Stops timer
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;

	// Log end
	IJ.log("\n*** " + procName + " ended after " + Time / 1000 + " s  ***");
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
