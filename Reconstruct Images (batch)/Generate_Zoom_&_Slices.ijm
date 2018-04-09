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
	LUT_ARRAY = getList("LUTs");

	// log
	print("\n\n***** Generate Zooms & Slices started *****");
	print("\n");

	// Paths for opening the loc files
	LocFolder = "Locs TS";
	LocSuffix1 = ".csv";
	LocSuffix2 = ".tsf";
	StackFolder = getDirectory("image");
	SaveFolderZooms = "Recs TS Box";
	SaveFolderSlices = "Recs TS Slice";
	HomeFolder = getHomeFolder(StackFolder);
	print("  Home folder:" + HomeFolder);

	// Default values for the Options Panel
	MULTI_ROI_DEF = true;
	ALL_CHAN_DEF = false;
	PRO_DEF = false;
	SPEC_DEF = false;
	USE_OPEN_DEF = false;
	
	CAM_SIZE_DEF = 160; // usually 160 nm
	// CG_DEF = 63.6; // camera gain old images
	CG_DEF = 12.48; // camera gain new images
	// EM_DEF = 300; // EM gain old images
	EM_DEF = 100; // EM gain new images
	SR_SIZE_DEF = 4; // 4 nm
	
	P3D_DEF = false;
	Z_SPACE_DEF = 4; // 4 nm for 3D
	Z_MIN_DEF = -500; // -500 nm
	Z_MAX_DEF = 500; // +500 nm
	Z_AUTO_DEF = false;
	Z_SAT_DEF = 10; // restriction of 3D span on top and bottom (in nm)
	Z_UN_DEF = 0; // usually 0
	Z_PROJ_DEF = true; // true
	Z_COLOR_DEF = false;
	Z_LUT_DEF = "Jet"; // LUT for color-coded 3D
	SLICES_DEF = false;
	SLICE_THICK_DEF = 400; // 800 nm
	SLICE_PROJ_DEF = true; // true
	XY_VIEW_DEF = 0; // 2500 nm
	
	GAUSS_DEF = 4;
	AD_CONT_DEF = false;
	SAT_LEV_DEF = 0.1; // 0.1%
	CLOSE_DEF = true;

	// Get the values of the default reconstruction coordinates (256, 1 to 257 in X and Y)
	RECON_PX_DEF = 16; // 20 or 16
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

//*************** Dialog : options ***************

	//Creation of the dialog box
	Dialog.create("Generate zooms & slices: options");
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
	Dialog.addNumber("Final pixel size", SR_SIZE_DEF, 0, 3, "nm");
	Dialog.addMessage("");
	Dialog.addCheckbox("3D", P3D_DEF);
	Dialog.addNumber("Z spacing", Z_SPACE_DEF, 0, 3, "nm");
	Dialog.addNumber("Z min", Z_MIN_DEF, 0, 4, "nm");
	Dialog.addNumber("Z max", Z_MAX_DEF, 0, 4, "nm");
	Dialog.addCheckbox("Z auto-range", Z_AUTO_DEF);
	Dialog.addNumber("Restrict Z-range by", Z_SAT_DEF, 0, 4, "nm");
	Dialog.addNumber("Force Z uncertainty (0 to keep)", Z_UN_DEF, 0, 3, "nm");
	Dialog.addCheckbox("Z project", Z_PROJ_DEF);
	Dialog.addCheckbox("Z colorized", Z_COLOR_DEF);
	Dialog.addChoice("Color LUT", LUT_ARRAY, Z_LUT_DEF);
	Dialog.addMessage("");
	Dialog.addCheckbox("Generate slices", SLICES_DEF);
	Dialog.addNumber("Slice thickness (nm)", SLICE_THICK_DEF, 0, 4, "nm");
	Dialog.addCheckbox("Slice project", SLICE_PROJ_DEF);
	Dialog.addNumber("XY view size (nm) (0 for smallest)", XY_VIEW_DEF, 0, 4, "nm"); // Minimum box size around slice
	Dialog.addMessage("");
	Dialog.addNumber("Gaussian blur (0 for no filter)", GAUSS_DEF, 0, 3, "nm");
	Dialog.addCheckbox("Adjust contrast", AD_CONT_DEF);
	Dialog.addNumber("Saturated pixels", SAT_LEV_DEF, 2, 3, "%");
	Dialog.addCheckbox("Close images", CLOSE_DEF);
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
	SR_SIZE = Dialog.getNumber();

	P3D = Dialog.getCheckbox();
	Z_SPACE = Dialog.getNumber();
	Z_MIN = Dialog.getNumber();
	Z_MAX = Dialog.getNumber();
	Z_AUTO = Dialog.getCheckbox();
	Z_SAT = Dialog.getNumber();
	Z_UN = Dialog.getNumber();
	Z_PROJ = Dialog.getCheckbox();
	Z_COLOR = Dialog.getCheckbox();
	Z_LUT = Dialog.getChoice();

	SLICES = Dialog.getCheckbox();
	SLICE_THICK = Dialog.getNumber();
	SLICE_PROJ = Dialog.getCheckbox();
	XY_VIEW = Dialog.getNumber();

	GAUSS = Dialog.getNumber();
	AD_CONT = Dialog.getCheckbox();
	SAT_LEV = Dialog.getNumber();

	CLOSE = Dialog.getCheckbox();

//*************** Prepare visualization ***************	

	//Time counter
	startTime = getTime();

	// Change input folder if processed loc chosen
	OUT_PARAM = "";
	if (PRO == true){
		LocFolder = "Locs TS proc";
		OUT_PARAM = "p";
	}
	LocFolderPath = HomeFolder + File.separator + LocFolder;
	if (SPEC == true){
		LocFolderPath = getDirectory("Select the localizations folder");
	}	
	print("  Loc folder:" + LocFolderPath);

	// Log stack type
	print("  Stack type: " + stackType);
		
	// Store the output parameters
	if (P3D == false) {	
		OUT_PARAM += "_xy" + SR_SIZE;
	}
	else if (Z_COLOR == true){
		OUT_PARAM += "_xy" + SR_SIZE + "z" + Z_SPACE + "c";
	}	
	else {
		OUT_PARAM += "_xy" + SR_SIZE + "z" + Z_SPACE;
	}

	if (SLICES == true) {
		OUT_PARAM += "_s" + SLICE_THICK;
	}

	print("  Output parameters: " + OUT_PARAM);
	
	// Make the output directories
	ZoomFolder = HomeFolder + File.separator + SaveFolderZooms  + " " + OUT_PARAM;
	File.makeDirectory(ZoomFolder);
	print("  Boxes folder:" + ZoomFolder);
	
	if (SLICES == true) {
		SliceFolder = HomeFolder + File.separator + SaveFolderSlices + " " + OUT_PARAM;
		File.makeDirectory(SliceFolder);
		print("  Slices folder:" + SliceFolder);
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

		if (Z_COLOR == true) {
			COLOR_STRING = " colorize=true pickedlut=[" + Z_LUT + "]";
		}

		else COLOR_STRING = " colorize=false pickedlut=[" + Z_LUT + "]";

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
			ROI_PARAM = "Roi" + IJ.pad(r + 1, 3);
					
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
				SMALL_LINEIN = newArray(lineX1, lineY1, lineX2, lineY2);
				// Make box around line
				if (SLICES == true) SMALL_LINEOUT = generateBox(SLICE_THICK/RECON_PX, 0);
					else SMALL_LINEOUT = generateBox(lineWidth, 0);
				getSelectionBounds(boxX, boxY, boxW, boxH);
				roiX = boxX;
				roiY = boxY;
				roiW = boxW;
				roiH = boxH;				
				// Test if ROI is big enough compared to minimum size
				// size of the minimum box (in pixels)
				boxMin = floor(XY_VIEW / RECON_PX);		
				// coordinates of ROI middle
				midX = ((lineX2 - lineX1) / 2) + lineX1;
				midY = ((lineY2 - lineY1) / 2) + lineY1;
				// Enlarge in X
				if (boxW < boxMin) {
					roiX = (midX - boxMin/2);
					roiW = boxMin;
				}
				// Enlarge in Y
				if (boxH < boxMin) {
					roiY = (midY - boxMin/2);
					roiH = boxMin;
				}
	
			}
			//If not, just get the bounding box
			else {
				ROILINE = false;
				getSelectionBounds(roiX, roiY, roiW, roiH);
			}	
			// print("roiX=" + roiX + ", roiY=" + roiY + ", roiW=" + roiW + ", roiH=" + roiH);
			
			// Draw the bounding box ROI and the name of the ROI
			makeRectangle(roiX, roiY, roiW, roiH);
	
			//***** Set the channel (after fiddling with the ROI!) *****
			if (ALL_CHAN == true) {				
				if (stackType == "2C")
					Stack.setChannel(z);
				if (stackType == "2C_zc")
					Stack.setSlice(z);	
			}
			
			//***** Preparation of the Visu string *****
			roiMagnif = CAM_SIZE / SR_SIZE;
			roiZoom = CAM_SIZE / RECON_PX;	
			reconX = roiX / roiZoom + RECON_LTX;
			reconY = roiY /roiZoom + RECON_LTY;
			reconW = roiW /roiZoom;
			reconH = roiH /roiZoom;
			// XY part of the Visualization string
			VISU_STRING_XY = "imleft=" + reconX + " imtop=" + reconY + " imwidth=" + reconW + " imheight=" + reconH + " renderer=[Normalized Gaussian] magnification=" + roiMagnif + " dxforce=false dx=20.0";			

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
			
			VISU_STRING = VISU_STRING_XY + VISU_STRING_Z + VISU_STRING_RANGE;
			
			// Launch the visualization
			selectWindow(RESULTS_TITLE);
			run("Visualization", VISU_STRING);	
			rename("ROIoutput");
							
			// Create output title
			imHeaderClean = cleanTitle(imHeader);
			OUT_TITLE = ROI_PARAM + "_" + imHeaderClean;
			outIm = outProcess(OUT_TITLE);
			zoomTitle = getTitle();
		
			if (ROILINE == true) {			
				SCALE = RECON_PX / SR_SIZE;
				BIG_LINEOUT = getBigCoor(SMALL_LINEOUT, SCALE, roiX, roiY);
				makeLine(BIG_LINEOUT[0], BIG_LINEOUT[1], BIG_LINEOUT[2], BIG_LINEOUT[3]);		
				if (SLICES == true) {
					generateSlice(SLICE_THICK/1000, SR_SIZE/1000);
					sliceTitle = getTitle();
					optimizeContrast();
					SaveSlicePath = SliceFolder + File.separator + sliceTitle + ".tif";
					print("        Slice image:" + SaveSlicePath);
					save(SaveSlicePath);
					if (CLOSE == true) close();		
				}	
				selectImage(outIm);			
			}
			
			// optional filtering
			if (GAUSS > 0) {
				run("Gaussian Blur...", "sigma=" + GAUSS/SR_SIZE + " stack");;
			}
			
			if (P3D == true) {
				if (Z_PROJ == true) {
					run("Z Project...", "projection=[Sum Slices]");
					projID = getImageID();
					rename(zoomTitle);
					optimizeContrast();					
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
			
			if (XY_VIEW > 0) {
				magS = floor(XY_VIEW / SR_SIZE);
				run("Canvas Size...", "width=" + magS + " height=" + magS + " position=Center zero");
			}
			SaveZoomPath = ZoomFolder + File.separator + zoomTitle + ".tif";
			print("        Box image:" + SaveZoomPath);
			save(SaveZoomPath);
			if (CLOSE == true) close();			
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
	print(LocPath);
	if (File.exists(LocPath) == true) { 
		return LocPath;
	}
	else {
		LocPath = LocFolderPath + File.separator + shortName + LocSuffix2;
	}
	if (File.exists(LocPath) == true) {
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
		run("Gaussian Blur...", "sigma=" + GAUSS/SR_SIZE + " stack");;
	}
	if (SLICE_PROJ_DEF == true) {
		run("Z Project...", "projection=[Sum Slices]");
		// run("Flip Horizontally");
		ZpID = getImageID();
		outTitle = inTitle + "_slice";
		rename(outTitle);	
		selectImage(ResID);
		close();
		selectImage(ZpID);
		ZpTitle = getTitle();
		return ZpTitle();
	}
	else {
		outTitle = inTitle + "_slice";
		rename(outTitle);	
		ResTitle = getTitle();
		return ResTitle();
		
	}
	
}

function outProcess(outTitle){

	// Set scale
	setVoxelSize(SR_SIZE/1000, SR_SIZE/1000, Z_SPACE/1000, "um");
		
	
	if (Z_COLOR == true) {
		run("Stack to RGB");
		colorID = getImageID();
		outID = getImageID();
		selectWindow(RECON_TITLE);
		close();
		selectImage(outID);		
	}

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