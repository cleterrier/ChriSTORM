// Translate DECODE csv to TS script by Christophe Leterrier
// Calls F-TranslateDC-TS.js to translate a DECODE csv localization file into a ThunderSTORM file

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Default values
var isBatchdef = 1;
var pxSizeDef = 160; //  pixel size on camera image in nm (default is 160 nm for NSTORM)
var compFDef = 1.03919; // compensate distortion from the 3D astigmatic lens (default for NSTORM X = 1.036875 * Y but adjusted to stick with NSTORM processing)
var rotXYDef = true; // rotate 90° right (default true)
var flipYDef = true; // flip Y coordinates (default true) - with the rotate 90° right, this aligns the default output of DECODE with the default output of TS/SMAP
var sizeXDef = 256; // width of camera image in pixels (default is 256 for NSTORM);
var sizeYDef = 256; // height of camera image in pixels (default is 256 for NSTORM);
var flipZDef = true; // flip Z coordinates
var compZDef = 0.8; // compensate Z coordinates for index mismatch (default is 0.8)
var scaleUDef = 0.4; // scale uncertainties (as done by Ries lab for SMAP output, default is 0.4)

// Name of the processing
procName = "Translate DECODE to TS";

// Extensions of the input files
inputExt = "csv";

// Where to find the routine JS in the plugins folder
var routineFolder =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Name of the routine JS that will be called
var routineJS = "F-TranslateDC-TS.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "TS";

// Choose file or folder dialog
var od = new OpenDialog("Choose a DECODE csv results file", "");
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
gd.addNumericField("Camera pixel size", pxSizeDef, 1, 6, "nm");
gd.addNumericField("Astigmatism compensation (1 for none)", compFDef, 5, 7, "");
gd.addCheckbox("Rotate image right", rotXYDef);
gd.addCheckbox("Flip Y coordinates", flipYDef);
gd.addNumericField("   Camera image width", sizeXDef, 0, 6, "px");
gd.addNumericField("   Camera image height", sizeYDef, 0, 6, "px");
gd.addCheckbox("Z coordinates inversion", flipZDef);
gd.addNumericField("Index mismatch compensation (1 for none)", compZDef, 2, 6, "X");
gd.addNumericField("Uncertainty scaling (1 for none)", scaleUDef, 2, 6, "X");
gd.showDialog();
var isBatch = gd.getNextBoolean();
var pxSize = gd.getNextNumber();
var compF = gd.getNextNumber();
var rotXY = gd.getNextBoolean();
var flipY = gd.getNextBoolean();
var sizeX = gd.getNextNumber();
var sizeY = gd.getNextNumber();
var flipZ = gd.getNextBoolean();
var compZ = gd.getNextNumber();
var scaleU = gd.getNextNumber();

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
		TranslateDCTS(path, directory, pxSize, compF, rotXY, flipY, sizeX, sizeY, flipZ, compZ, scaleU);
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
			TranslateDCTS(inPath, outDir, pxSize, compF, rotXY, flipY, sizeX, sizeY, flipZ, compZ, scaleU);
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
