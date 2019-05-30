import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		posts:  [{"id": 1, "object": {"content": "bu"}},
				 {"id": 2, "object": {"content": "fu"}}]
	}
});

export default app;