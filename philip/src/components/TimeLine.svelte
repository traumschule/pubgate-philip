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
      .then(d => updatePageLinks(d));
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

  // pagination

  let homeUrl, prevUrl, nextUrl, page;

  const selectPage = query => {
    let args = query.split("?");
    let url = args.shift(); // pull out first argument
    if (pgi) args.push("cached=1");
    posts = fetchCollection(url + "?" + args.join("&"), session);
  };

  const updatePageLinks = d => {
    let pageMatch = /page=(\d+)$/.exec(d.id);
    page = pageMatch ? parseInt(pageMatch[1]) : 1;
    homeUrl = page > 1 && d.partOf ? d.partOf : null;
    prevUrl = page > 1 ? `${homeUrl}?page=${page - 1}` : null;
    nextUrl = d.next;
    return d.first ? d.first.orderedItems : d.orderedItems;
  };
</script>

<style>
  .navigation {
  }
</style>

{#await posts then value}
  <ul class="post-list">
    {#each value as post}
      <Activity {post} {session} />
    {/each}
  </ul>

  <div class="navigation">
    {#if homeUrl}
      <span on:click={() => selectPage(homeUrl)}>First</span>
    {/if}
    {#if prevUrl}
      <span on:click={() => selectPage(prevUrl)}>Previous</span>
    {/if}
    {#if page}
      <b>{page}</b>
    {/if}
    {#if nextUrl}
      <span on:click={() => selectPage(nextUrl)}>Next</span>
    {/if}
  </div>
{/await}
