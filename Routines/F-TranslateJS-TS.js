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
	var inHeaderList = ["xnm","ynm","znm","frame","locprecnm","phot","bg","LLrel","PSFxnm","PSFxpix","PSFynm","PSFypix","channel","colorfield","filenumber","groupindex","iterations","locprecznm","logLikelihood","numberInGroup","photerr","xnmerr","xpix","xpixerr","ynmerr","ypix","ypixerr"];
	var outHeader3DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\"", "detections"];

	// Correspondance
	/*
	frame = frame [3]
	x_(nm) = x [nm] [0]
	y_(nm) = y [nm] [1]
	locprecnm = uncertainty_xy[nm] [4]
	phot = intensity [photon] [5]
	bg = offset [photon] [6]
	logLikelyhood = chi2 [18]
	z_nm = z [nm][2]
	locprecznm = uncertainty_z[nm] [17]
	numberInGroup = detections [19]
	
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
	var fIndex = arrayFind(inHeaderArray, inHeaderList[3]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[0]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[1]);
	var unxyIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[5]);
	var bgIndex = arrayFind(inHeaderArray, inHeaderList[6]);
	var chi2Index = arrayFind(inHeaderArray, inHeaderList[18]);
	var zIndex = arrayFind(inHeaderArray, inHeaderList[2]);
	var unzIndex = arrayFind(inHeaderArray, inHeaderList[17]);
	var detIndex = arrayFind(inHeaderArray, inHeaderList[19]);

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
		var unxyOut = (parseFloat(inCells[unxyIndex])).toFixed(1);

		var intOut = (parseFloat(inCells[intIndex])).toFixed(0);
		var offOut = (parseFloat(inCells[bgIndex])).toFixed(0);
		var chi2Out = (parseFloat(inCells[chi2Index])).toFixed(2);

		var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
		var unzOut = (parseFloat(inCells[unzIndex])).toFixed(1);
		var detOut = (parseFloat(inCells[detIndex])).toFixed(0);

		// Assemble output line
		var outLineArray = [fOut, xOut, yOut, zOut, intOut, offOut, unxyOut, unzOut, chi2Out, detOut];			
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