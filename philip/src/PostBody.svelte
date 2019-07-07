
<script>
	export let post;
	export let session;
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

._3dlf {
    color: inherit;
    display: block;
    line-height: 16px;
    max-height: 16px;
    overflow: hidden;
}
._3dlg {
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
._4vn2+._4vn2 {
    margin-left: 7px;
}


._18vj._18vj {
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
._3l2t {
    z-index: 6;
}
._42ft {
    cursor: pointer;
    display: inline-block;
    text-decoration: none;
    white-space: nowrap;
}
._1j6m {
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
<div class="reactionz">
    <div class="reaction_stats">
        <div class="rs1">
            <div class="rs_left">
                <a href="" rel="dialog" class="_3dlf" tabindex="0" role="button">
                    <span aria-hidden="true" class="_3dlg">
                        <span class="_3dlh">
                            <span class="_81hb">248 likes</span>
                        </span>
                    </span>
                 </a>
            </div>
            <div class="rs_center"></div>
            <div class="rs_right">
                <span class="_1whp _4vn2" >
                    <a class="_3hg- _42ft" data-ft="" role="button" href="">62 comments</a>
                </span>
                <span class="_355t _4vn2">
                    <a class="_3rwx _42ft" href="" rel="dialog">7 announces</a>
                </span>
            </div>
        </div>
    </div>
    <div class="reaction_actions">
        <div class="ra1">
            <span class="ra_item">
                <a aria-pressed="false" class=" _6a-y _3l2t  _18vj"
                href="" role="button" tabindex="-1">Like</a>
            </span>
            <span class="ra_item">
                <a class=" _666h  _18vj _18vk _42ft" role="button"
                tabindex="0" href="">Add comment</a>
            </span>
            <span class="ra_item">
                <span class="_1j6m">
                    <div class="_6800 uiPopover _6a">
                        <a class="_2nj7 _18vj _18vk _p" href="" role="button"
                        tabindex="0" aria-controls="u_2b_0">Announce</a>
                    </div>
                </span>
            </span>
        </div>
    </div>
</div>
{/if}

