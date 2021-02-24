# Data Editor for CAS tables

When using this page as a data driven content object in VA ensure you have:
- Added all of your ID variables and editable columns to the roles of the object 
- set a Linked Selection type Object Link Action from another object on the same page, that drives a single row selection.  That object must have roles assigned for at least all of the ID variables.

## Url Parameters:

- caslib: name of CAS Library that contains target data
- castab: name of target table
- id_column_name: name of column to be used as a unique key when updating values
- maptab: name of mapping table for driving values in dropdown selections

## Using Dropdown selections

Options in dropdown selections can be automatically driven through a set of CAS mapping tables, by pointing to a primary CAS mapping table through the maptab URL parameter.  The tables must all be in the caslib specified in the caslib URL parameter

### maptab Table Format

The table has 4 columns:
1) lookupName: name of the column that the lookup will apply to in VA
2) table: name of the CAS table from which to lookup values
3) nameCol: Column name in the lookup table to use for the dropdown values
4) labelCol: Column name in the lookup table to use for the label values
