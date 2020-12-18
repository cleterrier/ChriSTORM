// Batch_FRC macro by Christophe Leterrier
// Splits ThunderSTORM csv localization files to generate two images
// Performs FRC computation on this image pair (classic FRC curve and/or spatial FRC map)
// Requires ThunderSTORM (I use the "Hohlbein Lab" update site)
// BIOP FRC requires BIOP plugins ("PTBIOP" update site)
// NanoJ FRC Map requires NanoJ-SQUIRREL ("NanoJ-Core" and "NanoJ-SQUIRREL" update sites) 

macro "Batch FRC" {

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
	OUT_PARAM = "FRC";
	
	// Camera setup variables
//	CAM_SIZE = 160;
//	CG = 12.48; // camera gain new images
//	EM = 100; // EM gain new images	

	// File chooser
	CHOOSE_DEF = false;
	CHOOSE_STRING_DEF = "";

	EXC_DEF = false;
	EXC_STRING_DEF = "_ZR_";


	// Split mode
	SPLIT_ARRAY = newArray("localizations", "frame", "100 frames");
	SPLIT_DEF = SPLIT_ARRAY[2];

	// Keep split localization files
	KEEP_DEF = true;
	KEEPIM_DEF = true;

	// Cam image size (in pixels) 0, 5,
	CAMX_DEF = 256;
	CAMY_DEF = 256;
	CAMPIX_DEF = 160;
	
	// Magnification (size of pixel on widefield image / size of pixel on paired SR images) 
	PIX_DEF = 8;	

	// Compute FRC
	FRC_DEF = true;
	NFRC_DEF = true;
	BLOCK_DEF = 10;

	
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
		Dialog.addChoice("Split mode", SPLIT_ARRAY, SPLIT_DEF);
		Dialog.addCheckbox("Keep split locs files", KEEP_DEF);
		Dialog.addCheckbox("Keep SR image pairs", KEEPIM_DEF);
		Dialog.addNumber ("Cam image width:", CAMX_DEF, 0, 5, "pixels");
		Dialog.addNumber ("Cam image height:", CAMY_DEF, 0, 5, "pixels");
		Dialog.addNumber("Cam pixel size:", CAMPIX_DEF, 0, 5, "nm");
		Dialog.addNumber("SR image pairs pixel size", PIX_DEF, 0, 5, "nm");
		Dialog.addCheckbox("Compute BIOP FRC", FRC_DEF);
		Dialog.addCheckbox("Compute NanoJ FRC Map", NFRC_DEF);
		Dialog.addNumber("FRC map blocks per axis", BLOCK_DEF, 0, 5, "blocks");

		Dialog.show();
		
		// Feeding variables from dialog choices
		CHOOSE = Dialog.getCheckbox();
		CHOOSE_STRING = Dialog.getString();

		EXC = Dialog.getCheckbox();
		EXC_STRING = Dialog.getString();
	
		SPLIT_MODE = Dialog.getChoice();
		KEEP = Dialog.getCheckbox();
		KEEPIM = Dialog.getCheckbox();

		CAMX = Dialog.getNumber();
		CAMY = Dialog.getNumber();
		CAMPIX = Dialog.getNumber();
		
		PIX = Dialog.getNumber();
		
		FRC = Dialog.getCheckbox();
		NFRC = Dialog.getCheckbox();

		BLOCK = Dialog.getNumber();
	
	}

	// called from macro:
	// arguments (INPUT_DIR, CHOOSE, CHOOSE_STRING, EXC, EXC_STRING, SPLIT_MODE, KEEP, KEEPIM, PIX, CAMX, CAMY, CAMPIX, FRC, NFRC, BLOCK)
	else {
		CHOOSE = argarray[1];
		CHOOSE_STRING = argarray[2];
		EXC = argarray[3];
		EXC_STRING = argarray[4];
		SPLIT_MODE = argarray[5];
		KEEP = argarray[6];
		KEEPIM = argarray[7];
		PIX = argarray[8];
		CAMX = argarray[9];	
		CAMY = argarray[10];
		CAMPIX = argarray[11];		
		FRC = argarray[12];
		NFRC = argarray[13];
		BLOCK = argarray[14];
	}
	
//*************** Prepare processing ***************	

	//Time counter
	startTime = getTime();
	
	// Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);
	ALL_TS = newArray(ALL_NAMES.length);
	ALL_TYPES = newArray(ALL_NAMES.length);

	// Make output folder
	OUTPUT_DIR = File.getParent(INPUT_DIR);
	OUTPUT_NAME = File.getName(INPUT_DIR);
	OUTPUT_DIR = OUTPUT_DIR + File.separator + OUTPUT_NAME + " " + OUT_PARAM + File.separator;

	if (File.isDirectory(OUTPUT_DIR) == false) {
		File.makeDirectory(OUTPUT_DIR);
	}

	print("Output folder: " + OUTPUT_DIR);
	print("");


	// Prepare filtering strings to split localizations
	if (SPLIT_MODE == "localizations") {
		FILT_STRING1 = "id%2=0";
		FILT_STRING2 = "id%2=1";
	}
	else if (SPLIT_MODE == "frames") {
		FILT_STRING1 = "frame%2=0";
		FILT_STRING2 = "frame%2=1";
	}
	else if (SPLIT_MODE == "100 frames") {
		FILT_STRING1 = "frame%200<100";
		FILT_STRING2 = "frame%200>99";
	}

	// Calculate Magnification for SR reconstructions
	MAG = CAMPIX/PIX;

	// Initialize results compilation table for NanoJ FRC Map
	if (NFRC == true) {
		OUT_NFRC = "FRC Map Results";
		Table.create(OUT_NFRC);
	}

//	run("Camera setup", "isemgain=true pixelsize=" + CAM_SIZE + " gainem=" + CG +" offset=85 photons2adu=" + EM);

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

				
				// Open the loc file	
				run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + FILE_PATH + "] livepreview=false fileformat=" + ALL_TYPES[n]);
	
				// Filter even localizations (file 1)
				run("Show results table", "action=filter formula=[" + FILT_STRING1 + "]");

				// Count the nLoc number
				nLocs = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
				nLocK = round(nLocs / 1000);
				// Rename file 1
				OUT_TITLE1 = FILE_NAME;
				OUT_TITLE1 = replace(OUT_TITLE1, "([0-9])+K_", "FRCa_" + nLocK + "K_");
				if (OUT_TITLE1 == FILE_NAME) {
					OUT_TITLE1 = replace(OUT_TITLE1, ".csv", "_FRCa.csv");
				}
				// Save loc file 1
				if (KEEP == true) {	
					OUT_PATH1 = OUTPUT_DIR + OUT_TITLE1;
					run("Export results", "filepath=[" + OUT_PATH1 + "] fileformat=[CSV (comma separated)] saveprotocol=false");
					print("      Output loc file 1:" + OUT_TITLE1);
				}
				// Generate image 1
				run("Visualization", "imleft=0.0 imtop=0.0 imwidth=" + CAMX + " imheight=" + CAMY + " renderer=[Normalized Gaussian] dxforce=false pickedlut=[Rainbow RGB] magnification=" + MAG + " colorize=true dx=5.0 threed=false dzforce=false");			
				IM1_ID = getImageID();
				// Save image 1
				OUT_TITLEIM1 = replace(OUT_TITLE1, ".csv", ".tif");
				OUT_PATHIM1 = OUTPUT_DIR + OUT_TITLEIM1;
				rename(OUT_TITLEIM1);
				if (KEEPIM == true) {
					save(OUT_PATHIM1);
					print("      Output image 1:" + OUT_TITLEIM1);
				}
				

				
				// Filter odd localizations (file 2)
				run("Show results table", "action=reset");
				run("Show results table", "action=filter formula=[" + FILT_STRING2 + "]");

				// Count the nLoc number
				nLocs = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); rows = rt.getRowCount();");
				nLocK = round(nLocs / 1000);
				
				// Rename file 2
				OUT_TITLE2 = FILE_NAME;
				OUT_TITLE2 = replace(OUT_TITLE2, "([0-9])+K_", "FRCb_" + nLocK + "K_");
				if (OUT_TITLE2 == FILE_NAME) {
					OUT_TITLE2 = replace(OUT_TITLE2, ".csv", "_FRCb.csv");
				}
				// Save loc file 2
				if (KEEP == true) {	
					OUT_PATH2 = OUTPUT_DIR + OUT_TITLE2;
					run("Export results", "filepath=[" + OUT_PATH2 + "] fileformat=[CSV (comma separated)] saveprotocol=false");
					print("      Output loc file 2:" + OUT_TITLE2);
				}
				// Generate image 2
				run("Visualization", "imleft=0.0 imtop=0.0 imwidth=" + CAMX + " imheight=" + CAMY + " renderer=[Normalized Gaussian] dxforce=false pickedlut=[Rainbow RGB] magnification=" + MAG + " colorize=true dx=5.0 threed=false dzforce=false");			
				IM2_ID = getImageID();
				// Save image 2
				OUT_TITLEIM2 = replace(OUT_TITLE2, ".csv", ".tif");
				OUT_PATHIM2 = OUTPUT_DIR + OUT_TITLEIM2;
				rename(OUT_TITLEIM2);
				if (KEEPIM == true) {
					save(OUT_PATHIM2);
					print("      Output image 2:" + OUT_TITLEIM2);
				}



				// Compute FRC

				// BIOP FRC
				if (FRC == true) {
					
					// Run FRC, get table title
					run("FRC Calculation...", "image_1=" + OUT_TITLEIM1 + " image_2=" + OUT_TITLEIM2 + " resolution=[Fixed 1/7] display");				
					RES_TITLE = "FRC Results";

					// Get FRC resolution column header from table
					if (FileCount == 1) {
						HEADS_STRING = Table.headings(RES_TITLE);
						HEADS = split(HEADS_STRING, "\t");
					}

					// Get FRC resolution value from table and log it
					val = Table.get(HEADS[2], FileCount-1, RES_TITLE);
					if  (isNaN(val) == true) print("      FRC failed: no intersection with threshold. Try generating SR images with smaller pixels.");
					else print("      FRC performed: resolution is " + d2s(val*1000,1) + " nm.");

					// Close images if no map after			
					if (NFRC == false) {					
						selectImage(IM1_ID);
						close();
						selectImage(IM2_ID);
						close();	
					}
					// Rename if map after to be able to select via unique string with Images to Stack
					else {
						selectImage(IM1_ID);
						rename(replace(OUT_TITLEIM1, "FRCa", "imFRCa"));
						selectImage(IM2_ID);
						rename(replace(OUT_TITLEIM2, "FRCb", "imFRCb"));
					}
				}

				// NanoJ FRC Map
				if (NFRC == true) {

					// Make a 2-image stack with the SR pair
					run("Images to Stack", "name=Stack title=[imFRC] use");
					STACK_ID = getImageID();
					
					// Run FRC map, get table title
					run("Calculate FRC-Map", "blocks=" + BLOCK + " pixel=" + PIX);
					RESMAP_TITLE = "FRC-Resolution";

					// Get table headers
					if (FileCount == 1) {
						HEADSMAP_STRING = Table.headings(RESMAP_TITLE);
						HEADSMAP = split(HEADSMAP_STRING, "\t");
					}

					// Set image name in compilation table
					Table.set("Label", FileCount-1, OUT_TITLEIM1, OUT_NFRC);

					// Copy all columns from results table first line to complation table
					vala = newArray(HEADSMAP.length);
					for (i=0; i<HEADSMAP.length; i++) {
						vala[i] = Table.get(HEADSMAP[i], 0, RESMAP_TITLE);
						Table.set(HEADSMAP[i], FileCount-1, vala[i], OUT_NFRC);
					}
					Table.update(OUT_NFRC);

					// Log min and max FRC values
					print("      FRC map performed: resolution is between " + d2s(vala[3],1) + " nm and " + d2s(vala[2],1) + " nm.");
					print("");
					
					// Rename FRC map image with unique name
					selectWindow("FRC Map");
					rename("FRC Map Of " + OUT_TITLEIM2);
					selectImage(STACK_ID);
					close();

					
				}
				
			} // end of IF loop on include/exclude names	
		}	// end of IF loop on extensions
	}	// end of FOR loop on n extensions

//*************** Cleanup and end ***************


	if (FRC == true && FileCount > 1) {
			run("Images to Stack", "name=[FRC curves stack] title=[FRC Of] use");
			save(OUTPUT_DIR + "FRC_Curves.tif");
			close();
			selectWindow("FRC Results");
			saveAs("results", OUTPUT_DIR + "FRC_Curves_Results.xls");
			run("Close");
	}

	if (NFRC == true && FileCount > 1) {
			run("Images to Stack", "name=[FRC Maps stack] title=[FRC Map Of] use");
			save(OUTPUT_DIR + "FRC_Maps.tif");
			close();
			selectWindow(RESMAP_TITLE);
			run("Close");
			selectWindow(OUT_NFRC);
			saveAs("results", OUTPUT_DIR + "FRC_Map_Results.xls");
			run("Close");
	}


	// Restore settings
	restoreSettings();	
	showStatus("Batch FRC finished");
	
	//Time counter
	stopTime = getTime();
	Time = stopTime - startTime;
	
	print("");
	print("*** Batch FRC ends after " + Time / 1000 + " s ***\n\n\n");
	if (called == true) return OUTPUT_DIR;
}