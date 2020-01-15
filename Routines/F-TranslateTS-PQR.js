// F-TSTranslate-PQR.js script function by Christophe Leterrier
// Translate ThunderSTORM localization file into PDB-PQR file with 3D + uncertainty
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

function TSTranslatePQR(inPath, outDir, fU) {

	// Factor to convert sigma into FWHM
	var FWHM = 2.355;
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

	// QPR format

	var includeHeader = true;
	var outHeader = "COMPND    " + inName.substring(0, inName.length()-4);
	var sep = " ";
	var outSuffix = "";
	var outExt = ".pqr";


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
		bw.write(outHeader);
		bw.newLine();
	}

	// Write the output file line by line
	var m = 0;
	while ((inLine = br.readLine()) != null) {

		m++;

		var inCells = inLine.split(inSep);

		var outId = padSpaces("" + m, 5); // right-justified, 5 char width
		var outChannel = " H  "; // 1 spcae, H, 2 spaces
		var outChain = "HEM";
		var outChainId = "A";
		var outRes = "   1     "; // 3 spaces, 1, 5 spaces
		var inX = "" + parseFloat(inCells[iX]).toFixed(1);
		var outX = padSpaces(inX, 7); // right-justified, 7 char width
		var inY = "" + parseFloat(inCells[iY]).toFixed(1);
		var outY = padSpaces(inY, 7); // right-justified, 7 char width
		var inZ = "" + parseFloat(inCells[iZ]).toFixed(0);
		var outZ = padSpaces(inZ, 3) + ".0"; // right justified, 3 char width + ".0"
		var outF = padSpaces(inCells[iF], 5);
		
		if (fU == 0) {
			var Dx = "" + (parseFloat(inCells[iDx]) * FWHM).toFixed(2);
			var outDx = padSpaces(Dx, 5);
		}
		else {
			var Dx = "" + (parseFloat(fU) * FWHM).toFixed(2);
			var outDx = padSpaces(Dx, 5);
		}

		if (inZ <= -100) var zspacer = " ";
		else var zspacer = "  ";

		outLine = "HETATM" + outId + " " + outChannel + " " + outChain + " " + outChainId + outRes + outX + " " + outY + zspacer + outZ + "   " + outF + " " + outDx;

		bw.write(outLine);
		bw.newLine();
		}
	br.close();
	bw.close();
}


function padSpaces(st, tot) {
	var sto = st;
	var stl = st.length();
	if (stl < tot) {
		for (var s = stl; s < tot; s++) {
			sto = " " + sto;
		}
	}
	return sto;	
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
