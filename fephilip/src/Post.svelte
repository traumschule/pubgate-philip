
<script>
	export let post;
</script>

<li class="post">
    <div class="metadata">
        <a href="{post.id}"><h2 id="">.</h2></a>
        <span>User <a href="{ post.actor }">{ post.actor.split('/')[3] }</a></span>
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
