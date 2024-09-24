/** @type {{ [name: string]: { measurements: { time: number; load: number; }[]; }; }} */ // can be reassigned or changed without problems while running
export let sensors = {
    // frt-lft
    "PUSHROD_FRT_LFT": {
        measurements: []
    },
    "A-ARM_FRT_UPR_FRT_LFT": {
        measurements: []
    },
    "A-ARM_FRT_UPR_RER_LFT": {
        measurements: []
    },
    "A-ARM_FRT_LWR_FRT_LFT": {
        measurements: []
    },
    "A-ARM_FRT_LWR_RER_LFT": {
        measurements: []
    },
    "STEERING_ROD_LFT": {
        measurements: []
    },

    // frt-rgt
    "PUSHROD_FRT_RGT": {
        measurements: []
    },
    "A-ARM_FRT_UPR_FRT_RGT": {
        measurements: []
    },
    "A-ARM_FRT_UPR_RER_RGT": {
        measurements: []
    },
    "A-ARM_FRT_LWR_FRT_RGT": {
        measurements: []
    },
    "A-ARM_FRT_LWR_RER_RGT": {
        measurements: []
    },
    "STEERING_ROD_RGT": {
        measurements: []
    },

    // rer-lft
    "PUSHROD_RER_LFT": {
        measurements: []
    },
    "A-ARM_RER_UPR_FRT_LFT": {
        measurements: []
    },
    "A-ARM_RER_UPR_RER_LFT": {
        measurements: []
    },
    "A-ARM_RER_LWR_FRT_LFT": {
        measurements: []
    },
    "A-ARM_RER_LWR_RER_LFT": {
        measurements: []
    },
    "TIE_ROD_LFT": {
        measurements: []
    },

    // rer-rgt
    "PUSHROD_RER_RGT": {
        measurements: []
    },
    "A-ARM_RER_UPR_FRT_RGT": {
        measurements: []
    },
    "A-ARM_RER_UPR_RER_RGT": {
        measurements: []
    },
    "A-ARM_RER_LWR_FRT_RGT": {
        measurements: []
    },
    "A-ARM_RER_LWR_RER_RGT": {
        measurements: []
    },
    "TIE_ROD_RGT": {
        measurements: []
    },
};

/** @type {string[]} */ // can be reassigned or changed without problems while running
export let sensorNames = [
    // frt-lft
    "PUSHROD_FRT_LFT",
    "A-ARM_FRT_UPR_FRT_LFT",
    "A-ARM_FRT_UPR_RER_LFT",
    "A-ARM_FRT_LWR_FRT_LFT",
    "A-ARM_FRT_LWR_RER_LFT",
    "STEERING_ROD_LFT",

    // frt-rgt
    /*"PUSHROD_FRT_RGT",
    "A-ARM_FRT_UPR_FRT_RGT",
    "A-ARM_FRT_UPR_RER_RGT",
    "A-ARM_FRT_LWR_FRT_RGT",
    "A-ARM_FRT_LWR_RER_RGT",
    "STEERING_ROD_RGT",

    // rer-lft
    "PUSHROD_RER_LFT",
    "A-ARM_RER_UPR_FRT_LFT",
    "A-ARM_RER_UPR_RER_LFT",
    "A-ARM_RER_LWR_FRT_LFT",
    "A-ARM_RER_LWR_RER_LFT",
    "TIE_ROD_LFT",

    // rer-rgt
    "PUSHROD_RER_RGT",
    "A-ARM_RER_UPR_FRT_RGT",
    "A-ARM_RER_UPR_RER_RGT",
    "A-ARM_RER_LWR_FRT_RGT",
    "A-ARM_RER_LWR_RER_RGT",
    "TIE_ROD_RGT"*/
];

let popup = false;

const broadcastChannel = new BroadcastChannel("messfahrwerk");

broadcastChannel.postMessage({
    listening: true
});

broadcastChannel.addEventListener("message", (event) => {
    if (event.data.listening) {
        // sent data to popup window
        broadcastChannel.postMessage({
            listening: false,
            sensors: sensors,
            sensorNames: sensorNames
        });

        console.log("sent data to popup window");
    } else {
        popup = true; // random generator off

        // received popup data
        sensors = event.data.sensors;
        sensorNames = event.data.sensorNames;

        broadcastChannel.close();
    }
});

// fetch new sensor values
{
    let referenceTime = -Infinity;

    const fetchNewSensorValues = async () => {
        const init = {
            method: "POST",
            body: JSON.stringify({
                referenceTime: referenceTime
            })
        };

        referenceTime = Date.now();

        const response = await fetch("/sensor-parts.json", init);

        const sensorParts = await response.json();

        Object.entries(sensorParts).forEach(([sensorName, measurements]) => {
            sensors[sensorName]?.measurements.push(...measurements);
        });

        setTimeout(() => {
            if (!popup) fetchNewSensorValues();
        }, 2000);
    };
    fetchNewSensorValues();
}

// random-generator:
/*{
    const sensorVals = Object.entries(sensors).map(() => {
        return {
            currentTime: Date.now(),
            currentLoad: 0
        };
    });

    setInterval(() => {
        if (!popup) Object.entries(sensors).forEach(([sensorName], index) => {
            if ((sensors[sensorName]?.measurements.length || 0) > 100000) {
                sensors[sensorName]?.measurements.splice(0, 3800);
            }

            for (let i = 0; i < 3800; i++) {
                // @ts-ignore
                sensorVals[index].currentTime += 20 / 38;
                // @ts-ignore
                sensorVals[index].currentLoad += Math.random() - 0.5;

                sensors[sensorName]?.measurements.push({
                    time: sensorVals[index]?.currentTime || Date.now(),
                    load: sensorVals[index]?.currentLoad || 0
                });
            }
        });
    }, 2000);
}*/
