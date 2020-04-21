// F-TSRotate.js script function by Christophe Leterrier
// Rotate ThunderSTORM txt localization files coordinate of a given angle
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.java.io.File);
importClass(Packages.java.io.FileReader);
importClass(Packages.java.io.FileWriter);
importClass(Packages.java.io.BufferedReader);
importClass(Packages.java.io.BufferedWriter);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);

function TSRotate(inPath, outDir, Xc, Yc, angle, h, v, zd) {


	// separators (csv files)
	inSep = ",";
	sep = ",";

	// Define input and output files, folder etc.
	var inFile = new File(inPath);
	var inName = inFile.getName();
	var inNameExt = getExt("" + inName);

	if (angle != 0) var outString = "rot" + angle;
	else var outString = "";
	if (h == true) outString = outString + "fH";
	if (v == true) outString = outString + "fV";
	if (zd == true) outString = outString + "fZ";
	var outName = inName.replace("TS3D", outString + "_TS3D");
	var outName = outName.replace("TS2D", outString + "_TS2D");

	var outPath = outDir + outName;
	var outFile = new File(outPath);

	IJ.log("     inName: " + inName);

	if (!outFile.exists()) {
		outFile.createNewFile();
	}

	var br = new BufferedReader(new FileReader(inFile));
	var bw = new BufferedWriter(new FileWriter(outFile));

	IJ.log("  outName: " + outName);

	// Write header
	inLine = br.readLine();
	bw.write(inLine);
	bw.newLine();

	var m = 0;

	// Write the output file line by line
	while ((inLine = br.readLine()) != null) {

			m++;
			var inCells = inLine.split(inSep);

			var X = inCells[1];
			var Y = inCells[2];
			if (zd == true) var Z = inCells[3];

			if (angle != 0) {
				var XYn = rotateXY(X, Y, Xc, Yc, angle);
				var Xn = XYn[0];
				var Yn = XYn[1];
			}
			else {
				var Xn = X;
				var Yn = Y;
			}

			if (h == true) {
				XYn = flipH(Xn, Yn, Yc);
				Xn = XYn[0];
				Yn = XYn[1];
			}

			if (v == true) {
				XYn = flipV(Xn, Yn, Xc);
				Xn = XYn[0];
				Yn = XYn[1];
			}

			if (zd == true) {
				Zn = -Z;
			}

			if (zd == true) {
				outLine = inCells[0] + sep + Xn + sep + Yn + sep + Zn;
				for (var t= 4; t < inCells.length; t++) {
					outLine = outLine + sep + inCells[t];
				}
			}
			else {
				outLine = inCells[0] + sep + Xn + sep + Yn;
				for (var t= 3; t < inCells.length; t++) {
					outLine = outLine + sep + inCells[t];
				}
			}
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

function rotateXY(x, y, xm, ym, a){
	// Convert to radians because that's what JavaScript likes
	a = a * Math.PI / 180,

    // Subtract midpoints, so that midpoint is translated to origin
    // and add it in the end again
    xr = (x - xm) * Math.cos(a) - (y - ym) * Math.sin(a)   + xm,
    yr = (x - xm) * Math.sin(a) + (y - ym) * Math.cos(a)   + ym;

    return [xr, yr];
}

function flipH(x, y, m) {
	xf = m - (x-m);
	return [xf, y];
}

function flipV(x, y, m) {
	yf = m - (y-m);
	return [x, yf];
}
