importClass(Packages.ij.ImagePlus);

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.Roi);
importClass(Packages.java.lang.Double);


/*
// Test part
var impTest = IJ.getImage();
var RoiTest = impTest.getRoi();
var RoiNameTest = "testROI";

var inPathTest = "/Users/christo/Desktop/test/Locs TS proc/C3_N1a_div3_b2s-add-b3t-m2_b2s647_405-647_311K_RCC_TS3D.csv";
var outDirTest = "/Users/christo/Desktop/test/Locs TS split/";

var psTest = 16;
var saveinTest = true;
var saveoutTest = true;

SplitLocsROI(inPathTest, outDirTest, RoiNameTest, RoiTest, psTest, saveinTest, saveoutTest);
*/

// F-SplitLocsROI.js script function by Christophe Leterrier
// Split a loc file into two files: localization inside and outside a given ROI

// Parameters
// inPath: input file path
// outDir: output directory path
// roiName: name of ROI
// roi: a ROI object
// ps: pixel size in nm
// savein: save a loc file containing the localizations inside the ROI
// saveout: save a loc file containing the localizations outside the ROI

function SplitLocsROI(inPath, outDir, roiName, roi, ps, savein, saveout){

	// Separators
	var inSep = ","; // input separator
	var sep = ","; // output separator

	var outSuffixIn = "_in(" + roiName +")";
	var outSuffixOut = "_out(" + roiName + ")";

	// Fields of the input header

	//var outHeaderList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\""];
	//var xHeader = outHeaderList[1];
	//var yHeader = outHeaderList[2];
	var xHeader = "x [nm]";
	var yHeader = "y [nm]";


	// Define input files, folder, open it etc.
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);

	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header line
	var inHeader = br.readLine();
	//IJ.log("inHeader: " + inHeader);
	var inHeaderArray = inHeader.split(inSep);

	// get the indexes of the columns needed in input file from its header
	var xIndex = arrayFind(inHeaderArray, xHeader);
	var yIndex = arrayFind(inHeaderArray, yHeader);

	// Generate output names and paths, open file writers
	var outNameIn = inName.replace("_TS", outSuffixIn + "_TS");
	if (outNameIn == inName) {
		outNameIn = inName.replace(".csv", outSuffixIn + ".csv");
	}
	var outPathIn = outDir + outNameIn;
	var outFileIn = new File(outPathIn);

	// Write the header
	var outHeader = inHeader;

	var countloc = 0;
	var countloc1 = 0;
	var countloc2 = 0;

	if (savein == true) {
		if (!outFileIn.exists()) {
			outFileIn.createNewFile();
			// IJ.log("out file 1 path: " + outPathIn);
		}
		var bwIn = new BufferedWriter(new FileWriter(outFileIn));
		bwIn.write(outHeader);
		bwIn.newLine();
	}

	var outNameOut = inName.replace("_TS", outSuffixOut + "_TS");
	if (outNameOut == inName) {
		outNameOut = inName.replace(".csv", outSuffixOut + ".csv");
	}
	var outPathOut = outDir + outNameOut;
	var outFileOut = new File(outPathOut);

	if (saveout == true) {		
		if (!outFileOut.exists()) {
			outFileOut.createNewFile();	
		}
		var bwOut = new BufferedWriter(new FileWriter(outFileOut));
		bwOut.write(outHeader);
		bwOut.newLine();
	}

	// IJ.log("      outName (inside ROI): " + outNameIn);
	// IJ.log("      outName (outside ROI): " + outNameOut);


	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		// Processing of individual values from input file lines, split by inSep
		var inCells = inLine.split(inSep);


		var xOut = (parseFloat(inCells[xIndex]) / ps);
		var yOut = (parseFloat(inCells[yIndex]) / ps);

		countloc ++;

		if (roi.containsPoint(xOut, yOut) == true) {
			countloc1 = countloc1 + 1;
			if (savein == true) {
				bwIn.write(inLine);
				bwIn.newLine();
			}
		}
		else {
			countloc2 = countloc2 + 1;
			if (saveout == true) {
				bwOut.write(inLine);
				bwOut.newLine();
			}
		}

	}

	br.close();


	if (savein == true) {
		bwIn.close();
		// Rename file 1 with its line count
		var countK1 = Math.round(countloc1 / 1000);
		// IJ.log(countloc1);
		var outNameInb = inName.replace(new RegExp("(_([0-9])+K)+_"), outSuffixIn + "_" + countK1 + "K_");
		if (outNameInb == inName) outNameInb = inNameExt[0] + outSuffixIn + "_" + countK1 + "K." + inNameExt[1];
		var newFileIn = new File(outFileIn.getParent(), outNameInb);
		outFileIn.renameTo(newFileIn);
		outStringIn = ("file " + outNameInb);
	}

	else outStringIn = "not saved";


	if (saveout == true) {
		bwOut.close();
		// Rename file 1 with its line count
		var countK2 = Math.round(countloc2 / 1000);
		// IJ.log(countloc2);
		var outNameOutb = inName.replace(new RegExp("(_([0-9])+K)+_"), outSuffixOut + "_" + countK2 + "K_");
		if (outNameOutb == inName) outNameOutb = inNameExt[0] + outSuffixOut + "_" + countK2 + "K." + inNameExt[1];
		var newFileOut = new File(outFileOut.getParent(), outNameOutb);
		outFileOut.renameTo(newFileOut);
		outStringOut = ("file " + outNameOutb);
	}

	else outStringOut = "not saved";

	IJ.log("      Finished splitting " + countloc + " localizations based on " + roiName + ":");
	IJ.log("      " + countloc1 + " inside ("+ outStringIn + ")");
	IJ.log("      " + countloc2 + " outside (" + outStringOut + ")");

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
