// F-Correct3DSTORM.js script function by Christophe Leterrier
// corrects distortion in X from 3D cylindrical lens
// 04/01/2017

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
// xFactor dilatation in X to compensate cylindrical lens (measured on microscope)

function Corr3DS(inPath, outDir, xFactor) {

	// separators (csv files)
	var inSep = ",";
	var sep = ",";

	var xHeader = "\"x [nm]\"";

	// Define input files, folder, open it etc.
	var inFile = new File(inPath); 
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	
	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header line and find index of Z, intensity, background and x coordinate columns
	var inHLine = br.readLine();	
	var inHeader = inHLine.split(inSep);	

	var xIndex = arrayFind(inHeader, xHeader);

	// Generate output name and path, open file writer
	var outName = inName.replace("TS3D", "corr_TS3D");
	if (outName == inName) outName = inNameExt[0] + "_corr." + inNameExt[1];
	var outPath = outDir + outName;
	var outFile = new File(outPath);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	var bw = new BufferedWriter(new FileWriter(outFile));

	IJ.log("      outName: " + outName);

	// Write header
	bw.write(inHLine);
		bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		var inCells = inLine.split(inSep);
		
		// correct distortion in X coordinate
		var X = Double.parseDouble(inCells[xIndex]);
		var xC= X * xFactor;
		var xCS = xC.toFixed(1);
		inCells[xIndex] = xCS;
		 
		// Generate new line
		outLine = inCells[0];
		for (i = 1; i < inCells.length; i++) outLine = outLine + sep + inCells[i];

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
