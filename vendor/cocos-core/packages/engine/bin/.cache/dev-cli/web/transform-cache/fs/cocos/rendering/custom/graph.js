System.register("q-bundled:///fs/cocos/rendering/custom/graph.js", [], function (_export, _context) {
  "use strict";

  var ED, EPD, OutE, OutEP, OutEI, OutEPI, InEI, InEPI, AdjI, AdjPI, NoTermination, VertexInfo, DefaultVisitor, ReferenceGraphView, directional, parallel, traversal, GraphColor;
  //--------------------------------------------------------------------------
  // Help Functions
  //--------------------------------------------------------------------------
  function reindexEdgeList(el, u) {
    for (const e of el) {
      if (e.target > u) {
        --e.target;
      }
    }
  }
  function removeAllEdgesFromList(edges, el, v) {
    const sz = el.length;
    for (let i = 0; i !== sz; ++i) {
      const oe = el[i];
      if (oe.target === v) {
        // NOTE: Wihtout this skip, this loop will double-delete
        // properties of loop edges. This solution is based on the
        // observation that the incidence edges of a vertex with a loop
        // are adjacent in the out edge list. This *may* actually hold
        // for multisets also.
        const skip = i + 1 !== sz && oe.edge === el[i + 1].edge;
        edges.delete(oe.edge);
        if (skip) {
          ++i;
        }
      }
    }
  }
  function getPath(g, v) {
    if (v === g.N) {
      return '';
    }
    const paths = [];
    for (; v !== g.N; v = g.getParent(v)) {
      paths.push(g.vertexName(v));
    }
    let path = '';
    for (let i = paths.length; i-- > 0;) {
      path += '/';
      path += paths[i];
    }
    return path;
  }
  function findRelative(g, v, path) {
    const pseudo = g.N;
    const names = path.split('/');
    if (names.length === 0) {
      // empty string
      return v;
    }
    let curr = v;
    let start = 0;
    if (names[0] === '') {
      // absolute path
      // reset v to pseudo root
      curr = pseudo;
      // skip pseudo root
      ++start;
    }
    // locating begins
    for (let i = start; i !== names.length; ++i) {
      const name = names[i];
      if (name === '') {
        // empty name, do nothing
        continue;
      }
      if (name === '.') {
        // current node, do nothing
        continue;
      }
      if (name === '..') {
        // parent node
        if (curr === pseudo) {
          // current node is pseudo already, return not found
          return pseudo;
        }
        curr = g.getParent(curr);
        continue;
      }
      curr = g.locateChild(curr, name);
      if (curr === pseudo) {
        // child not found
        return pseudo;
      }
    }
    return curr;
  }

  //=======================================================================
  // DFS
  // Based on boost/graph/depth_first_search.hpp
  //=======================================================================

  //=======================================================================
  // Copyright 1997, 1998, 1999, 2000 University of Notre Dame.
  // Copyright 2003 Bruce Barr
  // Authors: Andrew Lumsdaine, Lie-Quan Lee, Jeremy G. Siek
  //
  // Distributed under the Boost Software License, Version 1.0. (See
  // accompanying file LICENSE_1_0.txt or copy at
  // http://www.boost.org/LICENSE_1_0.txt)
  //=======================================================================

  function getDefaultStartingVertex(g) {
    const iter = g.v();
    const v = iter.next();
    if (v.done) {
      return g.N;
    } else {
      return v.value;
    }
  }
  function depthFirstVisitImpl(g, u, visitor, color, func) {
    let srcE = null;
    let ei = null;
    const stack = new Array();
    color.put(u, GraphColor.GRAY);
    visitor.discoverVertex(u, g);
    ei = g.oe(u);
    if (func.terminate(u, g)) {
      // If this vertex terminates the search, we push empty range
      stack.push(new VertexInfo(u, null, null));
    } else {
      stack.push(new VertexInfo(u, null, ei));
    }
    while (stack.length) {
      const back = stack.pop();
      u = back.v;
      srcE = back.e;
      ei = back.iter;
      // finish_edge has to be called here, not after the
      // loop. Think of the pop as the return from a recursive call.
      if (srcE !== null) {
        visitor.finishEdge(srcE, g);
      }
      if (ei) {
        // has out edges
        for (let ev = ei.next(); !ev.done; ev = ei.next()) {
          const e = ev.value;
          const v = e.target;
          visitor.examineEdge(e, g);
          const vColor = color.get(v);
          if (vColor === GraphColor.WHITE) {
            visitor.treeEdge(e, g);
            srcE = e;
            stack.push(new VertexInfo(u, srcE, ei));
            u = v;
            color.put(u, GraphColor.GRAY);
            visitor.discoverVertex(u, g);
            ei = g.oe(u);
            if (func.terminate(u, g)) {
              break;
            }
          } else {
            if (vColor === GraphColor.GRAY) {
              visitor.backEdge(e, g);
            } else {
              visitor.forwardOrCrossEdge(e, g);
            }
            visitor.finishEdge(e, g);
          }
        }
      }
      color.put(u, GraphColor.BLACK);
      visitor.finishVertex(u, g);
    }
  }
  function depthFirstSearch(g, visitor, color, startVertex = null) {
    // get start vertex
    startVertex = startVertex || getDefaultStartingVertex(g);
    // graph is empty, do nothing
    if (startVertex === null || g.nv() === 0) {
      return;
    }
    // initialize vertex and color map
    for (const u of g.v()) {
      color.put(u, GraphColor.WHITE);
      visitor.initializeVertex(u, g);
    }
    // start DFS
    const terminator = new NoTermination();
    // try starting from startVertex
    if (startVertex !== getDefaultStartingVertex(g)) {
      visitor.startVertex(startVertex, g);
      depthFirstVisitImpl(g, startVertex, visitor, color, terminator);
    }
    // try starting from each vertex
    for (const u of g.v()) {
      // if vertex is not visited, start DFS
      if (color.get(u) === GraphColor.WHITE) {
        visitor.startVertex(u, g);
        depthFirstVisitImpl(g, u, visitor, color, terminator);
      }
    }
  }
  function depthFirstVisit(g, u, visitor, color, func = new NoTermination()) {
    visitor.startVertex(u, g);
    depthFirstVisitImpl(g, u, visitor, color, func);
  }
  _export({
    ED: void 0,
    EPD: void 0,
    OutE: void 0,
    OutEP: void 0,
    OutEI: void 0,
    OutEPI: void 0,
    InEI: void 0,
    InEPI: void 0,
    AdjI: void 0,
    AdjPI: void 0,
    reindexEdgeList: reindexEdgeList,
    removeAllEdgesFromList: removeAllEdgesFromList,
    getPath: getPath,
    findRelative: findRelative,
    depthFirstSearch: depthFirstSearch,
    depthFirstVisit: depthFirstVisit,
    DefaultVisitor: void 0,
    ReferenceGraphView: void 0
  });
  return {
    setters: [],
    execute: function () {
      /****************************************************************************
       Copyright (c) 2021-2023 Xiamen Yaji Software Co., Ltd.
      
       http://www.cocos.com
      
       Permission is hereby granted, free of charge, to any person obtaining a copy
       of this software and associated documentation files (the "Software"), to deal
       in the Software without restriction, including without limitation the rights to
       use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       of the Software, and to permit persons to whom the Software is furnished to do so,
       subject to the following conditions:
      
       The above copyright notice and this permission notice shall be included in
       all copies or substantial portions of the Software.
      
       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
       THE SOFTWARE.
      ****************************************************************************/
      _export("directional", directional = {
        undirected: 0,
        directed: 1,
        bidirectional: 2
      });
      _export("parallel", parallel = {
        disallow: 0,
        allow: 1
      });
      _export("traversal", traversal = {
        none: 0,
        incidence: 1,
        bidirectional: 2,
        adjacency: 4,
        vertex_list: 8,
        edge_list: 16
      }); //--------------------------------------------------------------------------
      // Vertex
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // Vertex Descriptor
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // Edge
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // Edge Descriptor
      //--------------------------------------------------------------------------
      _export("ED", ED = class ED {
        constructor(source, target) {
          this.source = void 0;
          this.target = void 0;
          this.source = source;
          this.target = target;
        }
        equals(rhs) {
          return this.source === rhs.source && this.target === rhs.target;
        }
      }); // Edge Descriptor with Property
      _export("EPD", EPD = class EPD {
        constructor(source, target, edge) {
          this.source = void 0;
          this.target = void 0;
          this.edge = void 0;
          this.source = source;
          this.target = target;
          this.edge = edge;
        }
        equals(rhs) {
          return this.edge === rhs.edge;
        }
      }); // Edge Descriptor
      //--------------------------------------------------------------------------
      // OutEdge
      //--------------------------------------------------------------------------
      // OutEdge
      _export("OutE", OutE = class OutE {
        constructor(target) {
          this.target = void 0;
          this.target = target;
        }
        equals(rhs) {
          return this.target === rhs.target;
        }
      }); // OutEdge(Property)
      _export("OutEP", OutEP = class OutEP {
        constructor(target, edge) {
          this.target = void 0;
          this.edge = void 0;
          this.target = target;
          this.edge = edge;
        }
        equals(rhs) {
          return this.target === rhs.target;
        }
        getProperty() {
          return this.edge.getProperty();
        }
      }); //--------------------------------------------------------------------------
      // OutEdge Iterator
      //--------------------------------------------------------------------------
      _export("OutEI", OutEI = class OutEI {
        constructor(iterator, source) {
          this.iterator = void 0;
          this.source = void 0;
          this.iterator = iterator;
          this.source = source;
        }
        [Symbol.iterator]() {
          return this;
        }
        next() {
          const res = this.iterator.next();
          if (res.done) {
            return {
              value: undefined,
              done: true
            };
          } else {
            return {
              value: new ED(this.source, res.value.target),
              done: false
            };
          }
        }
      }); // OutEdge(Property) Iterator
      _export("OutEPI", OutEPI = class OutEPI {
        constructor(iterator, source) {
          this.iterator = void 0;
          this.source = void 0;
          this.iterator = iterator;
          this.source = source;
        }
        [Symbol.iterator]() {
          return this;
        }
        next() {
          const res = this.iterator.next();
          if (res.done) {
            return {
              value: undefined,
              done: true
            };
          } else {
            return {
              value: new EPD(this.source, res.value.target, res.value.edge),
              done: false
            };
          }
        }
      }); // OutEdge Iterator
      //--------------------------------------------------------------------------
      // InEdge Iterator
      //--------------------------------------------------------------------------
      // InEdge Iterator
      _export("InEI", InEI = class InEI {
        constructor(iterator, source) {
          this.iterator = void 0;
          this.source = void 0;
          this.iterator = iterator;
          this.source = source;
        }
        [Symbol.iterator]() {
          return this;
        }
        next() {
          const res = this.iterator.next();
          if (res.done) {
            return {
              value: undefined,
              done: true
            };
          } else {
            return {
              value: new ED(res.value.target, this.source),
              done: false
            };
          }
        }
      }); // InEdge(Property) Iterator
      _export("InEPI", InEPI = class InEPI {
        constructor(iterator, source) {
          this.iterator = void 0;
          this.source = void 0;
          this.iterator = iterator;
          this.source = source;
        }
        [Symbol.iterator]() {
          return this;
        }
        next() {
          const res = this.iterator.next();
          if (res.done) {
            return {
              value: undefined,
              done: true
            };
          } else {
            return {
              value: new EPD(res.value.target, this.source, res.value.edge),
              done: false
            };
          }
        }
      }); // InEdge Iterator
      //--------------------------------------------------------------------------
      // Graph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // IncidenceGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // BidirectionalGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // AdjacencyGraph
      //--------------------------------------------------------------------------
      // Adjacency Iterator
      _export("AdjI", AdjI = class AdjI {
        constructor(graph, iterator) {
          this.graph = void 0;
          this.iterator = void 0;
          this.graph = graph;
          this.iterator = iterator;
        }
        [Symbol.iterator]() {
          return this;
        }
        next() {
          const res = this.iterator.next();
          if (res.done) {
            return {
              value: undefined,
              done: true
            };
          } else {
            return {
              value: this.graph.target(res.value),
              done: false
            };
          }
        }
      });
      _export("AdjPI", AdjPI = class AdjPI {
        constructor(graph, iterator) {
          this.graph = void 0;
          this.iterator = void 0;
          this.graph = graph;
          this.iterator = iterator;
        }
        [Symbol.iterator]() {
          return this;
        }
        next() {
          const res = this.iterator.next();
          if (res.done) {
            return {
              value: undefined,
              done: true
            };
          } else {
            return {
              value: this.graph.target(res.value),
              done: false
            };
          }
        }
      }); // Adjacency Iterator
      // AdjacencyGraph
      //--------------------------------------------------------------------------
      // VertexListGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // EdgeListGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // MutableGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // PropertyMap
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // PropertyGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // NamedGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // ComponentGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // PolymorphicGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // ReferenceGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // MutableReferenceGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // ParentGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // AddressableGraph
      //--------------------------------------------------------------------------
      //--------------------------------------------------------------------------
      // UuidGraph
      //--------------------------------------------------------------------------
      NoTermination = class NoTermination {
        terminate(v, g) {
          return false;
        }
      };
      _export("GraphColor", GraphColor = /*#__PURE__*/function (GraphColor) {
        GraphColor[GraphColor["WHITE"] = 0] = "WHITE";
        GraphColor[GraphColor["GRAY"] = 1] = "GRAY";
        GraphColor[GraphColor["GREEN"] = 2] = "GREEN";
        GraphColor[GraphColor["RED"] = 3] = "RED";
        GraphColor[GraphColor["BLACK"] = 4] = "BLACK";
        return GraphColor;
      }({}));
      VertexInfo = class VertexInfo {
        constructor(v, e, iter) {
          this.v = void 0;
          this.e = void 0;
          this.iter = void 0;
          this.v = v;
          this.e = e;
          this.iter = iter;
        }
      };
      _export("DefaultVisitor", DefaultVisitor = class DefaultVisitor {
        initializeVertex(v, g) {
          // do nothing
        }
        startVertex(v, g) {
          // do nothing
        }
        discoverVertex(v, g) {
          // do nothing
        }
        examineEdge(e, g) {
          // do nothing
        }
        treeEdge(e, g) {
          // do nothing
        }
        backEdge(e, g) {
          // do nothing
        }
        forwardOrCrossEdge(e, g) {
          // do nothing
        }
        finishEdge(e, g) {
          // do nothing
        }
        finishVertex(v, g) {
          // do nothing
        }
      });
      _export("ReferenceGraphView", ReferenceGraphView = class ReferenceGraphView {
        constructor(g) {
          // readonly directed_category: directional;
          // readonly edge_parallel_category: parallel;
          // readonly traversal_category: traversal;
          this.g = void 0;
          this.g = g;
          this.N = g.N;
          // this.directed_category = directional.directed;
          // this.edge_parallel_category = parallel.allow;
          // this.traversal_category = traversal.incidence | traversal.vertex_list;
        }
        edge(u, v) {
          return this.g.reference(u, v);
        }
        source(e) {
          return this.g.parent(e);
        }
        target(e) {
          return this.g.child(e);
        }
        oe(v) {
          return this.g.children(v);
        }
        od(v) {
          return this.g.numChildren(v);
        }
        v() {
          return this.g.v();
        }
        nv() {
          return this.g.nv();
        }
      });
    }
  };
});