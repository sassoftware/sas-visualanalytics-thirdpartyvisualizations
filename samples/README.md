# Using samples within SAS Visual Analytics

These samples can be directly used by data-driven content within a SAS Visual Analytics (VA) report.  For example, to reference the circle packing sample, set the url of the data-driven content to be:

```html
https://sassoftware.github.io/sas-visualanalytics-thirdpartyvisualizations/samples/d3_circlePacking.html
```
---
### Notes:
1. Due to recent [security measures for sandboxed iframes](https://www.chromestatus.com/feature/5706745674465280) adopted by Chrome browsers that removed download capability, `export2CSV.html` will only work with Chrome in VA 8.5.1.
2. Example `d3_FunnelChart.html` requires `d3-funnel.js`. This funnel chart implementation was obtained from https://github.com/jakezatecky/d3-funnel
