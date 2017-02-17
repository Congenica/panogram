import { $A, $H, $R, Prototype, Class, Enumerable } from "prototype";

String.prototype.parseColor = function() {
    var b;
    var a = "#";
    if (this.slice(0, 4) == "rgb(") {
        var c = this.slice(4, this.length - 1).split(",");
        b = 0;
        do {
            a += parseInt(c[b]).toColorPart();
        } while (++b < 3);
    } else {
        if (this.slice(0, 1) == "#") {
            if (this.length == 4) {
                for (b = 1; b < 4; b++) {
                    a += (this.charAt(b) + this.charAt(b)).toLowerCase();
                }
            }
            if (this.length == 7) {
                a = this.toLowerCase();
            }
        }
    }
    return (a.length == 7 ? a : (arguments[0] || this));
};
Element.collectTextNodes = function(a) {
    return $A($(a).childNodes).collect(function(b) {
        return (b.nodeType == 3 ? b.nodeValue : (b.hasChildNodes() ? Element.collectTextNodes(b) : ""));
    }).flatten().join("");
};
Element.collectTextNodesIgnoreClass = function(a, b) {
    return $A($(a).childNodes).collect(function(c) {
        return (c.nodeType == 3 ? c.nodeValue : ((c.hasChildNodes() && !Element.hasClassName(c, b)) ? Element.collectTextNodesIgnoreClass(c, b) : ""));
    }).flatten().join("");
};
Element.setContentZoom = function(a, b) {
    a = $(a);
    a.setStyle({
        fontSize: (b / 100) + "em"
    });
    if (Prototype.Browser.WebKit) {
        window.scrollBy(0, 0);
    }
    return a;
};
Element.getInlineOpacity = function(a) {
    return $(a).style.opacity || "";
};
Element.forceRerendering = function(a) {
    try {
        a = $(a);
        var c = document.createTextNode(" ");
        a.appendChild(c);
        a.removeChild(c);
    } catch (b) {}
};
var Effect = {
    _elementDoesNotExistError: {
        name: "ElementDoesNotExistError",
        message: "The specified DOM element does not exist, but is required for this effect to operate"
    },
    Transitions: {
        linear: Prototype.K,
        sinoidal: function(a) {
            return (-Math.cos(a * Math.PI) / 2) + 0.5;
        },
        reverse: function(a) {
            return 1 - a;
        },
        flicker: function(a) {
            a = ((-Math.cos(a * Math.PI) / 4) + 0.75) + Math.random() / 4;
            return a > 1 ? 1 : a;
        },
        wobble: function(a) {
            return (-Math.cos(a * Math.PI * (9 * a)) / 2) + 0.5;
        },
        pulse: function(b, a) {
            return (-Math.cos((b * ((a || 5) - 0.5) * 2) * Math.PI) / 2) + 0.5;
        },
        spring: function(a) {
            return 1 - (Math.cos(a * 4.5 * Math.PI) * Math.exp(-a * 6));
        },
        none: function(a) {
            return 0;
        },
        full: function(a) {
            return 1;
        }
    },
    DefaultOptions: {
        duration: 1,
        fps: 100,
        sync: false,
        from: 0,
        to: 1,
        delay: 0,
        queue: "parallel"
    },
    tagifyText: function(a) {
        var b = "position:relative";
        if (Prototype.Browser.IE) {
            b += ";zoom:1";
        }
        a = $(a);
        $A(a.childNodes).each(function(c) {
            if (c.nodeType == 3) {
                c.nodeValue.toArray().each(function(d) {
                    a.insertBefore(new Element("span", {
                        style: b
                    }).update(d == " " ? String.fromCharCode(160) : d), c);
                });
                Element.remove(c);
            }
        });
    },
    multiple: function(b, c) {
        var e;
        if (((typeof b == "object") || Object.isFunction(b)) && (b.length)) {
            e = b;
        } else {
            e = $(b).childNodes;
        }
        var a = Object.extend({
            speed: 0.1,
            delay: 0
        }, arguments[2] || {});
        var d = a.delay;
        $A(e).each(function(g, f) {
            new c(g, Object.extend(a, {
                delay: f * a.speed + d
            }));
        });
    },
    PAIRS: {
        slide: ["SlideDown", "SlideUp"],
        blind: ["BlindDown", "BlindUp"],
        appear: ["Appear", "Fade"]
    },
    toggle: function(b, c, a) {
        b = $(b);
        c = (c || "appear").toLowerCase();
        return Effect[Effect.PAIRS[c][b.visible() ? 1 : 0]](b, Object.extend({
            queue: {
                position: "end",
                scope: (b.id || "global"),
                limit: 1
            }
        }, a || {}));
    }
};
Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;
Effect.ScopedQueue = Class.create(Enumerable, {
    initialize: function() {
        this.effects = [];
        this.interval = null;
    },
    _each: function(a) {
        this.effects._each(a);
    },
    add: function(b) {
        var c = new Date().getTime();
        var a = Object.isString(b.options.queue) ? b.options.queue : b.options.queue.position;
        switch (a) {
        case "front":
            this.effects.findAll(function(d) {
                return d.state == "idle";
            }).each(function(d) {
                d.startOn += b.finishOn;
                d.finishOn += b.finishOn;
            });
            break;
        case "with-last":
            c = this.effects.pluck("startOn").max() || c;
            break;
        case "end":
            c = this.effects.pluck("finishOn").max() || c;
            break;
        }
        b.startOn += c;
        b.finishOn += c;
        if (!b.options.queue.limit || (this.effects.length < b.options.queue.limit)) {
            this.effects.push(b);
        }
        if (!this.interval) {
            this.interval = setInterval(this.loop.bind(this), 15);
        }
    },
    remove: function(a) {
        this.effects = this.effects.reject(function(b) {
            return b == a;
        });
        if (this.effects.length == 0) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },
    loop: function() {
        var c = new Date().getTime();
        for (var b = 0, a = this.effects.length; b < a; b++) {
            this.effects[b] && this.effects[b].loop(c);
        }
    }
});
Effect.Queues = {
    instances: $H(),
    get: function(a) {
        if (!Object.isString(a)) {
            return a;
        }
        return this.instances.get(a) || this.instances.set(a, new Effect.ScopedQueue());
    }
};
Effect.Queue = Effect.Queues.get("global");
Effect.Base = Class.create({
    position: null,
    start: function(a) {
        if (a && a.transition === false) {
            a.transition = Effect.Transitions.linear;
        }
        this.options = Object.extend(Object.extend({}, Effect.DefaultOptions), a || {});
        this.currentFrame = 0;
        this.state = "idle";
        this.startOn = this.options.delay * 1000;
        this.finishOn = this.startOn + (this.options.duration * 1000);
        this.fromToDelta = this.options.to - this.options.from;
        this.totalTime = this.finishOn - this.startOn;
        this.totalFrames = this.options.fps * this.options.duration;
        this.render = (function() {
            function b(d, c) {
                if (d.options[c + "Internal"]) {
                    d.options[c + "Internal"](d);
                }
                if (d.options[c]) {
                    d.options[c](d);
                }
            }
            return function(c) {
                if (this.state === "idle") {
                    this.state = "running";
                    b(this, "beforeSetup");
                    if (this.setup) {
                        this.setup();
                    }
                    b(this, "afterSetup");
                }
                if (this.state === "running") {
                    c = (this.options.transition(c) * this.fromToDelta) + this.options.from;
                    this.position = c;
                    b(this, "beforeUpdate");
                    if (this.update) {
                        this.update(c);
                    }
                    b(this, "afterUpdate");
                }
            };
        })();
        this.event("beforeStart");
        if (!this.options.sync) {
            Effect.Queues.get(Object.isString(this.options.queue) ? "global" : this.options.queue.scope).add(this);
        }
    },
    loop: function(c) {
        if (c >= this.startOn) {
            if (c >= this.finishOn) {
                this.render(1);
                this.cancel();
                this.event("beforeFinish");
                if (this.finish) {
                    this.finish();
                }
                this.event("afterFinish");
                return;
            }
            var b = (c - this.startOn) / this.totalTime,
                a = (b * this.totalFrames).round();
            if (a > this.currentFrame) {
                this.render(b);
                this.currentFrame = a;
            }
        }
    },
    cancel: function() {
        if (!this.options.sync) {
            Effect.Queues.get(Object.isString(this.options.queue) ? "global" : this.options.queue.scope).remove(this);
        }
        this.state = "finished";
    },
    event: function(a) {
        if (this.options[a + "Internal"]) {
            this.options[a + "Internal"](this);
        }
        if (this.options[a]) {
            this.options[a](this);
        }
    },
    inspect: function() {
        var a = $H();
        for (var property in this) {
            if (!Object.isFunction(this[property])) {
                a.set(property, this[property]);
            }
        }
        return "#<Effect:" + a.inspect() + ",options:" + $H(this.options).inspect() + ">";
    }
});
Effect.Parallel = Class.create(Effect.Base, {
    initialize: function(a) {
        this.effects = a || [];
        this.start(arguments[1]);
    },
    update: function(a) {
        this.effects.invoke("render", a);
    },
    finish: function(a) {
        this.effects.each(function(b) {
            b.render(1);
            b.cancel();
            b.event("beforeFinish");
            if (b.finish) {
                b.finish(a);
            }
            b.event("afterFinish");
        });
    }
});
Effect.Tween = Class.create(Effect.Base, {
    initialize: function(c, f, e) {
        c = Object.isString(c) ? $(c) : c;
        var b = $A(arguments),
            d = b.last(),
            a = b.length == 5 ? b[3] : null;
        this.method = Object.isFunction(d) ? d.bind(c) : Object.isFunction(c[d]) ? c[d].bind(c) : function(g) {
            c[d] = g;
        };
        this.start(Object.extend({
            from: f,
            to: e
        }, a || {}));
    },
    update: function(a) {
        this.method(a);
    }
});
Effect.Event = Class.create(Effect.Base, {
    initialize: function() {
        this.start(Object.extend({
            duration: 0
        }, arguments[0] || {}));
    },
    update: Prototype.emptyFunction
});
Effect.Opacity = Class.create(Effect.Base, {
    initialize: function(b) {
        this.element = $(b);
        if (!this.element) {
            throw (Effect._elementDoesNotExistError);
        }
        if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout)) {
            this.element.setStyle({
                zoom: 1
            });
        }
        var a = Object.extend({
            from: this.element.getOpacity() || 0,
            to: 1
        }, arguments[1] || {});
        a.from = parseFloat(a.from);
        a.to = parseFloat(a.to);
        this.start(a);
    },
    update: function(a) {
        this.element.setOpacity(a);
    }
});
Effect.Move = Class.create(Effect.Base, {
    initialize: function(b) {
        this.element = $(b);
        if (!this.element) {
            throw (Effect._elementDoesNotExistError);
        }
        var a = Object.extend({
            x: 0,
            y: 0,
            mode: "relative"
        }, arguments[1] || {});
        this.start(a);
    },
    setup: function() {
        this.element.makePositioned();
        this.originalLeft = parseFloat(this.element.getStyle("left") || "0");
        this.originalTop = parseFloat(this.element.getStyle("top") || "0");
        if (this.options.mode == "absolute") {
            this.options.x = this.options.x - this.originalLeft;
            this.options.y = this.options.y - this.originalTop;
        }
    },
    update: function(a) {
        this.element.setStyle({
            left: (this.options.x * a + this.originalLeft).round() + "px",
            top: (this.options.y * a + this.originalTop).round() + "px"
        });
    }
});
Effect.MoveBy = function(b, a, c) {
    return new Effect.Move(b, Object.extend({
        x: c,
        y: a
    }, arguments[3] || {}));
};
Effect.Scale = Class.create(Effect.Base, {
    initialize: function(b, c) {
        this.element = $(b);
        if (!this.element) {
            throw (Effect._elementDoesNotExistError);
        }
        var a = Object.extend({
            scaleX: true,
            scaleY: true,
            scaleContent: true,
            scaleFromCenter: false,
            scaleMode: "box",
            scaleFrom: 100,
            scaleTo: c
        }, arguments[2] || {});
        this.start(a);
    },
    setup: function() {
        this.restoreAfterFinish = this.options.restoreAfterFinish || false;
        this.elementPositioning = this.element.getStyle("position");
        this.originalStyle = {};
        ["top", "left", "width", "height", "fontSize"].each(function(b) {
            this.originalStyle[b] = this.element.style[b];
        }.bind(this));
        this.originalTop = this.element.offsetTop;
        this.originalLeft = this.element.offsetLeft;
        var a = this.element.getStyle("font-size") || "100%";
        ["em", "px", "%", "pt"].each(function(b) {
            if (a.indexOf(b) > 0) {
                this.fontSize = parseFloat(a);
                this.fontSizeType = b;
            }
        }.bind(this));
        this.factor = (this.options.scaleTo - this.options.scaleFrom) / 100;
        this.dims = null;
        if (this.options.scaleMode == "box") {
            this.dims = [this.element.offsetHeight, this.element.offsetWidth];
        }
        if (/^content/.test(this.options.scaleMode)) {
            this.dims = [this.element.scrollHeight, this.element.scrollWidth];
        }
        if (!this.dims) {
            this.dims = [this.options.scaleMode.originalHeight, this.options.scaleMode.originalWidth];
        }
    },
    update: function(a) {
        var b = (this.options.scaleFrom / 100) + (this.factor * a);
        if (this.options.scaleContent && this.fontSize) {
            this.element.setStyle({
                fontSize: this.fontSize * b + this.fontSizeType
            });
        }
        this.setDimensions(this.dims[0] * b, this.dims[1] * b);
    },
    finish: function(a) {
        if (this.restoreAfterFinish) {
            this.element.setStyle(this.originalStyle);
        }
    },
    setDimensions: function(a, e) {
        var f = {};
        if (this.options.scaleX) {
            f.width = e.round() + "px";
        }
        if (this.options.scaleY) {
            f.height = a.round() + "px";
        }
        if (this.options.scaleFromCenter) {
            var c = (a - this.dims[0]) / 2;
            var b = (e - this.dims[1]) / 2;
            if (this.elementPositioning == "absolute") {
                if (this.options.scaleY) {
                    f.top = this.originalTop - c + "px";
                }
                if (this.options.scaleX) {
                    f.left = this.originalLeft - b + "px";
                }
            } else {
                if (this.options.scaleY) {
                    f.top = -c + "px";
                }
                if (this.options.scaleX) {
                    f.left = -b + "px";
                }
            }
        }
        this.element.setStyle(f);
    }
});
Effect.Highlight = Class.create(Effect.Base, {
    initialize: function(b) {
        this.element = $(b);
        if (!this.element) {
            throw (Effect._elementDoesNotExistError);
        }
        var a = Object.extend({
            startcolor: "#ffff99"
        }, arguments[1] || {});
        this.start(a);
    },
    setup: function() {
        if (this.element.getStyle("display") == "none") {
            this.cancel();
            return;
        }
        this.oldStyle = {};
        if (!this.options.keepBackgroundImage) {
            this.oldStyle.backgroundImage = this.element.getStyle("background-image");
            this.element.setStyle({
                backgroundImage: "none"
            });
        }
        if (!this.options.endcolor) {
            this.options.endcolor = this.element.getStyle("background-color").parseColor("#ffffff");
        }
        if (!this.options.restorecolor) {
            this.options.restorecolor = this.element.getStyle("background-color");
        }
        this._base = $R(0, 2).map(function(a) {
            return parseInt(this.options.startcolor.slice(a * 2 + 1, a * 2 + 3), 16);
        }.bind(this));
        this._delta = $R(0, 2).map(function(a) {
            return parseInt(this.options.endcolor.slice(a * 2 + 1, a * 2 + 3), 16) - this._base[a];
        }.bind(this));
    },
    update: function(a) {
        this.element.setStyle({
            backgroundColor: $R(0, 2).inject("#", function(b, c, d) {
                return b + ((this._base[d] + (this._delta[d] * a)).round().toColorPart());
            }.bind(this))
        });
    },
    finish: function() {
        this.element.setStyle(Object.extend(this.oldStyle, {
            backgroundColor: this.options.restorecolor
        }));
    }
});
Effect.ScrollTo = function(c) {
    var b = arguments[1] || {},
        a = document.viewport.getScrollOffsets(),
        d = $(c).cumulativeOffset();
    if (b.offset) {
        d[1] += b.offset;
    }
    return new Effect.Tween(null, a.top, d[1], b, function(e) {
        scrollTo(a.left, e.round());
    });
};
Effect.Fade = function(c) {
    c = $(c);
    var a = c.getInlineOpacity();
    var b = Object.extend({
        from: c.getOpacity() || 1,
        to: 0,
        afterFinishInternal: function(d) {
            if (d.options.to != 0) {
                return;
            }
            d.element.hide().setStyle({
                opacity: a
            });
        }
    }, arguments[1] || {});
    return new Effect.Opacity(c, b);
};
Effect.Appear = function(b) {
    b = $(b);
    var a = Object.extend({
        from: (b.getStyle("display") == "none" ? 0 : b.getOpacity() || 0),
        to: 1,
        afterFinishInternal: function(c) {
            c.element.forceRerendering();
        },
        beforeSetup: function(c) {
            c.element.setOpacity(c.options.from).show();
        }
    }, arguments[1] || {});
    return new Effect.Opacity(b, a);
};
Effect.Puff = function(b) {
    b = $(b);
    var a = {
        opacity: b.getInlineOpacity(),
        position: b.getStyle("position"),
        top: b.style.top,
        left: b.style.left,
        width: b.style.width,
        height: b.style.height
    };
    return new Effect.Parallel([new Effect.Scale(b, 200, {
        sync: true,
        scaleFromCenter: true,
        scaleContent: true,
        restoreAfterFinish: true
    }), new Effect.Opacity(b, {
        sync: true,
        to: 0
    })], Object.extend({
        duration: 1,
        beforeSetupInternal: function(c) {
            Position.absolutize(c.effects[0].element);
        },
        afterFinishInternal: function(c) {
            c.effects[0].element.hide().setStyle(a);
        }
    }, arguments[1] || {}));
};
Effect.BlindUp = function(a) {
    a = $(a);
    a.makeClipping();
    return new Effect.Scale(a, 0, Object.extend({
        scaleContent: false,
        scaleX: false,
        restoreAfterFinish: true,
        afterFinishInternal: function(b) {
            b.element.hide().undoClipping();
        }
    }, arguments[1] || {}));
};
Effect.BlindDown = function(b) {
    b = $(b);
    var a = b.getDimensions();
    return new Effect.Scale(b, 100, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleFrom: 0,
        scaleMode: {
            originalHeight: a.height,
            originalWidth: a.width
        },
        restoreAfterFinish: true,
        afterSetup: function(c) {
            c.element.makeClipping().setStyle({
                height: "0px"
            }).show();
        },
        afterFinishInternal: function(c) {
            c.element.undoClipping();
        }
    }, arguments[1] || {}));
};
Effect.SwitchOff = function(b) {
    b = $(b);
    var a = b.getInlineOpacity();
    return new Effect.Appear(b, Object.extend({
        duration: 0.4,
        from: 0,
        transition: Effect.Transitions.flicker,
        afterFinishInternal: function(c) {
            new Effect.Scale(c.element, 1, {
                duration: 0.3,
                scaleFromCenter: true,
                scaleX: false,
                scaleContent: false,
                restoreAfterFinish: true,
                beforeSetup: function(d) {
                    d.element.makePositioned().makeClipping();
                },
                afterFinishInternal: function(d) {
                    d.element.hide().undoClipping().undoPositioned().setStyle({
                        opacity: a
                    });
                }
            });
        }
    }, arguments[1] || {}));
};
Effect.DropOut = function(b) {
    b = $(b);
    var a = {
        top: b.getStyle("top"),
        left: b.getStyle("left"),
        opacity: b.getInlineOpacity()
    };
    return new Effect.Parallel([new Effect.Move(b, {
        x: 0,
        y: 100,
        sync: true
    }), new Effect.Opacity(b, {
        sync: true,
        to: 0
    })], Object.extend({
        duration: 0.5,
        beforeSetup: function(c) {
            c.effects[0].element.makePositioned();
        },
        afterFinishInternal: function(c) {
            c.effects[0].element.hide().undoPositioned().setStyle(a);
        }
    }, arguments[1] || {}));
};
Effect.Shake = function(d) {
    d = $(d);
    var b = Object.extend({
        distance: 20,
        duration: 0.5
    }, arguments[1] || {});
    var e = parseFloat(b.distance);
    var c = parseFloat(b.duration) / 10;
    var a = {
        top: d.getStyle("top"),
        left: d.getStyle("left")
    };
    return new Effect.Move(d, {
        x: e,
        y: 0,
        duration: c,
        afterFinishInternal: function(f) {
            new Effect.Move(f.element, {
                x: -e * 2,
                y: 0,
                duration: c * 2,
                afterFinishInternal: function(g) {
                    new Effect.Move(g.element, {
                        x: e * 2,
                        y: 0,
                        duration: c * 2,
                        afterFinishInternal: function(h) {
                            new Effect.Move(h.element, {
                                x: -e * 2,
                                y: 0,
                                duration: c * 2,
                                afterFinishInternal: function(i) {
                                    new Effect.Move(i.element, {
                                        x: e * 2,
                                        y: 0,
                                        duration: c * 2,
                                        afterFinishInternal: function(j) {
                                            new Effect.Move(j.element, {
                                                x: -e,
                                                y: 0,
                                                duration: c,
                                                afterFinishInternal: function(k) {
                                                    k.element.undoPositioned().setStyle(a);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};
Effect.SlideDown = function(c) {
    c = $(c).cleanWhitespace();
    var a = c.down().getStyle("bottom");
    var b = c.getDimensions();
    return new Effect.Scale(c, 100, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleFrom: window.opera ? 0 : 1,
        scaleMode: {
            originalHeight: b.height,
            originalWidth: b.width
        },
        restoreAfterFinish: true,
        afterSetup: function(d) {
            d.element.makePositioned();
            d.element.down().makePositioned();
            if (window.opera) {
                d.element.setStyle({
                    top: ""
                });
            }
            d.element.makeClipping().setStyle({
                height: "0px"
            }).show();
        },
        afterUpdateInternal: function(d) {
            d.element.down().setStyle({
                bottom: (d.dims[0] - d.element.clientHeight) + "px"
            });
        },
        afterFinishInternal: function(d) {
            d.element.undoClipping().undoPositioned();
            d.element.down().undoPositioned().setStyle({
                bottom: a
            });
        }
    }, arguments[1] || {}));
};
Effect.SlideUp = function(c) {
    c = $(c).cleanWhitespace();
    var a = c.down().getStyle("bottom");
    var b = c.getDimensions();
    return new Effect.Scale(c, window.opera ? 0 : 1, Object.extend({
        scaleContent: false,
        scaleX: false,
        // scaleMode: "box",
        scaleFrom: 100,
        scaleMode: {
            originalHeight: b.height,
            originalWidth: b.width
        },
        restoreAfterFinish: true,
        afterSetup: function(d) {
            d.element.makePositioned();
            d.element.down().makePositioned();
            if (window.opera) {
                d.element.setStyle({
                    top: ""
                });
            }
            d.element.makeClipping().show();
        },
        afterUpdateInternal: function(d) {
            d.element.down().setStyle({
                bottom: (d.dims[0] - d.element.clientHeight) + "px"
            });
        },
        afterFinishInternal: function(d) {
            d.element.hide().undoClipping().undoPositioned();
            d.element.down().undoPositioned().setStyle({
                bottom: a
            });
        }
    }, arguments[1] || {}));
};
Effect.Squish = function(a) {
    return new Effect.Scale(a, window.opera ? 1 : 0, {
        restoreAfterFinish: true,
        beforeSetup: function(b) {
            b.element.makeClipping();
        },
        afterFinishInternal: function(b) {
            b.element.hide().undoClipping();
        }
    });
};
Effect.Grow = function(c) {
    c = $(c);
    var b = Object.extend({
        direction: "center",
        moveTransition: Effect.Transitions.sinoidal,
        scaleTransition: Effect.Transitions.sinoidal,
        opacityTransition: Effect.Transitions.full
    }, arguments[1] || {});
    var a = {
        top: c.style.top,
        left: c.style.left,
        height: c.style.height,
        width: c.style.width,
        opacity: c.getInlineOpacity()
    };
    var g = c.getDimensions();
    var h, f;
    var e, d;
    switch (b.direction) {
    case "top-left":
        h = f = e = d = 0;
        break;
    case "top-right":
        h = g.width;
        f = d = 0;
        e = -g.width;
        break;
    case "bottom-left":
        h = e = 0;
        f = g.height;
        d = -g.height;
        break;
    case "bottom-right":
        h = g.width;
        f = g.height;
        e = -g.width;
        d = -g.height;
        break;
    case "center":
        h = g.width / 2;
        f = g.height / 2;
        e = -g.width / 2;
        d = -g.height / 2;
        break;
    }
    return new Effect.Move(c, {
        x: h,
        y: f,
        duration: 0.01,
        beforeSetup: function(i) {
            i.element.hide().makeClipping().makePositioned();
        },
        afterFinishInternal: function(i) {
            new Effect.Parallel([new Effect.Opacity(i.element, {
                sync: true,
                to: 1,
                from: 0,
                transition: b.opacityTransition
            }), new Effect.Move(i.element, {
                x: e,
                y: d,
                sync: true,
                transition: b.moveTransition
            }), new Effect.Scale(i.element, 100, {
                scaleMode: {
                    originalHeight: g.height,
                    originalWidth: g.width
                },
                sync: true,
                scaleFrom: window.opera ? 1 : 0,
                transition: b.scaleTransition,
                restoreAfterFinish: true
            })], Object.extend({
                beforeSetup: function(j) {
                    j.effects[0].element.setStyle({
                        height: "0px"
                    }).show();
                },
                afterFinishInternal: function(j) {
                    j.effects[0].element.undoClipping().undoPositioned().setStyle(a);
                }
            }, b));
        }
    });
};
Effect.Shrink = function(c) {
    c = $(c);
    var b = Object.extend({
        direction: "center",
        moveTransition: Effect.Transitions.sinoidal,
        scaleTransition: Effect.Transitions.sinoidal,
        opacityTransition: Effect.Transitions.none
    }, arguments[1] || {});
    var a = {
        top: c.style.top,
        left: c.style.left,
        height: c.style.height,
        width: c.style.width,
        opacity: c.getInlineOpacity()
    };
    var f = c.getDimensions();
    var e, d;
    switch (b.direction) {
    case "top-left":
        e = d = 0;
        break;
    case "top-right":
        e = f.width;
        d = 0;
        break;
    case "bottom-left":
        e = 0;
        d = f.height;
        break;
    case "bottom-right":
        e = f.width;
        d = f.height;
        break;
    case "center":
        e = f.width / 2;
        d = f.height / 2;
        break;
    }
    return new Effect.Parallel([new Effect.Opacity(c, {
        sync: true,
        to: 0,
        from: 1,
        transition: b.opacityTransition
    }), new Effect.Scale(c, window.opera ? 1 : 0, {
        sync: true,
        transition: b.scaleTransition,
        restoreAfterFinish: true
    }), new Effect.Move(c, {
        x: e,
        y: d,
        sync: true,
        transition: b.moveTransition
    })], Object.extend({
        beforeStartInternal: function(g) {
            g.effects[0].element.makePositioned().makeClipping();
        },
        afterFinishInternal: function(g) {
            g.effects[0].element.hide().undoClipping().undoPositioned().setStyle(a);
        }
    }, b));
};
Effect.Pulsate = function(c) {
    c = $(c);
    var b = arguments[1] || {},
        a = c.getInlineOpacity(),
        e = b.transition || Effect.Transitions.linear,
        d = function(f) {
            return 1 - e((-Math.cos((f * (b.pulses || 5) * 2) * Math.PI) / 2) + 0.5);
        };
    return new Effect.Opacity(c, Object.extend(Object.extend({
        duration: 2,
        from: 0,
        afterFinishInternal: function(f) {
            f.element.setStyle({
                opacity: a
            });
        }
    }, b), {
        transition: d
    }));
};
Effect.Fold = function(b) {
    b = $(b);
    var a = {
        top: b.style.top,
        left: b.style.left,
        width: b.style.width,
        height: b.style.height
    };
    b.makeClipping();
    return new Effect.Scale(b, 5, Object.extend({
        scaleContent: false,
        scaleX: false,
        afterFinishInternal: function(c) {
            new Effect.Scale(b, 1, {
                scaleContent: false,
                scaleY: false,
                afterFinishInternal: function(d) {
                    d.element.hide().undoClipping().setStyle(a);
                }
            });
        }
    }, arguments[1] || {}));
};
Effect.Morph = Class.create(Effect.Base, {
    initialize: function(c) {
        this.element = $(c);
        if (!this.element) {
            throw (Effect._elementDoesNotExistError);
        }
        var a = Object.extend({
            style: {}
        }, arguments[1] || {});
        if (!Object.isString(a.style)) {
            this.style = $H(a.style);
        } else {
            if (a.style.include(":")) {
                this.style = a.style.parseStyle();
            } else {
                this.element.addClassName(a.style);
                this.style = $H(this.element.getStyles());
                this.element.removeClassName(a.style);
                var b = this.element.getStyles();
                this.style = this.style.reject(function(d) {
                    return d.value == b[d.key];
                });
                a.afterFinishInternal = function(d) {
                    d.element.addClassName(d.options.style);
                    d.transforms.each(function(e) {
                        d.element.style[e.style] = "";
                    });
                };
            }
        }
        this.start(a);
    },
    setup: function() {
        function a(b) {
            if (!b || ["rgba(0, 0, 0, 0)", "transparent"].include(b)) {
                b = "#ffffff";
            }
            b = b.parseColor();
            return $R(0, 2).map(function(c) {
                return parseInt(b.slice(c * 2 + 1, c * 2 + 3), 16);
            });
        }
        this.transforms = this.style.map(function(g) {
            var f = g[0],
                e = g[1],
                d = null;
            if (e.parseColor("#zzzzzz") != "#zzzzzz") {
                e = e.parseColor();
                d = "color";
            } else {
                if (f == "opacity") {
                    e = parseFloat(e);
                    if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout)) {
                        this.element.setStyle({
                            zoom: 1
                        });
                    }
                } else {
                    if (Element.CSS_LENGTH.test(e)) {
                        var c = e.match(/^([\+\-]?[0-9\.]+)(.*)$/);
                        e = parseFloat(c[1]);
                        d = (c.length == 3) ? c[2] : null;
                    }
                }
            }
            var b = this.element.getStyle(f);
            return {
                style: f.camelize(),
                originalValue: d == "color" ? a(b) : parseFloat(b || 0),
                targetValue: d == "color" ? a(e) : e,
                unit: d
            };
        }.bind(this)).reject(function(b) {
            return ((b.originalValue == b.targetValue) || (b.unit != "color" && (isNaN(b.originalValue) || isNaN(b.targetValue))));
        });
    },
    update: function(a) {
        var d = {},
            b, c = this.transforms.length;
        while (c--) {
            d[(b = this.transforms[c]).style] = b.unit == "color" ? "#" + (Math.round(b.originalValue[0] + (b.targetValue[0] - b.originalValue[0]) * a)).toColorPart() + (Math.round(b.originalValue[1] + (b.targetValue[1] - b.originalValue[1]) * a)).toColorPart() + (Math.round(b.originalValue[2] + (b.targetValue[2] - b.originalValue[2]) * a)).toColorPart() : (b.originalValue + (b.targetValue - b.originalValue) * a).toFixed(3) + (b.unit === null ? "" : b.unit);
        }
        this.element.setStyle(d, true);
    }
});
Effect.Transform = Class.create({
    initialize: function(a) {
        this.tracks = [];
        this.options = arguments[1] || {};
        this.addTracks(a);
    },
    addTracks: function(a) {
        a.each(function(b) {
            b = $H(b);
            var c = b.values().first();
            this.tracks.push($H({
                ids: b.keys().first(),
                effect: Effect.Morph,
                options: {
                    style: c
                }
            }));
        }.bind(this));
        return this;
    },
    play: function() {
        return new Effect.Parallel(this.tracks.map(function(a) {
            var d = a.get("ids"),
                c = a.get("effect"),
                b = a.get("options");
            var e = [$(d) || $$(d)].flatten();
            return e.map(function(f) {
                return new c(f, Object.extend({
                    sync: true
                }, b));
            });
        }).flatten(), this.options);
    }
});
Element.CSS_PROPERTIES = "backgroundColor backgroundPosition borderBottomColor borderBottomStyle borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth borderRightColor borderRightStyle borderRightWidth borderSpacing borderTopColor borderTopStyle borderTopWidth bottom clip color fontSize fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop markerOffset maxHeight maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft paddingRight paddingTop right textIndent top width wordSpacing zIndex".split(" ");
Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;
String.__parseStyleElement = document.createElement("div");
String.prototype.parseStyle = function() {
    var b, a = $H();
    if (Prototype.Browser.WebKit) {
        b = new Element("div", {
            style: this
        }).style;
    } else {
        String.__parseStyleElement.innerHTML = "<div style=\"" + this + "\"></div>";
        b = String.__parseStyleElement.childNodes[0].style;
    }
    Element.CSS_PROPERTIES.each(function(c) {
        if (b[c]) {
            a.set(c, b[c]);
        }
    });
    if (Prototype.Browser.IE && this.include("opacity")) {
        a.set("opacity", this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);
    }
    return a;
};
if (document.defaultView && document.defaultView.getComputedStyle) {
    Element.getStyles = function(b) {
        var a = document.defaultView.getComputedStyle($(b), null);
        return Element.CSS_PROPERTIES.inject({}, function(c, d) {
            c[d] = a[d];
            return c;
        });
    };
} else {
    Element.getStyles = function(b) {
        b = $(b);
        var a = b.currentStyle,
            c;
        c = Element.CSS_PROPERTIES.inject({}, function(d, e) {
            d[e] = a[e];
            return d;
        });
        if (!c.opacity) {
            c.opacity = b.getOpacity();
        }
        return c;
    };
}
Effect.Methods = {
    morph: function(a, b) {
        a = $(a);
        new Effect.Morph(a, Object.extend({
            style: b
        }, arguments[2] || {}));
        return a;
    },
    visualEffect: function(c, e, b) {
        c = $(c);
        var d = e.dasherize().camelize(),
            a = d.charAt(0).toUpperCase() + d.substring(1);
        new Effect[a](c, b);
        return c;
    },
    highlight: function(b, a) {
        b = $(b);
        new Effect.Highlight(b, a);
        return b;
    }
};
"fade appear grow shrink fold blindUp blindDown slideUp slideDown pulsate shake puff squish switchOff dropOut".split(" ").each(function(a) {
    Effect.Methods[a] = function(c, b) {
        c = $(c);
        Effect[a.charAt(0).toUpperCase() + a.substring(1)](c, b);
        return c;
    };
});
"getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles".split(" ").each(function(a) {
    Effect.Methods[a] = Element[a];
});
Element.addMethods(Effect.Methods);
