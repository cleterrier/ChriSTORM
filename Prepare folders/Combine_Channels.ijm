// Combine_Channels macro by Christophe Leterrier
//
// Process files with 1st channel string in the name ("ROI1" for Neo output) and combine them with the same file with 2nd channel string in the name ("ROI2" for Neo output)
// Lower lambda (ROI1) is on top of higher lambda (ROI2) by default
// The extracted images/stacks are located in the same folder
// 29/11/2021

macro "Combine_Channels" {

//*************** Initialization ***************

	// Define choice variables and default values
	MACRO_NAME = "Combine Channels";
	C1_STRING_DEF = "ROI1";
	C2_STRING_DEF = "ROI2";
	DIR_ARRAY = newArray("Left-Right", "Top-Bottom"); 
	DIR_DEF = "Top-Bottom";
	ORDER_ARRAY = newArray("Ch1 left/top", "Ch2 left/top");
	ORDER_DEF = "Ch1 left/top";
	CROP_DEF = 0;
	OME_DEF = true;

	// Get the folder name
	INPUT_DIR=getDirectory("Select the input directory");

	print("\n\n\n*** " + MACRO_NAME + " Log ***");
	print("");
	print("INPUT_DIR :"+INPUT_DIR);


//*************** Dialog ***************

	// Creation of the dialog box
	Dialog.create(MACRO_NAME + " Options");
	
	Dialog.addString("First channel ID string", C1_STRING_DEF, 8);
	Dialog.addString("Second channel ID string", C2_STRING_DEF, 8);
	Dialog.addChoice("Combine direction", DIR_ARRAY, DIR_DEF);
	Dialog.addChoice("Combine order", ORDER_ARRAY, ORDER_DEF);
	Dialog.addNumber("Only keep first frames (0 for all)", CROP_DEF, 0, 8, "frames");
	Dialog.addCheckbox("Save as OME-tiff", OME_DEF);
	
	Dialog.show();

	// Feeding variables from dialog choices
	C1_STRING = Dialog.getString;
	C2_STRING = Dialog.getString;
	DIR = Dialog.getChoice();
	ORDER = Dialog.getChoice();
	CROP = Dialog.getNumber();
	OME = Dialog.getCheckbox();

	// Generate options for combine command
	COMBINE = "";
	if (DIR == "Top-Bottom") COMBINE += " combine";

	// Reverse order of images if needed
	if (ORDER ==  "Ch2 left/top") {
		C1F_STRING = C2_STRING; 
		C2F_STRING = C1_STRING;
	}
	else {
		C1F_STRING = C1_STRING; 
		C2F_STRING = C2_STRING;		
	}

	// Generate suffix
	C_OUT = C1F_STRING + "_" + C2F_STRING + "_comb";

	if (CROP > 0) {
		C_OUT = C_OUT + "_" + CROP + "f";
	}

//*************** Prepare processing ***************

	setBatchMode(true);
	
	// Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);
	N_LENGTH = ALL_NAMES.length;
	ALL_SHORTNAMES = newArray(N_LENGTH);
	ALL_EXT = newArray(N_LENGTH);
	
	// Create extensions array
	for (i = 0; i < N_LENGTH; i++) {
	//	print(ALL_NAMES[i]);
		ALL_NAMES_PARTS = getFileExtension(ALL_NAMES[i]);
		ALL_SHORTNAMES[i] = ALL_NAMES_PARTS[0];
		ALL_EXT[i] = ALL_NAMES_PARTS[1];
	}


	// Create the output folder
	OUTPUT_DIR="Void";

	SAVE_TYPE = "In the source folder";
	if (SAVE_TYPE == "In the source folder") {
		OUTPUT_DIR = INPUT_DIR;
	}

	OUTPUT_PARENT_DIR=File.getParent(OUTPUT_DIR);

	// print("OUTPUT_DIR: "+OUTPUT_DIR);
	// print("OUTPUT_PARENT_DIR: "+OUTPUT_PARENT_DIR);


//*************** Processing  ***************

	// Loop on all .tif extensions that have C1_STRING in the name
	for (n = 0; n < N_LENGTH; n++) {
		if (ALL_EXT[n] == ".tif" && indexOf(ALL_NAMES[n], C1F_STRING) > -1) {

			// Get the file 1  (first channel) path
			FILE1_PATH = INPUT_DIR + ALL_NAMES[n];

			// Store components of the file 1 name
			FILE1_NAME = File.getName(FILE1_PATH);
			FILE1_DIR = File.getParent(FILE1_PATH);
			FILE1_SEP = getFileExtension(FILE1_NAME);
			FILE1_SHORTNAME = FILE1_SEP[0];
			FILE1_EXT = FILE1_SEP[1];

			// Generate path of file 2 (second channel)
			FILE2_PATH = replace(FILE1_PATH, C1F_STRING, C2F_STRING);
			
			// Continue only if File 2 exists
			if (File.exists(FILE2_PATH) == 1) {
				
				// Store components of the file 2 name
				FILE2_NAME = File.getName(FILE2_PATH);
				FILE2_DIR = File.getParent(FILE2_PATH);
				FILE2_SEP = getFileExtension(FILE2_NAME);
				FILE2_SHORTNAME = FILE2_SEP[0];
				FILE2_EXT = FILE2_SEP[1];

				print("");
				print("FILE1 INPUT_PATH:", FILE1_PATH);
				print("FILE2 INPUT_PATH:", FILE2_PATH);
				
				//open(FILE1_PATH);
				run("Bio-Formats", "open=[" + FILE1_PATH + "] autoscale color_mode=Default rois_import=[ROI manager] view=[Standard ImageJ] stack_order=Default");
				STACK1_ID = getImageID();
				STACK1_TITLE = getTitle();

				//open(FILE2_PATH);
				run("Bio-Formats", "open=[" + FILE2_PATH + "] autoscale color_mode=Default rois_import=[ROI manager] view=[Standard ImageJ] stack_order=Default");
				STACK2_ID = getImageID();
				STACK2_TITLE = getTitle();

				run("Combine...", "stack1=[" + STACK1_TITLE + "] stack2=[" + STACK2_TITLE + "]" +  COMBINE);
				COMB_ID = getImageID();
				COMB_TITLE = getTitle();

				if (CROP > 0) {
					COMB_NS = nSlices;
					START_SLICE = CROP + 1;
					run("Slice Remover", "first=" + START_SLICE + " last=" + COMB_NS + " increment=1");
				}

				// Create output file path and save the output image
				OUTPUT_PATH = OUTPUT_DIR + replace(FILE1_NAME, C1F_STRING, C_OUT);
				if (OME == false) {
					save(OUTPUT_PATH);
				}
				else {
					run("OME-TIFF...", "save=[" + OUTPUT_PATH + "] compression=Uncompressed");
				}			
				print("OUTPUT_PATH: " + OUTPUT_PATH);

				// Close output image
				close();
		
			}// end of IF loop on file 2 exists
		}// end of IF loop on tif extensions
	}// end of FOR loop on all files


	setBatchMode("exit and display");
	print("");
	print("*** " + MACRO_NAME + " end ***");
	showStatus(MACRO_NAME + " finished");
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
