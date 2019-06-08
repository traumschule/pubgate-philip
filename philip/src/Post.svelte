
<script>
	export let post;
	import PostBody from "./PostBody.svelte"
	let fpost;
	let fetched_post = false;
	if (["Announce", "Like"].includes(post.type)) {
	    fpost = fetch(post.object, { headers: {
	        "Accept": "application/activity+json"
	    }}).then(d => d.json());
	    fetched_post = true
    }
</script>

<style>
    .reaction {
        margin-left: 30px;
    }

</style>

{#if fetched_post == false}
<li class="post">
    <h2 id=""> . </h2>
    <PostBody post={post.object} />
</li>
{:else}
{#await fpost then fpost}
<li class="post">
    <div class="metadata">
        <h2 id=""> . </h2>
        <a href="{post.id}">{post.type}</a> by user <a href="{ post.actor }">{ post.actor.split('/').slice(-1)[0] }</a>
        <span class="metadata-seperator">·</span>
        <span>{ post.published.replace("T", " ").replace("Z", " ")}</span>
    </div>
    <div class="reaction">
        <PostBody post={fpost} />
    </div>
</li>
{/await}
{/if}
