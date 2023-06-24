macro "Workflow" {
	// Save Settings

	saveSettings();

	// Initialize variables
	MODES = newArray("STORM (intensity 700-50000 det<5)", "PAINT (intensity 800-200000 det<50)", "Custom");
	MODE_DEF = "Custom";
	SEQ_DEF = false;
	USE_DRIFT_DEF = true;
	XCORR_DEF = 1.01615; // for NSTORM#1, 0.955 for NSTORM#2
	BATCH_PROC_DEF = true;
	EXCL_STRING_DEF = "_ZR_";
	CORR_DRIFT_DEF = true;
	EXP_STRING_DEF = "intensity>700 & intensity<50000 & detections<5";
	REC_2D_DEF = true;
	REC_3D_DEF = true;
	CAM_SIZE_DEF = 160;
	SR_SIZE_DEF = 16;
	GAUSS_DEF = 0;
	LUTS = newArray("Rainbow RGB", "Jet", "Turbo", "ametrine", "ThunderSTORM", "ZOLA", "3color-RMB", "3color-CGY", "2C Cyan-Green", "2C Yellow-Red", "2C Green-Cyan", "2C Red-Yellow");
	LUT_DEF = "ZOLANDER";;

	// Get input directory (Locs text files from N-STORM)
	inputDir = getDirectory("Choose a Locs directory");
	inputDirF = escapePath(inputDir); // Windows case, necessary to escape paths input to scripts
	plugin_path = getDirectory("imagej") + "scripts";

	//Creation of the dialog box
	Dialog.create("Workflow options");
	Dialog.addMessage("Translate localizations options");
	Dialog.addCheckbox("Sequential PAINT channels import", SEQ_DEF);
	Dialog.addCheckbox("Use drift-corrected coordinates", USE_DRIFT_DEF);
	Dialog.addNumber("Astigmatic compression correction (1 for none)", XCORR_DEF, 5, 7, "");
	Dialog.addMessage("(3D only, 1.01615 for NSTORM#1, 0.955 for NSTORM#2)");
	Dialog.addMessage("Process localizations options");
	Dialog.addCheckbox("Batch process localizations", BATCH_PROC_DEF);
	Dialog.addString("Exclude name containing", EXCL_STRING_DEF);
	Dialog.addCheckbox("Additional drift correction", CORR_DRIFT_DEF);
	Dialog.addChoice("Preset filtering string", MODES, MODE_DEF);
	Dialog.addString("Custom filter string", EXP_STRING_DEF, 30);
	Dialog.addMessage("Reconstructions options");
	Dialog.addCheckbox("2D reconstructions", REC_2D_DEF);
	Dialog.addCheckbox("3D reconstructions", REC_3D_DEF);
	Dialog.addNumber("Camera pixel size", CAM_SIZE_DEF, 0, 3, "nm");
	Dialog.addNumber("SR pixel size", SR_SIZE_DEF, 0, 3, "nm");
	Dialog.addNumber("Gaussian filter", GAUSS_DEF, 0, 3, "nm");
	Dialog.addChoice("3D LUT", LUTS, LUT_DEF);


	Dialog.show();

	// Feeding variables from dialog choices
	SEQ = Dialog.getCheckbox();
	USE_DRIFT = Dialog.getCheckbox();
	NStoTS_xcorr = Dialog.getNumber();
	BATCH_PROC = Dialog.getCheckbox();
	EXCL_STRING = Dialog.getString();
	if (lengthOf(EXCL_STRING)>0) EXCL = true;
	else EXCL = false;
	CORR_DRIFT = Dialog.getCheckbox();
	MODE = Dialog.getChoice();
	EXP_STRING = Dialog.getString();
	if (lengthOf(EXP_STRING)>0) EXP_FILT = true;
	else EXP_FILT = false;
	REC_2D = Dialog.getCheckbox();
	REC_3D = Dialog.getCheckbox();
	CAM_SIZE = Dialog.getNumber();
	SR_SIZE = Dialog.getNumber();
	GAUSS = Dialog.getNumber();
	Z_LUT = Dialog.getChoice();

	if (MODE == "STORM (intensity 700-50000 det<5)") {
		EXP_STRING = "intensity>700 & intensity<50000 & detections<5";
	}

	if (MODE == "PAINT (intensity 800-200000 det<50)") {
		EXP_STRING = "intensity>800 & intensity<200000 & detections<50";
	}


	// Batch_NS_Into_TS script arguments
//	NStoTS_ppc = 0.1248; // case for Andor EMCCD
//	NStoTS_ppc = 0.23; // case for Hamamatsu sCMOS
	NStoTS_seq = SEQ;
	NStoTS_xydrift = USE_DRIFT;
	NStoTS_warp = true;
	NStoTS_zdrift = true;
	NStoTS_zfactor = 2;
//	NStoTS_xcorr = 1.01615;

	// Batch_Process_Locs macro arguments
	// File chooser
	CHOOSE = false;
	CHOOSE_STRING = "";
//	EXCL = true;
//	EXCL_STRING = "_ZR_";
	// Drift correction
//	CORR_DRIFT = true;
	BIN = 12; // number of frames per sub-reconstruction used for autocorrelation
	MAG = 5; //  pixel size of sub-reconstructions used for autocorrelation
	SM = 0.6; // smoothing factor for autocorrelation
	// Merging
	MERGE = false;
	DIST = 160;
	MAXF = 0;
	OFF = 0;
	// Photon filter
	PHOT_FILT = false;
	PHOT_MIN = 700;
	PHOT_MAX = 15000;
	// Expression-based filter
//	EXP_FILT = true;
//	EXP_STRING = "intensity>700 & intensity<30000 & detections<5"; // for STORM
//	EXP_STRING = "intensity>1500 & intensity<500000 & detections<500"; // for PAINT
	// Density filter
	DENS_FILT = false;
	DENS_RAD = 100;
	DENS_NUMB = 2;
	DENS_DIM = "2D";

	// Generate_Reconstructions macro arguments
	//CAM_SIZE = 160;
	REC_METH = "Normalized Gaussian"; 
	//SR_SIZE = 16;
	XMIN = 0;
	YMIN = 0;
	XWIDTH = 256;
	YWIDTH = 256;
	XY_AUTO = false;
	XY_ZERO = true;
	XY_ORI = false;
	XY_UN = 0;
	P3D = false;
	Z_SPACE = 20;
	Z_MIN = -400;
	Z_MAX = 400;
	Z_AUTO = true;
	Z_SATDO = 50;
	Z_SATUP = 50;
	Z_UN = 0;
	Z_PROJ = "Sum (32-bit or color)";
	Z_COLOR = true;
	//Z_LUT = "ZOLANDER";
	FILT = false;
	FILT_RAD = 50;
	FILT_NUMB = 5;
	FILT_DIM = "2D";
	//GAUSS = 0;
	GAUSS_MULT = 1;
	UNS_SIZE = 0;
	UNS_WEIGHT = 0.3;
	UNS_MULT = 1;
	GAM = 1;
	AD_CONT = true;
	SAT_LEV = 0.1;

	


	// NS to TS
	NStoTS_path = plugin_path + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Process locs files (batch)" + File.separator+ "Batch_NS_Into_TS.js";
	NStoTS_args = "" + inputDirF + "," + NStoTS_seq  + "," + NStoTS_xydrift + "," + NStoTS_warp + "," + NStoTS_zdrift + "," + NStoTS_zfactor + "," + NStoTS_xcorr;
	out_path = runMacro(NStoTS_path, NStoTS_args);


	// Optional Batch Proc
	if (BATCH_PROC == true) {
		BatchProc_path = plugin_path + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Process locs files (batch)" + File.separator+ "Batch_Process_Locs.ijm";
		BatchProc_args = out_path + "," + CHOOSE + "," + CHOOSE_STRING + "," + EXCL + "," + EXCL_STRING + "," + CORR_DRIFT + "," + BIN + "," + MAG + "," + SM + "," + MERGE + "," + DIST + "," + MAXF + "," + OFF + "," + PHOT_FILT + "," + PHOT_MIN + "," + PHOT_MAX + "," + EXP_FILT + "," + EXP_STRING + "," + DENS_FILT + "," + DENS_RAD + "," + DENS_NUMB + "," + DENS_DIM;
		out_path = runMacro(BatchProc_path, BatchProc_args);
	}


	// Generate Recs (2D)
	if (REC_2D == true) {
		Gen_Recon_path = plugin_path + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Reconstruct Images (batch)" + File.separator+ "Generate_Reconstructions.ijm";
		Gen_Recon_args = out_path + "," + CAM_SIZE + ","+ REC_METH + "," + SR_SIZE + "," + XMIN + "," + YMIN + "," + XWIDTH + "," + YWIDTH + "," + XY_AUTO + ","  + XY_ZERO + "," + XY_ORI + "," + XY_UN + "," + P3D + "," + Z_SPACE + "," + Z_MIN + "," + Z_MAX + "," + Z_AUTO + "," + Z_NAME + "," + Z_SATDO + "," + Z_SATUP + "," + Z_UN + "," + Z_PROJ + "," + Z_COLOR + "," + Z_LUT + "," +  FILT + "," + FILT_RAD + "," + FILT_NUMB + "," + FILT_DIM + "," + GAUSS + "," + GAUSS_MULT + "," + UNS_SIZE + "," + UNS_WEIGHT + "," + UNS_MULT + "," + GAM + "," + AD_CONT + "," + SAT_LEV;
		out_path2 = runMacro(Gen_Recon_path, Gen_Recon_args);
	}

	// Optional Generate Recs (Zc)
	if (REC_3D == true) {
		P3D = true;
		Gen_Recon_args = out_path + "," + CAM_SIZE + ","+ REC_METH  + "," + SR_SIZE + "," + XMIN + "," + YMIN + "," + XWIDTH + "," + YWIDTH + "," + XY_AUTO + ","  + XY_ZERO + "," + XY_ORI + "," + XY_UN + "," + P3D + "," + Z_SPACE + "," + Z_MIN + "," + Z_MAX + "," + Z_AUTO + "," + Z_SATDO + "," + Z_SATUP + "," + Z_UN + "," + Z_COLOR + "," + Z_LUT + "," + GAUSS + "," + GAUSS_MULT + "," + UNS_SIZE + "," + UNS_WEIGHT + "," + UNS_MULT + "," + GAM + ","  + to16 + "," + AD_CONT + "," + SAT_LEV;
		out_path2 = runMacro(Gen_Recon_path, Gen_Recon_args);
	}

}

function escapePath(p) {
	if (indexOf(p, "\\") > 0) {
		pE = split(p, "\\");
		pF = ""+ pE[0] + "\\" + "\\";
		for (i = 1; i < pE.length; i++) {
			pF = pF + pE[i] + "\\" + "\\";
		}
	}
	else {
		pF = p;
	}
	print(pF);
	return pF;
}
