macro "Slice Colorize" {

CLAHE = true;
CLAHE_MAX = 2;
AD_CONT = true;
SAT_LEV = 0.3;

COLOR = true;
COLOR_LUT = "ZOLA";
COLOR_MIN = 1;
COLOR_MAX = 255;

// Coordinate of image top in nm (for Z slices)
Z_TOP_NM = 650;
// Top and bottom for colorization
C_TOP_NM = 650;
C_BOTTOM_NM = -500;

	setBatchMode(true);
	imgID = getImageID();

	selectImage(imgID);
	getDimensions(iw, ih, ich, isl, ifr);
	getVoxelSize(pw, ph, zs, pu);

	// Calculate zero position
	pw_NM = pw * 1000;
	ih_NM = ih * pw_NM;
	Z_BOTTOM_NM = Z_TOP_NM - ih_NM;
	Z_ZERO_PX = Z_TOP_NM / pw_NM;

	//print(Z_TOP_NM);
	//print(Z_BOTTOM_NM);
	//print(Z_ZERO_PX);
	
	run("Duplicate...", "title=Processed duplicate");
	procID = getImageID();


	// CLAHE
	if (CLAHE == true) {
		selectImage(procID);
		for (s = 1; s <= isl; s++) {
			showProgress(s / isl);
			setSlice(s);
			run("Enhance Local Contrast (CLAHE)", "blocksize=127 histogram=256 maximum=" + CLAHE_MAX + " mask=*None* fast_(less_accurate)");
		}
	setSlice(1);
	}

	// Enhance contrast
	if (AD_CONT == true) {
		selectImage(procID);
		run("Enhance Contrast...", "saturated=" + SAT_LEV + " normalize process_all use");
		setMinAndMax(0, 1);
	}

	// Colorize
	if (COLOR == true) {

		// Calculate color top, bottom and height in pixels
		C_BOTTOM_PX = Z_ZERO_PX - (C_BOTTOM_NM / pw_NM);
		C_TOP_PX = Z_ZERO_PX - (C_TOP_NM / pw_NM);
		C_H_PX = C_BOTTOM_PX - C_TOP_PX;

		//print(C_TOP_PX);
		//print(C_BOTTOM_PX);
		//print(C_H_PX);

		// Calculate LUT max on a 0-1 32-bit scale
		COLOR_MIN_32 = COLOR_MIN / 256;
		COLOR_MAX_32 = COLOR_MAX / 256;

		// Make an RGB version of the input image
		selectImage(procID);
		run("Duplicate...", "title=Colorized duplicate");		
		run("RGB Color");
		outsID = getImageID();

		// Make a colored image with the LUT
		newImage("L", "32-bit ramp", round(C_H_PX), iw, 1);
		
		// Rescale between LUT min and max values
		COLOR_FACTOR = COLOR_MAX_32 - COLOR_MIN_32;
		run("Multiply...", "value=" + COLOR_FACTOR);
		run("Add...", "value=" + COLOR_MIN_32);
			
		// Add distance to the left and right to complete to source image height with intensities 0 and 1
		wBex = C_H_PX + (ih - C_BOTTOM_PX);
		wB = round(wBex);
 		if (wB > round(C_H_PX)) {
 			run("Canvas Size...", "width=" + wB + " height=" + iw + " position=Center-Right zero");
 			makeRectangle(0, 0, round(ih - C_BOTTOM_PX), iw);
			run("Set...", "value=" + COLOR_MIN_32);
			run("Select None");
 		}
		if (wB < ih) {
			run("Canvas Size...", "width=" + ih + " height=" + iw + " position=Center-Left zero");
			makeRectangle(wB, 0, ih-wB, iw);
			run("Set...", "value=" + COLOR_MAX_32);
			run("Select None");
		}	
		run(COLOR_LUT);	
		run("Rotate 90 Degrees Left");
		run("RGB Color");
		run("RGB Stack");
		lutID = getImageID();


	
		for (s = 1; s <= isl; s++) {

			// Progress Bar
			showProgress(s / isl);
	
			selectImage(procID);
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

	}

	setBatchMode("exit and display");

}
