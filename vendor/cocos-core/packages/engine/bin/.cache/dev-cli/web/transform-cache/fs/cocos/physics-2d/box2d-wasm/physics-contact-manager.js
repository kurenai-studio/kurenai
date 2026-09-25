System.register("q-bundled:///fs/cocos/physics-2d/box2d-wasm/physics-contact-manager.js", ["./instantiated.js", "./physics-contact.js"], function (_export, _context) {
  "use strict";

  var B2ObjectType, getTSObjectFromWASMObjectPtr, PhysicsContact, PhysicsContactManager, pools;
  _export("PhysicsContactManager", void 0);
  return {
    setters: [function (_instantiatedJs) {
      B2ObjectType = _instantiatedJs.B2ObjectType;
      getTSObjectFromWASMObjectPtr = _instantiatedJs.getTSObjectFromWASMObjectPtr;
    }, function (_physicsContactJs) {
      PhysicsContact = _physicsContactJs.PhysicsContact;
    }],
    execute: function () {
      /*
       Copyright (c) 2024 Xiamen Yaji Software Co., Ltd.
       https://www.cocos.com/
      */
      pools = [];
      _export("PhysicsContactManager", PhysicsContactManager = class PhysicsContactManager {
        static get(b2contact) {
          let c = pools.pop();
          if (!c) {
            c = new PhysicsContact();
          }
          c.init(b2contact);
          return c;
        }
        static find(b2contact) {
          return getTSObjectFromWASMObjectPtr(B2ObjectType.Contact, b2contact);
        }
        static put(b2contact) {
          const c = getTSObjectFromWASMObjectPtr(B2ObjectType.Contact, b2contact);
          if (!c) return;
          pools.push(c);
          c.reset();
        }
        static clear() {
          pools.length = 0;
        }
      });
    }
  };
});