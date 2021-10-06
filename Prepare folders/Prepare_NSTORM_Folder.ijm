// Prepare NSTORM folder macro by Christophe Leterrier
// v1.0 05-02-2017
// Test at your own peril, it moves/renames files and could delete some!

macro "Prepare_NSTORM_Folder" {

	TEMP_NAME = "temp"
	SR_SUFFIX = "SR";
	LOC_NAME = "Locs";
	ROI_NAME = "ROI";
	WF_NAME = "WF";

// Get input directory, its parent and name
	INPUT_DIR = getDirectory("Select your N-STORM acquisition folder");
	PARENT_DIR = File.getParent(INPUT_DIR);
	INPUT_NAME = File.getName(INPUT_DIR);

//	Get all file names
	ALL_NAMES = getFileList(INPUT_DIR);
//	print(ALL_NAMES.length + " files");



//	Create the temp folder
	TEMP_DIR = PARENT_DIR + File.separator + TEMP_NAME + File.separator;
	if (File.isDirectory(TEMP_DIR) == false) {
		File.makeDirectory(TEMP_DIR);
	}

//	Create the LOC folder
	LOC_DIR = TEMP_DIR + LOC_NAME + File.separator;
	if (File.isDirectory(LOC_DIR) == false) {
		File.makeDirectory(LOC_DIR);
	}

//	Create the ROI folder
	ROI_DIR = TEMP_DIR + ROI_NAME + File.separator;
	if (File.isDirectory(ROI_DIR) == false) {
		File.makeDirectory(ROI_DIR);
	}

//	Create the WF folder
	WF_DIR = TEMP_DIR + WF_NAME + File.separator;
	if (File.isDirectory(WF_DIR) == false) {
		File.makeDirectory(WF_DIR);
	}

	for (n = 0; n < ALL_NAMES.length; n++) {
//		Put loc files in TEMP_DIR/LOC folder, removing "_list.bin" snippet
		if (indexOf(ALL_NAMES[n], ".txt") > 0) {
			LOC_NAME2 = replace(ALL_NAMES[n], "_list.*.bin.txt", ".txt");
//			LOC_NAME2 = replace(ALL_NAMES[n], "_list.bin.txt", ".txt");
			LOC_PLACE1 = INPUT_DIR + ALL_NAMES[n];
			LOC_PLACE2 = LOC_DIR + LOC_NAME2;
			res = File.rename(LOC_PLACE1, LOC_PLACE2);
		}

//		Put ROI files in TEMP_DIR/ROI folder
		else if (indexOf(ALL_NAMES[n], "_ROI") > 0) {
			ROI_PLACE1 = INPUT_DIR + ALL_NAMES[n];
			ROI_PLACE2 = ROI_DIR + ALL_NAMES[n];
			res = File.rename(ROI_PLACE1, ROI_PLACE2);
		}

//		Put WF names in TEMP_DIR/WF folder
		else if (indexOf(ALL_NAMES[n], "_WF") > 0) {
			WF_PLACE1 = INPUT_DIR + ALL_NAMES[n];
			WF_PLACE2 = WF_DIR + ALL_NAMES[n];
			res = File.rename(WF_PLACE1, WF_PLACE2);
		}

	}

//	Rename INPUT_DIR with added "(SR)"
	SR_DIR = PARENT_DIR + File.separator + INPUT_NAME + " " + SR_SUFFIX + File.separator;
	res = File.rename(INPUT_DIR, SR_DIR);

//	Rename TEMP_DIR as INPUT_DIR
	res = File.rename(TEMP_DIR, INPUT_DIR);

}
