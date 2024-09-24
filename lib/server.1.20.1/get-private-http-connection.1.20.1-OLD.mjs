/**
 * @typedef {"text/plain; charset=utf-8" | "text/html; charset=utf-8" | "text/css; charset=utf-8" | "text/javascript; charset=utf-8" | "application/json; charset=utf-8" | "application/manifest+json; charset=utf-8" | "application/wasm" | "image/png" | "video/mp4" | "application/octet-stream"} ContentType
 */

/**
 * @typedef {"no-cache" | "max-age=31536000, immutable"} CacheControl
 */

/**
 * @typedef SendDataOptions
 * @property {string | Buffer} data
 * @property {number} [status]
 * @property {ContentType} [contentType]
 * @property {CacheControl} [cacheControl]
 * @property {{ [key: string]: string; }} [cookie]
 */

/**
 * @typedef SendHrefOptions
 * @property {string} href
 * @property {number} [status]
 * @property {{ [key: string]: string; }} [cookie]
 */

/**
 * @typedef PrivateHttpConnection
 * @property {string} method
 * @property {string} pathname
 * @property {string} search
 * @property {{ [key: string]: string }} searchParams
 * @property {{ [key: string]: string }} cookie
 * @property {Promise<string>} body
 * @property {import("node:http").IncomingHttpHeaders | import("node:http2").IncomingHttpHeaders} headers
 * @property {(sendDataOptions: SendDataOptions) => "success" | "failed-no-further-action"} sendData
 * @property {(sendHrefOptions: SendHrefOptions) => "success" | "failed-no-further-action"} sendHref
 */

/**
 * @param {import("./get-private-http-request.1.20.1.mjs").PrivateHttpRequest} privateHttpRequest
 * @returns {PrivateHttpConnection}
 */
export const getPrivateHttpConnection = (privateHttpRequest) => {
    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////

    const method = privateHttpRequest.method || "GET";

    /** @type {[ string, string ]} */ // @ts-ignore
    const [pathname, search = ""] = (privateHttpRequest.url || "/").split(/(?=\?)/, 2);

    /** @type {{[key: string]: string}} */
    const searchParams = Object.fromEntries(new URLSearchParams(search));

    /** @type {{[key: string]: string}} */
    const cookie = Object.fromEntries((privateHttpRequest.headers.cookie || "").split("; ").filter((keyValue) => {
        return keyValue.includes("=");
    }).map((keyValue) => {
        return keyValue.split("=", 2);
    }));

    /** @type {Promise<string>} */
    const body = new Promise((resolve) => {
        let data = "";

        privateHttpRequest.setRequestEncoding("utf-8");

        privateHttpRequest.onRequestData((chunk) => {
            if (typeof chunk === "string") {
                data += chunk;
            }
        });

        privateHttpRequest.onRequestEnd(() => {
            resolve(data);
        });

        setTimeout(() => {
            resolve(data);
        }, 20_000);
    });

    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////

    /**
     * @param {SendDataOptions} sendDataOptions
     * @returns {"success" | "failed-no-further-action"}
     */
    const sendData = (sendDataOptions) => {
        const writeResponseHeadStatus = privateHttpRequest.writeResponseHead(sendDataOptions.status || 200, {
            "Content-Type": sendDataOptions.contentType || "text/plain; charset=utf-8",
            "Cache-Control": sendDataOptions.cacheControl || "no-cache",
            "X-Content-Type-Options": "nosniff",
            ...(sendDataOptions.cookie && {
                "Set-Cookie": Object.entries(sendDataOptions.cookie).map((keyValueArray) => {
                    return keyValueArray.join("=");
                })
            })
        });

        if (writeResponseHeadStatus === "failed-writable-ended") {
            return "failed-no-further-action";
        }

        const writeResponseStatus = privateHttpRequest.writeResponse(sendDataOptions.data);

        if (writeResponseStatus === "failed-writable-ended") {
            return "failed-no-further-action";
        }

        const endResponseStatus = privateHttpRequest.endResponse();

        if (endResponseStatus === "failed-writable-ended") {
            return "failed-no-further-action";
        }

        return "success";
    };

    /**
     * @param {SendHrefOptions} sendHrefOptions
     * @returns {"success" | "failed-no-further-action"}
     */
    const sendHref = (sendHrefOptions) => {
        const writeResponseHeadStatus = privateHttpRequest.writeResponseHead(sendHrefOptions.status || 307, {
            Location: sendHrefOptions.href,
            ...(sendHrefOptions.cookie && {
                "Set-Cookie": Object.entries(sendHrefOptions.cookie).map((keyValueArray) => {
                    return keyValueArray.join("=");
                })
            })
        });

        if (writeResponseHeadStatus === "failed-writable-ended") {
            return "failed-no-further-action";
        }

        const endResponseStatus = privateHttpRequest.endResponse();

        if (endResponseStatus === "failed-writable-ended") {
            return "failed-no-further-action";
        }

        return "success";
    };

    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////

    return {
        method: method,
        pathname: pathname,
        search: search,
        searchParams: searchParams,
        cookie: cookie,
        body: body,
        headers: privateHttpRequest.headers,
        sendData: sendData,
        sendHref: sendHref
    };

    ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////
};
