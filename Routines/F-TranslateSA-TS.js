// F-TranslateSA_TS.js script function by Christophe Leterrier
// Translate localizations between storm-analysis and ThunderSTORM csv

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

function TranslateSATS(inPath, outDir, pxSize){

	// Separators
	var inSep = ","; // input separator
	var sep = ","; // output separator

	var offsetdef = 12.48; // offset in photons
	var tasteZ = 1000; // values to taste for Z coordinates (to detect 2D/3D)
	var zFactor = 2; // multiplicative factore between xy and z uncertainty

	// Fields of the input header
	var inHeaderList = ["index","background","category","error","frame_number","height","iterations","significance","sum","track_id","track_length","x","xsigma","y","z"];
	var outHeader2DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"sigma [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"", "\"detections\""];
	var outHeader3DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"sigma1 [nm]\"","\"sigma2 [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"detections\""];

	// Correspondance
	/*
	2D case:
	frame = frame_number = [4]
	x [nm] = x * pxSize = [11]*pxSize
	y [nm] = y * pxSize = [13]*pxSize
	sigma [nm] =  	xsigma * pxSize = [12]*pxSize
	uncertainty_xy[nm] = has to be caclulated from Thompson formula
	using background [1], sum [8], pxSize, xsigma [12]
	intensity [photon] = sum = [8]
	offset [photon] = offsetdef
	bkgstd [photon] = background [1]
	detections = track_length [10]
	3D case:
	z [nm] = z*pxSize = [14]*pxSize
	uncertainty_z[nm]
	sigma1 [nm] = ?
	sigma2 [nm] = ?
	*/

	// Define input files, folder, open it etc.
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);

	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header line and find index of Z, intensity, background and x coordinate columns
	var inHeader = br.readLine();
	//IJ.log("inHeader: " + inHeader);
	var inHeaderArray = inHeader.split(inSep);

	// get the indexes of the columns needed in input file from its header
	var fIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[11]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[13]);
	var sdxIndex = arrayFind(inHeaderArray, inHeaderList[12]);
//	var sdyIndex = arrayFind(inHeaderArray, inHeaderList[15]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[8]);
//	var bgIndex = arrayFind(inHeaderArray, inHeaderList[11]);
	var errbgIndex = arrayFind(inHeaderArray, inHeaderList[1]);
//	var chi2Index = arrayFind(inHeaderArray, inHeaderList[20]);
	var detIndex = arrayFind(inHeaderArray, inHeaderList[10]);

	var zIndex = arrayFind(inHeaderArray, inHeaderList[14]);
//	var unzIndex = arrayFind(inHeaderArray, inHeaderList[8]);

	// Define output extension and header depending on 2D or 3D

	// Taste the first z values to see if non zero
	var accZ = 0;
	for (l = 0; l < tasteZ; l++) {
		var inLine = br.readLine();
		var inCells = inLine.split(inSep);
		var zOut = parseFloat(inCells[zIndex]);
		accZ = accZ + zOut;
	}

	if (accZ == 0) {
		var is3D = false;
		var outSuffix = "_TS2D";
		var outHeaderList = outHeader2DList;
	}
	else {
		var is3D = true;
		var outSuffix = "_TS3D";
		var outHeaderList = outHeader3DList;
	}

	// reset file reader to beginning of file
	br.close();
	br = new BufferedReader(new FileReader(inFile));
	inHeader = br.readLine();

	// Generate output name and path, open file writer
	var outName = inName.replace("." + inNameExt[1], outSuffix + ".csv");
	if (outName == inName) outName = inNameExt[0] + outSuffix + "." + inNameExt[1]; // in the case we are processing CSV files
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
		inCells = inLine.split(inSep);

		var fOut = inCells[fIndex];
		var xOut = (parseFloat(inCells[xIndex]) * pxSize).toFixed(1);
		var yOut = (parseFloat(inCells[yIndex]) * pxSize).toFixed(1);

		// uncertainty from Thompson formula
		// get sigma, photon count and background as floats from file
		var sigmaOutN = parseFloat(inCells[sdxIndex]) * pxSize;
		var intOutN = parseFloat(inCells[intIndex]);
		var bgstdOutN = parseFloat(inCells[errbgIndex]);
		// Calculate using modified Thompson formula (b instead of b^2)
		var Thom1 = ((sigmaOutN * sigmaOutN) + ((pxSize * pxSize) / 12)) / intOutN ;
		var Thom2 = (8 * 3.14159 * (sigmaOutN * sigmaOutN * sigmaOutN * sigmaOutN) * bgstdOutN) / ((pxSize * pxSize) * (intOutN * intOutN));
		var unxyOutN = Math.sqrt(Thom1 + Thom2);
		var unxyOut = unxyOutN.toFixed(2);

		var sigmaOut = sigmaOutN.toFixed(1);
		var intOut = intOutN.toFixed(0);
		var bgstdOut = bgstdOutN.toFixed(1);
		var offOut = (parseFloat(offsetdef)).toFixed(0);
		var detOut = (parseFloat(inCells[detIndex])).toFixed(0);

		if (is3D == true) {
			var sigma1Out = sigmaOut; // temporary
			var sigma2Out = sigmaOut; // temporary
			var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
			var unzOut = (parseFloat(unxyOutN * zFactor)).toFixed(1);
		}

		// Assemble output line
		// 1 at the end is for the detection number (linked localization accross several frames) that are not reported by DOM
		if (is3D == false) var outLineArray = [fOut, xOut, yOut, sigmaOut, intOut, offOut, bgstdOut, unxyOut, detOut];
		else var outLineArray = [fOut, xOut, yOut, zOut, sigma1Out, sigma2Out, intOut, offOut, bgstdOut, unxyOut, unzOut, detOut];
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
