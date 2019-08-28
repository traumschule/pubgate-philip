
<script>
	export let post;
	export let customType = null;
</script>

{#if post.id}
    <div class="metadata">

        <a href="{post.id}">{#if customType}
            {customType}{:else}{post.type}
        {/if}</a> by user <a href="{ post.attributedTo }">{ post.attributedTo }</a>
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
    {#if post.attachment}
        {#each post.attachment as attachment}
            {#if attachment.type === "Document" && attachment.mediaType.startsWith("image")}
                <img src={attachment.url} >
            {/if}
        {/each}
    {/if}

{:else}
    <a href="{post}">{post}</a>
{/if}