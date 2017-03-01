// F-NStxtTranslate.js script function by Christophe Leterrier
// Translate single-channel txt localization files from Nikon N-STORM to .csv ThunderSTORM localization files
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

function NStxtTranslate(inPath, outDir, outFormat, UseXYDriftCor, UseWarped, UseZDriftCor, factZ, PpC) {
	
	// Factor to convert sigma into FWHM
	var FWHM = 2.355;	
	// PpC is used for consistency check and background (now an input parameter)
	// var PpC = 0.1248;	
	// Need to estimate background properly independantly. Usually 80-100
	// but not important to use ThunderSTORM just for reconstruction
	// var PpC = 0.122;
	var BgdADU = 100;
	var BgdPhot = Math.round(BgdADU * PpC * 100) / 100;
	// Add support for the Z uncertainty (in TS daily buil 05 may 2014)
	var FixUncZ = false;
	// fixed sigma for Z uncertainty (if fixed)
	var fixZ = 20;
	var SampleMax = 100;

//	var PixelPitch = 160;
//	var ExposTime = 0.016;
//	var CpP = 1 / PpC;
//	var BgdCor = (BgdPhot / PixelPitch) * (BgdPhot / PixelPitch);
//	var EMfactor = 1.83;
	
	// N-STORM txt file format header (new format)
	var inHeaderNS = ["Channel Name", "X", "Y", "Xc", "Yc", "Height", "Area", "Width", "Phi", "Ax", "BG", "I", "Frame", "Length", "Link", "Valid", "Z", "Zc", "Photons", "Lateral Localization Accuracy", "Xw", "Yw", "Xwc", "Ywc"];
	var inSep = "\t";
	
	// Assign the indexes for all columns in the N-STORM txt format
	iC = 0;
	if (UseXYDriftCor == true) {
		if (UseWarped == (true)) {
			iX = 22;
			iY = 23;
		}
		else {
			iX = 3;
			iY = 4;
		}
		
	}
	else {
		if (UseWarped == (true)) {
			iX = 20;
			iY = 21;
		}
		else {
			iX = 1;
			iY = 2;	
		}
	}
	iH = 5;
	iA = 6;
	iW = 7;
	iPhi = 8;
	iAx = 9;
	iBg = 10;
	iI = 11;
	iF = 12;
	iL = 13;
	if (UseZDriftCor == true) {
		iZ = 17;
	}
	else {
		iZ = 16;
	}
	iP = 18;
	iU = 19;

	// Define input file path
	var inFile = new File(inPath); 
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);
	IJ.log("    inName: " + inName);

	// Open input File reader
	var br = new BufferedReader(new FileReader(inFile));

	// Taste the first line to detect if 2D (all Z =0) or 3D
	inLine = br.readLine();
	var inCells = inLine.split(inSep);	
	var zAccu = 0;
	var i = 0;	
	while ((inLine = br.readLine()) != null && i < SampleMax) {
		i++;
		inCells = inLine.split(inSep);
		zAccu = zAccu + parseFloat(inCells[iZ]);
	}
	if (zAccu == 0) 
		IJ.log("      2D file detected");
	else
		IJ.log("      3D file detected");

	// Close and reopen to get back at line 0
	br.close();
	br = new BufferedReader(new FileReader(inFile));
	// Pass header line
	inLine = br.readLine();

	// ThunderSTORM format
	if (outFormat == "TS") {
		var sep = ",";
		if (zAccu == 0){// 2D case
			var outHeader = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"sigma [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"", "\"detections\""];
			var outSuffix = "_TS2D";
		}
		else {
			var outHeader = ["\"frame\"","\"x [nm]\"","\"y [nm]\"","\"z [nm]\"","\"sigma1 [nm]\"","\"sigma2 [nm]\"","\"intensity [photon]\"","\"offset [photon]\"","\"bkgstd [photon]\"","\"uncertainty_xy [nm]\"", "\"uncertainty_z [nm]\"", "\"detections\""];
			var outSuffix = "_TS3D";
		}
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
			
				// sigma
				var sigma = (parseFloat(inCells[iW]) / 2).toFixed(1);

				// "offset" in TS is assimilated to backgroung in N-STORM
				var offset =  Math.round(parseFloat(inCells[iBg]) * PpC);
	
				/*
				// Check (only at first line) if the PpC is good between N-STORM file and script
				if (m == 1) {
					var i1 = parseFloat(inCells[iA]) * PpC;
					var i2 = parseFloat(inCells[iP]);
					var testPhot = Math.sqrt((i1 - i2) * (i1 - i2)) / i1;
					if (testPhot > 0.1) IJ.log(" WARNING! INCONSISTENT PHOTON COUNT");
				}
				*/

				// peak height
				var intens = Math.round(parseFloat(inCells[iP]));
				// localization uncertainty for XY (sigma)
				var uncXY = (parseFloat(inCells[iU])).toFixed(2);

				// Build results line
				if (zAccu == 0){ // 2D case
					outLine = inCells[iF] + sep + inCells[iX] + sep + inCells[iY] + sep + sigma + sep;
					outLine += intens + sep + offset + sep +  BgdPhot + sep + uncXY + sep + inCells[iL];
				}
				else { // 3D case
					// peak width: TS has Wx and Wy (astigmatism-deformed PSF), but N-STORM has only one width W and an axial ratio Ax
					// so we calculate Wx and Wy from W and Ax
					var ax = parseFloat(inCells[iAx]);			
					var sigmaX = (sigma / Math.sqrt(1 + ax * ax)).toFixed(1);
					var sigmaY = (sigma / Math.sqrt(1 + 1 / (ax * ax))).toFixed(1);
				
					outLine = inCells[iF] + sep + inCells[iX] + sep + inCells[iY] + sep + inCells[iZ] + sep + sigmaX + sep + sigmaY + sep;

					// localization uncertainty for Z (sigma)
					if (FixUncZ == true) 
						var uncZ = fixZ.toFixed(2); // case of a fixed Z uncertainty
					else 
						var uncZ = (factZ * uncXY).toFixed(2);	// case of uncertainty proportionnal to the xy uncertainty
						
					outLine += intens + sep + offset + sep +  BgdPhot + sep + uncXY + sep + uncZ + sep + inCells[iL];
				}
					
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