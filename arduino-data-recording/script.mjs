import { SerialPort } from "serialport";
import { sensors } from "./sensors.mjs";

const ports = await SerialPort.list();

ports.forEach(({ path }) => {
    const port = new SerialPort({
        baudRate: 9600,
        path: path
    });

    /** @type {string[]} */
    let portSensorNames = [];

    port.on("open", () => {
        port.write("0"); // init sensor names
    });

    let data = "";

    port.on("data", (chunk) => {
        data += chunk.toString();

        if (portSensorNames.length > 0) {
            if (data.length >= portSensorNames.length * 5) { // 5 means 5 digits because of 14Bit numbers
                // port measurements chunk completed

                portSensorNames.forEach((sensorName, index) => {
                    const load = parseInt(data.substring(index * 5, index * 5 + 5));
                    const time = Date.now(); // time gets recorded here to save some bandwith

                    const measurements = sensors[sensorName];

                    if (isNaN(load)) throw new Error("something went wront: measurement is NaN. Please check the code");
                    if (measurements === undefined) throw new Error("something went wront on initialization step. Sensor was not found");

                    measurements.push({
                        load: load,
                        time: time
                    });
                });

                data = "";
                port.write("1"); // receive new values
            }
        } else {
            if (data.endsWith("\r")) {
                // init string completed

                data.substring(0, data.length - 1).split("\n").forEach((sensorName) => {
                    portSensorNames.push(sensorName);
                    sensors[sensorName] = [];
                });

                data = "";
                port.write("1"); // receive new values
            }
        }
    });
});
