
<script>
	export let post;
</script>

<div class="metadata">
    <a href="{post.id}">Create</a> by user <a href="{ post.attributedTo }">{ post.attributedTo.split('/').pop() }</a>
    <span class="metadata-seperator">·</span>
    <span>{ post.published.replace("T", " ").replace("Z", " ")}</span>
</div>
<div class="tags">
{#each post.tag as tag}
    <a class="tag" href="{ tag.href }">{ tag.name }</a>
{/each}
</div>
<p>{@html post.content }</p>

