
<script>
	export let post;
	export let session;
	import Post from "./Post.svelte";
	import xhr from "./utils/xhr";
	import { ensureObject } from "./utils/objectUtils";

	let postObject;
	let isReaction = false;

	if (["Announce", "Like"].includes(post.type)) {
	    postObject = ensureObject(post.object);
	    // if (typeof post.object === "string") {
	    //     fpost = xhr(post.object);
        //     postObject = fpost => fpost.object;
	    // } else {
	    //     postObject = post.object;
	    // }
	    isReaction = true
    }
</script>

<style>
    .reaction {
        margin-left: 30px;
    }
</style>

<li class="post">
    {#if isReaction == false}

        <h2 id=""> . </h2>
        <Post post={post.object} session={session}/>

    {:else}

        <div class="metadata">
            <h2 id=""> . </h2>
            <a href="{post.id}">{post.type}</a> by user <a href="{ post.actor }">{ post.actor }</a>
            <span class="metadata-seperator">·</span>

            {#if post.published }
            <span>{ post.published.replace("T", " ").replace("Z", " ") }</span>
            {/if}
        </div>
        <div class="reaction">
            <Post post={postObject} session={session}/>
        </div>

    {/if}
</li>