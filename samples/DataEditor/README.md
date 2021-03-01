# Data Editor for CAS tables

When using this page as a data driven content object in VA ensure you have:
- Added all of your ID variables and editable columns to the roles of the object 
- set a Linked Selection type Object Link Action from another object on the same page, driving a single row selection.  That object must have roles assigned for at least all of the ID variables.  A list table is the easiest option.

## Url Parameters:

- caslib: name of CAS Library that contains target data
- castab: name of target table
- id_columns: name(s) of column(s) to be used as a unique key when updating values - comma separated if multiple
- maptab: name of mapping table for driving values in dropdown selections

## Using Dropdown selections

Options in dropdown selections can be automatically driven through a set of CAS mapping tables, by pointing to a primary CAS mapping table through the maptab URL parameter.  The tables must all be in the caslib specified in the caslib URL parameter

### maptab Table Format

The table has 4 columns:
1) lookupName: name of the column that the lookup will apply to in VA
2) table: name of the CAS table from which to lookup values
3) nameCol: Column name in the lookup table to use for the dropdown values
4) labelCol: Column name in the lookup table to use for the label values


Example SAS code for setting up a lookup table for the Origin column of the CARS data set.  You would make use of this by applying the following URL Query Parameters:
?caslib=PUBLIC&castab=CARS&&maptab=CARMAP&id_columns=Make,Model

```SAS
cas casauto;
caslib _all_ assign;

proc casutil;
	droptable casdata='CARMAP' incaslib='PUBLIC' quiet;
	droptable casdata='CARORIGINS' incaslib='PUBLIC' quiet;
	droptable casdata='CARMAP' incaslib='PUBLIC' quiet;
	droptable casdata='CARORIGINS' incaslib='PUBLIC' quiet;
run;

Data public.carmap;
length targetName table nameCol descCol $32;
input targetName $ table $ nameCol $ descCol $;
datalines;
Origin CARORIGINS Origin Description
;
 

proc fedsql sessref=casauto;
create table public.CARORIGINS as
	Select distinct
	Origin,
	Origin as Description
	from public.cars
	;
quit;

proc casutil;
	promote casdata='CARMAP' incaslib='PUBLIC' casout='CARMAP' outcaslib='PUBLIC';
	promote casdata='CARORIGINS' incaslib='PUBLIC' casout='CARORIGINS' outcaslib='PUBLIC';
run;
quit;
```
