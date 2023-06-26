# Guidelines for script and style files

Note that in the [SAS Software GitHub repository for third party customizations](https://github.com/sassoftware/sas-visualanalytics-thirdpartyvisualizations),  contributors mention utility files which facilitate, among other things, the interchange of information between VA and the DDC through data object transformations.  

These same [utility files](https://github.com/sassoftware/sas-visualanalytics-thirdpartyvisualizations/tree/master/util) and [helper files](https://github.com/sassoftware/sas-visualanalytics-thirdpartyvisualizations/tree/master/thirdPartyHelpers) are already available on the DDC server and can be accessed using the following pattern.  An example is provided below.

```
    <script type="text/javascript" src="{{ url_for('static', filename = 'util/messagingUtil.js') }}"></script>
    <script type="text/javascript" src="{{ url_for('static', filename = 'util/contentUtil.js') }}"></script>

    <script type="text/javascript" src="{{ url_for('static', filename = '<your helper or utility file name>') }}"></script>
```

Therefore, if you have a new template you would like to export, and want to make use of these utility files, insert a script tag into your HTML accordingly.

**Future functionality!** We are looking at ways to provide functionalities which will enable users to upload their own custom helper and utility files, and will update the image once this task is complete.
 
