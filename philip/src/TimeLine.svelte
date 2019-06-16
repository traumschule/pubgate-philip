<script>
    export let posts;
	import Post from "./Post.svelte"
</script>

{#await posts then value}
<ul class="post-list">
    {#each value as post}

        <Post post={post} />

    {/each}
</ul>
{/await}