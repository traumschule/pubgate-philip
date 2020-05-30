<script>
  import Post from "./Post.svelte";

  import { fetchObject } from "../utils";

  export let curRoute;
  export let session;
  let pgi = pubgate_instance;
  let id = $curRoute.match(/^\/@([^\/]+)\/object\/(.+)$/)[2];

  $: object = fetchObject($curRoute);
</script>

{#await object}
  So you want to see object {id}?
{:then post}
  <Post {post} {session} />
{/await}
