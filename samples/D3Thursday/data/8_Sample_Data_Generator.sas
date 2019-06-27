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
* Output: A randomized dataset with columns Year (string), Country (string),
* Population (number), and View (string) for use with D3 variable view stacked
* bar chart, titled "8_Sample_Data" in the Work library.
*
* Usage: Run to produce dataset.
*
\******************************************************************************/


data work.Sample_Data_8;
	label Population = "Population (in millions)"; /* Designate labels how we want them to display in VA */
	drop Year_n; /* Drop numeric version of variable*/
	input Country $32.; /* Read in country from datalines */

	/* Iterate over all years in range */
	do Year_n = 1960 to 2010;
		/* Assign alignment depending on parity */
		if mod(_N_, 2) eq 0 then View = "Center Aligned";
		else View = "Left Aligned";

		/* Randomly generate population for each year */
		Population = rand("Integer", 30, 300);

		/* Put numeric year into character variable */
		Year = put(Year_n, $4.);
		output;
	end;

	datalines;
Andorra
Belgium
Mexico
Syria
United Arab Emirates
United Kingdom
United States
Zimbabwe
;
run;
