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

	var outSuffix1 = "_in(" + roiName +")";
	var outSuffix2 = "_out(" + roiName + ")";

	// Fields of the input header

	var outHeaderList = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"uncertainty_xy [nm]\"","\"uncertainty_z [nm]\"", "\"chi2\""];
	var xHeader = outHeaderList[1];
	var yHeader = outHeaderList[2];


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
	var outName1 = inName.replace("_TS", outSuffix1 + "_TS");
	var outPath1 = outDir + outName1;
	var outFile1 = new File(outPath1);

	// Write the header
	var outHeader = inHeader;

	var countloc = 0;
	var countloc1 = 0;
	var countloc2 = 0;
		
	if (savein == true) {
		if (!outFile1.exists()) {
			outFile1.createNewFile();
			// IJ.log("out file 1 path: " + outPath1);
		}
		var bw1 = new BufferedWriter(new FileWriter(outFile1));
		bw1.write(outHeader);
		bw1.newLine();
	}

	var outName2 = inName.replace("_TS", outSuffix2 + "_TS");
	var outPath2 = outDir + outName2;
	var outFile2 = new File(outPath2);

	if (saveout == true) {
		if (!outFile2.exists()) {
			outFile2.createNewFile();
			// IJ.log("out file 2 path: " + outPath2);
		}
		var bw2 = new BufferedWriter(new FileWriter(outFile2));
		bw2.write(outHeader);
		bw2.newLine();
	}

	// IJ.log("      outName (inside ROI): " + outName1);
	// IJ.log("      outName (outside ROI): " + outName2);
	

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		// Processing of individual values from input file lines, split by inSep
		var inCells = inLine.split(inSep);


		var xOut = (parseFloat(inCells[xIndex]) / ps);
		var yOut = (parseFloat(inCells[yIndex]) / ps);

		countloc ++;

		if (savein == true && roi.containsPoint(xOut, yOut) == true) {
			countloc1 = countloc1 + 1;
			if (savein == true) {
				bw1.write(inLine);
				bw1.newLine();
			}
		}
		if (saveout == true && roi.containsPoint(xOut, yOut) == false) {
			countloc2 = countloc2 + 1;
			if (saveout == true) {
				bw2.write(inLine);
				bw2.newLine();
			}
		}

	}
	
	br.close();
	
	
	if (savein == true) {	
		bw1.close();
		// Rename file 1 with its line count
		var countK1 = Math.round(countloc1 / 1000);
		// IJ.log(countloc1);
		var outName1b = inName.replace(new RegExp("(_([0-9])+K)+_"), outSuffix1 + "_" + countK1 + "K_");
		if (outName1b == inName) outName1b = inNameExt[0] + outSuffix1 + "_" + countK1 + "K." + inNameExt[1];
		var newFile1 = new File(outFile1.getParent(), outName1b);
		outFile1.renameTo(newFile1);
		outString1 = ("file " + outName1b);
	}

	else outString1 = "not saved";


	if (saveout == true) {
		bw2.close();
		// Rename file 1 with its line count
		var countK2 = Math.round(countloc2 / 1000);
		// IJ.log(countloc2);
		var outName2b = inName.replace(new RegExp("(_([0-9])+K)+_"), outSuffix2 + "_" + countK2 + "K_");
		if (outName2b == inName) outName2b = inNameExt[0] + outSuffix2 + "_" + countK2 + "K." + inNameExt[1];
		var newFile2 = new File(outFile2.getParent(), outName2b);
		outFile2.renameTo(newFile2);
		outString2 = ("file " + outName2b);
	}

	else outString2 = "not saved";

	IJ.log("      Finished splitting " + countloc + " localizations based on " + roiName + ":"); 
	IJ.log("      " + countloc1 + " inside ("+ outString1 + ")");
	IJ.log("      " + countloc2 + " outside (" + outString2 + ")");

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