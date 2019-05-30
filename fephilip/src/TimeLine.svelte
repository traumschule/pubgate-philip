<script>
    export let posts;
	import Post from "./Post.svelte"
</script>

<ul class="post-list">

    {#each posts as post}
        <Post post={post} />
    {/each}

</ul>