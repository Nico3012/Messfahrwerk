import { config } from "./config.1.0.2.js";

/**
 * @param {string} string
 * @returns {string}
 */
export const getColorFromString = (string) => {
    let num = 0;

    for (let i = 0; i < string.length; i += 1) {
        num += string.charCodeAt(i);
    }

    num = Math.round(config.graphColorSteps * num);

    while (num > 360) {
        num -= 360;
    }

    return `hwb(${Math.round(num)} 0% 0%)`;
};
