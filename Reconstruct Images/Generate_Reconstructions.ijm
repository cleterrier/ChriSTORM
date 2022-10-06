// Generate Reconstructions macro by Christophe Leterrier
// Batch generates reconstructions from ThunderSTORM localization files
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

macro "Generate Reconstructions" {

//*************** Initialization ***************

// Save Settings
	saveSettings();
// Necessary for 32-bit to 16-bit conversion
	run("Conversions...", "scale");

// Detect if run from macro
	args = getArgument();
	if (lengthOf(args) > 0) {
		called = true;
		argarray = split(args, ",");
	}
	else called = false;

// Titles of the Thunderstorm windows for catching them
	RESULTS_TITLE = "ThunderSTORM: results";
	// Index of column containing Z coordinates in TS3D files
	colZ = 3;
	LUT_ARRAY = newArray("Rainbow RGB", "Ext_Jet", "Ext_Turbo", "Ext_ametrine", "Ext_ThunderSTORM", "Ext_ZOLA", "CRL_ZOLANDER", "CRL_3color-RMB", "CRL_3color-CGY", "CRL_2C Cyan-Green", "CRL_2C Yellow-Red", "CRL_2C Green-Cyan", "CRL_2C Red-Yellow");

// Default values for the Options Panel
	CAM_SIZE_DEF = 160;
	//CG_DEF = 63.6; // camera gain old images
	//CG_DEF = 12.48; // camera gain new images
	//EM_DEF = 300; // EM gain old images
	//EM_DEF = 100; // EM gain new images
	REC_METH_ARRAY = newArray("Histograms", "Normalized Gaussian");
	REC_METH_DEF = "Normalized Gaussian"; // Reconstruction method
	SR_SIZE_DEF = 16;
	XMIN_DEF = 0;
	YMIN_DEF = 0;
	XWIDTH_DEF = 256;
	YWIDTH_DEF = 256;
	XY_AUTO_DEF = false;
	XY_ZERO_DEF = true;
	XY_ORI_DEF = false;
	XY_UN_DEF = 0;
	P3D_DEF = false;
	Z_SPACE_DEF = 32;
	Z_MIN_DEF = -400;
	Z_MAX_DEF = 400;
	Z_AUTO_DEF = false;
	Z_NAME_DEF = false;
	Z_SATDO_DEF = 50; // restriction of 3D span at bottom (in nm)
	Z_SATUP_DEF = 50; // restriction of 3D span on top (in nm)
	Z_UN_DEF = 0;
	
	Z_PROJ_A = newArray("None", "Maximum (32-bit or color)", "Sum (32-bit or color)", "Weighted sum (color)");
	Z_PROJ_DEF = "Sum (32-bit or color)";
	Z_COLOR_DEF = false;
	Z_LUT_DEF = "CRL_ZOLANDER"; // LUT for color-coded 3D, other good ones: Rainbow RGB, Jet, ametrine, ThunderSTORM
	
	FILT_DEF = false;
	FILT_RAD_DEF = 50;
	FILT_NUMB_DEF = 5;
	FILT_DIM_A = newArray("2D", "3D");
	FILT_DIM_DEF = "2D";
	
	
	GAUSS_DEF = 0; // gaussian blur radius (none if 0)
	GAUSS_MULT_DEF = 1; // multiple gaussian blur passes
	UNS_SIZE_DEF = 0; // unsharp mask radius (none if 0)
	UNS_WEIGHT_DEF = 0.3; // unsharp mask weight
	UNS_MULT_DEF = 1; // multiple unsharp mask passes
	GAM_DEF = 1; // gamma (none if 1)
	AD_CONT_DEF = false; // adjust contrast (color and 16-bit only)
	SAT_LEV_DEF = 0.1; // saturation level for contrast adjustment


//*************** Dialog 1 : get the input images folder path ***************

	// Get input directory (dialog or argument)
	if (called == false) {
		INPUT_DIR = getDirectory("Select a source folder");
	}
	else {
		INPUT_DIR = argarray[0];
	}

	print("\n\n\n*** Generate Reconstructions Log ***");
	print("");
	print("Input folder path: " + INPUT_DIR);

	// Get the input folder name and path to parent folder
	INPUT_ARRAY = split(INPUT_DIR, File.separator);
	INPUT_PARENT = File.separator;
	for (f = 0; f < INPUT_ARRAY.length - 1; f++) {
		INPUT_PARENT += INPUT_ARRAY[f] + File.separator;
	}
	INPUT_LAST = INPUT_ARRAY[INPUT_ARRAY.length-1];
	print("Input folder name: " + INPUT_LAST);
	print("Input folder parent: " + INPUT_PARENT);

	if (called == false) {

		//*************** Dialog 2a : options 1 ***************
		
		//Creation of the dialog box
		Dialog.create("Generate reconstructions: options 1");
		Dialog.addNumber("Raw pixel size", CAM_SIZE_DEF, 0, 3, "nm");
	//	Dialog.addNumber("Converter gain", CG_DEF, 2, 4, "phot/ADU");
	//	Dialog.addNumber("EM gain", EM_DEF, 0, 4, "");
	//	Dialog.addMessage("");
		Dialog.addChoice("Reconstruction", REC_METH_ARRAY, REC_METH_DEF);
		Dialog.addNumber("Final pixel size", SR_SIZE_DEF, 0, 3, "nm");
		Dialog.addNumber("Start reconstruction at X=", XMIN_DEF, 0, 4, "pixels");
		Dialog.addNumber("Start reconstruction at Y=", YMIN_DEF, 0, 4, "pixels");
		Dialog.addNumber("Width of reconstruction", XWIDTH_DEF, 0, 4, "pixels");
		Dialog.addNumber("Height of reconstruction", YWIDTH_DEF, 0, 4, "pixels");
		Dialog.addCheckbox("Auto XY-range", XY_AUTO_DEF);
		Dialog.addCheckbox("Start at (0,0)", XY_ZERO_DEF);
		Dialog.addCheckbox("Use file name for XY origin", XY_ORI_DEF);
		Dialog.addNumber("Force XY uncertainty (0 to keep)", XY_UN_DEF, 0, 3, "nm");
		Dialog.addMessage(" ");
		Dialog.addCheckbox("3D (will just process 3D files)", P3D_DEF);
		Dialog.addNumber("Z spacing", Z_SPACE_DEF, 0, 3, "nm");
		Dialog.addNumber("Z min", Z_MIN_DEF, 0, 4, "nm");
		Dialog.addNumber("Z max", Z_MAX_DEF, 0, 4, "nm");
		Dialog.addCheckbox("Auto Z-range", Z_AUTO_DEF);
		Dialog.addCheckbox("Add Z-range to name", Z_NAME_DEF);
		Dialog.addNumber("Restrict Z-range bottom by", Z_SATDO_DEF, 0, 4, "nm");
		Dialog.addNumber("Restrict Z-range top by", Z_SATUP_DEF, 0, 4, "nm");
		Dialog.addNumber("Force Z uncertainty (0 to keep)", Z_UN_DEF, 0, 3, "nm");
		Dialog.addChoice("Z project", Z_PROJ_A, Z_PROJ_DEF);
		Dialog.addCheckbox("Z colorized", Z_COLOR_DEF);
		Dialog.addChoice("Color LUT", LUT_ARRAY, Z_LUT_DEF);
		Dialog.addMessage(" ");
		Dialog.show();

		// Feeding variables from dialog choices
		CAM_SIZE = Dialog.getNumber();
	//	CG = Dialog.getNumber();
	//	EM = Dialog.getNumber();
		REC_METH = Dialog.getChoice();
		SR_SIZE = Dialog.getNumber();
		XMIN = Dialog.getNumber();
		YMIN = Dialog.getNumber();
		XWIDTH = Dialog.getNumber();
		YWIDTH = Dialog.getNumber();
		XY_AUTO = Dialog.getCheckbox();
		XY_ZERO = Dialog.getCheckbox();
		XY_ORI = Dialog.getCheckbox();
		XY_UN = Dialog.getNumber();
		P3D = Dialog.getCheckbox();
		Z_SPACE = Dialog.getNumber();
		Z_MIN = Dialog.getNumber();
		Z_MAX = Dialog.getNumber();
		Z_AUTO = Dialog.getCheckbox();
		Z_NAME = Dialog.getCheckbox();
		Z_SATDO = Dialog.getNumber();
		Z_SATUP = Dialog.getNumber();
		Z_UN = Dialog.getNumber();
		Z_PROJ = Dialog.getChoice();
		Z_COLOR = Dialog.getCheckbox();
		Z_LUT = Dialog.getChoice();

		//*************** Dialog 2b : options 2 ***************

		//Creation of the dialog box
		Dialog.create("Generate Reconstructions: options 2");
		Dialog.addCheckbox("Density filter", FILT_DEF);
		Dialog.addNumber("Filter radius", FILT_RAD_DEF, 0, 3, "nm");
		Dialog.addNumber("Locs number", FILT_NUMB_DEF, 0, 3, "locs");
		Dialog.addChoice("Filter dimension", FILT_DIM_A, FILT_DIM_DEF);
		Dialog.addMessage(" ");
		Dialog.addNumber("Gaussian blur (0 for no filter)", GAUSS_DEF, 0, 3, "nm");
		Dialog.addNumber("Apply blur ", GAUSS_MULT_DEF, 0, 3, "times");
		Dialog.addNumber("Unsharp mask (0 for no filter)", UNS_SIZE_DEF, 0, 3, "nm");
		Dialog.addNumber("Mask weight (0-1)", UNS_WEIGHT_DEF, 2, 4, "");
		Dialog.addNumber("Apply unsharp", UNS_MULT_DEF, 0, 3, "times");
		Dialog.addNumber("Gamma (1 for none)", GAM_DEF, 2, 4, "");
		Dialog.addMessage(" ");
		Dialog.addCheckbox("Adjust contrast (colorized & 16-bit only)", AD_CONT_DEF);
		Dialog.addNumber("Saturated pixels", SAT_LEV_DEF, 2, 5, "%");
		Dialog.show();
	
		// Feeding variables from dialog choices	
		FILT = Dialog.getCheckbox();
		FILT_RAD = Dialog.getNumber();
		FILT_NUMB = Dialog.getNumber();
		FILT_DIM = Dialog.getChoice();
		GAUSS = Dialog.getNumber();
		GAUSS_MULT = parseInt(Dialog.getNumber());
		UNS_SIZE = Dialog.getNumber();
		UNS_WEIGHT = Dialog.getNumber();
		UNS_MULT = Dialog.getNumber();
		GAM = Dialog.getNumber();
		AD_CONT = Dialog.getCheckbox();
		SAT_LEV = Dialog.getNumber();

	}
	
 	// called from macro:
	// arguments (INPUT_DIR, CAM_SIZE, REC_METH, SR_SIZE, XMIN, YMIN, XWIDTH, YWIDTH, XY_AUTO, XY_ORI, XY_ZERO, XY_UN, P3D, Z_SPACE, Z_MIN, Z_MAX, Z_AUTO, Z_NAME, Z_SATDO, Z_SATUP, Z_UN, Z_PROJ, Z_COLOR, Z_LUT, FILT, FILT_RAD, FILT_NUMB, FILT_DIM, GAUSS, GAUSS_MULT, UNS_SIZE, UNS_WEIGHT, UNS_MULT, GAM, AD_CONT, SAT_LEV)
	else {
		CAM_SIZE = parseInt(argarray[1]);
		REC_METH = parseInt(argarray[2]);
		SR_SIZE = parseInt(argarray[3]);
		XMIN = parseInt(argarray[4]);
		YMIN = parseInt(argarray[5]);
		XWIDTH = parseInt(argarray[6]);
		YWIDTH = parseInt(argarray[7]);
		XY_AUTO = argarray[8];
		XY_ZERO = argarray[9];
		XY_ORI = argarray[10];
		XY_UN = parseInt(argarray[11]);
		P3D = argarray[12];
		Z_SPACE = parseInt(argarray[13]);
		Z_MIN = parseInt(argarray[14]);
		Z_MAX = parseInt(argarray[15]);
		Z_AUTO = argarray[16];
		Z_NAME = argarray[17];
		Z_SATUP = parseInt(argarray[18]);
		Z_SATDO = parseInt(argarray[19]);
		Z_UN = parseInt(argarray[20]);
		Z_PROJ = argarray[21];
		Z_COLOR = argarray[22];
		Z_LUT = argarray[23];
		FILT = argarray[24];
		FILT_RAD = parseFloat(argarray[25]);
		FILT_NUMB = parseInt(argarray[26]);
		FILT_DIM = argarray[27];
		GAUSS = parseInt(argarray[28]);
		GAUSS_MULT = parseInt(argarray[29]);
		UNS_SIZE = parseInt(argarray[30]);
		UNS_WEIGHT = parseFloat(argarray[31]);
		UNS_MULT = parseFloat(argarray[32]);
		GAM = parseFloat(argarray[33]);
		AD_CONT = argarray[34];
		SAT_LEV = argarray[35];
	}

//*************** Prepare Processing (get names, open images, make output folder) ***************

	//Time counter
	startTime = getTime();

	// Store the output image window and reconstruction string, initialize the output parameters string
	if (REC_METH == "Histograms") {
		RECON_TITLE = "Histograms";
		RECON_STRING = "[Histograms] avg=0";
		OUT_PARAM = "H";
	}
	else {
		RECON_TITLE = "Normalized Gaussian";
		RECON_STRING = "[Normalized Gaussian]";
		OUT_PARAM = "G";
	}

	// Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);

	//Create the output folder name
	if (P3D == false) {
		OUT_PARAM += "xy" + SR_SIZE;
	}
	else if (Z_COLOR == true){
		OUT_PARAM += "xy" + SR_SIZE + "z" + Z_SPACE + "c";
		if (Z_PROJ != "None") OUT_PARAM += "p";
	}
	else {
		OUT_PARAM += "xy" + SR_SIZE + "z" + Z_SPACE;
		if (Z_PROJ != "None") OUT_PARAM += "p";
	}
	if (FILT == true) {
		OUT_PARAM += "_f" + toString(FILT_RAD, 0) + "-" + toString(FILT_NUMB, 0) + "-" + FILT_DIM;
	}
	if (GAUSS > 0) {
		OUT_PARAM += "_b" + toString(GAUSS, 0) + "-" + GAUSS_MULT;
	} 
	if (UNS_SIZE > 0) {
		OUT_PARAM += "_u" + toString(UNS_SIZE, 0) + "-" + UNS_MULT;
	}
	if (GAM !=1) {
		OUT_PARAM += "_g" + toString(GAM, 1);
	}

	//Create the output folder path
	OUTPUT_LAST = replace(INPUT_LAST, "Locs", "Recs");	
	OUTPUT_DIR = INPUT_PARENT + OUTPUT_LAST + " (" + OUT_PARAM + ")" + File.separator;
	if (File.isDirectory(OUTPUT_DIR) == false) {
		File.makeDirectory(OUTPUT_DIR);
	}
	print("Output folder: " + OUTPUT_DIR);
	
	
	// Prepare the visualization arguments(Visu string)
	Magnif = CAM_SIZE / SR_SIZE;

	if (XY_UN == 0) FORCE_STRING = "dxforce=false dx=20.0";
	else FORCE_STRING = "dxforce=true dx=" + XY_UN;

	VISU_STRING_XY = "imleft=" + XMIN + " imtop=" + YMIN + " imwidth=" + XWIDTH + " imheight=" + YWIDTH + " renderer=" + RECON_STRING + " magnification=" + Magnif + " " + FORCE_STRING + " ";

	// Prepare the Z part of the Visu string
	// Case of a 2D image
	if (P3D == false) {
		Z_COLOR = false;
		VISU_STRING_Z = "colorize=false threed=false";
		VISU_STRING_RANGE = "";
	}
	// Case of a 3D image
	else {
		// These values are calulated but may be overrun by automatic Z range detection (see below)
		Z_SPAN = Z_MAX - Z_MIN;
		Z_SLICES = floor(2 * Z_SPAN / Z_SPACE) + 1;

		// Colored output does not use the built-in TS code, but dowsntream temporal color-code by Kiota Miura et al.
		COLOR_STRING = "colorize=false threed=true ";

		// Z uncertainty: Z_UN = 0 corresponds to Z uncertainty coded in the file (for each loc)
		if (Z_UN == 0) {
			DZF_STRING = "dzforce=false";
			// "dz=0" crashes the plugin even if "dzforce = false"
			ZUS = 20;
		}
		// Case where Z uncertainty is fixed for all locs
		else {
			DZF_STRING = "dzforce=true";
			ZUS = Z_UN;
		}

		// Finally build the Z part of the Visu string
		VISU_STRING_Z = COLOR_STRING + DZF_STRING + " dz=" + ZUS;
		VISU_STRING_RANGE = " zrange=" + Z_MIN + ":" + Z_SPACE + ":" + Z_MAX;

	}

	// Initialize the camera setup
//	run("Camera setup", "isemgain=true pixelsize=" + CAM_SIZE + " photons2adu=" + CG_DEF +" quantumefficiency=0.89 offset=100 gainem=" + EM_DEF);
	run("Camera setup", "pixelsize=" + CAM_SIZE);

//*************** Process Images ***************

	// Detect number of files
	FileTotal = 0;
	for (n = 0; n < ALL_NAMES.length; n++) {
		if (endsWith(ALL_NAMES[n], ".csv") == true) {
			FileTotal++;
		}
	}

	// Loop on all TS loc files
	FileCount = 0;
	for (n = 0; n < ALL_NAMES.length; n++) {
		if (endsWith(ALL_NAMES[n], ".csv") == true) {

			FileCount++;
			// Get the file path
			FILE_PATH = INPUT_DIR + ALL_NAMES[n];

			// Store components of the file name
			FILE_NAME = File.getName(FILE_PATH);
			FILE_EXT = substring(FILE_NAME, lastIndexOf(FILE_NAME, "."), lengthOf(FILE_NAME));

			//print("INPUT_PATH: " + FILE_PATH);
			print("   Input file #" + FileCount + "/" + FileTotal + ": " + FILE_NAME + " (" + FILE_EXT + " file)");

			// Test if 3D
			if (FILE_EXT == ".csv") {
				image3D = test3D(FILE_PATH, colZ);
				if (image3D == 1)
					print("      3D file detected");
				else
					print("      2D file detected");
			}

			// Only process 2D files in 2D mode (3D mode just ignores them)
			if ( (image3D == 0 && P3D == false) || (image3D == 1) ) {

				LAST_DOT = lastIndexOf(FILE_NAME, ".");
				OUT_TITLE = substring(FILE_NAME, 0, LAST_DOT);

				// Open the loc file
				if (FILE_EXT == ".csv")
					run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + FILE_PATH + "] livepreview=false fileformat=[CSV (comma separated)]");
					nLocs = parseInt(eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();"));
					print("\\Update:      Loc file opened");
				// Optional Density filter (will not run on dummy image that have less than 100 locs)
				if (FILT == true){	
					if (nLocs>100) run("Show results table", "action=density neighbors=" + FILT_NUMB + " dimensions=" + FILT_DIM + " radius=" + FILT_RAD);
				}

				// Detect XY range if auto-range (necessarily after CSV opening)
				if (XY_AUTO == true){
					XMinMaxString = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colz = rt.findColumn(\"x\"); var minz = rt.getValue(0, colz); var maxz = minz; for (var row = 1; row < rows; row++) {var val = rt.getValue(row, colz); if (val > maxz) maxz = val; else if (val < minz) minz = val;} ZMinMaxString = \"\" + minz + \",\" +  maxz;");
					XMinMax = split(XMinMaxString, ",");
					Xmini = parseFloat(XMinMax[0]);
					if (Xmini < 0 || XY_ZERO == true) Xmini = 0;
					Xmaxi = parseFloat(XMinMax[1]);
					YMinMaxString = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colz = rt.findColumn(\"y\"); var minz = rt.getValue(0, colz); var maxz = minz; for (var row = 1; row < rows; row++) {var val = rt.getValue(row, colz); if (val > maxz) maxz = val; else if (val < minz) minz = val;} ZMinMaxString = \"\" + minz + \",\" +  maxz;");
					YMinMax = split(YMinMaxString, ",");
					Ymini = parseFloat(YMinMax[0]);
					if (Ymini < 0 || XY_ZERO == true) Ymini = 0;
					Ymaxi = parseFloat(YMinMax[1]);

					Xw = Xmaxi - Xmini;
					Yh = Ymaxi - Ymini;

					XminiPX = Xmini / CAM_SIZE;
					YminiPX = Ymini / CAM_SIZE;

					XwPX = Xw / CAM_SIZE;
					YhPX = Yh / CAM_SIZE;

					// Case if origin is coded in file name (as for exported ROI locs)
					if (XY_ORI == true){
						StartI = lastIndexOf(FILE_NAME, "_(");
						StopI = lastIndexOf(FILE_NAME, ")_");
						XYori = substring(FILE_NAME, StartI+2, StopI);
						XYoriA = split(XYori, ",");
						Xmini = parseFloat(XYoriA[0]);
						Ymini = parseFloat(XYoriA[1]);
						XminiPX = Xmini / CAM_SIZE;
						YminiPX = Ymini / CAM_SIZE;

						Xw = Xmaxi - Xmini;
						Yh = Ymaxi - Ymini;

						XwPX = Xw / CAM_SIZE;
						YhPX = Yh / CAM_SIZE;
					}

					VISU_STRING_XY = "imleft=" + XminiPX + " imtop=" + YminiPX + " imwidth=" + XwPX + " imheight=" + YhPX + " renderer=[Normalized Gaussian] magnification=" + Magnif + " " + FORCE_STRING + " ";
					print("      auto XY range (nm): X: " + Xmini + " to " + Xmaxi + " nm (width " + Xw + " nm), Y: " + Ymini + " to " + Ymaxi + " nm (height " + Yh + " nm)");
					print("      auto XY range (px): X: " + XminiPX + " to " + (XminiPX + XwPX) + " px (width " + XwPX + " px), Y: " + YminiPX + " to " + (YminiPX + YhPX) + " px (height " + YhPX + " px)");

				} // end IF loop auto XY range

				//Detect Z range if auto-range (necessarily after CSV opening)
				if (P3D == true && Z_AUTO == true) {
					ZMinMaxString = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colz = rt.findColumn(\"z\"); var minz = rt.getValue(0, colz); var maxz = minz; for (var row = 1; row < rows; row++) {var val = rt.getValue(row, colz); if (val > maxz) maxz = val; else if (val < minz) minz = val;} ZMinMaxString = \"\" + minz + \",\" +  maxz;");
					ZMinMax = split(ZMinMaxString, ",");
					Zmini = parseFloat(ZMinMax[0]);
					Zmaxi = parseFloat(ZMinMax[1]);

					if (Zmini != 0 && Zmaxi != 0) {
					/*
						Z_MIN = (floor(Zmini / Z_SPACE)) * Z_SPACE;
						Z_MAX = (floor(Zmaxi / Z_SPACE) + 1) * Z_SPACE;
					*/
						Z_MIN = round(Zmini + Z_SATDO);
						Z_MAX = round(Zmaxi - Z_SATUP);
						Z_N = round((Z_MAX - Z_MIN) / Z_SPACE);
						Z_SPACE = round((Z_MAX - Z_MIN)  / Z_N); // Here we modify Z_SPACE!

						VISU_STRING_RANGE = " zrange=" + Z_MIN + ":" + Z_SPACE + ":" + Z_MAX;
						print("      detected Z range: " + Zmini + " to " + Zmaxi + " nm");
					}
				} // end of IF loop auto-Z range

				// Logs the used Z range and rename the output file if Z range in name option is selected
				if (P3D == true) {
					print("      Z range: " + Z_MIN + " to " + Z_MAX + " nm (" + Z_SPACE + " nm spacing)" );
					if (Z_NAME == true) {
						Z_NAME_STRING = "z(" + Z_MIN + "," + Z_MAX + ")_";
						STRING_PLACE = indexOf(OUT_TITLE, "TS3D");
						if (STRING_PLACE > -1) OUT_TITLE = replace(OUT_TITLE, "TS3D", Z_NAME_STRING + "TS3D");
						else OUT_TITLE = replace(OUT_TITLE, ".tif", Z_NAME_STRING + ".tif");
					}
				}

				// Finalize the Visualization arguments string
				VISU_STRING = VISU_STRING_XY + VISU_STRING_Z + VISU_STRING_RANGE;
				// print("VISU_STRING: " + VISU_STRING);

				// Generate the ouput
				selectWindow(RESULTS_TITLE);
				run("Visualization", VISU_STRING);
				setVoxelSize(SR_SIZE/1000, SR_SIZE/1000, Z_SPACE/1000, "um");
				run("Remove Slice Labels");
				visID = getImageID();
				nOutS = nSlices;

				// Optional contrast adjustment
				if (AD_CONT > 0) {
					run("Enhance Contrast...", "saturated=" + SAT_LEV + " normalize process_all use");
					run("Enhance Contrast", "saturated=" + SAT_LEV);
					getMinAndMax(cmin, cmax);
					setMinAndMax(cmin, 1);
				}
				
				if (P3D == true) {
				// Colorized case
					if (Z_COLOR == true) {
						if (Z_PROJ == "Sum (32-bit or color)") PROJ_STRING = "SUM";
						else if (Z_PROJ == "Maximum (32-bit or color)") PROJ_STRING = "MAX";
						else if (Z_PROJ == "Weighted sum (color)") PROJ_STRING = "WeightedSUM";
						else if (Z_PROJ == "None") PROJ_STRING = "None";
						if (PROJ_STRING != "WeightedSUM") run("8-bit");
						run("Temporal-Color Code", "lut=[" + Z_LUT + "] projection=" + PROJ_STRING + " start=1 end=" + nOutS + "");
						run("Set Scale...", "distance=1 known=" + SR_SIZE / 1000 + " unit=um");
						colorID = getImageID();
						run("Select None");
						selectImage(colorID);
						rename(OUT_TITLE);
						selectImage(visID);
						close();
					}
					
					// Non-colorized case
					else if (Z_PROJ != "None" && Z_COLOR == false){
						if (Z_PROJ == "Maximum (32-bit or color)") PROJ_STRING = "[Maximum Intensity]";
						else PROJ_STRING = "[Sum Slices]";
						run("Z Project...", "projection=" + PROJ_STRING);
						run("Set Scale...", "distance=1 known=" + SR_SIZE / 1000 + " unit=um");
						colorID = getImageID();
						run("Select None");
						selectImage(colorID);
						rename(OUT_TITLE);
						selectImage(visID);
						close();
					}
					
					else {
						selectImage(visID);
						run("Set Scale...", "distance=1 known=" + SR_SIZE / 1000 + " unit=um");
						rename(OUT_TITLE);
					}
				}

				// optional filtering
				if (GAUSS > 0) {
					radius = GAUSS/SR_SIZE;
					for (g = 0; g < GAUSS_MULT; g++) {
						run("Gaussian Blur...", "sigma=" + radius + " stack");
					}
				}

				// optional unsharp mask
				if (UNS_SIZE > 0) {
					ur = UNS_SIZE/SR_SIZE;
					for (u = 0; u < UNS_MULT; u++) {
						run("Unsharp Mask...", "radius=" + ur + " mask=" + UNS_WEIGHT + " stack");
					}
				}

				// optional gamma
				if (GAM != 1) {
					run("Gamma...", "value=" + GAM + " stack");
				}		
				
				// Save and close reconstruction
				run("Set Scale...", "distance=1 known=" + SR_SIZE / 1000 + " unit=um");
				OUT_PATH = OUTPUT_DIR + OUT_TITLE + ".tif";
				save(OUT_PATH);
				close();
				print("      Output file:", OUT_TITLE + ".tif");

			} // end of if loop on 2D/3D files
		}	// end of IF loop on extensions
	}	// end of FOR loop on n extensions


//*************** Cleanup and end ***************

	// Restore settings
	restoreSettings();

	//Time counter
	stopTime = getTime();
	Time = stopTime - startTime;

	print("");
	print("*** Generate Reconstructions end after " + Time / 1000 + " s  ***\n\n\n");
	showStatus("Generate Recon finished");
	if (called == true) return OUTPUT_DIR;
}

// function to test if a file is 2D or 3D (independantly of its name)
function test3D_old(path, ind){
	// Get the first 5000 bytes of the csv file
	dipString = File.openAsRawString(path, 5000);
	dipLines = split(dipString, "\n");

	dipSum = 0;
	// Test if z column exists
	if (indexOf(dipLines[0], "z [nm]") < 0){
		return 0;
	}
	// If not, tests if first values are not all 0
	else {
		// Sum the first 10 Z coordinates to test if 3D
		for (i = 1; i < 11; i++) {
			dipZ = split(dipLines[i], ",");
			dipSum += parseInt(dipZ[ind]);
		}
	}

	// Return O for 2D, 1 for 3D
	if (dipSum == 0)
		return 0;
	else
		return 1;
}

function test3D(path, ind){
	
	name = File.getName(path);
	t3D = indexOf(name, "TS3D.");
	
	if (t3D > -1)
		return 1;
	else
		return 0;
}
