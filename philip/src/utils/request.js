const headers = { Accept: "application/activity+json" };
let baseProtocol, baseDomain;
const matchUrl = base_url.match(/^([^:]+):\/\/([^/]+)/);
if (matchUrl) {
  baseProtocol = matchUrl[1];
  baseDomain = matchUrl[2];
}

// TODO session

// generic request

export const xhr = (url, options = {}) => {
  let defaultOptions = { headers };
  return fetch(url, Object.assign(defaultOptions, options))
    .then(d => d.json())
    .catch(error => {
      console.log(error);
      console.log("fetching");
      //TODO make auth required to use proxy, check if pgi
      return fetch(base_url + "/proxy", {
        method: "POST",
        body: JSON.stringify({ url: url }),
      })
        .then(d => d.json())
        .catch(error => {
          console.log(error);
        });
    });
};

export const fetchLocal = async (url, params = {}) => {
  return fetch(url, Object.assign({ headers }, params)).then(d =>
    d.json().catch(error => {
      console.log("request failed:", url, error);
    })
  );
};

// Timeline, Collection
export const fetchCollection = function(path, session = {}, inbox = false) {
  let Headers = headers;
  if (session.user && inbox)
    Headers["Authorization"] = "Bearer " + session.token;
  return fetch(path, { headers: Headers })
    .then(d => d.json())
    .then(d => d);
};

// Post
export const fetchItem = path => {
  const url = pgi ? path + "?cached=1" : path;
  return fetch(url, { headers })
    .then(d => d.json())
    .then(d => d);
};

export const fetchObject = path => {
  return fetch(base_url + path, { headers })
    .then(d => d.json())
    .then(d => d);
};

// Search
export const fetchOutbox = async url => {
  const req = { method: "POST", body: JSON.stringify({ url }) };
  // TODO check cache
  const res = await fetch(base_url + "/proxy", req).then(d => d.json());
  if (res.error) return res;
  return typeof res.first === "string"
    ? await fetchTimeline(res.first)
    : res.first;
};
const fetchTimeline = async url => {
  const req = { method: "POST", body: JSON.stringify({ url }) };
  return await fetch(base_url + "/proxy", request).then(d => d.json());
};

// Search User / Post
export const getUserId = (name, domain = baseDomain, fyn = true) => {
  const protocol = domain === baseDomain ? baseProtocol : "https";
  return (
    `${protocol}://${domain}/` +
    (fyn ? `@${name}` : `.well-known/webfinger?resource=acc:${name}@${domain}`)
  );
};

export const findUser = async (name, domain) => {
  const useProxy = pubgate_instance ? true : false;
  const fynRes = await fetchUser(getUserId(name, domain), useProxy);
  //console.log("fyn", fynRes);
  if (fynRes && !fynRes.error) return fynRes;

  const wfRes = await fetchUser(getUserId(name, domain, false), useProxy);
  //console.log("wf", wfRes);
  if (!wfRes || wfRes.error) return wfRes;
  const id = wfRes.aliases[1] || wfRes.links[0].href;
  return await fetchUser(id, useProxy);
};

export const findPost = async url => {
  try {
    const response = await xhr(url);
    const { type } = response;
    if (type !== "Note") return { error: `Wrong type: ${type}` };
    return response;
  } catch (e) {
    return { error: e.message };
  }
};

export const fetchUser = async url => {
  return fetch(url, { headers }).then(d => d.json());
};

export const followUser = async (session, body) => {
  const Headers = headers;
  Headers["Authorization"] = "Bearer " + session.token;
  const req = { method: "POST", body, headers: Headers };
  const res = await fetch(session.user.outbox, req).then(d => d.json());
  return res;
};

export const publishPost = async (session, body) => {
  try {
    const headers = { Authorization: "Bearer " + session.token };
    const req = { method: "POST", body, headers };
    console.log("sending", req);
    const res = await fetch(session.user.outbox, req).then(d => d.json());
    console.log("response", res);
    return res;
  } catch (error) {
    console.log("publish failed", error);
    return { error };
  }
};
