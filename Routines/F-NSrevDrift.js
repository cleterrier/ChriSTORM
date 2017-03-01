// F-NSrevDrift.js script function by Christophe Leterrier
// Reverse drift correction in an N-STORM txt file to align to final position rather than initial
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

function NSrevDrift(inPath, outDir) {
	
	// N-STORM txt file format header (new format)
	var inHeaderNS = ["Channel Name", "X", "Y", "Xc", "Yc", "Height", "Area", "Width", "Phi", "Ax", "BG", "I", "Frame", "Length", "Link", "Valid", "Z", "Zc", "Photons", "Lateral Localization Accuracy", "Xw", "Yw", "Xwc", "Ywc"];
	var inSep = "\t";
	
	// Assign the indexes for Z and Zc columns in the N-STORM txt format
	iX = 1;
	iY = 2;
	iXc = 3;
	iYc = 4;
	iZc = 17;
	iZ = 16;

	// Define input file path
	var inFile = new File(inPath); 
	var inName = inFile.getName();
	IJ.log("    inName: " + inName);

	// Open input File reader
	br = new BufferedReader(new FileReader(inFile));
	// discard header line
	var inLine = br.readLine();

	// go the end of the file
	m = 0;
	while ((inLine = br.readLine()) != null) {
		m++;
		var inCells = inLine.split(inSep);
	}
	
	// store the final drift value
	Xdrift= (parseFloat(inCells[iXc]) - parseFloat(inCells[iX])).toFixed(2);
	Ydrift= (parseFloat(inCells[iYc]) - parseFloat(inCells[iY])).toFixed(2);
	Zdrift= (parseFloat(inCells[iZc]) - parseFloat(inCells[iZ])).toFixed(2);

	IJ.log("    Final Xdrift=" + Xdrift + " nm, Ydrift=" + Ydrift + " nm, Zdrift=" + Zdrift + " nm");

	br.close();
	
	// Open again input File reader
	br = new BufferedReader(new FileReader(inFile));
	
	// Prepare output file path
	if (outDir + inName == inPath) var outName = inName.replace(".txt", "_revdrift.txt");
	else var outName = inName;
	var outPath = outDir + outName;
	var outFile = new File(outPath);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	IJ.log("    outName: " + outName);

	// Open output File writer
	var bw = new BufferedWriter(new FileWriter(outFile));	
	
	// duplicate Header
	inLine = br.readLine();
	bw.write(inLine);
	bw.newLine();	

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

			inCells = inLine.split(inSep);

			// Replace drift-corrected coordinates by drift-correction relatively to the end of file
			inCells[iXc] = (parseFloat(inCells[iXc]) - Xdrift).toFixed(1);
			inCells[iYc] = (parseFloat(inCells[iYc]) - Ydrift).toFixed(1);
			inCells[iZc] = (parseFloat(inCells[iZc]) - Zdrift).toFixed(1);
			
			// Write modified line in output file
			var outLine = inCells[0];
			for (var c = 1; c < inCells.length; c++) {
				outLine += inSep + inCells[c];
			}

			bw.write(outLine);
			bw.newLine();
		}	 
	br.close();
	bw.close();
}



