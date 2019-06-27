/******************************************************************************\
* Copyright 2018 SAS Institute Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
* https://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Author: Ryan West
*
* Input: Any dataset with at least one categorical variable and 1 numerical variable
*
* Output: The input dataset modified into a tall version with columns category, metric,
* measure, and format.
*
* Parameters: One categorical variable followed by N numerical variables
*
* Dependencies/Assumptions: D3 Radar Chart assumes all numerical variables take positive values.
*
* Usage: Modify the macro variables below as desired and run.
* 
\******************************************************************************/

/* Modify these lines to specify your desired dataset and variables */
%let DATASOURCE=SASHELP.CARS;
%let CHAR_VAR=Type;
%let NUM_VARS=Cylinders, EngineSize, MSRP;

%macro radar_data_prep / parmbuff;
	/* Extract data set name */
	%let lib_dot_ds=%scan(&syspbuff, 1, '(,');
	%let ds=%scan(&lib_dot_ds, 2);

	/* Extract categorical variable */
	%let cat_var=%scan(&syspbuff, 3);

	/* Extract first numerical variable */
	%let num=1;
	%let num_var=%scan(&syspbuff, &num+3);

	/* Iterate as long as numerical variable is defined */
	%do %while(&num_var ne);
		/* Generate means by category */
		proc means data=&lib_dot_ds noprint;
			class &cat_var;
			var &num_var;
			output out=means_&num (drop=_:) mean=;
		run;

		/* Remove entry for non-categorized, add metric, and replace num_var with measure */
		data means_&num;
			set means_&num;
			drop &num_var;
			length Metric $20;
			if (&cat_var ^= "");
			Metric=vlabel(&num_var);
			Measure=&num_var;
			Format=vformat(&num_var);
		run;

		/* Append means data sets together */
		%if (&num = 1) %then %do;
			data D3_Radar_&ds;
				set means_1;
			run;
		%end;
		%else %do;
			data D3_Radar_&ds;
				set D3_Radar_&ds means_&num;
			run;
		%end;
		
		/* Remove temporary data sets */
		proc datasets noprint;
			delete means_&num;
		run;

		/* Iterate to next numerical variable */
		%let num=%eval(&num+1);
		%let num_var=%scan(&syspbuff, &num+3);
	%end;

	/* Print first ten observatons to confirm success */
	proc print data=D3_Radar_&ds (obs=10);
	run;
%mend radar_data_prep;

%radar_data_prep(&DATASOURCE, &CHAR_VAR, &NUM_VARS);