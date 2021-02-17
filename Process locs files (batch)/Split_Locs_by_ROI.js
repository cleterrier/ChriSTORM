// Split Locs by ROI script by Christophe Leterrier
// Calls F-SplitLocsROI.js (in the "Routines" folder) to split the localization file into inside/outside the ROI
// Works in batch with an open image/stack and ROI(s) in the ROI manager

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.io.DirectoryChooser)
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.gui.Roi);
importClass(Packages.ij.plugin.frame.RoiManager);
importClass(Packages.ij.process.ImageProcessor);
importClass(Packages.ij.ImageStack);
importClass(Packages.ij.ImagePlus);

// Default values
var saveInsideDef = true; // save localizations inside ROI in a file
var saveOutsideDef = false; // save localizations outside ROI in a file
var pxSizeDef = 16; //  pixel size on reconstructed images in nm (default is 16 nm)

// Name of the processing
procName = "Split Locs by ROI";

// Extensions of the input files
inputExt = "csv";

// Where to find the routine JS in the plugins folder
var routineFolder =  "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;

// Name of the routine JS that will be called
var routineJS = "F-SplitLocsROI.js";

// Name of the output folder (added to the name of the input folder)
var addFolder = "ROIsplit";

// Log
IJ.log("\n*** " + procName + " started ***");

// Detect open stack or image
var imp = IJ.getImage();
var stk = imp.getImageStack();
var sliceNumber = imp.getImageStackSize();
var stackName = imp.getTitle();
var stackLabels = stk.getSliceLabels();
var stackID = imp.getID();
var stackDim = imp.getDimensions();


// Detect image scale
var stackScale = getScale(imp);
var pxSizeC = stackScale[0];
var pxUnitC = stackScale[1];

// Convert pixel size to nm if it is stored in µm
if (pxUnitC != "nm") pxSizeNm = pxSizeC * 1000;
else pxSizeNm = pxSizeC;

// Detect ROI Manager
var rm = RoiManager.getInstance();
var ra = rm.getRoisAsArray();
var nroi = rm.getCount();

// Choose folder containing localization files
// get directory of active image
var currDir = IJ.getDirectory("image");
var currImage = imp.getTitle();
// IJ.log(currDir);
// assigna s default directory for dialog
DirectoryChooser.setDefaultDirectory(currDir + currImage);
var dc = new DirectoryChooser("Choose the folder for localizations files");
var inDirectory = dc.getDirectory();
var inDirFile = new File(inDirectory);
var dirName = inDirFile.getName(); // name of the input folder
var parDir = inDirFile.getParent(); // path to parent directory of the input folder

// Options dialog
var gd = new GenericDialog(procName + ": options");

gd.addNumericField("Reconstruction image pixel size", pxSizeNm, 1, 6, "nm");
gd.addCheckbox("Save localizations inside ROI", saveInsideDef);
gd.addCheckbox("Save localizations outside ROI", saveOutsideDef);

gd.showDialog();

var pxSize = gd.getNextNumber();
var saveInside = gd.getNextBoolean();
var saveOutside = gd.getNextBoolean();

if (gd.wasOKed()) {

	// Start timer
	var startTime = new Date().getTime();

	// Get routine path and load the routine JS
	var plugDir = IJ.getDirectory("imagej");
	plugDir = plugDir + "scripts" + File.separator + routineFolder;
	var routinePath = plugDir + routineJS;
	IJ.log("Routine path:" + routinePath);
	load(routinePath);

	// Define and create output folder
	var outDirectory = parDir + File.separator + dirName + " " + addFolder + File.separator;
	IJ.log("Split locs input folder: " + inDirectory);
	IJ.log("Split locs output folder: " + outDirectory);
	var outDirFile = new File(outDirectory);
	if (!outDirFile.exists()) {
			outDirFile.mkdir();
		}

	// Loop on ROIs in the ROI manager
	for (r = 0; r < nroi; r++) {
		// get current ROI, name, associated slice
		var currentRoi = ra[r];
		var currentRoiName = rm.getName(r);	
		var currentSlice = 	currentRoi.getPosition();
		// Get label (name of image file) associated with slice
		if (sliceNumber > 1) var currentTifName = stackLabels[currentSlice - 1];
		else var currentTifName = stackName;
		// Generate loc file name from label
		var currentLocName = currentTifName.replace(".tif", "." + inputExt);
		// Generate loc file path
		var currentLocPath = inDirectory + currentLocName;

		// Perform splitting with associated routine function
		SplitLocsROI(currentLocPath, outDirectory, currentRoiName, currentRoi, pxSize, saveInside, saveOutside);
	}

	// Stops timer
	var stopTime = new Date().getTime();
	var Time = stopTime - startTime;

	// Log end
	IJ.log("\n*** " + procName + " ended after " + Time / 1000 + " s  ***");
}

// Get the pixel size and units
function getScale(imp){
	var cal=imp.getCalibration();
	var scale=cal.getX(1);
	var unit=cal.getXUnit();
	return [scale , unit];
}