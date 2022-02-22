// F-ChangeHeader.js script function by Christophe Leterrier
// Change ThunderSTORM csv header into PoCA header

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

function changeHeader(inPath, outDir){

	// Header length (new in DECODE 0.10)
	var headLength = 0;

	// Separators
	var inSep = ","; // input separator
	var sep = ","; // output separator

	// Fields of the input header

	var inHeaderList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"intensity [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\""];
	var outHeaderList = ["frame","x","y","z","intensity","sigmaXY","sigmaZ"];

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
	var fIndex = arrayFind(inHeaderArray, inHeaderList[0]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[1]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[2]);
	var zIndex = arrayFind(inHeaderArray, inHeaderList[3]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var unxyIndex = arrayFind(inHeaderArray, inHeaderList[5]);
	var unzIndex = arrayFind(inHeaderArray, inHeaderList[6]);

	// will only use for 3D
	var is3D = true;
	var outSuffix = "";

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

		var fOut = (parseInt(inCells[fIndex])).toFixed(0);

		var xOut = (parseFloat(inCells[xIndex])).toFixed(1);
		var yOut = (parseFloat(inCells[yIndex])).toFixed(1);
		var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
		var intOut = (parseFloat(inCells[intIndex])).toFixed(0);
		var unxyOut = (parseFloat(inCells[unxyIndex])).toFixed(1);
		var unzOut = (parseFloat(inCells[unzIndex])).toFixed(1);

		// Assemble output line
		var outLineArray = [fOut, xOut, yOut, zOut, intOut, unxyOut, unzOut];
		var outLine = makeLineFromArray(outLineArray, sep);

		// Write new line
		bw.write(outLine);
		countloc = countloc + 1;
		bw.newLine();
	}
	br.close();
	bw.close();

	// Rename file with its line count
	/*
	var countK = Math.round(countloc / 1000);
	var outName2 = inNameExt[0] + "_" + countK + "K" + outSuffix + "." + inNameExt[1];
	var newFile = new File(outFile.getParent(), outName2);
	outFile.renameTo(newFile);
	*/

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
