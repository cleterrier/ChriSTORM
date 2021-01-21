// Generate Zooms & Slices macro by Christophe Leterrier
// Batch reconstruction of zooms and trasnverse slices from localization files and ROIs drawn on low-definition reconstructions.
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

macro "Generate Zooms & Slices" {

//*************** Initialization ***************

	// Save Settings
	saveSettings();
	// Necessary for 32-bit to 16-bit conversion
	run("Conversions...", "scale");

	// Titles of the Thunderstorm windows for catching them
	RESULTS_TITLE = "ThunderSTORM: results";
	RECON_TITLE = "ROIoutput";
	LUT_ARRAY = newArray("Rainbow RGB", "Jet", "Turbo", "ametrine", "ThunderSTORM");

	// log
	print("\n\n***** Generate Zooms & Slices started *****");
	print("\n");

	// Paths for opening the loc files
	LocFolder = "Locs TS";
	LocSuffix1 = ".csv";
	StackFolder = getDirectory("image");
	SaveFolderLocROI = "Locs TS ROIs";
	SaveFolderZooms = "Recs TS Tiles";
	SaveFolderSlices = "Recs TS Slices";
	SaveFolderSliceLong = "Recs TS Slices Long";
	HomeFolder = getHomeFolder(StackFolder);
	print("  Home folder:" + HomeFolder);

	// Default values for the Options Panel
	MULTI_ROI_DEF = true;
	ALL_CHAN_DEF = true;
	PRO_DEF = true;
	SPEC_DEF = false;
	USE_OPEN_DEF = false;

	CAM_SIZE_DEF = 160; // usually 160 nm
	// CG_DEF = 63.6; // camera gain old images
	CG_DEF = 12.48; // camera gain new images
	// EM_DEF = 300; // EM gain old images
	EM_DEF = 100; // EM gain new images
	RECO_DEF = true; // Generate reconstructions?
	SR_SIZE_DEF = 4; // 4 nm
	XY_UN_DEF = 0; // usually 0
	START_ROI_DEF = 1; // start ROI numbering at something different from 1
	LOCROI_DEF = true; // generate loc file for the ROIs

	P3D_DEF = false;
	Z_SPACE_DEF = 4; // 4 nm for 3D
	Z_MIN_DEF = -600; // -500 nm
	Z_MAX_DEF = 600; // +500 nm
	Z_AUTO_DEF = false;
	Z_SAT_DEF = 10; // restriction of 3D span on top and bottom (in nm)
	Z_UN_DEF = 0; // usually 0
	Z_PROJ_A = newArray("None", "Maximum (32-bit or color)", "Sum (32-bit or color)", "Weighted sum (color)");
	Z_PROJ_DEF = "Weighted sum (color)";
	Z_COLOR_DEF = false;
	Z_LUT_DEF = "Rainbow RGB"; // LUT for color-coded 3D
	SLICES_DEF = false;
	SLICE_THICK_DEF = 400; // 800 nm
	SLICE_LONG_DEF = true;
	SLICE_PROJ_A = newArray("None", "Maximum", "Sum");
	SLICE_PROJ_DEF = "Sum"; // true
	XY_VIEW_DEF = 0; // 2500 nm

	FILT_DEF = false;
	FILT_RAD_DEF = 50;
	FILT_NUMB_DEF = 5;
	FILT_DIM_A = newArray("2D", "3D");
	FILT_DIM_DEF = "3D";
	GAUSS_DEF = 4;
	GAUSS_MULT_DEF = 1;
	AD_CONT_DEF = false;
	SAT_LEV_DEF = 0.1; // 0.1%
	CLOSE_DEF = true;

	// Get the values of the default reconstruction coordinates (256, 1 to 257 in X and Y)
	RECON_PX_DEF = 16; // 16
	RECON_LTX_DEF = 0; // 0
	RECON_LTY_DEF = 0; // 0

	// Get the current image properties
	imID = getImageID();
	imTitle = getTitle();
	isHS = Stack.isHyperstack;

	// Stores position (works with single images)
	Stack.getDimensions(iW, iH, iC, iZ, iT);
	Stack.getPosition(cC, cZ, CT);
	getPixelSize(unit, pixelWidth, pixelHeight);

	// Detect type of stack
	// 2c are C + Z, but 2c z-colored are Z + T (so that each channel is an RGB slice)
	stackType = "1C";
	if ((iC > 1 && iZ > 1) || (iZ > 1 && iT > 1))
		stackType = "2C";
	if (bitDepth() == 24)
		stackType += "_zc";

//*************** Dialog1 : options ***************

	//Creation of the dialog box
	Dialog.create("Generate zooms & slices: options 1");
	if (roiManager("count") > 1)
		Dialog.addCheckbox("Process all ROIs", MULTI_ROI_DEF);
	if (stackType == "2C" || stackType == "2C_zc")
		Dialog.addCheckbox("Process all channels", ALL_CHAN_DEF);
	Dialog.addCheckbox("Use processed localizations", PRO_DEF);
	Dialog.addCheckbox("Specify localizations folder", SPEC_DEF);
	Dialog.addCheckbox("Reuse open localizations", USE_OPEN_DEF);
	Dialog.addMessage("");
	Dialog.addNumber("Camera pixel size", CAM_SIZE_DEF, 0, 3, "nm");
	Dialog.addMessage("");
	Dialog.addNumber("Input reconstruction pixel size", pixelWidth * 1000, 0, 3, "nm");
	Dialog.addNumber("Input reconstruction origin X", RECON_LTX_DEF, 0, 3, "px");
	Dialog.addNumber("Input reconstruction origin Y", RECON_LTY_DEF, 0, 3, "px");
	Dialog.addCheckbox("Generate Reconstructions", RECO_DEF);
	Dialog.addNumber("Final pixel size", SR_SIZE_DEF, 0, 3, "nm");
	Dialog.addNumber("Force XY uncertainty (0 to keep)", XY_UN_DEF, 0, 3, "nm");
	Dialog.addNumber("ROI numbering starts at", START_ROI_DEF, 0, 3, "");
	Dialog.addCheckbox("Generate Locs files", LOCROI_DEF);
	Dialog.addMessage("");
	Dialog.addCheckbox("3D", P3D_DEF);
	Dialog.addNumber("Z spacing", Z_SPACE_DEF, 0, 3, "nm");
	Dialog.addNumber("Z min", Z_MIN_DEF, 0, 4, "nm");
	Dialog.addNumber("Z max", Z_MAX_DEF, 0, 4, "nm");
	Dialog.addCheckbox("Z auto-range", Z_AUTO_DEF);
	Dialog.addNumber("Restrict Z-range by", Z_SAT_DEF, 0, 4, "nm");
	Dialog.addNumber("Force Z uncertainty (0 to keep)", Z_UN_DEF, 0, 3, "nm");
	Dialog.addChoice("Z project", Z_PROJ_A, Z_PROJ_DEF);
	Dialog.addCheckbox("Z colorized", Z_COLOR_DEF);
	Dialog.addChoice("Color LUT", LUT_ARRAY, Z_LUT_DEF);
	Dialog.show();

	// Feeding variables from dialog choices

	if (roiManager("count") > 1)
		MULTI_ROI = Dialog.getCheckbox();
	else
		MULTI_ROI = false;
	if (stackType == "2C" || stackType == "2C_zc")
		ALL_CHAN = Dialog.getCheckbox();
	else
		ALL_CHAN = false;

	PRO = Dialog.getCheckbox();
	SPEC = Dialog.getCheckbox();
	USE_OPEN = Dialog.getCheckbox();
	CAM_SIZE = Dialog.getNumber();

	RECON_PX = Dialog.getNumber();
	RECON_LTX = Dialog.getNumber();
	RECON_LTY = Dialog.getNumber();
	RECO = Dialog.getCheckbox();
	SR_SIZE = Dialog.getNumber();
	XY_UN = Dialog.getNumber();
	START_ROI = Dialog.getNumber();
	LOCROI = Dialog.getCheckbox();

	P3D = Dialog.getCheckbox();
	Z_SPACE = Dialog.getNumber();
	Z_MIN = Dialog.getNumber();
	Z_MAX = Dialog.getNumber();
	Z_AUTO = Dialog.getCheckbox();
	Z_SAT = Dialog.getNumber();
	Z_UN = Dialog.getNumber();
	Z_PROJ = Dialog.getChoice();
	Z_COLOR = Dialog.getCheckbox();
	Z_LUT = Dialog.getChoice();

//*************** Dialog2 : options ***************

	//Creation of the dialog box
	Dialog.create("Generate zooms & slices: options 2");
	Dialog.addCheckbox("Generate slices (only for line ROIs)", SLICES_DEF);
	Dialog.addNumber("Slice thickness (0 for line ROI thickness", SLICE_THICK_DEF, 0, 4, "nm");
	Dialog.addCheckbox("Slice in both directions", SLICE_LONG_DEF);
	Dialog.addChoice("Slice project", SLICE_PROJ_A, SLICE_PROJ_DEF);
	Dialog.addNumber("XY view min size (0 for smallest)", XY_VIEW_DEF, 0, 4, "nm"); // Minimum box size around slice
	Dialog.addMessage("");
	Dialog.addCheckbox("Density filter", FILT_DEF);
	Dialog.addNumber("Filter radius", FILT_RAD_DEF, 0, 3, "nm");
	Dialog.addNumber("Locs number", FILT_NUMB_DEF, 0, 3, "nm");
	Dialog.addChoice("Filter dimension", FILT_DIM_A, FILT_DIM_DEF);
	Dialog.addNumber("Gaussian blur (0 for no filter)", GAUSS_DEF, 0, 3, "nm");
	Dialog.addNumber("Apply blur ", GAUSS_MULT_DEF, 0, 3, "times");
	Dialog.addCheckbox("Adjust contrast", AD_CONT_DEF);
	Dialog.addNumber("Saturated pixels", SAT_LEV_DEF, 2, 3, "%");
	Dialog.addCheckbox("Close images", CLOSE_DEF);
	Dialog.show();

	// Feeding variables from dialog choices
	SLICES = Dialog.getCheckbox();
	SLICE_THICK = Dialog.getNumber();
	SLICE_LONG = Dialog.getCheckbox();
	SLICE_PROJ = Dialog.getChoice();
	XY_VIEW = Dialog.getNumber();

	FILT = Dialog.getCheckbox();
	FILT_RAD = Dialog.getNumber();
	FILT_NUMB = Dialog.getNumber();
	FILT_DIM = Dialog.getChoice();
	GAUSS = Dialog.getNumber();
	GAUSS_MULT = parseInt(Dialog.getNumber());
	AD_CONT = Dialog.getCheckbox();
	SAT_LEV = Dialog.getNumber();

	CLOSE = Dialog.getCheckbox();

//*************** Prepare visualization ***************

	//Time counter
	startTime = getTime();

	// Change input folder if processed loc chosen
	OUT_PARAM = "";
	ROI_PARAM = "(";
	if (PRO == true){
		LocFolder = "Locs TS proc";
	}
	LocFolderPath = HomeFolder + File.separator + LocFolder;

	print("  Loc folder candidate:" + LocFolderPath);

	if (USE_OPEN == false && (SPEC == true || File.exists(LocFolderPath) != 1)){
		LocFolderPath = getDirectory("Select the localizations folder");
	}
	print("  Loc folder:" + LocFolderPath);

	// Log stack type
	print("  Stack type: " + stackType);

	// Store the output parameters
	if (P3D == false) {
		OUT_PARAM += "(xy" + SR_SIZE;
	}
	else if (Z_COLOR == true){
		OUT_PARAM += "(xy" + SR_SIZE + "z" + Z_SPACE + "c";
		if (Z_PROJ != "None") OUT_PARAM += "p";
	}
	else {
		OUT_PARAM += "(xy" + SR_SIZE + "z" + Z_SPACE;
		if (Z_PROJ != "None") OUT_PARAM += "p";
	}
	if (SLICES == true) {
		OUT_PARAM += "_s" + SLICE_THICK;
		if (SLICE_PROJ != "None") OUT_PARAM += "p";
	}
	if (XY_VIEW > 0) {
		OUT_PARAM += "_m" + toString(XY_VIEW/1000, 2);
		if (ROI_PARAM == "") ROI_PARAM = "(";
		else ROI_PARAM += "_";
		ROI_PARAM += "m" + toString(XY_VIEW/1000, 2);
	}
	if (FILT == true) {
		OUT_PARAM += "_d" + FILT_RAD + "-" + FILT_NUMB + "-" + FILT_DIM;
		if (ROI_PARAM == "") ROI_PARAM = "(";
		else ROI_PARAM += "_";
		ROI_PARAM += "d" + FILT_RAD + "-" + FILT_NUMB + "-" + FILT_DIM;
	}
	if (GAUSS > 0) {
		OUT_PARAM += "_g" + toString(GAUSS, 0) + "-" + GAUSS_MULT;
	}
	OUT_PARAM += ")";
	ROI_PARAM += ")";

	print("  Output parameters: " + OUT_PARAM);

	// Make the output directories

	// Directory containing the localizations files for each ROI
	if (LOCROI == true) {
		LocROIFolder = HomeFolder + File.separator + SaveFolderLocROI + " " + ROI_PARAM;
		if (File.exists(LocROIFolder) != 1) File.makeDirectory(LocROIFolder);
		print("  ROI locs folder:" + LocROIFolder);
	}

	// Directory containing the XY reconstructions
	if (RECO == true) {
		ZoomFolder = HomeFolder + File.separator + SaveFolderZooms  + " " + OUT_PARAM;
		if (File.exists(ZoomFolder) != 1) File.makeDirectory(ZoomFolder);
		print("  Tiles folder:" + ZoomFolder);
	}


	// Directory containing the XZ reconstructions
	if (SLICES == true) {
		SliceFolder = HomeFolder + File.separator + SaveFolderSlices + " " + OUT_PARAM;
		if (File.exists(SliceFolder) != 1) File.makeDirectory(SliceFolder);
		print("  Slices folder:" + SliceFolder);
	}

	// Directory containing the XZ longitudinal reconstructions
	if (SLICES == true && SLICE_LONG == true) {
		SliceLongFolder = HomeFolder + File.separator + SaveFolderSliceLong + " " + OUT_PARAM;
		if (File.exists(SliceLongFolder) != 1) File.makeDirectory(SliceLongFolder);
		print("  Slices folder:" + SliceLongFolder);
	}

	// Build the reconstrution part of the Visualization string
	if (P3D == false) {
		VISU_STRING_Z = " colorize=false pickedlut=[" + Z_LUT + "] threed=false dzforce=false";
		VISU_STRING_RANGE = "";
		Z_COLOR = false;
	}
	else {
		Z_SPAN = Z_MAX - Z_MIN;
		Z_SLICES = floor(2 * Z_SPAN / Z_SPACE) + 1;

		COLOR_STRING = " colorize=false pickedlut=[" + Z_LUT + "]";

		if (Z_UN == 0) {
			DZF_STRING = " dzforce=false";
			// "dz=0" crashes the plugin even if "dzforce = false"
			ZUS = 20;
		}
		else {
			DZF_STRING = " dzforce=true";
			ZUS = Z_UN;
		}

		VISU_STRING_Z = COLOR_STRING + " dz=" + ZUS + " threed=true" + DZF_STRING;
		VISU_STRING_RANGE = " zrange=" + Z_MIN + ":" + Z_SPACE + ":" + Z_MAX;

	}

	if (XY_UN == 0) {
		XYUN_STRING = "dxforce=false dx=20.0";
	}

	else {
		XYUN_STRING = "dxforce=true dx=" + XY_UN;
	}


	// Define channel counter
	iCount = 1;
	if (ALL_CHAN == true) {
		// Test if Hyperstack has several channels or several Z planes for channels
		if (stackType == "1C_zc" || stackType == "2C_zc") iCount = iZ;
		else iCount = iC;
	}

	// Initialize camera paramters (pixel size is the most important)
	run("Camera setup", "isemgain=true pixelsize=" + CAM_SIZE + " photons2adu=" + CG_DEF +" quantumefficiency=0.89 offset=100 gainem=" + EM_DEF);

	run("Remove Overlay");


//*************** Loop on Channels ***************

for (z = 1; z < iCount + 1; z++) {

		print("    Channel #" + z + "/" + (iCount));
		selectImage(imID);

		// loop on ROI or just process active ROI
		if (MULTI_ROI == true) rN = roiManager("count");
		else rN = 1;
		for (r = 0 ; r < rN; r++) {

			//***** Preparation of the ROI *****
			print("      ROI #" + (r + 1) + "/"  + rN);
			ROI_PARAM = "Roi" + IJ.pad(START_ROI + r, 3);

			// Get the ROI (already active if multi-ROI is false)
			prevHeader = "dummy";
			if (MULTI_ROI == true) {
				selectImage(imID);
				// get previous ROI header (to check if necessary to re-open localization file)
				if (r > 0) {
					roiManager("select", r-1);
					if (ALL_CHAN == true) {
						if (stackType == "2C")
							Stack.setChannel(z);
						if (stackType == "2C_zc")
							Stack.setSlice(z);
					}
					if (nSlices > 1) prevHeader = getInfo("slice.label");
					else prevHeader = replace(imTitle, ".tif", "");
				}
				roiManager("select", r);
			}

			//Get the bounding box ROI if ROI is line
			if (Roi.getType == "line") {
				ROILINE = true;
				// get Line ROI coordinates
				getLine(lineX1, lineY1, lineX2, lineY2, lineWidth);
				if (SLICE_THICK == 0) SLICE_THICK = lineWidth * RECON_PX;
				SMALL_LINEIN = newArray(lineX1, lineY1, lineX2, lineY2);
				// Make box around line
				if (SLICES == true) SMALL_LINEOUT = generateBox(SLICE_THICK/RECON_PX, 0);
					else SMALL_LINEOUT = generateBox(lineWidth, 0);
				getSelectionBounds(boxX, boxY, boxW, boxH);
				roiX = boxX;
				roiY = boxY;
				roiW = boxW;
				roiH = boxH;
			}
			//If not, just get the bounding box
			else {
				ROILINE = false;
				getSelectionBounds(roiX, roiY, roiW, roiH);
			}

			// Test if ROI is big enough compared to minimum size
			// size of the minimum box (in pixels)
			boxMin = floor(XY_VIEW / RECON_PX);
			// coordinates of ROI middle
			if (ROILINE == true) {
				midX = ((lineX2 - lineX1) / 2) + lineX1;
				midY = ((lineY2 - lineY1) / 2) + lineY1;
			}
			else {
				midX = (roiW / 2) + roiX;
				midY = (roiH / 2) + roiY;
			}
			// Enlarge in X
			if (roiW < boxMin) {
				roiX = (midX - boxMin/2);
				roiW = boxMin;
			}
			// Enlarge in Y
			if (roiH < boxMin) {
				roiY = (midY - boxMin/2);
				roiH = boxMin;
			}

			// print("roiX=" + roiX + ", roiY=" + roiY + ", roiW=" + roiW + ", roiH=" + roiH);

			// Draw the bounding box ROI and the name of the ROI
			makeRectangle(roiX, roiY, roiW, roiH);

			// Coordinates of the ROI in nm
			XMIN = roiX * RECON_PX;
			XMAX = XMIN + (roiW * RECON_PX);

			YMIN = roiY * RECON_PX;
			YMAX = YMIN + (roiH * RECON_PX);

			//***** Set the channel (after fiddling with the ROI!) *****
			if (ALL_CHAN == true) {
				if (stackType == "2C")
					Stack.setChannel(z);
				if (stackType == "2C_zc")
					Stack.setSlice(z);
			}

			//***** Get path to loc file *****
			// Get image title
			if (nSlices > 1) imHeader = getInfo("slice.label");
			else imHeader = replace(imTitle, ".tif", "");
			LocFile = getLocs(imHeader, LocFolderPath);
			print("        Image title: " + imHeader);
			print("        Loc file: " + LocFile);
			// Open the loc file
			if (r == 0 && (USE_OPEN == false))
				run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + LocFile + "] livepreview=false fileformat=[CSV (comma separated)]");
			// print(imHeader);
			// print(prevHeader);
			if (r > 0 && imHeader != prevHeader)
				run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + LocFile + "] livepreview=false fileformat=[CSV (comma separated)]");

			// Count the locs before filtering
			nLocsBF = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
			nLocK2BF = replace(d2s(nLocsBF / 1000, 2), ".", ",");
			LocNum = "        Locs number in whole image: " + nLocK2BF + "K";

			// Filter locs inside the selection box
			XY_RANGE = "x>" + XMIN + " & x<" + XMAX + " & y>" + YMIN + " & y<" + YMAX;
			// print("XY_RANGE:" + XY_RANGE);
			run("Show results table", "action=filter formula=[" + XY_RANGE + "]");

			// Count the locs after spatial filtering
			nLocs = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
			nLocK = round(nLocs / 1000);
			nLocK2 = replace(d2s(nLocs / 1000, 2), ".", ",");
			LocNum = LocNum + "  |  in ROI: " + nLocK2 + "K";

			// Optional Density filter (will not run on dummy image that has only 12 locs)
			if (FILT == true){
				if (nLocs>12) run("Show results table", "action=density neighbors=" + FILT_NUMB + " dimensions=" + FILT_DIM + " radius=" + FILT_RAD);
				// Count the locs after density filtering
				nLocs = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
				nLocK = round(nLocs / 1000);
				nLocK2 = replace(d2s(nLocs / 1000, 2), ".", ",");
				LocNum = LocNum + "  |  in density-filtered ROI: " + nLocK2 + "K";
			}

			print(LocNum);


			// Create output title
			imHeaderClean = cleanTitle(imHeader);
			OUT_TITLE = ROI_PARAM + "_" + imHeaderClean;

			//****** Make reconstruction ******
			if (RECO == true) {
				//***** Preparation of the Visu string *****
				roiMagnif = CAM_SIZE / SR_SIZE;
				roiZoom = CAM_SIZE / RECON_PX;
				reconX = roiX / roiZoom + RECON_LTX;
				reconY = roiY /roiZoom + RECON_LTY;
				reconW = roiW /roiZoom;
				reconH = roiH /roiZoom;
				// XY part of the Visualization string
				VISU_STRING_XY = "imleft=" + reconX + " imtop=" + reconY + " imwidth=" + reconW + " imheight=" + reconH + " renderer=[Normalized Gaussian] magnification=" + roiMagnif + " " + XYUN_STRING;

				// Calculate automatic Z range
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
						Z_MIN = round(Zmini + Z_SAT);
						Z_MAX = round(Zmaxi - Z_SAT);
						Z_N = round((Z_MAX - Z_MIN) / Z_SPACE);
						Z_SPACE = round((Z_MAX - Z_MIN)  / Z_N); // Here we modify Z_SPACE!

					}

					VISU_STRING_RANGE = " zrange=" + Z_MIN + ":" + Z_SPACE + ":" + Z_MAX;
					print("        auto Z-range: Zmin = " + parseFloat(ZMinMax[0]) + " nm, Zmax = " + parseFloat(ZMinMax[1]) + " nm, Z_MIN = " + Z_MIN + " nm, Z_MAX = " + Z_MAX + " nm");
				}

				// Build the visualization string
				VISU_STRING = VISU_STRING_XY + VISU_STRING_Z + VISU_STRING_RANGE;

				// Launch the visualization
				selectWindow(RESULTS_TITLE);
				run("Visualization", VISU_STRING);
				rename("ROIoutput");


				outIm = outProcess(OUT_TITLE);
				zoomTitle = getTitle();

				if (ROILINE == true) {
					SCALE = RECON_PX / SR_SIZE;
					BIG_LINEOUT = getBigCoor(SMALL_LINEOUT, SCALE, roiX, roiY);
					makeLine(BIG_LINEOUT[0], BIG_LINEOUT[1], BIG_LINEOUT[2], BIG_LINEOUT[3]);
					if (SLICES == true) {
						generateSlice(SLICE_THICK/1000, SR_SIZE/1000);
						sliceID = getImageID();
						run("Flip Horizontally", "stack");
					//	optimizeContrast();

						if (SLICE_LONG == true) {
							run("Reslice [/]...", "start=Left rotate");
							slicelongID = getImageID();
							
						}

						selectImage(sliceID);

						if (SLICE_PROJ != "None") {
							if (SLICE_PROJ == "Maximum") SL_STRING = "[Max Intensity]";
							else if (SLICE_PROJ == "Sum") SL_STRING = "[Sum Slices]";
							run("Z Project...", "projection=" + SL_STRING);
							ZpID = getImageID();
							selectImage(sliceID);
							close();
							selectImage(ZpID);
							sliceID = ZpID;
						}

						if (Z_COLOR == true) {
							slicecID = ColorZ(sliceID, Z_LUT);
							selectImage(sliceID);
							close();
							selectImage(slicecID);
							sliceID = slicecID;
						}

						optimizeContrast();
						
						// Name for the slice image
						if (nLocs > 10000) ADD_TITLE = "_" + nLocK2 + "K";
						else  ADD_TITLE = "_" + nLocK + "K";
						ADD_TITLE = ADD_TITLE + "_(" + XMIN + "," + YMIN + ")";
						NEW_TITLE = zoomTitle + "_slice";
						NEW_TITLE = replace(NEW_TITLE, "(_([0-9])+K)+_TS", ADD_TITLE + "_TS");
						// NEW_TITLE = NEW_TITLE + "_C=" + (z-1);

						// Save slice image
						SaveSlicePath = SliceFolder + File.separator + NEW_TITLE + ".tif";
						print("        Slice image:" + SaveSlicePath);
						save(SaveSlicePath);
						if (CLOSE == true) close();

						if (SLICE_LONG == true) {

					 		selectImage(slicelongID);

							if (SLICE_PROJ != "None") {
								if (SLICE_PROJ == "Maximum") SL_STRING = "[Max Intensity]";
								else if (SLICE_PROJ == "Sum") SL_STRING = "[Sum Slices]";
								run("Z Project...", "projection=" + SL_STRING);
								// run("Flip Horizontally");
								LZpID = getImageID();
								selectImage(slicelongID);
								close();
								selectImage(LZpID);
								slicelongID = LZpID;
							}

							if (Z_COLOR == true) {
								slicelongcID = ColorZ(slicelongID, Z_LUT);
								selectImage(slicelongID);
								close();
								selectImage(slicelongcID);
								slicelongID = slicelongcID;
							}

							optimizeContrast();

							// Name for the slice image
							if (nLocs > 10000) ADD_TITLE = "_" + nLocK2 + "K";
							else  ADD_TITLE = "_" + nLocK + "K";
							ADD_TITLE = ADD_TITLE + "_(" + XMIN + "," + YMIN + ")";
							NEW_TITLE = zoomTitle + "_slicelong";
							NEW_TITLE = replace(NEW_TITLE, "(_([0-9])+K)+_TS", ADD_TITLE + "_TS");
							// NEW_TITLE = NEW_TITLE + "_C=" + (z-1);

							// Save slice image
							SaveSliceLongPath = SliceLongFolder + File.separator + NEW_TITLE + ".tif";
							print("        Slice Long image:" + SaveSliceLongPath);
							save(SaveSliceLongPath);
							if (CLOSE == true) close();
						}
					}
					selectImage(outIm);
				}

				// optional filtering
				if (GAUSS > 0) {
					selectImage(outIm);
					radius = GAUSS/SR_SIZE;
					for (g = 0; g < GAUSS_MULT; g++) {
						if (P3D == true) {
							run("Gaussian Blur 3D...", "x=" + radius + " y="+ radius + " z=" + radius);
						}
						else {
							run("Gaussian Blur...", "sigma=" + radius + " stack");
						}
					}
				}

				if (P3D == true) {
					selectImage(outIm);
					nOutS = nSlices;
					if (Z_COLOR == true) {
						if (Z_PROJ == "Sum (32-bit or color)") PROJ_STRING = "SUM";
						else if (Z_PROJ == "Maximum (32-bit or color)") PROJ_STRING = "MAX";
						else if (Z_PROJ == "Weighted sum (color)") PROJ_STRING = "WeightedSUM";
						else if (Z_PROJ == "None") PROJ_STRING = "None";
						run("Temporal-Color Code", "lut=[" + Z_LUT + "] projection=" + PROJ_STRING + " start=1 end=" + nOutS + "");
						projID = getImageID();
						rename(zoomTitle);
						// optimizeContrast();
						selectImage(outIm);
						close();
						selectImage(projID);
					}
					else if (Z_PROJ != "None" && Z_COLOR == false){
						if (Z_PROJ == "Maximum (32-bit or color)") PROJ_STRING = "[Maximum Intensity]";
						else PROJ_STRING = "[Sum Slices]";
						run("Z Project...", "projection=" + PROJ_STRING);
						projID = getImageID();
						rename(zoomTitle);
						// optimizeContrast();
						selectImage(outIm);
						close();
						selectImage(projID);
					}
					else {
						selectImage(outIm);
						rename(zoomTitle);
					}
				}

				if (ROILINE == true) {
					BIG_LINEIN = getBigCoor(SMALL_LINEIN, SCALE, roiX, roiY);
					makeLine(BIG_LINEIN[0], BIG_LINEIN[1], BIG_LINEIN[2], BIG_LINEIN[3]);
					if (SLICES == true) generateBox(SLICE_THICK/SR_SIZE, 1);
						else generateBox(lineWidth*RECON_PX/SR_SIZE, 1);
					run("Select None");
				}

				optimizeContrast();

				// Adjust image size so that all have same size (does not work very well)
				if (XY_VIEW > 0) {
					magS = floor(XY_VIEW / SR_SIZE);
					run("Canvas Size...", "width=" + magS + " height=" + magS + " position=Center zero");
				}

				// Name for the zoom image
				if (nLocs > 10000) ADD_TITLE = "_" + nLocK2 + "K";
				else  ADD_TITLE = "_" + nLocK + "K";
				ADD_TITLE = ADD_TITLE + "_(" + XMIN + "," + YMIN + ")";
				NEW_TITLE = replace(zoomTitle, "(_([0-9])+K)+_TS", ADD_TITLE + "_TS");
				// NEW_TITLE = NEW_TITLE + "_C=" + (z-1);

				// Save zoom image
				SaveZoomPath = ZoomFolder + File.separator + NEW_TITLE + ".tif";
				print("        Box image:" + SaveZoomPath);
				save(SaveZoomPath);
				if (CLOSE == true) close();
			}

			// ******** Save localizations for each ROI *******
			if (LOCROI == true) {
				selectWindow(RESULTS_TITLE);

				// New name
				if (nLocs > 10000) ADD_TITLE = "_" + nLocK2 + "K";
				else  ADD_TITLE = "_" + nLocK + "K";
				ADD_TITLE = ADD_TITLE + "_(" + XMIN + "," + YMIN + ")";
				NEW_TITLE = replace(OUT_TITLE, "(_([0-9])+K)+_TS", ADD_TITLE + "_TS");
				// NEW_TITLE = NEW_TITLE + "_C=" + (z-1);

				// Export localizations within ROI in a csv file
				LocROIPath = LocROIFolder + File.separator + NEW_TITLE + ".csv";
				run("Export results", "filepath=[" + LocROIPath + "] fileformat=[CSV (comma separated)] chi2=false saveprotocol=false");

			}

			// Reset the Results Table
			run("Show results table", "action=reset");

		}
	}

	if (CLOSE == false) {
		if ((MULTI_ROI == true || ALL_CHAN == true) && SLICES == true) {
			run("Images to Stack", "method=[Copy (center)] name=Stack title=[_slice] use");
		}

		if ((MULTI_ROI == true || ALL_CHAN == true)) {
			run("Images to Stack", "method=[Copy (center)] name=Stack title=[Roi] use");
		}
	}

	selectImage(imID);
	run ("Select None");
	// Restore Settings
	restoreSettings();

	//Time counter
	stopTime = getTime();
	Time = stopTime - startTime;

	showStatus("Generate slices from ROI finished");
	print("\n***** Generate Zooms & Slices end after " + Time / 1000 + " s *****");
}

function getHomeFolder(StackFolder) {
	if (indexOf(StackFolder, "Recs TS") > 0) {
		ParentFolder = File.getParent(StackFolder);
	}
	else {
		ParentFolder = StackFolder;
	}
	return ParentFolder;
}

function getLocs(idstring, LocFolderPath) {
	cut = indexOf(idstring, ".tif");
	if (cut > 0) shortName = substring(idstring, 0, cut);
	else shortName = idstring;
	LocPath = LocFolderPath + File.separator + shortName + LocSuffix1;
	// print(LocPath);
	if (File.exists(LocPath) == true || USE_OPEN == true) {
		return LocPath;
	}
	print(LocPath);
	exit("No Loc file found: " + shortName);
}

function printLine(linearray, title) {
	print(title + ": (" + linearray[0] + "," + linearray[1] + "," + linearray[2] + "," + linearray[3] + ")");
}

function generateBox(width, param) {
	getLine(ax1, ay1, ax2, ay2, lineWidth);

	gb = width/2;
	ga = sqrt(((ax2 - ax1) * (ax2 - ax1)) + ((ay2 - ay1) * (ay2 - ay1)));

	sx = gb * (ay2 - ay1) / ga;
	sy = gb * (ax2 - ax1) / ga;

	bx1 = ax1 - sx;
	by1 = ay1 + sy;
	bx2 = bx1 + (ax2 - ax1);
	by2 = by1 + (ay2 - ay1);

	cx1 = ax1 + sx;
	cy1 = ay1 - sy;
	cx2 = cx1 + (ax2 - ax1);
	cy2 = cy1 + (ay2 - ay1);

	arrayX = newArray(bx1, cx1, cx2, bx2);
	arrayY = newArray(by1, cy1, cy2, by2);
	makeSelection("polygon", arrayX, arrayY);
	if (param == 1 || param == 2) run("Add Selection...");
	run("To Bounding Box");
	if (param == 2) run("Add Selection...");
	LINE_COOR = newArray(bx2, by2, bx1, by1);
	return LINE_COOR;
}

function getBigCoor(linearray, sc, oriX, oriY){

	BLINE_COOR = newArray(4);
	BLINE_COOR[0] = sc * (linearray[0] - oriX);
	BLINE_COOR[1] = sc * (linearray[1] - oriY);
	BLINE_COOR[2] = sc * (linearray[2] - oriX);
	BLINE_COOR[3] = sc * (linearray[3] - oriY);
	return BLINE_COOR;

}

function generateSlice(sd, vX) {
	inTitle = getTitle();
	inID = getImageID();
	sc = round(sd / vX);
	run("Reslice [/]...", "output=" + vX + " slice_count=" + sc + " flip");
	ResID = getImageID();
	// optional filtering
	if (GAUSS > 0) {
		radius = GAUSS/SR_SIZE;
		for (g = 0; g < GAUSS_MULT; g++) {
				run("Gaussian Blur 3D...", "x=" + radius + " y="+ radius + " z=" + radius);
				 //run("Gaussian Blur...", "sigma=" + radius + " stack");
		}
	}

	return inTitle;

}

function outProcess(outTitle){

	// Set scale
	setVoxelSize(SR_SIZE/1000, SR_SIZE/1000, Z_SPACE/1000, "um");

	rename(OUT_TITLE);
	outID = getImageID();
	return outID;
}

function cleanTitle(s){
	a = indexOf(s, "_xy");
	if (a > 0) sc = substring(s, 0, a);
	else sc = s;
	return sc;
}

function optimizeContrast() {
	if (Z_COLOR == false) {
		getStatistics(OutArea, OutMean, OutMin, OutMax);
		setMinAndMax(0, OutMax);
		// run("16-bit");
		// setMinAndMax(0, 65535);
		if (AD_CONT == true) {
		run("Enhance Contrast...", "saturated=" + SAT_LEV + " normalize");
		// setMinAndMax(0,65535);
		}
	}
	else if (AD_CONT == true) run("Enhance Contrast...", "saturated=" + SAT_LEVEL);
	return;
}

function ColorZ(imgID, Z_LUT) {

	setBatchMode(true);
	
	selectImage(imgID);
	getDimensions(iw, ih, ich, isl, ifr);
	
	run("Duplicate...", "title=Out duplicate");
	run("RGB Color");
	outsID = getImageID();

	newImage("L", "32-bit ramp", ih, iw, 1);
	lutID = getImageID();	
	run(Z_LUT);
	run("Rotate 90 Degrees Left");
	run("RGB Color");
	run("RGB Stack");


	for (s = 1; s <= isl; s++) {
	
		selectImage(imgID);
		setSlice(s);
		run("Duplicate...", "title=D");
		dupID = getImageID();
		run("RGB Color");
		run("RGB Stack");
	
		imageCalculator("Multiply create 32-bit stack", "D","L");
		run("Make Composite", "display=Composite");
		compID = getImageID();
		for (imc = 1; imc < 4; imc++) {
			Stack.setChannel(imc);
			setMinAndMax(0, 65025);
		}
		run("RGB Color");
		outID = getImageID();
		run("Select All");
		run("Copy");

	
		selectImage(outsID);
		setSlice(s);
		run("Paste");
		run("Select None");
	
		selectImage(dupID);
		close();
	
		selectImage(compID);
		close();
	
		selectImage(outID);
		close();
	}

	selectImage(lutID);
	close();
	
	setBatchMode("exit and display");

	return(outsID);
}
