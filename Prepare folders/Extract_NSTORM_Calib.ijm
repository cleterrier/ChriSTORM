// Extract_NSTORM_Calib macro by Christophe Leterrier
// v3.4 04-05-2016

macro "Extract NSTORM Calibrations" {

//*************** Initialization ***************

//	Save Settings
	saveSettings();

//*************** Dialog: get the input images folder path ***************

	INPUT_DIR = getDirectory("Select a source folder with nd2 calibration stacks");

	print("\n\n\n*** Extract NSTORM Calibrations Log ***");
	print("");
	print("INPUT_DIR: " + INPUT_DIR);

//*************** Prepare Processing (get names, open images, make output folder) ***************

	setBatchMode(true);

//	Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);
	N_LENGTH = ALL_NAMES.length;
	ALL_EXT = newArray(N_LENGTH);
//	Create extensions array
	for (i = 0; i < N_LENGTH; i++) {
//		print(ALL_NAMES[i]);
		ALL_NAMES_PARTS = getFileExtension(ALL_NAMES[i]);
		ALL_EXT[i] = ALL_NAMES_PARTS[1];
	}

//	Create the output folder
	OUTPUT_DIR = File.getParent(INPUT_DIR);
	OUTPUT_NAME = File.getName(INPUT_DIR);
	OUTPUT_SHORTA = split(OUTPUT_NAME, " ");
	OUTPUT_SHORT = OUTPUT_SHORTA[0];
	OUTPUT_DIR = OUTPUT_DIR + File.separator + OUTPUT_SHORT + " tif" + File.separator;
	if (File.isDirectory(OUTPUT_DIR) == false) {
		File.makeDirectory(OUTPUT_DIR);
	}

	OUTPUT_PARENT_DIR = File.getParent(OUTPUT_DIR);

	print("OUTPUT_DIR: " + OUTPUT_DIR);
//	print("OUTPUT_PARENT_DIR: " + OUTPUT_PARENT_DIR);

//*************** Process Images ***************

//	Loop on all image extensions
	for (n = 0; n < N_LENGTH; n++) {

//		Test if file format recognized by BioFormats (fast)
		run("Bio-Formats Macro Extensions");
		FILE_NAME = ALL_NAMES[n];
		Ext.isThisType(INPUT_DIR + FILE_NAME, IM_TYPE);
//		print(FILE_NAME);
//		print(IM_TYPE);

		if ((IM_TYPE == "true") || ALL_EXT[n] == ".nd2") {

//		Bio Format Importer to open the multi-channel images
//			Get the file path
			FILE_PATH = INPUT_DIR + FILE_NAME;

//			Store components of the file name
			FILE_DIR = File.getParent(FILE_PATH);
			FILE_SEP = getFileExtension(FILE_NAME);
			FILE_SHORTNAME = FILE_SEP[0];
			FILE_EXT = FILE_SEP[1];

			print("");
			print("INPUT_PATH:", FILE_PATH);
//			print("FILE_NAME:", FILE_NAME);
//			print("FILE_DIR:", FILE_DIR);
//			print("FILE_EXT:", FILE_EXT);
//			print("FILE_SHORTNAME:", FILE_SHORTNAME);

			if (ALL_EXT[n] != ".tif") {
	//			Start BioFormats and get series number in file
				Ext.setGroupFiles("false");
				Ext.setId(FILE_PATH);
				Ext.getEffectiveSizeC(CHANNEL_COUNT);
				print("Bio-Formats Id Set");
	//			showStatus("launching Bio-Formats Importer");
	//			print("Launching Bio-Formats Importer...");
	
	//			Open input image
				run("Bio-Formats Importer", "open=[" + FILE_PATH + "] " + "view=Hyperstack" + " color_mode=Grayscale stack_order=Default ");
				print("Bio-Formats Importer launched");
			}

			else {
				open(FILE_PATH);
			}
			
			FILE_TITLE = getTitle();
			FILE_ID = getImageID();

//			Test number of channels (201 frames/channel)
			nChan = nSlices / 201;
			if (nChan != floor(nChan)) {
				print("    this is not a calibration stack!");
				close();
			}
			
			else {
				
				if (nChan > 1) {
// 					Split in single channels
					run("Deinterleave", "how=" + nChan);
//					Iterate on channels to save each one
					for (c = 0; c < nChan; c++) {
						cTitle = FILE_TITLE + " #" + (c + 1);
						selectWindow(cTitle);
//						Remove first and last 20 slices
						run("Slice Remover", "first=1 last=20 increment=1");
						run("Slice Remover", "first=161 last=181 increment=1");
// 						Create output file path and save the stack
						OUTPUT_PATH = OUTPUT_DIR + FILE_SHORTNAME + "_ch" + (c + 1) + ".tif";
						save(OUTPUT_PATH);
						print("OUTPUT_PATH: " + OUTPUT_PATH);
						close();													
					}
				}
				
				else {
//					Remove first and last 20 slices
					run("Slice Remover", "first=1 last=20 increment=1");
					run("Slice Remover", "first=161 last=181 increment=1");						
// 					Create output file path and save the output image
					OUTPUT_PATH = OUTPUT_DIR + FILE_SHORTNAME + ".tif";
					save(OUTPUT_PATH);
					print("OUTPUT_PATH: " + OUTPUT_PATH);
					close();
				}
			}
		}	// end of IF loop on images extensions
	}	// end of FOR loop on n extensions

//*************** Cleanup and end ***************

	// Restore settings
	restoreSettings();
	setBatchMode("exit and display");
	print("");
	print("*** Extract NSTORM Calibrations end ***");
	showStatus("Extract NSTORM Calibrations finished");
}


//*************** Functions ***************

function getFileExtension(Name) {
	nameparts = split(Name, ".");
	shortname = nameparts[0];
	if (nameparts.length > 2) {
		for (k = 1; k < nameparts.length - 1; k++) {
			shortname += "." + nameparts[k];
		}
	}
	extname = "." + nameparts[nameparts.length - 1];
	namearray = newArray(shortname, extname);
	return namearray;
}
