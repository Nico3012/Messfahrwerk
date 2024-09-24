import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** @param {string} importMetaUrl @returns {(relativePathname: string) => string} */
export let createGetJoinedAbsolutePathname = (importMetaUrl) => {
    let directoryPathname = dirname(fileURLToPath(importMetaUrl));

    /** @param {string} relativePathname */
    return (relativePathname) => {
        return join(directoryPathname, ...relativePathname.split("/"));
    };
};
