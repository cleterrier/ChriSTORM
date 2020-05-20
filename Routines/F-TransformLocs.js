// F-TransformLocs.js script function by Christophe Leterrier
// Process csv localizations file to add things: localization transform (translation, scaling, rotation, flipping), add Z uncertainty from xy uncertainty

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
// xTrans, ytrans, zTrans: translation (in nm) in X, Y and Z
// xFactor, yFactor, zFactor: scaling in X, Y and Z
// xCenter, yCenter, rotAngle: oration around (xCenter, yCenter) (in nm) of rotAngle
// flipV, flipH: (booleans) flip vertically/horizontally
// uFactor: scaling of xy uncertainty
// zUnc: creation of Z uncertainty by xy uncertainty scaling

function TransformLocs(inPath, outDir, doSmall, xTrans, yTrans, zTrans, xFactor, yFactor, zFactor, xCenter, yCenter, rotAngle, flipV, flipH, uFactor, zUnc) {

	// separators (csv files)
	var inSep = ",";
	var sep = ",";

	var xHeader = "\"x [nm]\"";
	var yHeader = "\"y [nm]\"";
	var zHeader = "\"z [nm]\"";
	var uxyHeader = "\"uncertainty_xy [nm]\"";
	var uzHeader = "\"uncertainty_z [nm]\"";

	// Define input files, folder, open it etc.
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);

	var br = new BufferedReader(new FileReader(inFile));

	IJ.log("    inName: " + inName);

	// Get the header line and find index of Z, intensity, background and x coordinate columns
	var inHLine = br.readLine();
	//IJ.log("inHLine: " + inHLine);
	var inHeader = inHLine.split(inSep);

	var xIndex = arrayFind(inHeader, xHeader);
	var yIndex = arrayFind(inHeader, yHeader);
	var zIndex = arrayFind(inHeader, zHeader);
	var uxyIndex = arrayFind(inHeader, uxyHeader);
	var uzIndex = arrayFind(inHeader, uzHeader);

	// IJ.log("indexes: xIndex=" + xIndex + ", yIndex=" + yIndex + ",zIndex=" + zIndex + ",uxyIndex=" + uxyIndex + ",uzIndex=" + uzIndex);

	// Generate output name and path, open file writer
	if (zIndex > -1) {
		var outName = inName.replace("TS3D", "transfo_TS3D");
	}
	else {
		var outName = inName.replace("TS2D", "transfo_TS2D");
	}
	if (outName == inName) outName = inNameExt[0] + "_transfo." + inNameExt[1];
	var outPath = outDir + outName;
	var outFile = new File(outPath);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}
	var bw = new BufferedWriter(new FileWriter(outFile));

	IJ.log("      outName: " + outName);

	// New header
	outHLine = inHLine;
	// Add Z uncertainty column only if there is a Z coordinate column and Z uncertainty not already existing
	if (zIndex > -1 && zUnc != 0) {
		if (uzIndex == -1) {
			IJ.log("      adding Z uncertainty");
			var outHLine = outHLine + sep + uzHeader;
		}
		else {
			IJ.log("      replacing Z uncertainty");
		}
	}

	bw.write(outHLine);
	bw.newLine();

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

		var inCells = inLine.split(inSep);

		// translate X
		if (xTrans != 0) {
			var X = Double.parseDouble(inCells[xIndex]);
			var xC= X + xTrans;
			var xCS = xC.toFixed(1);
			inCells[xIndex] = xCS;
		}

		// translate Y
		if (yTrans != 0) {
			var Y = Double.parseDouble(inCells[yIndex]);
			var yC= Y + yTrans;
			var yCS = yC.toFixed(1);
			inCells[yIndex] = yCS;
		}

		// translate Z
		if (zIndex > -1 && zTrans != 0) {
			var Z = Double.parseDouble(inCells[zIndex]);
			var zC= Z + zTrans;
			var zCS = zC.toFixed(1);
			inCells[zIndex] = zCS;
		}

		// scaling X
		if (xFactor != 1) {
			var X = Double.parseDouble(inCells[xIndex]);
			var xC= X * xFactor;
			var xCS = xC.toFixed(1);
			inCells[xIndex] = xCS;
		}

		// scaling Y
		if (yFactor != 1) {
			var Y = Double.parseDouble(inCells[yIndex]);
			var yC= Y * yFactor;
			var yCS = yC.toFixed(1);
			inCells[yIndex] = yCS;
		}

		// scaling Z
		if (zIndex > -1 && zFactor != 1) {
		var Z = Double.parseDouble(inCells[zIndex]);
		var zC= Z * zFactor;
		var zCS = zC.toFixed(1);
		inCells[zIndex] = zCS;
		}

		// rotate localizations
		if (rotAngle != 0) {
			var X = Double.parseDouble(inCells[xIndex]);
			var Y = Double.parseDouble(inCells[xIndex]);
			var XYrot = rotateXY(X, Y, xCenter, yCenter, rotAngle);
			var xCS = XYrot[0].toFixed(1);
			var yCS = XYrot[1].toFixed(1);
			inCells[xIndex] = xCS;
			inCells[yIndex] = yCS;
		}

		// flip vertically
		if (flipV == true) {
			var X = Double.parseDouble(inCells[xIndex]);
			var Y = Double.parseDouble(inCells[xIndex]);
			var XYrot = flipVcoor(X, Y, xCenter, yCenter, rotAngle);
			var xCS = XYrot[0].toFixed(1);
			var yCS = XYrot[1].toFixed(1);
			inCells[xIndex] = xCS;
			inCells[yIndex] = yCS;
		}

		// flip horizontally
		if (flipH == true) {
			var X = Double.parseDouble(inCells[xIndex]);
			var Y = Double.parseDouble(inCells[xIndex]);
			var XYrot = flipHcoor(X, Y, xCenter, yCenter, rotAngle);
			var xCS = XYrot[0].toFixed(1);
			var yCS = XYrot[1].toFixed(1);
			inCells[xIndex] = xCS;
			inCells[yIndex] = yCS;
		}

		// Scale XY uncertainty
		if (uFactor != 1) {
			var Uxy = Double.parseDouble(inCells[uxyIndex]);
			var UxyC= Uxy * uFactor;
			var UxyCS = UxyC.toFixed(1);
			inCells[uxyIndex] = UxyCS;
		}

		// add Z uncertainty
		if (zIndex > -1 && zUnc != 0) {
			var Uxy = Double.parseDouble(inCells[uxyIndex]);
			var Uz= Uxy * zUnc;
			var UzS = Uz.toFixed(1);
			if (uzIndex > -1) inCells[uzIndex] = UzS;
		}

		// Write new line
		var outLine = inCells[0];
		for (i = 1; i < inCells.length; i++) outLine = outLine + sep + inCells[i];

		// Add Z uncertainty if not present
		if (zIndex > -1 && uzIndex == -1) outLine = outLine + sep + UzS;

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
		testS = a[i];
		if (testS.indexOf(s)>-1 && testS.indexOf(s)<3) index = i;
	}
	return index;
}

function rotateXY(x, y, xm, ym, a){
	// Convert to radians because that's what JavaScript likes
	a = a * Math.PI / 180,

    // Subtract midpoints, so that midpoint is translated to origin
    // and add it in the end again
    xr = (x - xm) * Math.cos(a) - (y - ym) * Math.sin(a)   + xm,
    yr = (x - xm) * Math.sin(a) + (y - ym) * Math.cos(a)   + ym;

    return [xr, yr];
}

function flipHcoor(x, y, m) {
	xf = m - (x-m);
	return [xf, y];
}

function flipVcoor(x, y, m) {
	yf = m - (y-m);
	return [x, yf];
}
