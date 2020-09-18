
macro "Line ROIs To Slices" {

	sliceWN_def = 2000; // width of each slice in nm
	sliceTN_def = 800; // thickness of each slice in nm
	sliceSN_def = 400; // spacing between two consecutive slices in nm

	Dialog.create("Line ROIs To Slices: options");
	Dialog.addNumber("Slice width", sliceWN_def, 0, 4, "nm");
	Dialog.addNumber("Slice thickness", sliceTN_def, 0, 4, "nm");
	Dialog.addNumber("Slices spacing", sliceSN_def, 0, 4, "nm");
	Dialog.show();
	sliceWN = Dialog.getNumber();
	sliceTN = Dialog.getNumber();
	sliceSN = Dialog.getNumber();

	scaleFactor = 1000; // from µm to nm
	getPixelSize(unit, pixelWidth, pixelHeight);

	sliceW = sliceWN / (scaleFactor * pixelWidth); // slice width in pixels
	sliceT = sliceTN / (scaleFactor * pixelWidth); // slice thickness in pixels
	sliceS = sliceSN / (scaleFactor * pixelWidth); // slice spacing in pixels

	// determine if run in batch (ROIs in ROI manager) or single active ROI
	rN = roiManager("count");
	if (rN > 0) multiROI = true;
		else {
			multiROI = false;
			rN = 1;
		}

	// loop on ROIs
	for (r = 0 ; r < rN; r++) {

		if (multiROI == true) {
			roiManager("select", r);
			// roiManager("delete");
			// run("Restore Selection");
		}
		
		run("Fit Spline");
		run("Interpolate", "interval=1 adjust");
		getSelectionCoordinates(x, y);
	
		roiL = x.length; // ROI length in pixels
	
		for (i = 1; i < roiL-1;  i = i + sliceS) {
	
			// perpendicular to local curve that goes through x,y has equation y = a*x + b
			a = - (x[i+1] - x[i-1]) / (y[i+1] - y[i-1]);
			b = y[i] - a * x[i];
	
			// Consider the segment (x1,y1) to (x2,y2) along line y = ax + b perpendicular to local curve
			// If the segemnt has a length L and x,y as middle:
			// (x1-x)^2 + (y1-y)^2 = L^2/4 [1]
			// but also a*x1 + b = y1 and a*x + b = y, subtracting second to first gives:
			// a(x1-x) = y1-y [2]
			// substituting [2] into [1] gives
			// (x1-x)^2 * (1+a^2) = L^2/4
			// which gives the two solutions
			// x1 = x + √(L^2/4 / (1+a^2)) and y1 = ax1 + b
			// x2 = x - √(L^2/4 / (1+a^2)) and y2 = ax2 + b
	
			xS = Math.sqrt(sliceW * sliceW / (4 * (1 + a*a)));
			x1 = x[i] - xS;
			y1 = a * x1 + b;
			x2 = x[i] + xS;
			y2 = a * x2 + b;
	
			makeLine(x1, y1, x2, y2, sliceT);
			roiManager("add");	
		}	
	}	
	
	roiManager("Show All");
}
