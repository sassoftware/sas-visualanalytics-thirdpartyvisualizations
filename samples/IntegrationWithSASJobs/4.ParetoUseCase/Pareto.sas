* The JSON file this job expects contains the modified JSON message;
* that SAS Visual Analytics sent to the Data-Driven Content object.;
* It contains transformed data and additional column metadata.     ;

*==================================================================;
* Initialization;
*==================================================================;

* This allows for unconventional column names (e.g.: spaces, etc.);
options VALIDVARNAME=any;

* This allows for the stopOnError macro function to run the sas commands after an error occurs;
options NOSYNTAXCHECK;

%macro stopOnError(msg);
  %put &=SYSRC  &=SYSCC  &=SYSFILRC  &=SYSLIBRC  &=SYSERR  SYSERRORTEXT=%superq(syserrortext)  &=MSG;
  %if (&msg eq ) %then %let msg=%superq(syserrortext);
  %if (&syserr > 6 or &msg ne ) %then %do;
    proc json out=_webout nosastags nopretty nokeys;
	  write open object;
	  write values "success" false;
	  write values "retcode" &SYSERR;
	  write values "message" "&MSG";
	  write close;
	run;
    cas mySession terminate;
    %let SYSCC=0;
    %abort cancel;
  %end;
%mend stopOnError;

%macro checkParams;
	%if (not %symexist(castab)) %then %stopOnError(Missing parameter CASTAB);
%mend checkParams;
%checkParams;

* Connect to CAS and assign the CASUSER library;
options cashost="your.host.name" casport=5570;
cas mySession;
%stopOnError();

libname casuser CAS caslib="casuser";
%stopOnError();

* Retrieve JSON data from uploaded file;
filename vaJSON filesrvc "&_WEBIN_FILEURI";
%stopOnError();

* Use the JSON engine to provide read-only sequential access to JSON data;
libname jsonLib json fileref=vaJSON;
%stopOnError();

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
	%stopOnError();
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
	%stopOnError();
  %end;
%mend;

%prepColMetadata;

filename jmap temp lrecl=32767;
%stopOnError();

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
%stopOnError();

* Reassign JSON libname engine to provide read-only sequential access to JSON data, now with map;
libname jsonLib json fileref=vaJSON map=jmap;
%stopOnError();

*==================================================================;
* Main Processing;
*==================================================================; 

* Add table to CAS lib casuser (session scope);
data casuser.&CASTAB._TMP;
	set jsonLib.data_formatted;
run;
%stopOnError();

proc contents data=casuser.&CASTAB._TMP out=casuser.columns noprint;
run;
%stopOnError();

proc sql noprint;
        select name, varnum into :colname1 - :colname2, :dummy
        from casuser.columns
        order by varnum;
quit;
%stopOnError();

PROC FREQ DATA=casuser.&CASTAB._TMP ORDER=FREQ noprint;
	TABLES "&colname1"n / OUTCUM OUT=casuser.&CASTAB._TMP SCORES=TABLE;
	WEIGHT "&colname2"n;
RUN;
%stopOnError();

data casuser.&CASTAB._TMP;
	set casuser.&CASTAB._TMP;
	percent = percent/ 100;
	cum_pct = cum_pct/ 100;
run;
%stopOnError();

* Put table on its final destination: casuser and global scope;
proc casutil;
  droptable casdata="&CASTAB" incaslib="casuser" QUIET;
  promote casdata="&CASTAB._TMP" incaslib="casuser" 
          casout="&CASTAB" outcaslib="casuser" DROP;
run;
quit;
%stopOnError();

*==================================================================;
* Finalization;
*==================================================================;

cas mySession terminate;

* The return code to is sent back to the calling client (Data-Driven Content object) in JSON format;
proc json out=_webout nosastags nopretty nokeys;
  write open object;
  write values "success" true;
  write values "retcode" 0;
  write values "message" "success";
  write close;
run;
