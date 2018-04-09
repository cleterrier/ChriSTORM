// F-TranslateDOM_TS.js script function by Christophe Leterrier
// Translate localizations between DOM results table and TunderSTORM csv

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
// ppc: photons per count to trasnlate camera ADU to photons (for intensity)

function TranslateDOMTS(inPath, outDir, ppc){

	// Separators
	var inSep = "\t"; // input separator
	var sep = ","; // output separator 

	// Fields of the input header
	var inHeaderList = ["X_(px)","Y_(px)","Frame_Number","X_(nm)","X_loc_error(nm)","Y_(nm)","Y_loc_error(nm)","Z_(nm)","Z_loc_error(nm)","Amplitude_fit","Amp_error","BGfit","BGfit_error","SD_X_(nm)","SD_X_error(nm)","SD_Y_(nm)","SD_Y_error(nm)","False positive","IntegratedInt","SNR","R2_fit","Iterations_fit"];
	var outHeader2DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"sigma [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"", "\"chi2\"", "\"detections\""];
	var outHeader3DList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"sigma1 [nm]\"","\"sigma2 [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\"", "\"detections\""];

	// Correspondance
	/*
	2D case:
	Frame Number = frame [2]
	X_(nm) = x [nm] [3]
	Y_(nm) = y [nm] [4]
	average(SD_X_(nm), SD_Y_(nm))= sigma [nm] sqrt([14]^2 +[15]^2)
	average(X_loc_error(nm), Y_loc_error(nm)) = uncertainty_xy[nm] sqrt([4]^2 +[6]^2)
	IntegratedInt * PpC = intensity [photon] [18]*ppc
	BGfit * ppc = offset [photon] [11]*ppc
	BGfit_error * ppc = bkgstd [photon]? [12]*ppc
	R2_fit = chi2 [20]
	3D case:
	Z_(nm) = z [nm][7]
	Z_loc_error(nm) = uncertainty_z[nm] [8]
	SD_X_(nm) = sigma1 [nm] [14]
	SD_Y_(nm) = sigma2 [nm] [15]
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
	var fIndex = arrayFind(inHeaderArray, inHeaderList[2]);
	var xIndex = arrayFind(inHeaderArray, inHeaderList[3]);
	var yIndex = arrayFind(inHeaderArray, inHeaderList[5]);
	var sdxIndex = arrayFind(inHeaderArray, inHeaderList[14]);
	var sdyIndex = arrayFind(inHeaderArray, inHeaderList[15]);
	var unxIndex = arrayFind(inHeaderArray, inHeaderList[4]);
	var unyIndex = arrayFind(inHeaderArray, inHeaderList[6]);
	var intIndex = arrayFind(inHeaderArray, inHeaderList[18]);
	var bgIndex = arrayFind(inHeaderArray, inHeaderList[11]);
	var errbgIndex = arrayFind(inHeaderArray, inHeaderList[12]);
	var chi2Index = arrayFind(inHeaderArray, inHeaderList[20]);

	var zIndex = arrayFind(inHeaderArray, inHeaderList[7]);
	var unzIndex = arrayFind(inHeaderArray, inHeaderList[8]);

	// Define output extension and header depending on 2D or 3D
	if (zIndex == -1) {
		var is3D = false;
		var outSuffix = "_TS2D";
		var outHeaderList = outHeader2DList;
	}
	else {
		var is3D = true;
		var outSuffix = "_TS3D";
		var outHeaderList = outHeader3DList;
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
		var sigma1Out = parseFloat(inCells[sdxIndex]);
		var sigma2Out = parseFloat(inCells[sdyIndex]);
		if (is3D == false) var sigmaOut = (Math.sqrt((sigma1Out * sigma1Out)  + (sigma2Out * sigma2Out))).toFixed(1);
		var unxOut = parseFloat(inCells[unxIndex]);
		var unyOut = parseFloat(inCells[unyIndex]);
		var unxyOut = (Math.sqrt((unxOut * unxOut)  + (unyOut * unyOut))).toFixed(1);

		var intOut = (parseFloat(inCells[intIndex]) * ppc).toFixed(0);
		var offOut = (parseFloat(inCells[bgIndex]) * ppc).toFixed(0);
		var bgstdOut = (parseFloat(inCells[errbgIndex]) * ppc).toFixed(1);
		var chi2Out = (parseFloat(inCells[chi2Index])).toFixed(2);

		if (is3D == true) {
			var zOut = (parseFloat(inCells[zIndex])).toFixed(1);
			var unzOut = (parseFloat(inCells[unzIndex])).toFixed(1);
		}

		// Assemble output line
		// 1 at the end is for the detection number (linked localization accross several frames) that are not reported by DOM
		if (is3D == false) var outLineArray = [fOut, xOut, yOut, sigmaOut, intOut, offOut, bgstdOut, unxyOut, chi2Out, "1"];
		else var outLineArray = [fOut, xOut, yOut, zOut, sigma1Out, sigma2Out, intOut, offOut, bgstdOut, unxyOut, unzOut, chi2Out, "1"];			
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