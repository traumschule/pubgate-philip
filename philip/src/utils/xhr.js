export default function xhr(url, options = {}, accept = "application/activity+json") {
    let defaultOptions = {
        headers: {
            "Accept": accept
        }
    };

    return fetch(url, Object.assign(defaultOptions, options))
        // .then(handleErrors)
        .then(d => d.json())
        .catch((error) => {
            console.log(error);
            console.log('fetching');
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


// function handleErrors(response) {
//     console.log(response);
//     if (!response.ok) {
//         return response.json().then(error => {
//             return Promise.reject(error);
//         });
//     }
//
//     return response;
// }