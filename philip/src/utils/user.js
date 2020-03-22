let baseProtocol, baseDomain;
const m = base_url.match(/^([^:]+):\/\/([^/]+)/);
if (m) {
  baseProtocol = m[1];
  baseDomain = m[2];
}

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
  console.log("fyn", fynRes);
  if (fynRes && !fynRes.error) return fynRes;

  const wfRes = await fetchUser(getUserId(name, domain, false), useProxy);
  console.log("wf", wfRes);
  if (!wfRes || wfRes.error) return wfRes;
  const id = wfRes.aliases[1] || wfRes.links[0].href;
  return await fetchUser(id, useProxy);
};

export const fetchUser = async (url, useProxy = true) => {
  if (useProxy) {
    //TODO require auth, merge with xhr?
    const req = { method: "POST", body: JSON.stringify({ url }) };
    return await fetch(base_url + "/proxy", req).then(d => d.json());
  }
  try {
    // might not return json
    const headers = { Accept: "application/activity+json" };
    return await fetch(url, headers).then(d => d.json());
  } catch (error) {
    return { error };
  }
};

export const fetchOutbox = async url => {
  const req = { method: "POST", body: JSON.stringify({ url }) };
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
