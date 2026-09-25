System.register("q-bundled:///virtual/quick-compiler.babel-helpers.js", [], function (_export, _context) {
  "use strict";

  var id, REACT_ELEMENT_TYPE, applyDecs2203Impl;
  function _OverloadYield(e, d) {
    this.v = e, this.k = d;
  }
  function _applyDecoratedDescriptor(i, e, r, n, l) {
    var a = {};
    return Object.keys(n).forEach(function (i) {
      a[i] = n[i];
    }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) {
      return n(i, e, r) || r;
    }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a;
  }
  function _applyDecs2311(e, t, n, r, o, i) {
    var a,
      c,
      u,
      s,
      f,
      l,
      p,
      d = Symbol.metadata || Symbol.for("Symbol.metadata"),
      m = Object.defineProperty,
      h = Object.create,
      y = [h(null), h(null)],
      v = t.length;
    function g(t, n, r) {
      return function (o, i) {
        n && (i = o, o = e);
        for (var a = 0; a < t.length; a++) i = t[a].apply(o, r ? [i] : []);
        return r ? i : o;
      };
    }
    function b(e, t, n, r) {
      if ("function" != typeof e && (r || void 0 !== e)) throw new TypeError(t + " must " + (n || "be") + " a function" + (r ? "" : " or undefined"));
      return e;
    }
    function applyDec(e, t, n, r, o, i, u, s, f, l, p) {
      function d(e) {
        if (!p(e)) throw new TypeError("Attempted to access private element on non-instance");
      }
      var h = [].concat(t[0]),
        v = t[3],
        w = !u,
        D = 1 === o,
        S = 3 === o,
        j = 4 === o,
        E = 2 === o;
      function I(t, n, r) {
        return function (o, i) {
          return n && (i = o, o = e), r && r(o), P[t].call(o, i);
        };
      }
      if (!w) {
        var P = {},
          k = [],
          F = S ? "get" : j || D ? "set" : "value";
        if (f ? (l || D ? P = {
          get: _setFunctionName(function () {
            return v(this);
          }, r, "get"),
          set: function (e) {
            t[4](this, e);
          }
        } : P[F] = v, l || _setFunctionName(P[F], r, E ? "" : F)) : l || (P = Object.getOwnPropertyDescriptor(e, r)), !l && !f) {
          if ((c = y[+s][r]) && 7 !== (c ^ o)) throw Error("Decorating two elements with the same name (" + P[F].name + ") is not supported yet");
          y[+s][r] = o < 3 ? 1 : o;
        }
      }
      for (var N = e, O = h.length - 1; O >= 0; O -= n ? 2 : 1) {
        var T = b(h[O], "A decorator", "be", !0),
          z = n ? h[O - 1] : void 0,
          A = {},
          H = {
            kind: ["field", "accessor", "method", "getter", "setter", "class"][o],
            name: r,
            metadata: a,
            addInitializer: function (e, t) {
              if (e.v) throw new TypeError("attempted to call addInitializer after decoration was finished");
              b(t, "An initializer", "be", !0), i.push(t);
            }.bind(null, A)
          };
        if (w) c = T.call(z, N, H), A.v = 1, b(c, "class decorators", "return") && (N = c);else if (H.static = s, H.private = f, c = H.access = {
          has: f ? p.bind() : function (e) {
            return r in e;
          }
        }, j || (c.get = f ? E ? function (e) {
          return d(e), P.value;
        } : I("get", 0, d) : function (e) {
          return e[r];
        }), E || S || (c.set = f ? I("set", 0, d) : function (e, t) {
          e[r] = t;
        }), N = T.call(z, D ? {
          get: P.get,
          set: P.set
        } : P[F], H), A.v = 1, D) {
          if ("object" == typeof N && N) (c = b(N.get, "accessor.get")) && (P.get = c), (c = b(N.set, "accessor.set")) && (P.set = c), (c = b(N.init, "accessor.init")) && k.unshift(c);else if (void 0 !== N) throw new TypeError("accessor decorators must return an object with get, set, or init properties or undefined");
        } else b(N, (l ? "field" : "method") + " decorators", "return") && (l ? k.unshift(N) : P[F] = N);
      }
      return o < 2 && u.push(g(k, s, 1), g(i, s, 0)), l || w || (f ? D ? u.splice(-1, 0, I("get", s), I("set", s)) : u.push(E ? P[F] : b.call.bind(P[F])) : m(e, r, P)), N;
    }
    function w(e) {
      return m(e, d, {
        configurable: !0,
        enumerable: !0,
        value: a
      });
    }
    return void 0 !== i && (a = i[d]), a = h(null == a ? null : a), f = [], l = function (e) {
      e && f.push(g(e));
    }, p = function (t, r) {
      for (var i = 0; i < n.length; i++) {
        var a = n[i],
          c = a[1],
          l = 7 & c;
        if ((8 & c) == t && !l == r) {
          var p = a[2],
            d = !!a[3],
            m = 16 & c;
          applyDec(t ? e : e.prototype, a, m, d ? "#" + p : _toPropertyKey(p), l, l < 2 ? [] : t ? s = s || [] : u = u || [], f, !!t, d, r, t && d ? function (t) {
            return _checkInRHS(t) === e;
          } : o);
        }
      }
    }, p(8, 0), p(0, 0), p(8, 1), p(0, 1), l(u), l(s), c = f, v || w(e), {
      e: c,
      get c() {
        var n = [];
        return v && [w(e = applyDec(e, [t], r, e.name, 5, n)), g(n, 1)];
      }
    };
  }
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return _arrayLikeToArray(r);
  }
  function _assertClassBrand(e, t, n) {
    if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
    throw new TypeError("Private element is not present on this object");
  }
  function _assertThisInitialized(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
  }
  function _asyncGeneratorDelegate(t) {
    var e = {},
      n = !1;
    function pump(e, r) {
      return n = !0, r = new Promise(function (n) {
        n(t[e](r));
      }), {
        done: !1,
        value: new _OverloadYield(r, 1)
      };
    }
    return e["undefined" != typeof Symbol && Symbol.iterator || "@@iterator"] = function () {
      return this;
    }, e.next = function (t) {
      return n ? (n = !1, t) : pump("next", t);
    }, "function" == typeof t.throw && (e.throw = function (t) {
      if (n) throw n = !1, t;
      return pump("throw", t);
    }), "function" == typeof t.return && (e.return = function (t) {
      return n ? (n = !1, t) : pump("return", t);
    }), e;
  }
  function _asyncIterator(r) {
    var n,
      t,
      o,
      e = 2;
    for ("undefined" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--;) {
      if (t && null != (n = r[t])) return n.call(r);
      if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r));
      t = "@@asyncIterator", o = "@@iterator";
    }
    throw new TypeError("Object is not async iterable");
  }
  function AsyncFromSyncIterator(r) {
    function AsyncFromSyncIteratorContinuation(r) {
      if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object."));
      var n = r.done;
      return Promise.resolve(r.value).then(function (r) {
        return {
          value: r,
          done: n
        };
      });
    }
    return AsyncFromSyncIterator = function (r) {
      this.s = r, this.n = r.next;
    }, AsyncFromSyncIterator.prototype = {
      s: null,
      n: null,
      next: function () {
        return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
      },
      return: function (r) {
        var n = this.s.return;
        return void 0 === n ? Promise.resolve({
          value: r,
          done: !0
        }) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
      },
      throw: function (r) {
        var n = this.s.return;
        return void 0 === n ? Promise.reject(r) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
      }
    }, new AsyncFromSyncIterator(r);
  }
  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c),
        u = i.value;
    } catch (n) {
      return void e(n);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function () {
      var t = this,
        e = arguments;
      return new Promise(function (r, o) {
        var a = n.apply(t, e);
        function _next(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
        }
        function _throw(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
        }
        _next(void 0);
      });
    };
  }
  function _awaitAsyncGenerator(e) {
    return new _OverloadYield(e, 0);
  }
  function _callSuper(t, o, e) {
    return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
  }
  function _checkInRHS(e) {
    if (Object(e) !== e) throw TypeError("right-hand side of 'in' should be an object, got " + (null !== e ? typeof e : "null"));
    return e;
  }
  function _checkPrivateRedeclaration(e, t) {
    if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _classNameTDZError(e) {
    throw new ReferenceError('Class "' + e + '" cannot be referenced in computed property keys.');
  }
  function _classPrivateFieldGet2(s, a) {
    return s.get(_assertClassBrand(s, a));
  }
  function _classPrivateFieldInitSpec(e, t, a) {
    _checkPrivateRedeclaration(e, t), t.set(e, a);
  }
  function _classPrivateFieldLooseBase(e, t) {
    if (!{}.hasOwnProperty.call(e, t)) throw new TypeError("attempted to use private field on non-instance");
    return e;
  }
  function _classPrivateFieldLooseKey(e) {
    return "__private_" + id++ + "_" + e;
  }
  function _classPrivateFieldSet2(s, a, r) {
    return s.set(_assertClassBrand(s, a), r), r;
  }
  function _classPrivateGetter(s, r, a) {
    return a(_assertClassBrand(s, r));
  }
  function _classPrivateMethodInitSpec(e, a) {
    _checkPrivateRedeclaration(e, a), a.add(e);
  }
  function _classPrivateSetter(s, r, a, t) {
    return r(_assertClassBrand(s, a), t), t;
  }
  function _classStaticPrivateMethodGet(s, a, t) {
    return _assertClassBrand(a, s), t;
  }
  function _construct(t, e, r) {
    if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
    var o = [null];
    o.push.apply(o, e);
    var p = new (t.bind.apply(t, o))();
    return r && _setPrototypeOf(p, r.prototype), p;
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var n = 0,
          F = function () {};
        return {
          s: F,
          n: function () {
            return n >= r.length ? {
              done: !0
            } : {
              done: !1,
              value: r[n++]
            };
          },
          e: function (r) {
            throw r;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o,
      a = !0,
      u = !1;
    return {
      s: function () {
        t = t.call(r);
      },
      n: function () {
        var r = t.next();
        return a = r.done, r;
      },
      e: function (r) {
        u = !0, o = r;
      },
      f: function () {
        try {
          a || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      }
    };
  }
  function _createForOfIteratorHelperLoose(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (t) return (t = t.call(r)).next.bind(t);
    if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
      t && (r = t);
      var o = 0;
      return function () {
        return o >= r.length ? {
          done: !0
        } : {
          done: !1,
          value: r[o++]
        };
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _createSuper(t) {
    var r = _isNativeReflectConstruct();
    return function () {
      var e,
        o = _getPrototypeOf(t);
      if (r) {
        var s = _getPrototypeOf(this).constructor;
        e = Reflect.construct(o, arguments, s);
      } else e = o.apply(this, arguments);
      return _possibleConstructorReturn(this, e);
    };
  }
  function _decorate(e, r, t, i) {
    var o = _getDecoratorsApi();
    if (i) for (var n = 0; n < i.length; n++) o = i[n](o);
    var s = r(function (e) {
        o.initializeInstanceElements(e, a.elements);
      }, t),
      a = o.decorateClass(_coalesceClassElements(s.d.map(_createElementDescriptor)), e);
    return o.initializeClassElements(s.F, a.elements), o.runClassFinishers(s.F, a.finishers);
  }
  function _getDecoratorsApi() {
    _getDecoratorsApi = function () {
      return e;
    };
    var e = {
      elementsDefinitionOrder: [["method"], ["field"]],
      initializeInstanceElements: function (e, r) {
        ["method", "field"].forEach(function (t) {
          r.forEach(function (r) {
            r.kind === t && "own" === r.placement && this.defineClassElement(e, r);
          }, this);
        }, this);
      },
      initializeClassElements: function (e, r) {
        var t = e.prototype;
        ["method", "field"].forEach(function (i) {
          r.forEach(function (r) {
            var o = r.placement;
            if (r.kind === i && ("static" === o || "prototype" === o)) {
              var n = "static" === o ? e : t;
              this.defineClassElement(n, r);
            }
          }, this);
        }, this);
      },
      defineClassElement: function (e, r) {
        var t = r.descriptor;
        if ("field" === r.kind) {
          var i = r.initializer;
          t = {
            enumerable: t.enumerable,
            writable: t.writable,
            configurable: t.configurable,
            value: void 0 === i ? void 0 : i.call(e)
          };
        }
        Object.defineProperty(e, r.key, t);
      },
      decorateClass: function (e, r) {
        var t = [],
          i = [],
          o = {
            static: [],
            prototype: [],
            own: []
          };
        if (e.forEach(function (e) {
          this.addElementPlacement(e, o);
        }, this), e.forEach(function (e) {
          if (!_hasDecorators(e)) return t.push(e);
          var r = this.decorateElement(e, o);
          t.push(r.element), t.push.apply(t, r.extras), i.push.apply(i, r.finishers);
        }, this), !r) return {
          elements: t,
          finishers: i
        };
        var n = this.decorateConstructor(t, r);
        return i.push.apply(i, n.finishers), n.finishers = i, n;
      },
      addElementPlacement: function (e, r, t) {
        var i = r[e.placement];
        if (!t && -1 !== i.indexOf(e.key)) throw new TypeError("Duplicated element (" + e.key + ")");
        i.push(e.key);
      },
      decorateElement: function (e, r) {
        for (var t = [], i = [], o = e.decorators, n = o.length - 1; n >= 0; n--) {
          var s = r[e.placement];
          s.splice(s.indexOf(e.key), 1);
          var a = this.fromElementDescriptor(e),
            l = this.toElementFinisherExtras((0, o[n])(a) || a);
          e = l.element, this.addElementPlacement(e, r), l.finisher && i.push(l.finisher);
          var c = l.extras;
          if (c) {
            for (var p = 0; p < c.length; p++) this.addElementPlacement(c[p], r);
            t.push.apply(t, c);
          }
        }
        return {
          element: e,
          finishers: i,
          extras: t
        };
      },
      decorateConstructor: function (e, r) {
        for (var t = [], i = r.length - 1; i >= 0; i--) {
          var o = this.fromClassDescriptor(e),
            n = this.toClassDescriptor((0, r[i])(o) || o);
          if (void 0 !== n.finisher && t.push(n.finisher), void 0 !== n.elements) {
            e = n.elements;
            for (var s = 0; s < e.length - 1; s++) for (var a = s + 1; a < e.length; a++) if (e[s].key === e[a].key && e[s].placement === e[a].placement) throw new TypeError("Duplicated element (" + e[s].key + ")");
          }
        }
        return {
          elements: e,
          finishers: t
        };
      },
      fromElementDescriptor: function (e) {
        var r = {
          kind: e.kind,
          key: e.key,
          placement: e.placement,
          descriptor: e.descriptor
        };
        return Object.defineProperty(r, Symbol.toStringTag, {
          value: "Descriptor",
          configurable: !0
        }), "field" === e.kind && (r.initializer = e.initializer), r;
      },
      toElementDescriptors: function (e) {
        if (void 0 !== e) return _toArray(e).map(function (e) {
          var r = this.toElementDescriptor(e);
          return this.disallowProperty(e, "finisher", "An element descriptor"), this.disallowProperty(e, "extras", "An element descriptor"), r;
        }, this);
      },
      toElementDescriptor: function (e) {
        var r = e.kind + "";
        if ("method" !== r && "field" !== r) throw new TypeError('An element descriptor\'s .kind property must be either "method" or "field", but a decorator created an element descriptor with .kind "' + r + '"');
        var t = _toPropertyKey(e.key),
          i = e.placement + "";
        if ("static" !== i && "prototype" !== i && "own" !== i) throw new TypeError('An element descriptor\'s .placement property must be one of "static", "prototype" or "own", but a decorator created an element descriptor with .placement "' + i + '"');
        var o = e.descriptor;
        this.disallowProperty(e, "elements", "An element descriptor");
        var n = {
          kind: r,
          key: t,
          placement: i,
          descriptor: Object.assign({}, o)
        };
        return "field" !== r ? this.disallowProperty(e, "initializer", "A method descriptor") : (this.disallowProperty(o, "get", "The property descriptor of a field descriptor"), this.disallowProperty(o, "set", "The property descriptor of a field descriptor"), this.disallowProperty(o, "value", "The property descriptor of a field descriptor"), n.initializer = e.initializer), n;
      },
      toElementFinisherExtras: function (e) {
        return {
          element: this.toElementDescriptor(e),
          finisher: _optionalCallableProperty(e, "finisher"),
          extras: this.toElementDescriptors(e.extras)
        };
      },
      fromClassDescriptor: function (e) {
        var r = {
          kind: "class",
          elements: e.map(this.fromElementDescriptor, this)
        };
        return Object.defineProperty(r, Symbol.toStringTag, {
          value: "Descriptor",
          configurable: !0
        }), r;
      },
      toClassDescriptor: function (e) {
        var r = e.kind + "";
        if ("class" !== r) throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator created a class descriptor with .kind "' + r + '"');
        this.disallowProperty(e, "key", "A class descriptor"), this.disallowProperty(e, "placement", "A class descriptor"), this.disallowProperty(e, "descriptor", "A class descriptor"), this.disallowProperty(e, "initializer", "A class descriptor"), this.disallowProperty(e, "extras", "A class descriptor");
        var t = _optionalCallableProperty(e, "finisher");
        return {
          elements: this.toElementDescriptors(e.elements),
          finisher: t
        };
      },
      runClassFinishers: function (e, r) {
        for (var t = 0; t < r.length; t++) {
          var i = (0, r[t])(e);
          if (void 0 !== i) {
            if ("function" != typeof i) throw new TypeError("Finishers must return a constructor.");
            e = i;
          }
        }
        return e;
      },
      disallowProperty: function (e, r, t) {
        if (void 0 !== e[r]) throw new TypeError(t + " can't have a ." + r + " property.");
      }
    };
    return e;
  }
  function _createElementDescriptor(e) {
    var r,
      t = _toPropertyKey(e.key);
    "method" === e.kind ? r = {
      value: e.value,
      writable: !0,
      configurable: !0,
      enumerable: !1
    } : "get" === e.kind ? r = {
      get: e.value,
      configurable: !0,
      enumerable: !1
    } : "set" === e.kind ? r = {
      set: e.value,
      configurable: !0,
      enumerable: !1
    } : "field" === e.kind && (r = {
      configurable: !0,
      writable: !0,
      enumerable: !0
    });
    var i = {
      kind: "field" === e.kind ? "field" : "method",
      key: t,
      placement: e.static ? "static" : "field" === e.kind ? "own" : "prototype",
      descriptor: r
    };
    return e.decorators && (i.decorators = e.decorators), "field" === e.kind && (i.initializer = e.value), i;
  }
  function _coalesceGetterSetter(e, r) {
    void 0 !== e.descriptor.get ? r.descriptor.get = e.descriptor.get : r.descriptor.set = e.descriptor.set;
  }
  function _coalesceClassElements(e) {
    for (var r = [], isSameElement = function (e) {
        return "method" === e.kind && e.key === o.key && e.placement === o.placement;
      }, t = 0; t < e.length; t++) {
      var i,
        o = e[t];
      if ("method" === o.kind && (i = r.find(isSameElement))) {
        if (_isDataDescriptor(o.descriptor) || _isDataDescriptor(i.descriptor)) {
          if (_hasDecorators(o) || _hasDecorators(i)) throw new ReferenceError("Duplicated methods (" + o.key + ") can't be decorated.");
          i.descriptor = o.descriptor;
        } else {
          if (_hasDecorators(o)) {
            if (_hasDecorators(i)) throw new ReferenceError("Decorators can't be placed on different accessors with for the same property (" + o.key + ").");
            i.decorators = o.decorators;
          }
          _coalesceGetterSetter(o, i);
        }
      } else r.push(o);
    }
    return r;
  }
  function _hasDecorators(e) {
    return e.decorators && e.decorators.length;
  }
  function _isDataDescriptor(e) {
    return void 0 !== e && !(void 0 === e.value && void 0 === e.writable);
  }
  function _optionalCallableProperty(e, r) {
    var t = e[r];
    if (void 0 !== t && "function" != typeof t) throw new TypeError("Expected '" + r + "' to be a function");
    return t;
  }
  function _defaults(e, r) {
    for (var t = Object.getOwnPropertyNames(r), o = 0; o < t.length; o++) {
      var n = t[o],
        a = Object.getOwnPropertyDescriptor(r, n);
      a && a.configurable && void 0 === e[n] && Object.defineProperty(e, n, a);
    }
    return e;
  }
  function _defineAccessor(e, r, n, t) {
    var c = {
      configurable: !0,
      enumerable: !0
    };
    return c[e] = t, Object.defineProperty(r, n, c);
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _extends() {
    return _export("extends", _extends = Object.assign ? Object.assign.bind() : function (n) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e];
        for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
      }
      return n;
    }), _extends.apply(null, arguments);
  }
  function _get() {
    return _export("get", _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) {
      var p = _superPropBase(e, t);
      if (p) {
        var n = Object.getOwnPropertyDescriptor(p, t);
        return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
      }
    }), _get.apply(null, arguments);
  }
  function _getPrototypeOf(t) {
    return _export("getPrototypeOf", _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
      return t.__proto__ || Object.getPrototypeOf(t);
    }), _getPrototypeOf(t);
  }
  function _identity(t) {
    return t;
  }
  function _importDeferProxy(e) {
    var t = null,
      constValue = function (e) {
        return function () {
          return e;
        };
      },
      proxy = function (r) {
        return function (n, o, f) {
          return null === t && (t = e()), r(t, o, f);
        };
      };
    return new Proxy({}, {
      defineProperty: constValue(!1),
      deleteProperty: constValue(!1),
      get: proxy(Reflect.get),
      getOwnPropertyDescriptor: proxy(Reflect.getOwnPropertyDescriptor),
      getPrototypeOf: constValue(null),
      isExtensible: constValue(!1),
      has: proxy(Reflect.has),
      ownKeys: proxy(Reflect.ownKeys),
      preventExtensions: constValue(!0),
      set: constValue(!1),
      setPrototypeOf: constValue(!1)
    });
  }
  function _inherits(t, e) {
    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
    t.prototype = Object.create(e && e.prototype, {
      constructor: {
        value: t,
        writable: !0,
        configurable: !0
      }
    }), Object.defineProperty(t, "prototype", {
      writable: !1
    }), e && _setPrototypeOf(t, e);
  }
  function _inheritsLoose(t, o) {
    t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o);
  }
  function _initializerDefineProperty(e, i, r, l) {
    r && Object.defineProperty(e, i, {
      enumerable: r.enumerable,
      configurable: r.configurable,
      writable: r.writable,
      value: r.initializer ? r.initializer.call(l) : void 0
    });
  }
  function _initializerWarningHelper(r, e) {
    throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.");
  }
  function _instanceof(n, e) {
    return null != e && "undefined" != typeof Symbol && e[Symbol.hasInstance] ? !!e[Symbol.hasInstance](n) : n instanceof e;
  }
  function _interopRequireDefault(e) {
    return e && e.__esModule ? e : {
      default: e
    };
  }
  function _interopRequireWildcard(e, t) {
    if ("function" == typeof WeakMap) var r = new WeakMap(),
      n = new WeakMap();
    return _export("interopRequireWildcard", _interopRequireWildcard = function (e, t) {
      if (!t && e && e.__esModule) return e;
      var o,
        i,
        f = {
          __proto__: null,
          default: e
        };
      if (null === e || "object" != typeof e && "function" != typeof e) return f;
      if (o = t ? n : r) {
        if (o.has(e)) return o.get(e);
        o.set(e, f);
      }
      for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);
      return f;
    })(e, t);
  }
  function _isNativeFunction(t) {
    try {
      return -1 !== Function.toString.call(t).indexOf("[native code]");
    } catch (n) {
      return "function" == typeof t;
    }
  }
  function _isNativeReflectConstruct() {
    try {
      var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    } catch (t) {}
    return _export("isNativeReflectConstruct", _isNativeReflectConstruct = function () {
      return !!t;
    })();
  }
  function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = !0,
        o = !1;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = !1;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = !0, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _jsx(e, r, E, l) {
    REACT_ELEMENT_TYPE || (REACT_ELEMENT_TYPE = "function" == typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103);
    var o = e && e.defaultProps,
      n = arguments.length - 3;
    if (r || 0 === n || (r = {
      children: void 0
    }), 1 === n) r.children = l;else if (n > 1) {
      for (var t = Array(n), f = 0; f < n; f++) t[f] = arguments[f + 3];
      r.children = t;
    }
    if (r && o) for (var i in o) void 0 === r[i] && (r[i] = o[i]);else r || (r = o || {});
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: e,
      key: void 0 === E ? null : "" + E,
      ref: null,
      props: r,
      _owner: null
    };
  }
  function _maybeArrayLike(r, a, e) {
    if (a && !Array.isArray(a) && "number" == typeof a.length) {
      var y = a.length;
      return _arrayLikeToArray(a, void 0 !== e && e < y ? e : y);
    }
    return r(a, e);
  }
  function _newArrowCheck(n, r) {
    if (n !== r) throw new TypeError("Cannot instantiate an arrow function");
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _nullishReceiverError(r) {
    throw new TypeError("Cannot set property of null or undefined.");
  }
  function _objectDestructuringEmpty(t) {
    if (null == t) throw new TypeError("Cannot destructure " + t);
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o,
      r,
      i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  function _possibleConstructorReturn(t, e) {
    if (e && ("object" == typeof e || "function" == typeof e)) return e;
    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
    return _assertThisInitialized(t);
  }
  function _readOnlyError(r) {
    throw new TypeError('"' + r + '" is read-only');
  }
  function _regenerator() {
    /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
    var e,
      t,
      r = "function" == typeof Symbol ? Symbol : {},
      n = r.iterator || "@@iterator",
      o = r.toStringTag || "@@toStringTag";
    function i(r, n, o, i) {
      var c = n && n.prototype instanceof Generator ? n : Generator,
        u = Object.create(c.prototype);
      return _regeneratorDefine(u, "_invoke", function (r, n, o) {
        var i,
          c,
          u,
          f = 0,
          p = o || [],
          y = !1,
          G = {
            p: 0,
            n: 0,
            v: e,
            a: d,
            f: d.bind(e, 4),
            d: function (t, r) {
              return i = t, c = 0, u = e, G.n = r, a;
            }
          };
        function d(r, n) {
          for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
            var o,
              i = p[t],
              d = G.p,
              l = i[2];
            r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
          }
          if (o || r > 1) return a;
          throw y = !0, n;
        }
        return function (o, p, l) {
          if (f > 1) throw TypeError("Generator is already running");
          for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
            i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
            try {
              if (f = 2, i) {
                if (c || (o = "next"), t = i[o]) {
                  if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
                  if (!t.done) return t;
                  u = t.value, c < 2 && (c = 0);
                } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
                i = e;
              } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
            } catch (t) {
              i = e, c = 1, u = t;
            } finally {
              f = 1;
            }
          }
          return {
            value: t,
            done: y
          };
        };
      }(r, o, i), !0), u;
    }
    var a = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    t = Object.getPrototypeOf;
    var c = [][n] ? t(t([][n]())) : (_regeneratorDefine(t = {}, n, function () {
        return this;
      }), t),
      u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
    function f(e) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine(u), _regeneratorDefine(u, o, "Generator"), _regeneratorDefine(u, n, function () {
      return this;
    }), _regeneratorDefine(u, "toString", function () {
      return "[object Generator]";
    }), _export("regenerator", _regenerator = function () {
      return {
        w: i,
        m: f
      };
    })();
  }
  function _regeneratorAsync(n, e, r, t, o) {
    var a = _regeneratorAsyncGen(n, e, r, t, o);
    return a.next().then(function (n) {
      return n.done ? n.value : a.next();
    });
  }
  function _regeneratorAsyncGen(r, e, t, o, n) {
    return new _regeneratorAsyncIterator(_regenerator().w(r, e, t, o), n || Promise);
  }
  function _regeneratorAsyncIterator(t, e) {
    function n(r, o, i, f) {
      try {
        var c = t[r](o),
          u = c.value;
        return u instanceof _OverloadYield ? e.resolve(u.v).then(function (t) {
          n("next", t, i, f);
        }, function (t) {
          n("throw", t, i, f);
        }) : e.resolve(u).then(function (t) {
          c.value = t, i(c);
        }, function (t) {
          return n("throw", t, i, f);
        });
      } catch (t) {
        f(t);
      }
    }
    var r;
    this.next || (_regeneratorDefine(_regeneratorAsyncIterator.prototype), _regeneratorDefine(_regeneratorAsyncIterator.prototype, "function" == typeof Symbol && Symbol.asyncIterator || "@asyncIterator", function () {
      return this;
    })), _regeneratorDefine(this, "_invoke", function (t, o, i) {
      function f() {
        return new e(function (e, r) {
          n(t, i, e, r);
        });
      }
      return r = r ? r.then(f, f) : f();
    }, !0);
  }
  function _regeneratorDefine(e, r, n, t) {
    var i = Object.defineProperty;
    try {
      i({}, "", {});
    } catch (e) {
      i = 0;
    }
    _export("regeneratorDefine", _regeneratorDefine = function (e, r, n, t) {
      function o(r, n) {
        _regeneratorDefine(e, r, function (e) {
          return this._invoke(r, n, e);
        });
      }
      r ? i ? i(e, r, {
        value: n,
        enumerable: !t,
        configurable: !t,
        writable: !t
      }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
    }), _regeneratorDefine(e, r, n, t);
  }
  function _regeneratorKeys(e) {
    var n = Object(e),
      r = [];
    for (var t in n) r.unshift(t);
    return function e() {
      for (; r.length;) if ((t = r.pop()) in n) return e.value = t, e.done = !1, e;
      return e.done = !0, e;
    };
  }
  function _regeneratorValues(e) {
    if (null != e) {
      var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"],
        r = 0;
      if (t) return t.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) return {
        next: function () {
          return e && r >= e.length && (e = void 0), {
            value: e && e[r++],
            done: !e
          };
        }
      };
    }
    throw new TypeError(typeof e + " is not iterable");
  }
  function set(e, r, t, o) {
    return set = "undefined" != typeof Reflect && Reflect.set ? Reflect.set : function (e, r, t, o) {
      var f,
        i = _superPropBase(e, r);
      if (i) {
        if ((f = Object.getOwnPropertyDescriptor(i, r)).set) return f.set.call(o, t), !0;
        if (!f.writable) return !1;
      }
      if (f = Object.getOwnPropertyDescriptor(o, r)) {
        if (!f.writable) return !1;
        f.value = t, Object.defineProperty(o, r, f);
      } else _defineProperty(o, r, t);
      return !0;
    }, set(e, r, t, o);
  }
  function _set(e, r, t, o, f) {
    if (!set(e, r, t, o || e) && f) throw new TypeError("failed to set property");
    return t;
  }
  function _setFunctionName(e, t, n) {
    "symbol" == typeof t && (t = (t = t.description) ? "[" + t + "]" : "");
    try {
      Object.defineProperty(e, "name", {
        configurable: !0,
        value: n ? n + " " + t : t
      });
    } catch (e) {}
    return e;
  }
  function _setPrototypeOf(t, e) {
    return _export("setPrototypeOf", _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
      return t.__proto__ = e, t;
    }), _setPrototypeOf(t, e);
  }
  function _skipFirstGeneratorNext(t) {
    return function () {
      var r = t.apply(this, arguments);
      return r.next(), r;
    };
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _superPropBase(t, o) {
    for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t)););
    return t;
  }
  function _superPropGet(t, o, e, r) {
    var p = _get(_getPrototypeOf(1 & r ? t.prototype : t), o, e);
    return 2 & r && "function" == typeof p ? function (t) {
      return p.apply(e, t);
    } : p;
  }
  function _superPropSet(t, e, o, r, p, f) {
    return _set(_getPrototypeOf(f ? t.prototype : t), e, o, r, p);
  }
  function _taggedTemplateLiteral(e, t) {
    return t || (t = e.slice(0)), Object.freeze(Object.defineProperties(e, {
      raw: {
        value: Object.freeze(t)
      }
    }));
  }
  function _taggedTemplateLiteralLoose(e, t) {
    return t || (t = e.slice(0)), e.raw = t, e;
  }
  function _tdz(e) {
    throw new ReferenceError(e + " is not defined - temporal dead zone");
  }
  function _temporalRef(r, e) {
    return r === _temporalUndefined ? _tdz(e) : r;
  }
  function _temporalUndefined() {}
  function _toArray(r) {
    return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest();
  }
  function _toConsumableArray(r) {
    return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _toSetter(t, e, n) {
    e || (e = []);
    var r = e.length++;
    return Object.defineProperty({}, "_", {
      set: function (o) {
        e[r] = o, t.apply(n, e);
      }
    });
  }
  function _tsRewriteRelativeImportExtensions(t, e) {
    return "string" == typeof t && /^\.\.?\//.test(t) ? t.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+)?)\.([cm]?)ts$/i, function (t, s, r, n, o) {
      return s ? e ? ".jsx" : ".js" : !r || n && o ? r + n + "." + o.toLowerCase() + "js" : t;
    }) : t;
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _export("typeof", _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }), _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function _usingCtx() {
    var r = "function" == typeof SuppressedError ? SuppressedError : function (r, e) {
        var n = Error();
        return n.name = "SuppressedError", n.error = r, n.suppressed = e, n;
      },
      e = {},
      n = [];
    function using(r, e) {
      if (null != e) {
        if (Object(e) !== e) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
        if (r) var o = e[Symbol.asyncDispose || Symbol.for("Symbol.asyncDispose")];
        if (void 0 === o && (o = e[Symbol.dispose || Symbol.for("Symbol.dispose")], r)) var t = o;
        if ("function" != typeof o) throw new TypeError("Object is not disposable.");
        t && (o = function () {
          try {
            t.call(e);
          } catch (r) {
            return Promise.reject(r);
          }
        }), n.push({
          v: e,
          d: o,
          a: r
        });
      } else r && n.push({
        d: e,
        a: r
      });
      return e;
    }
    return {
      e: e,
      u: using.bind(null, !1),
      a: using.bind(null, !0),
      d: function () {
        var o,
          t = this.e,
          s = 0;
        function next() {
          for (; o = n.pop();) try {
            if (!o.a && 1 === s) return s = 0, n.push(o), Promise.resolve().then(next);
            if (o.d) {
              var r = o.d.call(o.v);
              if (o.a) return s |= 2, Promise.resolve(r).then(next, err);
            } else s |= 1;
          } catch (r) {
            return err(r);
          }
          if (1 === s) return t !== e ? Promise.reject(t) : Promise.resolve();
          if (t !== e) throw t;
        }
        function err(n) {
          return t = t !== e ? new r(n, t) : n, next();
        }
        return next();
      }
    };
  }
  function _wrapAsyncGenerator(e) {
    return function () {
      return new AsyncGenerator(e.apply(this, arguments));
    };
  }
  function AsyncGenerator(e) {
    var r, t;
    function resume(r, t) {
      try {
        var n = e[r](t),
          o = n.value,
          u = o instanceof _OverloadYield;
        Promise.resolve(u ? o.v : o).then(function (t) {
          if (u) {
            var i = "return" === r ? "return" : "next";
            if (!o.k || t.done) return resume(i, t);
            t = e[i](t).value;
          }
          settle(n.done ? "return" : "normal", t);
        }, function (e) {
          resume("throw", e);
        });
      } catch (e) {
        settle("throw", e);
      }
    }
    function settle(e, n) {
      switch (e) {
        case "return":
          r.resolve({
            value: n,
            done: !0
          });
          break;
        case "throw":
          r.reject(n);
          break;
        default:
          r.resolve({
            value: n,
            done: !1
          });
      }
      (r = r.next) ? resume(r.key, r.arg) : t = null;
    }
    this._invoke = function (e, n) {
      return new Promise(function (o, u) {
        var i = {
          key: e,
          arg: n,
          resolve: o,
          reject: u,
          next: null
        };
        t ? t = t.next = i : (r = t = i, resume(e, n));
      });
    }, "function" != typeof e.return && (this.return = void 0);
  }
  function _wrapNativeSuper(t) {
    var r = "function" == typeof Map ? new Map() : void 0;
    return _export("wrapNativeSuper", _wrapNativeSuper = function (t) {
      if (null === t || !_isNativeFunction(t)) return t;
      if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== r) {
        if (r.has(t)) return r.get(t);
        r.set(t, Wrapper);
      }
      function Wrapper() {
        return _construct(t, arguments, _getPrototypeOf(this).constructor);
      }
      return Wrapper.prototype = Object.create(t.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), _setPrototypeOf(Wrapper, t);
    }), _wrapNativeSuper(t);
  }
  function _wrapRegExp() {
    _export("wrapRegExp", _wrapRegExp = function (e, r) {
      return new BabelRegExp(e, void 0, r);
    });
    var e = RegExp.prototype,
      r = new WeakMap();
    function BabelRegExp(e, t, p) {
      var o = RegExp(e, t);
      return r.set(o, p || r.get(e)), _setPrototypeOf(o, BabelRegExp.prototype);
    }
    function buildGroups(e, t) {
      var p = r.get(t);
      return Object.keys(p).reduce(function (r, t) {
        var o = p[t];
        if ("number" == typeof o) r[t] = e[o];else {
          for (var i = 0; void 0 === e[o[i]] && i + 1 < o.length;) i++;
          r[t] = e[o[i]];
        }
        return r;
      }, Object.create(null));
    }
    return _inherits(BabelRegExp, RegExp), BabelRegExp.prototype.exec = function (r) {
      var t = e.exec.call(this, r);
      if (t) {
        t.groups = buildGroups(t, this);
        var p = t.indices;
        p && (p.groups = buildGroups(p, this));
      }
      return t;
    }, BabelRegExp.prototype[Symbol.replace] = function (t, p) {
      if ("string" == typeof p) {
        var o = r.get(this);
        return e[Symbol.replace].call(this, t, p.replace(/\$<([^>]+)(>|$)/g, function (e, r, t) {
          if ("" === t) return e;
          var p = o[r];
          return Array.isArray(p) ? "$" + p.join("$") : "number" == typeof p ? "$" + p : "";
        }));
      }
      if ("function" == typeof p) {
        var i = this;
        return e[Symbol.replace].call(this, t, function () {
          var e = arguments;
          return "object" != typeof e[e.length - 1] && (e = [].slice.call(e)).push(buildGroups(e, i)), p.apply(this, e);
        });
      }
      return e[Symbol.replace].call(this, t, p);
    }, _wrapRegExp.apply(this, arguments);
  }
  function _writeOnlyError(r) {
    throw new TypeError('"' + r + '" is write-only');
  }
  function _AwaitValue(t) {
    this.wrapped = t;
  }
  function old_createMetadataMethodsForProperty(e, t, a, r) {
    return {
      getMetadata: function (o) {
        old_assertNotFinished(r, "getMetadata"), old_assertMetadataKey(o);
        var i = e[o];
        if (void 0 !== i) if (1 === t) {
          var n = i.public;
          if (void 0 !== n) return n[a];
        } else if (2 === t) {
          var l = i.private;
          if (void 0 !== l) return l.get(a);
        } else if (Object.hasOwnProperty.call(i, "constructor")) return i.constructor;
      },
      setMetadata: function (o, i) {
        old_assertNotFinished(r, "setMetadata"), old_assertMetadataKey(o);
        var n = e[o];
        if (void 0 === n && (n = e[o] = {}), 1 === t) {
          var l = n.public;
          void 0 === l && (l = n.public = {}), l[a] = i;
        } else if (2 === t) {
          var s = n.priv;
          void 0 === s && (s = n.private = new Map()), s.set(a, i);
        } else n.constructor = i;
      }
    };
  }
  function old_convertMetadataMapToFinal(e, t) {
    var a = e[Symbol.metadata || Symbol.for("Symbol.metadata")],
      r = Object.getOwnPropertySymbols(t);
    if (0 !== r.length) {
      for (var o = 0; o < r.length; o++) {
        var i = r[o],
          n = t[i],
          l = a ? a[i] : null,
          s = n.public,
          c = l ? l.public : null;
        s && c && Object.setPrototypeOf(s, c);
        var d = n.private;
        if (d) {
          var u = Array.from(d.values()),
            f = l ? l.private : null;
          f && (u = u.concat(f)), n.private = u;
        }
        l && Object.setPrototypeOf(n, l);
      }
      a && Object.setPrototypeOf(t, a), e[Symbol.metadata || Symbol.for("Symbol.metadata")] = t;
    }
  }
  function old_createAddInitializerMethod(e, t) {
    return function (a) {
      old_assertNotFinished(t, "addInitializer"), old_assertCallable(a, "An initializer"), e.push(a);
    };
  }
  function old_memberDec(e, t, a, r, o, i, n, l, s) {
    var c;
    switch (i) {
      case 1:
        c = "accessor";
        break;
      case 2:
        c = "method";
        break;
      case 3:
        c = "getter";
        break;
      case 4:
        c = "setter";
        break;
      default:
        c = "field";
    }
    var d,
      u,
      f = {
        kind: c,
        name: l ? "#" + t : _toPropertyKey(t),
        isStatic: n,
        isPrivate: l
      },
      p = {
        v: !1
      };
    if (0 !== i && (f.addInitializer = old_createAddInitializerMethod(o, p)), l) {
      d = 2, u = Symbol(t);
      var v = {};
      0 === i ? (v.get = a.get, v.set = a.set) : 2 === i ? v.get = function () {
        return a.value;
      } : (1 !== i && 3 !== i || (v.get = function () {
        return a.get.call(this);
      }), 1 !== i && 4 !== i || (v.set = function (e) {
        a.set.call(this, e);
      })), f.access = v;
    } else d = 1, u = t;
    try {
      return e(s, Object.assign(f, old_createMetadataMethodsForProperty(r, d, u, p)));
    } finally {
      p.v = !0;
    }
  }
  function old_assertNotFinished(e, t) {
    if (e.v) throw Error("attempted to call " + t + " after decoration was finished");
  }
  function old_assertMetadataKey(e) {
    if ("symbol" != typeof e) throw new TypeError("Metadata keys must be symbols, received: " + e);
  }
  function old_assertCallable(e, t) {
    if ("function" != typeof e) throw new TypeError(t + " must be a function");
  }
  function old_assertValidReturnValue(e, t) {
    var a = typeof t;
    if (1 === e) {
      if ("object" !== a || null === t) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
      void 0 !== t.get && old_assertCallable(t.get, "accessor.get"), void 0 !== t.set && old_assertCallable(t.set, "accessor.set"), void 0 !== t.init && old_assertCallable(t.init, "accessor.init"), void 0 !== t.initializer && old_assertCallable(t.initializer, "accessor.initializer");
    } else if ("function" !== a) throw new TypeError((0 === e ? "field" : 10 === e ? "class" : "method") + " decorators must return a function or void 0");
  }
  function old_getInit(e) {
    var t;
    return null == (t = e.init) && (t = e.initializer) && void 0 !== console && console.warn(".initializer has been renamed to .init as of March 2022"), t;
  }
  function old_applyMemberDec(e, t, a, r, o, i, n, l, s) {
    var c,
      d,
      u,
      f,
      p,
      v,
      y,
      h = a[0];
    if (n ? (0 === o || 1 === o ? (c = {
      get: a[3],
      set: a[4]
    }, u = "get") : 3 === o ? (c = {
      get: a[3]
    }, u = "get") : 4 === o ? (c = {
      set: a[3]
    }, u = "set") : c = {
      value: a[3]
    }, 0 !== o && (1 === o && _setFunctionName(a[4], "#" + r, "set"), _setFunctionName(a[3], "#" + r, u))) : 0 !== o && (c = Object.getOwnPropertyDescriptor(t, r)), 1 === o ? f = {
      get: c.get,
      set: c.set
    } : 2 === o ? f = c.value : 3 === o ? f = c.get : 4 === o && (f = c.set), "function" == typeof h) void 0 !== (p = old_memberDec(h, r, c, l, s, o, i, n, f)) && (old_assertValidReturnValue(o, p), 0 === o ? d = p : 1 === o ? (d = old_getInit(p), v = p.get || f.get, y = p.set || f.set, f = {
      get: v,
      set: y
    }) : f = p);else for (var m = h.length - 1; m >= 0; m--) {
      var b;
      void 0 !== (p = old_memberDec(h[m], r, c, l, s, o, i, n, f)) && (old_assertValidReturnValue(o, p), 0 === o ? b = p : 1 === o ? (b = old_getInit(p), v = p.get || f.get, y = p.set || f.set, f = {
        get: v,
        set: y
      }) : f = p, void 0 !== b && (void 0 === d ? d = b : "function" == typeof d ? d = [d, b] : d.push(b)));
    }
    if (0 === o || 1 === o) {
      if (void 0 === d) d = function (e, t) {
        return t;
      };else if ("function" != typeof d) {
        var g = d;
        d = function (e, t) {
          for (var a = t, r = 0; r < g.length; r++) a = g[r].call(e, a);
          return a;
        };
      } else {
        var _ = d;
        d = function (e, t) {
          return _.call(e, t);
        };
      }
      e.push(d);
    }
    0 !== o && (1 === o ? (c.get = f.get, c.set = f.set) : 2 === o ? c.value = f : 3 === o ? c.get = f : 4 === o && (c.set = f), n ? 1 === o ? (e.push(function (e, t) {
      return f.get.call(e, t);
    }), e.push(function (e, t) {
      return f.set.call(e, t);
    })) : 2 === o ? e.push(f) : e.push(function (e, t) {
      return f.call(e, t);
    }) : Object.defineProperty(t, r, c));
  }
  function old_applyMemberDecs(e, t, a, r, o) {
    for (var i, n, l = new Map(), s = new Map(), c = 0; c < o.length; c++) {
      var d = o[c];
      if (Array.isArray(d)) {
        var u,
          f,
          p,
          v = d[1],
          y = d[2],
          h = d.length > 3,
          m = v >= 5;
        if (m ? (u = t, f = r, 0 != (v -= 5) && (p = n = n || [])) : (u = t.prototype, f = a, 0 !== v && (p = i = i || [])), 0 !== v && !h) {
          var b = m ? s : l,
            g = b.get(y) || 0;
          if (!0 === g || 3 === g && 4 !== v || 4 === g && 3 !== v) throw Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + y);
          !g && v > 2 ? b.set(y, v) : b.set(y, !0);
        }
        old_applyMemberDec(e, u, d, y, v, m, h, f, p);
      }
    }
    old_pushInitializers(e, i), old_pushInitializers(e, n);
  }
  function old_pushInitializers(e, t) {
    t && e.push(function (e) {
      for (var a = 0; a < t.length; a++) t[a].call(e);
      return e;
    });
  }
  function old_applyClassDecs(e, t, a, r) {
    if (r.length > 0) {
      for (var o = [], i = t, n = t.name, l = r.length - 1; l >= 0; l--) {
        var s = {
          v: !1
        };
        try {
          var c = Object.assign({
              kind: "class",
              name: n,
              addInitializer: old_createAddInitializerMethod(o, s)
            }, old_createMetadataMethodsForProperty(a, 0, n, s)),
            d = r[l](i, c);
        } finally {
          s.v = !0;
        }
        void 0 !== d && (old_assertValidReturnValue(10, d), i = d);
      }
      e.push(i, function () {
        for (var e = 0; e < o.length; e++) o[e].call(i);
      });
    }
  }
  function _applyDecs(e, t, a) {
    var r = [],
      o = {},
      i = {};
    return old_applyMemberDecs(r, e, i, o, t), old_convertMetadataMapToFinal(e.prototype, i), old_applyClassDecs(r, e, o, a), old_convertMetadataMapToFinal(e, o), r;
  }
  function applyDecs2203Factory() {
    function createAddInitializerMethod(e, t) {
      return function (r) {
        !function (e) {
          if (e.v) throw Error("attempted to call addInitializer after decoration was finished");
        }(t), assertCallable(r, "An initializer"), e.push(r);
      };
    }
    function memberDec(e, t, r, a, n, i, s, o) {
      var c;
      switch (n) {
        case 1:
          c = "accessor";
          break;
        case 2:
          c = "method";
          break;
        case 3:
          c = "getter";
          break;
        case 4:
          c = "setter";
          break;
        default:
          c = "field";
      }
      var l,
        u,
        f = {
          kind: c,
          name: s ? "#" + t : t,
          static: i,
          private: s
        },
        p = {
          v: !1
        };
      0 !== n && (f.addInitializer = createAddInitializerMethod(a, p)), 0 === n ? s ? (l = r.get, u = r.set) : (l = function () {
        return this[t];
      }, u = function (e) {
        this[t] = e;
      }) : 2 === n ? l = function () {
        return r.value;
      } : (1 !== n && 3 !== n || (l = function () {
        return r.get.call(this);
      }), 1 !== n && 4 !== n || (u = function (e) {
        r.set.call(this, e);
      })), f.access = l && u ? {
        get: l,
        set: u
      } : l ? {
        get: l
      } : {
        set: u
      };
      try {
        return e(o, f);
      } finally {
        p.v = !0;
      }
    }
    function assertCallable(e, t) {
      if ("function" != typeof e) throw new TypeError(t + " must be a function");
    }
    function assertValidReturnValue(e, t) {
      var r = typeof t;
      if (1 === e) {
        if ("object" !== r || null === t) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
        void 0 !== t.get && assertCallable(t.get, "accessor.get"), void 0 !== t.set && assertCallable(t.set, "accessor.set"), void 0 !== t.init && assertCallable(t.init, "accessor.init");
      } else if ("function" !== r) throw new TypeError((0 === e ? "field" : 10 === e ? "class" : "method") + " decorators must return a function or void 0");
    }
    function applyMemberDec(e, t, r, a, n, i, s, o) {
      var c,
        l,
        u,
        f,
        p,
        d,
        h = r[0];
      if (s ? c = 0 === n || 1 === n ? {
        get: r[3],
        set: r[4]
      } : 3 === n ? {
        get: r[3]
      } : 4 === n ? {
        set: r[3]
      } : {
        value: r[3]
      } : 0 !== n && (c = Object.getOwnPropertyDescriptor(t, a)), 1 === n ? u = {
        get: c.get,
        set: c.set
      } : 2 === n ? u = c.value : 3 === n ? u = c.get : 4 === n && (u = c.set), "function" == typeof h) void 0 !== (f = memberDec(h, a, c, o, n, i, s, u)) && (assertValidReturnValue(n, f), 0 === n ? l = f : 1 === n ? (l = f.init, p = f.get || u.get, d = f.set || u.set, u = {
        get: p,
        set: d
      }) : u = f);else for (var v = h.length - 1; v >= 0; v--) {
        var g;
        void 0 !== (f = memberDec(h[v], a, c, o, n, i, s, u)) && (assertValidReturnValue(n, f), 0 === n ? g = f : 1 === n ? (g = f.init, p = f.get || u.get, d = f.set || u.set, u = {
          get: p,
          set: d
        }) : u = f, void 0 !== g && (void 0 === l ? l = g : "function" == typeof l ? l = [l, g] : l.push(g)));
      }
      if (0 === n || 1 === n) {
        if (void 0 === l) l = function (e, t) {
          return t;
        };else if ("function" != typeof l) {
          var y = l;
          l = function (e, t) {
            for (var r = t, a = 0; a < y.length; a++) r = y[a].call(e, r);
            return r;
          };
        } else {
          var m = l;
          l = function (e, t) {
            return m.call(e, t);
          };
        }
        e.push(l);
      }
      0 !== n && (1 === n ? (c.get = u.get, c.set = u.set) : 2 === n ? c.value = u : 3 === n ? c.get = u : 4 === n && (c.set = u), s ? 1 === n ? (e.push(function (e, t) {
        return u.get.call(e, t);
      }), e.push(function (e, t) {
        return u.set.call(e, t);
      })) : 2 === n ? e.push(u) : e.push(function (e, t) {
        return u.call(e, t);
      }) : Object.defineProperty(t, a, c));
    }
    function pushInitializers(e, t) {
      t && e.push(function (e) {
        for (var r = 0; r < t.length; r++) t[r].call(e);
        return e;
      });
    }
    return function (e, t, r) {
      var a = [];
      return function (e, t, r) {
        for (var a, n, i = new Map(), s = new Map(), o = 0; o < r.length; o++) {
          var c = r[o];
          if (Array.isArray(c)) {
            var l,
              u,
              f = c[1],
              p = c[2],
              d = c.length > 3,
              h = f >= 5;
            if (h ? (l = t, 0 != (f -= 5) && (u = n = n || [])) : (l = t.prototype, 0 !== f && (u = a = a || [])), 0 !== f && !d) {
              var v = h ? s : i,
                g = v.get(p) || 0;
              if (!0 === g || 3 === g && 4 !== f || 4 === g && 3 !== f) throw Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + p);
              !g && f > 2 ? v.set(p, f) : v.set(p, !0);
            }
            applyMemberDec(e, l, c, p, f, h, d, u);
          }
        }
        pushInitializers(e, a), pushInitializers(e, n);
      }(a, e, t), function (e, t, r) {
        if (r.length > 0) {
          for (var a = [], n = t, i = t.name, s = r.length - 1; s >= 0; s--) {
            var o = {
              v: !1
            };
            try {
              var c = r[s](n, {
                kind: "class",
                name: i,
                addInitializer: createAddInitializerMethod(a, o)
              });
            } finally {
              o.v = !0;
            }
            void 0 !== c && (assertValidReturnValue(10, c), n = c);
          }
          e.push(n, function () {
            for (var e = 0; e < a.length; e++) a[e].call(n);
          });
        }
      }(a, e, r), a;
    };
  }
  function _applyDecs2203(e, t, r) {
    return (applyDecs2203Impl = applyDecs2203Impl || applyDecs2203Factory())(e, t, r);
  }
  function applyDecs2203RFactory() {
    function createAddInitializerMethod(e, t) {
      return function (r) {
        !function (e) {
          if (e.v) throw Error("attempted to call addInitializer after decoration was finished");
        }(t), assertCallable(r, "An initializer"), e.push(r);
      };
    }
    function memberDec(e, t, r, n, a, i, o, s) {
      var c;
      switch (a) {
        case 1:
          c = "accessor";
          break;
        case 2:
          c = "method";
          break;
        case 3:
          c = "getter";
          break;
        case 4:
          c = "setter";
          break;
        default:
          c = "field";
      }
      var l,
        u,
        f = {
          kind: c,
          name: o ? "#" + t : _toPropertyKey(t),
          static: i,
          private: o
        },
        p = {
          v: !1
        };
      0 !== a && (f.addInitializer = createAddInitializerMethod(n, p)), 0 === a ? o ? (l = r.get, u = r.set) : (l = function () {
        return this[t];
      }, u = function (e) {
        this[t] = e;
      }) : 2 === a ? l = function () {
        return r.value;
      } : (1 !== a && 3 !== a || (l = function () {
        return r.get.call(this);
      }), 1 !== a && 4 !== a || (u = function (e) {
        r.set.call(this, e);
      })), f.access = l && u ? {
        get: l,
        set: u
      } : l ? {
        get: l
      } : {
        set: u
      };
      try {
        return e(s, f);
      } finally {
        p.v = !0;
      }
    }
    function assertCallable(e, t) {
      if ("function" != typeof e) throw new TypeError(t + " must be a function");
    }
    function assertValidReturnValue(e, t) {
      var r = typeof t;
      if (1 === e) {
        if ("object" !== r || null === t) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
        void 0 !== t.get && assertCallable(t.get, "accessor.get"), void 0 !== t.set && assertCallable(t.set, "accessor.set"), void 0 !== t.init && assertCallable(t.init, "accessor.init");
      } else if ("function" !== r) throw new TypeError((0 === e ? "field" : 10 === e ? "class" : "method") + " decorators must return a function or void 0");
    }
    function applyMemberDec(e, t, r, n, a, i, o, s) {
      var c,
        l,
        u,
        f,
        p,
        d,
        h,
        v = r[0];
      if (o ? (0 === a || 1 === a ? (c = {
        get: r[3],
        set: r[4]
      }, u = "get") : 3 === a ? (c = {
        get: r[3]
      }, u = "get") : 4 === a ? (c = {
        set: r[3]
      }, u = "set") : c = {
        value: r[3]
      }, 0 !== a && (1 === a && _setFunctionName(r[4], "#" + n, "set"), _setFunctionName(r[3], "#" + n, u))) : 0 !== a && (c = Object.getOwnPropertyDescriptor(t, n)), 1 === a ? f = {
        get: c.get,
        set: c.set
      } : 2 === a ? f = c.value : 3 === a ? f = c.get : 4 === a && (f = c.set), "function" == typeof v) void 0 !== (p = memberDec(v, n, c, s, a, i, o, f)) && (assertValidReturnValue(a, p), 0 === a ? l = p : 1 === a ? (l = p.init, d = p.get || f.get, h = p.set || f.set, f = {
        get: d,
        set: h
      }) : f = p);else for (var g = v.length - 1; g >= 0; g--) {
        var y;
        void 0 !== (p = memberDec(v[g], n, c, s, a, i, o, f)) && (assertValidReturnValue(a, p), 0 === a ? y = p : 1 === a ? (y = p.init, d = p.get || f.get, h = p.set || f.set, f = {
          get: d,
          set: h
        }) : f = p, void 0 !== y && (void 0 === l ? l = y : "function" == typeof l ? l = [l, y] : l.push(y)));
      }
      if (0 === a || 1 === a) {
        if (void 0 === l) l = function (e, t) {
          return t;
        };else if ("function" != typeof l) {
          var m = l;
          l = function (e, t) {
            for (var r = t, n = 0; n < m.length; n++) r = m[n].call(e, r);
            return r;
          };
        } else {
          var b = l;
          l = function (e, t) {
            return b.call(e, t);
          };
        }
        e.push(l);
      }
      0 !== a && (1 === a ? (c.get = f.get, c.set = f.set) : 2 === a ? c.value = f : 3 === a ? c.get = f : 4 === a && (c.set = f), o ? 1 === a ? (e.push(function (e, t) {
        return f.get.call(e, t);
      }), e.push(function (e, t) {
        return f.set.call(e, t);
      })) : 2 === a ? e.push(f) : e.push(function (e, t) {
        return f.call(e, t);
      }) : Object.defineProperty(t, n, c));
    }
    function applyMemberDecs(e, t) {
      for (var r, n, a = [], i = new Map(), o = new Map(), s = 0; s < t.length; s++) {
        var c = t[s];
        if (Array.isArray(c)) {
          var l,
            u,
            f = c[1],
            p = c[2],
            d = c.length > 3,
            h = f >= 5;
          if (h ? (l = e, 0 != (f -= 5) && (u = n = n || [])) : (l = e.prototype, 0 !== f && (u = r = r || [])), 0 !== f && !d) {
            var v = h ? o : i,
              g = v.get(p) || 0;
            if (!0 === g || 3 === g && 4 !== f || 4 === g && 3 !== f) throw Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + p);
            !g && f > 2 ? v.set(p, f) : v.set(p, !0);
          }
          applyMemberDec(a, l, c, p, f, h, d, u);
        }
      }
      return pushInitializers(a, r), pushInitializers(a, n), a;
    }
    function pushInitializers(e, t) {
      t && e.push(function (e) {
        for (var r = 0; r < t.length; r++) t[r].call(e);
        return e;
      });
    }
    return function (e, t, r) {
      return {
        e: applyMemberDecs(e, t),
        get c() {
          return function (e, t) {
            if (t.length > 0) {
              for (var r = [], n = e, a = e.name, i = t.length - 1; i >= 0; i--) {
                var o = {
                  v: !1
                };
                try {
                  var s = t[i](n, {
                    kind: "class",
                    name: a,
                    addInitializer: createAddInitializerMethod(r, o)
                  });
                } finally {
                  o.v = !0;
                }
                void 0 !== s && (assertValidReturnValue(10, s), n = s);
              }
              return [n, function () {
                for (var e = 0; e < r.length; e++) r[e].call(n);
              }];
            }
          }(e, r);
        }
      };
    };
  }
  function _applyDecs2203R(e, t, r) {
    return _export("applyDecs2203R", _applyDecs2203R = applyDecs2203RFactory())(e, t, r);
  }
  function applyDecs2301Factory() {
    function createAddInitializerMethod(e, t) {
      return function (r) {
        !function (e) {
          if (e.v) throw Error("attempted to call addInitializer after decoration was finished");
        }(t), assertCallable(r, "An initializer"), e.push(r);
      };
    }
    function assertInstanceIfPrivate(e, t) {
      if (!e(t)) throw new TypeError("Attempted to access private element on non-instance");
    }
    function memberDec(e, t, r, n, a, i, s, o, c) {
      var u;
      switch (a) {
        case 1:
          u = "accessor";
          break;
        case 2:
          u = "method";
          break;
        case 3:
          u = "getter";
          break;
        case 4:
          u = "setter";
          break;
        default:
          u = "field";
      }
      var l,
        f,
        p = {
          kind: u,
          name: s ? "#" + t : _toPropertyKey(t),
          static: i,
          private: s
        },
        d = {
          v: !1
        };
      if (0 !== a && (p.addInitializer = createAddInitializerMethod(n, d)), s || 0 !== a && 2 !== a) {
        if (2 === a) l = function (e) {
          return assertInstanceIfPrivate(c, e), r.value;
        };else {
          var h = 0 === a || 1 === a;
          (h || 3 === a) && (l = s ? function (e) {
            return assertInstanceIfPrivate(c, e), r.get.call(e);
          } : function (e) {
            return r.get.call(e);
          }), (h || 4 === a) && (f = s ? function (e, t) {
            assertInstanceIfPrivate(c, e), r.set.call(e, t);
          } : function (e, t) {
            r.set.call(e, t);
          });
        }
      } else l = function (e) {
        return e[t];
      }, 0 === a && (f = function (e, r) {
        e[t] = r;
      });
      var v = s ? c.bind() : function (e) {
        return t in e;
      };
      p.access = l && f ? {
        get: l,
        set: f,
        has: v
      } : l ? {
        get: l,
        has: v
      } : {
        set: f,
        has: v
      };
      try {
        return e(o, p);
      } finally {
        d.v = !0;
      }
    }
    function assertCallable(e, t) {
      if ("function" != typeof e) throw new TypeError(t + " must be a function");
    }
    function assertValidReturnValue(e, t) {
      var r = typeof t;
      if (1 === e) {
        if ("object" !== r || null === t) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
        void 0 !== t.get && assertCallable(t.get, "accessor.get"), void 0 !== t.set && assertCallable(t.set, "accessor.set"), void 0 !== t.init && assertCallable(t.init, "accessor.init");
      } else if ("function" !== r) throw new TypeError((0 === e ? "field" : 10 === e ? "class" : "method") + " decorators must return a function or void 0");
    }
    function curryThis2(e) {
      return function (t) {
        e(this, t);
      };
    }
    function applyMemberDec(e, t, r, n, a, i, s, o, c) {
      var u,
        l,
        f,
        p,
        d,
        h,
        v,
        y,
        g = r[0];
      if (s ? (0 === a || 1 === a ? (u = {
        get: (d = r[3], function () {
          return d(this);
        }),
        set: curryThis2(r[4])
      }, f = "get") : 3 === a ? (u = {
        get: r[3]
      }, f = "get") : 4 === a ? (u = {
        set: r[3]
      }, f = "set") : u = {
        value: r[3]
      }, 0 !== a && (1 === a && _setFunctionName(u.set, "#" + n, "set"), _setFunctionName(u[f || "value"], "#" + n, f))) : 0 !== a && (u = Object.getOwnPropertyDescriptor(t, n)), 1 === a ? p = {
        get: u.get,
        set: u.set
      } : 2 === a ? p = u.value : 3 === a ? p = u.get : 4 === a && (p = u.set), "function" == typeof g) void 0 !== (h = memberDec(g, n, u, o, a, i, s, p, c)) && (assertValidReturnValue(a, h), 0 === a ? l = h : 1 === a ? (l = h.init, v = h.get || p.get, y = h.set || p.set, p = {
        get: v,
        set: y
      }) : p = h);else for (var m = g.length - 1; m >= 0; m--) {
        var b;
        void 0 !== (h = memberDec(g[m], n, u, o, a, i, s, p, c)) && (assertValidReturnValue(a, h), 0 === a ? b = h : 1 === a ? (b = h.init, v = h.get || p.get, y = h.set || p.set, p = {
          get: v,
          set: y
        }) : p = h, void 0 !== b && (void 0 === l ? l = b : "function" == typeof l ? l = [l, b] : l.push(b)));
      }
      if (0 === a || 1 === a) {
        if (void 0 === l) l = function (e, t) {
          return t;
        };else if ("function" != typeof l) {
          var I = l;
          l = function (e, t) {
            for (var r = t, n = 0; n < I.length; n++) r = I[n].call(e, r);
            return r;
          };
        } else {
          var w = l;
          l = function (e, t) {
            return w.call(e, t);
          };
        }
        e.push(l);
      }
      0 !== a && (1 === a ? (u.get = p.get, u.set = p.set) : 2 === a ? u.value = p : 3 === a ? u.get = p : 4 === a && (u.set = p), s ? 1 === a ? (e.push(function (e, t) {
        return p.get.call(e, t);
      }), e.push(function (e, t) {
        return p.set.call(e, t);
      })) : 2 === a ? e.push(p) : e.push(function (e, t) {
        return p.call(e, t);
      }) : Object.defineProperty(t, n, u));
    }
    function applyMemberDecs(e, t, r) {
      for (var n, a, i, s = [], o = new Map(), c = new Map(), u = 0; u < t.length; u++) {
        var l = t[u];
        if (Array.isArray(l)) {
          var f,
            p,
            d = l[1],
            h = l[2],
            v = l.length > 3,
            y = d >= 5,
            g = r;
          if (y ? (f = e, 0 != (d -= 5) && (p = a = a || []), v && !i && (i = function (t) {
            return _checkInRHS(t) === e;
          }), g = i) : (f = e.prototype, 0 !== d && (p = n = n || [])), 0 !== d && !v) {
            var m = y ? c : o,
              b = m.get(h) || 0;
            if (!0 === b || 3 === b && 4 !== d || 4 === b && 3 !== d) throw Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + h);
            !b && d > 2 ? m.set(h, d) : m.set(h, !0);
          }
          applyMemberDec(s, f, l, h, d, y, v, p, g);
        }
      }
      return pushInitializers(s, n), pushInitializers(s, a), s;
    }
    function pushInitializers(e, t) {
      t && e.push(function (e) {
        for (var r = 0; r < t.length; r++) t[r].call(e);
        return e;
      });
    }
    return function (e, t, r, n) {
      return {
        e: applyMemberDecs(e, t, n),
        get c() {
          return function (e, t) {
            if (t.length > 0) {
              for (var r = [], n = e, a = e.name, i = t.length - 1; i >= 0; i--) {
                var s = {
                  v: !1
                };
                try {
                  var o = t[i](n, {
                    kind: "class",
                    name: a,
                    addInitializer: createAddInitializerMethod(r, s)
                  });
                } finally {
                  s.v = !0;
                }
                void 0 !== o && (assertValidReturnValue(10, o), n = o);
              }
              return [n, function () {
                for (var e = 0; e < r.length; e++) r[e].call(n);
              }];
            }
          }(e, r);
        }
      };
    };
  }
  function _applyDecs2301(e, t, r, n) {
    return _export("applyDecs2301", _applyDecs2301 = applyDecs2301Factory())(e, t, r, n);
  }
  function _applyDecs2305(e, t, r, n, o, a) {
    function i(e, t, r) {
      return function (n, o) {
        return r && r(n), e[t].call(n, o);
      };
    }
    function c(e, t) {
      for (var r = 0; r < e.length; r++) e[r].call(t);
      return t;
    }
    function s(e, t, r, n) {
      if ("function" != typeof e && (n || void 0 !== e)) throw new TypeError(t + " must " + (r || "be") + " a function" + (n ? "" : " or undefined"));
      return e;
    }
    function applyDec(e, t, r, n, o, a, c, u, l, f, p, d, h) {
      function m(e) {
        if (!h(e)) throw new TypeError("Attempted to access private element on non-instance");
      }
      var y,
        v = t[0],
        g = t[3],
        b = !u;
      if (!b) {
        r || Array.isArray(v) || (v = [v]);
        var w = {},
          S = [],
          A = 3 === o ? "get" : 4 === o || d ? "set" : "value";
        f ? (p || d ? w = {
          get: _setFunctionName(function () {
            return g(this);
          }, n, "get"),
          set: function (e) {
            t[4](this, e);
          }
        } : w[A] = g, p || _setFunctionName(w[A], n, 2 === o ? "" : A)) : p || (w = Object.getOwnPropertyDescriptor(e, n));
      }
      for (var P = e, j = v.length - 1; j >= 0; j -= r ? 2 : 1) {
        var D = v[j],
          E = r ? v[j - 1] : void 0,
          I = {},
          O = {
            kind: ["field", "accessor", "method", "getter", "setter", "class"][o],
            name: n,
            metadata: a,
            addInitializer: function (e, t) {
              if (e.v) throw Error("attempted to call addInitializer after decoration was finished");
              s(t, "An initializer", "be", !0), c.push(t);
            }.bind(null, I)
          };
        try {
          if (b) (y = s(D.call(E, P, O), "class decorators", "return")) && (P = y);else {
            var k, F;
            O.static = l, O.private = f, f ? 2 === o ? k = function (e) {
              return m(e), w.value;
            } : (o < 4 && (k = i(w, "get", m)), 3 !== o && (F = i(w, "set", m))) : (k = function (e) {
              return e[n];
            }, (o < 2 || 4 === o) && (F = function (e, t) {
              e[n] = t;
            }));
            var N = O.access = {
              has: f ? h.bind() : function (e) {
                return n in e;
              }
            };
            if (k && (N.get = k), F && (N.set = F), P = D.call(E, d ? {
              get: w.get,
              set: w.set
            } : w[A], O), d) {
              if ("object" == typeof P && P) (y = s(P.get, "accessor.get")) && (w.get = y), (y = s(P.set, "accessor.set")) && (w.set = y), (y = s(P.init, "accessor.init")) && S.push(y);else if (void 0 !== P) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
            } else s(P, (p ? "field" : "method") + " decorators", "return") && (p ? S.push(P) : w[A] = P);
          }
        } finally {
          I.v = !0;
        }
      }
      return (p || d) && u.push(function (e, t) {
        for (var r = S.length - 1; r >= 0; r--) t = S[r].call(e, t);
        return t;
      }), p || b || (f ? d ? u.push(i(w, "get"), i(w, "set")) : u.push(2 === o ? w[A] : i.call.bind(w[A])) : Object.defineProperty(e, n, w)), P;
    }
    function u(e, t) {
      return Object.defineProperty(e, Symbol.metadata || Symbol.for("Symbol.metadata"), {
        configurable: !0,
        enumerable: !0,
        value: t
      });
    }
    if (arguments.length >= 6) var l = a[Symbol.metadata || Symbol.for("Symbol.metadata")];
    var f = Object.create(null == l ? null : l),
      p = function (e, t, r, n) {
        var o,
          a,
          i = [],
          s = function (t) {
            return _checkInRHS(t) === e;
          },
          u = new Map();
        function l(e) {
          e && i.push(c.bind(null, e));
        }
        for (var f = 0; f < t.length; f++) {
          var p = t[f];
          if (Array.isArray(p)) {
            var d = p[1],
              h = p[2],
              m = p.length > 3,
              y = 16 & d,
              v = !!(8 & d),
              g = 0 == (d &= 7),
              b = h + "/" + v;
            if (!g && !m) {
              var w = u.get(b);
              if (!0 === w || 3 === w && 4 !== d || 4 === w && 3 !== d) throw Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + h);
              u.set(b, !(d > 2) || d);
            }
            applyDec(v ? e : e.prototype, p, y, m ? "#" + h : _toPropertyKey(h), d, n, v ? a = a || [] : o = o || [], i, v, m, g, 1 === d, v && m ? s : r);
          }
        }
        return l(o), l(a), i;
      }(e, t, o, f);
    return r.length || u(e, f), {
      e: p,
      get c() {
        var t = [];
        return r.length && [u(applyDec(e, [r], n, e.name, 5, f, t), f), c.bind(null, t, e)];
      }
    };
  }
  function _classApplyDescriptorDestructureSet(e, t) {
    if (t.set) return "__destrObj" in t || (t.__destrObj = {
      set value(r) {
        t.set.call(e, r);
      }
    }), t.__destrObj;
    if (!t.writable) throw new TypeError("attempted to set read only private field");
    return t;
  }
  function _classApplyDescriptorGet(e, t) {
    return t.get ? t.get.call(e) : t.value;
  }
  function _classApplyDescriptorSet(e, t, l) {
    if (t.set) t.set.call(e, l);else {
      if (!t.writable) throw new TypeError("attempted to set read only private field");
      t.value = l;
    }
  }
  function _classCheckPrivateStaticAccess(s, a, r) {
    return _assertClassBrand(a, s, r);
  }
  function _classCheckPrivateStaticFieldDescriptor(t, e) {
    if (void 0 === t) throw new TypeError("attempted to " + e + " private static field before its declaration");
  }
  function _classExtractFieldDescriptor(e, t) {
    return _classPrivateFieldGet2(t, e);
  }
  function _classPrivateFieldDestructureSet(e, t) {
    var r = _classPrivateFieldGet2(t, e);
    return _classApplyDescriptorDestructureSet(e, r);
  }
  function _classPrivateFieldGet(e, t) {
    var r = _classPrivateFieldGet2(t, e);
    return _classApplyDescriptorGet(e, r);
  }
  function _classPrivateFieldSet(e, t, r) {
    var s = _classPrivateFieldGet2(t, e);
    return _classApplyDescriptorSet(e, s, r), r;
  }
  function _classPrivateMethodGet(s, a, r) {
    return _assertClassBrand(a, s), r;
  }
  function _classPrivateMethodSet() {
    throw new TypeError("attempted to reassign private method");
  }
  function _classStaticPrivateFieldDestructureSet(t, r, s) {
    return _assertClassBrand(r, t), _classCheckPrivateStaticFieldDescriptor(s, "set"), _classApplyDescriptorDestructureSet(t, s);
  }
  function _classStaticPrivateFieldSpecGet(t, s, r) {
    return _assertClassBrand(s, t), _classCheckPrivateStaticFieldDescriptor(r, "get"), _classApplyDescriptorGet(t, r);
  }
  function _classStaticPrivateFieldSpecSet(s, t, r, e) {
    return _assertClassBrand(t, s), _classCheckPrivateStaticFieldDescriptor(r, "set"), _classApplyDescriptorSet(s, r, e), e;
  }
  function _classStaticPrivateMethodSet() {
    throw new TypeError("attempted to set read only static private field");
  }
  function _defineEnumerableProperties(e, r) {
    for (var t in r) {
      var n = r[t];
      n.configurable = n.enumerable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, t, n);
    }
    if (Object.getOwnPropertySymbols) for (var a = Object.getOwnPropertySymbols(r), b = 0; b < a.length; b++) {
      var i = a[b];
      (n = r[i]).configurable = n.enumerable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, i, n);
    }
    return e;
  }
  function dispose_SuppressedError(r, e) {
    return "undefined" != typeof SuppressedError ? dispose_SuppressedError = SuppressedError : (dispose_SuppressedError = function (r, e) {
      this.suppressed = e, this.error = r, this.stack = Error().stack;
    }, dispose_SuppressedError.prototype = Object.create(Error.prototype, {
      constructor: {
        value: dispose_SuppressedError,
        writable: !0,
        configurable: !0
      }
    })), new dispose_SuppressedError(r, e);
  }
  function _dispose(r, e, s) {
    function next() {
      for (; r.length > 0;) try {
        var o = r.pop(),
          p = o.d.call(o.v);
        if (o.a) return Promise.resolve(p).then(next, err);
      } catch (r) {
        return err(r);
      }
      if (s) throw e;
    }
    function err(r) {
      return e = s ? new dispose_SuppressedError(e, r) : r, s = !0, next();
    }
    return next();
  }
  function _objectSpread(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? Object(arguments[r]) : {},
        o = Object.keys(t);
      "function" == typeof Object.getOwnPropertySymbols && o.push.apply(o, Object.getOwnPropertySymbols(t).filter(function (e) {
        return Object.getOwnPropertyDescriptor(t, e).enumerable;
      })), o.forEach(function (r) {
        _defineProperty(e, r, t[r]);
      });
    }
    return e;
  }
  function _regeneratorRuntime() {
    "use strict";

    var r = _regenerator(),
      e = r.m(_regeneratorRuntime),
      t = (Object.getPrototypeOf ? Object.getPrototypeOf(e) : e.__proto__).constructor;
    function n(r) {
      var e = "function" == typeof r && r.constructor;
      return !!e && (e === t || "GeneratorFunction" === (e.displayName || e.name));
    }
    var o = {
      throw: 1,
      return: 2,
      break: 3,
      continue: 3
    };
    function a(r) {
      var e, t;
      return function (n) {
        e || (e = {
          stop: function () {
            return t(n.a, 2);
          },
          catch: function () {
            return n.v;
          },
          abrupt: function (r, e) {
            return t(n.a, o[r], e);
          },
          delegateYield: function (r, o, a) {
            return e.resultName = o, t(n.d, _regeneratorValues(r), a);
          },
          finish: function (r) {
            return t(n.f, r);
          }
        }, t = function (r, t, o) {
          n.p = e.prev, n.n = e.next;
          try {
            return r(t, o);
          } finally {
            e.next = n.n;
          }
        }), e.resultName && (e[e.resultName] = n.v, e.resultName = void 0), e.sent = n.v, e.next = n.n;
        try {
          return r.call(this, e);
        } finally {
          n.p = e.prev, n.n = e.next;
        }
      };
    }
    return _export("regeneratorRuntime", _regeneratorRuntime = function () {
      return {
        wrap: function (e, t, n, o) {
          return r.w(a(e), t, n, o && o.reverse());
        },
        isGeneratorFunction: n,
        mark: r.m,
        awrap: function (r, e) {
          return new _OverloadYield(r, e);
        },
        AsyncIterator: _regeneratorAsyncIterator,
        async: function (r, e, t, o, u) {
          return (n(e) ? _regeneratorAsyncGen : _regeneratorAsync)(a(r), e, t, o, u);
        },
        keys: _regeneratorKeys,
        values: _regeneratorValues
      };
    })();
  }
  function _using(o, n, e) {
    if (null == n) return n;
    if (Object(n) !== n) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
    if (e) var r = n[Symbol.asyncDispose || Symbol.for("Symbol.asyncDispose")];
    if (null == r && (r = n[Symbol.dispose || Symbol.for("Symbol.dispose")]), "function" != typeof r) throw new TypeError("Property [Symbol.dispose] is not a function.");
    return o.push({
      v: n,
      d: r,
      a: e
    }), n;
  }
  _export({
    OverloadYield: _OverloadYield,
    applyDecoratedDescriptor: _applyDecoratedDescriptor,
    applyDecs2311: _applyDecs2311,
    arrayLikeToArray: _arrayLikeToArray,
    arrayWithHoles: _arrayWithHoles,
    arrayWithoutHoles: _arrayWithoutHoles,
    assertClassBrand: _assertClassBrand,
    assertThisInitialized: _assertThisInitialized,
    asyncGeneratorDelegate: _asyncGeneratorDelegate,
    asyncIterator: _asyncIterator,
    asyncToGenerator: _asyncToGenerator,
    awaitAsyncGenerator: _awaitAsyncGenerator,
    callSuper: _callSuper,
    checkInRHS: _checkInRHS,
    checkPrivateRedeclaration: _checkPrivateRedeclaration,
    classCallCheck: _classCallCheck,
    classNameTDZError: _classNameTDZError,
    classPrivateFieldGet2: _classPrivateFieldGet2,
    classPrivateFieldInitSpec: _classPrivateFieldInitSpec,
    classPrivateFieldLooseBase: _classPrivateFieldLooseBase,
    classPrivateFieldLooseKey: _classPrivateFieldLooseKey,
    classPrivateFieldSet2: _classPrivateFieldSet2,
    classPrivateGetter: _classPrivateGetter,
    classPrivateMethodInitSpec: _classPrivateMethodInitSpec,
    classPrivateSetter: _classPrivateSetter,
    classStaticPrivateMethodGet: _classStaticPrivateMethodGet,
    construct: _construct,
    createClass: _createClass,
    createForOfIteratorHelper: _createForOfIteratorHelper,
    createForOfIteratorHelperLoose: _createForOfIteratorHelperLoose,
    createSuper: _createSuper,
    decorate: _decorate,
    defaults: _defaults,
    defineAccessor: _defineAccessor,
    defineProperty: _defineProperty,
    extends: _extends,
    get: _get,
    getPrototypeOf: _getPrototypeOf,
    identity: _identity,
    importDeferProxy: _importDeferProxy,
    inherits: _inherits,
    inheritsLoose: _inheritsLoose,
    initializerDefineProperty: _initializerDefineProperty,
    initializerWarningHelper: _initializerWarningHelper,
    instanceof: _instanceof,
    interopRequireDefault: _interopRequireDefault,
    interopRequireWildcard: _interopRequireWildcard,
    isNativeFunction: _isNativeFunction,
    isNativeReflectConstruct: _isNativeReflectConstruct,
    iterableToArray: _iterableToArray,
    iterableToArrayLimit: _iterableToArrayLimit,
    jsx: _jsx,
    maybeArrayLike: _maybeArrayLike,
    newArrowCheck: _newArrowCheck,
    nonIterableRest: _nonIterableRest,
    nonIterableSpread: _nonIterableSpread,
    nullishReceiverError: _nullishReceiverError,
    objectDestructuringEmpty: _objectDestructuringEmpty,
    objectSpread2: _objectSpread2,
    objectWithoutProperties: _objectWithoutProperties,
    objectWithoutPropertiesLoose: _objectWithoutPropertiesLoose,
    possibleConstructorReturn: _possibleConstructorReturn,
    readOnlyError: _readOnlyError,
    regenerator: _regenerator,
    regeneratorAsync: _regeneratorAsync,
    regeneratorAsyncGen: _regeneratorAsyncGen,
    regeneratorAsyncIterator: _regeneratorAsyncIterator,
    regeneratorDefine: _regeneratorDefine,
    regeneratorKeys: _regeneratorKeys,
    regeneratorValues: _regeneratorValues,
    set: _set,
    setFunctionName: _setFunctionName,
    setPrototypeOf: _setPrototypeOf,
    skipFirstGeneratorNext: _skipFirstGeneratorNext,
    slicedToArray: _slicedToArray,
    superPropBase: _superPropBase,
    superPropGet: _superPropGet,
    superPropSet: _superPropSet,
    taggedTemplateLiteral: _taggedTemplateLiteral,
    taggedTemplateLiteralLoose: _taggedTemplateLiteralLoose,
    tdz: _tdz,
    temporalRef: _temporalRef,
    temporalUndefined: _temporalUndefined,
    toArray: _toArray,
    toConsumableArray: _toConsumableArray,
    toPrimitive: _toPrimitive,
    toPropertyKey: _toPropertyKey,
    toSetter: _toSetter,
    tsRewriteRelativeImportExtensions: _tsRewriteRelativeImportExtensions,
    typeof: _typeof,
    unsupportedIterableToArray: _unsupportedIterableToArray,
    usingCtx: _usingCtx,
    wrapAsyncGenerator: _wrapAsyncGenerator,
    wrapNativeSuper: _wrapNativeSuper,
    wrapRegExp: _wrapRegExp,
    writeOnlyError: _writeOnlyError,
    AwaitValue: _AwaitValue,
    applyDecs: _applyDecs,
    applyDecs2203: _applyDecs2203,
    applyDecs2203R: _applyDecs2203R,
    applyDecs2301: _applyDecs2301,
    applyDecs2305: _applyDecs2305,
    classApplyDescriptorDestructureSet: _classApplyDescriptorDestructureSet,
    classApplyDescriptorGet: _classApplyDescriptorGet,
    classApplyDescriptorSet: _classApplyDescriptorSet,
    classCheckPrivateStaticAccess: _classCheckPrivateStaticAccess,
    classCheckPrivateStaticFieldDescriptor: _classCheckPrivateStaticFieldDescriptor,
    classExtractFieldDescriptor: _classExtractFieldDescriptor,
    classPrivateFieldDestructureSet: _classPrivateFieldDestructureSet,
    classPrivateFieldGet: _classPrivateFieldGet,
    classPrivateFieldSet: _classPrivateFieldSet,
    classPrivateMethodGet: _classPrivateMethodGet,
    classPrivateMethodSet: _classPrivateMethodSet,
    classStaticPrivateFieldDestructureSet: _classStaticPrivateFieldDestructureSet,
    classStaticPrivateFieldSpecGet: _classStaticPrivateFieldSpecGet,
    classStaticPrivateFieldSpecSet: _classStaticPrivateFieldSpecSet,
    classStaticPrivateMethodSet: _classStaticPrivateMethodSet,
    defineEnumerableProperties: _defineEnumerableProperties,
    dispose: _dispose,
    objectSpread: _objectSpread,
    regeneratorRuntime: _regeneratorRuntime,
    using: _using
  });
  return {
    setters: [],
    execute: function () {
      id = 0;
      AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function () {
        return this;
      }, AsyncGenerator.prototype.next = function (e) {
        return this._invoke("next", e);
      }, AsyncGenerator.prototype.throw = function (e) {
        return this._invoke("throw", e);
      }, AsyncGenerator.prototype.return = function (e) {
        return this._invoke("return", e);
      };
    }
  };
});