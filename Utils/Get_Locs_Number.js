// Get_Locs_Number.js script by Christophe Leterrier
// Get the number of localizations per frame from a ThunderSTORM csv file
// 07/05/2019

importClass(Packages.ij.io.OpenDialog)
importClass(Packages.java.io.File)
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.GenericDialog);
importClass(Packages.ij.IJ);
importClass(Packages.java.lang.Double);
importClass(Packages.ij.measure.ResultsTable);
importClass(Packages.cz.cuni.lf1.lge.ThunderSTORM.results.IJResultsTable)


	var od = new OpenDialog("Choose a Thunderstorm txt file", "");
	
	// var gd = new GenericDialog("Get Locs Numbers option");
	// gd.showDialog();
	
	var directory = od.getDirectory();
	var name = od.getFileName();
	var path = directory + name;
	IJ.log("\nGet Locs Number");
	IJ.log("input file path:" + path);

	var inFile = new File(path); 
	var inName = inFile.getName();

	IJ.log("inName: " + inName);
	
	// Get the number of locs for each frame
	var LocCount = getLN(path);

	// Initialize the Results Table
	var ot = new ResultsTable();
	var rowr = -1;
	for (var r = 0; r < LocCount.length-1; r++) {
		//log to Results Table
		ot.incrementCounter();
		rowr++;
		ot.setValue("Frame", rowr, r + 1);
		var c = parseInt(LocCount[r +1 ]);
		ot.setValue("Locs #", rowr, c);
	}
	ot.show(inName + "_Locs_Number");


IJ.log("Been there, done GetLocsNumbering");

function getLN(ip) {

	IJ.run("Import results", "append=false startingframe=1 rawimagestack= filepath=[" + ip + "] livepreview=false fileformat=[CSV (comma separated)]");
	
	var rt = IJResultsTable.getResultsTable();
	var rows = rt.getRowCount();
	var colf = rt.findColumn("frame");

	var count = new Array();

	var val1 = parseInt(rt.getValue(1, colf));
	var nf = 1;
	
	for (var row = 2; row < rows; row++) {
	
		var val = parseInt(rt.getValue(row, colf));
//		IJ.log(val);
//		IJ.log(val1);
//		IJ.log("");
		if (val == val1) {
			nf = nf + 1;
		}
		else {
			nf = nf + 1;
			count[val1] = nf;
//			IJ.log("frame " + val1 + " - " + nf + " locs");
			nf = 0;
			val1 = val; 
		}
	}
	nf = nf + 1;
	count[val1] = nf;
	for (var i = 0; i < count.length; i++) {
		if (isNaN(count[i]) == true) count[i] = 0;
	}
//	IJ.log("frame " + val1 + " - " + nf + " locs");
	
	return count;
}