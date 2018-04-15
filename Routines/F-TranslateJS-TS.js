// F-TranslateJS_TS.js script function by Christophe Leterrier
// Translate localizations between Jonas Ries Spline csv and ThunderSTORM csv

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

function TranslateJSTS(inPath, outDir){

	// Separators
	var inSep = ","; // input separator
	var sep = ","; // output separator 

	// Fields of the input header
	var inHeaderList = ["frame","x_pix","y_pix","z_nm","photons","background","crlb_x","crlb_y","crlb_z","crlb_photons","crlb_background","logLikelyhood","x_nm","y_nm","crlb_xnm","crlb_ynm"];
	var outHeader3DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\""];

	// Correspondance
	/*
	frame = frame [0]
	x_(nm) = x [nm] [12]
	y_(nm) = y [nm] [13]
	average(crlb_xnm,crlb_ynm) = uncertainty_xy[nm] sqrt([15]^2 +[16]^2)
	photons = intensity [photon] [4]
	background = offset [photon] [5]
	crlb_background = bkgstd [photon]? [10]
	loglikelyhood = chi2 [11]
	z_nm = z [nm][3]
	Z_loc_error(nm) = uncertainty_z[nm] [8]
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
	var fIndex = arrayFind(inHeaderArray, inHeaderList[0]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[12]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[13]);
	var unxIndex = arrayFind(inHeaderArray, inHeaderList[14]);
	var unyIndex = arrayFind(inHeaderArray, inHeaderList[15]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var bgIndex = arrayFind(inHeaderArray, inHeaderList[5]);
	var errbgIndex = arrayFind(inHeaderArray, inHeaderList[10]);
	var chi2Index = arrayFind(inHeaderArray, inHeaderList[11]);
	var zIndex = arrayFind(inHeaderArray, inHeaderList[3]);
	var unzIndex = arrayFind(inHeaderArray, inHeaderList[8]);

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

	IJ.log("      outName: " + outName);

	// Write the header
	var outHeader = makeLineFromArray(outHeaderList, sep);
	bw.write(outHeader);
	bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		// Processing of individual values from input file lines, split by inSep
		var inCells = inLine.split(inSep);

		var fOut = inCells[fIndex];
		var xOut = (parseFloat(inCells[xIndex])).toFixed(1);
		var yOut = (parseFloat(inCells[yIndex])).toFixed(1);
		var unxOut = parseFloat(inCells[unxIndex]);
		var unyOut = parseFloat(inCells[unyIndex]);
		var unxyOut = (Math.sqrt((unxOut * unxOut)  + (unyOut * unyOut))).toFixed(1);

		var intOut = (parseFloat(inCells[intIndex])).toFixed(0);
		var offOut = (parseFloat(inCells[bgIndex])).toFixed(0);
		var bgstdOut = (parseFloat(inCells[errbgIndex])).toFixed(1);
		var chi2Out = (parseFloat(inCells[chi2Index])).toFixed(2);

		var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
		var unzOut = (parseFloat(inCells[unzIndex])).toFixed(1);

		// Assemble output line
		var outLineArray = [fOut, xOut, yOut, zOut, intOut, offOut, bgstdOut, unxyOut, unzOut, chi2Out];			
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