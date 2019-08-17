
<script>
	export let post;
	export let session;
	import Publish from "./Publish.svelte";

    let showPublish = false;
    const togglePublish = ev => {
        ev.preventDefault();
        showPublish = !showPublish
    };

    const toggleLists = ev => {
        ev.preventDefault();
    };

    let likes;
    let comments;
    let announces;

    let liked;
    let announced;

</script>
<style>
.reactionz {
    font-size: 18px;
}
.rs {
    border-bottom: 1px solid #dadde1;
    display: flex;
}
.ra {
    padding: 4px 0;
    display: flex;
}

.rs_left {
    flex-grow: 1;
}
.rs_right {
    margin-left: 7px;
}
.ra_item {
    flex: 1 0;
    align-items: center;
    color: #606770;
    display: flex;
    font-weight: 600;
    height: 32px;
    justify-content: center;
}

</style>


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
    {#if post.attachment}
        {#each post.attachment as attachment}
            {#if attachment.type === "Document" && attachment.mediaType.startsWith("image")}
                <img src={attachment.url} >
            {/if}
        {/each}
    {/if}
{/if}

<div class="reactionz">
    <div class="rs">
           <a class="rs_left" href="" on:click={toggleLists}>N likes</a>
           <a class="rs_right" href="" on:click={toggleLists}>N comments</a>
           <a class="rs_right" href="" on:click={toggleLists}>N announces</a>
    </div>
    {#if session.user }
        <div class="ra">
            <a class="ra_item" href="">Like{#if liked}d{/if}</a>
                 <a class="ra_item" href="" on:click={togglePublish}>Add comment</a>
                 <a class="ra_item" href="" >Announce{#if announced}d{/if}</a>
             </div>
        {#if showPublish}
            <Publish reply={post} session={session}/>
        {/if}
    {/if}
</div>



