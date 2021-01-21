// Batch Drift Correction macro by Christophe Leterrier
// Process ThunderSTORM csv localization files
// Drift correction in 2D (autocorrelation) with ThunderSTORM, in 3D (RCC) with ZOLA
// 2D TS and 3D ZOLA can be applied sequentially (or only ZOLA with a pre-pass)

macro "Batch Drift Correction" {

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
	OUT_PARAM = "DC";

	// Camera setup variables
//	CAM_SIZE = 160;
//	CG = 12.48; // camera gain new images
//	EM = 100; // EM gain new images

	// File chooser
	CHOOSE_DEF = false;
	CHOOSE_STRING_DEF = "";

	EXC_DEF = false;
	EXC_STRING_DEF = "_ZR_";


	// Drift correction
	TS_DRIFT_DEF = true;
	TS_BIN_DEF = 12; // number of frames per sub-reconstruction used for autocorrelation
	TS_MAG_DEF = 5; //  pixel size of sub-reconstructions used for autocorrelation
	TS_SM_DEF = 0.6; // smoothing factor for autocorrelation

	ZOLA_DRIFT_DEF = true;
	ZOLA_DOUBLE_DEF = true;
	GPU_DEF = true; // GPU (CUDA/NVIDIA card only)
	BIN1 = 2;
	BIN2_DEF = 8; // number of frames per sub-reconstruction used for autocorrelation
	MAG1 = 32;
	MAG2_DEF = 25; //  pixel size (nm) of sub-reconstructions used for autocorrelation
	SM_DEF = 10; // Maximal drift (um)

//*************** Get input folder ***************

	// Get input directory (dialog or argument)
	if (called == false) {
		INPUT_DIR = getDirectory("Select a source folder");
	}
	else {
		INPUT_DIR = argarray[0];
	}

	print("\n\n\n*** Batch Drift Correction started ***");
	print("");
	print("Input folder: " + INPUT_DIR);


//*************** Dialog ***************

	if (called == false) {
		//Creation of the dialog box
		Dialog.create("Batch drift correction: options");
		Dialog.addCheckbox("Choose files based on name", CHOOSE_DEF);
		Dialog.addString("Name contains", CHOOSE_STRING_DEF);
		Dialog.addCheckbox("Exclude files based on name", EXC_DEF);
		Dialog.addString("Name contains", EXC_STRING_DEF);
		Dialog.addMessage("");
		Dialog.addCheckbox("ThunderSTORM 2D drift correction", TS_DRIFT_DEF);
		Dialog.addNumber("Number of bins for sub-images", TS_BIN_DEF, 0, 5, "");
		Dialog.addNumber("Magnification for autocorrelation", TS_MAG_DEF, 0, 2, "X");
		Dialog.addNumber("Smoothing factor for autocorrelation", TS_SM_DEF, 3, 5, "X");
		Dialog.addMessage("");
		Dialog.addCheckbox("ZOLA 3D drift correction", ZOLA_DRIFT_DEF);
		Dialog.addCheckbox("ZOLA coarse pre-pass", ZOLA_DOUBLE_DEF);
		Dialog.addCheckbox("Use GPU", GPU_DEF);
		Dialog.addNumber("Number of bins for sub-images", BIN2_DEF, 0, 5, "");
		Dialog.addNumber("Pixel size for autocorrelation", MAG2_DEF, 0, 5, "nm");
		Dialog.addNumber("Maximum drift", SM_DEF, 0, 5, "µm");
		Dialog.show();

		// Feeding variables from dialog choices
		CHOOSE = Dialog.getCheckbox();
		CHOOSE_STRING = Dialog.getString();

		EXC = Dialog.getCheckbox();
		EXC_STRING = Dialog.getString();

		TS_DRIFT = Dialog.getCheckbox();
		TS_BIN = Dialog.getNumber();
		TS_MAG = Dialog.getNumber();
		TS_SM = Dialog.getNumber();
		
		ZOLA_DRIFT = Dialog.getCheckbox();
		ZOLA_DOUBLE = Dialog.getCheckbox();
		GPU = Dialog.getCheckbox();
		BIN2 = Dialog.getNumber();
		MAG2 = Dialog.getNumber();
		SM = Dialog.getNumber();
	}

	// called from macro:
	// arguments (INPUT_DIR, CHOOSE, CHOOSE_STRING, EXC, EXC_STRING, TS_DRIFT, TS_BIN, TS_MAG, TS_SM, ZOLA_DRIFT, GPU, BIN, MAG, SM)
	else {
		CHOOSE = argarray[1];
		CHOOSE_STRING = argarray[2];
		EXC = argarray[3];
		EXC_STRING = argarray[4];
		TS_DRIFT = argarray[5];
		TS_BIN = argarray[6];
		TS_MAG = argarray[7];
		TS_SM = argarray[8];
		ZOLA_DRIFT = argarray[9]
		GPU = argarray[10];
		BIN2 = argarray[11];
		MAG2 = argarray[12];
		SM = argarray[13];
	}

//*************** Prepare processing ***************

	//Time counter
	startTime = getTime();

	// Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);
	ALL_TS = newArray(ALL_NAMES.length);
	ALL_TYPES = newArray(ALL_NAMES.length);

	OUTPUT_DIRP = File.getParent(INPUT_DIR);
	INPUT_DIRNAME = File.getName(INPUT_DIR);

	OUTPUT_DIRNAME = replace(INPUT_DIRNAME, "proc", OUT_PARAM);
	if (OUTPUT_DIRNAME == INPUT_DIRNAME) OUTPUT_DIRNAME = INPUT_DIRNAME + " " + OUT_PARAM;
	OUTPUT_DIR = OUTPUT_DIRP + File.separator + OUTPUT_DIRNAME + File.separator;

	if (File.isDirectory(OUTPUT_DIR) == false) {
		File.makeDirectory(OUTPUT_DIR);
	}


	print("Output folder: " + OUTPUT_DIR);

//	run("EMCCD", "emccd_camera_adu=" + CG + " emccd_camera_gain=" + EM + " emccd_camera_offset=100");

//*************** Process loc files ***************

	// Detect number of files
	FileTotal = 0;
	for (n = 0; n < ALL_NAMES.length; n++) {
		ALL_TS[n] = false;
		ALL_TYPES[n] = "not TS";
		if (endsWith(ALL_NAMES[n], LOC_SUFFIX) == true) {
			ALL_TS[n] = true;
			ALL_TYPES[n] = "[CSV (comma separated)]";
		}
		if (ALL_TS[n] == true) {
			if ((CHOOSE == false || indexOf(ALL_NAMES[n], CHOOSE_STRING) > -1) && (EXC == false || indexOf(ALL_NAMES[n], EXC_STRING) == -1)) {
				FileTotal++;
			}
		}
	}

	// print(FileTotal);

	// Loop on all TS loc files
	FileCount = 0;
	for (n = 0; n < ALL_NAMES.length; n++) {
		if (ALL_TS[n] == true) {
			if ((CHOOSE == false || indexOf(ALL_NAMES[n], CHOOSE_STRING) > -1) && (EXC == false || indexOf(ALL_NAMES[n], EXC_STRING) == -1)) {
				// Image counter
				FileCount++;

				// Get the file path
				FILE_PATH = INPUT_DIR + ALL_NAMES[n];

				// Store components of the file name
				FILE_NAME = File.getName(FILE_PATH);

				print("    Input file #" + FileCount + "/" + FileTotal + ": " + FILE_NAME);

				OUT_NAME = FILE_NAME;
				OUT_PATH = OUTPUT_DIR + OUT_NAME;
							
				// ThunderSTORM 22D drift correction
				if (TS_DRIFT == true) {

					// Open the loc file	
					run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + FILE_PATH + "] livepreview=false fileformat=" + ALL_TYPES[n]);
					// run the 2D drift correction
					run("Show results table", "action=drift magnification=" + TS_MAG + " ccsmoothingbandwidth=" + TS_SM + " save=false showcorrelations=false method=[Cross correlation] steps=" + TS_BIN);
					// Export result
					run("Export results", "filepath=[" + OUT_PATH + "] fileformat=[CSV (comma separated)] saveprotocol=false");
					print("      ThunderSTORM drift-corrected file saved");
					// Close output graph
					close();
					// update file path for further processing
					FILE_PATH = OUTPUT_DIR + OUT_NAME;
					
				}
			
				// ZOLA 3D drift correction
				if (ZOLA_DRIFT == true) {
					// Open the loc file
					run("Import table", "file_path=[" + FILE_PATH + "]");
	
					// GPU option
					if (GPU == true) GPU_STRING = "run_on_gpu";
					else GPU_STRING = "";

					// coarse pre-pass
					if (ZOLA_DOUBLE == true) {
						run("3D Drift correction", "" + GPU_STRING + " cross-correlation_pixel_size=" + MAG1 + " number=" + BIN1 + " maximum_drift=" + SM + " localization_table_attached=[]");
						// close output windows
						close();
						selectWindow("Z_drift");
						close();
						selectWindow("Y_drift");
						close();
						selectWindow("X_drift");
						close();
						selectWindow("2D color histogram 20.0nm per px");
						close();
						// Export the corrected locs into an output file
						// run("Export table", "file_path=[" + OUT_PATH + "]");
					}

					// Fine pass
					run("3D Drift correction", "" + GPU_STRING + " cross-correlation_pixel_size=" + MAG2 + " number=" + BIN2 + " maximum_drift=" + SM + " localization_table_attached=[]");
					// close output windows
					close();
					selectWindow("Z_drift");
					close();
					selectWindow("Y_drift");
					close();
					selectWindow("X_drift");
					close();
					// Export the corrected locs into an output file	
					run("Export table", "file_path=[" + OUT_PATH + "]");
	
					// One pass in ThunderSTORM to remove ZOLA columns
					run("Import results", "detectmeasurementprotocol=false filepath=[" + OUT_PATH + "] fileformat=[CSV (comma separated)] livepreview=false rawimagestack= startingframe=1 append=false");
					run("Export results", "floatprecision=1 filepath=[" + OUT_PATH + "] fileformat=[CSV (comma separated)] chi2=false offset=false occurrencemerging=false saveprotocol=false drifty=false uncertainty_xy=true driftz=false intensity=true driftx=false background=true x=true uncertainty_z=true y=true z=true id=false crlbx=false crlby=false crlbz=false frame=true");
	
					print("      ZOLA drift-corrected file saved");
				}

			} // end of IF loop on include/exclude names
		}	// end of IF loop on extensions
	}	// end of FOR loop on n extensions

//*************** Cleanup and end ***************

	// Restore settings
	restoreSettings();
	showStatus("Batch Drift correction finished");

	//Time counter
	stopTime = getTime();
	Time = stopTime - startTime;

	print("");
	print("*** Batch drift correction ends after " + Time / 1000 + " s ***\n\n\n");
	if (called == true) return OUTPUT_DIR;
}
