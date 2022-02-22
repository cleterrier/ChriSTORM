// F-TranslateNS2_TS.js script function by Christophe Leterrier
// Translate localizations between NSTORM5 txt and ThunderSTORM csv

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

// Parameters
// inPath: input file path
// outDir: output directory path
// ppc: photons per count (e-/ADU) (default 0.23 for Hamamtsu Fusion on NSTORM5)
// UseXYDriftCor: use drift-corrected XY coordinates
// UseWarped: use warped (chromatic aberration corrected) XYZ coordinates
// UseZDriftCor: use drift-corrected Z coordinates
// factZ: generate Z uncertainty by multiplying XY uncertinaty by this factor
// XCorr: compensate distortion from the 3D astigmatic lens (default for NSTORM5 X = 0.955 * Y)

function TranslateNS2TS(inPath, outDir, outFormat, ppc, UseXYDriftCor, UseWarped, UseZDriftCor, factZ, XCorr){

	// Separators
	var inSep = "\t"; // input separator
	var sep = ","; // output separator

	// Factor to convert sigma into FWHM
	var FWHM = 2.355;

	// Sampling of first lines to detect 2D or 3D files
	var SampleMax = 100;

	// Fields of the input header
	// STORM v1
	//var inHeaderList = ["Channel Name","X","Y","Xc","Yc","Height","Area","Width","Phi","Ax","BG","I","Frame","Length","Link","Valid","Z","Zc","Photons","Lateral Localization Accuracy","Xw","Yw","Xwc","Ywc","Zw","Zwc"];
	// STORM v5
	var inHeaderList = ["ID", "X","Y","Z","Lateral Localization Accuracy","Channel","Frame","Color","I","Width","BG","Length","Height","Area","Phi","Axis Ratio","Valid","Link","Xc","Yc","Zc","Xw","Yw","Zw","Xwc","Ywc","Zwc"];

	// Define index in input header for XYZ coordinates to use depending on options (drift, warping)
	if (UseXYDriftCor == true) {
		if (UseWarped == (true)) {
			iX = 24;
			iY = 25;
		}
		else {
			iX = 18;
			iY = 19;
		}

	}
	else {
		if (UseWarped == (true)) {
			iX = 21;
			iY = 22;
		}
		else {
			iX = 1;
			iY = 2;
		}
	}
	if (UseZDriftCor == true) {
		if (UseWarped == (true)) {
			iZ = 26;
		}
		else {
			iZ = 20;
		}
	}
	else {
		if (UseWarped == (true)) {
			iZ = 23;
		}
		else {
			iZ = 3;
		}
	}

	// Correspondance
	/*
	2D case:
	frame = Frame [6]
	x [nm] = X [1] or Xc [18] or Xw [21] or Xwc [24]
	y [nm] = Y [2] or Yc [19] or Yw [22] or Ywc [25]
	sigma [nm] calculated from Width [9]
	intensity [photon] = Area [13] * ppc
	uncertainty_xy[nm] = Lateral Localization Accuracy [4]
	detections = length [11]

	3D case, add:
	sigma1 [nm] and sigma2 [nm] calculated from Width [9] and Axis Ratio [15]
	z [nm] = Z [3] or Zc [20] or Zw [23] or Zwc [26]
	uncertainty_z [nm] = calculated from Lateral Localization Accuracy [4]
	*/

	// Define input files, folder, open input file
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header line and find index of Z, intensity, background and x coordinate columns
	var inHeader = br.readLine();
	//IJ.log("inHeader: " + inHeader);
	var inHeaderArray = inHeader.split(inSep);

	// Get the indexes of the columns needed in input file from its header
	var fIndex = arrayFind(inHeaderArray, inHeaderList[6]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[iX]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[iY]);
	var zIndex = arrayFind(inHeaderArray, inHeaderList[iZ]);
	var sigIndex = arrayFind(inHeaderArray, inHeaderList[9]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[13]);
	var unxyIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var detIndex = arrayFind(inHeaderArray, inHeaderList[11]);

	// Taste the first line to detect if 2D (all Z =0) or 3D
	inLine = br.readLine();
	var inCells = inLine.split(inSep);
	var zAccu = 0;
	var i = 0;
	while ((inLine = br.readLine()) != null && i < SampleMax) {
		i++;
		inCells = inLine.split(inSep);
		zAccu = zAccu + parseFloat(inCells[zIndex]);
	}
	// Close and reopen to get back at line 0
	br.close();
	br = new BufferedReader(new FileReader(inFile));
	// Pass header line
	inLine = br.readLine();

	// Switch between 2D and 3D cases based on the value of zAccu
	if (zAccu == 0) {
		IJ.log("      2D file detected");
		var is3D = false;
		Xcorr = 1; // only correct X coordinates for 3D case
		// Define output header and suffix
		var outHeaderList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"sigma [nm]\"","\"intensity [photon]\"","\"uncertainty_xy [nm]\"", "\"detections\""];
		var outSuffix = "_TS2D";
	}

	else {
		IJ.log("      3D file detected");
		var is3D = true;
		// Define output header and suffix
		var outHeaderList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"sigma1 [nm]\"","\"sigma2 [nm]\"","\"intensity [photon]\"","\"uncertainty_xy [nm]\"", "\"uncertainty_z [nm]\"", "\"detections\""];
		var outSuffix = "_TS3D";
		// Define indexes for additional input fields
		var aIndex = arrayFind(inHeaderArray, inHeaderList[15]);
	}

	// Generate output name and path, open file writer
	var outName = inName.replace("." + inNameExt[1], outSuffix + ".csv");
	var outPath = outDir + outName;
	var outFile = new File(outPath);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	var bw = new BufferedWriter(new FileWriter(outFile));

	IJ.log("      outName: " + outName);

	// Write the header
	var outHeader = makeLineFromArray(outHeaderList, sep);
	bw.write(outHeader);
	bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		// Processing of individual values from input file lines, split by inSep
		var inCells = inLine.split(inSep);

		// Get values for 2D fields
		var fOut = inCells[fIndex];
		var xOut = (parseFloat(inCells[xIndex]) * XCorr).toFixed(1);
		var yOut = (parseFloat(inCells[yIndex])).toFixed(1);
		var sigOut = (parseFloat(inCells[sigIndex]) / 2).toFixed(1);
		var intOut = (parseFloat(inCells[intIndex]) * ppc).toFixed(0);
		var unxyOut = (parseFloat(inCells[unxyIndex])).toFixed(1);
		var detOut = (parseFloat(inCells[detIndex])).toFixed(0);

		if (is3D == true) {
			// Get values for 3D fields
			var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
			var ax = (parseFloat(inCells[aIndex]));
			var sig1Out = (sigOut / Math.sqrt(1 + ax * ax)).toFixed(1);
			var sig2Out = (sigOut / Math.sqrt(1 + 1 / (ax * ax))).toFixed(1);
			var unzOut = (factZ * unxyOut).toFixed(1);
		}

		// Assemble output line
		if (is3D == false) {
			var outLineArray = [fOut, xOut, yOut,sigOut, intOut, unxyOut, detOut];
		}
		else {
			var outLineArray = [fOut, xOut, yOut, zOut, sig1Out, sig2Out, intOut, unxyOut, unzOut, detOut];
		}
		var outLine = makeLineFromArray(outLineArray, sep);

		// Write new line
		bw.write(outLine);
		bw.newLine();
	}
	br.close();
	bw.close();
}


function getExt(filestring){
	var namearray = filestring.split(".");
	var shortname = "";
	for (var f = 0; f < namearray.length - 1; f++) {
		shortname = shortname + namearray[f];
	}
	return [shortname, namearray[namearray.length - 1]];
}


function arrayFind(a, s){
	for (var i = 0; i < a.length; i++) {
		testS = a[i];
		if (testS.indexOf(s)>-1 && testS.indexOf(s)<3) return i;
	}
	return -1;
}

function makeLineFromArray(ar, se) {
	ol = "" + ar[0];
	for (t = 1; t < ar.length; t++) {
		ol = ol + se + ar[t];
	}
	return ol;
}
