import "./arduino-data-recording/script.mjs";
import { sensors } from "./arduino-data-recording/sensors.mjs";
import { createHttp1Server } from "./lib/server.1.20.1/create-http-server.1.20.1.mjs";
import { createGetJoinedAbsolutePathname } from "./lib/utilities.1.0.0/create-get-joined-absolute-pathname.1.0.0.mjs";

const getJoinedAbsolutePathname = createGetJoinedAbsolutePathname(import.meta.url);

createHttp1Server(async (connection) => {
    if (connection.method === "POST") {
        if (connection.pathname === "/new-sensor-values.json") try {
            /** @type {{ sensorLengths: { [sensorName: string]: number; }; }} */
            const data = JSON.parse(await connection.body);

            /** @type {[string, import("./arduino-data-recording/sensors.mjs").Measurements][]} */
            const newSensorMeasurements = Object.entries(sensors).map(([sensorName, measurements]) => {
                const sensorLength = data.sensorLengths[sensorName];

                if (measurements.length > 10000) {
                    const deleteCount = measurements.length - 10000;

                    const deletedMeasurements = measurements.splice(0, deleteCount);
                }

                if (sensorLength === undefined) { // sensor was not tracked in frontend (new)
                    return [sensorName, measurements];
                } else {
                    return [sensorName, measurements.slice(sensorLength)];
                }
            });

            return connection.sendData({
                data: JSON.stringify({
                    newSensorMeasurements: newSensorMeasurements
                }),
                status: 200
            });
        } catch (error) {
            if (error instanceof Error) return connection.sendData({
                data: error.message,
                status: 400
            });

            return connection.sendData({
                data: "error is not an instance of Error",
                status: 400
            });
        }
    }

    if (connection.method === "GET") { // routing server
        let filename = `./app${connection.pathname}`;

        if (filename.endsWith("/")) {
            filename += "index.html";
        }

        const sendFileStatus = await connection.sendFile({
            joinedAbsolutePathname: getJoinedAbsolutePathname(filename),
            cacheControl: "no-cache" // remove this line to get more efficiency but less flexibility (some files must have a version pattern)
        });

        if (sendFileStatus === "failed-directory") { // Redirect 307 | 308
            connection.sendHref({
                href: `${connection.pathname}/${connection.search}`,
                status: 307 // change to 308 for more efficiency but less flexibility
            });
        }

        if (sendFileStatus === "failed-stats-not-found") { // Error 404: not found
            connection.sendData({
                contentType: "text/plain; charset=utf-8",
                data: "Error 404: Not found!",
                status: 404
            });
        }

        if (sendFileStatus === "failed-unknown-stats") { // Error 403: forbidden
            connection.sendData({
                contentType: "text/plain; charset=utf-8",
                data: "Error 403: Forbidden!",
                status: 403
            });
        }
    }

    return connection.sendData({
        data: "Error 404",
        status: 404
    });
}, {
    port: 8080
});
