import "./prevent-events.1.0.0.js";
import { config } from "./config.1.0.3.js";
import { sensors, sensorNames } from "./sensors.1.0.2.js";
import { getColorFromString } from "./get-color-from-string.1.0.0.js";

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

/** @type {HTMLDivElement | null} */
const sensorSelection = document.querySelector("div#sensor-selection");

/** @type {HTMLCanvasElement | null} */
const graph = document.querySelector("canvas#graph");

if (sensorSelection === null) throw new Error("no div element with id 'sensor-selection' found.");
if (graph === null) throw new Error("canvas#graph not found!");

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const graphContext = graph.getContext("2d");

if (graphContext === null) throw new Error("context 2d is not available on canvas#graph");

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

const animationFrame = async () => {
    { // sync sensor selection labels with sensors database (add new sensors | remove is not supported)
        Object.keys(sensors).forEach((sensorName) => {
            let label = sensorSelection.querySelector(`label.${sensorName}`);

            if (label === null) {
                label = document.createElement("label");
                label.className = sensorName;

                const span = document.createElement("span");
                span.className = "sensor-name";
                span.textContent = `${sensorName} [0/sec]`;

                label.appendChild(span);

                const input = document.createElement("input");
                input.className = "sensor-checkbox";
                input.type = "checkbox";
                input.checked = true;

                label.appendChild(input);

                sensorSelection.appendChild(label);
            }
        });
    }

    { // sync checked sensor selection labels with sensorNames variable
        const labels = sensorSelection.querySelectorAll("label");

        sensorNames.splice(0, sensorNames.length);

        labels.forEach((label) => {
            const sensorName = label.className;

            const input = label.querySelector("input");

            if (input === null) throw new Error("structure of sensor selection is not valid");

            if (input.checked) {
                sensorNames.push(sensorName);
            }
        });
    }

    { // handle graph canvas
        {
            graph.width = Math.round(graph.offsetWidth * window.devicePixelRatio * config.resolutionScaling);
            graph.height = Math.round(graph.offsetHeight * window.devicePixelRatio * config.resolutionScaling);
        }

        {
            graphContext.beginPath();
            graphContext.moveTo((config.unitDisplaySpaceY + config.margin) * window.devicePixelRatio * config.resolutionScaling, config.margin * window.devicePixelRatio * config.resolutionScaling);
            graphContext.lineTo((config.unitDisplaySpaceY + config.margin) * window.devicePixelRatio * config.resolutionScaling, graph.height - (config.unitDisplaySpaceX + config.margin) * window.devicePixelRatio * config.resolutionScaling);
            graphContext.lineTo(graph.width - config.margin * window.devicePixelRatio * config.resolutionScaling, graph.height - (config.unitDisplaySpaceX + config.margin) * window.devicePixelRatio * config.resolutionScaling);
            graphContext.lineWidth = config.lineWidth * window.devicePixelRatio * config.resolutionScaling;
            graphContext.lineCap = "butt";
            graphContext.lineJoin = "miter";
            graphContext.strokeStyle = config.strokeColor;
            graphContext.stroke();
        }

        {
            let minLoad = Infinity;
            let maxLoad = -Infinity;

            let minTime = Infinity;
            let maxTime = -Infinity;

            /** @type {{ [sensorName: string]: import("./sensors.1.0.2.js").Measurements; }} */
            const renderedSensors = {}; // the sensors object with only measurements that should be redered in the end

            sensorNames.forEach((sensorName) => {
                const measurements = sensors[sensorName];

                if (measurements === undefined) throw new Error(`the provided sensorName: ${sensorName} does not exists in sensors!`);

                /** @type {import("./sensors.1.0.2.js").Measurements} */
                const renderedMeasurements = []; // the measurements that should be redered in the end

                const sectionLength = Math.ceil(measurements.length / config.displayedSections);

                for (let sectionIndex = 0; sectionIndex < config.displayedSections; sectionIndex++) {
                    let sectionMinLoad = Infinity;
                    let sectionMaxLoad = -Infinity;

                    let sectionMinTime = NaN; // time of selectionMinLoad
                    let sectionMaxTime = NaN; // time of selectionMaxLoad

                    for (let index = 0; index < sectionLength; index++) {
                        const measurement = measurements[sectionIndex * sectionLength + index];
                        if (measurement === undefined) break; // can be, because of ceiling sectionLength!

                        if (measurement.load < sectionMinLoad) {
                            sectionMinLoad = measurement.load; // section min
                            sectionMinTime = measurement.time; // set section min time
                        } else if (measurement.load > sectionMaxLoad) {
                            sectionMaxLoad = measurement.load; // section max
                            sectionMaxTime = measurement.time; // set section max time
                        }
                    }

                    sectionMinLoad // set
                    sectionMaxLoad // set

                    sectionMinTime // set
                    sectionMaxTime // set

                    if (sectionMinLoad < minLoad) {
                        minLoad = sectionMinLoad; // global min
                    }

                    if (sectionMaxLoad > maxLoad) {
                        maxLoad = sectionMaxLoad; // global max
                    }

                    if (sectionMinTime < minTime) {
                        minTime = sectionMinTime; // global min
                    }

                    if (sectionMaxTime > maxTime) {
                        maxTime = sectionMaxTime; // global max
                    }

                    // add min and max points to renderedMeasurements

                    if (sectionMinTime < sectionMaxTime) {
                        renderedMeasurements.push({
                            load: sectionMinLoad,
                            time: sectionMinTime
                        }, {
                            load: sectionMaxLoad,
                            time: sectionMaxTime
                        });
                    } else {
                        renderedMeasurements.push({
                            load: sectionMaxLoad,
                            time: sectionMaxTime
                        }, {
                            load: sectionMinLoad,
                            time: sectionMinTime
                        });
                    }
                }

                renderedMeasurements // set

                renderedSensors[sensorName] = renderedMeasurements;
            });

            renderedSensors // set

            minLoad // set
            maxLoad // set

            minTime // set
            maxTime // set

            const minY = graph.height - (config.margin + config.unitDisplaySpaceX + config.offsetY) * window.devicePixelRatio * config.resolutionScaling;
            const maxY = (config.margin + config.offsetY) * window.devicePixelRatio * config.resolutionScaling;

            const minX = (config.margin + config.unitDisplaySpaceY + config.offsetX) * window.devicePixelRatio * config.resolutionScaling;
            const maxX = graph.width - (config.margin + config.offsetX) * window.devicePixelRatio * config.resolutionScaling;

            const rangeLoad = maxLoad - minLoad;
            const rangeTime = maxTime - minTime;

            const rangeY = maxY - minY;
            const rangeX = maxX - minX;

            /** @type {(load: number) => number} */
            const loadToY = (load) => (load - minLoad) * rangeY / rangeLoad + minY;

            /** @type {(time: number) => number} */
            const timeToX = (time) => (time - minTime) * rangeX / rangeTime + minX;

            const unitsY = Math.floor(Math.abs(rangeY / (config.unitDistanceY * window.devicePixelRatio * config.resolutionScaling)));
            const unitsX = Math.floor(Math.abs(rangeX / (config.unitDistanceX * window.devicePixelRatio * config.resolutionScaling)));

            // render Y-Units and grid
            for (let i = 0; i < (unitsY + 1); i += 1) {
                graphContext.textAlign = "center";
                graphContext.textBaseline = "middle";
                graphContext.font = `${Math.round(config.fontSize * window.devicePixelRatio * config.resolutionScaling)}px serif`;

                const load = i * rangeLoad / unitsY + minLoad;
                const y = loadToY(load);

                graphContext.lineWidth = config.gridLineWidth * window.devicePixelRatio * config.resolutionScaling;
                graphContext.lineCap = graphContext.lineJoin = "round";
                graphContext.strokeStyle = config.gridLineColor;

                graphContext.beginPath();
                graphContext.moveTo((config.margin + config.unitDisplaySpaceY) * window.devicePixelRatio * config.resolutionScaling, y);
                graphContext.lineTo(graph.width - config.margin * window.devicePixelRatio * config.resolutionScaling, y);
                graphContext.stroke();

                graphContext.fillText(load.toFixed(config.decimalPlacesYAxis), (config.margin + config.unitDisplaySpaceY / 2) * window.devicePixelRatio * config.resolutionScaling, y);
            }

            // render X-Units and grid
            for (let i = 0; i < (unitsX + 1); i += 1) {
                graphContext.textAlign = "center";
                graphContext.textBaseline = "middle";
                graphContext.font = `${Math.round(config.fontSize * window.devicePixelRatio * config.resolutionScaling)}px serif`;

                const time = i * rangeTime / unitsX + minTime;
                const x = timeToX(time);

                graphContext.lineWidth = config.gridLineWidth * window.devicePixelRatio * config.resolutionScaling;
                graphContext.lineCap = graphContext.lineJoin = "round";
                graphContext.strokeStyle = config.gridLineColor;

                graphContext.beginPath();
                graphContext.moveTo(x, graph.height - (config.margin + config.unitDisplaySpaceX) * window.devicePixelRatio * config.resolutionScaling);
                graphContext.lineTo(x, config.margin * window.devicePixelRatio * config.resolutionScaling);
                graphContext.stroke();

                const date = new Date(time);

                const text = config.millisecondsXAxis
                    ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}:${date.getMilliseconds().toString().padStart(3, "0")}`
                    : `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;

                graphContext.fillText(text, x, graph.height - (config.margin + config.unitDisplaySpaceX / 2) * window.devicePixelRatio * config.resolutionScaling);
            }

            // render renderedSensors measurements

            sensorNames.forEach((sensorName) => {
                const renderedMeasurements = renderedSensors[sensorName];

                if (renderedMeasurements === undefined) {
                    throw new Error(`the provided sensorName: ${sensorName} does not exists in renderedSensors!`);
                }

                const path = new Path2D();

                renderedMeasurements.forEach((renderedMeasurement, index) => {
                    if (index === 0) {
                        path.moveTo(timeToX(renderedMeasurement.time), loadToY(renderedMeasurement.load));
                    } else {
                        path.lineTo(timeToX(renderedMeasurement.time), loadToY(renderedMeasurement.load));
                    }
                });

                // do something with path: e.g. store it to make sure it can be used otherwise

                // now render the path:

                graphContext.lineCap = graphContext.lineJoin = "round";
                graphContext.lineWidth = config.loadLineWidth * window.devicePixelRatio * config.resolutionScaling;
                graphContext.strokeStyle = graphContext.fillStyle = getColorFromString(sensorName);

                graphContext.stroke(path);
            });
        }
    }

    window.requestAnimationFrame(animationFrame);
};

window.requestAnimationFrame(animationFrame);

// display measurements / sec on sensor name:

{
    /** @type {{ [sensorName: string]: number; }} */
    const measurementOldLengths = Object.fromEntries(Object.entries(sensors).map(([sensorName, measurements]) => {
        return [sensorName, measurements.length];
    }));

    setInterval(() => {
        const labels = sensorSelection.querySelectorAll("label");

        labels.forEach((label) => {
            const sensorName = label.className;

            const span = label.querySelector("span");

            if (span === null) throw new Error("structure of sensor selection is not valid");

            const measurements = sensors[sensorName];

            if (measurements === undefined) throw new Error("cannot find sensor in sensor names while getting measurements / sec");

            span.textContent = `${sensorName} [${measurements.length - (measurementOldLengths[sensorName] || 0)}/sec]`; // can be undefined if new sensor values are available

            measurementOldLengths[sensorName] = measurements.length;
        });
    }, 1000);
}
