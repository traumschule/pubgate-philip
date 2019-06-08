<script>
    export let posts;
    console.log(posts);
	import Post from "./Post.svelte"
</script>

{#await posts then value}
<ul class="post-list">
{console.log(value)}
    {#each value as post}
        <Post post={post} />
    {/each}
</ul>
{/await}