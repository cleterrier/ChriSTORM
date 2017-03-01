// F-HDcvsTranslate.js script function by Christophe Leterrier
// Translate single-channel cvs localization files from HDSTORM to .csv ThunderSTORM localization file

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

function HDcvsTranslate(inPath, outDir, outFormat, pxSize) {
	
	// Factor to convert sigma into FWHM
	var FWHM = 2.355;	
	
	// cvs file format header (new format)
	var inHeaderNS = ["m_traj", "time_end", "time_start", "position_i", "position_j", "std_error_position", "sum_on", "nb_blink", "alpha_max", "alpha_sum", "alpha_sum2"];
	var inSep = ";";
	var headerLength = 39;
	
	// Assign the indexes for all columns in the N-STORM txt format
	iF = 1;
	iX = 3;
	iY = 4;
	iU = 5;

	// Define input file path
	var inFile = new File(inPath); 
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	IJ.log("    inName: " + inName);

	// Open input File reader
	var br = new BufferedReader(new FileReader(inFile));

	// Pass header
	for (var i = 0; i<headerLength; i++) inLine = br.readLine();

	// ThunderSTORM format
	if (outFormat == "TS") {
		var sep = ",";
		var outHeader = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"uncertainty_xy [nm]\""];
		var outSuffix = "_TS2D";
		var includeHeader = true;	
		var outExt = ".csv";
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
			if (outFormat == "TS") {
			
				// localization uncertainty for XY (sigma)
				var uncXY = (parseFloat(inCells[iU])*pxSize).toFixed(2);
				var coorX = (parseFloat(inCells[iX])*pxSize).toFixed(2);
				var coorY = (parseFloat(inCells[iY])*pxSize).toFixed(2);

				// Build results line
				outLine = inCells[iF] + sep + coorX + sep + coorY + sep + uncXY;					
			}
			bw.write(outLine);
			bw.newLine();
		}	 
	br.close();
	bw.close();
}


function makeLineFromArray(ar, se) {
	ol = "" + ar[0];
	for (t = 1; t < ar.length; t++) {
		ol = ol + se + ar[t];
	}
	return ol;
}


function getExt(filestring){
	var namearray = filestring.split(".");
	var shortname = "";
	for (var f = 0; f < namearray.length - 1; f++) {
		shortname = shortname + namearray[f];
	}
	return [shortname, namearray[namearray.length - 1]];
}