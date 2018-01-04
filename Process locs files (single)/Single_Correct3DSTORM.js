// Single-Correct3DSTORM.js script by Christophe Leterrier
// Calls F-Correct3DSTORM.js to add uncertainties to a phasor ThunderSTORM file
// 04/01/17

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

xFac_def = 1.0369; // dilatation in X to compensate cylindrical lens (measured on microscope)

var od = new OpenDialog("Choose a Thunderstorm txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nCorrect 3D-STORM input file path:" + path);

var gd = new GenericDialog("Correct 3D-STORM: options");
gd.addNumericField("Cylindrical lens correction factor", xFac_def, 4, 6, "(1=no correction)");
gd.showDialog();
var xFac = gd.getNextNumber();

if (gd.wasOKed()) {
	var plugDir = IJ.getDirectory("plugins"); 
	plugDir = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	var PtTJS = "F-Correct3DSTORM.js";
	var PtTPath = plugDir + PtTJS;
	IJ.log("Correct 3D-STORM path:" + plugDir + PtTJS);
	load(PtTPath);
	
	Corr3DS(path, directory, xFac);
	IJ.log("Correct 3D-STORM end");
}