// F-TSTranslate.js script function by Christophe Leterrier
// Translate ThunderSTORM localization file into VISP file, either 2D or 3D + uncertainty
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

function TSTranslate(inPath, outDir, outFormat) {
	
	// Factor to convert sigma into FWHM
	var FWHM = 2.355;
	var SampleMax = 100;
	var inSep = ",";

	// Define input file path
	var inFile = new File(inPath); 
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	IJ.log("    inName: " + inName);

	// Open input File reader
	var br = new BufferedReader(new FileReader(inFile));

	// get Labels and indexes
	var inHeader = br.readLine();
	var inLabels = inHeader.split(inSep);	

	iX = getStringIndex(inLabels, "x [nm]");
	iY = getStringIndex(inLabels, "y [nm]");
	iZ = getStringIndex(inLabels, "z [nm]");

	iDx = getStringIndex(inLabels, "uncertainty_xy [nm]");
	iDz = getStringIndex(inLabels, "uncertainty_z [nm]");

	iF = getStringIndex(inLabels, "frame");
	iI = getStringIndex(inLabels, "intensity [photon]");
	
	// IJ.log("iX:" + iX + " iY:" + iY + " iZ:" + iZ + " iDx:" + iDx + " iDz:" + " iF:" + iF + " iI:" + iI); 

	var zAccu = 0;
	if (iZ > 0) {
		// Taste the 2 to SampleMax lines to detect if 2D (all Z =0) or 3D	
		var i = 1;	
		while ((inLine = br.readLine()) != null && i < SampleMax) {
			i++;
			inCells = inLine.split(inSep);
			zAccu = zAccu + (parseFloat(inCells[iZ])).toFixed(0);
		}
	}
	if (i>10 && zAccu == 0) {
		IJ.log("      2D file detected");
		is3D = false;
	}
	else {
		IJ.log("      3D file detected");
		is3D = true;
	}

	// Close and reopen to get back at line 0
	br.close();
	br = new BufferedReader(new FileReader(inFile));
	// Pass header line
	inLine = br.readLine();

	// VISP format
	if (outFormat == "VISP") {
		var includeHeader = false;
		var outHeader = "";	
		var sep = "\t";
		var outSuffix = "";
		if (is3D == false){ // 2D case
			var outExt = ".2dlp";
		}
		else { // 3D case
			var outExt = ".3dlp";
		}
	}

	// Prepare output file path
	var outName = inName.substring(0, inName.length()-4) + outSuffix + outExt;
	var outPath = outDir + outName;
	var outFile = new File(outPath);
	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	IJ.log("      outName: " + outName);

	// Open output File writer
	var bw = new BufferedWriter(new FileWriter(outFile));	
	// Write new Header
	if (includeHeader == true) {
		var outLine = makeLineFromArray(outHeader, sep);
		bw.write(outLine);
		bw.newLine();
	}

	// Write the output file line by line
	var m = 0;
	while ((inLine = br.readLine()) != null) {

			m++;
			var inCells = inLine.split(inSep);

			// ThunderSTORM format
			if (outFormat == "VISP") {

				FDx = (parseFloat(inCells[iDx]) * FWHM).toFixed(2);
	
				// Build results line
				if (is3D == false){ // 2D case
					outLine = inCells[iX] + sep + inCells[iY] + sep + FDx + sep + FDx + sep + inCells[iI] + sep + inCells[iF]; 
				}
				else { // 3D case
					FDz = (parseFloat(inCells[iDz]) * FWHM).toFixed(2);
					outLine = inCells[iX] + sep + inCells[iY] + sep + inCells[iZ] + sep + FDx + sep + FDx + sep + FDz + sep + inCells[iI] + sep + inCells[iF]; 
				}
					
			}
			bw.write(outLine);
			bw.newLine();
		}	 
	br.close();
	bw.close();
}


function makeLineFromArray(ar, se) {
	ol = "" + ar[0];
	for (var t = 1; t < ar.length; t++) {
		ol = ol + se + ar[t];
	}
	return ol;
}

function getStringIndex(ar, st) {
	for (var f = 0; f < ar.length; f++) {
		if (ar[f] == st || ar[f] == ("\"" + st + "\"")) return f;
	}
	return -1;
}

function getExt(filestring){
	var namearray = filestring.split(".");
	var shortname = "";
	for (var f = 0; f < namearray.length - 1; f++) {
		shortname = shortname + namearray[f];
	}
	return [shortname, namearray[namearray.length - 1]];
}