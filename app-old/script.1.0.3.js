// features: new points selection algorithm that detects changing points

import "./prevent-events.1.0.0.js";
import { config } from "./config.1.0.2.js";
import { getColorFromString } from "./get-color-from-string.1.0.0.js";
import { renderGraphInfo } from "./render-graph-info.1.0.0.js";
import { sensorNames, sensors } from "./sensors.1.0.2.js";

/** @type {HTMLCanvasElement | null} */
const graph = document.querySelector("canvas#graph");

if (graph === null) {
    throw new Error("canvas#graph not found!");
}

/** @type {HTMLElement | null} */
const graphInfo = document.querySelector("#graph-info");

if (graphInfo === null) throw new Error("html element with id: graph-info not found!");

/** @type {HTMLElement | null} */
const options = document.querySelector("#options");

if (options === null) throw new Error("html element with id: options not found!");

const context = graph.getContext("2d");

if (context === null) {
    throw new Error("context 2d is not available on canvas#graph");
}

/** @type {{ sensorName: string; path: Path2D; }[]} */
let sensorPaths;

let clientX = NaN;
let clientY = NaN;

/** @type {string[]} */ // only for comparision with inputs to check if sensorNames got changed
let sensorNamesBackup = [];

const drawGraph = () => {
    {
        graph.width = Math.round(graph.offsetWidth * window.devicePixelRatio);
        graph.height = Math.round(graph.offsetHeight * window.devicePixelRatio);
    }

    {
        context.beginPath();
        context.moveTo((config.unitDisplaySpaceY + config.margin) * window.devicePixelRatio, config.margin * window.devicePixelRatio);
        context.lineTo((config.unitDisplaySpaceY + config.margin) * window.devicePixelRatio, graph.height - (config.unitDisplaySpaceX + config.margin) * window.devicePixelRatio);
        context.lineTo(graph.width - config.margin * window.devicePixelRatio, graph.height - (config.unitDisplaySpaceX + config.margin) * window.devicePixelRatio);
        context.lineWidth = config.lineWidth * window.devicePixelRatio;
        context.lineCap = "butt";
        context.lineJoin = "miter";
        context.strokeStyle = config.strokeColor;
        context.stroke();
    }

    /** @type {(x: number) => number} */
    let XToTime;

    {
        let minLoad = Infinity;
        let maxLoad = -Infinity;

        let minTime = Infinity;
        let maxTime = -Infinity;

        sensorNames.forEach((sensorName) => {
            const measurements = sensors[sensorName];

            if (measurements === undefined) {
                throw new Error(`the provided sensorName: ${sensorName} does not exists in sensors!`);
            }

            measurements.forEach((measurement) => {
                if (measurement.load < minLoad) {
                    minLoad = measurement.load;
                } else if (measurement.load > maxLoad) {
                    maxLoad = measurement.load;
                }

                if (measurement.time < minTime) {
                    minTime = measurement.time;
                } else if (measurement.time > maxTime) {
                    maxTime = measurement.time;
                }
            });
        });

        minLoad
        maxLoad

        minTime
        maxTime

        const minY = graph.height - (config.margin + config.unitDisplaySpaceX + config.offsetY) * window.devicePixelRatio;
        const maxY = (config.margin + config.offsetY) * window.devicePixelRatio;

        const minX = (config.margin + config.unitDisplaySpaceY + config.offsetX) * window.devicePixelRatio;
        const maxX = graph.width - (config.margin + config.offsetX) * window.devicePixelRatio;

        const rangeLoad = maxLoad - minLoad;
        const rangeTime = maxTime - minTime;

        const rangeY = maxY - minY;
        const rangeX = maxX - minX;

        /** @type {(load: number) => number} */
        const loadToY = (load) => (load - minLoad) * rangeY / rangeLoad + minY;

        /** @type {(time: number) => number} */
        const timeToX = (time) => (time - minTime) * rangeX / rangeTime + minX;

        // used for graph info
        XToTime = (x) => (x - minX) * rangeTime / rangeX + minTime;

        const unitsY = Math.floor(Math.abs(rangeY / (config.unitDistanceY * window.devicePixelRatio)));
        const unitsX = Math.floor(Math.abs(rangeX / (config.unitDistanceX * window.devicePixelRatio)));

        // render Y-Units and grid
        for (let i = 0; i < (unitsY + 1); i += 1) {
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = `${Math.round(config.fontSize * window.devicePixelRatio)}px serif`;

            const load = i * rangeLoad / unitsY + minLoad;
            const y = loadToY(load);

            context.lineWidth = config.gridLineWidth * window.devicePixelRatio;
            context.lineCap = context.lineJoin = "round";
            context.strokeStyle = config.gridLineColor;

            context.beginPath();
            context.moveTo((config.margin + config.unitDisplaySpaceY) * window.devicePixelRatio, y);
            context.lineTo(graph.width - config.margin * window.devicePixelRatio, y);
            context.stroke();

            context.fillText(load.toFixed(config.decimalPlacesYAxis), (config.margin + config.unitDisplaySpaceY / 2) * window.devicePixelRatio, y);
        }

        // render X-Units and grid
        for (let i = 0; i < (unitsX + 1); i += 1) {
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = `${Math.round(config.fontSize * window.devicePixelRatio)}px serif`;

            const time = i * rangeTime / unitsX + minTime;
            const x = timeToX(time);

            context.lineWidth = config.gridLineWidth * window.devicePixelRatio;
            context.lineCap = context.lineJoin = "round";
            context.strokeStyle = config.gridLineColor;

            context.beginPath();
            context.moveTo(x, graph.height - (config.margin + config.unitDisplaySpaceX) * window.devicePixelRatio);
            context.lineTo(x, config.margin * window.devicePixelRatio);
            context.stroke();

            const date = new Date(time);

            const text = config.millisecondsXAxis
                ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}:${date.getMilliseconds().toString().padStart(3, "0")}`
                : `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;

            context.fillText(text, x, graph.height - (config.margin + config.unitDisplaySpaceX / 2) * window.devicePixelRatio);
        }

        sensorPaths = [];

        // render and connect sensor points
        sensorNames.forEach((sensorName) => {
            const measurements = sensors[sensorName];

            if (measurements === undefined) {
                throw new Error(`the provided sensorName: ${sensorName} does not exists in sensors!`);
            }

            const path = new Path2D();

            {
                // render sections:

                const sectionLength = Math.ceil(measurements.length / config.displayedSections);

                for (let sectionIndex = 0; sectionIndex < config.displayedSections; sectionIndex++) {
                    let minLoad = Infinity;
                    let maxLoad = -Infinity;

                    let minTime = NaN;
                    let maxTime = NaN;

                    for (let index = 0; index < sectionLength; index++) {
                        const measurement = measurements[sectionIndex * sectionLength + index];
                        if (measurement === undefined) break; // can be, because of ceiling sectionLength!

                        if (measurement.load < minLoad) {
                            minLoad = measurement.load;
                            minTime = measurement.time;
                        } else if (measurement.load > maxLoad) {
                            maxLoad = measurement.load;
                            maxTime = measurement.time;
                        }
                    }

                    minLoad
                    maxLoad

                    minTime
                    maxTime

                    // add min and max points to path

                    if (minTime < maxTime) {
                        if (sectionIndex === 0) {
                            path.moveTo(timeToX(minTime), loadToY(minLoad));
                        } else {
                            path.lineTo(timeToX(minTime), loadToY(minLoad));
                        }

                        path.lineTo(timeToX(maxTime), loadToY(maxLoad));
                    } else {
                        if (sectionIndex === 0) {
                            path.moveTo(timeToX(maxTime), loadToY(maxLoad));
                        } else {
                            path.lineTo(timeToX(maxTime), loadToY(maxLoad));
                        }

                        path.lineTo(timeToX(minTime), loadToY(minLoad));
                    }
                }
            }

            sensorPaths.push({
                sensorName: sensorName,
                path: path
            });

            context.lineCap = context.lineJoin = "round";
            context.lineWidth = config.loadLineWidth * window.devicePixelRatio;
            context.strokeStyle = context.fillStyle = getColorFromString(sensorName);

            context.stroke(path);
        });
    }

    { // render graph info
        context.lineCap = context.lineJoin = "round";
        context.lineWidth = config.loadDetectionLineWidth * window.devicePixelRatio;

        const graphX = (clientX - graph.offsetLeft) * window.devicePixelRatio; // get position on graph canvas
        const graphY = (clientY - graph.offsetTop) * window.devicePixelRatio; // get position on graph canvas

        for (const sensorPath of sensorPaths) {
            const isPointInStroke = context.isPointInStroke(sensorPath.path, graphX, graphY);

            if (isPointInStroke) {
                const measurements = sensors[sensorPath.sensorName];

                if (measurements === undefined) {
                    throw new Error(`the provided sensorName: ${sensorPath.sensorName} does not exists in sensors!`);
                }

                renderGraphInfo(graphInfo, measurements, sensorPath.sensorName, XToTime, graphX, clientY, clientX);

                break;
            } else {
                graphInfo.style.display = "none";
                graphInfo.style.left = "";
                graphInfo.style.right = "";
                graphInfo.style.top = "";
                graphInfo.style.bottom = "";
            }
        }
    }

    { // render sensor names
        for (const label of options.querySelectorAll("label")) {
            if (label.className in sensors === false) {
                label.remove();
            }
        }

        for (const sensorName in sensors) {
            if (options.querySelector("." + sensorName) === null) {
                const label = document.createElement("label");
                const input = document.createElement("input");

                label.className = sensorName;
                label.textContent = sensorName;
                input.type = "checkbox";
                input.checked = sensorNames.includes(sensorName) ? true : false;

                input.addEventListener("change", () => {
                    if (input.checked) {
                        sensorNames.push(sensorName);
                    } else {
                        const index = sensorNames.indexOf(sensorName);

                        if (index !== -1) sensorNames.splice(index, 1);
                    }

                    sensorNamesBackup = [...sensorNames];
                });

                label.appendChild(input);
                options.appendChild(label);
            }
        }

        if (JSON.stringify(sensorNames) !== JSON.stringify(sensorNamesBackup)) {
            // sensorNames has changed! Reassign all inputs
            for (const label of options.querySelectorAll("label")) {
                const input = label.querySelector("input");

                if (input === null) throw new Error("input in label not found");

                input.checked = sensorNames.includes(label.className) ? true : false;
            }

            sensorNamesBackup = [...sensorNames];
        }
    }

    window.requestAnimationFrame(drawGraph);
}

window.requestAnimationFrame(drawGraph);

// no more loop

{
    document.addEventListener("pointerdown", (event) => {
        clientX = event.clientX;
        clientY = event.clientY;
    });

    document.addEventListener("pointermove", (event) => {
        clientX = event.clientX;
        clientY = event.clientY;
    });

    document.addEventListener("pointerup", (event) => {
        clientX = event.clientX;
        clientY = event.clientY;
    });

    document.addEventListener("pointercancel", (event) => {
        clientX = event.clientX;
        clientY = event.clientY;
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            window.open(window.location.href, "_blank", "popup=yes");
        }
    });
}
