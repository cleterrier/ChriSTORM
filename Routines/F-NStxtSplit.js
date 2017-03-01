// F-NStxtSplit.js script function by Christophe Leterrier
// Split channels in txt localization files from Nikon N-STORM
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.File);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);

function NStxtSplit(inPath, outDir) {

	// idex of the column containing the channels
	var splitIndex = 0;
	// How many lines are sampled to get the channels
	var SampleMax = 1000000;

	// Get name, path and open buffered reader
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header
	var inLine = br.readLine();

	// Initialize the Channels array with first element
	var inLine = br.readLine();
	var inCells = inLine.split("\t");
	var CurrChan = "" + inCells[0]; // force string format! Nasty bugs when comparing strings if not present
	var sChan = sanitizeString(CurrChan); // sanitize the channel name

	//IJ.log("\nDetecting channels using the first " + SampleMax + " values of column #" + (splitIndex + 1) + ":");
	//IJ.log("	 added " +  sChan + ", Channel number =1");
	var Channels = [sChan];
	IJ.log("	   at line " + 1 + " added " + Channels[Channels.length-1] + ", Channel number =" + Channels.length);

	// Taste the first lines (up to SampleMax) to detect the numbers of channels
	var i = 0;
	while ((inLine = br.readLine()) != null && i < SampleMax) {
		i++;
		var inCells = inLine.split("\t");
		var CurrChan = "" + inCells[splitIndex];
		var sChan = sanitizeString(CurrChan);
		var flag = 0;
		// raises the flag if the element is already present in the Channels array
		for (var j = 0; j < Channels.length; j++) {
			if (sChan == Channels[j]) {
				flag = 1;
			}
		}
		// if flag not raised, add the element to the Channels array
		if (flag == 0) {
			Channels.push(sChan);
			IJ.log("	   at line " + i + " added " + Channels[Channels.length-1] + ", Channel number =" + Channels.length);
		}
	}
	// Close the input file
	br.close();

	// Reopens input file (back to line 1), reads header line
	var br = new BufferedReader(new FileReader(inFile));
	inHeader = br.readLine();

	// create an array of buffered writers, one for each channel of Channels
	var Files = new Array();
	var bw = new Array();
	var counts = new Array();

	//IJ.log("\nCreating output files:");
	for (var j = 0; j < Channels.length; j++){
		var outName = inNameExt[0] + "_" + Channels[j] + "." + inNameExt[1];
		var outPath = outDir + outName;
		IJ.log("      outName #" + (j+1) + ": " + outName);

		Files[j] = new File(outPath);
		if (!Files[j].exists()) {
			Files[j].createNewFile();
		}
		bw[j] = new BufferedWriter(new FileWriter(Files[j]));
		bw[j].write(inHeader);
		bw[j].newLine();
		counts[j] = 0;
	}

	// Write the output files line by line, testing in which output file to store each line of the input file
	var flag2 = 0;
	while ((inLine = br.readLine()) != null) {

		// get input line
		var inCells = inLine.split("\t");
		// get input element
		var CurrChan = "" + inCells[splitIndex]; // force string format!
		var sChan = sanitizeString(CurrChan);
		var j = 0;

		// Scan to find which channel/file the line belongs
		while (j < Channels.length && sChan != Channels[j]) {
			j++;
		}

		// Write in the relevant file
		if (j < Channels.length) {
			bw[j].write(inLine);
			bw[j].newLine();
			counts[j]++;
		}
		else {
			flag2++;
			if (flag2 == 1) IJ.log("      unrecognized channel localization found: " + sChan);
		}

	}

	// Close the buffered reader
	br.close();

	// Close all buffered writers and rename files
	for (var j = 0; j < bw.length; j++) {
		bw[j].close();

		// Rename files with their line count
		var countK = Math.round(counts[j] / 1000);
		var outName2 = inNameExt[0] + "_" + Channels[j] + "_" + countK + "K." + inNameExt[1];
		var outPath2 = outDir + outName2;
		var newFile = new File(Files[j].getParent(), outName2);
		Files[j].renameTo(newFile);
	}

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


function sanitizeString(si) {
	so = si.replace("/", "-"); // careful with character "/" in some channels names from localization files (see N-STORM format)
	if (so == "Non Specific Activation") so = "NSA"; // shorten the NSA chanel
	if (so == "Z Rejected") so = "ZR"; // shorten the Z Rejected chanel
	return so;
}
