// F-TS_Phasor_to_TS.js script function by Christophe Leterrier
// adds uncertainties in xy (from Mortensen MLE formula using given sigma) and z (proportional to uncertainty in xy) to a phasor thunderSTORM localization csv file
// also corrects distortion in X from 3D cylindrical lens
// 28/12/2017

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

// Parameters
// inPath input file path
// outDir output directory path
// pxSize acquired sequence pixel size in nm
// sigma PSF SD in nm
// xFactor dilatation in X to compensate cylindrical lens (measured on microscope)
// zFactor factor for uncertainty in Z from uncertainty in XY

function PhasorTS(inPath, outDir, pxSize, sigma, xFactor, zFactor) {

	// separators (csv files)
	var inSep = ",";
	var sep = ",";

	var zHeader = "\"z [nm]\"";
	var iHeader = "\"intensity [photon]\"";
	var bHeader = "\"bkgstd [photon]\"";
	var xHeader = "\"x [nm]\"";
	var dHeader = "\"detections\"";

	// Define input files, folder, open it etc.
	var inFile = new File(inPath); 
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	
	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header line and find index of Z, intensity, background and x coordinate columns
	var inHLine = br.readLine();	
	var inHeader = inHLine.split(inSep);	
	
	var zIndex = arrayFind(inHeader, zHeader);
	var iIndex = arrayFind(inHeader, iHeader);
	var bIndex = arrayFind(inHeader, bHeader);
	var xIndex = arrayFind(inHeader, xHeader);

	// Generate output name and path, open file writer
	var outName = inName.replace("TS3D", "unc_TS3D");
	if (outName == inName) outName = inNameExt[0] + "_unc." + inNameExt[1];
	var outPath = outDir + outName;
	var outFile = new File(outPath);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	var bw = new BufferedWriter(new FileWriter(outFile));

	IJ.log("      outName: " + outName);

	// New header
	var xyUncHeader = "uncertainty_xy [nm]";
	var zUncHeader = "uncertainty_z [nm]";
	var outHLine = inHLine + sep + xyUncHeader + sep + zUncHeader;	
	
	bw.write(outHeader);
		bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		var inCells = inLine.split(inSep);
		
		// correct distortion in X coordinate
		var X = Double.parseDouble(inCells[xIndex]);
		var xC= X * xFactor;
		var xCS = xC.toFixed(1);
		inCells[xIndex] = xCS;
		
		// Calculate uncertainty using the modified Mortensen equation
		var pxsq = pxSize * pxSize;
		var intensity = inCells[iIndex];
		var isq = intensity * intensity;
		var sigsq = sigma * sigma;
		var bgd = Double.parseDouble(inCells[bIndex]);
		if (dHeader > 0) var det = Double.parseDouble(inCells[dHeader]);
		 else det = 1;

		var vsig = (sigsq + pxsq / 12) / intensity;
		var vbgd = (8 * 3.142 * sigsq * sigsq * bgd * det) / (pxsq * isq);

		var xyUnc = Math.sqrt(vsig + vbgd);
		var xyUncS = xyUnc.toFixed(1);
		var zUnc = xyUnc * zFactor;
		var zUncS = zUnc.toFixed(1);
		 
		// Write new line
		outLine = "";
		for (i = 0; i < inCells.length; i++) outLine = outLine + inCells[i] + sep;

		// Add uncertainties
		outLine = outLine + xyUncS + sep + zUncS;

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
	index = -1;
	for (var i = 0; i < a.length; i++) {
		if (a[i] == s) index = i;	
	}
	return index;
}
