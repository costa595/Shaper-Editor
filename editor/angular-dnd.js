/**
 * @license AngularJS-DND v0.1.4.1
 * (c) 2014-2015 Alexander Afonin (toafonin@gmail.com, http://github.com/Tuch)
 * License: MIT
 */

;
(function(angular, undefined, window, document) {
	'use strict'

	/*

	 =================
	 ANGULAR DND:
	 =================

	 */

	angular.dnd = {};
	angular.dnd.version = '0.1.6';

	/* ENVIRONMENT VARIABLES */

	var $ = angular.element,
		$window = $(window),
		$document = $(document),
		body = 'body',
		TRANSFORM, TRANSFORMORIGIN,

		forEach = angular.forEach,
		extend = angular.extend;

	(function() {
		var agent = navigator.userAgent;

		if (/webkit\//i.test(agent)) {
			TRANSFORM = '-webkit-transform';
			TRANSFORMORIGIN = '-webkit-transform-origin';
		} else if (/gecko\//i.test(agent)) {
			TRANSFORM = '-moz-transform';
			TRANSFORMORIGIN = '-moz-transform-origin';
		} else if (/trident\//i.test(agent)) {
			TRANSFORM = '-ms-transform';
			TRANSFORMORIGIN = 'ms-transform-origin';
		} else if (/presto\//i.test(agent)) {
			TRANSFORM = '-o-transform';
			TRANSFORMORIGIN = '-o-transform-origin';
		} else {
			TRANSFORM = 'transform';
			TRANSFORMORIGIN = 'transform-origin';
		};

	})();



	/* SOME HELPERS */

	function noop() {}

	function doFalse() {
		return false
	}

	function doTrue() {
		return true
	}

	function proxy(context, fn) {
		return function() {
			fn.apply(context, arguments);
		};
	}

	function degToRad(d) {
		return (d * (Math.PI / 180));
	}

	function radToDeg(r) {
		return (r * (180 / Math.PI));
	}

	function getNumFromSegment(min, curr, max) {
		return curr < min ? min : curr > max ? max : curr;
	}

	function findEvents(element) {

		var events = element.data('events');
		if (events !== undefined)
			return events;

		events = $.data(element, 'events');
		if (events !== undefined)
			return events;

		events = $._data(element, 'events');
		if (events !== undefined)
			return events;

		events = $._data(element[0], 'events');
		if (events !== undefined)
			return events;

		return undefined;
	}

	function debounce(fn, timeout, invokeAsap, context) {
		if (arguments.length == 3 && typeof invokeAsap != 'boolean') {
			context = invokeAsap;
			invokeAsap = false;
		}

		var timer;

		return function() {
			var args = arguments;
			context = context || this;

			invokeAsap && !timer && fn.apply(context, args);

			clearTimeout(timer);

			timer = setTimeout(function() {
				!invokeAsap && fn.apply(context, args);
				timer = null;
			}, timeout);

		};
	}

	function throttle(fn, timeout, context) {
		var timer, args;

		return function() {
			if (timer) return;
			args = arguments;
			context = context || this;
			fn.apply(context, args);
			timer = setTimeout(function() {
				timer = null;
			}, timeout);
		};
	}


	/* parsing like: ' a = fn1(), b = fn2()' into {a: 'fn1()', b: 'fn2()'} */

	function parseStringAsVars(str) {
		if (!str) return undefined;

		var a = str.replace(/\s/g, '').split(','),
			ret = {};

		for (var i = 0; i < a.length; i++) {
			a[i] = a[i].split('=');
			ret[a[i][0]] = a[i][1];
		}

		return ret;
	};

	function avgPerf(fn1, timeout, context, callback) {
		context = context || this;
		timeout = timeout || 1000;
		callback = callback || function(val) {}

		var time = [];

		var fn2 = debounce(function() {
			var sum = 0;

			for (var i = 0; i < time.length; i++) {
				sum += time[i];
			}

			callback(Math.round(sum / time.length))

			time = [];

		}, timeout)

		return function() {
			var start = Date.now();

			fn1.apply(context, arguments);

			time.push(Date.now() - start);

			fn2();

		}
	}

	angular.dnd = {
		noop: noop,
		doTrue: doTrue,
		doFalse: doFalse,
		proxy: proxy,
		radToDeg: radToDeg,
		degToRad: degToRad,
		getNumFromSegment: getNumFromSegment,
		findEvents: findEvents,
		throttle: throttle,
		debounce: debounce,
	};

	/* EXTEND NUMBER PROTOTYPE BY round */

	if (Number.prototype.round != undefined) console.warning('Number.prototype.round is defined');
	Number.prototype.round = function(n) {
		if (isNaN(n)) n = 0;
		var m = Math.pow(10, n);
		return Math.round(this * m) / m;
	};


	/* POINT OBJECT */

	var Point = (function() {
		function Point(x, y) {
			if (typeof x === 'object') {
				y = x.y || x.top;
				x = x.x || x.left;
			}

			this.x = x || 0;
			this.y = y || 0;
		}

		Point.prototype = {
			equal: function(other) {
				return this.x === other.x && this.y === other.y;
			},
			add: function(other) {
				return new Point(this.x + other.x, this.y + other.y);
			},
			subtract: function(other) {
				return new Point(this.x - other.x, this.y - other.y);
			},
			scale: function(scalar) {
				return new Point(this.x * scalar, this.y * scalar);
			},
			magnitude: function() {
				return this.distance(new Point(0, 0), this);
			},
			distance: function(other) {
				return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
			},
			angle: function(other, isdegree) {
				var ret = Math.atan2(
					other.y - this.y,
					other.x - this.x
				);

				if (isdegree === true) ret *= 180 / Math.PI;

				return ret;
			},
			deltaAngle: function(other, aboutPoint, isdegree) {
				aboutPoint = aboutPoint == undefined ? {
					x: 0,
					y: 0
				} : aboutPoint;

				var ret = this.angle(aboutPoint) - other.angle(aboutPoint);

				if (ret < 0) ret = Math.PI * 2 + ret;

				if (isdegree === true) ret *= 180 / Math.PI;

				return ret;
			},
			transform: function(matrix) {
				return matrix.transformPoint(this);
			},
			deltaTransform: function(matrix) {
				return matrix.deltaTransformPoint(this);
			},
			rotate: function(rads, aboutPoint) {
				var matrix = (new Matrix()).rotate(rads, aboutPoint);

				return this.transform(matrix);
			},
		};

		return function(x, y) {
			return new Point(x, y)
		};
	})();



	/* MATRIX OBJECT */

	var Matrix = (function() {
		function Matrix(a, b, c, d, tx, ty) {
			this.a = a !== undefined ? a : 1;
			this.b = b || 0;
			this.c = c || 0;
			this.d = d !== undefined ? d : 1;
			this.tx = tx || 0;
			this.ty = ty || 0;
		}

		Matrix.prototype = {
			concat: function(other) {
				return new Matrix(
					this.a * other.a + this.c * other.b,
					this.b * other.a + this.d * other.b,
					this.a * other.c + this.c * other.d,
					this.b * other.c + this.d * other.d,
					this.a * other.tx + this.c * other.ty + this.tx,
					this.b * other.tx + this.d * other.ty + this.ty
				);
			},
			inverse: function() {
				var determinant = this.a * this.d - this.b * this.c;

				return new Matrix(
					this.d / determinant, -this.b / determinant, -this.c / determinant,
					this.a / determinant, (this.c * this.ty - this.d * this.tx) / determinant, (this.b * this.tx - this.a * this.ty) / determinant
				);
			},
			rotate: function(theta, aboutPoint) {
				var rotationMatrix = new Matrix(
					Math.cos(theta),
					Math.sin(theta), -Math.sin(theta),
					Math.cos(theta)
				);

				if (aboutPoint)
					rotationMatrix = this.translate(aboutPoint.x, aboutPoint.y).concat(rotationMatrix).translate(-aboutPoint.x, -aboutPoint.y);

				return this.concat(rotationMatrix);
			},
			scale: function(sx, sy, aboutPoint) {
				sy = sy || sx;

				var scaleMatrix = Matrix(sx, 0, 0, sy);

				if (aboutPoint)
					scaleMatrix = scaleMatrix.translate(aboutPoint.x, aboutPoint.y).translate(-aboutPoint.x, -aboutPoint.y);

				return scaleMatrix;
			},
			translate: function(tx, ty) {
				var translateMatrix = new Matrix(1, 0, 0, 1, tx, ty);

				return this.concat(translateMatrix);
			},

			transformPoint: function(point) {
				return new Point(
					this.a * point.x + this.c * point.y + this.tx,
					this.b * point.x + this.d * point.y + this.ty
				);
			},
			deltaTransformPoint: function(point) {
				return new Point(
					this.a * point.x + this.c * point.y,
					this.b * point.x + this.d * point.y
				);
			},
			toStyle: function() {
				return 'matrix(' + this.a.round(3) + ', ' + this.b.round(3) + ', ' + this.c.round(3) + ', ' + this.d.round(3) + ', ' + this.tx.round(3) + ', ' + this.ty.round(3) + ')';
			},

		};

		var fn = function(a, b, c, d, tx, ty) {
			return new Matrix(a, b, c, d, tx, ty);
		};

		fn.IDENTITY = new Matrix();
		fn.HORIZONTAL_FLIP = new Matrix(-1, 0, 0, 1);
		fn.VERTICAL_FLIP = new Matrix(1, 0, 0, -1);

		return fn;
	}());

	/* RECT OBJECT */

	var Rect = (function() {
		function Rect(tl, tr, bl, br) {
			this.tl = tl;
			this.tr = tr;
			this.bl = bl;
			this.br = br;
		}

		Rect.prototype = {
			applyMatrix: function(matrix, aboutPoint) {
				var tl, tr, bl, br, translateIn = Matrix(1, 0, 0, 1, aboutPoint.x, aboutPoint.y),
					translateOut = Matrix(1, 0, 0, 1, -aboutPoint.x, -aboutPoint.y);

				if (aboutPoint != undefined) {
					tl = this.tl.transform(translateOut).transform(matrix).transform(translateIn);
					tr = this.tr.transform(translateOut).transform(matrix).transform(translateIn);
					bl = this.bl.transform(translateOut).transform(matrix).transform(translateIn);
					br = this.br.transform(translateOut).transform(matrix).transform(translateIn);
				} else {
					tl = this.tl.transform(matrix);
					tr = this.tr.transform(matrix);
					bl = this.bl.transform(matrix);
					br = this.br.transform(matrix);
				}

				return new Rect(tl, tr, bl, br);
			},
			width: function() {
				var dx = this.tl.x - this.tr.x;
				var dy = this.tl.y - this.tr.y;
				return Math.sqrt(dx * dx + dy * dy);
			},
			height: function() {
				var dx = this.tl.x - this.bl.x;
				var dy = this.tl.y - this.bl.y;
				return Math.sqrt(dx * dx + dy * dy);
			},
			client: function() {
				var top = Math.min(this.tl.y, this.tr.y, this.bl.y, this.br.y);
				var left = Math.min(this.tl.x, this.tr.x, this.bl.x, this.br.x);
				var height = Math.max(this.tl.y, this.tr.y, this.bl.y, this.br.y) - top;
				var width = Math.max(this.tl.x, this.tr.x, this.bl.x, this.br.x) - left;

				return {
					top: top.round(1),
					left: left.round(1),
					height: height.round(1),
					width: width.round(1),
					bottom: (top + height).round(1),
					right: (left + width).round(1)
				};
			},
			getAngle: function(degs) {
				var y = this.tl.y - this.tr.y;
				var x = this.tl.x - this.tr.x;

				return Math.tan(x / y) * 180 / Math.PI;
			}
		};

		var fn = function(left, top, width, height) {
			var args = arguments;

			if (typeof args[0] == 'object') {
				top = args[0].top;
				left = args[0].left;
				width = args[0].width;
				height = args[0].height;
			};

			return new Rect(Point(left, top), Point(left + width, top), Point(left, top + height), Point(left + width, top + height));
		};

		fn.fromPoints = function(tl, tr, bl, br) {
			return new Rect(tl, tr, bl, br);
		};

		return fn;
	})();

	/* JQLITE EXTENDING */

	extend($.prototype, {

		dndDisableSelection: function() {
			this.on('dragstart selectstart', doFalse).dndCss({
				'-moz-user-select': 'none',
				'-khtml-user-select': 'none',
				'-webkit-user-select': 'none'
			})
		},

		dndEnableSelection: function() {
			this.off('dragstart selectstart', doFalse).dndCss({
				'-moz-user-select': 'auto',
				'-khtml-user-select': 'auto',
				'-webkit-user-select': 'auto'
			});
		},

		dndClientRect: function() {
			var DOMRect = this[0].getBoundingClientRect();

			return {
				bottom: DOMRect.bottom,
				height: DOMRect.height,
				left: DOMRect.left,
				right: DOMRect.right,
				top: DOMRect.top,
				width: DOMRect.width,
			};
		},

		dndStyleRect: function(containerSize) {
			var styles = this.dndCss(['width', 'height', 'top', 'left']);
			if (!containerSize) {
				containerSize.curWidth = presentationObject.curWidth;
				containerSize.curHeight = presentationObject.curHeight;
			}

			//Из процентов в px
			var width = parseFloat(styles.width) / 100 * containerSize.curWidth;
			var height = parseFloat(styles.height) / 100 * containerSize.curHeight;

			var top = styles.top == 'auto' ? 0 : parseFloat(styles.top) / 100 * containerSize.curHeight;
			var left = styles.left == 'auto' ? 0 : parseFloat(styles.left) / 100 * containerSize.curWidth;


			return {
				top: top,
				right: left + width,
				bottom: top + height,
				left: left,
				width: width,
				height: height
			};
		},

		dndGetParentScrollArea: function() {
			var ret, parents = this.dndParents(),
				scrollX, clientX, scrollY, clientY, paddingX, paddingY, paddings, htmlEl = document.documentElement;

			forEach(parents, function(element) {

				paddings = $(element).dndCss(['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);

				scrollX = element.scrollWidth;
				clientX = element.clientWidth;
				scrollY = element.scrollHeight;
				clientY = element.clientHeight;

				paddingY = parseFloat(paddings['padding-top']) + parseFloat(paddings['padding-bottom']);
				paddingX = parseFloat(paddings['padding-left']) + parseFloat(paddings['padding-right']);

				if (scrollX - paddingX !== clientX || scrollY - paddingY !== clientY) {
					ret = element;
					return false;
				}
			});

			if (htmlEl && ret === htmlEl[0]) ret = window;

			return $(ret);
		},

		dndParents: function() {
			var parent = this[0].parentElement,
				ret = [];

			while (parent) {
				ret.push(parent);
				parent = parent.parentElement;
			}

			return $(ret);
		},
		dndGetAngle: function(degs) {

			var matrix = this.dndCss(TRANSFORM);

			if (matrix == 'none' || matrix == '') return 0;

			var values = matrix.split('(')[1].split(')')[0].split(',');

			var a = values[0];

			var b = values[1];

			var rads = Math.atan2(b, a);

			rads = rads < 0 ? rads += Math.PI * 2 : rads;

			return degs ? Math.round(rads * 180 / Math.PI) : rads;

		},

		dndCss: (function() {
			var SPECIAL_CHARS_REGEXP = /([\:\-\_\.]+(.))/g;
			var MOZ_HACK_REGEXP = /^moz([A-Z])/;

			function toCamelCase(string) {
				return string.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
					return offset ? letter.toUpperCase() : letter;
				}).replace(MOZ_HACK_REGEXP, 'Moz$1');
			}

			var hooks = {};

			(function() {
				var arr = {
					width: ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'],
					height: ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
				};

				forEach(arr, function(styles, prop) {

					hooks[prop] = {
						get: function(element) {
							var computed = window.getComputedStyle(element);
							var ret = computed[prop];

							if (computed.boxSizing != 'border-box' || ret[ret.length - 1] == '%') return ret;

							ret = parseFloat(ret);

							for (var i = 0; i < styles.length; i++) {
								ret -= parseFloat(computed[styles[i]]);
							}

							return ret + 'px';
						}
					}

				});

			})();

			var cssNumber = {
				"columnCount": true,
				"fillOpacity": true,
				"fontWeight": true,
				"lineHeight": true,
				"opacity": true,
				"order": true,
				"orphans": true,
				"widows": true,
				"zIndex": true,
				"zoom": true
			};

			var setCss = function($element, obj) {
				var styles = {};

				for (var key in obj) {
					var val = obj[key]
					if (typeof val === "number" && !cssNumber[key]) val += "px";
					styles[toCamelCase(key)] = val;
				}

				$element.css(styles);

				return $element;
			};

			var getCss = function($element, arg) {
				var ret = {};

				if (!$element[0]) return undefined;

				var style = $element[0].style;
				var computed = window.getComputedStyle($element[0], null);

				if (typeof arg == 'string') {
					if (style[arg]) return style[arg];
					else return hooks[arg] && 'get' in hooks[arg] ? hooks[arg].get($element[0]) : computed.getPropertyValue(arg);
				}

				for (var i = 0; i < arg.length; i++) {
					if (style[arg[i]]) ret[arg[i]] = style[arg[i]];
					else ret[arg[i]] = hooks[arg[i]] && 'get' in hooks[arg[i]] ? hooks[arg[i]].get($element[0]) : computed.getPropertyValue(arg[i]);
				}

				return ret;
			};

			function css() {
				var a = arguments;

				if ((a.length == 1) && ((a[0] instanceof Array) || (typeof a[0] == 'string'))) return getCss(this, a[0]);
				else if ((a.length == 1) && (typeof a[0] == 'object')) return setCss(this, a[0]);
				else if (a.length == 2) {
					var obj = {};

					obj[a[0]] = a[1];

					return setCss(this, obj);
				}

				return this;

			}

			return css;
		})()
	});

	/* INIT ANGULAR MODULE */

	var module = angular.module('dnd', []);


	/* ANGULAR.ELEMENT DND PLUGIN - CORE OF ANGULAR-DND */

	(function() {

		var Regions = (function() {
			var list = {};

			function Regions(namespace) {
				if (!list[namespace]) list[namespace] = [];

				this.namespace = function() {
					return namespace;
				}
			}

			Regions.prototype = {
				get: function() {
					return list[this.namespace()];
				},

				remove: function(el) {
					var index = this.get().indexOf(el);

					if (index > -1) this.get().splice(index, 1)
				},

				has: function(el) {
					return this.get().indexOf(el) > -1;
				},

				add: function(el) {
					if (this.has(el)) return;

					this.get().push(el);

					var self = this;

					$(el).on('$destroy', function() {
						self.remove(el);
					});
				},

			}

			return Regions;
		})();

		var Dnd = (function() {

			var events = ['dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop'];
			var draggables = ['dragstart', 'drag', 'dragend'];
			var droppables = ['dragenter', 'dragover', 'dragleave', 'drop'];
			var handled = false;

			draggables.has = droppables.has = function(event) {
				return this.indexOf(event) > -1;
			};

			var touchevents;
			if ('ontouchstart' in document.documentElement) touchevents = {
				start: 'touchstart',
				move: 'touchmove',
				end: 'touchend',
				cancel: 'touchcancel'
			};
			else if ('pointerEnabled' in window.navigator) touchevents = {
				start: 'pointerdown',
				move: 'pointermove',
				end: 'pointerup',
				cancel: 'pointercancel'
			};
			else if ('msPointerEnabled' in window.navigator) touchevents = {
				start: 'MSPointerDown',
				move: 'MSPointerMove',
				end: 'MSPointerUp',
				cancel: 'MSPointerCancel'
			};
			else touchevents = {
				start: 'touchstart',
				move: 'touchmove',
				end: 'touchend',
				cancel: 'touchcancel'
			};

			function Dnd(el, namespace) {
				this.el = el;
				this.$el = $(el);
				this.listeners = {
					'dragstart': [],
					'drag': [],
					'dragend': [],
					'dragenter': [],
					'dragover': [],
					'dragleave': [],
					'drop': []
				};
				this.regions = new Regions(namespace);
				this.namespace = function() {
					return namespace
				};
				this.propagation = true;
			}

			Dnd.prototype = {
				_isEmptyListeners: function(event) {
					if (event instanceof Array) {

						for (var i = 0; i < event.length; i++) {
							if (!this._isEmptyListeners(event[i])) return false;
						}

					} else if (this.listeners[event].length > 0) return false;

					return true;
				},

				addListener: function(event, handler) {
					if (events.indexOf(event) == -1) {
						return;
					}
					this.listeners[event].push(handler);

					if (droppables.has(event)) this.regions.add(this.el);
					else if (draggables.has(event) && !this.mouse && !this.touch) {
						if ('onmousedown' in window) this.mouse = new Mouse(this);
						if (('ontouchstart' in window) || ('onmsgesturechange' in window)) this.touch = new Touch(this, touchevents);
					}
				},

				removeListener: function(event, handler) {

					var args = arguments;

					if (args.length === 0)
						for (var key in this.listeners) this.listeners[key].length = 0;
					else if (args.length === 1) this.listeners[event].length = 0;
					else {
						var listeners = this.listeners[event];

						for (var i = 0; i < listeners.length; i++) {
							if (listeners[i] === handler) listeners[event].splice(i, 1);
						}

					}

					if (this._isEmptyListeners(droppables)) this.regions.remove(this.el);
					else if (this._isEmptyListeners(draggables)) this.destroy();

				},

				trigger: function(event, api, el) {
					for (var i = 0; i < this.listeners[event].length; i++) {
						this.listeners[event][i].call(this.$el, api, el);
					}
				},

				destroy: function() {

					if (this.mouse) {
						this.mouse.destroy();
						delete this.mouse;
					}

					if (this.touch) {
						this.touch.destroy();
						delete this.touch;
					}
				},

			};


			return Dnd;
		})();

		var Api = (function() {

			function Api(manipulator) {
				var offset = {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0
					},
					container, asPoint = false;

				this.offset = function(top, right, bottom, left) {
					if (!arguments.length) return offset;
					if (typeof top === 'object') {
						right = top.right;
						bottom = top.bottom;
						left = top.left;
						top = top.top;
					}

					offset.top = top;
					offset.right = right;
					offset.bottom = bottom;
					offset.left = left;


				};

				this.container = function(rect) {
					if (!arguments.length) {
						if (!container) container = angular.element(document.body).dndClientRect();

						return container;
					}

					container.top = rect.top;
					container.left = rect.left;
					container.width = rect.width;
					container.height = rect.height;
					container.right = rect.right ? rect.right : rect.left + rect.width;
					container.bottom = rect.bottom ? rect.bottom : rect.top + rect.height;
				};

				this.getBorders = function() {
					var container = this.container();
					return {
						top: container.top + offset.top,
						right: container.right + offset.right,
						bottom: container.bottom + offset.bottom,
						left: container.left + offset.left
					}
				};

				this.getAxis = function() {
					var axis = manipulator.getClientAxis();
					var borders = this.getBorders();

					return {
						top: getNumFromSegment(borders.top, axis.top, borders.bottom),
						left: getNumFromSegment(borders.left, axis.left, borders.right)
					};
				};

				this.getDragTarget = function() {
					return manipulator.dnd.el;
				};

				this.getDropTarget = function() {
					return manipulator.target;
				};

				this.getEvent = function() {
					return manipulator.event;
				};

				this.isTarget = function() {
					return manipulator.isTarget();
				};

				this.unTarget = function() {
					manipulator.removeFromTargets();
				};

				this.asPoint = function() {
					return asPoint;
				};

				this.useAsPoint = function(value) {
					asPoint = value === false ? false : true;
				};
			}

			return Api;

		})();



		var Manipulator = (function() {
			var targets = [];

			function Manipulator(dnd) {
				this.dnd = dnd;
				this.onscroll = proxy(this, this.onscroll);
			}

			Manipulator.prototype = {
				addToTargets: function() {
					targets.push(this);
				},

				removeFromTargets: function() {
					var index;

					while (index !== -1) {
						index = targets.indexOf(this);
						if (index > -1) targets.splice(index, 1);
					}
				},

				getTarget: function() {
					return targets[0];
				},

				isTarget: function() {
					return this.getTarget() === this;
				},

				start: function() {
					this.started = true;

					this.target = false;

					this.api = new Api(this);

					this.regions = this.prepare();

					this.$scrollarea = this.dnd.$el.dndGetParentScrollArea();

					this.$scrollarea.on('scroll', this.onscroll);

					this.dnd.trigger('dragstart', this.api);

				},

				onscroll: function() {
					this.regions = this.prepare();
					this.dnd.trigger('drag', this.api);
				},

				stop: function() {

					this.$scrollarea.off('scroll', this.onscroll);

					if (this.target) $(this.target).data('dnd')[this.dnd.namespace()].trigger('drop', this.api, this.dnd.el);

					this.dnd.trigger('dragend', this.api, this.target);
				},


				prepare: function() {
					var regions = this.dnd.regions.get();

					var ret = [];

					for (var key in regions) {
						var dnd = $(regions[key]).data('dnd')[this.dnd.namespace()];

						if (this.dnd === dnd) continue;

						ret.push({
							dnd: dnd,
							rect: dnd.$el.dndClientRect()
						});
					}

					return ret;

				},

				begin: function(event) {


					this.addToTargets();

					this.event = event;

					this.started = false;

					// angular.element(document.body).dndDisableSelection();
				},

				progress: function(event) {

					this.event = event;

					if (!this.started) this.start();

					this.dnd.trigger('drag', this.api);

					var axis = this.api.getAxis(),
						x = axis.left,
						y = axis.top,
						offset = this.api.offset(),
						asPoint = this.api.asPoint();

					for (var i = 0; i < this.regions.length; i++) {
						var region = this.regions[i];

						var trigger = asPoint ?
							(x > region.rect.left) && (x < region.rect.left + region.rect.width) && (y > region.rect.top) && (y < region.rect.top + region.rect.height) :
							(x - offset.right > region.rect.left) && (x - offset.left < region.rect.left + region.rect.width) && (y - offset.bottom > region.rect.top) && (y - offset.top < region.rect.top + region.rect.height);

						if (trigger) {

							if (this.target !== region.dnd.el) {
								this.target = region.dnd.el;
								region.dnd.trigger('dragenter', this.api, this.dnd.el);
							} else region.dnd.trigger('dragover', this.api, this.dnd.el);

						} else if (this.target === region.dnd.el) {
							$(this.target).data('dnd')[this.dnd.namespace()].trigger('dragleave', this.api, this.dnd.el);
							this.target = false;
						}
					}
				},

				end: function(event) {
					this.event = event;

					if (this.started) this.stop();

					// angular.element(document.body).dndEnableSelection();

					this.removeFromTargets();
				},
			};

			return Manipulator;
		})();

		function Mouse(dnd) {
			this.dnd = dnd;
			this.manipulator = new Manipulator(dnd);
			this.mousedown = proxy(this, this.mousedown);
			this.mousemove = proxy(this, this.mousemove);
			this.mouseup = proxy(this, this.mouseup);
			this.manipulator.getClientAxis = this.getClientAxis;

			dnd.$el.on('mousedown', this.mousedown);
		}

		Mouse.prototype = {

			getClientAxis: function(event, s) {
				event = event ? event : this.event;

				return {
					top: event.clientY,
					left: event.clientX
				};
			},

			mousedown: function(event) {
				//event.preventDefault();

				this.manipulator.begin(event);

				$document.on('mousemove', this.mousemove);
				$document.on('mouseup', this.mouseup);
			},

			mousemove: function(event) {
				this.manipulator.progress(event);
			},

			mouseup: function(event) {
				this.manipulator.end(event);

				$document.off('mousemove', this.mousemove);
				$document.off('mouseup', this.mouseup);
			},

			destroy: function() {
				this.dnd.$el.off('mousedown', this.mousedown);
			},
		};


		function Touch(dnd, te) {
			this.te = te;
			this.manipulator = new Manipulator(dnd);
			this.touchstart = proxy(this, this.touchstart);
			this.touchmove = proxy(this, this.touchmove);
			this.touchend = proxy(this, this.touchend);
			this.manipulator.getClientAxis = this.getClientAxis;

			dnd.$el.on(this.te.start, this.touchstart);
		}

		Touch.prototype = {

			getClientAxis: function(event) {
				event = event ? event : this.event;
				event = event.originalEvent ? event.originalEvent : event;

				return {
					top: event.changedTouches[0].clientY,
					left: event.changedTouches[0].clientX
				};
			},

			touchstart: function(event) {
				this.manipulator.begin(event);

				$document.on(this.te.move, this.touchmove);
				$document.on(this.te.end + ' ' + this.te.cancel, this.touchend);

			},

			touchmove: function(event) {
				event.preventDefault();

				this.manipulator.progress(event);
			},

			touchend: function(event) {

				this.manipulator.end(event);

				$document.off(this.te.move, this.touchmove);
				$document.off(this.te.end + ' ' + this.te.cancel, this.touchend);
			},

			destroy: function() {
				this.dnd.$el.off(this.te.start, this.touchstart);
			}
		};

		/**
		 * @name angular.element.dndBind
		 *
		 * @description
		 * Аналог jQuery.fn.bind(), только для drag and drop событий
		 *
		 * События также могут быть в формате <namespace.event>,
		 * но в отличие от jQuery.fn.bind() в нашем случае namespace позволяет не только групировать обработчики,
		 * но также и отделять области для droppable и draggable элементов. Поясним.
		 * Дело в том, что при определении событий элемент не явным образом приписывается к определенной области видимости (namespace),
		 * причем один элемент может одновременно находится в нескольких областях.
		 * Это означает, что для того, чтобы на элемент срабатывали droppable события, он должен находится в namespace draggable элемента.
		 * По умолчанию, если namespace не задан в наименовании обаботчика события, то эта область именуется 'common',
		 * т.е. события drop и common.drop идентичны и находятся в одной и той же области
		 *
		 * ! Элемент не явным образом считается draggable-элементом, если у него задано одно или несколько событий dragstart, drag или dragend
		 * ! Элемент не явным образом считается droppable-элементом, если у него задано одно или несколько событий dragenter, dragover, dragleave или drop
		 *
		 * @param {object|string} event
		 * Если object, то необходимо описать пары <event name>:<callback function>.
		 * Если string, то определяется только <event name> причем возможно задать несколько событий через пробел, например <dragstart drag leftside.dragend>
		 * @param {function} handler
		 * Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
		 * @returns {object} angular.element object.
		 */

		$.prototype.dndBind = function(event, handler) {

			if (!this.length) return this;

			var opts = [],
				events, obj, namespace, self = this;

			if (typeof event === 'object') {
				obj = event;

				for (var key in obj) {
					events = key.replace(/\s+/g, ' ').split(' ');

					for (var i = 0; i < events.length; i++) {
						opts.push({
							event: events[i],
							handler: obj[key]
						});
					}
				}

			} else if (typeof event === 'string' && typeof handler === 'function') {
				events = event.trim().replace(/\s+/g, ' ').split(' ');

				for (var i = 0; i < events.length; i++) {
					opts.push({
						event: events[i],
						handler: handler
					});
				}

			} else return this;

			if (!opts.length) return this;

			forEach(this, function(element) {
				var data = $(element).data();

				if (!data.dnd) data.dnd = {};
				for (var i = 0; i < opts.length; i++) {
					event = opts[i].event
					handler = opts[i].handler;

					event = event.split('.');

					if (event[1] === undefined) {
						event[1] = event[0];
						event[0] = 'common';
					}

					namespace = event[0];
					event = event[1];

					if (!data.dnd[namespace]) data.dnd[namespace] = new Dnd(element, namespace);
					data.dnd[namespace].addListener(event, handler);
				}
			});

			return this;
		};


		/**
		 * @name angular.element.dndUnbind
		 *
		 * @description
		 * Аналог jQuery.fn.unbind(), только для drag and drop событий
		 *
		 * @param {(object=|string=)} arg1 Если не object и не string, то удаляются все обработчики с каждого слоя
		 * 		Если object, то будут удалены callbacks события которые заданы в виде ключа и
		 * @param {(function=|string=)} arg2
		 * 		Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
		 * 		Если arg1 это object, то arg2 это string которая определяет имя используемого слоя.
		 * @param {string=} arg3
		 * 		Если задан arg1 и arg2, то arg3 это string которая определяет имя используемого слоя
		 * @returns {object} angular.element object.
		 */

		$.prototype.dndUnbind = function() {

			var args = arguments,
				events = [],
				default_ns = 'common';

			if (!this.length) return this;

			if (typeof args[0] == 'string') {

				args[0] = args[0].trim().replace(/\s+/g, ' ').split(' ');

				if (typeof args[1] == 'function') {

					for (var i = 0; i < args[0].length; i++) {
						events.push({
							event: args[0][i],
							handler: args[1]
						});
					}

				} else {
					for (var i = 0; i < args[0].length; i++) {
						events.push({
							event: args[0][i]
						});
					}
				}

			} else if (typeof args[0] == 'object') {

				for (var key in args[0]) {
					if (args[0].hasOwnProperty(key)) {

						events.push({
							event: key.trim(),
							handler: args[0][key]
						});

					}
				}

			} else if (args.length !== 0) return this;

			forEach(this, function(element) {
				var data = $(element).data();

				if (!data.dnd) return;

				if (args.length === 0) {

					for (var key in data.dnd) {
						data.dnd[key].removeListener();
					}

				} else {

					for (var i = 0; i < events.length; i++) {
						var obj = events[i];

						obj.event = obj.event.split('.');

						if (obj.event[1] == undefined) {
							obj.event[1] = obj.event[0];
							obj.event[0] = default_ns;
						}

						if (obj.event[0] == '*') {
							for (var key in data.dnd) {
								data.dnd[key].removeListener(obj.event[1]);
							}

						} else if (data.dnd[obj.event[0]]) {
							obj.handler ? data.dnd[obj.event[0]].removeListener(obj.event[1], obj.handler) : data.dnd[obj.event[0]].removeListener(obj.event[1]);
						}
					}
				}
			});

			return this;
		}

	})();



	/* DRAGGABLE DIRECTIVE: */

	// module.directive('dndDraggable', ['$timeout', '$parse',
	// 	function($timeout, $parse) {
	// 		return {
	// 			require: ['?dndRect', '?dndModel', '?^dndContainer'],
	// 			scope: true,
	// 			link: function(scope, $el, attrs, ctrls) {
	// 				var rect = ctrls[0],
	// 					model = ctrls[1],
	// 					container = ctrls[2] ? (ctrls[2].$element() === $el ? undefined : ctrls[2]) : undefined;

	// 				var defaults = {
	// 					ns: 'common',
	// 					useAsPoint: false
	// 				};

	// 				var getterDraggable = $parse(attrs.dndDraggable);
	// 				var opts = extend({}, defaults, $parse(attrs.dndDraggableOpts)(scope) || {});
	// 				var dragstartCallback = $parse(attrs.dndOnDragstart);
	// 				var dragCallback = $parse(attrs.dndOnDrag);
	// 				var dragendCallback = $parse(attrs.dndOnDragend);

	// 				function dragstart(api) {
	// 					var local = api.draglocal = {};
	// 					local.draggable = getterDraggable(scope);
	// 					local.draggable = local.draggable === undefined ? true : local.draggable;

	// 					if (!local.draggable) api.unTarget();

	// 					if (!api.isTarget()) return;

	// 					local.started = true;

	// 					local.pos = $el.dndStyleRect();

	// 					api.useAsPoint(opts.useAsPoint);

	// 					var axis = api.getAxis(),
	// 						offset = {},
	// 						crect = $el.dndClientRect();
	// 					offset.top = axis.top - crect.top;
	// 					offset.left = axis.left - crect.left;
	// 					offset.bottom = offset.top - crect.height;
	// 					offset.right = offset.left - crect.width;
	// 					api.offset(offset);

	// 					local.onscroll = function() {
	// 						api.container(container.getRect());
	// 					}

	// 					if (container) {
	// 						api.container(container.getRect());

	// 						local.$scrollarea = $el.dndGetParentScrollArea();

	// 						local.$scrollarea.on('scroll', local.onscroll);
	// 					}

	// 					local.startBorders = api.getBorders();

	// 					local.startAxis = Point(axis.left - local.startBorders.left, axis.top - local.startBorders.top);

	// 					api.dragmodel = model ? model.get() : model;

	// 					scope.$dragged = true;

	// 					scope.$dropmodel = api.dropmodel;

	// 					dragstartCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function drag(api) {
	// 					var local = api.draglocal;

	// 					if (!local.started) return;

	// 					var axis = api.getAxis();

	// 					var borders = api.getBorders();

	// 					var subtract = Point(axis.left - borders.left, axis.top - borders.top).subtract(local.startAxis);

	// 					var position = {
	// 						top: local.pos.top + subtract.y,
	// 						left: local.pos.left + subtract.x
	// 					};

	// 					rect ? rect.update(position) : $el.dndCss(position);

	// 					scope.$dropmodel = api.dropmodel;

	// 					dragCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function dragend(api) {
	// 					var local = api.draglocal;

	// 					if (!local.started) return;

	// 					if (container) local.$scrollarea.off('scroll', local.onscroll);

	// 					scope.$dropmodel = api.dropmodel;

	// 					dragendCallback(scope);

	// 					$timeout(function() {
	// 						scope.$dragged = false;
	// 						scope.$dropmodel = undefined;
	// 					});
	// 				}



	// 				var cssPosition = $el.dndCss('position');

	// 				if (cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
	// 					cssPosition = 'relative';
	// 					$el.dndCss('position', cssPosition);
	// 				}

	// 				scope.$dragged = false;

	// 				var bindings = {};

	// 				bindings[opts.ns + '.dragstart'] = dragstart;
	// 				bindings[opts.ns + '.drag'] = drag;
	// 				bindings[opts.ns + '.dragend'] = dragend;

	// 				$el.dndBind(bindings);

	// 			}
	// 		};
	// 	}
	// ]);


	/* DROPPABLE DIRECTIVE: */

	// module.directive('dndDroppable', ['$parse', '$timeout',
	// 	function($parse, $timeout) {
	// 		return {
	// 			require: '?dndModel',
	// 			link: function(scope, $el, attrs, model) {

	// 				var defaults = {
	// 					ns: 'common'
	// 				};

	// 				var getterDroppable = $parse(attrs.dndDroppable);
	// 				var opts = extend({}, defaults, $parse(attrs.dndDroppableOpts)(scope) || {});
	// 				var dragenterCallback = $parse(attrs.dndOnDragenter);
	// 				var dragoverCallback = $parse(attrs.dndOnDragover);
	// 				var dragleaveCallback = $parse(attrs.dndOnDragleave);
	// 				var dropCallback = $parse(attrs.dndOnDrop);

	// 				function dragenter(api) {
	// 					var local = api.droplocal = {};

	// 					local.droppable = getterDroppable(scope);
	// 					local.droppable = local.droppable === undefined ? true : local.droppable;

	// 					if (!local.droppable) return;

	// 					api.dropmodel = model ? model.get() : model;

	// 					scope.$dragmodel = api.dragmodel;

	// 					dragenterCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function dragover(api) {
	// 					var local = api.droplocal;

	// 					if (!local.droppable) return;

	// 					scope.$dragmodel = api.dragmodel;

	// 					dragoverCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function dragleave(api) {
	// 					var local = api.droplocal;

	// 					if (!local.droppable) return;

	// 					api.dropmodel = undefined;

	// 					scope.$dragmodel = api.dragmodel;
	// 					dragleaveCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function drop(api) {
	// 					scope.$dragmodel = api.dragmodel;

	// 					dropCallback(scope);

	// 					$timeout(function() {
	// 						scope.$dragmodel = undefined;
	// 					});
	// 				}


	// 				var bindings = {};

	// 				bindings[opts.ns + '.dragenter'] = dragenter;
	// 				bindings[opts.ns + '.dragover'] = dragover;
	// 				bindings[opts.ns + '.dragleave'] = dragleave;
	// 				bindings[opts.ns + '.drop'] = drop;

	// 				$el.dndBind(bindings);

	// 			}
	// 		};
	// 	}
	// ]);


	/* RESIZABLE DIRECTIVE: */

	module.directive('dndResizable', ['$parse', '$timeout',
		function($parse, $timeout) {

			function createHandleElement(side) {
				return angular.element('<div></div>').addClass('angular-dnd-resizable-handle angular-dnd-resizable-handle-' + side);
			};

			function getCenterPoint(rect, scale) {
				scale = typeof scale == 'object' ? scale : {
					x: 1,
					y: 1
				};

				return Point(rect.left + rect.width * scale.x / 2, rect.top + rect.height * scale.y / 2);
			};

			return {
				require: ['?dndRect', '?^dndContainer'],
				// scope: true,
				link: function(scope, $el, attrs, ctrls) {
					var rect = ctrls[0],
						container = ctrls[1] ? (ctrls[1].$element() === $el ? undefined : ctrls[1]) : undefined;

					var defaults = {
						handles: 'ne, se, sw, nw, n, e, s, w',
						// handles: 'se',
						minWidth: 20,
						minHeight: 20,
						maxWidth: 10000,
						maxHeight: 10000
					};

					// if (attrs.resizeHandles)
					// 	defaults.handles = attrs.resizeHandles

					var getterResizable = $parse(attrs.dndResizable);
					var opts = extend({}, defaults, $parse(attrs.dndResizableOpts)(scope) || {});
					var dragstartCallback = $parse(attrs.dndOnResizestart);
					var dragCallback = $parse(attrs.dndOnResize);
					var dragendCallback = $parse(attrs.dndOnResizeend);
					var contaierRef = new Object();

					if (!attrs.resizeHandles)
						return ;
					scope.$watch(attrs.resizeHandles, function(newVal) {

						if (newVal) {
							angular.element(".angular-dnd-resizable-handle").remove();
							for (var i = 0; i < newVal.length; i++) {
								var newHandler = createHandleElement(newVal[i]);
								if (newVal[i] == 'e' || newVal[i] == 'w') {
									var containerHeight = scope.$eval(attrs.resizeContainerHeightPx);
									var handlerTopPx = containerHeight / 2 - 3.5;
									var handlerTopPercent = handlerTopPx / containerHeight * 100 + '%';
									newHandler.css('top', handlerTopPercent)
								}
								$el.append(newHandler.dndBind(getBindings(newVal[i])));
							}
						}
					});



					scope.$resized = false;

					function getBindings(side) {

						function dragstart(api) {
							dragstartCallback(scope);

							var local = api.local = {};

							local.resizable = getterResizable(scope);
							local.resizable = local.resizable === undefined ? true : local.resizable;

							if (!local.resizable) api.unTarget();

							if (!api.isTarget()) return;

							local.started = true;
							local.$parent = $el.parent();
							local.rads = $el.dndGetAngle();
							local.rotateMatrix = Matrix.IDENTITY.rotate(local.rads);
							local.inverseRotateMatrix = local.rotateMatrix.inverse();
							local.parentRect = local.$parent.dndClientRect();

							contaierRef = scope.$eval(attrs.resizeContainerRect);

							if (contaierRef){
								contaierRef.curWidth = parseFloat(contaierRef.width) * presentationObject.curWidth / 100;
								contaierRef.curHeight = parseFloat(contaierRef.height) * presentationObject.curHeight / 100;
							} else {
								contaierRef = new Object();
								contaierRef.curWidth = presentationObject.curWidth;
								contaierRef.curHeight = presentationObject.curHeight;
							}
							var axis = api.getAxis(),
								crect = $el.dndClientRect(),
								srect = local.rect = $el.dndStyleRect(contaierRef);

							local.onscroll = function() {
								api.container(container.getRect());
							}


							if (container) {
								api.container(container.getRect());

								local.$scrollarea = $el.dndGetParentScrollArea();

								local.$scrollarea.on('scroll', local.onscroll);
							}

							local.startBorders = api.getBorders();
							local.startAxis = Point(axis.left - local.startBorders.left, axis.top - local.startBorders.top);

							local.minScaleX = opts.minWidth / srect.width;
							local.minScaleY = opts.minHeight / srect.height;
							local.maxScaleX = opts.maxWidth / srect.width;
							local.maxScaleY = opts.maxHeight / srect.height;

							local.deltaX = crect.left - srect.left + crect.width / 2 - srect.width / 2;
							local.deltaY = crect.top - srect.top + crect.height / 2 - srect.height / 2;

							scope.$resized = true;



							scope.$apply();
						}

						function drag(api) {
							var local = api.local;


							if (!local.started) return;

							var axis = api.getAxis();
							var borders = api.getBorders();
							var vector = Point(axis.left - borders.left, axis.top - borders.top).subtract(local.startAxis).transform(local.inverseRotateMatrix);

							var scale = {
								x: 1,
								y: 1
							};

							var width = local.rect.width,
								height = local.rect.height,
								top = local.rect.top,
								left = local.rect.left

							switch (side) {
								case 'n':
									scale.y = (height - vector.y) / height;
									break;
								case 'e':
									scale.x = (width + vector.x) / width;
									break;
								case 's':
									scale.y = (height + vector.y) / height;
									break;
								case 'w':
									scale.x = (width - vector.x) / width;
									break;
								case 'ne':
									scale.x = (width + vector.x) / width;
									scale.y = (height - vector.y) / height;
									break;
								case 'se':
									scale.x = (width + vector.x) / width;
									scale.y = (height + vector.y) / height;
									break;
								case 'sw':
									scale.x = (width - vector.x) / width;
									scale.y = (height + vector.y) / height;
									break;
								case 'nw':
									scale.x = (width - vector.x) / width;
									scale.y = (height - vector.y) / height;
									break;
							};

							scale.x = getNumFromSegment(local.minScaleX, scale.x, local.maxScaleX);
							scale.y = getNumFromSegment(local.minScaleY, scale.y, local.maxScaleY);

							var offset;
							var center = getCenterPoint(local.rect);
							var scaledCenter = getCenterPoint(local.rect, scale);

							switch (side) {
								case 'n':
									offset = Point(left, top + height * scale.y).rotate(local.rads, scaledCenter).subtract(Point(left, top + height).rotate(local.rads, center));
									break;
								case 'e':
									offset = Point(left, top).rotate(local.rads, scaledCenter).subtract(Point(left, top).rotate(local.rads, center));
									break;
								case 's':
									offset = Point(left, top).rotate(local.rads, scaledCenter).subtract(Point(left, top).rotate(local.rads, center));
									break;
								case 'w':
									offset = Point(left + width * scale.x, top).rotate(local.rads, scaledCenter).subtract(Point(left + width, top).rotate(local.rads, center));
									break;
								case 'ne':
									offset = Point(left, top + height * scale.y).rotate(local.rads, scaledCenter).subtract(Point(left, top + height).rotate(local.rads, center));
									break;
								case 'se':
									offset = Point(left, top).rotate(local.rads, scaledCenter).subtract(Point(left, top).rotate(local.rads, center));
									break;
								case 'sw':
									offset = Point(left + width * scale.x, top).rotate(local.rads, scaledCenter).subtract(Point(left + width, top).rotate(local.rads, center));
									break;
								case 'nw':
									offset = Point(left + width * scale.x, top + height * scale.y).rotate(local.rads, scaledCenter).subtract(Point(left + width, top + height).rotate(local.rads, center));
									break;
							};

							var styles = {};
							styles.width = width * scale.x;
							styles.height = height * scale.y;
							styles.left = left - offset.x;
							styles.top = top - offset.y;

							var realCenter = Point(styles.left + local.deltaX + styles.width / 2, styles.top + local.deltaY + styles.height / 2);
							var boundedRect = Rect(styles.left + local.deltaX, styles.top + local.deltaY, styles.width, styles.height).applyMatrix(local.rotateMatrix, realCenter).client();

							if (boundedRect.left + 1 < local.startBorders.left || boundedRect.top + 1 < local.startBorders.top || boundedRect.right - 1 > local.startBorders.right || boundedRect.bottom - 1 > local.startBorders.bottom) return;

							if (rect) rect.update(styles);
							else $el.dndCss(styles);

							dragCallback(scope);

							scope.$apply();
						}

						function dragend(api) {
							var local = api.local;

							if (!local.started) return;

							if (container) local.$scrollarea.off('scroll', local.onscroll);

							dragendCallback(scope);


							$timeout(function() {
								scope.$resized = false;
							});
						}

						return {
							'$$resizable.dragstart': dragstart,
							'$$resizable.drag': drag,
							'$$resizable.dragend': dragend
						};

					}

					var cssPosition = $el.dndCss('position');

					if (cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
						cssPosition = 'absolute';
						$el.dndCss('position', cssPosition);
					}
				}
			};
		}
	]);

	/* ROTATABLE DIRECTIVE*/

	// module.directive('dndRotatable', ['$parse', '$timeout',
	// 	function($parse, $timeout) {
	// 		return {
	// 			require: ['?dndRect', '?^dndContainer'],
	// 			scope: true,
	// 			link: function(scope, $el, attrs, ctrls) {
	// 				var rect = ctrls[0],
	// 					container = ctrls[1] ? (ctrls[1].$element() === $el ? undefined : ctrls[1]) : undefined;

	// 				var defaults = {
	// 					step: 5
	// 				};

	// 				var getterRotatable = $parse(attrs.dndRotatable);
	// 				var opts = extend({}, defaults, $parse(attrs.dndRotatableOpts)(scope) || {});
	// 				var dragstartCallback = $parse(attrs.dndOnRotatestart);
	// 				var dragCallback = $parse(attrs.dndOnRotate);
	// 				var dragendCallback = $parse(attrs.dndOnRotateend);

	// 				var cssPosition = $el.dndCss('position');

	// 				if (cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
	// 					cssPosition = 'relative';
	// 					$el.dndCss('position', cssPosition);
	// 				}

	// 				var handle = angular.element('<div class = "angular-dnd-rotatable-handle"></div>');

	// 				$el.append(handle);

	// 				function dragstart(api, target) {
	// 					var local = api.local = {};

	// 					local.rotatable = getterRotatable(scope);
	// 					local.rotatable = local.rotatable === undefined ? true : local.rotatable;

	// 					if (!local.rotatable) api.unTarget();

	// 					if (!api.isTarget()) return;

	// 					local.started = true;

	// 					var axis = api.getAxis(),
	// 						crect = $el.dndClientRect();

	// 					local.srect = $el.dndStyleRect();

	// 					local.currAngle = $el.dndGetAngle();
	// 					local.startPoint = Point(axis);

	// 					if (container) api.container(container.getRect());

	// 					local.borders = api.getBorders();

	// 					local.center = Point(crect.left + crect.width / 2, crect.top + crect.height / 2);

	// 					scope.$rotated = true;

	// 					dragstartCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function drag(api, target) {
	// 					var local = api.local;

	// 					if (!local.started) return;

	// 					var axis = api.getAxis();
	// 					var angle = Point(axis).deltaAngle(local.startPoint, local.center);
	// 					var degs = radToDeg(local.currAngle + angle);


	// 					degs = Math.round(degs / opts.step) * opts.step;
	// 					var rads = degToRad(degs);
	// 					var matrix = Matrix().rotate(rads);

	// 					var compute = Rect(local.center.x - local.srect.width / 2, local.center.y - local.srect.height / 2, local.srect.width, local.srect.height).applyMatrix(matrix, local.center).client();

	// 					if (compute.left < local.borders.left - 1 || compute.top < local.borders.top - 1 || (compute.left + compute.width) > local.borders.right + 1 || (compute.top + compute.height) > local.borders.bottom + 1) return;

	// 					if (rect) rect.update('transform', matrix.toStyle());
	// 					else $el.dndCss('transform', matrix.toStyle());

	// 					dragCallback(scope);

	// 					scope.$apply();
	// 				}

	// 				function dragend(api) {
	// 					var local = api.local;

	// 					if (!local.started) return;

	// 					dragendCallback(scope);

	// 					$timeout(function() {
	// 						scope.$rotated = false
	// 					});
	// 				}

	// 				scope.$rotated = false;

	// 				var bindings = {
	// 					'$$rotatable.dragstart': dragstart,
	// 					'$$rotatable.drag': drag,
	// 					'$$rotatable.dragend': dragend
	// 				};

	// 				handle.dndBind(bindings);

	// 			}
	// 		};
	// 	}
	// ]);


	/* LASSO CLASS: */

	module.factory('DndLasso', [

		function() {

			var $div = $('<div></div>').dndCss({
				position: 'absolute'
			});

			var defaults = {
				className: 'angular-dnd-lasso',
				container: 'body',
				offsetX: 0,
				offsetY: 0
			};

			function Handler(local) {

				this.getRect = function() {
					return this.isActive ? local.rect : undefined;
				}

				this.getClientRect = function() {
					return this.isActive ? $div.dndClientRect() : undefined;
				}

				this.isActive = function() {
					return local.active;
				}
			}

			function Local(api) {
				var isTarget = api.isTarget(),
					handler = new Handler(this);

				this.isTarget = function() {
					return isTarget;
				}

				this.handler = function() {
					return handler;
				}

				this.getEvent = function() {
					return api.getEvent();
				}
			}

			function Lasso(opts) {
				var self = this;

				opts = extend({}, defaults, opts);

				function dragstart(api) {


					var local = api.local = new Local(api);

					if (!local.isTarget()) {
						self.trigger('start', local.handler());
						return;
					}

					local.active = true;

					self.trigger('start', local.handler());

					local.startAxis = api.getAxis();

					$div.removeAttr('class style').removeClass('ng-hide').addClass(opts.className);

					opts.$el.append($div);

					var $container = opts.$el,
						crect = $container.dndClientRect();

					api.container(crect);



				};

				function drag(api) {
					// angular.element(document.body).dndDisableSelection();
					if (!opts.scope.$eval(opts.attrs.dndLassoArea)) {
						return;
					}

					var local = api.local;

					if (!local.active) {
						self.trigger('drag', local.handler());
						return;
					}

					var axis = api.getAxis();
					var areaRect = opts.$el.dndClientRect();

					var changeTop = axis.top - local.startAxis.top;
					var changeLeft = axis.left - local.startAxis.left;

					var rect = {
						top: local.startAxis.top - areaRect.top,
						left: local.startAxis.left - areaRect.left,
						width: changeLeft,
						height: changeTop
					};

					if (rect.width < 0) {
						rect.width = -rect.width;
						rect.left = rect.left - rect.width;
					}

					if (rect.height < 0) {
						rect.height = -rect.height;
						rect.top = rect.top - rect.height;
					}

					local.rect = rect;

					rect.top = rect.top + opts.offsetY;
					rect.left = rect.left + opts.offsetX;

					$div.dndCss(rect);

					self.trigger('drag', local.handler());
				};

				function dragend(api) {


					var local = api.local;

					if (!local.active) {
						self.trigger('end', local.handler());
						return;
					}

					$div.addClass('ng-hide');

					$(document.body).append($div);

					self.trigger('end', local.handler());
				};

					

				var bindings = {
					'$$lasso.dragstart': dragstart,
					'$$lasso.drag': drag,
					'$$lasso.dragend': dragend
				};

				if (opts.scope.$eval(opts.attrs.dndLassoArea)) {
					
				}

				this.bind = function (){
					opts.$el.dndBind(bindings);
				}();

				this.destroy = function() {
					opts.$el.dndUnbind();
				};

				var events = {};

				this.on = function(name, fn) {
					events[name] = events[name] || [];
					events[name].push(fn);
				};

				this.trigger = function(name, args) {
					events[name] = events[name] || [];
					args = args || typeof args === 'string' ? [args] : [];
					events[name].forEach(function(fn) {
						fn.apply(this, args);
					});
				}
			}

			return Lasso;
		}
	]);



	/* LASSO AREA DIRECTIVE: */

	module.directive('dndLassoArea', ['DndLasso', '$parse', '$timeout', 'dndKey',
		function(DndLasso, $parse, $timeout, dndKey) {

			Controller.$inject = [];

			function Controller() {
				var ctrls = [],
					data = {};

				this.data = function() {
					return data;
				};

				this.add = function(ctrl) {
					ctrls.push(ctrl);
				};

				this.remove = function(ctrl) {
					for (var i = 0; i < ctrls.length; i++) {
						if (ctrls[i] === ctrl) {
							ctrls.splice(i, 1);
							return true;
						}
					}

					return false;
				};

				this.getSelectable = function(element) {
					for (var i = 0; i < ctrls.length; i++) {
						if (ctrls[i].getElement()[0] == element) return ctrls[i];
					}

					return undefined;
				};

				this.empty = function() {
					return !ctrls.length;
				};

				this.get = function(i) {
					return i === undefined ? ctrls : ctrls[i];
				}
			}

			var ctrls = [];

			ctrls.remove = function(ctrl) {
				for (var i = 0; i < this.length; i++) {
					if (this[i] === ctrl) {
						this.splice(i, 1);
						return true;
					}
				}

				return false;
			}

			return {
				restrict: 'A',
				controller: Controller,
				require: 'dndLassoArea',
				/* отрицательный приоритет необходим для того, что бы post link function dnd-lasso-area запускался раньше post link function ng-click */
				priority: -1,
				link: function(scope, $el, attrs, ctrl) {

					var defaults = {
						//clickReseting: true,
						selectAdditionals: true,
					};

					var getterLassoArea = $parse(attrs.dndLassoArea);
					var lasso;
					scope.$watch(attrs.dndLassoArea, function(newVal) {

						//alert(newVal)
						//$el.off('click', elClick );
						if (newVal) {
							$el.on('click', elClick);
								lasso = new DndLasso({
									$el: $el,
									attrs: attrs,
									scope: scope
								}), selectable, keyPressed;

								lasso.on('start', onStart);
								lasso.on('drag', onDrag);
								lasso.on('end', onEnd);

						} else {
							$el.off('click', elClick);
							lasso.destroy();
						}
					});

					var opts = extend({}, defaults, $parse(attrs.dndLassoAreaOpts)(scope) || {});
					var dragstartCallback = $parse(attrs.dndLassoOnstart);
					var dragCallback = $parse(attrs.dndLassoOndrag);
					var dragendCallback = $parse(attrs.dndLassoOnend);
					var clickCallback = $parse(attrs.dndLassoOnclick);
					var lasso = new DndLasso({
							$el: $el,
							attrs: attrs,
							scope: scope
						}),
						selectable, keyPressed;
					lasso.destroy();

					ctrls.push(ctrl);

					function onClick(event) {

						if (!ctrl.empty()) {
							if (keyPressed) {
								selectable.toggleSelected();
								return
							}

							var s = ctrl.get();

							for (var i = 0; i < s.length; i++) {
								s[i].unselected().unselecting();
							}

							if (selectable) selectable.selected();

						}
						//clickCallback( scope, {$event: event});

						scope.$apply();
					}

					function onStart(handler) {
						scope.$dragged = true;

						if (!handler.isActive()) return;

						dragstartCallback(scope);

						if (!ctrl.empty() && !keyPressed) {

							var s = ctrl.get();

							for (var i = 0; i < s.length; i++) {
								s[i].unselected().unselecting();
							}

						}


						scope.$apply();
					}

					function onDrag(handler) {

						scope.$dragged = true;

						if (!handler.isActive()) return;

						if (!ctrl.empty()) {
							var s = ctrl.get(),
								rect = handler.getClientRect();

							for (var i = 0; i < s.length; i++) {
								s[i].hit(rect) ? s[i].selecting() : s[i].unselecting();
							}
						}

						dragCallback(scope, {
							$rect: handler.getRect()
						});

						scope.$apply();

					}

					function onEnd(handler) {

						if (!handler.isActive()) return;

						var s = ctrl.get();

						if (!ctrl.empty()) {

							for (var i = 0; i < s.length; i++) {
								if (s[i].isSelecting()) s[i].toggleSelected();
							}

							scope.$apply();
						}

						dragendCallback(scope, {
							$rect: handler.getRect()
						});

						if (!ctrl.empty()) {

							for (var i = 0; i < s.length; i++) {
								s[i].unselecting();
							}

							scope.$apply();
						}

						/* что бы события click/dblclick получили флаг $dragged === true, переключение флага происходит после их выполнения */
						$timeout(function() {
							scope.$dragged = false;
						});
					}

					$el.on('mousedown touchstart', throttle(function (event){
						//alert('md')
						scope.$dragged = false;

						//scope.$keypressed = keyPressed = ( dndKey.isset(16) || dndKey.isset(17) || dndKey.isset(18) );
						scope.$keypressed = keyPressed = opts.selectAdditionals ? ( event.shiftKey || event.ctrlKey || event.metaKey ) : false;

						if(!ctrl.empty()) {
							selectable = ctrl.getSelectable(event.target);
						}

						scope.$apply();

					}, 300) );
			
					function elClick(event) {

						if (!scope.$dragged) onClick(event);

						/* что бы события dnd-on-* получили флаг $keypressed, переключение флага происходит после их выполнения */
						if (scope.$keypressed) $timeout(function() {
							scope.$keypressed = false;
						});
					}

					$el.on('$destroy', function() {
						ctrls.remove(ctrl);

						scope.$apply();
					});

					scope.$dragged = false;
				}
			};
		}
	]);



	/* SELECTABLE DIRECTIVE: */

	module.directive('dndSelectable', ['$parse',
		function($parse) {

			var defaults = {};

			Controller.$inject = ['$scope', '$attrs', '$element'];

			function Controller($scope, $attrs, $element) {
				var getterSelecting = $parse($attrs.dndModelSelecting),
					setterSelecting = getterSelecting.assign || noop;
				var getterSelected = $parse($attrs.dndModelSelected),
					setterSelected = getterSelected.assign || noop;
				var getterSelectable = $parse($attrs.dndSelectable),
					setterSelectable = getterSelectable.assign || noop;
				var onSelected = $parse($attrs.dndOnSelected);
				var onUnselected = $parse($attrs.dndOnUnselected);
				var onSelecting = $parse($attrs.dndOnSelecting);
				var onUnselecting = $parse($attrs.dndOnUnselecting);



				setterSelected($scope, false);
				setterSelecting($scope, false);

				this.getElement = function() {
					return $element;
				};

				this.isSelected = function() {
					return getterSelected($scope);
				};

				this.isSelecting = function() {
					return getterSelecting($scope);
				};

				this.isSelectable = function() {
					var selectable = getterSelectable($scope);
					return selectable === undefined || selectable;
				};

				this.toggleSelected = function(val) {
					val = val === undefined ? !this.isSelected() : val;

					return val ? this.selected() : this.unselected();
				};

				this.selecting = function() {
					if (this.isSelectable() && onSelecting($scope) !== false) setterSelecting($scope, true);

					return this;
				};

				this.unselecting = function() {
					if (this.isSelectable() && (onUnselecting($scope) !== false)) setterSelecting($scope, false);

					return this;
				};

				this.selected = function() {
					if (this.isSelectable() && onSelected($scope) !== false) setterSelected($scope, true);

					return this;
				};

				this.unselected = function() {
					if (this.isSelectable() && (onUnselecting($scope) !== false)) setterSelected($scope, false);

					return this;
				};

				this.hit = function(a) {
					var b = this.rectCtrl.getClient();

					for (var key in b) {
						b[key] = parseFloat(b[key]);
					}

					b.bottom = b.bottom == undefined ? b.top + b.height : b.bottom;
					b.right = b.right == undefined ? b.left + b.width : b.right;
					a.bottom = a.bottom == undefined ? a.top + a.height : a.bottom;
					a.right = a.right == undefined ? a.left + a.width : a.right;

					return (
						a.top <= b.top && b.top <= a.bottom && (a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right) ||
						a.top <= b.bottom && b.bottom <= a.bottom && (a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right) ||
						a.left >= b.left && a.right <= b.right && (b.top <= a.bottom && a.bottom <= b.bottom || b.bottom >= a.top && a.top >= b.top || a.top <= b.top && a.bottom >= b.bottom) ||
						a.top >= b.top && a.bottom <= b.bottom && (b.left <= a.right && a.right <= b.right || b.right >= a.left && a.left >= b.left || a.left <= b.left && a.right >= b.right) ||
						a.top >= b.top && a.right <= b.right && a.bottom <= b.bottom && a.left >= b.left
					);
				};

			}

			function LikeRectCtrl($element) {
				this.$element = $element;
			}

			LikeRectCtrl.prototype = {
				getClient: function() {
					return this.$element.dndClientRect();
				}
			};

			return {
				restrict: 'A',
				require: ['dndSelectable', '^dndLassoArea', '?dndRect'],
				controller: Controller,
				scope: true,
				link: function(scope, $el, attrs, ctrls) {
					scope.$dndSelectable = ctrls[0];

					var rectCtrl = ctrls[2];

					ctrls[0].rectCtrl = rectCtrl ? rectCtrl : new LikeRectCtrl($el);

					ctrls[1].add(ctrls[0]);

					function ondestroy() {
						ctrls[1].remove(ctrls[0]);

						if (!scope.$$phase) scope.$apply();
					}

					$el.on('$destroy', ondestroy);

					var selected = $parse(attrs.dndOnSelected);
					var unselected = $parse(attrs.dndOnUnselected);
					var selecting = $parse(attrs.dndOnSelecting);
					var unselecting = $parse(attrs.dndOnUnselecting);

					if (selected || unselected) {
						selected = selected || noop;
						unselected = unselected || noop;

						scope.$watch(attrs.dndModelSelected, function(n, o) {
							if (n === undefined || o === undefined || n === o) return;

							n ? selected(scope) : unselected(scope);
						});
					}


					if (selecting || unselecting) {
						selecting = selecting || noop;
						unselecting = unselecting || noop;

						scope.$watch(attrs.dndModelSelecting, function(n, o) {
							if (n === undefined || o === undefined || n === o) return;

							n ? selecting(scope) : unselecting(scope);
						});
					}
				}
			};
		}
	]);

	/* DND-MODEL */

	module.directive('dndModel', ['$parse',
		function($parse) {

			Controller.$inject = ['$scope', '$attrs'];

			function Controller($scope, $attrs) {
				var getter = $parse($attrs.dndModel),
					setter = getter.assign

				this.set = function(value) {
					setter($scope, value);
				};

				this.get = function() {
					return getter($scope);
				};
			}

			return {
				restrict: 'A',
				controller: Controller
			}
		}
	]);

	/* DND-CONTAINER */

	module.directive('dndContainer', ['$parse',
		function($parse) {

			Controller.$inject = ['$element'];

			function Controller($element) {
				this.getRect = function() {
					return extend({}, $element.dndClientRect());
				};

				this.$element = function() {
					return $element;
				}
			}

			return {
				restrict: 'CA',
				controller: Controller,
			}
		}
	]);

	module.factory('dndKey', ['$rootScope',
		function($rootScope) {
			var keys = [];

			function DndKey() {

			};

			DndKey.prototype = {
				get: function() {
					return keys;
				},
				isset: function(code) {
					var index = keys.indexOf(code);
					return (index !== -1);
				}
			};

			function keydown(event) {
				var code = event.keyCode;
				debounceKeyup(event);
				if (keys.indexOf(code) > -1) return;

				keys.push(code);
				$rootScope.$digest();
			}

			function keyup(event) {
				var code = event.keyCode,
					index = keys.indexOf(code);
				if (index === -1) return;

				keys.splice(index, 1);
				$rootScope.$digest();
			};



			var debounceKeyup = debounce(keyup, 1000);
			$document.on('keydown', keydown);
			$document.on('keyup', keyup);

			return new DndKey;
		}
	]);

	/* DND-KEY-MODEL */

	module.directive('dndKeyModel', ['$parse', 'dndKey',
		function($parse, dndKey) {
			return {
				restrict: 'A',
				link: function(scope, $el, attrs) {
					var getter = $parse(attrs.dndKeyModel),
						setter = getter.assign;

					scope.$watch(function() {
						return dndKey.get()
					}, function(n, o) {
						if (n === undefined) return;
						setter(scope, n);
					});
				}
			}
		}
	]);


	/* RECTANGLE DIRECTIVE: */

	module.directive('dndRect', ['$parse',
		function($parse) {
			var setStyles = ['top', 'left', 'width', 'height', 'transform'];
			var getStyles = ['top', 'left', 'width', 'height', TRANSFORM];

			setStyles.has = function(val) {
				return this.indexOf(val) > -1;
			}

			Controller.$inject = ['$scope', '$attrs', '$element'];

			function Controller($scope, $attrs, $element) {
				var getter = $parse($attrs.dndRect),
					setter = getter.assign,
					lastRect;

				this.update = function(prop, value) {
					var values, rect = getter($scope) || {};

					if (typeof prop != 'object') {
						values = {};
						values[prop] = value;
					} else values = prop;

					for (var i = 0; i < setStyles.length; i++) {
						var style = setStyles[i];

						if (values[style] !== undefined) rect[style] = values[style];
					}

					setter($scope, rect);
				};

				this.get = function() {
					return getter($scope);
				};

				this.getClient = function() {
					return $element.dndClientRect();
				};

				function sanitize(rect) {
					var css;

					rect = typeof rect == 'object' ? rect : {};

					for (var i = 0; i < setStyles.length; i++) {

						var style = setStyles[i];

						if (rect[style] !== undefined) continue;

						if (!css) css = $element.dndCss(getStyles);

						rect[style] = style == 'transform' ? (css[TRANSFORM] == 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : css[TRANSFORM]) : css[style];
					}

					for (var key in rect) {
						rect[key.toLowerCase()] = rect[key];
					}

					for (var key in rect) {
						if (setStyles.has(key)) {
							if (typeof rect[key] === 'number') rect[key] = rect[key] + 'px';
						} else delete rect[key];
					}

					return rect;
				};

				$scope.$parent.$watch(function() {
					var rect = getter($scope.$parent);

					if (rect !== lastRect) setter($scope, rect);
				});

				$scope.$watch($attrs.dndRect, function(n, o) {
					if (!n || typeof n != 'object') return;
					if (o == undefined) o = {};

					var lastRect = n = sanitize(n);

					var css = {};

					for (var val, i = 0; i < setStyles.length; i++) {
						val = setStyles[i];

						if (n[val] == undefined && o[val] != undefined) css[val] = '';
						else if (n[val] != undefined) css[val] = n[val];
					}

					if (css.transform) css[TRANSFORM] = css.transform;
					$element.dndCss(css);

				}, true);
			}



			return {
				restrict: 'A',
				controller: Controller
			};
		}
	]);



	/* FITTEXT DIRECTIVE: */

	/**
	 * @name dnd.fittext
	 *
	 * @description
	 * Отличная функция для подгонки текста под размер блока, в котором этот текст находится.
	 * за единственный аргумент функция принимает объект rect, содержащий в себе ширину (width) и высоту (height) элемента.
	 * На основе этих параметров идет расчет высоты шрифта.
	 * Также у директвы есть дополнительные атрибуты-настройки: dnd-fittext-max и dnd-fittext-min,
	 * которые позволяют задать максимальное и минимальное соответственно значение шрифта.
	 *
	 */

	// module.directive('dndFittext', ['$timeout', '$window',
	// 	function($timeout, $window) {
	// 		var $span = $('<span></span>').dndCss({
	// 			'position': 'absolute',
	// 			'left': -99999,
	// 			'top': -99999,
	// 			'opacity': 0,
	// 			'z-index': -9999
	// 		});

	// 		$(document.body).append($span);

	// 		function encodeStr(val) {
	// 			var val = $span.text(val).html().replace(/\s+/g, ' ')
	// 			if ($span[0].tagName == 'INPUT' || $span[0].tagName == 'TEXTAREA') val = val.replace(/\s/g, '&nbsp;');

	// 			return val;
	// 		}

	// 		function getRealSize(text, font) {
	// 			$span.html(encodeStr(text)).dndCss(font);
	// 			var rect = $span[0].getBoundingClientRect();

	// 			return {
	// 				width: parseFloat(rect.width),
	// 				height: parseFloat(rect.height)
	// 			}
	// 		}

	// 		function getCurrSize($el, offsetWidthPrct, offsetHeightPrct) {
	// 			var rect = $el[0].getBoundingClientRect();

	// 			return {
	// 				width: parseFloat(rect.width) * (100 - offsetWidthPrct) / 100,
	// 				height: parseFloat(rect.height) * (100 - offsetHeightPrct) / 100
	// 			}
	// 		}

	// 		return {
	// 			restrict: 'A',
	// 			link: function(scope, $el, attrs) {

	// 				function updateSize(opts) {
	// 					opts = opts === undefined ? {} : opts;
	// 					var font = $el.dndCss(
	// 							['font-size', 'font-family', 'font-weight', 'text-transform', 'border-top', 'border-right', 'border-bottom', 'border-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left']
	// 						),
	// 						text = opts.text == undefined ? $el.text() : opts.text;

	// 					var sizes = [];
	// 					if (opts.width === undefined) sizes.push('width');
	// 					if (opts.height === undefined) sizes.push('height');

	// 					if (sizes) sizes = $el.dndCss(sizes);

	// 					for (var key in sizes) {
	// 						var val = sizes[key];

	// 						if (val[val.length - 1] == '%') return;
	// 						opts[key] = sizes[key];
	// 					}

	// 					var realSize = getRealSize(text, font),
	// 						currSize = getCurrSize($el, 0, 0);
	// 					if (!realSize.width || !realSize.height) {
	// 						$el.dndCss('font-size', '');
	// 						return
	// 					}

	// 					currSize.width = parseFloat(opts.width);
	// 					currSize.height = parseFloat(opts.height);

	// 					var kof1 = currSize.height / realSize.height;
	// 					var kof2 = currSize.width / realSize.width;

	// 					var max = scope.$eval(attrs.dndFittextMax);
	// 					var min = scope.$eval(attrs.dndFittextMin);

	// 					if (min == undefined) min = 0;
	// 					if (max == undefined) max = Number.POSITIVE_INFINITY;

	// 					var kof = (kof1 < kof2 ? kof1 : kof2);

	// 					//Корректировка плавности
	// 					kof *= 0.85;
	// 					if ((kof > 0.95 && kof <= 1) || (kof >= 1 && kof < 1.05)) return;

	// 					var n = kof * parseFloat(font['font-size']);

	// 					n = getNumFromSegment(min, n, max);

	// 					$el.dndCss('font-size', n + 'px');
	// 				}

	// 				scope.$watch(attrs.dndFittext, throttle(function(opts) {
	// 					updateSize(opts);
	// 				}), true);

	// 				$($window).on('resize', function() {
	// 					updateSize();
	// 				});
	// 			}
	// 		};
	// 	}
	// ]);


})(angular, undefined, window, document);