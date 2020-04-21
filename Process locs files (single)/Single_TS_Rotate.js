// Single ThunderSTORM Rotate script by Christophe Leterrier
// Calls F-TSRotate.js to rotate the localizations in a ThunderSTORM file
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

var w_def = 256;
var h_def = 256;
var px_def = 160;
var rot_def = 0;
var fh_def = false;
var fv_def = false;
var fz_def = false;

var od = new OpenDialog("Choose a Thunderstorm txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nRotator input file path:" + path);

var gd = new GenericDialog("Rotator: options");
gd.addNumericField("Raw data width", w_def, 0, 5, "pixels");
gd.addNumericField("Raw data height", h_def, 0, 5, "pixels");
gd.addNumericField("Raw data pixel size", px_def, 0, 5, "nm");
gd.addNumericField("Rotation angle", rot_def, 0, 3, "deg");
gd.addCheckbox("Flip horizontally", fh_def);
gd.addCheckbox("Flip vertically", fv_def);
gd.addCheckbox("Flip in Z", fz_def);
gd.showDialog();
var imW = gd.getNextNumber();
var imH = gd.getNextNumber();
var pxS = gd.getNextNumber();
var rotAngle = gd.getNextNumber();
var fh = gd.getNextBoolean();
var fv = gd.getNextBoolean();
var fz = gd.getNextBoolean();

if (gd.wasOKed()) {

	var centerX = (imW * pxS / 2);
	var centerY = (imH * pxS / 2);

	var plugDir = IJ.getDirectory("imagej");
	plugDir = plugDir + "scripts" + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	var rotateJS = "F-TSRotate.js";
	var rotatePath = plugDir + rotateJS;
	IJ.log("Rotator path:" + plugDir + rotateJS);
	load(rotatePath);

	TSRotate(path, directory, centerX, centerY, rotAngle, fh, fv, fz);
	IJ.log("Single Rotate Locs end");
}
