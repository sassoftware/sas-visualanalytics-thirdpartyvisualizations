* The JSON file this job expects contains the JSON message         ;
* that SAS Visual Analytics sent to the Data-Driven Content object.;
* It contains not only data, but also column metadata.             ;

*==================================================================;
* Initialization;
*==================================================================;

* Retrieve JSON data from uploaded file;
filename vaJSON filesrvc "&_WEBIN_FILEURI";

* Use the JSON engine to provide read-only sequential access to JSON data;
libname jsonLib json fileref=vaJSON;

*==================================================================;
* Main Processing;
*==================================================================; 

* Generate and send back ODS output table;
proc print data=jsonLib.data label noobs; 
run;

*==================================================================;
* Finalization;
*==================================================================;

* No finalization required in this simple example;
