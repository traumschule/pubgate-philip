<script>
  export let session;
  export let curRoute;
  const protocol = base_url.match(/^https/) ? "https" : "http";

  import xhr from "../utils/xhr";
  import Collection from "./Collection.svelte";
  import Post from "./Post.svelte";

  // search user
  let username = "";
  let profile = null;
  let following = false;
  let outbox_collection = null;

  // search post
  let loadedPost = "";
  let postLink = "";
  let error = "";

  async function search(event) {
    error = "";
    profile = null;
    outbox_collection = null;
    let pair = username.split("@");
    if (pair.length !== 2) {
      return (error = "Use this format: username@domain");
    }
    let profile_url = `${protocol}://${pair[1]}/@${pair[0]}`;

    if (pubgate_instance) {
      const res = await fetch(base_url + "/proxy", {
        method: "POST",
        body: JSON.stringify({ url: profile_url }),
      }).then(d => d.json());
      if (res.error) {
        return (error = JSON.stringify(res.error.strerror || res.error));
      }
      profile = res;

      const body = JSON.stringify({ url: profile.outbox });
      const req = { method: "POST", body };
      const resp = await fetch(base_url + "/proxy", req).then(d => d.json());
      if (!resp) {
        return (error = "Failed to fetch timeline.");
      }

      outbox_collection =
        typeof resp.first === "string"
          ? await fetchTimeline(resp.first)
          : resp.first;
    } else {
      const headers = { Accept: "application/activity+json" };
      const response = await fetch(profile_url, headers).then(d => d.json());
      if (profile.outbox) outbox_collection = profile.outbox;
    }
  }

  const fetchTimeline = async url => {
    return await fetch(base_url + "/proxy", {
      method: "POST",
      body: JSON.stringify({ url: res.first }),
    }).then(d => d.json());
  };

  const follow = async event => {
    const type = event.target.innerText;
    const { id, name } = profile; // OPTIMIZE kind of quirky to pull this form parent
    if (!$session.user) error = "You are not logged in.";
    else if (pubgate_instance) {
      const body = JSON.stringify({ type, object: id });
      const headers = { Authorization: "Bearer " + $session.token };
      const outbox = $session.user.outbox;
      const req = { method: "POST", body, headers };
      const res = await fetch(outbox, req).then(d => d.json());
      if (!res) error = `Empty response trying to ${type} ${name}`;
      else if (res.Created === "success")
        following = type === "Follow" ? true : false;
      else if (res.error)
        if (res.error === "This user is already followed") following = true;
        else error = JSON.stringify(res.error);
      else error = "Something went wrong.";
    }
  };

  async function loadPost(event) {
    error = loadedPost = "";
    try {
      const response = await xhr(postLink);
      const { type } = response;
      if (type !== "Note") {
        return (error = `Wrong type: ${type}`);
      }
      loadedPost = response;
      postLink = "";
    } catch (e) {
      error = e.message;
    }
  }
</script>

<br />
Search accounts
<form on:submit|preventDefault={search}>
  <fieldset class="form-group">
    <input
      class="form-control form-control-lg"
      type="text"
      placeholder="Search format: username@domain"
      bind:value={username} />
  </fieldset>
  <button
    class="btn btn-sm pull-xs-right btn-info"
    type="submit"
    disabled={!username}>
    Search user
  </button>
</form>
<br />
<br />
Load Post by link
<form on:submit|preventDefault={loadPost}>
  <fieldset class="form-group">
    <input
      class="form-control form-control-lg"
      type="text"
      placeholder="Copy a link here"
      bind:value={postLink} />
  </fieldset>
  <button
    class="btn btn-sm pull-xs-right btn-info"
    type="submit"
    disabled={!postLink}>
    Load post
  </button>
</form>
<br />
<br />

{#if profile}
  <h2>
    {profile.name}
    <button class="btn btn-sm pull-xs-right btn-info" on:click={follow}>
      {#if following}Unfollow{:else}Follow{/if}
    </button>
  </h2>
  {profile.summary}
  {#if outbox_collection}
    <Collection {session} collection={outbox_collection} />
  {/if}
{/if}

{#if typeof loadedPost === 'object'}
  <Post post={loadedPost} {session} />
{/if}

<p class="text-danger">{error}</p>
