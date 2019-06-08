
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = key && { [key]: value };
            const child_ctx = assign(assign({}, info.ctx), info.resolved);
            const block = type && (info.current = type)(child_ctx);
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            on_outro(() => {
                                block.d(1);
                                info.blocks[i] = null;
                            });
                            block.o(1);
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                if (block.i)
                    block.i(1);
                block.m(info.mount(), info.anchor);
                flush();
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
        }
        if (is_promise(promise)) {
            promise.then(value => {
                update(info.then, 1, info.value, value);
            }, error => {
                update(info.catch, 2, info.error, error);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = { [info.value]: promise };
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                $$.fragment.l(children(options.target));
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/PostBody.svelte generated by Svelte v3.4.3 */

    const file = "src/PostBody.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	return child_ctx;
    }

    // (12:0) {#each post.object.tag as tag}
    function create_each_block(ctx) {
    	var a, t_value = ctx.tag.name, t, a_href_value;

    	return {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			a.className = "tag";
    			a.href = a_href_value = ctx.tag.href;
    			add_location(a, file, 12, 4, 351);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.post) && t_value !== (t_value = ctx.tag.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.post) && a_href_value !== (a_href_value = ctx.tag.href)) {
    				a.href = a_href_value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div0, a0, t0, a0_href_value, t1, a1, t2_value = ctx.post.actor.split('/').slice(-1)[0], t2, a1_href_value, t3, span0, t5, span1, t6_value = ctx.post.published.replace("T", " ").replace("Z", " "), t6, t7, div1, t8, p, raw_value = ctx.post.object.content;

    	var each_value = ctx.post.object.tag;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text("Create");
    			t1 = text(" by user ");
    			a1 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			span0 = element("span");
    			span0.textContent = "·";
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			div1 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			p = element("p");
    			a0.href = a0_href_value = ctx.post.id;
    			add_location(a0, file, 6, 4, 66);
    			a1.href = a1_href_value = ctx.post.actor;
    			add_location(a1, file, 6, 43, 105);
    			span0.className = "metadata-seperator";
    			add_location(span0, file, 7, 4, 177);
    			add_location(span1, file, 8, 4, 223);
    			div0.className = "metadata";
    			add_location(div0, file, 5, 0, 39);
    			div1.className = "tags";
    			add_location(div1, file, 10, 0, 297);
    			add_location(p, file, 15, 0, 418);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, a0);
    			append(a0, t0);
    			append(div0, t1);
    			append(div0, a1);
    			append(a1, t2);
    			append(div0, t3);
    			append(div0, span0);
    			append(div0, t5);
    			append(div0, span1);
    			append(span1, t6);
    			insert(target, t7, anchor);
    			insert(target, div1, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert(target, t8, anchor);
    			insert(target, p, anchor);
    			p.innerHTML = raw_value;
    		},

    		p: function update(changed, ctx) {
    			if ((changed.post) && a0_href_value !== (a0_href_value = ctx.post.id)) {
    				a0.href = a0_href_value;
    			}

    			if ((changed.post) && t2_value !== (t2_value = ctx.post.actor.split('/').slice(-1)[0])) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.post) && a1_href_value !== (a1_href_value = ctx.post.actor)) {
    				a1.href = a1_href_value;
    			}

    			if ((changed.post) && t6_value !== (t6_value = ctx.post.published.replace("T", " ").replace("Z", " "))) {
    				set_data(t6, t6_value);
    			}

    			if (changed.post) {
    				each_value = ctx.post.object.tag;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if ((changed.post) && raw_value !== (raw_value = ctx.post.object.content)) {
    				p.innerHTML = raw_value;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t7);
    				detach(div1);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t8);
    				detach(p);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { post } = $$props;

    	const writable_props = ['post'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<PostBody> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('post' in $$props) $$invalidate('post', post = $$props.post);
    	};

    	return { post };
    }

    class PostBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["post"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.post === undefined && !('post' in props)) {
    			console.warn("<PostBody> was created without expected prop 'post'");
    		}
    	}

    	get post() {
    		throw new Error("<PostBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Post.svelte generated by Svelte v3.4.3 */

    const file$1 = "src/Post.svelte";

    // (27:0) {:else}
    function create_else_block(ctx) {
    	var await_block_anchor, promise, current;

    	let info = {
    		ctx,
    		current: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 'fpost',
    		error: 'null',
    		blocks: Array(3)
    	};

    	handle_promise(promise = ctx.fpost, info);

    	return {
    		c: function create() {
    			await_block_anchor = empty();

    			info.block.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, await_block_anchor, anchor);

    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;

    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (('fpost' in changed) && promise !== (promise = ctx.fpost) && handle_promise(promise, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			info.block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				if (block) block.o();
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(await_block_anchor);
    			}

    			info.block.d(detaching);
    			info = null;
    		}
    	};
    }

    // (22:0) {#if fetched_post == false}
    function create_if_block(ctx) {
    	var li, h2, t_1, current;

    	var postbody = new PostBody({
    		props: { post: ctx.post },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			li = element("li");
    			h2 = element("h2");
    			h2.textContent = ".";
    			t_1 = space();
    			postbody.$$.fragment.c();
    			h2.id = "";
    			add_location(h2, file$1, 23, 4, 440);
    			li.className = "post";
    			add_location(li, file$1, 22, 0, 418);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, h2);
    			append(li, t_1);
    			mount_component(postbody, li, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var postbody_changes = {};
    			if (changed.post) postbody_changes.post = ctx.post;
    			postbody.$set(postbody_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			postbody.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			postbody.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			postbody.$destroy();
    		}
    	};
    }

    // (1:0)  <script>  export let post;  import PostBody from "./PostBody.svelte"  let fpost;  let fetched_post = false;  if (["Announce", "Like"].includes(post.type)) {      fpost = fetch(post.object, { headers: {          "Accept": "application/activity+json"      }}
    function create_catch_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (28:25)  <li class="post">     <div class="metadata">         <h2 id=""> . </h2>         <a href="{post.id}
    function create_then_block(ctx) {
    	var li, div0, h2, t1, a0, t2_value = ctx.post.type, t2, a0_href_value, t3, a1, t4_value = ctx.post.actor.split('/').slice(-1)[0], t4, a1_href_value, t5, span0, t7, span1, t8_value = ctx.post.published.replace("T", " ").replace("Z", " "), t8, t9, div1, current;

    	var postbody = new PostBody({
    		props: { post: ctx.fpost },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = ".";
    			t1 = space();
    			a0 = element("a");
    			t2 = text(t2_value);
    			t3 = text(" by user ");
    			a1 = element("a");
    			t4 = text(t4_value);
    			t5 = space();
    			span0 = element("span");
    			span0.textContent = "·";
    			t7 = space();
    			span1 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			div1 = element("div");
    			postbody.$$.fragment.c();
    			h2.id = "";
    			add_location(h2, file$1, 30, 8, 581);
    			a0.href = a0_href_value = ctx.post.id;
    			add_location(a0, file$1, 31, 8, 608);
    			a1.href = a1_href_value = ctx.post.actor;
    			add_location(a1, file$1, 31, 52, 652);
    			span0.className = "metadata-seperator";
    			add_location(span0, file$1, 32, 8, 728);
    			add_location(span1, file$1, 33, 8, 778);
    			div0.className = "metadata";
    			add_location(div0, file$1, 29, 4, 550);
    			div1.className = "reaction svelte-1gf6p2q";
    			add_location(div1, file$1, 35, 4, 860);
    			li.className = "post";
    			add_location(li, file$1, 28, 0, 528);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, div0);
    			append(div0, h2);
    			append(div0, t1);
    			append(div0, a0);
    			append(a0, t2);
    			append(div0, t3);
    			append(div0, a1);
    			append(a1, t4);
    			append(div0, t5);
    			append(div0, span0);
    			append(div0, t7);
    			append(div0, span1);
    			append(span1, t8);
    			append(li, t9);
    			append(li, div1);
    			mount_component(postbody, div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.post) && t2_value !== (t2_value = ctx.post.type)) {
    				set_data(t2, t2_value);
    			}

    			if ((!current || changed.post) && a0_href_value !== (a0_href_value = ctx.post.id)) {
    				a0.href = a0_href_value;
    			}

    			if ((!current || changed.post) && t4_value !== (t4_value = ctx.post.actor.split('/').slice(-1)[0])) {
    				set_data(t4, t4_value);
    			}

    			if ((!current || changed.post) && a1_href_value !== (a1_href_value = ctx.post.actor)) {
    				a1.href = a1_href_value;
    			}

    			if ((!current || changed.post) && t8_value !== (t8_value = ctx.post.published.replace("T", " ").replace("Z", " "))) {
    				set_data(t8, t8_value);
    			}

    			var postbody_changes = {};
    			if (changed.fpost) postbody_changes.post = ctx.fpost;
    			postbody.$set(postbody_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			postbody.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			postbody.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			postbody.$destroy();
    		}
    	};
    }

    // (1:0)  <script>  export let post;  import PostBody from "./PostBody.svelte"  let fpost;  let fetched_post = false;  if (["Announce", "Like"].includes(post.type)) {      fpost = fetch(post.object, { headers: {          "Accept": "application/activity+json"      }}
    function create_pending_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function create_fragment$1(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.fetched_post == false) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				on_outro(() => {
    					if_blocks[previous_block_index].d(1);
    					if_blocks[previous_block_index] = null;
    				});
    				if_block.o(1);
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				if_block.i(1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block) if_block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block) if_block.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { post } = $$props;
    	let fpost;
    	let fetched_post = false;
    	if (["Announce", "Like"].includes(post.type)) {
    	    $$invalidate('fpost', fpost = fetch(post.object, { headers: {
    	        "Accept": "application/activity+json"
    	    }}).then(d => d.json()));
    	    $$invalidate('fetched_post', fetched_post = true);
        }

    	const writable_props = ['post'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('post' in $$props) $$invalidate('post', post = $$props.post);
    	};

    	return { post, fpost, fetched_post };
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["post"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.post === undefined && !('post' in props)) {
    			console.warn("<Post> was created without expected prop 'post'");
    		}
    	}

    	get post() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TimeLine.svelte generated by Svelte v3.4.3 */

    const file$2 = "src/TimeLine.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.post = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     export let posts;  import Post from "./Post.svelte" </script>  {#await posts then value}
    function create_catch_block$1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (6:25)  <ul class="post-list">     {#each value as post}
    function create_then_block$1(ctx) {
    	var ul, current;

    	var each_value = ctx.value;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			ul.className = "post-list";
    			add_location(ul, file$2, 6, 0, 102);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.posts) {
    				each_value = ctx.value;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						each_blocks[i].i(1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].i(1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();
    				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (8:4) {#each value as post}
    function create_each_block$1(ctx) {
    	var current;

    	var post = new Post({
    		props: { post: ctx.post },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			post.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(post, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var post_changes = {};
    			if (changed.posts) post_changes.post = ctx.post;
    			post.$set(post_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			post.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			post.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			post.$destroy(detaching);
    		}
    	};
    }

    // (1:0) <script>     export let posts;  import Post from "./Post.svelte" </script>  {#await posts then value}
    function create_pending_block$1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function create_fragment$2(ctx) {
    	var await_block_anchor, promise, current;

    	let info = {
    		ctx,
    		current: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 'value',
    		error: 'null',
    		blocks: Array(3)
    	};

    	handle_promise(promise = ctx.posts, info);

    	return {
    		c: function create() {
    			await_block_anchor = empty();

    			info.block.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, await_block_anchor, anchor);

    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;

    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (('posts' in changed) && promise !== (promise = ctx.posts) && handle_promise(promise, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			info.block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				if (block) block.o();
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(await_block_anchor);
    			}

    			info.block.d(detaching);
    			info = null;
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { posts } = $$props;

    	const writable_props = ['posts'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<TimeLine> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('posts' in $$props) $$invalidate('posts', posts = $$props.posts);
    	};

    	return { posts };
    }

    class TimeLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["posts"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.posts === undefined && !('posts' in props)) {
    			console.warn("<TimeLine> was created without expected prop 'posts'");
    		}
    	}

    	get posts() {
    		throw new Error("<TimeLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set posts(value) {
    		throw new Error("<TimeLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.4.3 */

    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	var svg, symbol, path, t0, header, ul, li0, a0, t2, li1, a1, t4, li2, a2, t6, li3, a3, t8, li4, a4, t10, div0, t11, div1, t12, div2, t13, div3, span, t15, p0, t17, div4, t18, hr, t19, footer, div5, h20, t21, p1, t22, br0, t23, br1, t24, t25, div6, h21, t27, p2, current;

    	var timeline0 = new TimeLine({
    		props: { posts: ctx.local_timeline },
    		$$inline: true
    	});

    	var timeline1 = new TimeLine({
    		props: { posts: ctx.federated_timeline },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			symbol = svg_element("symbol");
    			path = svg_element("path");
    			t0 = space();
    			header = element("header");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Local Timeline";
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Federated Timeline";
    			t4 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Home";
    			t6 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "About";
    			t8 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "...";
    			t10 = space();
    			div0 = element("div");
    			timeline0.$$.fragment.c();
    			t11 = space();
    			div1 = element("div");
    			timeline1.$$.fragment.c();
    			t12 = space();
    			div2 = element("div");
    			t13 = space();
    			div3 = element("div");
    			span = element("span");
    			span.textContent = "Hi!";
    			t15 = space();
    			p0 = element("p");
    			p0.textContent = "DESCRIPTION";
    			t17 = space();
    			div4 = element("div");
    			t18 = space();
    			hr = element("hr");
    			t19 = space();
    			footer = element("footer");
    			div5 = element("div");
    			h20 = element("h2");
    			h20.textContent = "PubGate-Philip";
    			t21 = space();
    			p1 = element("p");
    			t22 = text("Gotta");
    			br0 = element("br");
    			t23 = text("go");
    			br1 = element("br");
    			t24 = text("Fast");
    			t25 = space();
    			div6 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Contact";
    			t27 = space();
    			p2 = element("p");
    			attr(path, "fill-rule", "evenodd");
    			attr(path, "d", "M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z");
    			add_location(path, file$3, 11, 8, 412);
    			attr(symbol, "id", "warning");
    			add_location(symbol, file$3, 10, 4, 382);
    			attr(svg, "class", "hidden");
    			add_location(svg, file$3, 9, 0, 357);
    			a0.href = "/local";
    			add_location(a0, file$3, 16, 6, 738);
    			add_location(li0, file$3, 16, 2, 734);
    			a1.href = "/fed";
    			add_location(a1, file$3, 17, 6, 785);
    			add_location(li1, file$3, 17, 2, 781);
    			a2.href = "/home";
    			add_location(a2, file$3, 18, 6, 834);
    			add_location(li2, file$3, 18, 2, 830);
    			a3.href = "/about";
    			add_location(a3, file$3, 19, 6, 870);
    			add_location(li3, file$3, 19, 2, 866);
    			a4.href = "/dot-dot-dot";
    			add_location(a4, file$3, 20, 6, 908);
    			add_location(li4, file$3, 20, 2, 904);
    			add_location(ul, file$3, 15, 1, 727);
    			add_location(header, file$3, 14, 0, 717);
    			div0.id = "local";
    			div0.className = "hidden content";
    			add_location(div0, file$3, 24, 0, 962);
    			div1.id = "fed";
    			div1.className = "hidden content";
    			add_location(div1, file$3, 28, 0, 1050);
    			div2.id = "home";
    			div2.className = "hidden content";
    			add_location(div2, file$3, 32, 0, 1140);
    			span.className = "about-greeting";
    			add_location(span, file$3, 36, 1, 1228);
    			add_location(p0, file$3, 37, 1, 1269);
    			div3.id = "about";
    			div3.className = "hidden content";
    			add_location(div3, file$3, 35, 0, 1187);
    			div4.id = "dot-dot-dot";
    			div4.className = "hidden content";
    			add_location(div4, file$3, 40, 0, 1296);
    			hr.className = "separator";
    			add_location(hr, file$3, 43, 0, 1350);
    			add_location(h20, file$3, 46, 8, 1438);
    			add_location(br0, file$3, 47, 16, 1478);
    			add_location(br1, file$3, 47, 22, 1484);
    			add_location(p1, file$3, 47, 8, 1470);
    			div5.className = "left-column";
    			add_location(div5, file$3, 45, 4, 1404);
    			add_location(h21, file$3, 50, 8, 1547);
    			add_location(p2, file$3, 51, 8, 1572);
    			div6.className = "right-column";
    			add_location(div6, file$3, 49, 4, 1512);
    			footer.className = "content";
    			add_location(footer, file$3, 44, 0, 1375);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, symbol);
    			append(symbol, path);
    			insert(target, t0, anchor);
    			insert(target, header, anchor);
    			append(header, ul);
    			append(ul, li0);
    			append(li0, a0);
    			append(ul, t2);
    			append(ul, li1);
    			append(li1, a1);
    			append(ul, t4);
    			append(ul, li2);
    			append(li2, a2);
    			append(ul, t6);
    			append(ul, li3);
    			append(li3, a3);
    			append(ul, t8);
    			append(ul, li4);
    			append(li4, a4);
    			insert(target, t10, anchor);
    			insert(target, div0, anchor);
    			mount_component(timeline0, div0, null);
    			insert(target, t11, anchor);
    			insert(target, div1, anchor);
    			mount_component(timeline1, div1, null);
    			insert(target, t12, anchor);
    			insert(target, div2, anchor);
    			insert(target, t13, anchor);
    			insert(target, div3, anchor);
    			append(div3, span);
    			append(div3, t15);
    			append(div3, p0);
    			insert(target, t17, anchor);
    			insert(target, div4, anchor);
    			insert(target, t18, anchor);
    			insert(target, hr, anchor);
    			insert(target, t19, anchor);
    			insert(target, footer, anchor);
    			append(footer, div5);
    			append(div5, h20);
    			append(div5, t21);
    			append(div5, p1);
    			append(p1, t22);
    			append(p1, br0);
    			append(p1, t23);
    			append(p1, br1);
    			append(p1, t24);
    			append(footer, t25);
    			append(footer, div6);
    			append(div6, h21);
    			append(div6, t27);
    			append(div6, p2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var timeline0_changes = {};
    			if (changed.local_timeline) timeline0_changes.posts = ctx.local_timeline;
    			timeline0.$set(timeline0_changes);

    			var timeline1_changes = {};
    			if (changed.federated_timeline) timeline1_changes.posts = ctx.federated_timeline;
    			timeline1.$set(timeline1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			timeline0.$$.fragment.i(local);

    			timeline1.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			timeline0.$$.fragment.o(local);
    			timeline1.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    				detach(t0);
    				detach(header);
    				detach(t10);
    				detach(div0);
    			}

    			timeline0.$destroy();

    			if (detaching) {
    				detach(t11);
    				detach(div1);
    			}

    			timeline1.$destroy();

    			if (detaching) {
    				detach(t12);
    				detach(div2);
    				detach(t13);
    				detach(div3);
    				detach(t17);
    				detach(div4);
    				detach(t18);
    				detach(hr);
    				detach(t19);
    				detach(footer);
    			}
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { local_timeline = fetch(base_url + "/timeline/local").then(d => d.json()).then(d => d.first).then(d => d.orderedItems) } = $$props;
        let { federated_timeline = fetch(base_url + "/timeline/federated").then(d => d.json()).then(d => d.first).then(d => d.orderedItems) } = $$props;

    	const writable_props = ['local_timeline', 'federated_timeline'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('local_timeline' in $$props) $$invalidate('local_timeline', local_timeline = $$props.local_timeline);
    		if ('federated_timeline' in $$props) $$invalidate('federated_timeline', federated_timeline = $$props.federated_timeline);
    	};

    	return { local_timeline, federated_timeline };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["local_timeline", "federated_timeline"]);
    	}

    	get local_timeline() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set local_timeline(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get federated_timeline() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set federated_timeline(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
