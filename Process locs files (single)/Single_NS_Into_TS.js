// Single NSTORM to ThunderSTORM script by Christophe Leterrier
// Translate single-channel txt localization files from Nikon N-STORM to .csv ThunderSTORM localization files
// Calls F-NStxtTranslate.js
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

// Default options
xydrift_def = true;
warp_def = true;
zdrift_def = true;
zfactor_def = 2;
// ppc_def = 0.1248;

var od = new OpenDialog("Choose an N-STORM txt file", "");
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
// gd.addNumericField("Photons per count", ppc_def, 4, 6, "ph/ADU");
gd.showDialog();
var xydrift = gd.getNextBoolean();
var warp = gd.getNextBoolean();
var zdrift = gd.getNextBoolean();
var zfactor = gd.getNextNumber();
// var ppc = gd.getNextNumber();

if (gd.wasOKed()) {
	var plugDir = IJ.getDirectory("plugins"); 
	plugDir = plugDir + "NeuroCyto Lab" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	var translateJS = "F-NStxtTranslate.js";
	var translatePath = plugDir + translateJS;
	IJ.log("Translator path:" + plugDir + translateJS);
	load(translatePath);
	
	NStxtTranslate(path, directory, "TS", xydrift, warp, zdrift, zfactor);
	IJ.log("Single NS to TS end");
}