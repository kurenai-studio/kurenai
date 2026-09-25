System.register("q-bundled:///fs/cocos/physics/bullet/bullet-enum.js", [], function (_export, _context) {
  "use strict";

  var EBtSharedBodyDirty, btCollisionFlags, btCollisionObjectTypes, btCollisionObjectStates, btRigidBodyFlags;
  return {
    setters: [],
    execute: function () {
      /*
       Copyright (c) 2020-2023 Xiamen Yaji Software Co., Ltd.
      
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
      _export("EBtSharedBodyDirty", EBtSharedBodyDirty = /*#__PURE__*/function (EBtSharedBodyDirty) {
        EBtSharedBodyDirty[EBtSharedBodyDirty["NONE"] = 0] = "NONE";
        EBtSharedBodyDirty[EBtSharedBodyDirty["BODY_RE_ADD"] = 1] = "BODY_RE_ADD";
        EBtSharedBodyDirty[EBtSharedBodyDirty["GHOST_RE_ADD"] = 2] = "GHOST_RE_ADD";
        return EBtSharedBodyDirty;
      }({}));
      _export("btCollisionFlags", btCollisionFlags = /*#__PURE__*/function (btCollisionFlags) {
        btCollisionFlags[btCollisionFlags["CF_STATIC_OBJECT"] = 1] = "CF_STATIC_OBJECT";
        btCollisionFlags[btCollisionFlags["CF_KINEMATIC_OBJECT"] = 2] = "CF_KINEMATIC_OBJECT";
        btCollisionFlags[btCollisionFlags["CF_NO_CONTACT_RESPONSE"] = 4] = "CF_NO_CONTACT_RESPONSE";
        btCollisionFlags[btCollisionFlags["CF_CUSTOM_MATERIAL_CALLBACK"] = 8] = "CF_CUSTOM_MATERIAL_CALLBACK";
        // this allows per-triangle material (friction/restitution)
        btCollisionFlags[btCollisionFlags["CF_CHARACTER_OBJECT"] = 16] = "CF_CHARACTER_OBJECT";
        btCollisionFlags[btCollisionFlags["CF_DISABLE_VISUALIZE_OBJECT"] = 32] = "CF_DISABLE_VISUALIZE_OBJECT";
        // disable debug drawing
        btCollisionFlags[btCollisionFlags["CF_DISABLE_SPU_COLLISION_PROCESSING"] = 64] = "CF_DISABLE_SPU_COLLISION_PROCESSING"; // disable parallel/SPU processing
        return btCollisionFlags;
      }({}));
      _export("btCollisionObjectTypes", btCollisionObjectTypes = /*#__PURE__*/function (btCollisionObjectTypes) {
        btCollisionObjectTypes[btCollisionObjectTypes["CO_COLLISION_OBJECT"] = 1] = "CO_COLLISION_OBJECT";
        btCollisionObjectTypes[btCollisionObjectTypes["CO_RIGID_BODY"] = 2] = "CO_RIGID_BODY";
        /// CO_GHOST_OBJECT keeps track of all objects overlapping its AABB and that pass its collision filter
        /// It is useful for collision sensors, explosion objects, character controller etc.
        btCollisionObjectTypes[btCollisionObjectTypes["CO_GHOST_OBJECT"] = 4] = "CO_GHOST_OBJECT";
        btCollisionObjectTypes[btCollisionObjectTypes["CO_SOFT_BODY"] = 8] = "CO_SOFT_BODY";
        btCollisionObjectTypes[btCollisionObjectTypes["CO_HF_FLUID"] = 16] = "CO_HF_FLUID";
        btCollisionObjectTypes[btCollisionObjectTypes["CO_USER_TYPE"] = 32] = "CO_USER_TYPE";
        btCollisionObjectTypes[btCollisionObjectTypes["CO_FEATHERSTONE_LINK"] = 64] = "CO_FEATHERSTONE_LINK";
        return btCollisionObjectTypes;
      }({}));
      _export("btCollisionObjectStates", btCollisionObjectStates = /*#__PURE__*/function (btCollisionObjectStates) {
        btCollisionObjectStates[btCollisionObjectStates["ACTIVE_TAG"] = 1] = "ACTIVE_TAG";
        btCollisionObjectStates[btCollisionObjectStates["ISLAND_SLEEPING"] = 2] = "ISLAND_SLEEPING";
        btCollisionObjectStates[btCollisionObjectStates["WANTS_DEACTIVATION"] = 3] = "WANTS_DEACTIVATION";
        btCollisionObjectStates[btCollisionObjectStates["DISABLE_DEACTIVATION"] = 4] = "DISABLE_DEACTIVATION";
        btCollisionObjectStates[btCollisionObjectStates["DISABLE_SIMULATION"] = 5] = "DISABLE_SIMULATION";
        return btCollisionObjectStates;
      }({}));
      _export("btRigidBodyFlags", btRigidBodyFlags = /*#__PURE__*/function (btRigidBodyFlags) {
        btRigidBodyFlags[btRigidBodyFlags["BT_DISABLE_WORLD_GRAVITY"] = 1] = "BT_DISABLE_WORLD_GRAVITY";
        /// The BT_ENABLE_GYROPSCOPIC_FORCE can easily introduce instability
        /// So generally it is best to not enable it.
        /// If really needed, run at a high frequency like 1000 Hertz:
        /// See Demos/GyroscopicDemo for an example use
        btRigidBodyFlags[btRigidBodyFlags["BT_ENABLE_GYROPSCOPIC_FORCE"] = 2] = "BT_ENABLE_GYROPSCOPIC_FORCE";
        return btRigidBodyFlags;
      }({}));
    }
  };
});