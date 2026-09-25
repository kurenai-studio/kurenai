System.register("q-bundled:///fs/cocos/physics-2d/builtin/builtin-world.js", ["../../../../virtual/internal%253Aconstants.js", "../../core/index.js", "./shapes/box-shape-2d.js", "./shapes/circle-shape-2d.js", "./shapes/polygon-shape-2d.js", "../framework/physics-types.js", "../framework/index.js", "./builtin-contact.js", "../../scene-graph/index.js", "../../game/index.js"], function (_export, _context) {
  "use strict";

  var EDITOR_NOT_IN_PREVIEW, TEST, CCObjectFlags, Vec3, Color, js, errorID, BuiltinBoxShape, BuiltinCircleShape, BuiltinPolygonShape, EPhysics2DDrawFlags, Contact2DType, PhysicsSystem2D, BuiltinContact, Node, find, director, BuiltinPhysicsWorld, contactResults, testIntersectResults;
  _export("BuiltinPhysicsWorld", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      EDITOR_NOT_IN_PREVIEW = _virtualInternal253AconstantsJs.EDITOR_NOT_IN_PREVIEW;
      TEST = _virtualInternal253AconstantsJs.TEST;
    }, function (_coreIndexJs) {
      CCObjectFlags = _coreIndexJs.CCObjectFlags;
      Vec3 = _coreIndexJs.Vec3;
      Color = _coreIndexJs.Color;
      js = _coreIndexJs.js;
      errorID = _coreIndexJs.errorID;
    }, function (_shapesBoxShape2dJs) {
      BuiltinBoxShape = _shapesBoxShape2dJs.BuiltinBoxShape;
    }, function (_shapesCircleShape2dJs) {
      BuiltinCircleShape = _shapesCircleShape2dJs.BuiltinCircleShape;
    }, function (_shapesPolygonShape2dJs) {
      BuiltinPolygonShape = _shapesPolygonShape2dJs.BuiltinPolygonShape;
    }, function (_frameworkPhysicsTypesJs) {
      EPhysics2DDrawFlags = _frameworkPhysicsTypesJs.EPhysics2DDrawFlags;
      Contact2DType = _frameworkPhysicsTypesJs.Contact2DType;
    }, function (_frameworkIndexJs) {
      PhysicsSystem2D = _frameworkIndexJs.PhysicsSystem2D;
    }, function (_builtinContactJs) {
      BuiltinContact = _builtinContactJs.BuiltinContact;
    }, function (_sceneGraphIndexJs) {
      Node = _sceneGraphIndexJs.Node;
      find = _sceneGraphIndexJs.find;
    }, function (_gameIndexJs) {
      director = _gameIndexJs.director;
    }],
    execute: function () {
      /*
       Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.
      
       https://www.cocos.com/
      
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
      */
      contactResults = [];
      testIntersectResults = [];
      /** @mangle */
      _export("BuiltinPhysicsWorld", BuiltinPhysicsWorld = class BuiltinPhysicsWorld {
        constructor() {
          this._contacts = [];
          this._shapes = [];
          this._debugGraphics = null;
          this._debugDrawFlags = 0;
        }
        get debugDrawFlags() {
          return this._debugDrawFlags;
        }
        set debugDrawFlags(v) {
          this._debugDrawFlags = v;
        }
        shouldCollide(c1, c2) {
          const collider1 = c1.collider;
          const collider2 = c2.collider;
          const collisionMatrix = PhysicsSystem2D.instance.collisionMatrix;
          return collider1 !== collider2 && collider1.node !== collider2.node && collisionMatrix[collider1.group] & collider2.group && collisionMatrix[collider2.group] & collider1.group;
        }
        addShape(shape) {
          const shapes = this._shapes;
          const index = shapes.indexOf(shape);
          if (index === -1) {
            for (let i = 0, l = shapes.length; i < l; i++) {
              const other = shapes[i];
              if (this.shouldCollide(shape, other)) {
                const contact = new BuiltinContact(shape, other);
                this._contacts.push(contact);
                if (shape._contacts.indexOf(contact) === -1) {
                  shape._contacts.push(contact);
                }
                if (other._contacts.indexOf(contact) === -1) {
                  other._contacts.push(contact);
                }
              }
            }
            shapes.push(shape);
          }
        }
        removeShape(shape) {
          const shapes = this._shapes;
          const index = shapes.indexOf(shape);
          if (index >= 0) {
            js.array.fastRemoveAt(shapes, index);
            const contacts = this._contacts;
            for (let i = contacts.length - 1; i >= 0; i--) {
              const contact = contacts[i];
              if (contact.shape1 === shape || contact.shape2 === shape) {
                if (contact.touching) {
                  this._emitCollide(contact, Contact2DType.END_CONTACT);
                }
                js.array.fastRemoveAt(contacts, i);
                const other = contact.shape1 === shape ? contact.shape2 : contact.shape1;
                const contactIndex = other._contacts.indexOf(contact);
                if (contactIndex >= 0) {
                  js.array.fastRemoveAt(other._contacts, contactIndex);
                }
              }
            }
          }
          shape._contacts.length = 0;
        }
        updateShapeGroup(shape) {
          this.removeShape(shape);
          if (shape.collider.enabledInHierarchy) {
            this.addShape(shape);
          }
        }
        step(deltaTime, velocityIterations = 10, positionIterations = 10) {
          // update collider
          const shapes = this._shapes;
          for (let i = 0, l = shapes.length; i < l; i++) {
            shapes[i].update();
          }

          // do collide
          const contacts = this._contacts;
          contactResults.length = 0;
          for (let i = 0, l = contacts.length; i < l; i++) {
            const collisionType = contacts[i].updateState();
            if (collisionType === Contact2DType.None) {
              continue;
            }
            contactResults.push(contacts[i]);
          }

          // handle collide results, emit message
          for (let i = 0, l = contactResults.length; i < l; i++) {
            const result = contactResults[i];
            this._emitCollide(result);
          }
        }
        drawDebug() {
          if (TEST) return;
          if (!this._debugDrawFlags) {
            return;
          }
          this._checkDebugDrawValid();
          const debugDrawer = this._debugGraphics;
          if (!debugDrawer) {
            return;
          }
          debugDrawer.clear();
          debugDrawer.lineWidth = 3;
          const shapes = this._shapes;
          for (let i = 0, l = shapes.length; i < l; i++) {
            const shape = shapes[i];
            debugDrawer.strokeColor = Color.WHITE;
            if (shape instanceof BuiltinBoxShape || shape instanceof BuiltinPolygonShape) {
              const ps = shape.worldPoints;
              if (ps.length > 0) {
                debugDrawer.moveTo(ps[0].x, ps[0].y);
                for (let j = 1; j < ps.length; j++) {
                  debugDrawer.lineTo(ps[j].x, ps[j].y);
                }
                debugDrawer.close();
                debugDrawer.stroke();
              }
            } else if (shape instanceof BuiltinCircleShape) {
              debugDrawer.circle(shape.worldPosition.x, shape.worldPosition.y, shape.worldRadius);
              debugDrawer.stroke();
            }
            if (this._debugDrawFlags & EPhysics2DDrawFlags.Aabb) {
              const aabb = shape.worldAABB;
              debugDrawer.strokeColor = Color.BLUE;
              debugDrawer.moveTo(aabb.xMin, aabb.yMin);
              debugDrawer.lineTo(aabb.xMin, aabb.yMax);
              debugDrawer.lineTo(aabb.xMax, aabb.yMax);
              debugDrawer.lineTo(aabb.xMax, aabb.yMin);
              debugDrawer.close();
              debugDrawer.stroke();
            }
          }
        }
        _emitCollide(contact, collisionType) {
          collisionType = collisionType || contact.type;
          const c1 = contact.shape1.collider;
          const c2 = contact.shape2.collider;
          PhysicsSystem2D.instance.emit(collisionType, c1, c2);
          c1.emit(collisionType, c1, c2);
          c2.emit(collisionType, c2, c1);
        }
        _checkDebugDrawValid() {
          if (EDITOR_NOT_IN_PREVIEW) return;
          if (!this._debugGraphics || !this._debugGraphics.isValid) {
            let canvas = find('Canvas');
            if (!canvas) {
              const scene = director.getScene();
              if (!scene) {
                return;
              }
              canvas = new Node('Canvas');
              canvas.addComponent('cc.Canvas');
              canvas.parent = scene;
            }
            let node = new Node('PHYSICS_2D_DEBUG_DRAW');
            // node.zIndex = cc.macro.MAX_ZINDEX;
            node.hideFlags |= CCObjectFlags.DontSave;
            node.parent = canvas;
            node.worldPosition = Vec3.ZERO;
            try {
              this._debugGraphics = node.addComponent('cc.Graphics');
              this._debugGraphics.lineWidth = 2;
            } catch (e) {
              errorID(4501, e.message);
              node.destroy();
              node = null;
            }
          }
          if (this._debugGraphics) {
            const parent = this._debugGraphics.node.parent;
            this._debugGraphics.node.setSiblingIndex(parent.children.length - 1);
          }
        }
        testPoint(p) {
          const shapes = this._shapes;
          testIntersectResults.length = 0;
          for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            if (!shape.containsPoint(p)) {
              continue;
            }
            testIntersectResults.push(shape.collider);
          }
          return testIntersectResults;
        }
        testAABB(rect) {
          const shapes = this._shapes;
          testIntersectResults.length = 0;
          for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            if (!shape.intersectsRect(rect)) {
              continue;
            }
            testIntersectResults.push(shape.collider);
          }
          return testIntersectResults;
        }

        // empty implements
        impl() {
          return null;
        }
        setGravity() {
          //empty
        }
        setAllowSleep() {
          //empty
        }
        syncPhysicsToScene() {
          //empty
        }
        syncSceneToPhysics() {
          //empty
        }
        raycast(p1, p2, type) {
          return [];
        }
        clearContacts() {}
      });
    }
  };
});