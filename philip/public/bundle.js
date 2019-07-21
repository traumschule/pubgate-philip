
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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

    /* src/Publish.svelte generated by Svelte v3.4.3 */

    const file = "src/Publish.svelte";

    function create_fragment(ctx) {
    	var form, fieldset1, fieldset0, textarea, t0, button, t1, button_disabled_value, dispose;

    	return {
    		c: function create() {
    			form = element("form");
    			fieldset1 = element("fieldset");
    			fieldset0 = element("fieldset");
    			textarea = element("textarea");
    			t0 = space();
    			button = element("button");
    			t1 = text("Publish");
    			textarea.className = "form-control";
    			textarea.rows = "8";
    			textarea.placeholder = "Write your text here";
    			add_location(textarea, file, 44, 12, 1162);
    			fieldset0.className = "form-group";
    			add_location(fieldset0, file, 43, 8, 1120);
    			button.className = "btn btn-lg pull-xs-right btn-primary";
    			button.type = "button";
    			button.disabled = button_disabled_value = !ctx.content||ctx.inProgress;
    			add_location(button, file, 47, 8, 1289);
    			add_location(fieldset1, file, 41, 4, 1100);
    			add_location(form, file, 40, 0, 1089);

    			dispose = [
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(button, "click", ctx.publish)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, fieldset1);
    			append(fieldset1, fieldset0);
    			append(fieldset0, textarea);

    			textarea.value = ctx.content;

    			append(fieldset1, t0);
    			append(fieldset1, button);
    			append(button, t1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.content) textarea.value = ctx.content;

    			if ((changed.content || changed.inProgress) && button_disabled_value !== (button_disabled_value = !ctx.content||ctx.inProgress)) {
    				button.disabled = button_disabled_value;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { reply = '', session } = $$props;

        let inProgress = false;
        let content = '';
        async function publish(event) {
    		$$invalidate('inProgress', inProgress = true);
            let tags = [];
    		let matches = content.match(/(^|\W)(#[a-z\d][\w-]*)/ig);
    		if (matches) {
    		    $$invalidate('content', content = content.replace(/(^|\W)(#[a-z\d][\w-]*)/ig, '$1<a href="" rel="tag">$2</a>'));
    		    tags = matches.map(v => ({
                           "href": "",
                           "name": v.trim(),
                           "type": "Hashtag"
                       } ));
    		}
    		let ap_object = {
                "type": "Create",
                "object": {
                    "type": "Note",
                    "content": content,
                    "attachment": [],
                    "tag": tags,
                    "inReplyTo": reply
                }
            };
            const response = await fetch(session.user.outbox, {
                method: 'POST',
                body: JSON.stringify(ap_object),
                headers : {'Authorization': "Bearer " + session.token}
            }).then(d => d.json());
    		$$invalidate('inProgress', inProgress = false);
    		$$invalidate('content', content = '');
    	}

    	const writable_props = ['reply', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<Publish> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		content = this.value;
    		$$invalidate('content', content);
    	}

    	$$self.$set = $$props => {
    		if ('reply' in $$props) $$invalidate('reply', reply = $$props.reply);
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    	};

    	return {
    		reply,
    		session,
    		inProgress,
    		content,
    		publish,
    		textarea_input_handler
    	};
    }

    class Publish extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["reply", "session"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.session === undefined && !('session' in props)) {
    			console.warn("<Publish> was created without expected prop 'session'");
    		}
    	}

    	get reply() {
    		throw new Error("<Publish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reply(value) {
    		throw new Error("<Publish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get session() {
    		throw new Error("<Publish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set session(value) {
    		throw new Error("<Publish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/PostBody.svelte generated by Svelte v3.4.3 */

    const file$1 = "src/PostBody.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	return child_ctx;
    }

    // (125:0) {:else}
    function create_else_block(ctx) {
    	var div0, a0, t0_value = ctx.post.type, t0, a0_href_value, t1, a1, t2_value = ctx.post.attributedTo.split('/').pop(), t2, a1_href_value, t3, span0, t5, span1, t6_value = ctx.post.published.replace("T", " ").replace("Z", " "), t6, t7, t8, p, raw_value = ctx.post.content, t9, div6, div5, div4, div1, a2, span2, t11, div2, t12, div3, span3, a3, t14, span4, a4, t16, current;

    	var if_block0 = (ctx.post.tag) && create_if_block_2(ctx);

    	var if_block1 = (ctx.session.user) && create_if_block_1(ctx);

    	return {
    		c: function create() {
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text(t0_value);
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
    			if (if_block0) if_block0.c();
    			t8 = space();
    			p = element("p");
    			t9 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			a2 = element("a");
    			span2 = element("span");
    			span2.textContent = "N likes";
    			t11 = space();
    			div2 = element("div");
    			t12 = space();
    			div3 = element("div");
    			span3 = element("span");
    			a3 = element("a");
    			a3.textContent = "N comments";
    			t14 = space();
    			span4 = element("span");
    			a4 = element("a");
    			a4.textContent = "N announces";
    			t16 = space();
    			if (if_block1) if_block1.c();
    			a0.href = a0_href_value = ctx.post.id;
    			add_location(a0, file$1, 126, 4, 2016);
    			a1.href = a1_href_value = ctx.post.attributedTo;
    			add_location(a1, file$1, 126, 48, 2060);
    			span0.className = "metadata-seperator";
    			add_location(span0, file$1, 127, 4, 2139);
    			add_location(span1, file$1, 128, 4, 2185);
    			div0.className = "metadata";
    			add_location(div0, file$1, 125, 0, 1989);
    			add_location(p, file$1, 140, 0, 2469);
    			attr(span2, "aria-hidden", "true");
    			span2.className = "rs_like2 svelte-a0mw2f";
    			add_location(span2, file$1, 146, 20, 2719);
    			a2.href = "";
    			a2.rel = "dialog";
    			a2.className = "rs_like svelte-a0mw2f";
    			a2.tabIndex = "0";
    			attr(a2, "role", "button");
    			add_location(a2, file$1, 145, 16, 2631);
    			div1.className = "rs_left svelte-a0mw2f";
    			add_location(div1, file$1, 144, 12, 2593);
    			div2.className = "rs_center svelte-a0mw2f";
    			add_location(div2, file$1, 149, 12, 2829);
    			a3.className = "_42ft svelte-a0mw2f";
    			a3.dataset.ft = "";
    			attr(a3, "role", "button");
    			a3.href = "";
    			add_location(a3, file$1, 152, 20, 2955);
    			span3.className = "rs_right svelte-a0mw2f";
    			add_location(span3, file$1, 151, 16, 2910);
    			a4.className = "_42ft svelte-a0mw2f";
    			a4.href = "";
    			a4.rel = "dialog";
    			add_location(a4, file$1, 155, 20, 3104);
    			span4.className = "rs_right svelte-a0mw2f";
    			add_location(span4, file$1, 154, 16, 3060);
    			div3.className = "rs_right svelte-a0mw2f";
    			add_location(div3, file$1, 150, 12, 2871);
    			div4.className = "rs1 svelte-a0mw2f";
    			add_location(div4, file$1, 143, 8, 2563);
    			div5.className = "reaction_stats svelte-a0mw2f";
    			add_location(div5, file$1, 142, 4, 2526);
    			div6.className = "reactionz svelte-a0mw2f";
    			add_location(div6, file$1, 141, 0, 2498);
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
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t8, anchor);
    			insert(target, p, anchor);
    			p.innerHTML = raw_value;
    			insert(target, t9, anchor);
    			insert(target, div6, anchor);
    			append(div6, div5);
    			append(div5, div4);
    			append(div4, div1);
    			append(div1, a2);
    			append(a2, span2);
    			append(div4, t11);
    			append(div4, div2);
    			append(div4, t12);
    			append(div4, div3);
    			append(div3, span3);
    			append(span3, a3);
    			append(div3, t14);
    			append(div3, span4);
    			append(span4, a4);
    			append(div6, t16);
    			if (if_block1) if_block1.m(div6, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.post) && t0_value !== (t0_value = ctx.post.type)) {
    				set_data(t0, t0_value);
    			}

    			if ((!current || changed.post) && a0_href_value !== (a0_href_value = ctx.post.id)) {
    				a0.href = a0_href_value;
    			}

    			if ((!current || changed.post) && t2_value !== (t2_value = ctx.post.attributedTo.split('/').pop())) {
    				set_data(t2, t2_value);
    			}

    			if ((!current || changed.post) && a1_href_value !== (a1_href_value = ctx.post.attributedTo)) {
    				a1.href = a1_href_value;
    			}

    			if ((!current || changed.post) && t6_value !== (t6_value = ctx.post.published.replace("T", " ").replace("Z", " "))) {
    				set_data(t6, t6_value);
    			}

    			if (ctx.post.tag) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t8.parentNode, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || changed.post) && raw_value !== (raw_value = ctx.post.content)) {
    				p.innerHTML = raw_value;
    			}

    			if (ctx.session.user) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					if_block1.i(1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.i(1);
    					if_block1.m(div6, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				on_outro(() => {
    					if_block1.d(1);
    					if_block1 = null;
    				});

    				if_block1.o(1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block1) if_block1.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block1) if_block1.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t7);
    			}

    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t8);
    				detach(p);
    				detach(t9);
    				detach(div6);
    			}

    			if (if_block1) if_block1.d();
    		}
    	};
    }

    // (122:0) {#if typeof post === 'string'}
    function create_if_block(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			add_location(p, file$1, 122, 0, 1959);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			p.innerHTML = ctx.post;
    		},

    		p: function update(changed, ctx) {
    			if (changed.post) {
    				p.innerHTML = ctx.post;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (131:0) {#if post.tag}
    function create_if_block_2(ctx) {
    	var div;

    	var each_value = ctx.post.tag;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			div.className = "tags";
    			add_location(div, file$1, 131, 4, 2278);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.post) {
    				each_value = ctx.post.tag;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (134:8) {#if tag.type == 'Hashtag'}
    function create_if_block_3(ctx) {
    	var a, t_value = ctx.tag.name, t, a_href_value;

    	return {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			a.className = "tag";
    			a.href = a_href_value = ctx.tag.href;
    			add_location(a, file$1, 134, 12, 2373);
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

    // (133:4) {#each post.tag as tag}
    function create_each_block(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.tag.type == 'Hashtag') && create_if_block_3(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.tag.type == 'Hashtag') {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (161:0) {#if session.user }
    function create_if_block_1(ctx) {
    	var div2, div1, span0, a0, t1, span1, a1, t3, span3, span2, div0, a2, t5, current;

    	var publish = new Publish({
    		props: {
    		reply: ctx.post.id,
    		session: ctx.session
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			a0 = element("a");
    			a0.textContent = "Like";
    			t1 = space();
    			span1 = element("span");
    			a1 = element("a");
    			a1.textContent = "Add comment";
    			t3 = space();
    			span3 = element("span");
    			span2 = element("span");
    			div0 = element("div");
    			a2 = element("a");
    			a2.textContent = "Announce";
    			t5 = space();
    			publish.$$.fragment.c();
    			attr(a0, "aria-pressed", "false");
    			a0.className = "ra_like  _18vj svelte-a0mw2f";
    			a0.href = "";
    			attr(a0, "role", "button");
    			a0.tabIndex = "-1";
    			add_location(a0, file$1, 164, 16, 3359);
    			span0.className = "ra_item svelte-a0mw2f";
    			add_location(span0, file$1, 163, 12, 3320);
    			a1.className = "_18vj _42ft svelte-a0mw2f";
    			attr(a1, "role", "button");
    			a1.tabIndex = "0";
    			a1.href = "";
    			add_location(a1, file$1, 168, 16, 3538);
    			span1.className = "ra_item svelte-a0mw2f";
    			add_location(span1, file$1, 167, 12, 3499);
    			a2.className = "_18vj svelte-a0mw2f";
    			a2.href = "";
    			attr(a2, "role", "button");
    			a2.tabIndex = "0";
    			add_location(a2, file$1, 174, 24, 3776);
    			add_location(div0, file$1, 173, 20, 3746);
    			span2.className = "ra_announce svelte-a0mw2f";
    			add_location(span2, file$1, 172, 16, 3699);
    			span3.className = "ra_item svelte-a0mw2f";
    			add_location(span3, file$1, 171, 12, 3660);
    			div1.className = "ra1 svelte-a0mw2f";
    			add_location(div1, file$1, 162, 8, 3290);
    			div2.className = "reaction_actions svelte-a0mw2f";
    			add_location(div2, file$1, 161, 4, 3251);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div1);
    			append(div1, span0);
    			append(span0, a0);
    			append(div1, t1);
    			append(div1, span1);
    			append(span1, a1);
    			append(div1, t3);
    			append(div1, span3);
    			append(span3, span2);
    			append(span2, div0);
    			append(div0, a2);
    			insert(target, t5, anchor);
    			mount_component(publish, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var publish_changes = {};
    			if (changed.post) publish_changes.reply = ctx.post.id;
    			if (changed.session) publish_changes.session = ctx.session;
    			publish.$set(publish_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			publish.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			publish.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    				detach(t5);
    			}

    			publish.$destroy(detaching);
    		}
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
    		if (typeof ctx.post === 'string') return 0;
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
    	let { post, session } = $$props;

    	const writable_props = ['post', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<PostBody> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('post' in $$props) $$invalidate('post', post = $$props.post);
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    	};

    	return { post, session };
    }

    class PostBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["post", "session"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.post === undefined && !('post' in props)) {
    			console.warn("<PostBody> was created without expected prop 'post'");
    		}
    		if (ctx.session === undefined && !('session' in props)) {
    			console.warn("<PostBody> was created without expected prop 'session'");
    		}
    	}

    	get post() {
    		throw new Error("<PostBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<PostBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get session() {
    		throw new Error("<PostBody>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set session(value) {
    		throw new Error("<PostBody>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Post.svelte generated by Svelte v3.4.3 */

    const file$2 = "src/Post.svelte";

    // (37:0) {:else}
    function create_else_block$1(ctx) {
    	var li, div0, h2, t1, a0, t2_value = ctx.post.type, t2, a0_href_value, t3, a1, t4_value = ctx.post.actor.split('/').slice(-1)[0], t4, a1_href_value, t5, span, t7, t8, div1, current;

    	var if_block = (ctx.post.published) && create_if_block_1$1(ctx);

    	var postbody = new PostBody({
    		props: {
    		post: ctx.post_object,
    		session: ctx.session
    	},
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
    			span = element("span");
    			span.textContent = "·";
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			div1 = element("div");
    			postbody.$$.fragment.c();
    			h2.id = "";
    			add_location(h2, file$2, 39, 8, 785);
    			a0.href = a0_href_value = ctx.post.id;
    			add_location(a0, file$2, 40, 8, 812);
    			a1.href = a1_href_value = ctx.post.actor;
    			add_location(a1, file$2, 40, 52, 856);
    			span.className = "metadata-seperator";
    			add_location(span, file$2, 41, 8, 932);
    			div0.className = "metadata";
    			add_location(div0, file$2, 38, 4, 754);
    			div1.className = "reaction svelte-1gf6p2q";
    			add_location(div1, file$2, 47, 4, 1110);
    			li.className = "post";
    			add_location(li, file$2, 37, 0, 732);
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
    			append(div0, span);
    			append(div0, t7);
    			if (if_block) if_block.m(div0, null);
    			append(li, t8);
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

    			if (ctx.post.published) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			var postbody_changes = {};
    			if (changed.post_object) postbody_changes.post = ctx.post_object;
    			if (changed.session) postbody_changes.session = ctx.session;
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

    			if (if_block) if_block.d();

    			postbody.$destroy();
    		}
    	};
    }

    // (31:0) {#if fetched_post == false}
    function create_if_block$1(ctx) {
    	var li, h2, t_1, current;

    	var postbody = new PostBody({
    		props: { post: ctx.post.object, session: ctx.session },
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
    			add_location(h2, file$2, 32, 4, 645);
    			li.className = "post";
    			add_location(li, file$2, 31, 0, 623);
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
    			if (changed.post) postbody_changes.post = ctx.post.object;
    			if (changed.session) postbody_changes.session = ctx.session;
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

    // (44:8) {#if post.published }
    function create_if_block_1$1(ctx) {
    	var span, t_value = ctx.post.published.replace("T", " ").replace("Z", " "), t;

    	return {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$2, 44, 8, 1013);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.post) && t_value !== (t_value = ctx.post.published.replace("T", " ").replace("Z", " "))) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$1,
    		create_else_block$1
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { post, session } = $$props;

    	let fpost;
    	let post_object;
    	let fetched_post = false;
    	if (["Announce", "Like"].includes(post.type)) {
    	    if (pubgate_instance == false) {
                $$invalidate('fpost', fpost = fetch(post.object, { headers: {
                    "Accept": "application/activity+json"
                }}).then(d => d.json()));
                $$invalidate('post_object', post_object = fpost => fpost.object);
    	    } else {
    	        $$invalidate('post_object', post_object = post.object);
    	    }

    	    $$invalidate('fetched_post', fetched_post = true);
        }

    	const writable_props = ['post', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('post' in $$props) $$invalidate('post', post = $$props.post);
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    	};

    	return { post, session, post_object, fetched_post };
    }

    class Post extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["post", "session"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.post === undefined && !('post' in props)) {
    			console.warn("<Post> was created without expected prop 'post'");
    		}
    		if (ctx.session === undefined && !('session' in props)) {
    			console.warn("<Post> was created without expected prop 'session'");
    		}
    	}

    	get post() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set post(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get session() {
    		throw new Error("<Post>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set session(value) {
    		throw new Error("<Post>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TimeLine.svelte generated by Svelte v3.4.3 */

    const file$3 = "src/TimeLine.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.post = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     export let active_tab;     export let session;     export let outbox_collection = {}
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

    // (44:25)  <ul class="post-list">     {#each value as post}
    function create_then_block(ctx) {
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
    			add_location(ul, file$3, 44, 0, 1402);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.posts || changed.session) {
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

    // (46:4) {#each value as post}
    function create_each_block$1(ctx) {
    	var current;

    	var post = new Post({
    		props: {
    		post: ctx.post,
    		session: ctx.session
    	},
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
    			if (changed.session) post_changes.session = ctx.session;
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

    // (1:0) <script>     export let active_tab;     export let session;     export let outbox_collection = {}
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

    function create_fragment$3(ctx) {
    	var await_block_anchor, promise, current;

    	let info = {
    		ctx,
    		current: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { active_tab, session, outbox_collection = {} } = $$props;

    	let pgi = pubgate_instance;

    	const fetchCollection = function(path, session={}) {
    	    let headers_set = {
                "Accept": "application/activity+json",
            };
    	    if (session.user && active_tab === 'inbox') {
                headers_set['Authorization'] = "Bearer " + session.token;
    	    }
    	    return fetch(path, { headers: headers_set})
    	        .then(d => d.json())
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
              case 'search':
                  return outbox_collection.orderedItems;
              default:
                return []
            }
    	};

    	const writable_props = ['active_tab', 'session', 'outbox_collection'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<TimeLine> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('active_tab' in $$props) $$invalidate('active_tab', active_tab = $$props.active_tab);
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    		if ('outbox_collection' in $$props) $$invalidate('outbox_collection', outbox_collection = $$props.outbox_collection);
    	};

    	let posts;

    	$$self.$$.update = ($$dirty = { active_tab: 1, session: 1 }) => {
    		if ($$dirty.active_tab || $$dirty.session) { $$invalidate('posts', posts = getTimeline(active_tab, session)); }
    	};

    	return {
    		active_tab,
    		session,
    		outbox_collection,
    		posts
    	};
    }

    class TimeLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["active_tab", "session", "outbox_collection"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.active_tab === undefined && !('active_tab' in props)) {
    			console.warn("<TimeLine> was created without expected prop 'active_tab'");
    		}
    		if (ctx.session === undefined && !('session' in props)) {
    			console.warn("<TimeLine> was created without expected prop 'session'");
    		}
    	}

    	get active_tab() {
    		throw new Error("<TimeLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active_tab(value) {
    		throw new Error("<TimeLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get session() {
    		throw new Error("<TimeLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set session(value) {
    		throw new Error("<TimeLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outbox_collection() {
    		throw new Error("<TimeLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outbox_collection(value) {
    		throw new Error("<TimeLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/SearchFollow.svelte generated by Svelte v3.4.3 */

    const file$4 = "src/SearchFollow.svelte";

    // (74:0) {#if outbox_collection}
    function create_if_block$2(ctx) {
    	var button, t_1, current, dispose;

    	var timeline = new TimeLine({
    		props: {
    		active_tab: "search",
    		session: ctx.session,
    		outbox_collection: ctx.outbox_collection
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Follow";
    			t_1 = space();
    			timeline.$$.fragment.c();
    			button.className = "btn btn-sm";
    			add_location(button, file$4, 74, 4, 2357);
    			dispose = listen(button, "click", ctx.follow);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			insert(target, t_1, anchor);
    			mount_component(timeline, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var timeline_changes = {};
    			if (changed.session) timeline_changes.session = ctx.session;
    			if (changed.outbox_collection) timeline_changes.outbox_collection = ctx.outbox_collection;
    			timeline.$set(timeline_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			timeline.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			timeline.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    				detach(t_1);
    			}

    			timeline.$destroy(detaching);

    			dispose();
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var br0, t0, form, fieldset, input, t1, button, t2, button_disabled_value, t3, br1, br2, t4, if_block_anchor, current, dispose;

    	var if_block = (ctx.outbox_collection) && create_if_block$2(ctx);

    	return {
    		c: function create() {
    			br0 = element("br");
    			t0 = space();
    			form = element("form");
    			fieldset = element("fieldset");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			t2 = text("Search");
    			t3 = space();
    			br1 = element("br");
    			br2 = element("br");
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(br0, file$4, 62, 0, 1959);
    			input.className = "form-control form-control-lg";
    			attr(input, "type", "text");
    			input.placeholder = "Search format: username@domain";
    			add_location(input, file$4, 65, 8, 2047);
    			fieldset.className = "form-group";
    			add_location(fieldset, file$4, 64, 4, 2009);
    			button.className = "btn btn-lg btn-primary pull-xs-right";
    			button.type = "submit";
    			button.disabled = button_disabled_value = !ctx.username;
    			add_location(button, file$4, 67, 4, 2191);
    			add_location(form, file$4, 63, 0, 1964);
    			add_location(br1, file$4, 71, 0, 2319);
    			add_location(br2, file$4, 71, 4, 2323);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(form, "submit", prevent_default(ctx.search))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, br0, anchor);
    			insert(target, t0, anchor);
    			insert(target, form, anchor);
    			append(form, fieldset);
    			append(fieldset, input);

    			input.value = ctx.username;

    			append(form, t1);
    			append(form, button);
    			append(button, t2);
    			insert(target, t3, anchor);
    			insert(target, br1, anchor);
    			insert(target, br2, anchor);
    			insert(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.username && (input.value !== ctx.username)) input.value = ctx.username;

    			if ((!current || changed.username) && button_disabled_value !== (button_disabled_value = !ctx.username)) {
    				button.disabled = button_disabled_value;
    			}

    			if (ctx.outbox_collection) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					if_block.i(1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.i(1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				on_outro(() => {
    					if_block.d(1);
    					if_block = null;
    				});

    				if_block.o(1);
    				check_outros();
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
    			if (detaching) {
    				detach(br0);
    				detach(t0);
    				detach(form);
    				detach(t3);
    				detach(br1);
    				detach(br2);
    				detach(t4);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { session } = $$props;

    	let username = '';
    	let outbox_collection = null;
    	let searched_profile = null;
        async function search(event) {
            $: $$invalidate('outbox_collection', outbox_collection = null);
            let pair = username.split("@");
            let profile_url = "https://" + pair[1] + "/@" + pair[0];
            let collection;
            if (pubgate_instance) {
                const profile = await fetch(base_url + "/proxy", {
                    method: 'POST',
                    body: JSON.stringify({url: profile_url})
                }).then(d => d.json());

                $: $$invalidate('searched_profile', searched_profile = profile);
                const outbox = await fetch(base_url + "/proxy", {
                    method: 'POST',
                    body: JSON.stringify({url: profile.outbox})
                }).then(d => d.json());

                if (typeof outbox.first === "string") {
                    collection = await fetch(base_url + "/proxy", {
                        method: 'POST',
                        body: JSON.stringify({url: outbox.first})
                    }).then(d => d.json());
                } else {
                    collection = outbox.first;
                }
                $: $$invalidate('outbox_collection', outbox_collection = collection);


            } else {
                const profile = await fetch(profile_url, { headers: {
                    "Accept": "application/activity+json"
                }}).then(d => d.json());

                if (profile.outbox) {
                    $: $$invalidate('outbox_collection', outbox_collection = profile.outbox);
                }
            }
        }

        async function follow(event) {
            if (pubgate_instance) {
                let ap_object = {
                    "type": "Follow",
                    "object": searched_profile.id ,
                };
                const response = await fetch(session.user.outbox, {
                    method: 'POST',
                    body: JSON.stringify(ap_object),
                    headers : {'Authorization': "Bearer " + session.token}
                }).then(d => d.json());
            }
        }

    	const writable_props = ['session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<SearchFollow> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		username = this.value;
    		$$invalidate('username', username);
    	}

    	$$self.$set = $$props => {
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    	};

    	return {
    		session,
    		username,
    		outbox_collection,
    		search,
    		follow,
    		input_input_handler
    	};
    }

    class SearchFollow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["session"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.session === undefined && !('session' in props)) {
    			console.warn("<SearchFollow> was created without expected prop 'session'");
    		}
    	}

    	get session() {
    		throw new Error("<SearchFollow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set session(value) {
    		throw new Error("<SearchFollow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tab.svelte generated by Svelte v3.4.3 */

    const file$5 = "src/Tab.svelte";

    // (117:0) {:else}
    function create_else_block_1(ctx) {
    	var current;

    	var timeline = new TimeLine({
    		props: {
    		active_tab: ctx.active_tab,
    		session: ctx.session
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			timeline.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(timeline, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var timeline_changes = {};
    			if (changed.active_tab) timeline_changes.active_tab = ctx.active_tab;
    			if (changed.session) timeline_changes.session = ctx.session;
    			timeline.$set(timeline_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			timeline.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			timeline.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			timeline.$destroy(detaching);
    		}
    	};
    }

    // (115:33) 
    function create_if_block_3$1(ctx) {
    	var current;

    	var searchfollow = new SearchFollow({
    		props: { session: ctx.session },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			searchfollow.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(searchfollow, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var searchfollow_changes = {};
    			if (changed.session) searchfollow_changes.session = ctx.session;
    			searchfollow.$set(searchfollow_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			searchfollow.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			searchfollow.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			searchfollow.$destroy(detaching);
    		}
    	};
    }

    // (113:33) 
    function create_if_block_2$1(ctx) {
    	var current;

    	var publish = new Publish({
    		props: { session: ctx.session },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			publish.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(publish, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var publish_changes = {};
    			if (changed.session) publish_changes.session = ctx.session;
    			publish.$set(publish_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			publish.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			publish.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			publish.$destroy(detaching);
    		}
    	};
    }

    // (69:0) {#if active_tab == 'profile'}
    function create_if_block$3(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block_1$2,
    		create_else_block$2
    	];

    	var if_blocks = [];

    	function select_block_type_1(ctx) {
    		if (ctx.session.user) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);
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

    // (74:4) {:else}
    function create_else_block$2(ctx) {
    	var t0, br0, t1, form0, fieldset0, input0, t2, fieldset1, input1, t3, button0, t4, button0_disabled_value, t5, br1, br2, t6, br3, t7, form1, fieldset2, input2, t8, fieldset3, input3, t9, fieldset4, textarea, t10, fieldset5, input4, t11, fieldset6, input5, t12, button1, t13, button1_disabled_value, dispose;

    	return {
    		c: function create() {
    			t0 = text("Sign-in ( ActivityPub compatible, OAuth2 password grant )\n        ");
    			br0 = element("br");
    			t1 = space();
    			form0 = element("form");
    			fieldset0 = element("fieldset");
    			input0 = element("input");
    			t2 = space();
    			fieldset1 = element("fieldset");
    			input1 = element("input");
    			t3 = space();
    			button0 = element("button");
    			t4 = text("Sign in");
    			t5 = space();
    			br1 = element("br");
    			br2 = element("br");
    			t6 = text("\n        or register ( PubGate only )\n        ");
    			br3 = element("br");
    			t7 = space();
    			form1 = element("form");
    			fieldset2 = element("fieldset");
    			input2 = element("input");
    			t8 = space();
    			fieldset3 = element("fieldset");
    			input3 = element("input");
    			t9 = space();
    			fieldset4 = element("fieldset");
    			textarea = element("textarea");
    			t10 = space();
    			fieldset5 = element("fieldset");
    			input4 = element("input");
    			t11 = space();
    			fieldset6 = element("fieldset");
    			input5 = element("input");
    			t12 = space();
    			button1 = element("button");
    			t13 = text("Register");
    			add_location(br0, file$5, 75, 8, 2151);
    			input0.className = "form-control form-control-lg";
    			attr(input0, "type", "username");
    			input0.placeholder = "Username";
    			add_location(input0, file$5, 78, 16, 2262);
    			fieldset0.className = "form-group";
    			add_location(fieldset0, file$5, 77, 12, 2216);
    			input1.className = "form-control form-control-lg";
    			attr(input1, "type", "password");
    			input1.placeholder = "Password";
    			add_location(input1, file$5, 81, 16, 2450);
    			fieldset1.className = "form-group";
    			add_location(fieldset1, file$5, 80, 12, 2404);
    			button0.className = "btn btn-lg btn-primary pull-xs-right";
    			button0.type = "submit";
    			button0.disabled = button0_disabled_value = !ctx.username || !ctx.password;
    			add_location(button0, file$5, 83, 12, 2592);
    			add_location(form0, file$5, 76, 8, 2164);
    			add_location(br1, file$5, 87, 8, 2766);
    			add_location(br2, file$5, 87, 12, 2770);
    			add_location(br3, file$5, 89, 8, 2820);
    			input2.className = "form-control form-control-lg";
    			attr(input2, "type", "text");
    			input2.placeholder = "Username";
    			add_location(input2, file$5, 92, 16, 2934);
    			fieldset2.className = "form-group";
    			add_location(fieldset2, file$5, 91, 12, 2888);
    			input3.className = "form-control form-control-lg";
    			attr(input3, "type", "password");
    			input3.placeholder = "Password";
    			add_location(input3, file$5, 95, 16, 3118);
    			fieldset3.className = "form-group";
    			add_location(fieldset3, file$5, 94, 12, 3072);
    			textarea.className = "form-control";
    			textarea.rows = "8";
    			textarea.placeholder = "Profile Description";
    			add_location(textarea, file$5, 98, 16, 3306);
    			fieldset4.className = "form-group";
    			add_location(fieldset4, file$5, 97, 12, 3260);
    			input4.className = "form-control form-control-lg";
    			attr(input4, "type", "text");
    			input4.placeholder = "Avatar URL";
    			add_location(input4, file$5, 101, 16, 3489);
    			fieldset5.className = "form-group";
    			add_location(fieldset5, file$5, 100, 12, 3443);
    			input5.className = "form-control form-control-lg";
    			attr(input5, "type", "text");
    			input5.placeholder = "Invite code";
    			add_location(input5, file$5, 104, 16, 3673);
    			fieldset6.className = "form-group";
    			add_location(fieldset6, file$5, 103, 12, 3627);
    			button1.className = "btn btn-lg btn-primary pull-xs-right";
    			button1.type = "submit";
    			button1.disabled = button1_disabled_value = !ctx.username || !ctx.password;
    			add_location(button1, file$5, 107, 12, 3813);
    			add_location(form1, file$5, 90, 8, 2833);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(form0, "submit", prevent_default(ctx.login)),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(input3, "input", ctx.input3_input_handler),
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(input4, "input", ctx.input4_input_handler),
    				listen(input5, "input", ctx.input5_input_handler),
    				listen(form1, "submit", prevent_default(ctx.register))
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, br0, anchor);
    			insert(target, t1, anchor);
    			insert(target, form0, anchor);
    			append(form0, fieldset0);
    			append(fieldset0, input0);

    			input0.value = ctx.username;

    			append(form0, t2);
    			append(form0, fieldset1);
    			append(fieldset1, input1);

    			input1.value = ctx.password;

    			append(form0, t3);
    			append(form0, button0);
    			append(button0, t4);
    			insert(target, t5, anchor);
    			insert(target, br1, anchor);
    			insert(target, br2, anchor);
    			insert(target, t6, anchor);
    			insert(target, br3, anchor);
    			insert(target, t7, anchor);
    			insert(target, form1, anchor);
    			append(form1, fieldset2);
    			append(fieldset2, input2);

    			input2.value = ctx.username;

    			append(form1, t8);
    			append(form1, fieldset3);
    			append(fieldset3, input3);

    			input3.value = ctx.password;

    			append(form1, t9);
    			append(form1, fieldset4);
    			append(fieldset4, textarea);

    			textarea.value = ctx.description;

    			append(form1, t10);
    			append(form1, fieldset5);
    			append(fieldset5, input4);

    			input4.value = ctx.avatar;

    			append(form1, t11);
    			append(form1, fieldset6);
    			append(fieldset6, input5);

    			input5.value = ctx.invite;

    			append(form1, t12);
    			append(form1, button1);
    			append(button1, t13);
    		},

    		p: function update(changed, ctx) {
    			if (changed.username) input0.value = ctx.username;
    			if (changed.password) input1.value = ctx.password;

    			if ((changed.username || changed.password) && button0_disabled_value !== (button0_disabled_value = !ctx.username || !ctx.password)) {
    				button0.disabled = button0_disabled_value;
    			}

    			if (changed.username && (input2.value !== ctx.username)) input2.value = ctx.username;
    			if (changed.password) input3.value = ctx.password;
    			if (changed.description) textarea.value = ctx.description;
    			if (changed.avatar && (input4.value !== ctx.avatar)) input4.value = ctx.avatar;
    			if (changed.invite && (input5.value !== ctx.invite)) input5.value = ctx.invite;

    			if ((changed.username || changed.password) && button1_disabled_value !== (button1_disabled_value = !ctx.username || !ctx.password)) {
    				button1.disabled = button1_disabled_value;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(br0);
    				detach(t1);
    				detach(form0);
    				detach(t5);
    				detach(br1);
    				detach(br2);
    				detach(t6);
    				detach(br3);
    				detach(t7);
    				detach(form1);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (70:4) {#if session.user }
    function create_if_block_1$2(ctx) {
    	var button, t_1, current, dispose;

    	var timeline = new TimeLine({
    		props: {
    		active_tab: ctx.active_tab,
    		session: ctx.session
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Logout";
    			t_1 = space();
    			timeline.$$.fragment.c();
    			button.className = "btn btn-sm";
    			add_location(button, file$5, 70, 9, 1924);
    			dispose = listen(button, "click", ctx.logout);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			insert(target, t_1, anchor);
    			mount_component(timeline, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var timeline_changes = {};
    			if (changed.active_tab) timeline_changes.active_tab = ctx.active_tab;
    			if (changed.session) timeline_changes.session = ctx.session;
    			timeline.$set(timeline_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			timeline.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			timeline.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    				detach(t_1);
    			}

    			timeline.$destroy(detaching);

    			dispose();
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$3,
    		create_if_block_2$1,
    		create_if_block_3$1,
    		create_else_block_1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.active_tab == 'profile') return 0;
    		if (ctx.active_tab == 'create') return 1;
    		if (ctx.active_tab == 'search') return 2;
    		return 3;
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

    function instance$5($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

        let { active_tab, session } = $$props;

        let username = '';
        let password = '';

        async function login(event) {
            const profile = await fetch(base_url + "/@" + username, { headers: {
                "Accept": "application/activity+json"
            }}).then(d => d.json());

            const token = await fetch(profile.endpoints.oauthTokenEndpoint, {
                method: 'POST',
                body: JSON.stringify({username: username, password:password})
            }).then(d => d.json());

            if (token.access_token) {
                $: session.user = profile; $$invalidate('session', session);
                $: session.token = token.access_token; $$invalidate('session', session);
            }
            dispatch("updatesession", session);
        }

        async function logout(event) {
            $: $$invalidate('session', session = {});
            dispatch("updatesession", session);
        }

        let description = '';
        let avatar = '';
        let invite = '';

        async function register(event) {
            let user_data = {
                "username": username,
                "password": password,
                "invite": invite,
                "profile": {
                    "type": "Person",
                    "name": username,
                    "summary": description,
                    "icon": {
                        "type": "Image",
                        "mediaType": "image/jpeg",
                        "url": avatar
                    }
                }
            };

            const create_user = await fetch(base_url + "/user", {
                method: 'POST',
                body: JSON.stringify(user_data)
            }).then(d => d.json());

            if (create_user.profile) {
                await login({});
            }
        }

    	const writable_props = ['active_tab', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key)) console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate('username', username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function input2_input_handler() {
    		username = this.value;
    		$$invalidate('username', username);
    	}

    	function input3_input_handler() {
    		password = this.value;
    		$$invalidate('password', password);
    	}

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate('description', description);
    	}

    	function input4_input_handler() {
    		avatar = this.value;
    		$$invalidate('avatar', avatar);
    	}

    	function input5_input_handler() {
    		invite = this.value;
    		$$invalidate('invite', invite);
    	}

    	$$self.$set = $$props => {
    		if ('active_tab' in $$props) $$invalidate('active_tab', active_tab = $$props.active_tab);
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    	};

    	return {
    		active_tab,
    		session,
    		username,
    		password,
    		login,
    		logout,
    		description,
    		avatar,
    		invite,
    		register,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		textarea_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	};
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["active_tab", "session"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.active_tab === undefined && !('active_tab' in props)) {
    			console.warn("<Tab> was created without expected prop 'active_tab'");
    		}
    		if (ctx.session === undefined && !('session' in props)) {
    			console.warn("<Tab> was created without expected prop 'session'");
    		}
    	}

    	get active_tab() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active_tab(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get session() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set session(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.4.3 */

    const file$6 = "src/App.svelte";

    // (35:5) {#if pgi == true }
    function create_if_block_2$2(ctx) {
    	var li0, a0, t_1, li1, a1, dispose;

    	return {
    		c: function create() {
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Local Timeline";
    			t_1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Federated Timeline";
    			a0.href = "#local";
    			a0.className = "header-selected";
    			add_location(a0, file$6, 35, 6, 761);
    			add_location(li0, file$6, 35, 2, 757);
    			a1.href = "#federated";
    			add_location(a1, file$6, 36, 6, 855);
    			add_location(li1, file$6, 36, 2, 851);

    			dispose = [
    				listen(a0, "click", ctx.selectTab),
    				listen(a1, "click", ctx.selectTab)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, li0, anchor);
    			append(li0, a0);
    			insert(target, t_1, anchor);
    			insert(target, li1, anchor);
    			append(li1, a1);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li0);
    				detach(t_1);
    				detach(li1);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (39:2) {#if session.user }
    function create_if_block_1$3(ctx) {
    	var li0, a0, t1, li1, a1, t3, li2, a2, dispose;

    	return {
    		c: function create() {
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Inbox";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Create";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Search/Follow";
    			a0.href = "#inbox";
    			add_location(a0, file$6, 39, 6, 963);
    			add_location(li0, file$6, 39, 2, 959);
    			a1.href = "#create";
    			add_location(a1, file$6, 40, 6, 1024);
    			add_location(li1, file$6, 40, 2, 1020);
    			a2.href = "#search";
    			add_location(a2, file$6, 41, 6, 1087);
    			add_location(li2, file$6, 41, 2, 1083);

    			dispose = [
    				listen(a0, "click", ctx.selectTab),
    				listen(a1, "click", ctx.selectTab),
    				listen(a2, "click", ctx.selectTab)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, li0, anchor);
    			append(li0, a0);
    			insert(target, t1, anchor);
    			insert(target, li1, anchor);
    			append(li1, a1);
    			insert(target, t3, anchor);
    			insert(target, li2, anchor);
    			append(li2, a2);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li0);
    				detach(t1);
    				detach(li1);
    				detach(t3);
    				detach(li2);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (44:74) {:else}
    function create_else_block$3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Login");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (44:48) {#if session.user }
    function create_if_block$4(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Profile");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	var header, ul, t0, t1, li0, a0, t2, li1, a1, t4, div0, t5, hr, t6, footer, div1, h20, t8, p0, t9, br0, t10, br1, t11, t12, div2, h21, t14, p1, current, dispose;

    	var if_block0 = (ctx.pgi == true) && create_if_block_2$2(ctx);

    	var if_block1 = (ctx.session.user) && create_if_block_1$3(ctx);

    	function select_block_type(ctx) {
    		if (ctx.session.user) return create_if_block$4;
    		return create_else_block$3;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block2 = current_block_type(ctx);

    	var tab = new Tab({
    		props: {
    		active_tab: ctx.active_tab,
    		session: ctx.session
    	},
    		$$inline: true
    	});
    	tab.$on("updatesession", ctx.updateSession);

    	return {
    		c: function create() {
    			header = element("header");
    			ul = element("ul");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			li0 = element("li");
    			a0 = element("a");
    			if_block2.c();
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "About";
    			t4 = space();
    			div0 = element("div");
    			tab.$$.fragment.c();
    			t5 = space();
    			hr = element("hr");
    			t6 = space();
    			footer = element("footer");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "PubGate-Philip";
    			t8 = space();
    			p0 = element("p");
    			t9 = text("Gotta");
    			br0 = element("br");
    			t10 = text("go");
    			br1 = element("br");
    			t11 = text("Fast");
    			t12 = space();
    			div2 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Contact";
    			t14 = space();
    			p1 = element("p");
    			a0.href = "#profile";
    			add_location(a0, file$6, 43, 6, 1165);
    			add_location(li0, file$6, 43, 2, 1161);
    			a1.href = "#about";
    			add_location(a1, file$6, 44, 6, 1266);
    			add_location(li1, file$6, 44, 2, 1262);
    			add_location(ul, file$6, 33, 1, 726);
    			add_location(header, file$6, 32, 0, 716);
    			div0.className = "content";
    			add_location(div0, file$6, 48, 0, 1339);
    			hr.className = "separator";
    			add_location(hr, file$6, 54, 0, 1473);
    			add_location(h20, file$6, 57, 8, 1561);
    			add_location(br0, file$6, 58, 16, 1601);
    			add_location(br1, file$6, 58, 22, 1607);
    			add_location(p0, file$6, 58, 8, 1593);
    			div1.className = "left-column";
    			add_location(div1, file$6, 56, 4, 1527);
    			add_location(h21, file$6, 61, 8, 1670);
    			add_location(p1, file$6, 62, 8, 1695);
    			div2.className = "right-column";
    			add_location(div2, file$6, 60, 4, 1635);
    			footer.className = "content";
    			add_location(footer, file$6, 55, 0, 1498);

    			dispose = [
    				listen(a0, "click", ctx.selectTab),
    				listen(a1, "click", ctx.selectTab)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			append(header, ul);
    			if (if_block0) if_block0.m(ul, null);
    			append(ul, t0);
    			if (if_block1) if_block1.m(ul, null);
    			append(ul, t1);
    			append(ul, li0);
    			append(li0, a0);
    			if_block2.m(a0, null);
    			append(ul, t2);
    			append(ul, li1);
    			append(li1, a1);
    			insert(target, t4, anchor);
    			insert(target, div0, anchor);
    			mount_component(tab, div0, null);
    			insert(target, t5, anchor);
    			insert(target, hr, anchor);
    			insert(target, t6, anchor);
    			insert(target, footer, anchor);
    			append(footer, div1);
    			append(div1, h20);
    			append(div1, t8);
    			append(div1, p0);
    			append(p0, t9);
    			append(p0, br0);
    			append(p0, t10);
    			append(p0, br1);
    			append(p0, t11);
    			append(footer, t12);
    			append(footer, div2);
    			append(div2, h21);
    			append(div2, t14);
    			append(div2, p1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.pgi == true) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					if_block0.m(ul, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.session.user) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					if_block1.m(ul, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);
    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(a0, null);
    				}
    			}

    			var tab_changes = {};
    			if (changed.active_tab) tab_changes.active_tab = ctx.active_tab;
    			if (changed.session) tab_changes.session = ctx.session;
    			tab.$set(tab_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			tab.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			tab.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();

    			if (detaching) {
    				detach(t4);
    				detach(div0);
    			}

    			tab.$destroy();

    			if (detaching) {
    				detach(t5);
    				detach(hr);
    				detach(t6);
    				detach(footer);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let session = {};
    	let active_tab;
        let pgi = pubgate_instance;

        if (pgi) {
            $$invalidate('active_tab', active_tab = 'local');
        } else {
            $$invalidate('active_tab', active_tab = 'about');
        }

        function selectTab (event) {
            event.preventDefault();
            $$invalidate('active_tab', active_tab = this.href.split('#')[1]);
            Array.prototype.forEach.call(this.parentNode.parentNode.children, (el, i) => {
                if (el.firstChild.href.split('#')[1] !== active_tab) {
                    el.firstChild.classList.remove('header-selected');
                }
            });
            this.classList.add('header-selected');
        }

        const updateSession = e => {
            $: $$invalidate('session', session = e.detail);
        };

    	return {
    		session,
    		active_tab,
    		pgi,
    		selectTab,
    		updateSession
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
