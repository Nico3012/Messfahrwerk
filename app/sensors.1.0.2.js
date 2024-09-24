/** @typedef {{ time: number; load: number; }[]} Measurements */

import { config } from "./config.1.0.3.js";

/** @type {{ [sensorName: string]: Measurements; }} */ // can be reassigned or changed without problems while running
export let sensors = {};

// sensorNames holds the sensor names that should be displayed
/** @type {string[]} */ // can be reassigned or changed without problems while running
export let sensorNames = [];

// if its a popup, sensors will be set by another script (its a let variable) and new values should not be fetched
export let popup = false;

/** @type {{ [sensorName: string]: number; }} */
const sensorLengths = {};

{ // request new sensor values
    const fetchNewSensorValues = async () => {
        /** @type {{ [sensorName: string]: number; }} */
        const sensorLengths = Object.fromEntries(Object.entries(sensors).map(([sensorName, measurements]) => {
            return [sensorName, measurements.length];
        }));

        const response = await fetch("/new-sensor-values.json", {
            method: "POST",
            body: JSON.stringify({
                sensorLengths: sensorLengths
            })
        });

        /** @type {{ newSensorMeasurements: [string, Measurements][]; }} */
        const { newSensorMeasurements } = await response.json();

        if (popup === false) {
            newSensorMeasurements.forEach(([sensorName, newMeasurements]) => {
                const measurements = sensors[sensorName];

                if (measurements === undefined) {
                    sensors[sensorName] = newMeasurements;
                } else {
                    const lengthDifference = measurements.length - config.maxMeasurements;
                    const deleteCount = lengthDifference > 0 ? lengthDifference : 0;

                    measurements.splice(0, deleteCount); // maybe remove first elements if array is too long
                    measurements.push(...newMeasurements);

                    if (sensorName in sensorLengths) {
                        sensorLengths[sensorName] += newMeasurements.length + deleteCount;
                    } else {
                        sensorLengths[sensorName] = newMeasurements.length + deleteCount;
                    }
                }
            });

            fetchNewSensorValues();
        }
    };

    if (popup === false) fetchNewSensorValues();
}
