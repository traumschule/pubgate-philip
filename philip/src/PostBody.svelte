
<script>
	export let post;
</script>

{#if typeof post === 'string'}
<p>{@html post }</p>

{:else}
<div class="metadata">
    <a href="{post.id}">{post.type}</a> by user <a href="{ post.attributedTo }">{ post.attributedTo.split('/').pop() }</a>
    <span class="metadata-seperator">·</span>
    <span>{ post.published.replace("T", " ").replace("Z", " ")}</span>
</div>
{#if post.tag}
    <div class="tags">
    {#each post.tag as tag}
        {#if tag.type == 'Hashtag'}
            <a class="tag" href="{ tag.href }">{ tag.name }</a>
        {/if}
    {/each}
    </div>
{/if}

<p>{@html post.content }</p>
{/if}

