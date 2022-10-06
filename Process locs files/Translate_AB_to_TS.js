// Translate Abbelight Neo csv to TS script by Christophe Leterrier
// Calls F-TranslateAB-TS.js to translate an Abbelight Neo csv localization file into a ThunderSTORM file

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Default values
var isbatch_def = 1;
var zfactor_def = 2; // calculate Z unceetainty by multiplying xy uncertainty with zfactor (as it's not calculated by Neo)
var scale_def = 0.4; // scale uncertainties (as done by Ries lab for SMAP output, default is 0.4)

// Name of the processing
procName = "Translate AB to TS";

// Extensions of the input files
inputExt = "csv";

// Where to find the routine JS in the plugins folder
var routineFolder =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Name of the routine JS that will be called
var routineJS = "F-TranslateAB-TS.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "TS";

// Choose file or folder dialog
var od = new OpenDialog("Choose a Neo csv results file", "");
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
gd.addCheckbox("Batch mode", isbatch_def);
gd.addNumericField("Z uncertainty factor (1 for same as XY)", zfactor_def, 2,6, "X");
gd.addNumericField("Uncertainty scaling (1 for none)", scale_def, 2, 6, "X");
gd.showDialog();
var isbatch = gd.getNextBoolean();
var zfactor = gd.getNextNumber();
var scale = gd.getNextNumber();

if (isbatch == 0) IJ.log("Processing a single file, path:" + path);
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

	if (isbatch == 0) {
		// Process the single file
		TranslateABTS(path, directory, zfactor, scale);
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
			TranslateABTS(inPath, outDir, zfactor, scale);
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
