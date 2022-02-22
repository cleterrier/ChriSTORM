// Change_Header script by Christophe Leterrier
// Calls F-ChangeHeader.js to change a ThunderSTORM csv file header into a PoCA file header

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Default values
var isBatchdef = 1;

// Name of the processing
procName = "Translate DECODE to TS";

// Extensions of the input files
inputExt = "csv";

// Where to find the routine JS in the plugins folder
var routineFolder =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Name of the routine JS that will be called
var routineJS = "F-ChangeHeader.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "PoCA";

// Choose file or folder dialog
var od = new OpenDialog("Choose a ThunderSTORM csv results file", "");
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
gd.showDialog();
var isBatch = gd.getNextBoolean();

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
		changeHeader(path, directory);
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
			changeHeader(inPath, outDir);
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
