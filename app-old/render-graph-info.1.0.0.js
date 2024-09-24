import { config } from "./config.1.0.2.js";

/**
 * @param {HTMLElement} graphInfo
 * @param {{ time: number; load: number; }[]} measurements
 * @param {string} sensorName
 * @param {(x: number) => number} XToTime
 * @param {number} graphX
 * @param {number} clientY
 * @param {number} clientX
 * @returns {undefined}
 */
export const renderGraphInfo = (graphInfo, measurements, sensorName, XToTime, graphX, clientY, clientX) => {
    const time = XToTime(graphX);

    for (const measurement of measurements) {
        if (measurement.time > time) {
            const load = measurement.load.toFixed(config.decimalPlacesGraphInfo);
            const date = new Date(measurement.time);

            graphInfo.textContent = config.millisecondsGraphInfo
                ? `${sensorName} (${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}:${date.getMilliseconds().toString().padStart(3, "0")}, ${load})`
                : `${sensorName} (${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}, ${load})`;

            graphInfo.style.display = "initial";

            const width = graphInfo.offsetWidth;
            const height = graphInfo.offsetHeight;

            if (clientX + width > document.body.offsetWidth) {
                graphInfo.style.left = "";
                graphInfo.style.right = Math.round(document.body.offsetWidth - clientX) + "px";
            } else {
                graphInfo.style.left = clientX + "px";
                graphInfo.style.right = "";
            }

            if (clientY + height > document.body.offsetHeight) {
                graphInfo.style.top = "";
                graphInfo.style.bottom = Math.round(document.body.offsetHeight - clientY) + "px";
            } else {
                graphInfo.style.top = clientY + "px";
                graphInfo.style.bottom = "";
            }

            break;
        }
    }
};
