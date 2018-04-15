// Single NSTORM to ThunderSTORM script by Christophe Leterrier
// Translate single-channel txt localization files from Nikon N-STORM to .csv ThunderSTORM localization files
// Calls F-NStxtTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Output format
var outFormat = "TS";

// Default options
var xydrift_def = true;
var warp_def = true;
var zdrift_def = true;
var zfactor_def = 2;
var ppc_def = 0.1248;
var xcorr_def = true;

var od = new OpenDialog("Choose a single-channel N-STORM txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nTranlator input file path:" + path);

// Options
var gd = new GenericDialog("Translator Options");
gd.addCheckbox("Use drift-corrected XY coordinates", xydrift_def);
gd.addCheckbox("Use warp-corrected coordinates", warp_def);
gd.addCheckbox("Use drift-corrected Z coordinates", zdrift_def);
gd.addNumericField("Z uncertainty factor", zfactor_def, 1, 3, "* XY uncertainty");
gd.addNumericField("Photons per count", ppc_def, 4, 6, "ph/ADU");
gd.addCheckbox("Correct astigmatism compression", xcorr_def);
gd.showDialog();
var xydrift = gd.getNextBoolean();
var warp = gd.getNextBoolean();
var zdrift = gd.getNextBoolean();
var zfactor = gd.getNextNumber();
var ppc = gd.getNextNumber();
var xcorr = gd.getNextBoolean();

if (gd.wasOKed()) {
	var plugDir = IJ.getDirectory("imagej");
	plugDir = plugDir + "scripts" + File.separator + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	var translateJS = "F-NStxtTranslate.js";
	var translatePath = plugDir + translateJS;
	IJ.log("Translator path:" + plugDir + translateJS);
	load(translatePath);

	NStxtTranslate(path, directory, outFormat, xydrift, warp, zdrift, zfactor, ppc, xcorr);
	IJ.log("Single NS to TS end");
}
