// Rotate ThunderSTORM loc files script by Christophe Leterrier
// 28/05/2020
// Calls F-TSRotate.js to rotate file coordinates
// Single file mode: rotate and mirror with the values in the dialog
// Batch mode: uses long line ROIs traced on the image stack along the axon that will be horizontal after rotation (name of images as label in the stack should mathc the name of the localization file, such as when stacking the images from the "Generate Reconstructions" macro)

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.plugin.frame.RoiManager);
importClass(Packages.ij.gui.Roi);
importClass(Packages.ij.process.FloatPolygon);
importClass(Packages.ij.process.ImageProcessor);
importClass(Packages.ij.ImageStack);
importClass(Packages.ij.ImagePlus);

// Default values
var isBatchdef = 0;

// Name of the processing
procName = "Rotate_TS";

// Extensions of the input files
inputExt = "csv";

// Where to find the routine JS in the plugins folder
var routineFolder =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Name of the routine JS that will be called
var routineJS = "F-TSRotate.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "Rot";

// Choose file or folder dialog
var od = new OpenDialog("Choose TS localization file", "");
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

// defaults values
var w_def = 256;
var h_def = 256;
var px_def = 160;
var rot_def = 0;
var fh_def = false;
var fv_def = false;
var fz_def = false;

// Options dialog
var gd = new GenericDialog(procName + ": options");
gd.addCheckbox("Batch mode", isBatchdef);
gd.addNumericField("Raw data width", w_def, 0, 5, "pixels");
gd.addNumericField("Raw data height", h_def, 0, 5, "pixels");
gd.addNumericField("Raw data pixel size", px_def, 0, 5, "nm");
gd.addNumericField("Rotation angle", rot_def, 0, 3, "deg");
gd.addCheckbox("Flip horizontally", fh_def);
gd.addCheckbox("Flip vertically", fv_def);
gd.addCheckbox("Flip in Z", fz_def);
gd.showDialog();
var isBatch = gd.getNextBoolean();
var imW = gd.getNextNumber();
var imH = gd.getNextNumber();
var pxS = gd.getNextNumber();
var rotAngle = gd.getNextNumber();
var fh = gd.getNextBoolean();
var fv = gd.getNextBoolean();
var fz = gd.getNextBoolean();

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

	var centerX = (imW * pxS / 2);
	var centerY = (imH * pxS / 2);

	if (isBatch == 0) {
		// Process the single file
		TSRotate(path, directory, centerX, centerY, rotAngle, fh, fv, fz);
	}
	else {
		// Define input folder, define and create output folder
		// input folder for translation is the output folder from previous step (split)
		var outDir = parDir + File.separator + dirName + " " + addFolder + File.separator;
		IJ.log("Batch mode...");
		IJ.log("Rotate loc files input folder: " + directory);
		IJ.log("Rotated loc files output folder: " + outDir);
		var outDirFile = new File(outDir);
		if (!outDirFile.exists()) {
				outDirFile.mkdir();
			}

		var imp = IJ.getImage();
		var stk = imp.getImageStack();
		var stackName = imp.getTitle();
		var stackID = imp.getID();
		var stackDim = imp.getDimensions();
		var rm = RoiManager.getInstance();
		var ra = rm.getRoisAsArray();
		var nroi = rm.getCount();

		var rAngle = new Array(nroi);
		var imName = new Array(nroi);
		var locName = new Array(nroi);

		for (var r = 0; r < nroi; r++) {
			rm.select(imp, r);
			var roi = ra[r];
			rAngle[r] = roi.getAngle();
//			var	rLine = r.getFloatPoints();
			var sliceNumber = rm.getSliceNumber(rm.getName(r));
			imName[r] = stk.getShortSliceLabel(sliceNumber);
			locName[r] = imName[r] + ".csv";
		}

		for (var f = 0; f < nroi; f++) {		
			inPath = directory + File.separator + locName[f];
			IJ.log("   rotating " + locName[f] + "by " + rAngle[f].toFixed(1) + " degrees");
			outAngle = Math.round(rAngle[f]*10)/10;
			TSRotate(inPath, outDir, centerX, centerY, outAngle, fh, fv, fz);
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
