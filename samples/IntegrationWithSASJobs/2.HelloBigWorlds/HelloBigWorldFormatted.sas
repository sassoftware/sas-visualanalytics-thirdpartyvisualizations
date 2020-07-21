* The JSON file this job expects contains the modified JSON message;
* that SAS Visual Analytics sent to the Data-Driven Content object.;
* It contains transformed data and additional column metadata.     ;

*==================================================================;
* Initialization;
*==================================================================;

* This allows for unconventional column names (e.g.: spaces, etc.);
options VALIDVARNAME=any;

* Retrieve JSON data from uploaded file;
filename vaJSON filesrvc "&_WEBIN_FILEURI";

* Use the JSON engine to provide read-only sequential access to JSON data;
libname jsonLib json fileref=vaJSON;

* Create table to assist creation of JSON map file;
* Replace blank spaces in column names with underscore (_);
* Output table contains column name, label, type, format, format width, and format precision;
%macro prepColMetadata;
  %if %sysfunc(exist(jsonLib.columns_format)) %then %do;
	proc sql noprint;
	  create table col_metadata as (
	    select 
	         c.ordinal_columns, translate(trim(c.label),'_',' ') as column, 
	         c.label, 
	         c.type4job as type,
	         f.name4job as fmt_name,
	         f.width4job as fmt_width,
	         f.precision4job as fmt_precision
	    from jsonLib.columns c left join jsonLib.columns_format f
	    on c.ordinal_columns = f.ordinal_columns
	  );
	quit;
  %end;
  %else %do;
    * table columns_format does not exsist;
    * all columns are strings (no format object in the JSON structure);
	proc sql noprint;
	  create table col_metadata as (
	    select 
	         c.ordinal_columns, translate(trim(c.label),'_',' ') as column, 
	         c.label, 
	         c.type4job as type,
	         "" as fmt_name,
	         . as fmt_width,
	         . as fmt_precision
	    from jsonLib.columns c 
	  );
	quit;
  %end;
%mend;

%prepColMetadata;

filename jmap temp lrecl=32767;

* Create JSON map file to be used to read VA JSON with proper labels, formats, types, etc.;
data _null_;
  file jmap;
  set col_metadata end=eof;
  if _n_=1 then do;
    put '{"DATASETS":[{"DSNAME": "data_formatted","TABLEPATH": "/root/data","VARIABLES": [';
  end;
  else do;
    put ',';
  end;
  if fmt_name ne "" then
    line=cats('{"PATH":"/root/data/element',ordinal_columns,
              '","NAME":"',column,
              '","LABEL":"',label,
              '","TYPE":"',type,
              '","FORMAT":["',fmt_name,'",',fmt_width,',',fmt_precision,']}');
  else
    line=cats('{"PATH":"/root/data/element',ordinal_columns,
              '","NAME":"',column,
              '","LABEL":"',label,
              '","TYPE":"',type,'"}');
  put line;
  if eof then do;
    put ']}]}';
  end;
run;

* Reassign JSON libname engine to provide read-only sequential access to JSON data, now with map;
libname jsonLib json fileref=vaJSON map=jmap;

*==================================================================;
* Main Processing;
*==================================================================; 

* Generate and send back ODS output table;
proc print data=jsonLib.data_formatted label noobs; 
run;

*==================================================================;
* Finalization;
*==================================================================;

* No finalization required in this simple example;
