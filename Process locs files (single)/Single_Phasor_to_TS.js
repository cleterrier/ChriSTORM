// Single-Phasor_to_TS.js script by Christophe Leterrier
// Calls F-Phasor_to_TS.js to add uncertainties to a phasor ThunderSTORM file
// 28/12/17

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

pxs_def = 160; // acquired sequence pixel size in nm
sig_def = 160; // sigma (PSF SD in nm)
xFac_def = 1.0369; // dilatation in X to compensate cylindrical lens (measured on microscope)
zFac_def = 2; // factor for uncertainty in Z from uncertainty in XY

var od = new OpenDialog("Choose a Thunderstorm txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nPhasor to ThunderSTORM input file path:" + path);

var gd = new GenericDialog("Phasor to ThunderSTORM: options");
gd.addNumericField("Camera pixel size", pxs_def, 0, 3, "nm");
gd.addNumericField("Sigma (PSF SD)", sig_def, 0, 3, "nm");
gd.addNumericField("Cylindrical lens correction factor", xFac_def, 4, 6, "(1=no correction)");
gd.addNumericField("Z uncertainty factor", zFac_def, 1, 3, "* XY uncertainty");
gd.showDialog();
var pxs = gd.getNextNumber();
var sig = gd.getNextNumber();
var xFac = gd.getNextNumber();
var zFac = gd.getNextNumber();

if (gd.wasOKed()) {
	var plugDir = IJ.getDirectory("plugins"); 
	plugDir = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	var PtTJS = "F-Phasor_to_TS.js";
	var PtTPath = plugDir + PtTJS;
	IJ.log("Phasor to TS path:" + plugDir + PtTJS);
	load(PtTPath);
	
	PhasorTS(path, directory, pxs, sig, xFac, zFac);
	IJ.log("Phasor to ThunderSTORM end");
}