System.register("q-bundled:///fs/cocos/physics-2d/box2d-jsb/platform/physics-contact-listener.js", ["../../../../../virtual/internal%253Aconstants.js", "../../../core/index.js", "../empty-for-editor.js"], function (_export, _context) {
  "use strict";

  var JSB, js, b2EmptyInstance, PhysicsContactListener;
  _export("PhysicsContactListener", void 0);
  return {
    setters: [function (_virtualInternal253AconstantsJs) {
      JSB = _virtualInternal253AconstantsJs.JSB;
    }, function (_coreIndexJs) {
      js = _coreIndexJs.js;
    }, function (_emptyForEditorJs) {
      b2EmptyInstance = _emptyForEditorJs.b2EmptyInstance;
    }],
    execute: function () {
      /*
       Copyright (c) 2017-2023 Xiamen Yaji Software Co., Ltd.
      
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

      if (!JSB) {
        globalThis.b2jsb = b2EmptyInstance;
      }
      _export("PhysicsContactListener", PhysicsContactListener = class PhysicsContactListener extends b2jsb.ContactListener {
        constructor(...args) {
          super(...args);
          this._contactFixtures = [];
          this._BeginContact = null;
          this._EndContact = null;
          this._PreSolve = null;
          this._PostSolve = null;
        }
        setBeginContact(cb) {
          this._BeginContact = cb;
        }
        setEndContact(cb) {
          this._EndContact = cb;
        }
        setPreSolve(cb) {
          this._PreSolve = cb;
        }
        setPostSolve(cb) {
          this._PostSolve = cb;
        }
        BeginContact(contact) {
          if (!this._BeginContact) return;
          const fixtureA = contact.GetFixtureA();
          const fixtureB = contact.GetFixtureB();
          const fixtures = this._contactFixtures;
          contact._shouldReport = false;
          if (fixtures.indexOf(fixtureA) !== -1 || fixtures.indexOf(fixtureB) !== -1) {
            contact._shouldReport = true; // for quick check whether this contact should report
            this._BeginContact(contact);
          }
        }
        EndContact(contact) {
          if (this._EndContact && contact._shouldReport) {
            contact._shouldReport = false;
            this._EndContact(contact);
          }
        }
        PreSolve(contact, oldManifold) {
          if (this._PreSolve && contact._shouldReport) {
            this._PreSolve(contact, oldManifold);
          }
        }
        PostSolve(contact, impulse) {
          if (this._PostSolve && contact._shouldReport) {
            this._PostSolve(contact, impulse);
          }
        }
        registerContactFixture(fixture) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this._contactFixtures.push(fixture);
        }
        unregisterContactFixture(fixture) {
          js.array.remove(this._contactFixtures, fixture);
        }
      });
    }
  };
});