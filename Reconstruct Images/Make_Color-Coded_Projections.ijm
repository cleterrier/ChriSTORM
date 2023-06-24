// Make_Color-Coded_Projections macro by Christophe Leterrier
// 09/07/2021
// adapted from Make_Projection macro


macro "Make_Color-Coded_Projections" {

//*************** Initialization ***************

	
	// Name of the processing
	MACRO_NAME = "Make Color-Coded Projection";
	
	// Default values for the Options Panel
	CONVERT_DEF = true;
	PROJ_METHOD_DEF = "Sum Slices";
	LUT_DEF = "ZOLA";
	SAVE_DEF="In a folder next to the source folder";

	// Get the folder name
	INPUT_DIR=getDirectory("Select the input stacks directory");

	print("\n\n\n*** " + MACRO_NAME + " Log ***");
	print("");
	print("INPUT_DIR :"+INPUT_DIR);

	// Initialize choices variables
	PROJ_ARRAY = newArray("Max Intensity", "Sum Slices", "Weighted Sum Slices", "None");
	LUT_ARRAY = newArray("Rainbow RGB", "Jet", "Turbo", "ametrine", "ThunderSTORM", "ZOLA", "ZOLANDER", "3color-RMB", "3color-CGY", "2C Cyan-Green", "2C Yellow-Red", "2C Green-Cyan", "2C Red-Yellow");
	SAVE_ARRAY = newArray("In the source folder", "In a subfolder of the source folder", "In a folder next to the source folder", "In a subfolder with custom location");


//*************** Dialog ***************

	// Creation of the dialog box
	Dialog.create(MACRO_NAME + " Options");
	Dialog.addCheckbox("Convert to 8-bit before", CONVERT_DEF);
	Dialog.addChoice("Projection Type", PROJ_ARRAY, PROJ_METHOD_DEF);
	Dialog.addChoice("LUT", LUT_ARRAY, LUT_DEF);
	Dialog.addChoice("Save Images", SAVE_ARRAY, SAVE_DEF);
	Dialog.show();

	// Feeding variables from dialog choices
	CONVERT = Dialog.getCheckbox();
	PROJ_METHOD = Dialog.getChoice();
	LUT = Dialog.getChoice();
	SAVE_TYPE = Dialog.getChoice();

	// Translate projection method into proper string for Color-code options
	if (PROJ_METHOD == "Max Intensity") PROJ_STRING = "MAX";
	else if (PROJ_METHOD == "Sum Slices") PROJ_STRING = "SUM";
	else if (PROJ_METHOD == "Weighted Sum Slices") PROJ_STRING = "WeightedSUM";
	else if (PROJ_METHOD == "None") PROJ_STRING = "None";


	// Get all file names
	ALL_NAMES=getFileList(INPUT_DIR);
	Array.sort(ALL_NAMES);
	N_LENGTH = ALL_NAMES.length;
	ALL_EXT=newArray(N_LENGTH);
	// Create extensions array
	for (i = 0; i < N_LENGTH; i++) {
	//	print(ALL_NAMES[i]);
		ALL_NAMES_PARTS = getFileExtension(ALL_NAMES[i]);
		ALL_EXT[i] = ALL_NAMES_PARTS[1];
	}


//*************** Prepare processing ***************

//	setBatchMode(true);

	// Create the output folder
	OUTPUT_DIR="Void";

	if (SAVE_TYPE == "In the source folder") {
		OUTPUT_DIR = INPUT_DIR;
	}

	if (SAVE_TYPE == "In a subfolder of the source folder") {
		OUTPUT_DIR = INPUT_DIR + "Color-coded" + File.separator;
		if (File.isDirectory(OUTPUT_DIR) == false) {
			File.makeDirectory(OUTPUT_DIR);
		}
	}

	if (SAVE_TYPE == "In a folder next to the source folder") {
		OUTPUT_DIR = File.getParent(INPUT_DIR);
		OUTPUT_NAME = File.getName(INPUT_DIR);
		OUTPUT_DIR = OUTPUT_DIR + File.separator + OUTPUT_NAME + " color-coded" + File.separator;
		if (File.isDirectory(OUTPUT_DIR) == false) {
			File.makeDirectory(OUTPUT_DIR);
		}
	}

	if (SAVE_TYPE == "In a folder with custom location") {
		OUTPUT_DIR = getDirectory("Choose the save folder");
		INPUT_NAME = File.getName(INPUT_DIR);
		if (indexOf(INPUT_NAME, "Extracted") > 0) {
			ROOT_NAME = substring(INPUT_NAME, 0, lengthOf(INPUT_NAME)-10);
		}
		else {
			ROOT_NAME = INPUT_NAME;
		}
		OUTPUT_DIR = OUTPUT_DIR + File.separator + ROOT_NAME + " Color-coded" + File.separator;
		if (File.isDirectory(OUTPUT_DIR) == false) {
			File.makeDirectory(OUTPUT_DIR);
		}
	}

	OUTPUT_PARENT_DIR=File.getParent(OUTPUT_DIR);

	print("OUTPUT_DIR: "+OUTPUT_DIR);
	print("OUTPUT_PARENT_DIR: "+OUTPUT_PARENT_DIR);


//*************** Processing  ***************

	// Loop on all .tif extensions
	for (n=0; n<N_LENGTH; n++) {
		if (ALL_EXT[n]==".tif") {

			// Get the file path
			FILE_PATH=INPUT_DIR+ALL_NAMES[n];

			// Store components of the file name
			FILE_NAME=File.getName(FILE_PATH);
			FILE_DIR = File.getParent(FILE_PATH);
			FILE_SEP = getFileExtension(FILE_NAME);
			FILE_SHORTNAME = FILE_SEP[0];
			FILE_EXT = FILE_SEP[1];

			print("");
			print("INPUT_PATH:", FILE_PATH);
	//		print("FILE_NAME:", FILE_NAME);
	//		print("FILE_DIR:", FILE_DIR);
	//		print("FILE_EXT:", FILE_EXT);
	//		print("FILE_SHORTNAME:", FILE_SHORTNAME);

			open(FILE_PATH);
			STACK_ID = getImageID();
			STACK_TITLE = getTitle();
			SLICE_NUMBER = nSlices;

			
			// Convert to 8-bit before color coding
			if (CONVERT == true) {
				run("8-bit");
			}

			// Perform the projection
			run("Temporal-Color Code", "lut=" + LUT + " projection=" + PROJ_STRING + " start=1 end=" + nSlices);
			if (PROJ_STRING == "WeightedSUM") run("Select None");

			// Close input stack
			selectImage(STACK_ID);
			close();

			// Create output file path and save the output image
			//if (PROJ_STRING == "WeightedSUM") PROJ_TITLE = "weightedSUM_" + STACK_TITLE;
			//else PROJ_TITLE = PROJ_STRING + "_colored";
			//selectWindow(PROJ_TITLE);
			OUTPUT_PATH = OUTPUT_DIR + substring(FILE_NAME, 0, lengthOf(FILE_NAME) - 8) + substring(FILE_NAME, lengthOf(FILE_NAME) - 8, lengthOf(FILE_NAME));
			save(OUTPUT_PATH);
			print("OUTPUT_PATH: "+OUTPUT_PATH);

			// Close output image if checked
			close();



		}// end of IF loop on tif extensions
	}// end of FOR loop on all files

//	setBatchMode("exit and display");
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
