<script>
  export let curRoute;
  export let session;
  export let outbox_collection = {};
  import Activity from "./Activity.svelte";

  let pgi = pubgate_instance;

  const fetchCollection = function(path, session = {}, inbox = false) {
    let headers = {
      Accept: "application/activity+json",
    };
    if (session.user && inbox) {
      headers["Authorization"] = "Bearer " + session.token;
    }
    return fetch(path, { headers })
      .then(d => d.json())
      .then(d => d.first.orderedItems);
  };

  const getTimeline = function(tab, session) {
    switch (tab) {
      case "/local":
        return pgi
          ? fetchCollection(base_url + "/timeline/local?cached=1")
          : [];
      case "/federated":
        return pgi
          ? fetchCollection(base_url + "/timeline/federated?cached=1")
          : [];
      case "/inbox":
        if (!session.user) return [];
        return pgi
          ? fetchCollection(session.user.inbox + "?cached=1", session, true)
          : fetchCollection(session.user.inbox, session);
      case "/profile":
        return pgi
          ? fetchCollection(session.user.outbox + "?cached=1")
          : fetchCollection(session.user.outbox);
      case "/search":
        return outbox_collection.orderedItems;
      default:
        return [];
    }
  };
  $: posts = getTimeline($curRoute, $session);
</script>

{#await posts then value}
  <ul class="post-list">
    {#each value as post}
      <Activity {post} {session} />
    {/each}
  </ul>
{/await}
