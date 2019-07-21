
<script>
	export let post;
	export let session;
	import Publish from "./Publish.svelte";
</script>
<style>
.reactionz {
    border-radius: 0 0 3px 3px;
    color: #1c1e21;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    width: 100%;
    position: relative;
    word-wrap: break-word;
    margin-right: -1px;
    outline: none;
    padding-left: 1px;
}
.reaction_stats {
    position: relative;
}
.reaction_actions {
    display: flex;
    margin: 0 12px;
    min-height: 32px;
    padding: 4px 0;
}

.rs1 {
    align-items: center;
    border-bottom: 1px solid #dadde1;
    color: #606770;
    display: flex;
    line-height: 20px;
    margin: 10px 12px 0 12px;
    padding: 0 0 10px 0;
}
.ra1 {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    order: 1;
}

.rs_left {
    align-items: center;
    display: flex;
    flex-grow: 1;
    overflow: hidden;
}
.rs_center {
    flex-grow: 0;
    flex-shrink: 0;
    width: 7px;
}
.rs_right {
    display: flex;
    flex-shrink: 0;
}
.ra_item {
    align-items: center;
    display: flex;
    flex: 1 0;
    justify-content: center;
}

.rs_like {
    color: inherit;
    display: block;
    line-height: 16px;
    max-height: 16px;
    overflow: hidden;
}
.rs_like2 {
    float: left;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100px;
}

._42ft {
    cursor: pointer;
    display: inline-block;
    text-decoration: none;
    white-space: nowrap;
}
.rs_right {
    margin-left: 7px;
}

._18vj {
    align-items: center;
    color: #606770;
    display: flex;
    flex: 1 0;
    font-weight: 600;
    height: 32px;
    justify-content: center;
    line-height: 14px;
    padding: 0 2px;
    position: relative;
    text-decoration: none;
    transition: 400ms cubic-bezier(.08,.52,.52,1) transform;
}
.ra_like {
    z-index: 6;
}

.ra_announce {
    display: flex;
    flex: 1 0;
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

{#each post.attachment as attachment}
    {#if attachment.type === "Document" && attachment.mediaType.startsWith("image")}
        <img src={attachment.url} >
    {/if}
{/each}

<div class="reactionz">
    <div class="reaction_stats">
        <div class="rs1">
            <div class="rs_left">
                <a href="" rel="dialog" class="rs_like" tabindex="0" role="button">
                    <span aria-hidden="true" class="rs_like2">N likes</span>
                 </a>
            </div>
            <div class="rs_center"></div>
            <div class="rs_right">
                <span class="rs_right" >
                    <a class="_42ft" data-ft="" role="button" href="">N comments</a>
                </span>
                <span class="rs_right">
                    <a class="_42ft" href="" rel="dialog">N announces</a>
                </span>
            </div>
        </div>
    </div>
{#if session.user }
    <div class="reaction_actions">
        <div class="ra1">
            <span class="ra_item">
                <a aria-pressed="false" class="ra_like  _18vj"
                href="" role="button" tabindex="-1">Like</a>
            </span>
            <span class="ra_item">
                <a class="_18vj _42ft" role="button"
                tabindex="0" href="">Add comment</a>
            </span>
            <span class="ra_item">
                <span class="ra_announce">
                    <div>
                        <a class="_18vj" href="" role="button"
                        tabindex="0" >Announce</a>
                    </div>
                </span>
            </span>
        </div>
    </div>
<Publish reply={post.id} session={session}/>
{/if}
</div>

{/if}

