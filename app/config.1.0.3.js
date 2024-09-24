export const config = {
    resolutionScaling: 0.5, // Auflösung inkl. devicepixelratio wird mit diesem Faktor skaliert // geringer => hohere performance
    margin: 16, // css pixel
    lineWidth: 2, // css pixel x und y achse line
    strokeColor: "#0000ff", // coordinate-system color
    unitDistanceY: 48, // min css pixel between unit points in y
    unitDistanceX: 96, // min css pixel between unit points in x
    unitDisplaySpaceY: 36, // css pixels (padding links der Y-Achse)
    unitDisplaySpaceX: 24, // css pixels (padding unter der X-Achse)
    decimalPlacesYAxis: 0,
    // decimalPlacesGraphInfo: 3, // graph info contextmenu
    fontSize: 16, // css pixels
    offsetY: 8, // css pixels (offset top and bottom to first data set)
    offsetX: 28, // css pixels (offset left and right to first data set)
    gridLineWidth: 0.25, // css pixel
    gridLineColor: "rgb(127, 127, 127)", // grid line color
    loadLineWidth: 1, // css pixel
    // loadDetectionLineWidth: 12, // css pixel
    graphColorSteps: 109, // deg (of 360)
    displayedSections: 500, // (integer) in every section a min and max value will be rendered
    millisecondsXAxis: false,
    // millisecondsGraphInfo: true, // graph info contextmenu
    maxMeasurements: 10000 // max length of measurements array. MUST be synced with backend maxMeasurements!
};
