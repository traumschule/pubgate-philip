
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

    let liked;
    let announced;
    if (session.user) {

        if (post.reactions) {
            if (post.reactions.Like) {
                if (post.reactions.Like[session.user.name]) {
                    $: liked = true
                }
            }
        }

        if (post.reactions) {
            if (post.reactions.Announce) {
                if (post.reactions.Announce[session.user.name]) {
                    $: announced = true
                }
            }
        }
    }

    let inReply;
    let isReply = false;

    let likes = 'n/a';
    let comments = 'n/a';
    let announces = 'n/a';

    if (post.inReplyTo) {
        inReply = ensureObject(post.inReplyTo);
        isReply = true
    }

    if (post.likes) {
        likes = post.likes.totalItems
    }

    if (post.shares) {
        announces = post.shares.totalItems
    }

    if (post.replies) {
        comments = post.replies.totalItems
    }

    let customType = isReply ? "Reply" : null

    async function doLike(ev) {
        ev.preventDefault();
        if (!liked) {
            let ap_object = {
                "type": "Like",
                "object": post.id ,
                "cc": [post.attributedTo]
            };
            const response = await fetch(session.user.outbox, {
                method: 'POST',
                body: JSON.stringify(ap_object),
                headers : {'Authorization': "Bearer " + session.token}
            }).then(d => d.json());
            $: liked = true
        }
    }

    async function doAnnounce(ev) {
        ev.preventDefault();
        if (!announced) {
            let ap_object = {
                "type": "Announce",
                "object": post.id ,
                "cc": [post.attributedTo]
            };
            const response = await fetch(session.user.outbox, {
                method: 'POST',
                body: JSON.stringify(ap_object),
                headers : {'Authorization': "Bearer " + session.token}
            }).then(d => d.json());
            $: announced = true
        }
    }


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
           <a class="rs_left" href="" on:click={toggleLists}>{likes} likes</a>
           <a class="rs_right" href="" on:click={toggleLists}>{comments} comments</a>
           <a class="rs_right" href="" on:click={toggleLists}>{announces} announces</a>
    </div>
    {#if session.user }
        <div class="ra">
            <a class="ra_item" href=""  on:click={doLike}>Like{#if liked}d{/if}</a>
             <a class="ra_item" href="" on:click={togglePublish}>Add comment</a>
             <a class="ra_item" href="" on:click={doAnnounce}>Announce{#if announced}d{/if}</a>
         </div>
        {#if showPublish}
            <Publish reply={post} session={session}/>
        {/if}
    {/if}
</div>
