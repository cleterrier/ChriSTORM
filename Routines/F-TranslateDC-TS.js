// F-TranslateDC_TS.js script function by Christophe Leterrier
// Translate localizations between DECODE csv and ThunderSTORM csv

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
// ps: pixel size on camera image in nm (default is 160 nm for NSTORM)
// cf: compensate distortion from the 3D astigmatic lens (default for NSTORM X = 1.036875 * Y)
// rf: rotate 90°right (boolean, default true)
// fY: flip Y coodrindates. DECODE inverts X and Y so by default locs should be rotated 90° right + flipped Y (boolean, default true)
// sX: width of camera image in pixels (default is 256 for NSTORM);
// sY: height of camera image in pixels (default is 256 for NSTORM);
// fz: flip Z coordinates
// cz: compensate Z coordinates for index mismatch (default is 0.8)
// su: scale uncertainties (as done by Ries lab for SMAP output, default is 0.4)

function TranslateDCTS(inPath, outDir, ps, cf, rf, fY, sX, sY, fz, cz, su){

	// Header length (new in DECODE 0.10)
	var headLength = 3;

	// Separators
	var inSep = ","; // input separator
	var sep = ","; // output separator

	// Fields of the input header

	var inHeaderList = ["x","y","z","phot","frame_ix","id","prob","bg","phot_cr","bg_cr","phot_sig","bg_sig","xy_unit","x_cr","y_cr","z_cr","x_sig","y_sig","z_sig"];
	var outHeader3DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"intensity [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\""];

	// Correspondance
	/*
	frame_ix = frame [4]
	x * ps = x [nm] [0]*ps
	y * ps = y [nm] [1]*ps
	sqrt((x_sig*ps)^2 + (y_sig*ps)^2) = uncertainty_xy[nm] sqrt(([16]*ps)^2 +([17]*ps)^2)
	phot = intensity [photon] [3]
	bg = offset [photon] [7]
	prob = chi2 [6]
	z = z [nm][2]
	sig_z = uncertainty_z[nm] [18]
	*/

	// Define input files, folder, open it etc.
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);

	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);
	
	// Pass the header lines
	for (l = 0; l < headLength; l++) {
		br.readLine();
	}

	// Get the header line and find index of Z, intensity, background and x coordinate columns
	var inHeader = br.readLine();
	//IJ.log("inHeader: " + inHeader);
	var inHeaderArray = inHeader.split(inSep);

	// get the indexes of the columns needed in input file from its header
	var fIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[0]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[1]);
	var unxIndex = arrayFind(inHeaderArray, inHeaderList[16]);
	var unyIndex = arrayFind(inHeaderArray, inHeaderList[17]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[3]);
//	var bgIndex = arrayFind(inHeaderArray, inHeaderList[7]);
	var chi2Index = arrayFind(inHeaderArray, inHeaderList[6]);
	var zIndex = arrayFind(inHeaderArray, inHeaderList[2]);
	var unzIndex = arrayFind(inHeaderArray, inHeaderList[18]);

	// will only use for 3D
	var is3D = true;
	var outSuffix = "_TS3D";
	var outHeaderList = outHeader3DList;


	// Generate output name and path, open file writer

	var outName = inName.replace("." + inNameExt[1], outSuffix + ".csv");
	if (outName == inName) outName = inNameExt[0] + outSuffix + "." + inNameExt[1]; // in the case we are processing CSV files
	var outPath = outDir + outName;
	var outFile = new File(outPath);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	var bw = new BufferedWriter(new FileWriter(outFile));
	var countloc = 0;

	IJ.log("      outName: " + outName);

	// Write the header
	var outHeader = makeLineFromArray(outHeaderList, sep);
	bw.write(outHeader);
	bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		// Processing of individual values from input file lines, split by inSep
		var inCells = inLine.split(inSep);

		var fOut = (parseInt(inCells[fIndex]) + 1).toFixed(0);

		if (rf == true && fY == true) { // this aligns the default output of DECODE with the default output of TS/SMAP
			var xOut = (parseFloat(inCells[yIndex]) * cf * ps).toFixed(1);
			var yOut = (parseFloat(inCells[xIndex]) * ps).toFixed(1);
		}			
		else if (rf == true && fY == false){ 
			var xOut = ((sX - parseFloat(inCells[yIndex])) * ps * cf).toFixed(1);
			var yOut = (parseFloat(inCells[xIndex]) * ps).toFixed(1);
		}
		else if (rf == false && fY == true) {
			var xOut = (parseFloat(inCells[xIndex]) * cf * ps).toFixed(1);
			var yOut = ((sY- parseFloat(inCells[yIndex])) * ps).toFixed(1);
		}
		else if (rf == false && fY == false) {
			var xOut = (parseFloat(inCells[xIndex]) * cf * ps).toFixed(1);
			var yOut = (parseFloat(inCells[yIndex]) * ps).toFixed(1);
		}

		var unxOut = (parseFloat(inCells[unxIndex]) * ps);
		var unyOut = (parseFloat(inCells[unyIndex]) * ps);
		var unxyOut = (su * Math.sqrt((unxOut * unxOut)  + (unyOut * unyOut))).toFixed(1);

		var intOut = (parseFloat(inCells[intIndex])).toFixed(0);
//		var offOut = (parseFloat(inCells[bgIndex])).toFixed(0);
		var chi2Out = (parseFloat(inCells[chi2Index])).toFixed(2);

		if (fz == true) zfactor = -1 * cz; else zfactor = cz;
		var zOut = (zfactor * parseFloat(inCells[zIndex])).toFixed(1);
		var unzOut = (su * parseFloat(inCells[unzIndex])).toFixed(1);

		// Assemble output line
		var outLineArray = [fOut, xOut, yOut, zOut, intOut, unxyOut, unzOut, chi2Out];
		var outLine = makeLineFromArray(outLineArray, sep);

		// Write new line
		bw.write(outLine);
		countloc = countloc + 1;
		bw.newLine();
	}
	br.close();
	bw.close();

	// Rename file with its line count
	var countK = Math.round(countloc / 1000);
	var outName2 = inNameExt[0] + "_" + countK + "K" + outSuffix + "." + inNameExt[1];
	var newFile = new File(outFile.getParent(), outName2);
	outFile.renameTo(newFile);

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
