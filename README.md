# ChriSTORM: ImageJ scripts and macros for processing ThunderSTORM images

## Presentation
ChriSTORM is a series of ImageJ scripts and macros that aim to complement the ThunderSTORM plugin for ImageJ:
- Translate localization text files obtained from the Nikon N-STORM software into ThunderSTORM localization files.
- Batch process ThunderSTORM localization files: drift correction, filtering.
- Process a ThunderSTORM localization file in order to rotate or flip the resulting image.
- Batch generate image reconstructions from ThunderSTORM localization files.

## Compatibility and Installation
Installing ThundersTORM
- ChriSTORM is used under OSX and Windows 7 inside a [Fiji install](http://fiji.sc/Downloads)) or using an updated [ImageJ install](http://rsbweb.nih.gov/ij/download.html). Due to the current work around javascript compatibility for Java 8, the scripts will only run using Java 6.
- To use ChriSTORM, you first have to [download the ThunderSTORM plugin](https://github.com/zitmen/thunderstorm/releases). ChriSTORM 1.0 has been tested with the latest dev-2016-09-10-b1.jar daily build. Install ThunderSTORM by renaming the .jar file into “Thunder_STORM.jar” and placing it in the ImageJ/Fiji “plugins” folder.
You can directly use ChriSTORM by manually donwloading and installing it
- Download the latest ChriSTORM folder as a [zip file from the releases section](https://github.com/cleterrier/ChriSTORM/releases).
- Unzip the folder, rename it “ChriSTORM” and place it into ImageJ/Fiji “plugins” folder.
- Move the “ThunderSTORM.lut” file from the ChriSTORM folder to the ImageJ/Fiji “luts” folder.
- Restart ImageJ/Fiji.
Alternatively, you can use the NeuroCyto Lab [Fiji update site](https://www.evernote.com/l/AAIk_1e-n91KsplwdjvrCj3ighQUDYYAVD8) that includes ChriSTORM.

##References
If you use ChriSTORM in a publication, please cite:  
Leterrier C, Potier J, Caillol G, Debarnot C, Rueda Boroni F, Dargent B.  
Nanoscale Architecture of the Axon Initial Segment Reveals an Organized and Robust Scaffold.  
Cell Rep. 2015 Dec 29;13(12):2781-93. [doi:10.1016/j.celrep.2015.11.051.](http://dx.doi.org/10.1016/j.celrep.2015.11.051)

Additionally, the relevant publication for the ThunderSTORM plugin is:  
Ovesný M, Křížek P, Borkovec J, Svindrych Z, Hagen GM.  
ThunderSTORM: a comprehensive ImageJ plug-in for PALM and STORM data analysis and super-resolution imaging.  
Bioinformatics. 2014 Aug 15;30(16):2389-90. [doi: 10.1093/bioinformatics/btu202.](http://dx.doi.org/10.1093/bioinformatics/btu202)

More information on ThunderSTORM can be found at its [GitHub page](http://zitmen.github.io/thunderstorm/) or its [Google discussion group](http://zitmen.github.io/thunderstorm/).

## Scripts and macros detail

The folder (and its presentation in the “Plugins” menu) is divided in several parts.

### 1. “Process locs files (batch)” folder
This folder contains the scripts to manipulate localization text files in batch (all files within a given folder).  

#### 1a. “Batch NS Into TS” script
This scripts chains the “Batch NS Split” with the “Batch NS Translate” scripts (see below) to translate multi-channel NSTORM localization files (.txt) into single-channel ThunderSTORM localization files (.csv). From an input “Locs” folder, sequential output folders “Locs Split” and “Locs TS” are created. Options are:
- *Use drift-corrected XY coordinates*: extracts the drift-corrected X and Y coordinates from the NSTORM localization file, rather than the uncorrected coordinates. Checked by default.
- *Use warp-corrected coordinates*: extracts the warp-corrected X, Y and Z coordinates from the NSTORM localization file (corrected for  chromatic aberration between different emitter channels), rather than the uncorrected coordinates. Checked by default.
- *Use drift-corrected Z coordinates*: extracts the drift-corrected Z coordinates from the NSTORM localization file, rather than the uncorrected coordinates. Checked by default.
- *Z uncertainty factor*: The NSTORM software does not compute a value for the Z localization uncertainty. To approximate the loss in precision for the Z localization compared to the XY precision, the Z uncertainty is calculated as a multiple of the XY uncertainty. The Z uncertainty factor is the multiplicative factor applied : ∆Z = Zuf * ∆XY. Default value: 2 (corresponds to the experimentally-determined relation betwen ∆Z and ∆XY on our microscope, should be approximatively the same elsewhere).

#### 1b. “Batch NS Split” script
This script splits multi-channel NSTORM localization files from a folder named “Locs” into several NSTORM localization files (one per channel) in a folder named “Locs Split”. In addition, the total number of localizations contained in the file is added to the names of the output files (i.e. 144K = 144,000 localizations). It is identical to the first part of the “Batch NS into TS” script. There are no options.

#### 1c. “Batch NS Translate” script
This scripts translates a single-channel NSTORM localization file (.txt) into a single-channel ThunderSTORM localization file (.csv). It is identical to the second part of the “Batch NS into TS” script, and the options are the same (see above).

#### 1d. “Batch Process Locs” macro
Once localization files have been converted into the ThunderSTORM format, this macro processes ThunderSTORM localization files as a batch. The input localization files (usually in the “Locs TS” folder) are filtered and new localization files are saved in a “Locs TS proc” folder. Several processing features of the ThunderSTORM plugin are available in the macro dialog:
- *Choose files based on name*: allows to restrict processing to localization files chosen by name. Can be useful to only process files from a certain channel for example. Check this box and enter the string used to identify files to be processed in the *Name contains* box. 
- *Correct drift*: check this box to apply ThunderSTORM drift correction by autocorrelation to each localization file. The drift correction parameters *Number of bins for sub-images* and *Magnification for cross-correlation* correspond to the respective options in the ThunderSTORM plugin interface.
- *Filter by photon number*: check this box to filter localizations based on the number of photons emitted. Fill the *Minimum* and *Maximum* photon numbers that are allowed in the filtered file.
- *Filter by expression*: check this box and fill the *Expression* text line to apply the ThunderSTORM filtering by algebraic expression (see ThunderSTORM help), allowing to filter localization based on any parameter in the Results Table (frame, uncertainty, number of detections etc.).
- *Filter by density*: check this box to filter localization file based on local density (remove all localizations that don't have a minimum number of localizations at a given radius). The parameters correspond to the respective options in the ThunderSTORM plugin: interface: *Filter radius*, *Min loc number*, *Filter dimension* (to calculate density in 2D or 3D).
- *Export as .tsf*: Instead of saving a .csv files, it is possible to export localization file as .tsf, a format that is read by RapidSTORM for example.

#### 1e. “Batch TS to VISP” script
This script translates single-channel ThunderSTORM localization files into files readable by the [VISP visualization program](http://dx.doi.org/10.1038/nmeth.2566). The .2dlp and .3dlp VISP localization files obtained contain localization coordinates and their associated uncertainties. The script outputs files into the “Locs VISP” folder. There are no options.

### 2. “Process Locs files (single)” folder
This folder contains several processing scripts that are applied on individual localization files, and export a new localization file next to the input file.

#### 2a. "Single NS Into TS” script
This is the single-file equivalent to the “Batch NS into TS” script: it splits and translates an NSTORM .txt localization file into one or several ThunderSTORM .csv localization files. The options are identical to the corresponding batch script.

#### 2b. "Single NS Split” script
This is the single-file equivalent to the “Single NS Split” script: it splits a multi-channel NSTORM .txt localization file into several NSTORM .txt localization files. There are no options.

#### 2c. "Single TS rotate” script
This script is used to rotate the coordinates of localizations in a ThunderSTORM .csv localization file. It generates a new ThunderSTORM localization file with the rotated coordinates. The parameters are the *Rotation angle* (in degrees, positive is clockwise), and checkboxes to transform localizations in order to *Flip horizontally* or *Flip vertically* the resulting image. The name of the output localization file is modified by appending the angle of the rotation (“rot30)” and “H” or “V” if flipping has been performed.

#### 2d. "Single TS to VISP” script
This is the single-file equivalent to the “Batch TS to VISP” script: it translates a ThunderSTORM .csv localization file into a VISP .2dlp or .3dlp localization file. There are no options.

### 3. “Reconstruct images (batch)” folder
This folder contains macros that are used to reconstruct images from localization files

#### 3a. “Generate Reconstructions” macro
This macro operates on a folder containing ThunderSTORM localization files (usually the “Locs TS” or “Locs TS proc” folders). It generates reconstructed images from these files. The resulting images are stored in a “Recs TS” or “Recs TS proc” folder. There are various options:
- *Raw pixel size*: in order for the reconstuction to be acurate, it is necessary to know the size of a pixel on the raw image (the one coming from the camera). With a 512x512 pixels EMCCD it is usually 160 nm (default value).
- *Final pixel size*: the pixel size used for the reconstructed image. Default: 16 nm.
- *3D (will just process 3D files)*: if checked, will generate 3D reconstructions, but just for files that have been identified as 3D (non-zero Z coordinates). The output will be a Z-stack (but a 2D image if *Z-colorized* option is chosen). The next options are active only for the 3D reconstruction: *Z spacing* is the spacing between the Z planes in the reconstructed 3D image. *Z min* and *Z max* define the Z range for the reconstruction. There is an *Auto Z-range* checkbox to automatically determine the Z range from the coordinates in each localization file. One can override Z uncertainties values in the file using the *Force Z uncertainty (0 to keep)* box. Finally, if the *Z colorized* option is checked, the Z stack is projected after coloring each plane in order to code the Z coordinates in color. It uses the ThunderSTORM.lut file included with ChriSTORM, that has to be put in the ImageJ/Fiji *luts* folder.
- *Gaussian blur (0 for no filter)* applies a Guaussian blur on the reconstructued image to smoothen the spotty appearance. Typical values are 0.5X-1X the size of the reconstructed image pixel (8 nm for a 16 nm/px reconstruction, 4 nm for a 4 nm/px reconstruction).
- *Convert to 16-bit (non-colorized only)*: ThunderSTORM reconstructed images are 32-bit (this is why they sometimes appear completely black before contrast adjustment), this allows to convert them to 16-bit before saving them.
- *Adjust contrast*: If this box is checked, an automatic contrast enhancement will be performed using the *Saturated pixels* value as the percentage of saturated pixels in the enhanced image.

#### 3b. “Generate Zooms & Slices” macro
This macro is difficult to use due to its complexity and requirements about the location of all files (localizations, reconstructed images). It is thus not documented and is only included as an example of how bad a coder I am.

### 4 “Routines” folder
This folder contains various functions that are called by the scripts, do not appear in the plugins menu and are not supposed to be run directly.
