// F-NSseqSplit.js script function by Christophe Leterrier
// Split channels in txt localization files from Nikon N-STORM sequential aquisition

importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.File);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);

function NSseqSplit(inPath, outDir) {

	// idex of the column containing the channels
	var splitIndex = 0;
	var frameIndex = 12;

	// Get name, path and open buffered reader
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Pass the header
	var inLine = br.readLine();
	var inHeader = inLine;

	// Line counter
	var i = 0;

	// Channels array
	// var Channels = [];

	// Channel counter
	var j = 0;

	while ((inLine = br.readLine()) != null) {

		// Increment line counter
		i++;

		// Assign previous frame
		if (i > 1) var prevFrame = currFrame;
		else prevFrame = 20000;	// for first line, will trigger new Channel condition

		// Get current frame
		var inCells = inLine.split("\t");
		var currFrame = parseInt(inCells[frameIndex]);

		// Test if frame number jumps back to a small value
		if (currFrame - prevFrame < -10000 && (br.readLine()) != null) {
			// Get channel name
			// var rawChan = "" + inCells[splitIndex]; // force string format!
			// var currChan = sanitizeString(rawChan);

			// Close previous file and rename it with its line count (only if not first channel)
			if (i > 1) {
				currBW.close();
				// var countK = Math.round(currCount / 1000);
				var outName2 = inNameExt[0] + "_ch" + j + "." + inNameExt[1];
				var outPath2 = outDir + outName2;
				var newFile = new File(currFile.getParent(), outName2);
				currFile.renameTo(newFile);
			}

			// Add channel name to Channels array and log it
			// Channels.push(currChan);
			// Increment channel count
			j++;
			IJ.log("	   at line " + i + " added Channel number " + j);


			var outName = inNameExt[0] + "_ch" + j + "." + inNameExt[1];
			var outPath = outDir + outName;
			IJ.log("      outName #" + j + ": " + outName);

			// Create new file and buffered writer, write header, initialize loc count
			var currFile = new File(outPath);
			var currBW = new BufferedWriter(new FileWriter(currFile));
			currBW.write(inHeader);
			currBW.newLine();
			var currCount = 0;
		}

		// Write current line
		currBW.write(inLine);
		currBW.newLine();
		currCount++;

	}

	// CLose last file
	currBW.close();
	// var countK = Math.round(currCount / 1000);
	var outName2 = inNameExt[0] + "_ch" + j + "." + inNameExt[1];
	var outPath2 = outDir + outName2;
	var newFile = new File(currFile.getParent(), outName2);
	currFile.renameTo(newFile);

	return;
}


function getExt(filestring){
	var namearray = filestring.split(".");
	var shortname = "";
	for (var f = 0; f < namearray.length - 1; f++) {
		shortname = shortname + namearray[f];
	}
	return [shortname, namearray[namearray.length - 1]];
}

/*

function sanitizeString(si) {
	so = si.replace("/", "-"); // careful with character "/" in some channels names from localization files (see N-STORM format)
	if (so == "Non Specific Activation") so = "NSA"; // shorten the NSA chanel
	if (so == "Z Rejected") so = "ZR"; // shorten the Z Rejected chanel
	return so;
}

*/
