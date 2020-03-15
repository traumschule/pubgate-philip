<script>
  export let session;
  export let curRoute;

  import xhr from "../utils/xhr";
  import TimeLine from "./TimeLine.svelte";
  import Post from "./Post.svelte";
  import { readable } from "svelte/store";
  const timelineRoute = readable("/search");

  // search user
  let username = "";
  let outbox_collection = null;
  let searched_profile = null;

  // search post
  let loadedPost = "";
  let postLink = "";
  let error = "";

  async function search(event) {
    outbox_collection = null;
    let pair = username.split("@");
    let profile_url = "https://" + pair[1] + "/@" + pair[0];
    let collection;
    if (pubgate_instance) {
      const profile = await fetch(base_url + "/proxy", {
        method: "POST",
        body: JSON.stringify({ url: profile_url }),
      }).then(d => d.json());

      searched_profile = profile;
      const outbox = await fetch(base_url + "/proxy", {
        method: "POST",
        body: JSON.stringify({ url: profile.outbox }),
      }).then(d => d.json());

      if (typeof outbox.first === "string") {
        collection = await fetch(base_url + "/proxy", {
          method: "POST",
          body: JSON.stringify({ url: outbox.first }),
        }).then(d => d.json());
      } else {
        collection = outbox.first;
      }
      outbox_collection = collection;
    } else {
      const profile = await fetch(profile_url, {
        headers: {
          Accept: "application/activity+json",
        },
      }).then(d => d.json());

      if (profile.outbox) {
        outbox_collection = profile.outbox;
      }
    }
  }

  async function follow(event) {
    if (pubgate_instance) {
      let ap_object = {
        type: "Follow",
        object: searched_profile.id,
      };
      const response = await fetch($session.user.outbox, {
        method: "POST",
        body: JSON.stringify(ap_object),
        headers: { Authorization: "Bearer " + $session.token },
      }).then(d => d.json());
    }
  }

  async function loadPost(event) {
    error = loadedPost = "";
    try {
      const response = await xhr(postLink);
      const { type } = response;
      if (type !== "Note") {
        error = `Wrong type: ${type}`;
        return;
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

{#if outbox_collection}
  <h2>
    {username}
    {#if $session.user}
      <button class="btn btn-sm pull-xs-right btn-info" on:click={follow}>
        Follow
      </button>
    {/if}
  </h2>
  <TimeLine curRoute={timelineRoute} {session} {outbox_collection} />
{/if}

{#if typeof loadedPost === 'object'}
  <Post post={loadedPost} {session} />
{/if}

<p class="text-danger">{error}</p>
