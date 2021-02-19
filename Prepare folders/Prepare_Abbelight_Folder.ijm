// Prepare Abbelight folder macro by Christophe Leterrier
// v1.0 19/02/2021
// Test at your own peril, it moves/renames files and could delete some!
//
// Here is the structure of an experiment from the Abbelight scope:
//
// Experiment folder
// |
// |– Condition 1 folder (named "Experience0")
// |  |
// |  |– Name.txt (contains the string that defines the condition, such as "ctrl_PFA_NB100", will optionnally be looked for and apprended to the condition number in file names)
// |  |– Log.txt (contains the log of paramters the condition, will optionnally be looked for and grouped)
// |  |– Acquisition 1 folder (named "CellZone0")
// |  |– Acquisition 2 folder (named "CellZone1")
// |  |– ...
// |  |
// |– Condition 2 folder ("Experience1")
// |  |
// |  |– Name.txt
// |  |– Log.txt
// |  |– Acquisition 1 folder ("CellZone0")
// |  |– Acquisition 2 folder ("CellZone1")
// |  |– ...
// |  |
// |...
//
// This macro will move files from the above folders and group them by categories based on identification strings (regular expressions)
// Any number of categories can be defined by editing/adding elements to the CAT_REGEXS array (identification REGEXs) and CAT_FOLDERS (name of the grouped files folder for that category) in the options below
// Option 1: A Name.txt file (text file containing a simple string, name specified in options below) in each condition folder can be used to store a condition name and append it to all files from that condition, in addition to the condition number
// Option 2: A Log.txt file (text file, name specified in options below) in each condition folder can be used to store parameters. They are grouped in their own folder with the condition number appended
//
// So for the above structure, the output structure will be:
//
// Experiment folder
// |
// |– Condition 1 folder (named "Experience0")
// |  |
// |  |– Name.txt (contains the string that defines the condition, such as "condition_name", will optionnally be looked for and apprended to the condition number in file names)
// |  |
// |– Condition 2 folder ("Experience1")
// |  |
// |  |– Name.txt
// |  |
// |...
// |
// |– grouped Cat 1 folder (csv)
// |
// |– C00_(condition name)_N00_locfile.csv
// |– C00_(condition name)_N01_locfile.csv
// |– ...
// |– C01_(condition name)_N00_locfile.csv
// |– C01_(condition name)_N01_locfile.csv
// |– ...
// |
// |– grouped Cat 2 folder (tif)
// |
// |– C00_(condition name)_N00_image.tif
// |– C00_(condition name)_N01_image.tif
// |– ...
// |– C01_(condition name)_N00_image.tif
// |– C01_(condition name)_N01_image.tif
// |– ...
// |
// |– grouped Log folder (optionnal)
// |
// |– C00_log.txt
// |– C01_log.txt
// |– ...
// |
// |


macro "Prepare_Abbelight_Folder" {

// Options (edit to change behavior)

	COND_ID = "Experience"; // string identifying the folders containing all files from one condition ("condition" folder) within an experiment folder
	ACQ_ID = "CellZone"; // string identifying the folders containing all files from one acquisition ("acquisition" folder) within a condition folder

	USE_NAME = false; // option to use a name txt file in each condition folder
	NAME_ID = "Name.txt"; // string identifying the file in each condition folder, file whose content defines the condition. Content of the file will be prepended to the name of the files within

	USE_LOG = true; // option to use a log file in each condition folder
	LOG_ID = "Acquisition_doc.txt"; // string identifying the log file in each condition folder
	LOG_FOLDER = "grouped_Logs"; // string defining the name of the folders that will be created containing the log files

	CAT_REGEXS = newArray(".*csv", ".*tif"); // REGEXs array identifying the file categories that will be gathered together in folders
	// These strings are regular expressions! To detect anything that ends with "tif", input ".*tif" (as ".*" means "any number of any characters")
	CAT_FOLDERS = newArray("grouped_CSV", "grouped_TIF"); // strings array defining the names of the folders that will be created containing the file categories

	MOVE_OTHERS = true; // Move files that have not been identified into a grouped folder
	OTHER_FOLDER = "grouped_Others"; // string defining the name of the folder that will be created containing the "other files"


//	Get input directory, its parent and name
	EXP_DIR = getDirectory("Select your Abbelight experiment folder");
	print("\n\n\n************ Prepare Abbelight folder started ************\n");
	print("Experiment folder: " + EXP_DIR);
	PARENT_DIR = File.getParent(EXP_DIR);
	EXP_NAME = File.getName(EXP_DIR);



//	Get experiment folder content
	EXP_CONTENT = getFileList(EXP_DIR);
	print(EXP_CONTENT.length + " elements detected in experiment folder");


// Create the optional log files folder (1 log file for each condition)
	if (USE_LOG == true) {
		LOG_DIR = EXP_DIR + LOG_FOLDER + File.separator;
		if (File.isDirectory(LOG_DIR) == false) {
			File.makeDirectory(LOG_DIR);
		}
	}

//	Create the file categories folder
	for (k = 0; k < CAT_FOLDERS.length; k++){
		CAT_DIR = EXP_DIR + CAT_FOLDERS[k] + File.separator;
		if (File.isDirectory(CAT_DIR) == false) {
			File.makeDirectory(CAT_DIR);
		}
	}

// Create the "other files" folder
	OTHER_DIR = EXP_DIR + OTHER_FOLDER + File.separator;
	if (File.isDirectory(OTHER_DIR) == false) {
		File.makeDirectory(OTHER_DIR);
	}

//	Loop on experiment folder content
//  Detect conditions folders
	COND_FOLDERS = newArray();
	ci = 0;
	for (i = 0; i < EXP_CONTENT.length; i++) {
		// This uses expandable arrays
		if (indexOf(EXP_CONTENT[i], COND_ID) > -1 && File.isDirectory(EXP_DIR + EXP_CONTENT[i])) {
			COND_FOLDERS[ci] = EXP_CONTENT[i];
			ci++;
		}
	}
	print(COND_FOLDERS.length + " conditions detected in experiment folder");

//	Loop on conditions folders
	for (c = 0; c < COND_FOLDERS.length; c++) {
		CURRENT_COND = COND_FOLDERS[c];
		print("    processing condition " + CURRENT_COND);

//		Get condition folder content
		COND_CONTENT = getFileList(EXP_DIR + CURRENT_COND);

//		Loop on condition folder content
//		Detect condition txt file
// 		Detect acquisition folders
		ACQ_FOLDERS = newArray;
		ai = 0;
		for (j = 0; j < COND_CONTENT.length; j++) {
			CURRENT_COND_FILE = COND_CONTENT[j];
			CURRENT_COND_PATH = EXP_DIR + CURRENT_COND + File.separator + CURRENT_COND_FILE;
			// If condition txt file option is used, if it is detected, open it and store its content
			COND_TEXT = "";
			if (USE_NAME == true) {
				if (indexOf(CURRENT_COND_FILE, NAME_ID) > -1) {
					COND_TEXT = File.openAsString(EXP_DIR + CURRENT_COND + CURRENT_COND_FILE);
					// Remove last character that is an end file character
					COND_TEXT = substring(COND_TEXT, 0, lengthOf(COND_TEXT)-1);
					print("    condition name detected: " + COND_TEXT);
					// Prepend an underscore for easier concatenation later
					COND_TEXT = "_" + COND_TEXT;
				}
			}
			// If log txt file option is used, if it is detected, move it to the log folder
			if (USE_LOG == true) {
				if (indexOf(CURRENT_COND_FILE, LOG_ID) > -1) {
//				Prepend the condition number to file name
				NEW_NAME = "C" + IJ.pad(c, 2) + "_" + CURRENT_COND_FILE;
//				Current file destination path
				DEST_PATH = EXP_DIR + LOG_FOLDER + File.separator + NEW_NAME;
//				Move current file to destination
				catch = File.rename(CURRENT_COND_PATH, DEST_PATH);
				}
			}
			// This uses expandable arrays
			if (indexOf(CURRENT_COND_FILE, ACQ_ID) > -1 && File.isDirectory(EXP_DIR + CURRENT_COND + CURRENT_COND_FILE)) {
				ACQ_FOLDERS[ai] = CURRENT_COND_FILE;
				ai++;
			}
		}
		print("    " + ACQ_FOLDERS.length + " acquisitions detected in condition folder");

// 		Loop on acquisition folders
		for (a = 0; a < ACQ_FOLDERS.length; a++) {
			CURRENT_ACQ = ACQ_FOLDERS[a];

			print("        processing acquisition folder " + CURRENT_ACQ);

//			Get acquisition folder content
			ACQ_CONTENT = getFileList(EXP_DIR + CURRENT_COND + CURRENT_ACQ);

//			Loop on acquisition files and move categorized files
			for (k = 0; k < ACQ_CONTENT.length; k++) {
				CURRENT_ACQ_FILE = ACQ_CONTENT[k];
				CURRENT_ACQ_PATH = EXP_DIR + CURRENT_COND + CURRENT_ACQ + CURRENT_ACQ_FILE;
//				Loop on file categories
				for (t = 0; t < CAT_REGEXS.length; t++) {
					CURRENT_CAT_ID = CAT_REGEXS[t];
					CURRENT_CAT_FOLDER = CAT_FOLDERS[t];
//					Test if current file has current categorie ID in its name
					if (matches(CURRENT_ACQ_FILE, CURRENT_CAT_ID) ==true && File.isFile(CURRENT_ACQ_PATH)) {
//						Prepend the condition number, optional condition text, and acquisition number to file name
						NEW_NAME = "C" + IJ.pad(c, 2) + COND_TEXT + "_N" + IJ.pad(a, 2) + "_" + CURRENT_ACQ_FILE;
//						Current file destination path
						DEST_PATH = EXP_DIR + CURRENT_CAT_FOLDER + File.separator + NEW_NAME;
//						Move current file to destination
						catch = File.rename(CURRENT_ACQ_PATH, DEST_PATH);
					}
				}
			}

//			If option is selected, move files remaining in acquisition folder to the "other files" folder
			if (MOVE_OTHERS == true) {

//				Get acquisition folder updated content
				ACQ_NEWCONTENT = getFileList(EXP_DIR + CURRENT_COND + CURRENT_ACQ);

				// Loop on updated content and move everything
				for (k = 0; k < ACQ_NEWCONTENT.length; k++) {
					CURRENT_ACQ_FILE = ACQ_NEWCONTENT[k];
					CURRENT_ACQ_PATH = EXP_DIR + CURRENT_COND + CURRENT_ACQ + CURRENT_ACQ_FILE;
	//				Prepend the condition number, optional condition text, and acquisition number to file name
					NEW_NAME = "C" + IJ.pad(c, 2) + COND_TEXT + "_N" + IJ.pad(a, 2) + "_" + CURRENT_ACQ_FILE;
	//				Current file destination path
					DEST_PATH = EXP_DIR + OTHER_FOLDER + File.separator + NEW_NAME;
	//				Move current file to destination
					catch = File.rename(CURRENT_ACQ_PATH, DEST_PATH);
				}
			}

//		end of loop on acquisition folders
		}
//	end of loop on conditions
	}

print("\n\n************ Prepare Abbelight folder finished ************");

//	end of macro
}
