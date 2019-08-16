
<script>
	export let post;
	export let session;
	import PostBody from "./PostBody.svelte";
	import xhr from "./utils/xhr";

	let fpost;
	let post_object;
	let fetched_post = false;

	if (["Announce", "Like"].includes(post.type)) {
	    if (typeof post.object === "string") {
	        fpost = xhr(post.object);

            // fpost = fetch(post.object, { headers: {
            //     "Accept": "application/activity+json"
            // }}).then(d => d.json());
            post_object = fpost => fpost.object;
	    } else {
	        post_object = post.object;
	    }

	    fetched_post = true
    }
</script>

<style>
    .reaction {
        margin-left: 30px;
    }
</style>

{#if fetched_post == false}
<li class="post">
    <h2 id=""> . </h2>
    <PostBody post={post.object} session={session}/>
</li>

{:else}
<li class="post">
    <div class="metadata">
        <h2 id=""> . </h2>
        <a href="{post.id}">{post.type}</a> by user <a href="{ post.actor }">{ post.actor.split('/').slice(-1)[0] }</a>
        <span class="metadata-seperator">·</span>

        {#if post.published }
        <span>{ post.published.replace("T", " ").replace("Z", " ") }</span>
        {/if}
    </div>
    <div class="reaction">
        <PostBody post={post_object} session={session}/>
    </div>
</li>
{/if}
