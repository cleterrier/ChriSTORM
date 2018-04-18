// Batch_Process_Locs macro by Christophe Leterrier
// Process ThunderSTORM csv localization files
// Drift correction, filtering, density filtering
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

macro "Batch Process Localizations" {

	// Save Settings
	saveSettings();

//*************** Initialize variables ***************	

	
	// Detect if called from macro
	arg = getArgument();
	if (lengthOf(arg)>0) {
		called = true;
		argarray = split(arg, ",");
	}
	else {
		called = false;
	}

	LOC_SUFFIX = ".csv";
	OUT_PARAM = "proc";
	
	// Camera setup variables
	CAM_SIZE = 160;
	CG = 12.48; // camera gain new images
	EM = 100; // EM gain new images	

	// File chooser
	CHOOSE_DEF = false;
	CHOOSE_STRING_DEF = "";

	EXC_DEF = true;
	EXC_STRING_DEF = "_ZR_";

	// Drift correction
	CORR_DRIFT_DEF = true;
	BIN_DEF = 12; // number of frames per sub-reconstruction used for autocorrelation
	MAG_DEF = 5; //  pixel size of sub-reconstructions used for autocorrelation
	SM_DEF = 0.6; // smoothing factor for autocorrelation

	// Merging
	MERGE_DEF = false;
	DIST_DEF = 160; // max distance between consecutive frames for reconnection
	MAXF_DEF = 0; // max number of reconnections
	OFF_DEF = 0; // max number of OFF frames

	// Photon filter
	PHOT_FILT_DEF = false;
	PHOT_MIN_DEF = 1000;
	PHOT_MAX_DEF = 10000;

	// Expression-based filter
	EXP_FILT_DEF = true;
//	EXP_STRING_DEF = "intensity>700 & intensity<15000 & sigma>80 & uncertainty_xy<80"; for TS-processed or DOM-processed files
//	EXP_STRING_DEF = "intensity>700 & intensity<20000 & detections<5"; // for STORM
	EXP_STRING_DEF = "intensity>700 & intensity<100000 & detections<50"; // for STORM+PAINT
//	EXP_STRING_DEF = "intensity>1500 & intensity<500000 & detections<500"; // for PAINT

	// Density filter
	DENS_FILT_DEF = false;
	DENS_RAD_DEF = 100;
	DENS_NUMB_DEF = 5;
	DENS_DIM_A = newArray("2D", "3D");
	DENS_DIM_DEF = "2D";

	// TSF Export
	TSF_DEF = false;
	
//*************** Get input folder ***************	

	// Get input directory (dialog or argument)
	if (called == false) {
		INPUT_DIR = getDirectory("Select a source folder");
	}
	else {
		INPUT_DIR = argarray[0];
	}
	
	print("\n\n\n*** Batch Process Localizations started ***");
	print("");
	print("Input folder: " + INPUT_DIR);


//*************** Dialog ***************	

	if (called == false) {	
		//Creation of the dialog box
		Dialog.create("Batch process localizations: options");
		Dialog.addCheckbox("Choose files based on name", CHOOSE_DEF);
		Dialog.addString("Name contains", CHOOSE_STRING_DEF);
		Dialog.addCheckbox("Exclude files based on name", EXC_DEF);
		Dialog.addString("Name contains", EXC_STRING_DEF);
		Dialog.addMessage("");
		Dialog.addCheckbox("Correct drift", CORR_DRIFT_DEF);
		Dialog.addNumber("Number of bins for sub-images", BIN_DEF, 0, 5, "");
		Dialog.addNumber("Magnification for autocorrelation", MAG_DEF, 0, 2, "X");
		Dialog.addNumber("Smoothing factor for autocorrelation", SM_DEF, 3, 5, "X");
		Dialog.addMessage("");
		Dialog.addCheckbox("Merge localizations", MERGE_DEF);
		Dialog.addNumber("Maximum distance for reconnection", DIST_DEF, 0, 5, "nm");
		Dialog.addNumber("Maximum frames for reconnection", MAXF_DEF, 0, 3, "frames");
		Dialog.addNumber("Maximum off frames", OFF_DEF, 0, 3, "frames");
		Dialog.addMessage("");
		Dialog.addCheckbox("Filter by photon number", PHOT_FILT_DEF);
		Dialog.addNumber("Minimum", PHOT_MIN_DEF, 0, 5, "photons");
		Dialog.addNumber("Maximum", PHOT_MAX_DEF, 0, 5, "photons");
		Dialog.addMessage("");
		Dialog.addCheckbox("Filter by expression", EXP_FILT_DEF);
		Dialog.addString("Expression", EXP_STRING_DEF, 30);
		Dialog.addMessage("");
		Dialog.addCheckbox("Filter by density", DENS_FILT_DEF);
		Dialog.addNumber("Filter radius", DENS_RAD_DEF, 0, 3, "nm");
		Dialog.addNumber("Min loc number", DENS_NUMB_DEF, 0, 3, "");
		Dialog.addChoice("Filter dimension", DENS_DIM_A, DENS_DIM_DEF);
		Dialog.addMessage("");
		Dialog.addCheckbox("Export as .tsf", TSF_DEF);
		Dialog.show();
		
		// Feeding variables from dialog choices
		CHOOSE = Dialog.getCheckbox();
		CHOOSE_STRING = Dialog.getString();

		EXC = Dialog.getCheckbox();
		EXC_STRING = Dialog.getString();
		
		CORR_DRIFT = Dialog.getCheckbox();
		BIN = Dialog.getNumber();
		MAG = Dialog.getNumber();
		SM = Dialog.getNumber();

		MERGE = Dialog.getCheckbox();
		DIST = Dialog.getNumber();
		MAXF = Dialog.getNumber();
		OFF = Dialog.getNumber();

		PHOT_FILT = Dialog.getCheckbox();
		PHOT_MIN = Dialog.getNumber();
		PHOT_MAX = Dialog.getNumber();
	
		EXP_FILT = Dialog.getCheckbox();
		EXP_STRING = Dialog.getString();
	
		DENS_FILT = Dialog.getCheckbox();
		DENS_RAD = Dialog.getNumber();
		DENS_NUMB = Dialog.getNumber();
		DENS_DIM = Dialog.getChoice();
	
		TSF = Dialog.getCheckbox();
	}

	// called from macro:
	// arguments (INPUT_DIR, CHOOSE, CHOOSE_STRING, EXC, EXC_STRING, CORR_DRIFT, BIN, MAG, SM, MERGE, DIST, MAXF, OFF, PHOT_FILT, PHOT_MIN, PHOT_MAX, EXP_FILT, EXP_STRING, DENS_FILT, DENS_RAD, DENS_NUMB, DENS_DIM, TSF)
	else {
		CHOOSE = argarray[1];
		CHOOSE_STRING = argarray[2];
		EXC = argarray[3];
		EXC_STRING = argarray[4];		
		CORR_DRIFT = argarray[5];
		BIN = argarray[6];
		MAG = argarray[7];
		SM = argarray[8];
		MERGE = argarray[9];
		DIST = argarray[10];
		MAXF = argarray[11];
		OFF = argarray[12];
		PHOT_FILT = argarray[13];
		PHOT_MIN = argarray[14];
		PHOT_MAX = argarray[15];
		EXP_FILT = argarray[16];
		EXP_STRING = argarray[17];
		DENS_FILT = argarray[18];
		DENS_RAD = argarray[19];
		DENS_NUMB = argarray[20];
		DENS_DIM = argarray[21];
		TSF = argarray[22];		
	}
	
//*************** Prepare processing ***************	

	//Time counter
	startTime = getTime();
	
	// Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);
	
	OUTPUT_DIR = File.getParent(INPUT_DIR);
	OUTPUT_NAME = File.getName(INPUT_DIR);
	OUTPUT_DIR = OUTPUT_DIR + File.separator + OUTPUT_NAME + " " + OUT_PARAM + File.separator;

	if (File.isDirectory(OUTPUT_DIR) == false) {
		File.makeDirectory(OUTPUT_DIR);
	}

	print("Output folder: " + OUTPUT_DIR);

	run("Camera setup", "isemgain=true pixelsize=" + CAM_SIZE + " gainem=" + CG +" offset=85 photons2adu=" + EM);

//*************** Process loc files ***************

	// Detect number of files
	FileTotal = 0;
	for (n = 0; n < ALL_NAMES.length; n++) {
		if (endsWith(ALL_NAMES[n], LOC_SUFFIX) == true) {
			if ((CHOOSE == false || indexOf(ALL_NAMES[n], CHOOSE_STRING) > -1) && (EXC == false || indexOf(ALL_NAMES[n], EXC_STRING) == -1)) {
				FileTotal++;
			}
		}
	}

	// Loop on all TS loc files
	FileCount = 0;
	for (n = 0; n < ALL_NAMES.length; n++) {
		if (endsWith(ALL_NAMES[n], LOC_SUFFIX) == true) {
			if ((CHOOSE == false || indexOf(ALL_NAMES[n], CHOOSE_STRING) > -1) && (EXC == false || indexOf(ALL_NAMES[n], EXC_STRING) == -1)) {
				// Image counter
				FileCount++;
				
				// Get the file path
				FILE_PATH = INPUT_DIR + ALL_NAMES[n];
				
				// Store components of the file name
				FILE_NAME = File.getName(FILE_PATH);
				
				print("    Input file #" + FileCount + "/" + FileTotal + ": " + FILE_NAME);
	
				OUT_TITLE = FILE_NAME;
				
				// Open the loc file	
				run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + FILE_PATH + "] livepreview=false fileformat=[CSV (comma separated)]");
	
				
				if (CORR_DRIFT == true) {
					// Obtain the number of locs (# of lines in the loc file) and the number of steps for autocorrelation
					// ROWS = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
					// FRAMES = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colf = rt.findColumn(\"frame\"); var minf = parseInt(rt.getValue(0, colf)); var maxf = minf; for (var row = 1; row < rows; row++) {var val = parseInt(rt.getValue(row, colf)); if (val > maxf) maxf = val} frames = maxf;");
					// FRAMES = parseInt(FRAMES);
					
					// STEPS = floor(FRAMES / PACKET_SIZE);
					// if (STEPS < 2) STEPS = 2;
					// MAGNIF = CAM_SIZE / XCORR_SIZE;
		
					// print("      Drift correction: found " + FRAMES + " frames, " + STEPS + " sub-images");
		
					// run("Show results table", "action=drift magnification=" + MAGNIF + " save=false showcorrelations=false method=[Cross correlation] steps=" + STEPS);
					run("Show results table", "action=drift magnification=" + MAG + " ccsmoothingbandwidth=" + SM + " save=false showcorrelations=false method=[Cross correlation] steps=" + BIN);
				}

				if (MERGE == true) {
					run("Show results table", "action=merge zcoordweight=0.1 offframes=" + OFF + " dist=" + DIST + " framespermolecule=" + MAXF);
				}

				if (PHOT_FILT == true){
					run("Show results table", "action=filter formula=[intensity>" + PHOT_MIN + " & intensity<" + PHOT_MAX + "]");
				}

				if (EXP_FILT == true){
					run("Show results table", "action=filter formula=[" + EXP_STRING + "]");
				}
	
				if (DENS_FILT == true){
					colZ = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var colZ = rt.findColumn(\"z [nm]\");");
					if (colZ < 0) DENS_DIM = "2D";
					run("Show results table", "action=density neighbors=" + DENS_NUMB + " dimensions=" + DENS_DIM + " radius=" + DENS_RAD);
				}
				
				// Export the corrected locs into an output file

				// Count the new Loc number
				nLocs = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
				nLocK = round(nLocs / 1000);
				// OUT_TITLE = replace(OUT_TITLE, "([0-9])+K_", nLocK + "K_");

				ADD_TITLE = "";
				//if (CORR_DRIFT == true) {
				//	ADD_TITLE = ADD_TITLE + "DC";
				//}		
				
				ADD_TITLE = ADD_TITLE + nLocK + "K";
				if (indexOf(OUT_TITLE, "_TS") > 0) {
					NEW_TITLE = replace(OUT_TITLE, "([0-9])+K_TS", ADD_TITLE + "_TS");
				}
				else {
					NEW_TITLE = replace(OUT_TITLE, LOC_SUFFIX, ADD_TITLE + LOC_SUFFIX);
				}

				
				if (TSF == false) {
					OUT_PATH = OUTPUT_DIR + NEW_TITLE;
					run("Export results", "filepath=[" + OUT_PATH + "] fileformat=[CSV (comma separated)] chi2=false saveprotocol=false");
					// remove chi2 that causes an error on 27-07-2017 version (see bug on GitHub)
				}
				else {
					NEW_TITLE = replace(NEW_TITLE, ".csv", ".tsf");
					OUT_PATH = OUTPUT_DIR + NEW_TITLE;
					run("Export results", "filepath=[" + OUT_PATH + "] fileformat=[Tagged spot file] saveprotocol=false");
				}
				
				print("      Output file:" + OUT_TITLE);
	
				// Rename the drift image
				if (CORR_DRIFT == true) {
					selectWindow("Drift");
					rename(OUT_TITLE);
				}
				
			} // end of IF loop on include/exclude names	
		}	// end of IF loop on extensions
	}	// end of FOR loop on n extensions

//*************** Cleanup and end ***************


	if (CORR_DRIFT == true && FileCount > 1) {
			run("Images to Stack", "name=[Drift Correction Stack] title=" + ".csv" + " use");
			save(OUTPUT_DIR + "Drift.tif");
			close();
	}

	//NEW_INPUT = substring(INPUT_DIR, 0, lengthOf(INPUT_DIR) - 1) + " no proc" + File.separator;
	//File.rename(INPUT_DIR, NEW_INPUT);
	//File.rename(OUTPUT_DIR, INPUT_DIR);
	
	// Restore settings
	restoreSettings();	
	showStatus("Batch Process Localizations finished");
	
	//Time counter
	stopTime = getTime();
	Time = stopTime - startTime;
	
	print("");
	print("*** Batch Process Localizations end after " + Time / 1000 + " s ***\n\n\n");
	return OUTPUT_DIR;
}