export default function xhr(url, options = {}, accept = "application/activity+json") {
    let defaultOptions = {
        headers: {
            "Accept": accept
        }
    };

    return fetch(url, Object.assign(defaultOptions, options)).then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }

        return response;
    })
    .then(response => response.json());
}
