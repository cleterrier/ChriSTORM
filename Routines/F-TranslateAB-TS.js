// F-TranslateAB_TS.js script function by Christophe Leterrier
// Translate localizations between Abbelight Neo results table and TunderSTORM csv

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
// unzfactor: create z uncertainty by scaling xy uncertainty using this multiplicative factor
// scaleu: scale xy uncertainties (usually with a 0.4 factor similar to Ries lab)

function TranslateABTS(inPath, outDir, unzfactor, scaleu){

	// Separators
	var inSep = ","; // input separator
	var sep = ","; // output separator

	// Fields of the input header
	var inHeaderList = ["\"id\"","\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"sigma [nm]\"","\"intensity [photon]\"","\"amplitude [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"","\"intDemixing [photon]\"","\"sigma_x [nm]\"","\"sigma_y [nm]\"", "\"detections\"", "\"ratio_demixing\""];
	var outHeaderList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"sigma1 [nm]\"","\"sigma2 [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"detections\"", "\"sigma [nm]\"", "\"amplitude [photon]\"", "\"intDemixing [photon]\"",  "\"ratio_demixing\""];


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
	var fIndex = arrayFind(inHeaderArray, inHeaderList[1]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[2]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[3]);
	var zIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var sdIndex = arrayFind(inHeaderArray, inHeaderList[5]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[6]);
	var ampIndex = arrayFind(inHeaderArray, inHeaderList[7]);
	var bgIndex = arrayFind(inHeaderArray, inHeaderList[8]);
	var errbgIndex = arrayFind(inHeaderArray, inHeaderList[9]);
	var unxyIndex = arrayFind(inHeaderArray, inHeaderList[10]);
	var idmxIndex = arrayFind(inHeaderArray, inHeaderList[11]);
	var sdxIndex = arrayFind(inHeaderArray, inHeaderList[12]);
	var sdyIndex = arrayFind(inHeaderArray, inHeaderList[13]);
	var detIndex = arrayFind(inHeaderArray, inHeaderList[14]);
	var ratIndex = arrayFind(inHeaderArray, inHeaderList[15]);


	// Define variables for the header and lines
	var outHeaderArray = ["\"frame\"","\"x [nm]\"","\"y [nm]\""];
	var xOut = 0;
	var yOut = 0;
	var zOut = 0
	var outLineArray = [fOut, xOut, yOut];

	if (zIndex > -1) {
		outHeaderArray.push("\"z [nm]\"");
		var zOut = 0;
		outLineArray.push(zOut);
		var outSuffix = "_TS3D";
	}

	else {
		var outSuffix = "_TS2D";
	}

	outHeaderArray.push("\"sigma [nm]\"");
	var sigmaOut = 0;
	outLineArray.push(sigmaOut);

	if (sdxIndex > -1)  {
	outHeaderArray.push("\"sigma1 [nm]\"","\"sigma2 [nm]\"");
	var sigma1Out = 0;
	var sigma2Out = 0;
	outLineArray.push(sigma1Out, sigma2Out);
	}

	outHeaderArray.push("\"intensity [photon]\"", "\"amplitude [photon]\"", "\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"");
	var intOut = 0;
	var ampOut = 0;
	var offOut = 0;
	var bgstdOut = 0;
	var unxyOut = 0;
	outLineArray.push(intOut, ampOut, offOut, bgstdOut, unxyOut);

	if (zIndex > -1) {
		outHeaderArray.push("\"uncertainty_z [nm]\"");
		var unzOut = 0;
		outLineArray.push(unzOut);
	}

	if (detIndex > -1) {
		outHeaderArray.push("\"detections\"");
		var detOut =  0;
		outLineArray.push(detOut);
	}

	if (idmxIndex > -1)  {
		outHeaderArray.push("\"intDemixing [photon]\"");
		var idmxOut = 0;
		outLineArray.push(idmxOut);
	}

	if (ratIndex > -1) {
		outHeaderArray.push("\"ratio_demixing\"");
		var ratOut = 0;
		outLineArray.push(ratOut);
	}


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

	IJ.log("      outName (temporary): " + outName);

	// Write the header
	var outHeader = makeLineFromArray(outHeaderArray, sep);
	bw.write(outHeader);
	bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		// Processing of individual values from input file lines, split by inSep
		var inCells = inLine.split(inSep);

		var fOut = parseInt(inCells[fIndex]);
		var xOut = (parseFloat(inCells[xIndex])).toFixed(1);
		var yOut = (parseFloat(inCells[yIndex])).toFixed(1);

		var outLineArray = [fOut, xOut, yOut];

		if (zIndex > -1) {
			var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
			outLineArray.push(zOut);
		}

		var sigmaOut = (parseFloat(inCells[sdIndex])).toFixed(1);
		outLineArray.push(sigmaOut);

		if (sdxIndex > -1)  {
		var sigma1Out = (parseFloat(inCells[sdxIndex])).toFixed(1);
		var sigma2Out = (parseFloat(inCells[sdxIndex])).toFixed(1);
		outLineArray.push(sigma1Out, sigma2Out);
		}

		var intOut = parseInt(inCells[intIndex]);
		var ampOut = parseInt(inCells[ampIndex]);
		var offOut = parseInt(inCells[bgIndex]);
		var bgstdOut = (parseFloat(inCells[errbgIndex])).toFixed(1);
		var unxyOut = (parseFloat(inCells[unxyIndex]) * scaleu).toFixed(1);
		outLineArray.push(intOut, ampOut, offOut, bgstdOut, unxyOut);

		if (zIndex > -1) {
			var unzOut = (unxyOut * unzfactor).toFixed(1);
			outLineArray.push(unzOut);
		}

		if (detIndex > -1) {
			var detOut =  parseInt(inCells[detIndex]);
			outLineArray.push(detOut);
		}

		if (idmxIndex > -1)  {
			var idmxOut = parseInt(inCells[idmxIndex]);
			outLineArray.push(idmxOut);
		}

		if (ratIndex > -1)  {
			var ratOut = (parseFloat(inCells[ratIndex])).toFixed(3);
			outLineArray.push(ratOut);
		}

		// Assemble output line
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

	IJ.log("      outName (final): " + outName2);

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
