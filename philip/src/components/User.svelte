<script>
  import TimeLine from "./TimeLine.svelte";
  import { readable } from "svelte/store";
  const timelineRoute = readable("/search");

  export let curRoute;
  export let session;

  const username = $curRoute.match(/^\/@([^\/]+)$/)[1];
  let timeline = null;
  let followers = null;
  let following = null;
  let liked = null;

  let headers = { Accept: "application/activity+json" };
  const fetchJSON = (url, cb = d => d) =>
    fetch(url, { headers })
      .then(d => d.json())
      .then(cb);

  const fetchUser = path => {
    return fetch(base_url + path, { headers })
      .then(d => d.json())
      .then(d => {
        console.log("[User]Fetching timeline", d.outbox);
        timeline = fetchJSON(d.outbox, d => d.first);
        followers = fetchJSON(d.followers);
        following = fetchJSON(d.following);
        liked = fetchJSON(d.liked);
        return d;
      });
  };

  $: profile = fetchUser($curRoute);
</script>

{#await profile}
  Shortly this page will show info about
  <b>{username}</b>
{:then user}
  <h2>
    <a href={user.url}>{user.name}</a>
  </h2>
  <p>
    <a href={user.followers}>Followers</a>
    |
    <a href={user.following}>Following</a>
    |
    <a href={user.outbox}>Timeline</a>
    |
    <a href={user.liked}>Liked</a>
  </p>

  <p>{user.summary}</p>

  {#await followers}
    Loading followers ..
  {:then outbox_collection}
    {#if outbox_collection.length}
      <h3>Followers</h3>
      <TimeLine curRoute={timelineRoute} {session} {outbox_collection} />
    {/if}
  {/await}

  {#await following}
    Loading following ..
  {:then outbox_collection}
    {#if outbox_collection.length}
      <h3>Following</h3>
      <TimeLine curRoute={timelineRoute} {session} {outbox_collection} />
    {/if}
  {/await}

  {#await liked}
    Loading liked posts ..
  {:then outbox_collection}
    {#if outbox_collection.length}
      <h3>Liked</h3>
      <TimeLine curRoute={timelineRoute} {session} {outbox_collection} />
    {/if}
  {/await}

  {#await timeline}
    Loading posts ..
  {:then outbox_collection}
    <h3>Posts</h3>
    <TimeLine curRoute={timelineRoute} {session} {outbox_collection} />
  {/await}
{/await}
