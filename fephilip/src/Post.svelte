
<script>
	export let post;
	console.log(post);
</script>

<li class="post">
    <a href="{ post.id }"><h2 id="post-{ post.name }">{ post.title }</h2></a>

    <p>{@html post.object.content }</p>
</li>
