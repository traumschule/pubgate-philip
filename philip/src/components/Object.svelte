<script>
  import Post from "./Post.svelte";

  export let curRoute;
  export let session;

  let id = $curRoute.match(/^\/@([^\/]+)\/object\/(.+)$/)[2];

  const fetchObject = function(path, session = {}) {
    let headers_set = {
      Accept: "application/activity+json",
    };
    return fetch(base_url + path, { headers: headers_set })
      .then(d => d.json())
      .then(d => d);
  };

  $: object = fetchObject($curRoute, $session);
</script>

{#await object}
  So you want to see object {id}?
{:then post}
  <Post {post} {session} />
{/await}
