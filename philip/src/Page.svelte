<script>
    export let active_tab;
	import Post from "./Post.svelte"

	let pubgate_url_map = {
	    'local': "/timeline/local?cached=1",
	    'federated': "/timeline/federated?cached=1"
	};

	const fetchTimeline = (isLocal, path) => isLocal
	?  fetch(base_url + path).then(d => d.json()).then(d => d.first).then(d => d.orderedItems) : [];

    $: posts = fetchTimeline(pubgate_instance, pubgate_url_map[active_tab])


</script>

{#await posts then value}
<ul class="post-list">
    {#each value as post}

        <Post post={post} />

    {/each}
</ul>
{/await}