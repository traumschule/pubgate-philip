<script>
    export let active_tab;
    export let session;
	import Post from "./Post.svelte"

	let pgi = pubgate_instance;

	const fetchCollection = function(path, session={}) {
	    let headers_set = {
            "Accept": "application/activity+json"
        };
	    if (session.user) {
            headers_set['Authorization'] = "Bearer" + session.user.token
	    }
	    return fetch(path, { headers: headers_set}).then(d => d.json())
	        .then(d => d.first.orderedItems);
	};

	const getTimeline = function(tab, session) {
        switch (tab) {
          case 'local':
            return pgi ? fetchCollection(base_url + "/timeline/local?cached=1"): [];
          case 'federated':
            return pgi ? fetchCollection(base_url + "/timeline/federated?cached=1"): [];
          case 'inbox':
            return pgi ? fetchCollection(session.user.inbox + "?cached=1", session):
                fetchCollection(session.user.inbox, session);
          case 'profile':
            return pgi ? fetchCollection(session.user.outbox + "?cached=1"):
                fetchCollection(session.user.outbox);
          default:
            return []
        }
	};
    $: posts = getTimeline(active_tab, session)


</script>

{#await posts then value}
<ul class="post-list">
    {#each value as post}

        <Post post={post} />

    {/each}
</ul>
{/await}