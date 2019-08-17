export default function xhr(url, options = {}, accept = "application/activity+json") {
    let defaultOptions = {
        headers: {
            "Accept": accept
        }
    };

    return fetch(url, Object.assign(defaultOptions, options))
        // .then(handleErrors)
        .then(response => response.json())
        .catch((error) => {
          console.log(error);
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