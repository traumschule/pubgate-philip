
<script>
	export let post;
	let fpost;
	let fetched_post = false;
	if (["Announce", "Like"].includes(post.type)) {
	    console.log(post);
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
    <div class="metadata">
        <a href="{post.id}"><h2 id="">.</h2></a>
        <span>User <a href="{ post.actor }">{ post.actor.split('/').slice(-1)[0] }</a></span>
        <span class="metadata-seperator">·</span>
        <span>{ post.published.replace("T", " ").replace("Z", " ")}</span>
    </div>
    <div class="tags">
    {#each post.object.tag as tag}
        <a class="tag" href="{ tag.href }">{ tag.name }</a>
    {/each}
    </div>
    <p>{@html post.object.content }</p>
</li>
{:else}
{#await fpost then fpost}
<li class="post">
    <div class="metadata">
        <a href="{fpost.id}"><h2 id="">.</h2></a>
        <span>{post.type} by user <a href="{ fpost.actor }">{ fpost.actor.split('/').slice(-1)[0] }</a></span>
        <span class="metadata-seperator">·</span>
        <span>{ post.published.replace("T", " ").replace("Z", " ")}</span>
    </div>
    <div class="reaction">
        <div class="metadata">
            <a href="{fpost.id}"><h2 id="">.</h2></a>
            <span>User <a href="{ fpost.actor }">{ fpost.actor.split('/').slice(-1)[0] }</a></span>
            <span class="metadata-seperator">·</span>
            <span>{ fpost.published.replace("T", " ").replace("Z", " ")}</span>
        </div>
        <div class="tags">
        {#each fpost.object.tag as tag}
            <a class="tag" href="{ tag.href }">{ tag.name }</a>
        {/each}
        </div>
        <p>{@html fpost.object.content }</p>
     </div>
</li>
{/await}
{/if}
