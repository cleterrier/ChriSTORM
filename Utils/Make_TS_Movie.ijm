macro "Make TS Movie" {

	print("\n\n\nMake TS Movie started");

	inPath = File.openDialog("Choose a ThunderSTORM locs file (.csv)");
	inName = File.getName(inPath);
	inShort = stripExtension(inName);

	camsize_def = 160; //  camera pixel size in nm
	packet_def = 1000; // packets of frames for reconstruction
	step_def = 1000; // steps between frames for reconstruction (should be equal to packet to get all locs)
	mag_def = 10; // magnification of the SR image
	force_def = false; // force lateral uncertainty when doing reconstruction
	unc_def = 160; // forced uncertainty in nm (~ PSF SD to simulate acquisition sequence)
	accu_def = true;

	Dialog.create("Make TS Movie: options");
	Dialog.addNumber("Camera pixel size:", camsize_def, 0, 5, "nm");
	Dialog.addMessage("Warning: check that camera pixel size is also set in TS Camera Setup");
	Dialog.addNumber("Group frames by packets of:", packet_def, 0, 5, "frames");
	Dialog.addNumber("Process frame packet every:", step_def, 0, 5, "frames");
	Dialog.addNumber("Magnification of SR image:", mag_def, 0, 5, "X");
	Dialog.addCheckbox("Force localization uncertainty", force_def);
	Dialog.addNumber("Force localization uncertainty to:", unc_def, 0, 5, "nm");
	Dialog.addCheckbox("Cumulative SR image", accu_def);
	Dialog.show();
	camsize = Dialog.getNumber();
	packet = Dialog.getNumber();
	step = Dialog.getNumber();
	mag = Dialog.getNumber();
	force = Dialog.getCheckbox();
	unc = Dialog.getNumber();
	accu = Dialog.getCheckbox();

	SRpx = floor(camsize / mag);
	outSuffix = "";
	if (accu == true) outSuffix += " accu";
	if (force == true) outSuffix += " forced";

	outDir = File.getParent(inPath);
	outDir = outDir + File.separator + "Rec frames" + outSuffix + File.separator;
	if (File.isDirectory(outDir) == false) {
		File.makeDirectory(outDir);
	}

	print("input path: " + inPath);
	print("input file name: " + inName);
	print("input file short name: " + inShort);
	print("output folder: " + outDir);

	print("\n");
	print("camera pixel size: " + camsize + " nm");
	print("frame packet size: " + packet + " frames");
	print("frame step size: " + step + " frames");
	print("SR reconstruction magnification: " + mag + "X leading to a " + SRpx + " nm pixel size" );

	print("\n");
	print("Opening " + inName);
	run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + inPath + "] livepreview=false fileformat=[CSV (comma separated)]");

	frames = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colf = rt.findColumn(\"frame\"); var minf = parseInt(rt.getValue(0, colf)); var maxf = minf; for (var row = 1; row < rows; row++) {var val = parseInt(rt.getValue(row, colf)); if (val > maxf) maxf = val} frames = maxf;");
	frames = parseInt(frames);

	XMinMaxString = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colz = rt.findColumn(\"x\"); var minz = rt.getValue(0, colz); var maxz = minz; for (var row = 1; row < rows; row++) {var val = rt.getValue(row, colz); if (val > maxz) maxz = val; else if (val < minz) minz = val;} ZMinMaxString = \"\" + minz + \",\" +  maxz;");
	XMinMax = split(XMinMaxString, ",");
	Xmini = parseFloat(XMinMax[0]);
	Xmaxi = parseFloat(XMinMax[1]);
	YMinMaxString = eval("script", "importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable); var rt = IJResultsTable.getResultsTable(); var rows = rt.getRowCount(); var colz = rt.findColumn(\"y\"); var minz = rt.getValue(0, colz); var maxz = minz; for (var row = 1; row < rows; row++) {var val = rt.getValue(row, colz); if (val > maxz) maxz = val; else if (val < minz) minz = val;} ZMinMaxString = \"\" + minz + \",\" +  maxz;");
	YMinMax = split(YMinMaxString, ",");
	Ymini = parseFloat(YMinMax[0]);
	Ymaxi = parseFloat(YMinMax[1]);

	Xw = Xmaxi - Xmini;
	Yh = Ymaxi - Ymini;

	XminiPX = floor(Xmini / camsize);
	YminiPX = floor(Ymini / camsize);
	XwPX = floor(Xw / camsize) + 1;
	YhPX = floor(Yh / camsize) + 1;

	print("number of frames detected: " + frames + " frames");
	print("Rec Xmin detected: " + XminiPX + " pixels");
	print("Rec Ymin detected: " + YminiPX + " pixels");
	print("Rec Width detected: " + XwPX + " pixels");
	print("Rec Height detected: " + YhPX + " pixels");

	fmax = floor(frames / step);

	for (f = 0; f < fmax; f++) {
		kmin = step * f;
		kminS = toString(kmin);
		kmax = kmin + packet + 1;
		kmaxS = toString(kmax);

		if (accu == true) kminS = 0;
		filterS = "frame>" + kminS + " & frame<" + kmaxS;

		run("Show results table", "action=filter formula=[" + filterS + "]");
		if (force == false) run("Visualization",  "imleft=" + XminiPX + " imtop=" + YminiPX + " imwidth=" + XwPX + " imheight=" + YhPX + " renderer=[Normalized Gaussian] dxforce=false pickedlut=[Rainbow RGB] magnification=" + mag + " colorize=true dx=5.0 threed=false dzforce=false");
		else run("Visualization",  "imleft=" + XminiPX + " imtop=" + YminiPX + " imwidth=" + XwPX + " imheight=" + YhPX + " renderer=[Normalized Gaussian] dxforce=true dx=" + unc + " pickedlut=[Rainbow RGB] magnification=" + mag + " colorize=true dx=5.0 threed=false dzforce=false");

		outName = inShort + "(" + IJ.pad(kminS, 5) + "-" + IJ.pad(kmaxS, 5) + ").tif";
		save(outDir + outName);
		close();
	}


	run("Show results table", "action=reset");

}

function stripExtension(str) {
	nameArray = split(str, ".");
	shortname = "";
	for (i = 0; i < nameArray.length - 1; i++) {
		shortname += nameArray[i];
	}
	return shortname;
}
