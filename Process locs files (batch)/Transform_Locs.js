// ThunderSTORM Transform Locs script by Christophe Leterrier
// Calls F-TransformLocs.js to trasnform the localizations in a ThunderSTORM file

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Default values
var isBatchdef = 0;
var xTdef = 0; // coordinates translation (in nm) for X
var yTdef = 0; // coordinates translation (in nm) for Y
var zTdef = 0; // coordinates translation (in nm) for Z
var xFdef = 1.0369; // coordinates scaling for X
var yFdef = 1; // coordinates scaling for Y
var zFdef = 1; // coordinates scaling for Z
var xCdef = 20480; // X coordinate (in nm) of rotation center
var yCdef = 20480; // Y coordinate (in nm) of rotation center
var rotAdef = 0; // Rotation angle (in degrees)
var fvdef = false; // flip vertically
var fhdef = false; // flip horizontally
var zUdef = 2; // scaling factor to calculate Z uncertainty from XY uncertainty using Z = zU * xyU

// Name of the processing
procName = "Transform Locs";

// Where to find the routine JS in the plugins folder
var plugDir = IJ.getDirectory("imagej");
var routineFolder = "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines"+ File.separator;

// Name of the routine JS that will be called
var routineJS = "F-TransformLocs.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "transfo";

// Choose file or folder dialog
var od = new OpenDialog("Choose a ThunderSTORM csv file", "");
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
var gd = new GenericDialog("Process ThunderSTORM csv: options");
gd.addCheckbox("Batch mode", isBatchdef);
gd.addMessage("Coordinates translation");
gd.addNumericField("X translation:", xTdef, 0, 6, "nm (0 for none)");
gd.addNumericField("Y translation:", yTdef, 0, 6, "nm  (0 for none)");
gd.addNumericField("Z translation:", zTdef, 0, 6, "nm (0 for none)");
gd.addMessage("Coordinates scaling\nFor NSTORM scope cylindrical lens correction, X scaling is 1.0369");
gd.addNumericField("X scaling:", xFdef, 4, 6, "X (1 for none)");
gd.addNumericField("Y scaling:", yFdef, 4, 6, "X (1 for none)");
gd.addNumericField("Z scaling:", zFdef, 4, 6, "X (1 for none)");
gd.addMessage("Coordinates rotation\nFor NSTORM scope, center of FoV is (20480 nm,20480 nm)");
gd.addNumericField("Center X:", xCdef, 0, 6, "nm");
gd.addNumericField("Center Y:", yCdef, 0, 6, "nm");
gd.addNumericField("Angle:", rotAdef, 0, 3, "deg (0 for none)");
gd.addCheckbox("Flip horizontally", fhdef);
gd.addCheckbox("Flip vertically", fvdef);
gd.addMessage("Z uncertainty creation (by scaling XY uncertainty)");
gd.addNumericField("Scaling factor:", zUdef, 0, 6, "X (0 for none)");
gd.showDialog();
var isBatch = gd.getNextBoolean();
var xT = gd.getNextNumber();
var yT = gd.getNextNumber();
var zT = gd.getNextNumber();
var xF = gd.getNextNumber();
var yF = gd.getNextNumber();
var zF = gd.getNextNumber();
var xC = gd.getNextNumber();
var yC = gd.getNextNumber();
var rotA = gd.getNextNumber();
var fh = gd.getNextBoolean();
var fv = gd.getNextBoolean();
var zU = gd.getNextNumber();

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
		TransformLocs(path, directory, xT, yT, zT, xF, yF, zF, xC, yC, rotA, fh, fv, zU);
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
		var fileQueue = getExtFiles(directory, "csv");
		for (var f = 0; f < fileQueue.length; f++) {
			inPath = fileQueue[f];
			IJ.log("\n");
			TransformLocs(inPath, outDir, xT, yT, zT, xF, yF, zF, xC, yC, rotA, fh, fv, zU);
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
