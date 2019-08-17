
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
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
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
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
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
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
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
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

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
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
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
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
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
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

    function xhr(url, options = {}, accept = "application/activity+json") {
        let defaultOptions = {
            headers: {
                "Accept": accept
            }
        };

        return fetch(url, Object.assign(defaultOptions, options))
            // .then(handleErrors)
            .then(response => response.json())
            .catch((error) => {
              console.log(error);
            });
    }

    // function handleErrors(response) {
    //     console.log(response);
    //     if (!response.ok) {
    //         return response.json().then(error => {
    //             return Promise.reject(error);
    //         });
    //     }
    //
    //     return response;
    // }

    const getHashTag = name => ({
      name,
      href: "",
      type: "Hashtag",
    });

    const getCreateObject = (content, tag) => ({
      type: "Create",
      object: {
        type: "Note",
        attachment: [],
        tag,
        content,
      },
    });

    /* src/Publish.svelte generated by Svelte v3.7.1 */
    const { console: console_1 } = globals;

    const file = "src/Publish.svelte";

    function create_fragment(ctx) {
    	var form, fieldset, textarea, t0, button, t1, button_disabled_value, dispose;

    	return {
    		c: function create() {
    			form = element("form");
    			fieldset = element("fieldset");
    			textarea = element("textarea");
    			t0 = space();
    			button = element("button");
    			t1 = text("Publish");
    			attr(textarea, "class", "form-control svelte-1fvj4fs");
    			attr(textarea, "placeholder", "Write your text here");
    			add_location(textarea, file, 60, 4, 1300);
    			attr(fieldset, "class", "form-group");
    			add_location(fieldset, file, 59, 2, 1266);
    			attr(button, "class", "btn btn-sm pull-xs-right btn-info");
    			button.disabled = button_disabled_value = !ctx.content || ctx.inProgress;
    			add_location(button, file, 66, 2, 1425);
    			add_location(form, file, 57, 0, 1236);

    			dispose = [
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(form, "submit", ctx.publish)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, fieldset);
    			append(fieldset, textarea);

    			textarea.value = ctx.content;

    			append(form, t0);
    			append(form, button);
    			append(button, t1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.content) textarea.value = ctx.content;

    			if ((changed.content || changed.inProgress) && button_disabled_value !== (button_disabled_value = !ctx.content || ctx.inProgress)) {
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

    const hashTagMatcher = /(^|\W)(#[a-z\d][\w-]*)/gi;

    function instance($$self, $$props, $$invalidate) {
    	let { reply = null, session } = $$props;

      let inProgress = false;
      let content = "";

      const wrapHashTagsWithLink = text =>
        text.match(hashTagMatcher)
          ? text.replace(hashTagMatcher, '$1<a href="" rel="tag">$2</a>')
          : text;

      const getAllHashTags = text => text.match(hashTagMatcher) || [];

      const publish = async ev => {
        ev.preventDefault();

        $$invalidate('inProgress', inProgress = true);
        let tags = getAllHashTags(content)
          .map(v => v.trim())
          .map(getHashTag);

        const data = wrapHashTagsWithLink(content);

        let ap_object = getCreateObject(data, tags);

        if (reply) {
          ap_object.object.inReplyTo = reply.id;
          ap_object.cc = [reply.attributedTo];
        }

        try {
          const response = await fetch(session.user.outbox, {
            method: "POST",
            body: JSON.stringify(ap_object),
            headers: { Authorization: "Bearer " + session.token },
          });
          const data = await response.json();
        } catch (e) {
          console.log(e);
        }

        $$invalidate('inProgress', inProgress = false);
        $$invalidate('content', content = "");
      };

    	const writable_props = ['reply', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Publish> was created with unknown prop '${key}'`);
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
    			console_1.warn("<Publish> was created without expected prop 'session'");
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

    /* src/PostBody.svelte generated by Svelte v3.7.1 */

    const file$1 = "src/PostBody.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.attachment = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	return child_ctx;
    }

    // (49:0) {:else}
    function create_else_block(ctx) {
    	var div, a0, t0_value = ctx.post.type, t0, a0_href_value, t1, a1, t2_value = ctx.post.attributedTo.split('/').pop(), t2, a1_href_value, t3, span0, t5, span1, t6_value = ctx.post.published.replace("T", " ").replace("Z", " "), t6, t7, t8, p, raw_value = ctx.post.content, t9, if_block1_anchor;

    	var if_block0 = (ctx.post.tag) && create_if_block_5(ctx);

    	var if_block1 = (ctx.post.attachment) && create_if_block_3(ctx);

    	return {
    		c: function create() {
    			div = element("div");
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
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr(a0, "href", a0_href_value = ctx.post.id);
    			add_location(a0, file$1, 51, 8, 734);
    			attr(a1, "href", a1_href_value = ctx.post.attributedTo);
    			add_location(a1, file$1, 51, 52, 778);
    			attr(span0, "class", "metadata-seperator");
    			add_location(span0, file$1, 52, 8, 861);
    			add_location(span1, file$1, 53, 8, 911);
    			attr(div, "class", "metadata");
    			add_location(div, file$1, 49, 4, 702);
    			add_location(p, file$1, 65, 4, 1239);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a0);
    			append(a0, t0);
    			append(div, t1);
    			append(div, a1);
    			append(a1, t2);
    			append(div, t3);
    			append(div, span0);
    			append(div, t5);
    			append(div, span1);
    			append(span1, t6);
    			insert(target, t7, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t8, anchor);
    			insert(target, p, anchor);
    			p.innerHTML = raw_value;
    			insert(target, t9, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.post) && t0_value !== (t0_value = ctx.post.type)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.post) && a0_href_value !== (a0_href_value = ctx.post.id)) {
    				attr(a0, "href", a0_href_value);
    			}

    			if ((changed.post) && t2_value !== (t2_value = ctx.post.attributedTo.split('/').pop())) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.post) && a1_href_value !== (a1_href_value = ctx.post.attributedTo)) {
    				attr(a1, "href", a1_href_value);
    			}

    			if ((changed.post) && t6_value !== (t6_value = ctx.post.published.replace("T", " ").replace("Z", " "))) {
    				set_data(t6, t6_value);
    			}

    			if (ctx.post.tag) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(t8.parentNode, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((changed.post) && raw_value !== (raw_value = ctx.post.content)) {
    				p.innerHTML = raw_value;
    			}

    			if (ctx.post.attachment) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    				detach(t7);
    			}

    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t8);
    				detach(p);
    				detach(t9);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(if_block1_anchor);
    			}
    		}
    	};
    }

    // (46:0) {#if typeof post === 'string'}
    function create_if_block_2(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			add_location(p, file$1, 46, 4, 668);
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

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (56:4) {#if post.tag}
    function create_if_block_5(ctx) {
    	var div;

    	var each_value_1 = ctx.post.tag;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div, "class", "tags");
    			add_location(div, file$1, 56, 8, 1016);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.post) {
    				each_value_1 = ctx.post.tag;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
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

    // (59:12) {#if tag.type == 'Hashtag'}
    function create_if_block_6(ctx) {
    	var a, t_value = ctx.tag.name, t, a_href_value;

    	return {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr(a, "class", "tag");
    			attr(a, "href", a_href_value = ctx.tag.href);
    			add_location(a, file$1, 59, 16, 1123);
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
    				attr(a, "href", a_href_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (58:8) {#each post.tag as tag}
    function create_each_block_1(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.tag.type == 'Hashtag') && create_if_block_6(ctx);

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
    					if_block = create_if_block_6(ctx);
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

    // (67:4) {#if post.attachment}
    function create_if_block_3(ctx) {
    	var each_1_anchor;

    	var each_value = ctx.post.attachment;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.post) {
    				each_value = ctx.post.attachment;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (69:12) {#if attachment.type === "Document" && attachment.mediaType.startsWith("image")}
    function create_if_block_4(ctx) {
    	var img, img_src_value;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", img_src_value = ctx.attachment.url);
    			add_location(img, file$1, 69, 16, 1449);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.post) && img_src_value !== (img_src_value = ctx.attachment.url)) {
    				attr(img, "src", img_src_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (68:8) {#each post.attachment as attachment}
    function create_each_block(ctx) {
    	var if_block_anchor;

    	var if_block = (ctx.attachment.type === "Document" && ctx.attachment.mediaType.startsWith("image")) && create_if_block_4(ctx);

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
    			if (ctx.attachment.type === "Document" && ctx.attachment.mediaType.startsWith("image")) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_4(ctx);
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

    // (82:4) {#if session.user }
    function create_if_block(ctx) {
    	var div, a0, t1, a1, t3, a2, t5, if_block_anchor, current, dispose;

    	var if_block = (ctx.showPublish) && create_if_block_1(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Like";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Add comment";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Announce";
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(a0, "class", "ra_item svelte-uuxpp3");
    			attr(a0, "href", "");
    			add_location(a0, file$1, 83, 12, 1804);
    			attr(a1, "class", "ra_item svelte-uuxpp3");
    			attr(a1, "href", "");
    			add_location(a1, file$1, 84, 17, 1857);
    			attr(a2, "class", "ra_item svelte-uuxpp3");
    			attr(a2, "href", "");
    			add_location(a2, file$1, 85, 17, 1942);
    			attr(div, "class", "ra svelte-uuxpp3");
    			add_location(div, file$1, 82, 8, 1775);
    			dispose = listen(a1, "click", ctx.togglePublish);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a0);
    			append(div, t1);
    			append(div, a1);
    			append(div, t3);
    			append(div, a2);
    			insert(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.showPublish) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    				detach(t5);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			dispose();
    		}
    	};
    }

    // (88:8) {#if showPublish}
    function create_if_block_1(ctx) {
    	var current;

    	var publish = new Publish({
    		props: {
    		reply: ctx.post,
    		session: ctx.session
    	},
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
    			if (changed.post) publish_changes.reply = ctx.post;
    			if (changed.session) publish_changes.session = ctx.session;
    			publish.$set(publish_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(publish.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(publish.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(publish, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var t0, div1, div0, a0, t2, a1, t4, a2, t6, current;

    	function select_block_type(ctx) {
    		if (typeof ctx.post === 'string') return create_if_block_2;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block0 = current_block_type(ctx);

    	var if_block1 = (ctx.session.user) && create_if_block(ctx);

    	return {
    		c: function create() {
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "N likes";
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "N comments";
    			t4 = space();
    			a2 = element("a");
    			a2.textContent = "N announces";
    			t6 = space();
    			if (if_block1) if_block1.c();
    			attr(a0, "class", "rs_left svelte-uuxpp3");
    			attr(a0, "href", "");
    			add_location(a0, file$1, 77, 11, 1584);
    			attr(a1, "class", "rs_right svelte-uuxpp3");
    			attr(a1, "href", "");
    			add_location(a1, file$1, 78, 11, 1634);
    			attr(a2, "class", "rs_right svelte-uuxpp3");
    			attr(a2, "href", "");
    			add_location(a2, file$1, 79, 11, 1688);
    			attr(div0, "class", "rs svelte-uuxpp3");
    			add_location(div0, file$1, 76, 4, 1556);
    			attr(div1, "class", "reactionz svelte-uuxpp3");
    			add_location(div1, file$1, 75, 0, 1528);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, a0);
    			append(div0, t2);
    			append(div0, a1);
    			append(div0, t4);
    			append(div0, a2);
    			append(div1, t6);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(changed, ctx);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);
    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			}

    			if (ctx.session.user) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_block0.d(detaching);

    			if (detaching) {
    				detach(t0);
    				detach(div1);
    			}

    			if (if_block1) if_block1.d();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { post, session } = $$props;

        let showPublish = false;
        const togglePublish = ev => {
            ev.preventDefault();
            $$invalidate('showPublish', showPublish = !showPublish);
        };

    	const writable_props = ['post', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<PostBody> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('post' in $$props) $$invalidate('post', post = $$props.post);
    		if ('session' in $$props) $$invalidate('session', session = $$props.session);
    	};

    	return {
    		post,
    		session,
    		showPublish,
    		togglePublish
    	};
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

    /* src/Post.svelte generated by Svelte v3.7.1 */

    const file$2 = "src/Post.svelte";

    // (39:0) {:else}
    function create_else_block$1(ctx) {
    	var li, div0, h2, t1, a0, t2_value = ctx.post.type, t2, a0_href_value, t3, a1, t4_value = ctx.post.actor.split('/').slice(-1)[0], t4, a1_href_value, t5, span, t7, t8, div1, current_block_type_index, if_block1, current;

    	var if_block0 = (ctx.post.published) && create_if_block_2$1(ctx);

    	var if_block_creators = [
    		create_if_block_1$1,
    		create_else_block_1
    	];

    	var if_blocks = [];

    	function select_block_type_1(ctx) {
    		if (ctx.post_object.id) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

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
    			if (if_block0) if_block0.c();
    			t8 = space();
    			div1 = element("div");
    			if_block1.c();
    			attr(h2, "id", "");
    			add_location(h2, file$2, 41, 8, 869);
    			attr(a0, "href", a0_href_value = ctx.post.id);
    			add_location(a0, file$2, 42, 8, 896);
    			attr(a1, "href", a1_href_value = ctx.post.actor);
    			add_location(a1, file$2, 42, 52, 940);
    			attr(span, "class", "metadata-seperator");
    			add_location(span, file$2, 43, 8, 1016);
    			attr(div0, "class", "metadata");
    			add_location(div0, file$2, 40, 4, 838);
    			attr(div1, "class", "reaction svelte-1rfnwxy");
    			add_location(div1, file$2, 49, 4, 1194);
    			attr(li, "class", "post");
    			add_location(li, file$2, 39, 0, 816);
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
    			if (if_block0) if_block0.m(div0, null);
    			append(li, t8);
    			append(li, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.post) && t2_value !== (t2_value = ctx.post.type)) {
    				set_data(t2, t2_value);
    			}

    			if ((!current || changed.post) && a0_href_value !== (a0_href_value = ctx.post.id)) {
    				attr(a0, "href", a0_href_value);
    			}

    			if ((!current || changed.post) && t4_value !== (t4_value = ctx.post.actor.split('/').slice(-1)[0])) {
    				set_data(t4, t4_value);
    			}

    			if ((!current || changed.post) && a1_href_value !== (a1_href_value = ctx.post.actor)) {
    				attr(a1, "href", a1_href_value);
    			}

    			if (ctx.post.published) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block1 = if_blocks[current_block_type_index];
    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}
    				transition_in(if_block1, 1);
    				if_block1.m(div1, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    // (33:0) {#if fetched_post == false}
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
    			attr(h2, "id", "");
    			add_location(h2, file$2, 34, 4, 729);
    			attr(li, "class", "post");
    			add_location(li, file$2, 33, 0, 707);
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
    			transition_in(postbody.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(postbody.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			destroy_component(postbody);
    		}
    	};
    }

    // (46:8) {#if post.published }
    function create_if_block_2$1(ctx) {
    	var span, t_value = ctx.post.published.replace("T", " ").replace("Z", " "), t;

    	return {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$2, 46, 8, 1097);
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

    // (53:8) {:else}
    function create_else_block_1(ctx) {
    	var a, t_value = ctx.post.object, t, a_href_value;

    	return {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr(a, "href", a_href_value = ctx.post.object);
    			add_location(a, file$2, 53, 12, 1335);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.post) && t_value !== (t_value = ctx.post.object)) {
    				set_data(t, t_value);
    			}

    			if ((changed.post) && a_href_value !== (a_href_value = ctx.post.object)) {
    				attr(a, "href", a_href_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (51:8) {#if post_object.id}
    function create_if_block_1$1(ctx) {
    	var current;

    	var postbody = new PostBody({
    		props: {
    		post: ctx.post_object,
    		session: ctx.session
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			postbody.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(postbody, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var postbody_changes = {};
    			if (changed.post_object) postbody_changes.post = ctx.post_object;
    			if (changed.session) postbody_changes.session = ctx.session;
    			postbody.$set(postbody_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(postbody.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(postbody.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(postbody, detaching);
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
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
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
    	    if (typeof post.object === "string") {
    	        fpost = xhr(post.object);
                // fpost = fetch(post.object, { headers: {
                //     "Accept": "application/activity+json"
                // }}).then(d => d.json());
                $$invalidate('post_object', post_object = fpost => fpost.object);
    	    } else {
    	        $$invalidate('post_object', post_object = post.object);
    	    }

    	    $$invalidate('fetched_post', fetched_post = true);
        }

    	const writable_props = ['post', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Post> was created with unknown prop '${key}'`);
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

    /* src/TimeLine.svelte generated by Svelte v3.7.1 */

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

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(ul, "class", "post-list");
    			add_location(ul, file$3, 44, 0, 1403);
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
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

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
    			transition_in(post.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(post.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(post, detaching);
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
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 'value',
    		error: 'null',
    		blocks: [,,,]
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
    			transition_in(info.block);
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(await_block_anchor);
    			}

    			info.block.d(detaching);
    			info.token = null;
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
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TimeLine> was created with unknown prop '${key}'`);
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

    /* src/SearchFollow.svelte generated by Svelte v3.7.1 */

    const file$4 = "src/SearchFollow.svelte";

    // (75:0) {#if outbox_collection}
    function create_if_block$2(ctx) {
    	var button, t0, t1, t2, current, dispose;

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
    			t0 = text("Follow ");
    			t1 = text(ctx.username);
    			t2 = space();
    			timeline.$$.fragment.c();
    			attr(button, "class", "btn btn-sm pull-xs-right btn-info");
    			add_location(button, file$4, 75, 4, 2386);
    			dispose = listen(button, "click", ctx.follow);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);
    			insert(target, t2, anchor);
    			mount_component(timeline, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.username) {
    				set_data(t1, ctx.username);
    			}

    			var timeline_changes = {};
    			if (changed.session) timeline_changes.session = ctx.session;
    			if (changed.outbox_collection) timeline_changes.outbox_collection = ctx.outbox_collection;
    			timeline.$set(timeline_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(timeline.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(timeline.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    				detach(t2);
    			}

    			destroy_component(timeline, detaching);

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
    			add_location(br0, file$4, 63, 0, 1991);
    			attr(input, "class", "form-control form-control-lg");
    			attr(input, "type", "text");
    			attr(input, "placeholder", "Search format: username@domain");
    			add_location(input, file$4, 66, 8, 2079);
    			attr(fieldset, "class", "form-group");
    			add_location(fieldset, file$4, 65, 4, 2041);
    			attr(button, "class", "btn btn-sm pull-xs-right btn-info");
    			attr(button, "type", "submit");
    			button.disabled = button_disabled_value = !ctx.username;
    			add_location(button, file$4, 68, 4, 2223);
    			add_location(form, file$4, 64, 0, 1996);
    			add_location(br1, file$4, 72, 0, 2348);
    			add_location(br2, file$4, 72, 4, 2352);

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
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
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

                $: searched_profile = profile;
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
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<SearchFollow> was created with unknown prop '${key}'`);
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

    /* src/Tab.svelte generated by Svelte v3.7.1 */
    const { console: console_1$1 } = globals;

    const file$5 = "src/Tab.svelte";

    // (123:0) {:else}
    function create_else_block_1$1(ctx) {
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
    			transition_in(timeline.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(timeline.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(timeline, detaching);
    		}
    	};
    }

    // (121:32) 
    function create_if_block_4$1(ctx) {
    	var html_tag;

    	return {
    		c: function create() {
    			html_tag = new HtmlTag(ctx.ab, null);
    		},

    		m: function mount(target, anchor) {
    			html_tag.m(target, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				html_tag.d();
    			}
    		}
    	};
    }

    // (119:33) 
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
    			transition_in(searchfollow.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(searchfollow.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(searchfollow, detaching);
    		}
    	};
    }

    // (117:33) 
    function create_if_block_2$2(ctx) {
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
    			transition_in(publish.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(publish.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(publish, detaching);
    		}
    	};
    }

    // (73:0) {#if active_tab == 'profile'}
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
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
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

    // (78:4) {:else}
    function create_else_block$2(ctx) {
    	var div, t1, form0, fieldset0, input0, t2, fieldset1, input1, t3, button0, t4, button0_disabled_value, t5, br0, br1, t6, br2, t7, form1, fieldset2, input2, t8, fieldset3, input3, t9, fieldset4, textarea, t10, fieldset5, input4, t11, fieldset6, input5, t12, button1, t13, button1_disabled_value, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Sign-in ( ActivityPub compatible, OAuth2 password grant )";
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
    			br0 = element("br");
    			br1 = element("br");
    			t6 = text("\n        or register ( PubGate only )\n        ");
    			br2 = element("br");
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
    			attr(div, "class", "form-group");
    			add_location(div, file$5, 78, 8, 2119);
    			attr(input0, "class", "form-control form-control-lg");
    			attr(input0, "type", "username");
    			attr(input0, "placeholder", "Username");
    			add_location(input0, file$5, 82, 16, 2314);
    			attr(fieldset0, "class", "form-group");
    			add_location(fieldset0, file$5, 81, 12, 2268);
    			attr(input1, "class", "form-control form-control-lg");
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "Password");
    			add_location(input1, file$5, 85, 16, 2502);
    			attr(fieldset1, "class", "form-group");
    			add_location(fieldset1, file$5, 84, 12, 2456);
    			attr(button0, "class", "btn btn-sm pull-xs-right btn-info");
    			attr(button0, "type", "submit");
    			button0.disabled = button0_disabled_value = !ctx.username || !ctx.password;
    			add_location(button0, file$5, 87, 12, 2644);
    			add_location(form0, file$5, 80, 8, 2216);
    			add_location(br0, file$5, 91, 8, 2815);
    			add_location(br1, file$5, 91, 12, 2819);
    			add_location(br2, file$5, 93, 8, 2869);
    			attr(input2, "class", "form-control form-control-lg");
    			attr(input2, "type", "text");
    			attr(input2, "placeholder", "Username");
    			add_location(input2, file$5, 96, 16, 2983);
    			attr(fieldset2, "class", "form-group");
    			add_location(fieldset2, file$5, 95, 12, 2937);
    			attr(input3, "class", "form-control form-control-lg");
    			attr(input3, "type", "password");
    			attr(input3, "placeholder", "Password");
    			add_location(input3, file$5, 99, 16, 3167);
    			attr(fieldset3, "class", "form-group");
    			add_location(fieldset3, file$5, 98, 12, 3121);
    			attr(textarea, "class", "form-control");
    			attr(textarea, "rows", "8");
    			attr(textarea, "placeholder", "Profile Description");
    			add_location(textarea, file$5, 102, 16, 3355);
    			attr(fieldset4, "class", "form-group");
    			add_location(fieldset4, file$5, 101, 12, 3309);
    			attr(input4, "class", "form-control form-control-lg");
    			attr(input4, "type", "text");
    			attr(input4, "placeholder", "Avatar URL");
    			add_location(input4, file$5, 105, 16, 3538);
    			attr(fieldset5, "class", "form-group");
    			add_location(fieldset5, file$5, 104, 12, 3492);
    			attr(input5, "class", "form-control form-control-lg");
    			attr(input5, "type", "text");
    			attr(input5, "placeholder", "Invite code");
    			add_location(input5, file$5, 108, 16, 3722);
    			attr(fieldset6, "class", "form-group");
    			add_location(fieldset6, file$5, 107, 12, 3676);
    			attr(button1, "class", "btn btn-sm pull-xs-right btn-info");
    			attr(button1, "type", "submit");
    			button1.disabled = button1_disabled_value = !ctx.username || !ctx.password;
    			add_location(button1, file$5, 111, 12, 3862);
    			add_location(form1, file$5, 94, 8, 2882);

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
    			insert(target, div, anchor);
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
    			insert(target, br0, anchor);
    			insert(target, br1, anchor);
    			insert(target, t6, anchor);
    			insert(target, br2, anchor);
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
    			if (changed.password && (input1.value !== ctx.password)) input1.value = ctx.password;

    			if ((changed.username || changed.password) && button0_disabled_value !== (button0_disabled_value = !ctx.username || !ctx.password)) {
    				button0.disabled = button0_disabled_value;
    			}

    			if (changed.username && (input2.value !== ctx.username)) input2.value = ctx.username;
    			if (changed.password && (input3.value !== ctx.password)) input3.value = ctx.password;
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
    				detach(div);
    				detach(t1);
    				detach(form0);
    				detach(t5);
    				detach(br0);
    				detach(br1);
    				detach(t6);
    				detach(br2);
    				detach(t7);
    				detach(form1);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (74:4) {#if session.user }
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
    			attr(button, "class", "btn btn-sm pull-xs-right btn-info");
    			add_location(button, file$5, 74, 9, 1935);
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
    			transition_in(timeline.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(timeline.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    				detach(t_1);
    			}

    			destroy_component(timeline, detaching);

    			dispose();
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$3,
    		create_if_block_2$2,
    		create_if_block_3$1,
    		create_if_block_4$1,
    		create_else_block_1$1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.active_tab == 'profile') return 0;
    		if (ctx.active_tab == 'create') return 1;
    		if (ctx.active_tab == 'search') return 2;
    		if (ctx.active_tab == 'about') return 3;
    		return 4;
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
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
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

        let ab = about_description;

        let username = '';
        let password = '';

        async function login(event) {
            const profile = await xhr(base_url + "/@" + username).catch(error => {
                console.log(error);
            });

            const token = await xhr(profile.endpoints.oauthTokenEndpoint, {
                method: 'POST',
                body: JSON.stringify({username: username, password: password})
            });

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
                await login();
            }
        }

    	const writable_props = ['active_tab', 'session'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$1.warn(`<Tab> was created with unknown prop '${key}'`);
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
    		ab,
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
    			console_1$1.warn("<Tab> was created without expected prop 'active_tab'");
    		}
    		if (ctx.session === undefined && !('session' in props)) {
    			console_1$1.warn("<Tab> was created without expected prop 'session'");
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

    /* src/App.svelte generated by Svelte v3.7.1 */

    const file$6 = "src/App.svelte";

    // (42:4) {#if pgi == true}
    function create_if_block_2$3(ctx) {
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
    			attr(a0, "href", "#local");
    			attr(a0, "class", "header-selected");
    			add_location(a0, file$6, 43, 8, 765);
    			add_location(li0, file$6, 42, 6, 752);
    			attr(a1, "href", "#federated");
    			add_location(a1, file$6, 48, 8, 897);
    			add_location(li1, file$6, 47, 6, 884);

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

    // (52:4) {#if session.user}
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
    			attr(a0, "href", "#inbox");
    			add_location(a0, file$6, 53, 8, 1026);
    			add_location(li0, file$6, 52, 6, 1013);
    			attr(a1, "href", "#create");
    			add_location(a1, file$6, 56, 8, 1105);
    			add_location(li1, file$6, 55, 6, 1092);
    			attr(a2, "href", "#search");
    			add_location(a2, file$6, 59, 8, 1186);
    			add_location(li2, file$6, 58, 6, 1173);

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

    // (65:33) {:else}
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

    // (65:8) {#if session.user}
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
    	var header, ul, t0, t1, li0, a0, t2, li1, a1, t4, div0, t5, hr, t6, footer, div1, h3, current, dispose;

    	var if_block0 = (ctx.pgi == true) && create_if_block_2$3(ctx);

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
    			h3 = element("h3");
    			h3.textContent = "PubGate-Philip";
    			attr(a0, "href", "#profile");
    			add_location(a0, file$6, 63, 6, 1280);
    			add_location(li0, file$6, 62, 4, 1269);
    			attr(a1, "href", "#about");
    			add_location(a1, file$6, 68, 6, 1408);
    			add_location(li1, file$6, 67, 4, 1397);
    			add_location(ul, file$6, 40, 2, 719);
    			add_location(header, file$6, 39, 0, 708);
    			attr(div0, "class", "content");
    			add_location(div0, file$6, 73, 0, 1485);
    			attr(hr, "class", "separator");
    			add_location(hr, file$6, 77, 0, 1581);
    			add_location(h3, file$6, 80, 4, 1663);
    			attr(div1, "class", "left-column");
    			add_location(div1, file$6, 79, 2, 1633);
    			attr(footer, "class", "content");
    			add_location(footer, file$6, 78, 0, 1606);

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
    			append(div1, h3);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.pgi == true) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					if_block0.m(ul, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.session.user) {
    				if (!if_block1) {
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
    			transition_in(tab.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(tab.$$.fragment, local);
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

    			destroy_component(tab);

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

      if(session.user) {
          $$invalidate('active_tab', active_tab = 'inbox');
      } else {
        $$invalidate('active_tab', active_tab = pgi ? "local" : "about");
      }

      function selectTab(event) {
        event.preventDefault();

        $$invalidate('active_tab', active_tab = this.href.split("#")[1]);

        Array.prototype.forEach.call(
          this.parentNode.parentNode.children,
          (el, i) => {
            if (el.firstChild.href.split("#")[1] !== active_tab) {
              el.firstChild.classList.remove("header-selected");
            }
          }
        );

        this.classList.add("header-selected");
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
      props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
