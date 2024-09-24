/** @typedef {{ time: number; load: number; }[]} Measurements */
/** @type {{ [sensorName: string]: Measurements; }} */ // can be reassigned or changed without problems while running
export let sensors = {};

// sensorNames holds the sensor names that should be displayed
/** @type {string[]} */ // can be reassigned or changed without problems while running
export let sensorNames = [];

// if its a popup, sensors will be set by another script (its a let variable) and new values should not be fetched
export let popup = false;

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
                    measurements.push(...newMeasurements);
                }
            });

            fetchNewSensorValues();
        }
    };

    if (popup === false) fetchNewSensorValues();
}
