
<script>
	export let post;
	export let session;
	import Publish from "./Publish.svelte";
	import PostContent from "./PostContent.svelte";
	import { ensureObject } from "./utils/objectUtils";

    let showPublish = false;
    const togglePublish = ev => {
        ev.preventDefault();
        showPublish = !showPublish
    };

    const toggleLists = ev => {
        ev.preventDefault();
    };

    let inReply;
    let isReply = false;

    let likes = 'n/a';
    let comments;
    let announces = 'n/a';

    let liked;
    let announced;
    console.log(post);


    if (post.inReplyTo) {
        inReply = ensureObject(post.inReplyTo);
        isReply = true
    }

    let customType = isReply ? "Reply" : null

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

.reaction {
    margin-left: 30px;
}

</style>

{#if isReply == true}
    <div class="reaction">
        {#if typeof(inReply) === 'object' && typeof(inReply.id) != 'string'}
            {#await inReply then value}
                <PostContent post={value}/>
            {/await}
         {:else}
            <PostContent post={inReply}/>
         {/if}
    </div>
{/if}

<PostContent post={post} customType={customType}/>


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



