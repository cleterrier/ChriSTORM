// Single ThunderSTORM Rotate script by Christophe Leterrier
// Calls F-TSRotate.js to rotate the localizations in a ThunderSTORM file
// See https://github.com/cleterrier/ChriSTORM/blob/master/Readme.md

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);

var rot_def = 90;
var fh_def = false;
var fv_def = false;

var od = new OpenDialog("Choose a Thunderstorm txt file", "");
var directory = od.getDirectory();
var name = od.getFileName();
var path = directory + name;
IJ.log("\nRotator input file path:" + path);

var gd = new GenericDialog("Rotator: options");
gd.addNumericField("Rotation angle", rot_def, 0, 3, "deg");
gd.addCheckbox("Flip horizontally", fh_def);
gd.addCheckbox("Flip vertically", fv_def);
gd.showDialog();
var rotAngle = gd.getNextNumber();
var fh = gd.getNextBoolean();
var fv = gd.getNextBoolean();

if (gd.wasOKed()) {
	var plugDir = IJ.getDirectory("imagej");
	plugDir = plugDir + "scripts" + File.separator + "NeuroCyto" + File.separator + "ChriSTORM" + File.separator + "Routines" + File.separator;
	var rotateJS = "F-TSRotate.js";
	var rotatePath = plugDir + rotateJS;
	IJ.log("Rotator path:" + plugDir + rotateJS);
	load(rotatePath);

	TSRotate(path, directory, rotAngle, fh, fv);
	IJ.log("Single Rotate Locs end");
}
