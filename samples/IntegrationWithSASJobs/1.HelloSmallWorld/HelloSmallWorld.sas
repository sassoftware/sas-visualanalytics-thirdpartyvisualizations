* The JSON file this job expects contains the JSON message         ;
* that SAS Visual Analytics sent to the Data-Driven Content object.;
* It contains not only data, but also column metadata.             ;

* Application input parameter:                                     ;
* vaJSON - the stringified JSON message that VA sent to the DDC    ;

*==================================================================;
* Initialization;
*==================================================================;

* Copy the JSON data from input parameter to a temp file;
filename vaJSON temp;

data _null_;
  file vaJSON;
  length str $32767;
  str = resolve(symget('vaJSON'));
  put str;
run;

* Use the JSON engine to provide read-only sequential access to JSON data;
libname jsonLib json fileref=vaJSON;

*==================================================================;
* Main Processing;
*==================================================================; 

* Generate and send back ODS output table;
proc print data=jsonLib.data; 
run;

*==================================================================;
* Finalization;
*==================================================================;

* No finalization steps required in this simple example;
