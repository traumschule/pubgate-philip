export default function xhr(url, options = {}, accept = "application/activity+json") {
    let defaultOptions = {
        headers: {
            "Accept": accept
        }
    };

    return fetch(url, Object.assign(defaultOptions, options))
        .then(d => d.json())
        .catch((error) => {
            console.log(error);
            console.log('fetching');
            //TODO make auth required to use proxy, check if pgi
            return fetch(base_url + "/proxy", {
                method: 'POST',
                body: JSON.stringify({url: url})
            })
                .then(d => d.json())
                .catch((error) => {
                    console.log(error);
                });

        });
}
