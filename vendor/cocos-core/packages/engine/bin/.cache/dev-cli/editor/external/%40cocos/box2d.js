System.register(['../_rollupPluginBabelHelpers-e828a3b8.js', '../_commonjsHelpers-9cedf210.js'], (function (exports) {
  'use strict';
  var _construct, _createClass, _inherits, _classCallCheck, _superPropGet, _createForOfIteratorHelper, _callSuper, createCommonjsModule, commonjsGlobal;
  return {
    setters: [function (module) {
      _construct = module.a;
      _createClass = module.b;
      _inherits = module.c;
      _classCallCheck = module.d;
      _superPropGet = module.e;
      _createForOfIteratorHelper = module.f;
      _callSuper = module.g;
    }, function (module) {
      createCommonjsModule = module.c;
      commonjsGlobal = module.b;
    }],
    execute: (function () {

      var box2d_umd=createCommonjsModule(function(module,exports){(function(global,factory){factory(exports);})(commonjsGlobal,function(exports){/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */function b2Assert(condition){if(!condition){for(var _len=arguments.length,args=new Array(_len>1?_len-1:0),_key=1;_key<_len;_key++){args[_key-1]=arguments[_key];}// debugger;
      throw _construct(Error,args);}}function b2Maybe(value,def){return value!==undefined?value:def;}var b2_maxFloat=1E+37;// FLT_MAX instead of Number.MAX_VALUE;
      var b2_epsilon=1E-5;// FLT_EPSILON instead of Number.MIN_VALUE;
      var b2_epsilon_sq=b2_epsilon*b2_epsilon;var b2_pi=3.14159265359;// Math.PI;
      /// @file
      /// Global tuning constants based on meters-kilograms-seconds (MKS) units.
      ///
      // Collision
      /// The maximum number of contact points between two convex shapes. Do
      /// not change this value.
      var b2_maxManifoldPoints=2;/// The maximum number of vertices on a convex polygon. You cannot increase
      /// this too much because b2BlockAllocator has a maximum object size.
      var b2_maxPolygonVertices=8;/// This is used to fatten AABBs in the dynamic tree. This allows proxies
      /// to move by a small amount without triggering a tree adjustment.
      /// This is in meters.
      var b2_aabbExtension=0.1;/// This is used to fatten AABBs in the dynamic tree. This is used to predict
      /// the future position based on the current displacement.
      /// This is a dimensionless multiplier.
      var b2_aabbMultiplier=2;/// A small length used as a collision and constraint tolerance. Usually it is
      /// chosen to be numerically significant, but visually insignificant.
      var b2_linearSlop=0.008;// 0.005;
      /// A small angle used as a collision and constraint tolerance. Usually it is
      /// chosen to be numerically significant, but visually insignificant.
      var b2_angularSlop=2/180*b2_pi;/// The radius of the polygon/edge shape skin. This should not be modified. Making
      /// this smaller means polygons will have an insufficient buffer for continuous collision.
      /// Making it larger may create artifacts for vertex collision.
      var b2_polygonRadius=2*b2_linearSlop;/// Maximum number of sub-steps per contact in continuous physics simulation.
      var b2_maxSubSteps=8;// Dynamics
      /// Maximum number of contacts to be handled to solve a TOI impact.
      var b2_maxTOIContacts=32;/// A velocity threshold for elastic collisions. Any collision with a relative linear
      /// velocity below this threshold will be treated as inelastic.
      var b2_velocityThreshold=1;/// The maximum linear position correction used when solving constraints. This helps to
      /// prevent overshoot.
      var b2_maxLinearCorrection=0.2;/// The maximum angular position correction used when solving constraints. This helps to
      /// prevent overshoot.
      var b2_maxAngularCorrection=8/180*b2_pi;/// The maximum linear velocity of a body. This limit is very large and is used
      /// to prevent numerical problems. You shouldn't need to adjust this.
      var b2_maxTranslation=2;var b2_maxTranslationSquared=b2_maxTranslation*b2_maxTranslation;/// The maximum angular velocity of a body. This limit is very large and is used
      /// to prevent numerical problems. You shouldn't need to adjust this.
      var b2_maxRotation=0.5*b2_pi;var b2_maxRotationSquared=b2_maxRotation*b2_maxRotation;/// This scale factor controls how fast overlap is resolved. Ideally this would be 1 so
      /// that overlap is removed in one time step. However using values close to 1 often lead
      /// to overshoot.
      var b2_baumgarte=0.2;var b2_toiBaumgarte=0.75;// #if B2_ENABLE_PARTICLE
      // Particle
      /// A symbolic constant that stands for particle allocation error.
      var b2_invalidParticleIndex=-1;var b2_maxParticleIndex=0x7FFFFFFF;/// The default distance between particles, multiplied by the particle diameter.
      var b2_particleStride=0.75;/// The minimum particle weight that produces pressure.
      var b2_minParticleWeight=1.0;/// The upper limit for particle pressure.
      var b2_maxParticlePressure=0.25;/// The upper limit for force between particles.
      var b2_maxParticleForce=0.5;/// The maximum distance between particles in a triad, multiplied by the particle diameter.
      var b2_maxTriadDistance=2.0;var b2_maxTriadDistanceSquared=b2_maxTriadDistance*b2_maxTriadDistance;/// The initial size of particle data buffers.
      var b2_minParticleSystemBufferCapacity=256;/// The time into the future that collisions against barrier particles will be detected.
      var b2_barrierCollisionTime=2.5;// #endif
      // Sleep
      /// The time that a body must be still before it will go to sleep.
      var b2_timeToSleep=0.5;/// A body cannot sleep if its linear velocity is above this tolerance.
      var b2_linearSleepTolerance=0.01;/// A body cannot sleep if its angular velocity is above this tolerance.
      var b2_angularSleepTolerance=2/180*b2_pi;// Memory Allocation
      /// Implement this function to use your own memory allocator.
      function b2Alloc(size){return null;}/// If you implement b2Alloc, you should also implement this function.
      function b2Free(mem){}/// Logging function.
      function b2Log(message){// console.log(message, ...args);
      }/// Version numbering scheme.
      /// See http://en.wikipedia.org/wiki/Software_versioning
      var b2Version=/*#__PURE__*/function(){function b2Version(){var major=arguments.length>0&&arguments[0]!==undefined?arguments[0]:0;var minor=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var revision=arguments.length>2&&arguments[2]!==undefined?arguments[2]:0;_classCallCheck(this,b2Version);this.major=0;///< significant changes
      this.minor=0;///< incremental changes
      this.revision=0;///< bug fixes
      this.major=major;this.minor=minor;this.revision=revision;}return _createClass(b2Version,[{key:"toString",value:function toString(){return this.major+"."+this.minor+"."+this.revision;}}]);}();/// Current version.
      var b2_version=new b2Version(2,3,2);var b2_branch="master";var b2_commit="fbf51801d80fc389d43dc46524520e89043b6faf";function b2ParseInt(v){return parseInt(v,10);}function b2ParseUInt(v){return Math.abs(parseInt(v,10));}function b2MakeArray(length,init){var a=new Array(length);for(var i=0;i<length;++i){a[i]=init(i);}return a;}function b2MakeNullArray(length){var a=new Array(length);for(var i=0;i<length;++i){a[i]=null;}return a;}function b2MakeNumberArray(length){var init=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var a=new Array(length);for(var i=0;i<length;++i){a[i]=init;}return a;}/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2_pi_over_180=b2_pi/180;var b2_180_over_pi=180/b2_pi;var b2_two_pi=2*b2_pi;var b2Abs=Math.abs;function b2Min(a,b){return a<b?a:b;}function b2Max(a,b){return a>b?a:b;}function b2Clamp(a,lo,hi){return a<lo?lo:a>hi?hi:a;}function b2Swap(a,b){// DEBUG: b2Assert(false);
      var tmp=a[0];a[0]=b[0];b[0]=tmp;}/// This function is used to ensure that a floating point number is
      /// not a NaN or infinity.
      var b2IsValid=isFinite;function b2Sq(n){return n*n;}/// This is a approximate yet fast inverse square-root.
      function b2InvSqrt(n){return 1/Math.sqrt(n);}var b2Sqrt=Math.sqrt;var b2Pow=Math.pow;function b2DegToRad(degrees){return degrees*b2_pi_over_180;}function b2RadToDeg(radians){return radians*b2_180_over_pi;}var b2Cos=Math.cos;var b2Sin=Math.sin;var b2Acos=Math.acos;var b2Asin=Math.asin;var b2Atan2=Math.atan2;function b2NextPowerOfTwo(x){x|=x>>1&0x7FFFFFFF;x|=x>>2&0x3FFFFFFF;x|=x>>4&0x0FFFFFFF;x|=x>>8&0x00FFFFFF;x|=x>>16&0x0000FFFF;return x+1;}function b2IsPowerOfTwo(x){return x>0&&(x&x-1)===0;}function b2Random(){return Math.random()*2-1;}function b2RandomRange(lo,hi){return (hi-lo)*Math.random()+lo;}/// A 2D column vector.
      var b2Vec2=/*#__PURE__*/function(){function b2Vec2(){_classCallCheck(this,b2Vec2);for(var _len2=arguments.length,args=new Array(_len2),_key2=0;_key2<_len2;_key2++){args[_key2]=arguments[_key2];}if(args[0]instanceof Float32Array){if(args[0].length!==2){throw new Error();}this.data=args[0];}else {var x=typeof args[0]==="number"?args[0]:0;var y=typeof args[1]==="number"?args[1]:0;this.data=new Float32Array([x,y]);}}return _createClass(b2Vec2,[{key:"x",get:function get(){return this.data[0];},set:function set(value){this.data[0]=value;}},{key:"y",get:function get(){return this.data[1];},set:function set(value){this.data[1]=value;}},{key:"Clone",value:function Clone(){return new b2Vec2(this.x,this.y);}},{key:"SetZero",value:function SetZero(){this.x=0;this.y=0;return this;}},{key:"Set",value:function Set(x,y){this.x=x;this.y=y;return this;}},{key:"Copy",value:function Copy(other){this.x=other.x;this.y=other.y;return this;}},{key:"SelfAdd",value:function SelfAdd(v){this.x+=v.x;this.y+=v.y;return this;}},{key:"SelfAddXY",value:function SelfAddXY(x,y){this.x+=x;this.y+=y;return this;}},{key:"SelfSub",value:function SelfSub(v){this.x-=v.x;this.y-=v.y;return this;}},{key:"SelfSubXY",value:function SelfSubXY(x,y){this.x-=x;this.y-=y;return this;}},{key:"SelfMul",value:function SelfMul(s){this.x*=s;this.y*=s;return this;}},{key:"SelfMulAdd",value:function SelfMulAdd(s,v){this.x+=s*v.x;this.y+=s*v.y;return this;}},{key:"SelfMulSub",value:function SelfMulSub(s,v){this.x-=s*v.x;this.y-=s*v.y;return this;}},{key:"Dot",value:function Dot(v){return this.x*v.x+this.y*v.y;}},{key:"Cross",value:function Cross(v){return this.x*v.y-this.y*v.x;}},{key:"Length",value:function Length(){var x=this.x,y=this.y;return Math.sqrt(x*x+y*y);}},{key:"LengthSquared",value:function LengthSquared(){var x=this.x,y=this.y;return x*x+y*y;}},{key:"Normalize",value:function Normalize(){var length=this.Length();if(length>=b2_epsilon){var inv_length=1/length;this.x*=inv_length;this.y*=inv_length;}return length;}},{key:"SelfNormalize",value:function SelfNormalize(){var length=this.Length();if(length>=b2_epsilon){var inv_length=1/length;this.x*=inv_length;this.y*=inv_length;}return this;}},{key:"SelfRotate",value:function SelfRotate(radians){var c=Math.cos(radians);var s=Math.sin(radians);var x=this.x;this.x=c*x-s*this.y;this.y=s*x+c*this.y;return this;}},{key:"SelfRotateCosSin",value:function SelfRotateCosSin(c,s){var x=this.x;this.x=c*x-s*this.y;this.y=s*x+c*this.y;return this;}},{key:"IsValid",value:function IsValid(){return isFinite(this.x)&&isFinite(this.y);}},{key:"SelfCrossVS",value:function SelfCrossVS(s){var x=this.x;this.x=s*this.y;this.y=-s*x;return this;}},{key:"SelfCrossSV",value:function SelfCrossSV(s){var x=this.x;this.x=-s*this.y;this.y=s*x;return this;}},{key:"SelfMinV",value:function SelfMinV(v){this.x=b2Min(this.x,v.x);this.y=b2Min(this.y,v.y);return this;}},{key:"SelfMaxV",value:function SelfMaxV(v){this.x=b2Max(this.x,v.x);this.y=b2Max(this.y,v.y);return this;}},{key:"SelfAbs",value:function SelfAbs(){this.x=b2Abs(this.x);this.y=b2Abs(this.y);return this;}},{key:"SelfNeg",value:function SelfNeg(){this.x=-this.x;this.y=-this.y;return this;}},{key:"SelfSkew",value:function SelfSkew(){var x=this.x;this.x=-this.y;this.y=x;return this;}}],[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2Vec2();});}},{key:"AbsV",value:function AbsV(v,out){out.x=b2Abs(v.x);out.y=b2Abs(v.y);return out;}},{key:"MinV",value:function MinV(a,b,out){out.x=b2Min(a.x,b.x);out.y=b2Min(a.y,b.y);return out;}},{key:"MaxV",value:function MaxV(a,b,out){out.x=b2Max(a.x,b.x);out.y=b2Max(a.y,b.y);return out;}},{key:"ClampV",value:function ClampV(v,lo,hi,out){out.x=b2Clamp(v.x,lo.x,hi.x);out.y=b2Clamp(v.y,lo.y,hi.y);return out;}},{key:"RotateV",value:function RotateV(v,radians,out){var v_x=v.x,v_y=v.y;var c=Math.cos(radians);var s=Math.sin(radians);out.x=c*v_x-s*v_y;out.y=s*v_x+c*v_y;return out;}},{key:"DotVV",value:function DotVV(a,b){return a.x*b.x+a.y*b.y;}},{key:"CrossVV",value:function CrossVV(a,b){return a.x*b.y-a.y*b.x;}},{key:"CrossVS",value:function CrossVS(v,s,out){var v_x=v.x;out.x=s*v.y;out.y=-s*v_x;return out;}},{key:"CrossVOne",value:function CrossVOne(v,out){var v_x=v.x;out.x=v.y;out.y=-v_x;return out;}},{key:"CrossSV",value:function CrossSV(s,v,out){var v_x=v.x;out.x=-s*v.y;out.y=s*v_x;return out;}},{key:"CrossOneV",value:function CrossOneV(v,out){var v_x=v.x;out.x=-v.y;out.y=v_x;return out;}},{key:"AddVV",value:function AddVV(a,b,out){out.x=a.x+b.x;out.y=a.y+b.y;return out;}},{key:"SubVV",value:function SubVV(a,b,out){out.x=a.x-b.x;out.y=a.y-b.y;return out;}},{key:"MulSV",value:function MulSV(s,v,out){out.x=v.x*s;out.y=v.y*s;return out;}},{key:"MulVS",value:function MulVS(v,s,out){out.x=v.x*s;out.y=v.y*s;return out;}},{key:"AddVMulSV",value:function AddVMulSV(a,s,b,out){out.x=a.x+s*b.x;out.y=a.y+s*b.y;return out;}},{key:"SubVMulSV",value:function SubVMulSV(a,s,b,out){out.x=a.x-s*b.x;out.y=a.y-s*b.y;return out;}},{key:"AddVCrossSV",value:function AddVCrossSV(a,s,v,out){var v_x=v.x;out.x=a.x-s*v.y;out.y=a.y+s*v_x;return out;}},{key:"MidVV",value:function MidVV(a,b,out){out.x=(a.x+b.x)*0.5;out.y=(a.y+b.y)*0.5;return out;}},{key:"ExtVV",value:function ExtVV(a,b,out){out.x=(b.x-a.x)*0.5;out.y=(b.y-a.y)*0.5;return out;}},{key:"IsEqualToV",value:function IsEqualToV(a,b){return a.x===b.x&&a.y===b.y;}},{key:"DistanceVV",value:function DistanceVV(a,b){var c_x=a.x-b.x;var c_y=a.y-b.y;return Math.sqrt(c_x*c_x+c_y*c_y);}},{key:"DistanceSquaredVV",value:function DistanceSquaredVV(a,b){var c_x=a.x-b.x;var c_y=a.y-b.y;return c_x*c_x+c_y*c_y;}},{key:"NegV",value:function NegV(v,out){out.x=-v.x;out.y=-v.y;return out;}}]);}();b2Vec2.ZERO=new b2Vec2(0,0);b2Vec2.UNITX=new b2Vec2(1,0);b2Vec2.UNITY=new b2Vec2(0,1);b2Vec2.s_t0=new b2Vec2();b2Vec2.s_t1=new b2Vec2();b2Vec2.s_t2=new b2Vec2();b2Vec2.s_t3=new b2Vec2();var b2Vec2_zero=new b2Vec2(0,0);/// A 2D column vector with 3 elements.
      var b2Vec3=/*#__PURE__*/function(){function b2Vec3(){_classCallCheck(this,b2Vec3);for(var _len3=arguments.length,args=new Array(_len3),_key3=0;_key3<_len3;_key3++){args[_key3]=arguments[_key3];}if(args[0]instanceof Float32Array){if(args[0].length!==3){throw new Error();}this.data=args[0];}else {var x=typeof args[0]==="number"?args[0]:0;var y=typeof args[1]==="number"?args[1]:0;var z=typeof args[2]==="number"?args[2]:0;this.data=new Float32Array([x,y,z]);}}return _createClass(b2Vec3,[{key:"x",get:function get(){return this.data[0];},set:function set(value){this.data[0]=value;}},{key:"y",get:function get(){return this.data[1];},set:function set(value){this.data[1]=value;}},{key:"z",get:function get(){return this.data[2];},set:function set(value){this.data[2]=value;}},{key:"Clone",value:function Clone(){return new b2Vec3(this.x,this.y,this.z);}},{key:"SetZero",value:function SetZero(){this.x=0;this.y=0;this.z=0;return this;}},{key:"SetXYZ",value:function SetXYZ(x,y,z){this.x=x;this.y=y;this.z=z;return this;}},{key:"Copy",value:function Copy(other){this.x=other.x;this.y=other.y;this.z=other.z;return this;}},{key:"SelfNeg",value:function SelfNeg(){this.x=-this.x;this.y=-this.y;this.z=-this.z;return this;}},{key:"SelfAdd",value:function SelfAdd(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}},{key:"SelfAddXYZ",value:function SelfAddXYZ(x,y,z){this.x+=x;this.y+=y;this.z+=z;return this;}},{key:"SelfSub",value:function SelfSub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}},{key:"SelfSubXYZ",value:function SelfSubXYZ(x,y,z){this.x-=x;this.y-=y;this.z-=z;return this;}},{key:"SelfMul",value:function SelfMul(s){this.x*=s;this.y*=s;this.z*=s;return this;}}],[{key:"DotV3V3",value:function DotV3V3(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}},{key:"CrossV3V3",value:function CrossV3V3(a,b,out){var a_x=a.x,a_y=a.y,a_z=a.z;var b_x=b.x,b_y=b.y,b_z=b.z;out.x=a_y*b_z-a_z*b_y;out.y=a_z*b_x-a_x*b_z;out.z=a_x*b_y-a_y*b_x;return out;}}]);}();b2Vec3.ZERO=new b2Vec3(0,0,0);b2Vec3.s_t0=new b2Vec3();/// A 2-by-2 matrix. Stored in column-major order.
      var b2Mat22=/*#__PURE__*/function(){function b2Mat22(){_classCallCheck(this,b2Mat22);this.data=new Float32Array([1,0,0,1]);this.ex=new b2Vec2(this.data.subarray(0,2));this.ey=new b2Vec2(this.data.subarray(2,4));}return _createClass(b2Mat22,[{key:"Clone",value:function Clone(){return new b2Mat22().Copy(this);}},{key:"SetSSSS",value:function SetSSSS(r1c1,r1c2,r2c1,r2c2){this.ex.Set(r1c1,r2c1);this.ey.Set(r1c2,r2c2);return this;}},{key:"SetVV",value:function SetVV(c1,c2){this.ex.Copy(c1);this.ey.Copy(c2);return this;}},{key:"SetAngle",value:function SetAngle(radians){var c=Math.cos(radians);var s=Math.sin(radians);this.ex.Set(c,s);this.ey.Set(-s,c);return this;}},{key:"Copy",value:function Copy(other){this.ex.Copy(other.ex);this.ey.Copy(other.ey);return this;}},{key:"SetIdentity",value:function SetIdentity(){this.ex.Set(1,0);this.ey.Set(0,1);return this;}},{key:"SetZero",value:function SetZero(){this.ex.SetZero();this.ey.SetZero();return this;}},{key:"GetAngle",value:function GetAngle(){return Math.atan2(this.ex.y,this.ex.x);}},{key:"GetInverse",value:function GetInverse(out){var a=this.ex.x;var b=this.ey.x;var c=this.ex.y;var d=this.ey.y;var det=a*d-b*c;if(det!==0){det=1/det;}out.ex.x=det*d;out.ey.x=-det*b;out.ex.y=-det*c;out.ey.y=det*a;return out;}},{key:"Solve",value:function Solve(b_x,b_y,out){var a11=this.ex.x,a12=this.ey.x;var a21=this.ex.y,a22=this.ey.y;var det=a11*a22-a12*a21;if(det!==0){det=1/det;}out.x=det*(a22*b_x-a12*b_y);out.y=det*(a11*b_y-a21*b_x);return out;}},{key:"SelfAbs",value:function SelfAbs(){this.ex.SelfAbs();this.ey.SelfAbs();return this;}},{key:"SelfInv",value:function SelfInv(){this.GetInverse(this);return this;}},{key:"SelfAddM",value:function SelfAddM(M){this.ex.SelfAdd(M.ex);this.ey.SelfAdd(M.ey);return this;}},{key:"SelfSubM",value:function SelfSubM(M){this.ex.SelfSub(M.ex);this.ey.SelfSub(M.ey);return this;}}],[{key:"FromVV",value:function FromVV(c1,c2){return new b2Mat22().SetVV(c1,c2);}},{key:"FromSSSS",value:function FromSSSS(r1c1,r1c2,r2c1,r2c2){return new b2Mat22().SetSSSS(r1c1,r1c2,r2c1,r2c2);}},{key:"FromAngle",value:function FromAngle(radians){return new b2Mat22().SetAngle(radians);}},{key:"AbsM",value:function AbsM(M,out){var M_ex=M.ex,M_ey=M.ey;out.ex.x=b2Abs(M_ex.x);out.ex.y=b2Abs(M_ex.y);out.ey.x=b2Abs(M_ey.x);out.ey.y=b2Abs(M_ey.y);return out;}},{key:"MulMV",value:function MulMV(M,v,out){var M_ex=M.ex,M_ey=M.ey;var v_x=v.x,v_y=v.y;out.x=M_ex.x*v_x+M_ey.x*v_y;out.y=M_ex.y*v_x+M_ey.y*v_y;return out;}},{key:"MulTMV",value:function MulTMV(M,v,out){var M_ex=M.ex,M_ey=M.ey;var v_x=v.x,v_y=v.y;out.x=M_ex.x*v_x+M_ex.y*v_y;out.y=M_ey.x*v_x+M_ey.y*v_y;return out;}},{key:"AddMM",value:function AddMM(A,B,out){var A_ex=A.ex,A_ey=A.ey;var B_ex=B.ex,B_ey=B.ey;out.ex.x=A_ex.x+B_ex.x;out.ex.y=A_ex.y+B_ex.y;out.ey.x=A_ey.x+B_ey.x;out.ey.y=A_ey.y+B_ey.y;return out;}},{key:"MulMM",value:function MulMM(A,B,out){var A_ex_x=A.ex.x,A_ex_y=A.ex.y;var A_ey_x=A.ey.x,A_ey_y=A.ey.y;var B_ex_x=B.ex.x,B_ex_y=B.ex.y;var B_ey_x=B.ey.x,B_ey_y=B.ey.y;out.ex.x=A_ex_x*B_ex_x+A_ey_x*B_ex_y;out.ex.y=A_ex_y*B_ex_x+A_ey_y*B_ex_y;out.ey.x=A_ex_x*B_ey_x+A_ey_x*B_ey_y;out.ey.y=A_ex_y*B_ey_x+A_ey_y*B_ey_y;return out;}},{key:"MulTMM",value:function MulTMM(A,B,out){var A_ex_x=A.ex.x,A_ex_y=A.ex.y;var A_ey_x=A.ey.x,A_ey_y=A.ey.y;var B_ex_x=B.ex.x,B_ex_y=B.ex.y;var B_ey_x=B.ey.x,B_ey_y=B.ey.y;out.ex.x=A_ex_x*B_ex_x+A_ex_y*B_ex_y;out.ex.y=A_ey_x*B_ex_x+A_ey_y*B_ex_y;out.ey.x=A_ex_x*B_ey_x+A_ex_y*B_ey_y;out.ey.y=A_ey_x*B_ey_x+A_ey_y*B_ey_y;return out;}}]);}();b2Mat22.IDENTITY=new b2Mat22();/// A 3-by-3 matrix. Stored in column-major order.
      var b2Mat33=/*#__PURE__*/function(){function b2Mat33(){_classCallCheck(this,b2Mat33);this.data=new Float32Array([1,0,0,0,1,0,0,0,1]);this.ex=new b2Vec3(this.data.subarray(0,3));this.ey=new b2Vec3(this.data.subarray(3,6));this.ez=new b2Vec3(this.data.subarray(6,9));}return _createClass(b2Mat33,[{key:"Clone",value:function Clone(){return new b2Mat33().Copy(this);}},{key:"SetVVV",value:function SetVVV(c1,c2,c3){this.ex.Copy(c1);this.ey.Copy(c2);this.ez.Copy(c3);return this;}},{key:"Copy",value:function Copy(other){this.ex.Copy(other.ex);this.ey.Copy(other.ey);this.ez.Copy(other.ez);return this;}},{key:"SetIdentity",value:function SetIdentity(){this.ex.SetXYZ(1,0,0);this.ey.SetXYZ(0,1,0);this.ez.SetXYZ(0,0,1);return this;}},{key:"SetZero",value:function SetZero(){this.ex.SetZero();this.ey.SetZero();this.ez.SetZero();return this;}},{key:"SelfAddM",value:function SelfAddM(M){this.ex.SelfAdd(M.ex);this.ey.SelfAdd(M.ey);this.ez.SelfAdd(M.ez);return this;}},{key:"Solve33",value:function Solve33(b_x,b_y,b_z,out){var a11=this.ex.x,a21=this.ex.y,a31=this.ex.z;var a12=this.ey.x,a22=this.ey.y,a32=this.ey.z;var a13=this.ez.x,a23=this.ez.y,a33=this.ez.z;var det=a11*(a22*a33-a32*a23)+a21*(a32*a13-a12*a33)+a31*(a12*a23-a22*a13);if(det!==0){det=1/det;}out.x=det*(b_x*(a22*a33-a32*a23)+b_y*(a32*a13-a12*a33)+b_z*(a12*a23-a22*a13));out.y=det*(a11*(b_y*a33-b_z*a23)+a21*(b_z*a13-b_x*a33)+a31*(b_x*a23-b_y*a13));out.z=det*(a11*(a22*b_z-a32*b_y)+a21*(a32*b_x-a12*b_z)+a31*(a12*b_y-a22*b_x));return out;}},{key:"Solve22",value:function Solve22(b_x,b_y,out){var a11=this.ex.x,a12=this.ey.x;var a21=this.ex.y,a22=this.ey.y;var det=a11*a22-a12*a21;if(det!==0){det=1/det;}out.x=det*(a22*b_x-a12*b_y);out.y=det*(a11*b_y-a21*b_x);return out;}},{key:"GetInverse22",value:function GetInverse22(M){var a=this.ex.x,b=this.ey.x,c=this.ex.y,d=this.ey.y;var det=a*d-b*c;if(det!==0){det=1/det;}M.ex.x=det*d;M.ey.x=-det*b;M.ex.z=0;M.ex.y=-det*c;M.ey.y=det*a;M.ey.z=0;M.ez.x=0;M.ez.y=0;M.ez.z=0;}},{key:"GetSymInverse33",value:function GetSymInverse33(M){var det=b2Vec3.DotV3V3(this.ex,b2Vec3.CrossV3V3(this.ey,this.ez,b2Vec3.s_t0));if(det!==0){det=1/det;}var a11=this.ex.x,a12=this.ey.x,a13=this.ez.x;var a22=this.ey.y,a23=this.ez.y;var a33=this.ez.z;M.ex.x=det*(a22*a33-a23*a23);M.ex.y=det*(a13*a23-a12*a33);M.ex.z=det*(a12*a23-a13*a22);M.ey.x=M.ex.y;M.ey.y=det*(a11*a33-a13*a13);M.ey.z=det*(a13*a12-a11*a23);M.ez.x=M.ex.z;M.ez.y=M.ey.z;M.ez.z=det*(a11*a22-a12*a12);}}],[{key:"MulM33V3",value:function MulM33V3(A,v,out){var v_x=v.x,v_y=v.y,v_z=v.z;out.x=A.ex.x*v_x+A.ey.x*v_y+A.ez.x*v_z;out.y=A.ex.y*v_x+A.ey.y*v_y+A.ez.y*v_z;out.z=A.ex.z*v_x+A.ey.z*v_y+A.ez.z*v_z;return out;}},{key:"MulM33XYZ",value:function MulM33XYZ(A,x,y,z,out){out.x=A.ex.x*x+A.ey.x*y+A.ez.x*z;out.y=A.ex.y*x+A.ey.y*y+A.ez.y*z;out.z=A.ex.z*x+A.ey.z*y+A.ez.z*z;return out;}},{key:"MulM33V2",value:function MulM33V2(A,v,out){var v_x=v.x,v_y=v.y;out.x=A.ex.x*v_x+A.ey.x*v_y;out.y=A.ex.y*v_x+A.ey.y*v_y;return out;}},{key:"MulM33XY",value:function MulM33XY(A,x,y,out){out.x=A.ex.x*x+A.ey.x*y;out.y=A.ex.y*x+A.ey.y*y;return out;}}]);}();b2Mat33.IDENTITY=new b2Mat33();/// Rotation
      var b2Rot=/*#__PURE__*/function(){function b2Rot(){var angle=arguments.length>0&&arguments[0]!==undefined?arguments[0]:0;_classCallCheck(this,b2Rot);this.s=0;this.c=1;if(angle){this.s=Math.sin(angle);this.c=Math.cos(angle);}}return _createClass(b2Rot,[{key:"Clone",value:function Clone(){return new b2Rot().Copy(this);}},{key:"Copy",value:function Copy(other){this.s=other.s;this.c=other.c;return this;}},{key:"SetAngle",value:function SetAngle(angle){this.s=Math.sin(angle);this.c=Math.cos(angle);return this;}},{key:"SetIdentity",value:function SetIdentity(){this.s=0;this.c=1;return this;}},{key:"GetAngle",value:function GetAngle(){return Math.atan2(this.s,this.c);}},{key:"GetXAxis",value:function GetXAxis(out){out.x=this.c;out.y=this.s;return out;}},{key:"GetYAxis",value:function GetYAxis(out){out.x=-this.s;out.y=this.c;return out;}}],[{key:"MulRR",value:function MulRR(q,r,out){// [qc -qs] * [rc -rs] = [qc*rc-qs*rs -qc*rs-qs*rc]
      // [qs  qc]   [rs  rc]   [qs*rc+qc*rs -qs*rs+qc*rc]
      // s = qs * rc + qc * rs
      // c = qc * rc - qs * rs
      var q_c=q.c,q_s=q.s;var r_c=r.c,r_s=r.s;out.s=q_s*r_c+q_c*r_s;out.c=q_c*r_c-q_s*r_s;return out;}},{key:"MulTRR",value:function MulTRR(q,r,out){// [ qc qs] * [rc -rs] = [qc*rc+qs*rs -qc*rs+qs*rc]
      // [-qs qc]   [rs  rc]   [-qs*rc+qc*rs qs*rs+qc*rc]
      // s = qc * rs - qs * rc
      // c = qc * rc + qs * rs
      var q_c=q.c,q_s=q.s;var r_c=r.c,r_s=r.s;out.s=q_c*r_s-q_s*r_c;out.c=q_c*r_c+q_s*r_s;return out;}},{key:"MulRV",value:function MulRV(q,v,out){var q_c=q.c,q_s=q.s;var v_x=v.x,v_y=v.y;out.x=q_c*v_x-q_s*v_y;out.y=q_s*v_x+q_c*v_y;return out;}},{key:"MulTRV",value:function MulTRV(q,v,out){var q_c=q.c,q_s=q.s;var v_x=v.x,v_y=v.y;out.x=q_c*v_x+q_s*v_y;out.y=-q_s*v_x+q_c*v_y;return out;}}]);}();b2Rot.IDENTITY=new b2Rot();/// A transform contains translation and rotation. It is used to represent
      /// the position and orientation of rigid frames.
      var b2Transform=/*#__PURE__*/function(){function b2Transform(){_classCallCheck(this,b2Transform);this.p=new b2Vec2();this.q=new b2Rot();}return _createClass(b2Transform,[{key:"Clone",value:function Clone(){return new b2Transform().Copy(this);}},{key:"Copy",value:function Copy(other){this.p.Copy(other.p);this.q.Copy(other.q);return this;}},{key:"SetIdentity",value:function SetIdentity(){this.p.SetZero();this.q.SetIdentity();return this;}},{key:"SetPositionRotation",value:function SetPositionRotation(position,q){this.p.Copy(position);this.q.Copy(q);return this;}},{key:"SetPositionAngle",value:function SetPositionAngle(pos,a){this.p.Copy(pos);this.q.SetAngle(a);return this;}},{key:"SetPosition",value:function SetPosition(position){this.p.Copy(position);return this;}},{key:"SetPositionXY",value:function SetPositionXY(x,y){this.p.Set(x,y);return this;}},{key:"SetRotation",value:function SetRotation(rotation){this.q.Copy(rotation);return this;}},{key:"SetRotationAngle",value:function SetRotationAngle(radians){this.q.SetAngle(radians);return this;}},{key:"GetPosition",value:function GetPosition(){return this.p;}},{key:"GetRotation",value:function GetRotation(){return this.q;}},{key:"GetRotationAngle",value:function GetRotationAngle(){return this.q.GetAngle();}},{key:"GetAngle",value:function GetAngle(){return this.q.GetAngle();}}],[{key:"MulXV",value:function MulXV(T,v,out){// float32 x = (T.q.c * v.x - T.q.s * v.y) + T.p.x;
      // float32 y = (T.q.s * v.x + T.q.c * v.y) + T.p.y;
      // return b2Vec2(x, y);
      var T_q_c=T.q.c,T_q_s=T.q.s;var v_x=v.x,v_y=v.y;out.x=T_q_c*v_x-T_q_s*v_y+T.p.x;out.y=T_q_s*v_x+T_q_c*v_y+T.p.y;return out;}},{key:"MulTXV",value:function MulTXV(T,v,out){// float32 px = v.x - T.p.x;
      // float32 py = v.y - T.p.y;
      // float32 x = (T.q.c * px + T.q.s * py);
      // float32 y = (-T.q.s * px + T.q.c * py);
      // return b2Vec2(x, y);
      var T_q_c=T.q.c,T_q_s=T.q.s;var p_x=v.x-T.p.x;var p_y=v.y-T.p.y;out.x=T_q_c*p_x+T_q_s*p_y;out.y=-T_q_s*p_x+T_q_c*p_y;return out;}},{key:"MulXX",value:function MulXX(A,B,out){b2Rot.MulRR(A.q,B.q,out.q);b2Vec2.AddVV(b2Rot.MulRV(A.q,B.p,out.p),A.p,out.p);return out;}},{key:"MulTXX",value:function MulTXX(A,B,out){b2Rot.MulTRR(A.q,B.q,out.q);b2Rot.MulTRV(A.q,b2Vec2.SubVV(B.p,A.p,out.p),out.p);return out;}}]);}();b2Transform.IDENTITY=new b2Transform();/// This describes the motion of a body/shape for TOI computation.
      /// Shapes are defined with respect to the body origin, which may
      /// no coincide with the center of mass. However, to support dynamics
      /// we must interpolate the center of mass position.
      var b2Sweep=/*#__PURE__*/function(){function b2Sweep(){_classCallCheck(this,b2Sweep);this.localCenter=new b2Vec2();this.c0=new b2Vec2();this.c=new b2Vec2();this.a0=0;this.a=0;this.alpha0=0;}return _createClass(b2Sweep,[{key:"Clone",value:function Clone(){return new b2Sweep().Copy(this);}},{key:"Copy",value:function Copy(other){this.localCenter.Copy(other.localCenter);this.c0.Copy(other.c0);this.c.Copy(other.c);this.a0=other.a0;this.a=other.a;this.alpha0=other.alpha0;return this;}},{key:"GetTransform",value:function GetTransform(xf,beta){var one_minus_beta=1-beta;xf.p.x=one_minus_beta*this.c0.x+beta*this.c.x;xf.p.y=one_minus_beta*this.c0.y+beta*this.c.y;var angle=one_minus_beta*this.a0+beta*this.a;xf.q.SetAngle(angle);xf.p.SelfSub(b2Rot.MulRV(xf.q,this.localCenter,b2Vec2.s_t0));return xf;}},{key:"Advance",value:function Advance(alpha){// DEBUG: b2Assert(this.alpha0 < 1);
      var beta=(alpha-this.alpha0)/(1-this.alpha0);var one_minus_beta=1-beta;this.c0.x=one_minus_beta*this.c0.x+beta*this.c.x;this.c0.y=one_minus_beta*this.c0.y+beta*this.c.y;this.a0=one_minus_beta*this.a0+beta*this.a;this.alpha0=alpha;}},{key:"Normalize",value:function Normalize(){var d=b2_two_pi*Math.floor(this.a0/b2_two_pi);this.a0-=d;this.a-=d;}}]);}();/*
        * Copyright (c) 2011 Erin Catto http://box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Color for debug drawing. Each value has the range [0,1].
      var b2Color=/*#__PURE__*/function(){function b2Color(){_classCallCheck(this,b2Color);for(var _len4=arguments.length,args=new Array(_len4),_key4=0;_key4<_len4;_key4++){args[_key4]=arguments[_key4];}if(args[0]instanceof Float32Array){if(args[0].length!==4){throw new Error();}this.data=args[0];}else {var rr=typeof args[0]==="number"?args[0]:0.5;var gg=typeof args[1]==="number"?args[1]:0.5;var bb=typeof args[2]==="number"?args[2]:0.5;var aa=typeof args[3]==="number"?args[3]:1.0;this.data=new Float32Array([rr,gg,bb,aa]);}}return _createClass(b2Color,[{key:"r",get:function get(){return this.data[0];},set:function set(value){this.data[0]=value;}},{key:"g",get:function get(){return this.data[1];},set:function set(value){this.data[1]=value;}},{key:"b",get:function get(){return this.data[2];},set:function set(value){this.data[2]=value;}},{key:"a",get:function get(){return this.data[3];},set:function set(value){this.data[3]=value;}},{key:"Clone",value:function Clone(){return new b2Color().Copy(this);}},{key:"Copy",value:function Copy(other){this.r=other.r;this.g=other.g;this.b=other.b;this.a=other.a;return this;}},{key:"IsEqual",value:function IsEqual(color){return this.r===color.r&&this.g===color.g&&this.b===color.b&&this.a===color.a;}},{key:"IsZero",value:function IsZero(){return this.r===0&&this.g===0&&this.b===0&&this.a===0;}},{key:"Set",value:function Set(r,g,b){var a=arguments.length>3&&arguments[3]!==undefined?arguments[3]:this.a;this.SetRGBA(r,g,b,a);}},{key:"SetByteRGB",value:function SetByteRGB(r,g,b){this.r=r/0xff;this.g=g/0xff;this.b=b/0xff;return this;}},{key:"SetByteRGBA",value:function SetByteRGBA(r,g,b,a){this.r=r/0xff;this.g=g/0xff;this.b=b/0xff;this.a=a/0xff;return this;}},{key:"SetRGB",value:function SetRGB(rr,gg,bb){this.r=rr;this.g=gg;this.b=bb;return this;}},{key:"SetRGBA",value:function SetRGBA(rr,gg,bb,aa){this.r=rr;this.g=gg;this.b=bb;this.a=aa;return this;}},{key:"SelfAdd",value:function SelfAdd(color){this.r+=color.r;this.g+=color.g;this.b+=color.b;this.a+=color.a;return this;}},{key:"Add",value:function Add(color,out){out.r=this.r+color.r;out.g=this.g+color.g;out.b=this.b+color.b;out.a=this.a+color.a;return out;}},{key:"SelfSub",value:function SelfSub(color){this.r-=color.r;this.g-=color.g;this.b-=color.b;this.a-=color.a;return this;}},{key:"Sub",value:function Sub(color,out){out.r=this.r-color.r;out.g=this.g-color.g;out.b=this.b-color.b;out.a=this.a-color.a;return out;}},{key:"SelfMul",value:function SelfMul(s){this.r*=s;this.g*=s;this.b*=s;this.a*=s;return this;}},{key:"Mul",value:function Mul(s,out){out.r=this.r*s;out.g=this.g*s;out.b=this.b*s;out.a=this.a*s;return out;}},{key:"Mix",value:function Mix(mixColor,strength){b2Color.MixColors(this,mixColor,strength);}},{key:"MakeStyleString",value:function MakeStyleString(){var alpha=arguments.length>0&&arguments[0]!==undefined?arguments[0]:this.a;return b2Color.MakeStyleString(this.r,this.g,this.b,alpha);}}],[{key:"MixColors",value:function MixColors(colorA,colorB,strength){var dr=strength*(colorB.r-colorA.r);var dg=strength*(colorB.g-colorA.g);var db=strength*(colorB.b-colorA.b);var da=strength*(colorB.a-colorA.a);colorA.r+=dr;colorA.g+=dg;colorA.b+=db;colorA.a+=da;colorB.r-=dr;colorB.g-=dg;colorB.b-=db;colorB.a-=da;}},{key:"MakeStyleString",value:function MakeStyleString(r,g,b){var a=arguments.length>3&&arguments[3]!==undefined?arguments[3]:1.0;// function clamp(x: number, lo: number, hi: number) { return x < lo ? lo : hi < x ? hi : x; }
      r*=255;// r = clamp(r, 0, 255);
      g*=255;// g = clamp(g, 0, 255);
      b*=255;// b = clamp(b, 0, 255);
      // a = clamp(a, 0, 1);
      if(a<1){return "rgba(".concat(r,",").concat(g,",").concat(b,",").concat(a,")");}else {return "rgb(".concat(r,",").concat(g,",").concat(b,")");}}}]);}();b2Color.ZERO=new b2Color(0,0,0,0);b2Color.RED=new b2Color(1,0,0);b2Color.GREEN=new b2Color(0,1,0);b2Color.BLUE=new b2Color(0,0,1);(function(b2DrawFlags){b2DrawFlags[b2DrawFlags["e_none"]=0]="e_none";b2DrawFlags[b2DrawFlags["e_shapeBit"]=1]="e_shapeBit";b2DrawFlags[b2DrawFlags["e_jointBit"]=2]="e_jointBit";b2DrawFlags[b2DrawFlags["e_aabbBit"]=4]="e_aabbBit";b2DrawFlags[b2DrawFlags["e_pairBit"]=8]="e_pairBit";b2DrawFlags[b2DrawFlags["e_centerOfMassBit"]=16]="e_centerOfMassBit";// #if B2_ENABLE_PARTICLE
      b2DrawFlags[b2DrawFlags["e_particleBit"]=32]="e_particleBit";// #endif
      b2DrawFlags[b2DrawFlags["e_controllerBit"]=64]="e_controllerBit";b2DrawFlags[b2DrawFlags["e_all"]=63]="e_all";})(exports.b2DrawFlags||(exports.b2DrawFlags={}));/// Implement and register this class with a b2World to provide debug drawing of physics
      /// entities in your game.
      var b2Draw=/*#__PURE__*/function(){function b2Draw(){_classCallCheck(this,b2Draw);this.m_drawFlags=0;}return _createClass(b2Draw,[{key:"SetFlags",value:function SetFlags(flags){this.m_drawFlags=flags;}},{key:"GetFlags",value:function GetFlags(){return this.m_drawFlags;}},{key:"AppendFlags",value:function AppendFlags(flags){this.m_drawFlags|=flags;}},{key:"ClearFlags",value:function ClearFlags(flags){this.m_drawFlags&=~flags;}}]);}();/*
        * Copyright (c) 2011 Erin Catto http://box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Timer for profiling. This has platform specific code and may
      /// not work on every platform.
      var b2Timer=/*#__PURE__*/function(){function b2Timer(){_classCallCheck(this,b2Timer);this.m_start=Date.now();}/// Reset the timer.
      return _createClass(b2Timer,[{key:"Reset",value:function Reset(){this.m_start=Date.now();return this;}/// Get the time since construction or the last reset.
      },{key:"GetMilliseconds",value:function GetMilliseconds(){return Date.now()-this.m_start;}}]);}();var b2Counter=/*#__PURE__*/function(){function b2Counter(){_classCallCheck(this,b2Counter);this.m_count=0;this.m_min_count=0;this.m_max_count=0;}return _createClass(b2Counter,[{key:"GetCount",value:function GetCount(){return this.m_count;}},{key:"GetMinCount",value:function GetMinCount(){return this.m_min_count;}},{key:"GetMaxCount",value:function GetMaxCount(){return this.m_max_count;}},{key:"ResetCount",value:function ResetCount(){var count=this.m_count;this.m_count=0;return count;}},{key:"ResetMinCount",value:function ResetMinCount(){this.m_min_count=0;}},{key:"ResetMaxCount",value:function ResetMaxCount(){this.m_max_count=0;}},{key:"Increment",value:function Increment(){this.m_count++;if(this.m_max_count<this.m_count){this.m_max_count=this.m_count;}}},{key:"Decrement",value:function Decrement(){this.m_count--;if(this.m_min_count>this.m_count){this.m_min_count=this.m_count;}}}]);}();/*
        * Copyright (c) 2010 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// This is a growable LIFO stack with an initial capacity of N.
      /// If the stack size exceeds the initial capacity, the heap is used
      /// to increase the size of the stack.
      var b2GrowableStack=/*#__PURE__*/function(){function b2GrowableStack(N){_classCallCheck(this,b2GrowableStack);this.m_stack=[];this.m_count=0;this.m_stack=b2MakeArray(N,function(index){return null;});this.m_count=0;}return _createClass(b2GrowableStack,[{key:"Reset",value:function Reset(){this.m_count=0;return this;}},{key:"Push",value:function Push(element){this.m_stack[this.m_count]=element;this.m_count++;}},{key:"Pop",value:function Pop(){// DEBUG: b2Assert(this.m_count > 0);
      this.m_count--;var element=this.m_stack[this.m_count];this.m_stack[this.m_count]=null;if(element===null){throw new Error();}return element;}},{key:"GetCount",value:function GetCount(){return this.m_count;}}]);}();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2BlockAllocator=/*#__PURE__*/_createClass(function b2BlockAllocator(){_classCallCheck(this,b2BlockAllocator);});/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2StackAllocator=/*#__PURE__*/_createClass(function b2StackAllocator(){_classCallCheck(this,b2StackAllocator);});/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// A distance proxy is used by the GJK algorithm.
      /// It encapsulates any shape.
      var b2DistanceProxy=/*#__PURE__*/function(){function b2DistanceProxy(){_classCallCheck(this,b2DistanceProxy);this.m_buffer=b2Vec2.MakeArray(2);this.m_vertices=this.m_buffer;this.m_count=0;this.m_radius=0;}return _createClass(b2DistanceProxy,[{key:"Copy",value:function Copy(other){if(other.m_vertices===other.m_buffer){this.m_vertices=this.m_buffer;this.m_buffer[0].Copy(other.m_buffer[0]);this.m_buffer[1].Copy(other.m_buffer[1]);}else {this.m_vertices=other.m_vertices;}this.m_count=other.m_count;this.m_radius=other.m_radius;return this;}},{key:"Reset",value:function Reset(){this.m_vertices=this.m_buffer;this.m_count=0;this.m_radius=0;return this;}},{key:"SetShape",value:function SetShape(shape,index){shape.SetupDistanceProxy(this,index);}},{key:"SetVerticesRadius",value:function SetVerticesRadius(vertices,count,radius){this.m_vertices=vertices;this.m_count=count;this.m_radius=radius;}},{key:"GetSupport",value:function GetSupport(d){var bestIndex=0;var bestValue=b2Vec2.DotVV(this.m_vertices[0],d);for(var i=1;i<this.m_count;++i){var value=b2Vec2.DotVV(this.m_vertices[i],d);if(value>bestValue){bestIndex=i;bestValue=value;}}return bestIndex;}},{key:"GetSupportVertex",value:function GetSupportVertex(d){var bestIndex=0;var bestValue=b2Vec2.DotVV(this.m_vertices[0],d);for(var i=1;i<this.m_count;++i){var value=b2Vec2.DotVV(this.m_vertices[i],d);if(value>bestValue){bestIndex=i;bestValue=value;}}return this.m_vertices[bestIndex];}},{key:"GetVertexCount",value:function GetVertexCount(){return this.m_count;}},{key:"GetVertex",value:function GetVertex(index){// DEBUG: b2Assert(0 <= index && index < this.m_count);
      return this.m_vertices[index];}}]);}();var b2SimplexCache=/*#__PURE__*/function(){function b2SimplexCache(){_classCallCheck(this,b2SimplexCache);this.metric=0;this.count=0;this.indexA=[0,0,0];this.indexB=[0,0,0];}return _createClass(b2SimplexCache,[{key:"Reset",value:function Reset(){this.metric=0;this.count=0;return this;}}]);}();var b2DistanceInput=/*#__PURE__*/function(){function b2DistanceInput(){_classCallCheck(this,b2DistanceInput);this.proxyA=new b2DistanceProxy();this.proxyB=new b2DistanceProxy();this.transformA=new b2Transform();this.transformB=new b2Transform();this.useRadii=false;}return _createClass(b2DistanceInput,[{key:"Reset",value:function Reset(){this.proxyA.Reset();this.proxyB.Reset();this.transformA.SetIdentity();this.transformB.SetIdentity();this.useRadii=false;return this;}}]);}();var b2DistanceOutput=/*#__PURE__*/function(){function b2DistanceOutput(){_classCallCheck(this,b2DistanceOutput);this.pointA=new b2Vec2();this.pointB=new b2Vec2();this.distance=0;this.iterations=0;///< number of GJK iterations used
      }return _createClass(b2DistanceOutput,[{key:"Reset",value:function Reset(){this.pointA.SetZero();this.pointB.SetZero();this.distance=0;this.iterations=0;return this;}}]);}();/// Input parameters for b2ShapeCast
      var b2ShapeCastInput=/*#__PURE__*/_createClass(function b2ShapeCastInput(){_classCallCheck(this,b2ShapeCastInput);this.proxyA=new b2DistanceProxy();this.proxyB=new b2DistanceProxy();this.transformA=new b2Transform();this.transformB=new b2Transform();this.translationB=new b2Vec2();});/// Output results for b2ShapeCast
      var b2ShapeCastOutput=/*#__PURE__*/_createClass(function b2ShapeCastOutput(){_classCallCheck(this,b2ShapeCastOutput);this.point=new b2Vec2();this.normal=new b2Vec2();this.lambda=0.0;this.iterations=0;});exports.b2_gjkCalls=0;exports.b2_gjkIters=0;exports.b2_gjkMaxIters=0;function b2_gjk_reset(){exports.b2_gjkCalls=0;exports.b2_gjkIters=0;exports.b2_gjkMaxIters=0;}var b2SimplexVertex=/*#__PURE__*/function(){function b2SimplexVertex(){_classCallCheck(this,b2SimplexVertex);this.wA=new b2Vec2();// support point in proxyA
      this.wB=new b2Vec2();// support point in proxyB
      this.w=new b2Vec2();// wB - wA
      this.a=0;// barycentric coordinate for closest point
      this.indexA=0;// wA index
      this.indexB=0;// wB index
      }return _createClass(b2SimplexVertex,[{key:"Copy",value:function Copy(other){this.wA.Copy(other.wA);// support point in proxyA
      this.wB.Copy(other.wB);// support point in proxyB
      this.w.Copy(other.w);// wB - wA
      this.a=other.a;// barycentric coordinate for closest point
      this.indexA=other.indexA;// wA index
      this.indexB=other.indexB;// wB index
      return this;}}]);}();var b2Simplex=/*#__PURE__*/function(){function b2Simplex(){_classCallCheck(this,b2Simplex);this.m_v1=new b2SimplexVertex();this.m_v2=new b2SimplexVertex();this.m_v3=new b2SimplexVertex();this.m_vertices=[/*3*/];this.m_count=0;this.m_vertices[0]=this.m_v1;this.m_vertices[1]=this.m_v2;this.m_vertices[2]=this.m_v3;}return _createClass(b2Simplex,[{key:"ReadCache",value:function ReadCache(cache,proxyA,transformA,proxyB,transformB){// DEBUG: b2Assert(0 <= cache.count && cache.count <= 3);
      // Copy data from cache.
      this.m_count=cache.count;var vertices=this.m_vertices;for(var i=0;i<this.m_count;++i){var v=vertices[i];v.indexA=cache.indexA[i];v.indexB=cache.indexB[i];var wALocal=proxyA.GetVertex(v.indexA);var wBLocal=proxyB.GetVertex(v.indexB);b2Transform.MulXV(transformA,wALocal,v.wA);b2Transform.MulXV(transformB,wBLocal,v.wB);b2Vec2.SubVV(v.wB,v.wA,v.w);v.a=0;}// Compute the new simplex metric, if it is substantially different than
      // old metric then flush the simplex.
      if(this.m_count>1){var metric1=cache.metric;var metric2=this.GetMetric();if(metric2<0.5*metric1||2*metric1<metric2||metric2<b2_epsilon){// Reset the simplex.
      this.m_count=0;}}// If the cache is empty or invalid ...
      if(this.m_count===0){var _v=vertices[0];_v.indexA=0;_v.indexB=0;var _wALocal=proxyA.GetVertex(0);var _wBLocal=proxyB.GetVertex(0);b2Transform.MulXV(transformA,_wALocal,_v.wA);b2Transform.MulXV(transformB,_wBLocal,_v.wB);b2Vec2.SubVV(_v.wB,_v.wA,_v.w);_v.a=1;this.m_count=1;}}},{key:"WriteCache",value:function WriteCache(cache){cache.metric=this.GetMetric();cache.count=this.m_count;var vertices=this.m_vertices;for(var i=0;i<this.m_count;++i){cache.indexA[i]=vertices[i].indexA;cache.indexB[i]=vertices[i].indexB;}}},{key:"GetSearchDirection",value:function GetSearchDirection(out){switch(this.m_count){case 1:return b2Vec2.NegV(this.m_v1.w,out);case 2:{var e12=b2Vec2.SubVV(this.m_v2.w,this.m_v1.w,out);var sgn=b2Vec2.CrossVV(e12,b2Vec2.NegV(this.m_v1.w,b2Vec2.s_t0));if(sgn>0){// Origin is left of e12.
      return b2Vec2.CrossOneV(e12,out);}else {// Origin is right of e12.
      return b2Vec2.CrossVOne(e12,out);}}default:// DEBUG: b2Assert(false);
      return out.SetZero();}}},{key:"GetClosestPoint",value:function GetClosestPoint(out){switch(this.m_count){case 0:// DEBUG: b2Assert(false);
      return out.SetZero();case 1:return out.Copy(this.m_v1.w);case 2:return out.Set(this.m_v1.a*this.m_v1.w.x+this.m_v2.a*this.m_v2.w.x,this.m_v1.a*this.m_v1.w.y+this.m_v2.a*this.m_v2.w.y);case 3:return out.SetZero();default:// DEBUG: b2Assert(false);
      return out.SetZero();}}},{key:"GetWitnessPoints",value:function GetWitnessPoints(pA,pB){switch(this.m_count){case 0:// DEBUG: b2Assert(false);
      break;case 1:pA.Copy(this.m_v1.wA);pB.Copy(this.m_v1.wB);break;case 2:pA.x=this.m_v1.a*this.m_v1.wA.x+this.m_v2.a*this.m_v2.wA.x;pA.y=this.m_v1.a*this.m_v1.wA.y+this.m_v2.a*this.m_v2.wA.y;pB.x=this.m_v1.a*this.m_v1.wB.x+this.m_v2.a*this.m_v2.wB.x;pB.y=this.m_v1.a*this.m_v1.wB.y+this.m_v2.a*this.m_v2.wB.y;break;case 3:pB.x=pA.x=this.m_v1.a*this.m_v1.wA.x+this.m_v2.a*this.m_v2.wA.x+this.m_v3.a*this.m_v3.wA.x;pB.y=pA.y=this.m_v1.a*this.m_v1.wA.y+this.m_v2.a*this.m_v2.wA.y+this.m_v3.a*this.m_v3.wA.y;break;}}},{key:"GetMetric",value:function GetMetric(){switch(this.m_count){case 0:// DEBUG: b2Assert(false);
      return 0;case 1:return 0;case 2:return b2Vec2.DistanceVV(this.m_v1.w,this.m_v2.w);case 3:return b2Vec2.CrossVV(b2Vec2.SubVV(this.m_v2.w,this.m_v1.w,b2Vec2.s_t0),b2Vec2.SubVV(this.m_v3.w,this.m_v1.w,b2Vec2.s_t1));default:// DEBUG: b2Assert(false);
      return 0;}}},{key:"Solve2",value:function Solve2(){var w1=this.m_v1.w;var w2=this.m_v2.w;var e12=b2Vec2.SubVV(w2,w1,b2Simplex.s_e12);// w1 region
      var d12_2=-b2Vec2.DotVV(w1,e12);if(d12_2<=0){// a2 <= 0, so we clamp it to 0
      this.m_v1.a=1;this.m_count=1;return;}// w2 region
      var d12_1=b2Vec2.DotVV(w2,e12);if(d12_1<=0){// a1 <= 0, so we clamp it to 0
      this.m_v2.a=1;this.m_count=1;this.m_v1.Copy(this.m_v2);return;}// Must be in e12 region.
      var inv_d12=1/(d12_1+d12_2);this.m_v1.a=d12_1*inv_d12;this.m_v2.a=d12_2*inv_d12;this.m_count=2;}},{key:"Solve3",value:function Solve3(){var w1=this.m_v1.w;var w2=this.m_v2.w;var w3=this.m_v3.w;// Edge12
      // [1      1     ][a1] = [1]
      // [w1.e12 w2.e12][a2] = [0]
      // a3 = 0
      var e12=b2Vec2.SubVV(w2,w1,b2Simplex.s_e12);var w1e12=b2Vec2.DotVV(w1,e12);var w2e12=b2Vec2.DotVV(w2,e12);var d12_1=w2e12;var d12_2=-w1e12;// Edge13
      // [1      1     ][a1] = [1]
      // [w1.e13 w3.e13][a3] = [0]
      // a2 = 0
      var e13=b2Vec2.SubVV(w3,w1,b2Simplex.s_e13);var w1e13=b2Vec2.DotVV(w1,e13);var w3e13=b2Vec2.DotVV(w3,e13);var d13_1=w3e13;var d13_2=-w1e13;// Edge23
      // [1      1     ][a2] = [1]
      // [w2.e23 w3.e23][a3] = [0]
      // a1 = 0
      var e23=b2Vec2.SubVV(w3,w2,b2Simplex.s_e23);var w2e23=b2Vec2.DotVV(w2,e23);var w3e23=b2Vec2.DotVV(w3,e23);var d23_1=w3e23;var d23_2=-w2e23;// Triangle123
      var n123=b2Vec2.CrossVV(e12,e13);var d123_1=n123*b2Vec2.CrossVV(w2,w3);var d123_2=n123*b2Vec2.CrossVV(w3,w1);var d123_3=n123*b2Vec2.CrossVV(w1,w2);// w1 region
      if(d12_2<=0&&d13_2<=0){this.m_v1.a=1;this.m_count=1;return;}// e12
      if(d12_1>0&&d12_2>0&&d123_3<=0){var inv_d12=1/(d12_1+d12_2);this.m_v1.a=d12_1*inv_d12;this.m_v2.a=d12_2*inv_d12;this.m_count=2;return;}// e13
      if(d13_1>0&&d13_2>0&&d123_2<=0){var inv_d13=1/(d13_1+d13_2);this.m_v1.a=d13_1*inv_d13;this.m_v3.a=d13_2*inv_d13;this.m_count=2;this.m_v2.Copy(this.m_v3);return;}// w2 region
      if(d12_1<=0&&d23_2<=0){this.m_v2.a=1;this.m_count=1;this.m_v1.Copy(this.m_v2);return;}// w3 region
      if(d13_1<=0&&d23_1<=0){this.m_v3.a=1;this.m_count=1;this.m_v1.Copy(this.m_v3);return;}// e23
      if(d23_1>0&&d23_2>0&&d123_1<=0){var inv_d23=1/(d23_1+d23_2);this.m_v2.a=d23_1*inv_d23;this.m_v3.a=d23_2*inv_d23;this.m_count=2;this.m_v1.Copy(this.m_v3);return;}// Must be in triangle123
      var inv_d123=1/(d123_1+d123_2+d123_3);this.m_v1.a=d123_1*inv_d123;this.m_v2.a=d123_2*inv_d123;this.m_v3.a=d123_3*inv_d123;this.m_count=3;}}]);}();b2Simplex.s_e12=new b2Vec2();b2Simplex.s_e13=new b2Vec2();b2Simplex.s_e23=new b2Vec2();var b2Distance_s_simplex=new b2Simplex();var b2Distance_s_saveA=[0,0,0];var b2Distance_s_saveB=[0,0,0];var b2Distance_s_p=new b2Vec2();var b2Distance_s_d=new b2Vec2();var b2Distance_s_normal=new b2Vec2();var b2Distance_s_supportA=new b2Vec2();var b2Distance_s_supportB=new b2Vec2();function b2Distance(output,cache,input){++exports.b2_gjkCalls;var proxyA=input.proxyA;var proxyB=input.proxyB;var transformA=input.transformA;var transformB=input.transformB;// Initialize the simplex.
      var simplex=b2Distance_s_simplex;simplex.ReadCache(cache,proxyA,transformA,proxyB,transformB);// Get simplex vertices as an array.
      var vertices=simplex.m_vertices;var k_maxIters=20;// These store the vertices of the last simplex so that we
      // can check for duplicates and prevent cycling.
      var saveA=b2Distance_s_saveA;var saveB=b2Distance_s_saveB;var saveCount=0;// Main iteration loop.
      var iter=0;while(iter<k_maxIters){// Copy simplex so we can identify duplicates.
      saveCount=simplex.m_count;for(var i=0;i<saveCount;++i){saveA[i]=vertices[i].indexA;saveB[i]=vertices[i].indexB;}switch(simplex.m_count){case 1:break;case 2:simplex.Solve2();break;case 3:simplex.Solve3();break;}// If we have 3 points, then the origin is in the corresponding triangle.
      if(simplex.m_count===3){break;}// Get search direction.
      var d=simplex.GetSearchDirection(b2Distance_s_d);// Ensure the search direction is numerically fit.
      if(d.LengthSquared()<b2_epsilon_sq){// The origin is probably contained by a line segment
      // or triangle. Thus the shapes are overlapped.
      // We can't return zero here even though there may be overlap.
      // In case the simplex is a point, segment, or triangle it is difficult
      // to determine if the origin is contained in the CSO or very close to it.
      break;}// Compute a tentative new simplex vertex using support points.
      var vertex=vertices[simplex.m_count];vertex.indexA=proxyA.GetSupport(b2Rot.MulTRV(transformA.q,b2Vec2.NegV(d,b2Vec2.s_t0),b2Distance_s_supportA));b2Transform.MulXV(transformA,proxyA.GetVertex(vertex.indexA),vertex.wA);vertex.indexB=proxyB.GetSupport(b2Rot.MulTRV(transformB.q,d,b2Distance_s_supportB));b2Transform.MulXV(transformB,proxyB.GetVertex(vertex.indexB),vertex.wB);b2Vec2.SubVV(vertex.wB,vertex.wA,vertex.w);// Iteration count is equated to the number of support point calls.
      ++iter;++exports.b2_gjkIters;// Check for duplicate support points. This is the main termination criteria.
      var duplicate=false;for(var _i=0;_i<saveCount;++_i){if(vertex.indexA===saveA[_i]&&vertex.indexB===saveB[_i]){duplicate=true;break;}}// If we found a duplicate support point we must exit to avoid cycling.
      if(duplicate){break;}// New vertex is ok and needed.
      ++simplex.m_count;}exports.b2_gjkMaxIters=b2Max(exports.b2_gjkMaxIters,iter);// Prepare output.
      simplex.GetWitnessPoints(output.pointA,output.pointB);output.distance=b2Vec2.DistanceVV(output.pointA,output.pointB);output.iterations=iter;// Cache the simplex.
      simplex.WriteCache(cache);// Apply radii if requested.
      if(input.useRadii){var rA=proxyA.m_radius;var rB=proxyB.m_radius;if(output.distance>rA+rB&&output.distance>b2_epsilon){// Shapes are still no overlapped.
      // Move the witness points to the outer surface.
      output.distance-=rA+rB;var normal=b2Vec2.SubVV(output.pointB,output.pointA,b2Distance_s_normal);normal.Normalize();output.pointA.SelfMulAdd(rA,normal);output.pointB.SelfMulSub(rB,normal);}else {// Shapes are overlapped when radii are considered.
      // Move the witness points to the middle.
      var p=b2Vec2.MidVV(output.pointA,output.pointB,b2Distance_s_p);output.pointA.Copy(p);output.pointB.Copy(p);output.distance=0;}}}/// Perform a linear shape cast of shape B moving and shape A fixed. Determines the hit point, normal, and translation fraction.
      // GJK-raycast
      // Algorithm by Gino van den Bergen.
      // "Smooth Mesh Contacts with GJK" in Game Physics Pearls. 2010
      // bool b2ShapeCast(b2ShapeCastOutput* output, const b2ShapeCastInput* input);
      var b2ShapeCast_s_n=new b2Vec2();var b2ShapeCast_s_simplex=new b2Simplex();var b2ShapeCast_s_wA=new b2Vec2();var b2ShapeCast_s_wB=new b2Vec2();var b2ShapeCast_s_v=new b2Vec2();var b2ShapeCast_s_p=new b2Vec2();var b2ShapeCast_s_pointA=new b2Vec2();var b2ShapeCast_s_pointB=new b2Vec2();function b2ShapeCast(output,input){output.iterations=0;output.lambda=1.0;output.normal.SetZero();output.point.SetZero();// const b2DistanceProxy* proxyA = &input.proxyA;
      var proxyA=input.proxyA;// const b2DistanceProxy* proxyB = &input.proxyB;
      var proxyB=input.proxyB;// float32 radiusA = b2Max(proxyA.m_radius, b2_polygonRadius);
      var radiusA=b2Max(proxyA.m_radius,b2_polygonRadius);// float32 radiusB = b2Max(proxyB.m_radius, b2_polygonRadius);
      var radiusB=b2Max(proxyB.m_radius,b2_polygonRadius);// float32 radius = radiusA + radiusB;
      var radius=radiusA+radiusB;// b2Transform xfA = input.transformA;
      var xfA=input.transformA;// b2Transform xfB = input.transformB;
      var xfB=input.transformB;// b2Vec2 r = input.translationB;
      var r=input.translationB;// b2Vec2 n(0.0f, 0.0f);
      var n=b2ShapeCast_s_n.Set(0.0,0.0);// float32 lambda = 0.0f;
      var lambda=0.0;// Initial simplex
      var simplex=b2ShapeCast_s_simplex;simplex.m_count=0;// Get simplex vertices as an array.
      // b2SimplexVertex* vertices = &simplex.m_v1;
      var vertices=simplex.m_vertices;// Get support point in -r direction
      // int32 indexA = proxyA.GetSupport(b2MulT(xfA.q, -r));
      var indexA=proxyA.GetSupport(b2Rot.MulTRV(xfA.q,b2Vec2.NegV(r,b2Vec2.s_t1),b2Vec2.s_t0));// b2Vec2 wA = b2Mul(xfA, proxyA.GetVertex(indexA));
      var wA=b2Transform.MulXV(xfA,proxyA.GetVertex(indexA),b2ShapeCast_s_wA);// int32 indexB = proxyB.GetSupport(b2MulT(xfB.q, r));
      var indexB=proxyB.GetSupport(b2Rot.MulTRV(xfB.q,r,b2Vec2.s_t0));// b2Vec2 wB = b2Mul(xfB, proxyB.GetVertex(indexB));
      var wB=b2Transform.MulXV(xfB,proxyB.GetVertex(indexB),b2ShapeCast_s_wB);// b2Vec2 v = wA - wB;
      var v=b2Vec2.SubVV(wA,wB,b2ShapeCast_s_v);// Sigma is the target distance between polygons
      // float32 sigma = b2Max(b2_polygonRadius, radius - b2_polygonRadius);
      var sigma=b2Max(b2_polygonRadius,radius-b2_polygonRadius);// const float32 tolerance = 0.5f * b2_linearSlop;
      var tolerance=0.5*b2_linearSlop;// Main iteration loop.
      // const int32 k_maxIters = 20;
      var k_maxIters=20;// int32 iter = 0;
      var iter=0;// while (iter < k_maxIters && b2Abs(v.Length() - sigma) > tolerance)
      while(iter<k_maxIters&&b2Abs(v.Length()-sigma)>tolerance){// DEBUG: b2Assert(simplex.m_count < 3);
      output.iterations+=1;// Support in direction -v (A - B)
      // indexA = proxyA.GetSupport(b2MulT(xfA.q, -v));
      indexA=proxyA.GetSupport(b2Rot.MulTRV(xfA.q,b2Vec2.NegV(v,b2Vec2.s_t1),b2Vec2.s_t0));// wA = b2Mul(xfA, proxyA.GetVertex(indexA));
      wA=b2Transform.MulXV(xfA,proxyA.GetVertex(indexA),b2ShapeCast_s_wA);// indexB = proxyB.GetSupport(b2MulT(xfB.q, v));
      indexB=proxyB.GetSupport(b2Rot.MulTRV(xfB.q,v,b2Vec2.s_t0));// wB = b2Mul(xfB, proxyB.GetVertex(indexB));
      wB=b2Transform.MulXV(xfB,proxyB.GetVertex(indexB),b2ShapeCast_s_wB);// b2Vec2 p = wA - wB;
      var p=b2Vec2.SubVV(wA,wB,b2ShapeCast_s_p);// -v is a normal at p
      v.Normalize();// Intersect ray with plane
      var vp=b2Vec2.DotVV(v,p);var vr=b2Vec2.DotVV(v,r);if(vp-sigma>lambda*vr){if(vr<=0.0){return false;}lambda=(vp-sigma)/vr;if(lambda>1.0){return false;}// n = -v;
      n.Copy(v).SelfNeg();simplex.m_count=0;}// Reverse simplex since it works with B - A.
      // Shift by lambda * r because we want the closest point to the current clip point.
      // Note that the support point p is not shifted because we want the plane equation
      // to be formed in unshifted space.
      // b2SimplexVertex* vertex = vertices + simplex.m_count;
      var vertex=vertices[simplex.m_count];vertex.indexA=indexB;// vertex.wA = wB + lambda * r;
      vertex.wA.Copy(wB).SelfMulAdd(lambda,r);vertex.indexB=indexA;// vertex.wB = wA;
      vertex.wB.Copy(wA);// vertex.w = vertex.wB - vertex.wA;
      vertex.w.Copy(vertex.wB).SelfSub(vertex.wA);vertex.a=1.0;simplex.m_count+=1;switch(simplex.m_count){case 1:break;case 2:simplex.Solve2();break;case 3:simplex.Solve3();break;// DEBUG: b2Assert(false);
      }// If we have 3 points, then the origin is in the corresponding triangle.
      if(simplex.m_count===3){// Overlap
      return false;}// Get search direction.
      // v = simplex.GetClosestPoint();
      simplex.GetClosestPoint(v);// Iteration count is equated to the number of support point calls.
      ++iter;}// Prepare output.
      var pointA=b2ShapeCast_s_pointA;var pointB=b2ShapeCast_s_pointB;simplex.GetWitnessPoints(pointA,pointB);if(v.LengthSquared()>0.0){// n = -v;
      n.Copy(v).SelfNeg();n.Normalize();}// output.point = pointA + radiusA * n;
      output.normal.Copy(n);output.lambda=lambda;output.iterations=iter;return true;}/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */(function(b2ContactFeatureType){b2ContactFeatureType[b2ContactFeatureType["e_vertex"]=0]="e_vertex";b2ContactFeatureType[b2ContactFeatureType["e_face"]=1]="e_face";})(exports.b2ContactFeatureType||(exports.b2ContactFeatureType={}));/// The features that intersect to form the contact point
      /// This must be 4 bytes or less.
      var b2ContactFeature=/*#__PURE__*/function(){function b2ContactFeature(){_classCallCheck(this,b2ContactFeature);this._key=0;this._key_invalid=false;this._indexA=0;this._indexB=0;this._typeA=0;this._typeB=0;}return _createClass(b2ContactFeature,[{key:"key",get:function get(){if(this._key_invalid){this._key_invalid=false;this._key=this._indexA|this._indexB<<8|this._typeA<<16|this._typeB<<24;}return this._key;},set:function set(value){this._key=value;this._key_invalid=false;this._indexA=this._key&0xff;this._indexB=this._key>>8&0xff;this._typeA=this._key>>16&0xff;this._typeB=this._key>>24&0xff;}},{key:"indexA",get:function get(){return this._indexA;},set:function set(value){this._indexA=value;this._key_invalid=true;}},{key:"indexB",get:function get(){return this._indexB;},set:function set(value){this._indexB=value;this._key_invalid=true;}},{key:"typeA",get:function get(){return this._typeA;},set:function set(value){this._typeA=value;this._key_invalid=true;}},{key:"typeB",get:function get(){return this._typeB;},set:function set(value){this._typeB=value;this._key_invalid=true;}}]);}();/// Contact ids to facilitate warm starting.
      var b2ContactID=/*#__PURE__*/function(){function b2ContactID(){_classCallCheck(this,b2ContactID);this.cf=new b2ContactFeature();}return _createClass(b2ContactID,[{key:"Copy",value:function Copy(o){this.key=o.key;return this;}},{key:"Clone",value:function Clone(){return new b2ContactID().Copy(this);}},{key:"key",get:function get(){return this.cf.key;},set:function set(value){this.cf.key=value;}}]);}();/// A manifold point is a contact point belonging to a contact
      /// manifold. It holds details related to the geometry and dynamics
      /// of the contact points.
      /// The local point usage depends on the manifold type:
      /// -e_circles: the local center of circleB
      /// -e_faceA: the local center of cirlceB or the clip point of polygonB
      /// -e_faceB: the clip point of polygonA
      /// This structure is stored across time steps, so we keep it small.
      /// Note: the impulses are used for internal caching and may not
      /// provide reliable contact forces, especially for high speed collisions.
      var b2ManifoldPoint=/*#__PURE__*/function(){function b2ManifoldPoint(){_classCallCheck(this,b2ManifoldPoint);this.localPoint=new b2Vec2();///< usage depends on manifold type
      this.normalImpulse=0;///< the non-penetration impulse
      this.tangentImpulse=0;///< the friction impulse
      this.id=new b2ContactID();///< uniquely identifies a contact point between two shapes
      }return _createClass(b2ManifoldPoint,[{key:"Reset",value:function Reset(){this.localPoint.SetZero();this.normalImpulse=0;this.tangentImpulse=0;this.id.key=0;}},{key:"Copy",value:function Copy(o){this.localPoint.Copy(o.localPoint);this.normalImpulse=o.normalImpulse;this.tangentImpulse=o.tangentImpulse;this.id.Copy(o.id);return this;}}],[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2ManifoldPoint();});}}]);}();(function(b2ManifoldType){b2ManifoldType[b2ManifoldType["e_unknown"]=-1]="e_unknown";b2ManifoldType[b2ManifoldType["e_circles"]=0]="e_circles";b2ManifoldType[b2ManifoldType["e_faceA"]=1]="e_faceA";b2ManifoldType[b2ManifoldType["e_faceB"]=2]="e_faceB";})(exports.b2ManifoldType||(exports.b2ManifoldType={}));/// A manifold for two touching convex shapes.
      /// Box2D supports multiple types of contact:
      /// - clip point versus plane with radius
      /// - point versus point with radius (circles)
      /// The local point usage depends on the manifold type:
      /// -e_circles: the local center of circleA
      /// -e_faceA: the center of faceA
      /// -e_faceB: the center of faceB
      /// Similarly the local normal usage:
      /// -e_circles: not used
      /// -e_faceA: the normal on polygonA
      /// -e_faceB: the normal on polygonB
      /// We store contacts in this way so that position correction can
      /// account for movement, which is critical for continuous physics.
      /// All contact scenarios must be expressed in one of these types.
      /// This structure is stored across time steps, so we keep it small.
      var b2Manifold=/*#__PURE__*/function(){function b2Manifold(){_classCallCheck(this,b2Manifold);this.points=b2ManifoldPoint.MakeArray(b2_maxManifoldPoints);this.localNormal=new b2Vec2();this.localPoint=new b2Vec2();this.type=exports.b2ManifoldType.e_unknown;this.pointCount=0;}return _createClass(b2Manifold,[{key:"Reset",value:function Reset(){for(var i=0;i<b2_maxManifoldPoints;++i){// DEBUG: b2Assert(this.points[i] instanceof b2ManifoldPoint);
      this.points[i].Reset();}this.localNormal.SetZero();this.localPoint.SetZero();this.type=exports.b2ManifoldType.e_unknown;this.pointCount=0;}},{key:"Copy",value:function Copy(o){this.pointCount=o.pointCount;for(var i=0;i<b2_maxManifoldPoints;++i){// DEBUG: b2Assert(this.points[i] instanceof b2ManifoldPoint);
      this.points[i].Copy(o.points[i]);}this.localNormal.Copy(o.localNormal);this.localPoint.Copy(o.localPoint);this.type=o.type;return this;}},{key:"Clone",value:function Clone(){return new b2Manifold().Copy(this);}}]);}();var b2WorldManifold=/*#__PURE__*/function(){function b2WorldManifold(){_classCallCheck(this,b2WorldManifold);this.normal=new b2Vec2();this.points=b2Vec2.MakeArray(b2_maxManifoldPoints);this.separations=b2MakeNumberArray(b2_maxManifoldPoints);}return _createClass(b2WorldManifold,[{key:"Initialize",value:function Initialize(manifold,xfA,radiusA,xfB,radiusB){if(manifold.pointCount===0){return;}switch(manifold.type){case exports.b2ManifoldType.e_circles:{this.normal.Set(1,0);var pointA=b2Transform.MulXV(xfA,manifold.localPoint,b2WorldManifold.Initialize_s_pointA);var pointB=b2Transform.MulXV(xfB,manifold.points[0].localPoint,b2WorldManifold.Initialize_s_pointB);if(b2Vec2.DistanceSquaredVV(pointA,pointB)>b2_epsilon_sq){b2Vec2.SubVV(pointB,pointA,this.normal).SelfNormalize();}var cA=b2Vec2.AddVMulSV(pointA,radiusA,this.normal,b2WorldManifold.Initialize_s_cA);var cB=b2Vec2.SubVMulSV(pointB,radiusB,this.normal,b2WorldManifold.Initialize_s_cB);b2Vec2.MidVV(cA,cB,this.points[0]);this.separations[0]=b2Vec2.DotVV(b2Vec2.SubVV(cB,cA,b2Vec2.s_t0),this.normal);// b2Dot(cB - cA, normal);
      break;}case exports.b2ManifoldType.e_faceA:{b2Rot.MulRV(xfA.q,manifold.localNormal,this.normal);var planePoint=b2Transform.MulXV(xfA,manifold.localPoint,b2WorldManifold.Initialize_s_planePoint);for(var i=0;i<manifold.pointCount;++i){var clipPoint=b2Transform.MulXV(xfB,manifold.points[i].localPoint,b2WorldManifold.Initialize_s_clipPoint);var s=radiusA-b2Vec2.DotVV(b2Vec2.SubVV(clipPoint,planePoint,b2Vec2.s_t0),this.normal);var _cA=b2Vec2.AddVMulSV(clipPoint,s,this.normal,b2WorldManifold.Initialize_s_cA);var _cB=b2Vec2.SubVMulSV(clipPoint,radiusB,this.normal,b2WorldManifold.Initialize_s_cB);b2Vec2.MidVV(_cA,_cB,this.points[i]);this.separations[i]=b2Vec2.DotVV(b2Vec2.SubVV(_cB,_cA,b2Vec2.s_t0),this.normal);// b2Dot(cB - cA, normal);
      }break;}case exports.b2ManifoldType.e_faceB:{b2Rot.MulRV(xfB.q,manifold.localNormal,this.normal);var _planePoint=b2Transform.MulXV(xfB,manifold.localPoint,b2WorldManifold.Initialize_s_planePoint);for(var _i2=0;_i2<manifold.pointCount;++_i2){var _clipPoint=b2Transform.MulXV(xfA,manifold.points[_i2].localPoint,b2WorldManifold.Initialize_s_clipPoint);var _s=radiusB-b2Vec2.DotVV(b2Vec2.SubVV(_clipPoint,_planePoint,b2Vec2.s_t0),this.normal);var _cB2=b2Vec2.AddVMulSV(_clipPoint,_s,this.normal,b2WorldManifold.Initialize_s_cB);var _cA2=b2Vec2.SubVMulSV(_clipPoint,radiusA,this.normal,b2WorldManifold.Initialize_s_cA);b2Vec2.MidVV(_cA2,_cB2,this.points[_i2]);this.separations[_i2]=b2Vec2.DotVV(b2Vec2.SubVV(_cA2,_cB2,b2Vec2.s_t0),this.normal);// b2Dot(cA - cB, normal);
      }// Ensure normal points from A to B.
      this.normal.SelfNeg();break;}}}}]);}();b2WorldManifold.Initialize_s_pointA=new b2Vec2();b2WorldManifold.Initialize_s_pointB=new b2Vec2();b2WorldManifold.Initialize_s_cA=new b2Vec2();b2WorldManifold.Initialize_s_cB=new b2Vec2();b2WorldManifold.Initialize_s_planePoint=new b2Vec2();b2WorldManifold.Initialize_s_clipPoint=new b2Vec2();(function(b2PointState){b2PointState[b2PointState["b2_nullState"]=0]="b2_nullState";b2PointState[b2PointState["b2_addState"]=1]="b2_addState";b2PointState[b2PointState["b2_persistState"]=2]="b2_persistState";b2PointState[b2PointState["b2_removeState"]=3]="b2_removeState";})(exports.b2PointState||(exports.b2PointState={}));/// Compute the point states given two manifolds. The states pertain to the transition from manifold1
      /// to manifold2. So state1 is either persist or remove while state2 is either add or persist.
      function b2GetPointStates(state1,state2,manifold1,manifold2){// Detect persists and removes.
      var i;for(i=0;i<manifold1.pointCount;++i){var id=manifold1.points[i].id;var key=id.key;state1[i]=exports.b2PointState.b2_removeState;for(var j=0,jct=manifold2.pointCount;j<jct;++j){if(manifold2.points[j].id.key===key){state1[i]=exports.b2PointState.b2_persistState;break;}}}for(;i<b2_maxManifoldPoints;++i){state1[i]=exports.b2PointState.b2_nullState;}// Detect persists and adds.
      for(i=0;i<manifold2.pointCount;++i){var _id=manifold2.points[i].id;var _key5=_id.key;state2[i]=exports.b2PointState.b2_addState;for(var _j=0,_jct=manifold1.pointCount;_j<_jct;++_j){if(manifold1.points[_j].id.key===_key5){state2[i]=exports.b2PointState.b2_persistState;break;}}}for(;i<b2_maxManifoldPoints;++i){state2[i]=exports.b2PointState.b2_nullState;}}/// Used for computing contact manifolds.
      var b2ClipVertex=/*#__PURE__*/function(){function b2ClipVertex(){_classCallCheck(this,b2ClipVertex);this.v=new b2Vec2();this.id=new b2ContactID();}return _createClass(b2ClipVertex,[{key:"Copy",value:function Copy(other){this.v.Copy(other.v);this.id.Copy(other.id);return this;}}],[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2ClipVertex();});}}]);}();/// Ray-cast input data. The ray extends from p1 to p1 + maxFraction * (p2 - p1).
      var b2RayCastInput=/*#__PURE__*/function(){function b2RayCastInput(){_classCallCheck(this,b2RayCastInput);this.p1=new b2Vec2();this.p2=new b2Vec2();this.maxFraction=1;}return _createClass(b2RayCastInput,[{key:"Copy",value:function Copy(o){this.p1.Copy(o.p1);this.p2.Copy(o.p2);this.maxFraction=o.maxFraction;return this;}}]);}();/// Ray-cast output data. The ray hits at p1 + fraction * (p2 - p1), where p1 and p2
      /// come from b2RayCastInput.
      var b2RayCastOutput=/*#__PURE__*/function(){function b2RayCastOutput(){_classCallCheck(this,b2RayCastOutput);this.normal=new b2Vec2();this.fraction=0;}return _createClass(b2RayCastOutput,[{key:"Copy",value:function Copy(o){this.normal.Copy(o.normal);this.fraction=o.fraction;return this;}}]);}();/// An axis aligned bounding box.
      var b2AABB=/*#__PURE__*/function(){function b2AABB(){_classCallCheck(this,b2AABB);this.lowerBound=new b2Vec2();///< the lower vertex
      this.upperBound=new b2Vec2();///< the upper vertex
      this.m_cache_center=new b2Vec2();// access using GetCenter()
      this.m_cache_extent=new b2Vec2();// access using GetExtents()
      }return _createClass(b2AABB,[{key:"Copy",value:function Copy(o){this.lowerBound.Copy(o.lowerBound);this.upperBound.Copy(o.upperBound);return this;}/// Verify that the bounds are sorted.
      },{key:"IsValid",value:function IsValid(){if(!this.lowerBound.IsValid()){return false;}if(!this.upperBound.IsValid()){return false;}if(this.upperBound.x<this.lowerBound.x){return false;}if(this.upperBound.y<this.lowerBound.y){return false;}return true;}/// Get the center of the AABB.
      },{key:"GetCenter",value:function GetCenter(){return b2Vec2.MidVV(this.lowerBound,this.upperBound,this.m_cache_center);}/// Get the extents of the AABB (half-widths).
      },{key:"GetExtents",value:function GetExtents(){return b2Vec2.ExtVV(this.lowerBound,this.upperBound,this.m_cache_extent);}/// Get the perimeter length
      },{key:"GetPerimeter",value:function GetPerimeter(){var wx=this.upperBound.x-this.lowerBound.x;var wy=this.upperBound.y-this.lowerBound.y;return 2*(wx+wy);}/// Combine an AABB into this one.
      },{key:"Combine1",value:function Combine1(aabb){this.lowerBound.x=b2Min(this.lowerBound.x,aabb.lowerBound.x);this.lowerBound.y=b2Min(this.lowerBound.y,aabb.lowerBound.y);this.upperBound.x=b2Max(this.upperBound.x,aabb.upperBound.x);this.upperBound.y=b2Max(this.upperBound.y,aabb.upperBound.y);return this;}/// Combine two AABBs into this one.
      },{key:"Combine2",value:function Combine2(aabb1,aabb2){this.lowerBound.x=b2Min(aabb1.lowerBound.x,aabb2.lowerBound.x);this.lowerBound.y=b2Min(aabb1.lowerBound.y,aabb2.lowerBound.y);this.upperBound.x=b2Max(aabb1.upperBound.x,aabb2.upperBound.x);this.upperBound.y=b2Max(aabb1.upperBound.y,aabb2.upperBound.y);return this;}},{key:"Contains",value:/// Does this aabb contain the provided AABB.
      function Contains(aabb){if(this.lowerBound.x<=aabb.lowerBound.x){return false;}if(this.lowerBound.y<=aabb.lowerBound.y){return false;}if(aabb.upperBound.x<=this.upperBound.x){return false;}if(aabb.upperBound.y<=this.upperBound.y){return false;}return true;}// From Real-time Collision Detection, p179.
      },{key:"RayCast",value:function RayCast(output,input){var tmin=-b2_maxFloat;var tmax=b2_maxFloat;var p_x=input.p1.x;var p_y=input.p1.y;var d_x=input.p2.x-input.p1.x;var d_y=input.p2.y-input.p1.y;var absD_x=b2Abs(d_x);var absD_y=b2Abs(d_y);var normal=output.normal;if(absD_x<b2_epsilon){// Parallel.
      if(p_x<this.lowerBound.x||this.upperBound.x<p_x){return false;}}else {var inv_d=1/d_x;var t1=(this.lowerBound.x-p_x)*inv_d;var t2=(this.upperBound.x-p_x)*inv_d;// Sign of the normal vector.
      var s=-1;if(t1>t2){var t3=t1;t1=t2;t2=t3;s=1;}// Push the min up
      if(t1>tmin){normal.x=s;normal.y=0;tmin=t1;}// Pull the max down
      tmax=b2Min(tmax,t2);if(tmin>tmax){return false;}}if(absD_y<b2_epsilon){// Parallel.
      if(p_y<this.lowerBound.y||this.upperBound.y<p_y){return false;}}else {var _inv_d=1/d_y;var _t=(this.lowerBound.y-p_y)*_inv_d;var _t2=(this.upperBound.y-p_y)*_inv_d;// Sign of the normal vector.
      var _s2=-1;if(_t>_t2){var _t3=_t;_t=_t2;_t2=_t3;_s2=1;}// Push the min up
      if(_t>tmin){normal.x=0;normal.y=_s2;tmin=_t;}// Pull the max down
      tmax=b2Min(tmax,_t2);if(tmin>tmax){return false;}}// Does the ray start inside the box?
      // Does the ray intersect beyond the max fraction?
      if(tmin<0||input.maxFraction<tmin){return false;}// Intersection.
      output.fraction=tmin;return true;}},{key:"TestContain",value:function TestContain(point){if(point.x<this.lowerBound.x||this.upperBound.x<point.x){return false;}if(point.y<this.lowerBound.y||this.upperBound.y<point.y){return false;}return true;}},{key:"TestOverlap",value:function TestOverlap(other){if(this.upperBound.x<other.lowerBound.x){return false;}if(this.upperBound.y<other.lowerBound.y){return false;}if(other.upperBound.x<this.lowerBound.x){return false;}if(other.upperBound.y<this.lowerBound.y){return false;}return true;}}],[{key:"Combine",value:function Combine(aabb1,aabb2,out){out.Combine2(aabb1,aabb2);return out;}}]);}();function b2TestOverlapAABB(a,b){if(a.upperBound.x<b.lowerBound.x){return false;}if(a.upperBound.y<b.lowerBound.y){return false;}if(b.upperBound.x<a.lowerBound.x){return false;}if(b.upperBound.y<a.lowerBound.y){return false;}return true;}/// Clipping for contact manifolds.
      function b2ClipSegmentToLine(vOut,vIn,normal,offset,vertexIndexA){// Start with no output points
      var numOut=0;var vIn0=vIn[0];var vIn1=vIn[1];// Calculate the distance of end points to the line
      var distance0=b2Vec2.DotVV(normal,vIn0.v)-offset;var distance1=b2Vec2.DotVV(normal,vIn1.v)-offset;// If the points are behind the plane
      if(distance0<=0){vOut[numOut++].Copy(vIn0);}if(distance1<=0){vOut[numOut++].Copy(vIn1);}// If the points are on different sides of the plane
      if(distance0*distance1<0){// Find intersection point of edge and plane
      var interp=distance0/(distance0-distance1);var v=vOut[numOut].v;v.x=vIn0.v.x+interp*(vIn1.v.x-vIn0.v.x);v.y=vIn0.v.y+interp*(vIn1.v.y-vIn0.v.y);// VertexA is hitting edgeB.
      var id=vOut[numOut].id;id.cf.indexA=vertexIndexA;id.cf.indexB=vIn0.id.cf.indexB;id.cf.typeA=exports.b2ContactFeatureType.e_vertex;id.cf.typeB=exports.b2ContactFeatureType.e_face;++numOut;}return numOut;}/// Determine if two generic shapes overlap.
      var b2TestOverlapShape_s_input=new b2DistanceInput();var b2TestOverlapShape_s_simplexCache=new b2SimplexCache();var b2TestOverlapShape_s_output=new b2DistanceOutput();function b2TestOverlapShape(shapeA,indexA,shapeB,indexB,xfA,xfB){var input=b2TestOverlapShape_s_input.Reset();input.proxyA.SetShape(shapeA,indexA);input.proxyB.SetShape(shapeB,indexB);input.transformA.Copy(xfA);input.transformB.Copy(xfB);input.useRadii=true;var simplexCache=b2TestOverlapShape_s_simplexCache.Reset();simplexCache.count=0;var output=b2TestOverlapShape_s_output.Reset();b2Distance(output,simplexCache,input);return output.distance<10*b2_epsilon;}/*
        * Copyright (c) 2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */function verify(value){if(value===null){throw new Error();}return value;}/// A node in the dynamic tree. The client does not interact with this directly.
      var b2TreeNode=/*#__PURE__*/function(){function b2TreeNode(){var id=arguments.length>0&&arguments[0]!==undefined?arguments[0]:0;_classCallCheck(this,b2TreeNode);this.m_id=0;this.aabb=new b2AABB();this._userData=null;this.parent=null;// or next
      this.child1=null;this.child2=null;this.height=0;// leaf = 0, free node = -1
      this.m_id=id;}return _createClass(b2TreeNode,[{key:"userData",get:function get(){if(this._userData===null){throw new Error();}return this._userData;},set:function set(value){if(this._userData!==null){throw new Error();}this._userData=value;}},{key:"Reset",value:function Reset(){this._userData=null;}},{key:"IsLeaf",value:function IsLeaf(){return this.child1===null;}}]);}();var b2DynamicTree=/*#__PURE__*/function(){function b2DynamicTree(){_classCallCheck(this,b2DynamicTree);this.m_root=null;// b2TreeNode* public m_nodes;
      // int32 public m_nodeCount;
      // int32 public m_nodeCapacity;
      this.m_freeList=null;this.m_path=0;this.m_insertionCount=0;this.m_stack=new b2GrowableStack(256);}// public GetUserData(node: b2TreeNode<T>): T {
      //   // DEBUG: b2Assert(node !== null);
      //   return node.userData;
      // }
      // public GetFatAABB(node: b2TreeNode<T>): b2AABB {
      //   // DEBUG: b2Assert(node !== null);
      //   return node.aabb;
      // }
      return _createClass(b2DynamicTree,[{key:"Query",value:function Query(aabb,callback){var stack=this.m_stack.Reset();stack.Push(this.m_root);while(stack.GetCount()>0){var node=stack.Pop();if(node===null){continue;}if(node.aabb.TestOverlap(aabb)){if(node.IsLeaf()){var proceed=callback(node);if(!proceed){return;}}else {stack.Push(node.child1);stack.Push(node.child2);}}}}},{key:"QueryPoint",value:function QueryPoint(point,callback){var stack=this.m_stack.Reset();stack.Push(this.m_root);while(stack.GetCount()>0){var node=stack.Pop();if(node===null){continue;}if(node.aabb.TestContain(point)){if(node.IsLeaf()){var proceed=callback(node);if(!proceed){return;}}else {stack.Push(node.child1);stack.Push(node.child2);}}}}},{key:"RayCast",value:function RayCast(input,callback){var p1=input.p1;var p2=input.p2;var r=b2Vec2.SubVV(p2,p1,b2DynamicTree.s_r);// DEBUG: b2Assert(r.LengthSquared() > 0);
      r.Normalize();// v is perpendicular to the segment.
      var v=b2Vec2.CrossOneV(r,b2DynamicTree.s_v);var abs_v=b2Vec2.AbsV(v,b2DynamicTree.s_abs_v);// Separating axis for segment (Gino, p80).
      // |dot(v, p1 - c)| > dot(|v|, h)
      var maxFraction=input.maxFraction;// Build a bounding box for the segment.
      var segmentAABB=b2DynamicTree.s_segmentAABB;var t_x=p1.x+maxFraction*(p2.x-p1.x);var t_y=p1.y+maxFraction*(p2.y-p1.y);segmentAABB.lowerBound.x=b2Min(p1.x,t_x);segmentAABB.lowerBound.y=b2Min(p1.y,t_y);segmentAABB.upperBound.x=b2Max(p1.x,t_x);segmentAABB.upperBound.y=b2Max(p1.y,t_y);var stack=this.m_stack.Reset();stack.Push(this.m_root);while(stack.GetCount()>0){var node=stack.Pop();if(node===null){continue;}if(!b2TestOverlapAABB(node.aabb,segmentAABB)){continue;}// Separating axis for segment (Gino, p80).
      // |dot(v, p1 - c)| > dot(|v|, h)
      var c=node.aabb.GetCenter();var h=node.aabb.GetExtents();var separation=b2Abs(b2Vec2.DotVV(v,b2Vec2.SubVV(p1,c,b2Vec2.s_t0)))-b2Vec2.DotVV(abs_v,h);if(separation>0){continue;}if(node.IsLeaf()){var subInput=b2DynamicTree.s_subInput;subInput.p1.Copy(input.p1);subInput.p2.Copy(input.p2);subInput.maxFraction=maxFraction;var value=callback(subInput,node);if(value===0){// The client has terminated the ray cast.
      return;}if(value>0){// Update segment bounding box.
      maxFraction=value;t_x=p1.x+maxFraction*(p2.x-p1.x);t_y=p1.y+maxFraction*(p2.y-p1.y);segmentAABB.lowerBound.x=b2Min(p1.x,t_x);segmentAABB.lowerBound.y=b2Min(p1.y,t_y);segmentAABB.upperBound.x=b2Max(p1.x,t_x);segmentAABB.upperBound.y=b2Max(p1.y,t_y);}}else {stack.Push(node.child1);stack.Push(node.child2);}}}},{key:"AllocateNode",value:function AllocateNode(){// Expand the node pool as needed.
      if(this.m_freeList!==null){var node=this.m_freeList;this.m_freeList=node.parent;// this.m_freeList = node.next;
      node.parent=null;node.child1=null;node.child2=null;node.height=0;return node;}return new b2TreeNode(b2DynamicTree.s_node_id++);}},{key:"FreeNode",value:function FreeNode(node){node.parent=this.m_freeList;// node.next = this.m_freeList;
      node.child1=null;node.child2=null;node.height=-1;node.Reset();this.m_freeList=node;}},{key:"CreateProxy",value:function CreateProxy(aabb,userData){var node=this.AllocateNode();// Fatten the aabb.
      var r_x=b2_aabbExtension;var r_y=b2_aabbExtension;node.aabb.lowerBound.x=aabb.lowerBound.x-r_x;node.aabb.lowerBound.y=aabb.lowerBound.y-r_y;node.aabb.upperBound.x=aabb.upperBound.x+r_x;node.aabb.upperBound.y=aabb.upperBound.y+r_y;node.userData=userData;node.height=0;this.InsertLeaf(node);return node;}},{key:"DestroyProxy",value:function DestroyProxy(node){// DEBUG: b2Assert(node.IsLeaf());
      this.RemoveLeaf(node);this.FreeNode(node);}},{key:"MoveProxy",value:function MoveProxy(node,aabb,displacement){// DEBUG: b2Assert(node.IsLeaf());
      if(node.aabb.Contains(aabb)){return false;}this.RemoveLeaf(node);// Extend AABB.
      var r_x=b2_aabbExtension;var r_y=b2_aabbExtension;node.aabb.lowerBound.x=aabb.lowerBound.x-r_x;node.aabb.lowerBound.y=aabb.lowerBound.y-r_y;node.aabb.upperBound.x=aabb.upperBound.x+r_x;node.aabb.upperBound.y=aabb.upperBound.y+r_y;// Predict AABB displacement.
      var d_x=b2_aabbMultiplier*displacement.x;var d_y=b2_aabbMultiplier*displacement.y;if(d_x<0.0){node.aabb.lowerBound.x+=d_x;}else {node.aabb.upperBound.x+=d_x;}if(d_y<0.0){node.aabb.lowerBound.y+=d_y;}else {node.aabb.upperBound.y+=d_y;}this.InsertLeaf(node);return true;}},{key:"InsertLeaf",value:function InsertLeaf(leaf){++this.m_insertionCount;if(this.m_root===null){this.m_root=leaf;this.m_root.parent=null;return;}// Find the best sibling for this node
      var leafAABB=leaf.aabb;var sibling=this.m_root;while(!sibling.IsLeaf()){var child1=verify(sibling.child1);var child2=verify(sibling.child2);var area=sibling.aabb.GetPerimeter();var combinedAABB=b2DynamicTree.s_combinedAABB;combinedAABB.Combine2(sibling.aabb,leafAABB);var combinedArea=combinedAABB.GetPerimeter();// Cost of creating a new parent for this node and the new leaf
      var cost=2*combinedArea;// Minimum cost of pushing the leaf further down the tree
      var inheritanceCost=2*(combinedArea-area);// Cost of descending into child1
      var cost1=void 0;var aabb=b2DynamicTree.s_aabb;var oldArea=void 0;var newArea=void 0;if(child1.IsLeaf()){aabb.Combine2(leafAABB,child1.aabb);cost1=aabb.GetPerimeter()+inheritanceCost;}else {aabb.Combine2(leafAABB,child1.aabb);oldArea=child1.aabb.GetPerimeter();newArea=aabb.GetPerimeter();cost1=newArea-oldArea+inheritanceCost;}// Cost of descending into child2
      var cost2=void 0;if(child2.IsLeaf()){aabb.Combine2(leafAABB,child2.aabb);cost2=aabb.GetPerimeter()+inheritanceCost;}else {aabb.Combine2(leafAABB,child2.aabb);oldArea=child2.aabb.GetPerimeter();newArea=aabb.GetPerimeter();cost2=newArea-oldArea+inheritanceCost;}// Descend according to the minimum cost.
      if(cost<cost1&&cost<cost2){break;}// Descend
      if(cost1<cost2){sibling=child1;}else {sibling=child2;}}// Create a parent for the siblings.
      var oldParent=sibling.parent;var newParent=this.AllocateNode();newParent.parent=oldParent;newParent.aabb.Combine2(leafAABB,sibling.aabb);newParent.height=sibling.height+1;if(oldParent!==null){// The sibling was not the root.
      if(oldParent.child1===sibling){oldParent.child1=newParent;}else {oldParent.child2=newParent;}newParent.child1=sibling;newParent.child2=leaf;sibling.parent=newParent;leaf.parent=newParent;}else {// The sibling was the root.
      newParent.child1=sibling;newParent.child2=leaf;sibling.parent=newParent;leaf.parent=newParent;this.m_root=newParent;}// Walk back up the tree fixing heights and AABBs
      var node=leaf.parent;while(node!==null){node=this.Balance(node);var _child=verify(node.child1);var _child2=verify(node.child2);node.height=1+b2Max(_child.height,_child2.height);node.aabb.Combine2(_child.aabb,_child2.aabb);node=node.parent;}// this.Validate();
      }},{key:"RemoveLeaf",value:function RemoveLeaf(leaf){if(leaf===this.m_root){this.m_root=null;return;}var parent=verify(leaf.parent);var grandParent=parent&&parent.parent;var sibling=verify(parent.child1===leaf?parent.child2:parent.child1);if(grandParent!==null){// Destroy parent and connect sibling to grandParent.
      if(grandParent.child1===parent){grandParent.child1=sibling;}else {grandParent.child2=sibling;}sibling.parent=grandParent;this.FreeNode(parent);// Adjust ancestor bounds.
      var index=grandParent;while(index!==null){index=this.Balance(index);var child1=verify(index.child1);var child2=verify(index.child2);index.aabb.Combine2(child1.aabb,child2.aabb);index.height=1+b2Max(child1.height,child2.height);index=index.parent;}}else {this.m_root=sibling;sibling.parent=null;this.FreeNode(parent);}// this.Validate();
      }},{key:"Balance",value:function Balance(A){// DEBUG: b2Assert(A !== null);
      if(A.IsLeaf()||A.height<2){return A;}var B=verify(A.child1);var C=verify(A.child2);var balance=C.height-B.height;// Rotate C up
      if(balance>1){var F=verify(C.child1);var G=verify(C.child2);// Swap A and C
      C.child1=A;C.parent=A.parent;A.parent=C;// A's old parent should point to C
      if(C.parent!==null){if(C.parent.child1===A){C.parent.child1=C;}else {// DEBUG: b2Assert(C.parent.child2 === A);
      C.parent.child2=C;}}else {this.m_root=C;}// Rotate
      if(F.height>G.height){C.child2=F;A.child2=G;G.parent=A;A.aabb.Combine2(B.aabb,G.aabb);C.aabb.Combine2(A.aabb,F.aabb);A.height=1+b2Max(B.height,G.height);C.height=1+b2Max(A.height,F.height);}else {C.child2=G;A.child2=F;F.parent=A;A.aabb.Combine2(B.aabb,F.aabb);C.aabb.Combine2(A.aabb,G.aabb);A.height=1+b2Max(B.height,F.height);C.height=1+b2Max(A.height,G.height);}return C;}// Rotate B up
      if(balance<-1){var D=verify(B.child1);var E=verify(B.child2);// Swap A and B
      B.child1=A;B.parent=A.parent;A.parent=B;// A's old parent should point to B
      if(B.parent!==null){if(B.parent.child1===A){B.parent.child1=B;}else {// DEBUG: b2Assert(B.parent.child2 === A);
      B.parent.child2=B;}}else {this.m_root=B;}// Rotate
      if(D.height>E.height){B.child2=D;A.child1=E;E.parent=A;A.aabb.Combine2(C.aabb,E.aabb);B.aabb.Combine2(A.aabb,D.aabb);A.height=1+b2Max(C.height,E.height);B.height=1+b2Max(A.height,D.height);}else {B.child2=E;A.child1=D;D.parent=A;A.aabb.Combine2(C.aabb,D.aabb);B.aabb.Combine2(A.aabb,E.aabb);A.height=1+b2Max(C.height,D.height);B.height=1+b2Max(A.height,E.height);}return B;}return A;}},{key:"GetHeight",value:function GetHeight(){if(this.m_root===null){return 0;}return this.m_root.height;}},{key:"GetAreaRatio",value:function GetAreaRatio(){if(this.m_root===null){return 0;}var root=this.m_root;var rootArea=root.aabb.GetPerimeter();var totalArea=b2DynamicTree.GetAreaNode(this.m_root);/*
                float32 totalArea = 0.0;
                for (int32 i = 0; i < m_nodeCapacity; ++i) {
                  const b2TreeNode<T>* node = m_nodes + i;
                  if (node.height < 0) {
                    // Free node in pool
                    continue;
                  }
            
                  totalArea += node.aabb.GetPerimeter();
                }
                */return totalArea/rootArea;}},{key:"ComputeHeight",value:function ComputeHeight(){var height=b2DynamicTree.ComputeHeightNode(this.m_root);return height;}},{key:"ValidateStructure",value:function ValidateStructure(node){if(node===null){return;}if(node===this.m_root);if(node.IsLeaf()){// DEBUG: b2Assert(node.child1 === null);
      // DEBUG: b2Assert(node.child2 === null);
      // DEBUG: b2Assert(node.height === 0);
      return;}var child1=verify(node.child1);var child2=verify(node.child2);// DEBUG: b2Assert(child1.parent === index);
      // DEBUG: b2Assert(child2.parent === index);
      this.ValidateStructure(child1);this.ValidateStructure(child2);}},{key:"ValidateMetrics",value:function ValidateMetrics(node){if(node===null){return;}if(node.IsLeaf()){// DEBUG: b2Assert(node.child1 === null);
      // DEBUG: b2Assert(node.child2 === null);
      // DEBUG: b2Assert(node.height === 0);
      return;}var child1=verify(node.child1);var child2=verify(node.child2);// DEBUG: const height1: number = child1.height;
      // DEBUG: const height2: number = child2.height;
      // DEBUG: const height: number = 1 + b2Max(height1, height2);
      // DEBUG: b2Assert(node.height === height);
      var aabb=b2DynamicTree.s_aabb;aabb.Combine2(child1.aabb,child2.aabb);// DEBUG: b2Assert(aabb.lowerBound === node.aabb.lowerBound);
      // DEBUG: b2Assert(aabb.upperBound === node.aabb.upperBound);
      this.ValidateMetrics(child1);this.ValidateMetrics(child2);}},{key:"Validate",value:function Validate(){// DEBUG: this.ValidateStructure(this.m_root);
      // DEBUG: this.ValidateMetrics(this.m_root);
      // let freeCount: number = 0;
      // let freeIndex: b2TreeNode<T> | null = this.m_freeList;
      // while (freeIndex !== null) {
      //   freeIndex = freeIndex.parent; // freeIndex = freeIndex.next;
      //   ++freeCount;
      // }
      // DEBUG: b2Assert(this.GetHeight() === this.ComputeHeight());
      // b2Assert(this.m_nodeCount + freeCount === this.m_nodeCapacity);
      }},{key:"GetMaxBalance",value:function GetMaxBalance(){var maxBalance=b2DynamicTree.GetMaxBalanceNode(this.m_root,0);/*
                int32 maxBalance = 0;
                for (int32 i = 0; i < m_nodeCapacity; ++i) {
                  const b2TreeNode<T>* node = m_nodes + i;
                  if (node.height <= 1) {
                    continue;
                  }
            
                  b2Assert(!node.IsLeaf());
            
                  int32 child1 = node.child1;
                  int32 child2 = node.child2;
                  int32 balance = b2Abs(m_nodes[child2].height - m_nodes[child1].height);
                  maxBalance = b2Max(maxBalance, balance);
                }
                */return maxBalance;}},{key:"RebuildBottomUp",value:function RebuildBottomUp(){/*
                int32* nodes = (int32*)b2Alloc(m_nodeCount * sizeof(int32));
                int32 count = 0;
            
                // Build array of leaves. Free the rest.
                for (int32 i = 0; i < m_nodeCapacity; ++i) {
                  if (m_nodes[i].height < 0) {
                    // free node in pool
                    continue;
                  }
            
                  if (m_nodes[i].IsLeaf()) {
                    m_nodes[i].parent = b2_nullNode;
                    nodes[count] = i;
                    ++count;
                  } else {
                    FreeNode(i);
                  }
                }
            
                while (count > 1) {
                  float32 minCost = b2_maxFloat;
                  int32 iMin = -1, jMin = -1;
                  for (int32 i = 0; i < count; ++i) {
                    b2AABB aabbi = m_nodes[nodes[i]].aabb;
            
                    for (int32 j = i + 1; j < count; ++j) {
                      b2AABB aabbj = m_nodes[nodes[j]].aabb;
                      b2AABB b;
                      b.Combine(aabbi, aabbj);
                      float32 cost = b.GetPerimeter();
                      if (cost < minCost) {
                        iMin = i;
                        jMin = j;
                        minCost = cost;
                      }
                    }
                  }
            
                  int32 index1 = nodes[iMin];
                  int32 index2 = nodes[jMin];
                  b2TreeNode<T>* child1 = m_nodes + index1;
                  b2TreeNode<T>* child2 = m_nodes + index2;
            
                  int32 parentIndex = AllocateNode();
                  b2TreeNode<T>* parent = m_nodes + parentIndex;
                  parent.child1 = index1;
                  parent.child2 = index2;
                  parent.height = 1 + b2Max(child1.height, child2.height);
                  parent.aabb.Combine(child1.aabb, child2.aabb);
                  parent.parent = b2_nullNode;
            
                  child1.parent = parentIndex;
                  child2.parent = parentIndex;
            
                  nodes[jMin] = nodes[count-1];
                  nodes[iMin] = parentIndex;
                  --count;
                }
            
                m_root = nodes[0];
                b2Free(nodes);
                */this.Validate();}},{key:"ShiftOrigin",value:function ShiftOrigin(newOrigin){b2DynamicTree.ShiftOriginNode(this.m_root,newOrigin);/*
                // Build array of leaves. Free the rest.
                for (int32 i = 0; i < m_nodeCapacity; ++i) {
                  m_nodes[i].aabb.lowerBound -= newOrigin;
                  m_nodes[i].aabb.upperBound -= newOrigin;
                }
                */}}],[{key:"GetAreaNode",value:function GetAreaNode(node){if(node===null){return 0;}if(node.IsLeaf()){return 0;}var area=node.aabb.GetPerimeter();area+=b2DynamicTree.GetAreaNode(node.child1);area+=b2DynamicTree.GetAreaNode(node.child2);return area;}},{key:"ComputeHeightNode",value:function ComputeHeightNode(node){if(node===null){return 0;}if(node.IsLeaf()){return 0;}var height1=b2DynamicTree.ComputeHeightNode(node.child1);var height2=b2DynamicTree.ComputeHeightNode(node.child2);return 1+b2Max(height1,height2);}},{key:"GetMaxBalanceNode",value:function GetMaxBalanceNode(node,maxBalance){if(node===null){return maxBalance;}if(node.height<=1){return maxBalance;}// DEBUG: b2Assert(!node.IsLeaf());
      var child1=verify(node.child1);var child2=verify(node.child2);var balance=b2Abs(child2.height-child1.height);return b2Max(maxBalance,balance);}},{key:"ShiftOriginNode",value:function ShiftOriginNode(node,newOrigin){if(node===null){return;}if(node.height<=1){return;}// DEBUG: b2Assert(!node.IsLeaf());
      var child1=node.child1;var child2=node.child2;b2DynamicTree.ShiftOriginNode(child1,newOrigin);b2DynamicTree.ShiftOriginNode(child2,newOrigin);node.aabb.lowerBound.SelfSub(newOrigin);node.aabb.upperBound.SelfSub(newOrigin);}}]);}();b2DynamicTree.s_r=new b2Vec2();b2DynamicTree.s_v=new b2Vec2();b2DynamicTree.s_abs_v=new b2Vec2();b2DynamicTree.s_segmentAABB=new b2AABB();b2DynamicTree.s_subInput=new b2RayCastInput();b2DynamicTree.s_combinedAABB=new b2AABB();b2DynamicTree.s_aabb=new b2AABB();b2DynamicTree.s_node_id=0;/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */function std_iter_swap(array,a,b){var tmp=array[a];array[a]=array[b];array[b]=tmp;}function default_compare(a,b){return a<b;}function std_sort(array){var first=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var len=arguments.length>2&&arguments[2]!==undefined?arguments[2]:array.length-first;var cmp=arguments.length>3&&arguments[3]!==undefined?arguments[3]:default_compare;var left=first;var stack=[];var pos=0;for(;;){/* outer loop */for(;left+1<len;len++){/* sort left to len-1 */var pivot=array[left+Math.floor(Math.random()*(len-left))];/* pick random pivot */stack[pos++]=len;/* sort right part later */for(var right=left-1;;){/* inner loop: partitioning */while(cmp(array[++right],pivot)){}/* look for greater element */while(cmp(pivot,array[--len])){}/* look for smaller element */if(right>=len){break;}/* partition point found? */std_iter_swap(array,right,len);/* the only swap */}/* partitioned, continue left part */}if(pos===0){break;}/* stack empty? */left=len;/* left to right is sorted */len=stack[--pos];/* get next range to sort */}return array;}var b2Pair=/*#__PURE__*/_createClass(function b2Pair(proxyA,proxyB){_classCallCheck(this,b2Pair);this.proxyA=proxyA;this.proxyB=proxyB;});/// The broad-phase is used for computing pairs and performing volume queries and ray casts.
      /// This broad-phase does not persist pairs. Instead, this reports potentially new pairs.
      /// It is up to the client to consume the new pairs and to track subsequent overlap.
      var b2BroadPhase=/*#__PURE__*/function(){function b2BroadPhase(){_classCallCheck(this,b2BroadPhase);this.m_tree=new b2DynamicTree();this.m_proxyCount=0;// public m_moveCapacity: number = 16;
      this.m_moveCount=0;this.m_moveBuffer=[];// public m_pairCapacity: number = 16;
      this.m_pairCount=0;this.m_pairBuffer=[];}// public m_queryProxyId: number = 0;
      /// Create a proxy with an initial AABB. Pairs are not reported until
      /// UpdatePairs is called.
      return _createClass(b2BroadPhase,[{key:"CreateProxy",value:function CreateProxy(aabb,userData){var proxy=this.m_tree.CreateProxy(aabb,userData);++this.m_proxyCount;this.BufferMove(proxy);return proxy;}/// Destroy a proxy. It is up to the client to remove any pairs.
      },{key:"DestroyProxy",value:function DestroyProxy(proxy){this.UnBufferMove(proxy);--this.m_proxyCount;this.m_tree.DestroyProxy(proxy);}/// Call MoveProxy as many times as you like, then when you are done
      /// call UpdatePairs to finalized the proxy pairs (for your time step).
      },{key:"MoveProxy",value:function MoveProxy(proxy,aabb,displacement){var buffer=this.m_tree.MoveProxy(proxy,aabb,displacement);if(buffer){this.BufferMove(proxy);}}/// Call to trigger a re-processing of it's pairs on the next call to UpdatePairs.
      },{key:"TouchProxy",value:function TouchProxy(proxy){this.BufferMove(proxy);}/// Get the fat AABB for a proxy.
      // public GetFatAABB(proxy: b2TreeNode<T>): b2AABB {
      //   return this.m_tree.GetFatAABB(proxy);
      // }
      /// Get user data from a proxy. Returns NULL if the id is invalid.
      // public GetUserData(proxy: b2TreeNode<T>): T {
      //   return this.m_tree.GetUserData(proxy);
      // }
      /// Test overlap of fat AABBs.
      // public TestOverlap(proxyA: b2TreeNode<T>, proxyB: b2TreeNode<T>): boolean {
      //   const aabbA: b2AABB = this.m_tree.GetFatAABB(proxyA);
      //   const aabbB: b2AABB = this.m_tree.GetFatAABB(proxyB);
      //   return b2TestOverlapAABB(aabbA, aabbB);
      // }
      /// Get the number of proxies.
      },{key:"GetProxyCount",value:function GetProxyCount(){return this.m_proxyCount;}/// Update the pairs. This results in pair callbacks. This can only add pairs.
      },{key:"UpdatePairs",value:function UpdatePairs(callback){var _this=this;// Reset pair buffer
      this.m_pairCount=0;// Perform tree queries for all moving proxies.
      var _loop=function _loop(){var queryProxy=_this.m_moveBuffer[_i3];if(queryProxy===null){return 1;// continue
      }// This is called from box2d.b2DynamicTree::Query when we are gathering pairs.
      // boolean b2BroadPhase::QueryCallback(int32 proxyId);
      // We have to query the tree with the fat AABB so that
      // we don't fail to create a pair that may touch later.
      var fatAABB=queryProxy.aabb;// this.m_tree.GetFatAABB(queryProxy);
      // Query tree, create pairs and add them pair buffer.
      _this.m_tree.Query(fatAABB,function(proxy){// A proxy cannot form a pair with itself.
      if(proxy.m_id===queryProxy.m_id){return true;}// const proxyA = proxy < queryProxy ? proxy : queryProxy;
      // const proxyB = proxy >= queryProxy ? proxy : queryProxy;
      var proxyA;var proxyB;if(proxy.m_id<queryProxy.m_id){proxyA=proxy;proxyB=queryProxy;}else {proxyA=queryProxy;proxyB=proxy;}// Grow the pair buffer as needed.
      if(_this.m_pairCount===_this.m_pairBuffer.length){_this.m_pairBuffer[_this.m_pairCount]=new b2Pair(proxyA,proxyB);}else {var _pair=_this.m_pairBuffer[_this.m_pairCount];_pair.proxyA=proxyA;_pair.proxyB=proxyB;}++_this.m_pairCount;return true;});};for(var _i3=0;_i3<this.m_moveCount;++_i3){if(_loop())continue;}// Reset move buffer
      this.m_moveCount=0;// Sort the pair buffer to expose duplicates.
      std_sort(this.m_pairBuffer,0,this.m_pairCount,b2PairLessThan);// Send the pairs back to the client.
      var i=0;while(i<this.m_pairCount){var primaryPair=this.m_pairBuffer[i];var userDataA=primaryPair.proxyA.userData;// this.m_tree.GetUserData(primaryPair.proxyA);
      var userDataB=primaryPair.proxyB.userData;// this.m_tree.GetUserData(primaryPair.proxyB);
      callback(userDataA,userDataB);++i;// Skip any duplicate pairs.
      while(i<this.m_pairCount){var pair=this.m_pairBuffer[i];if(pair.proxyA.m_id!==primaryPair.proxyA.m_id||pair.proxyB.m_id!==primaryPair.proxyB.m_id){break;}++i;}}// Try to keep the tree balanced.
      // this.m_tree.Rebalance(4);
      }/// Query an AABB for overlapping proxies. The callback class
      /// is called for each proxy that overlaps the supplied AABB.
      },{key:"Query",value:function Query(aabb,callback){this.m_tree.Query(aabb,callback);}},{key:"QueryPoint",value:function QueryPoint(point,callback){this.m_tree.QueryPoint(point,callback);}/// Ray-cast against the proxies in the tree. This relies on the callback
      /// to perform a exact ray-cast in the case were the proxy contains a shape.
      /// The callback also performs the any collision filtering. This has performance
      /// roughly equal to k * log(n), where k is the number of collisions and n is the
      /// number of proxies in the tree.
      /// @param input the ray-cast input data. The ray extends from p1 to p1 + maxFraction * (p2 - p1).
      /// @param callback a callback class that is called for each proxy that is hit by the ray.
      },{key:"RayCast",value:function RayCast(input,callback){this.m_tree.RayCast(input,callback);}/// Get the height of the embedded tree.
      },{key:"GetTreeHeight",value:function GetTreeHeight(){return this.m_tree.GetHeight();}/// Get the balance of the embedded tree.
      },{key:"GetTreeBalance",value:function GetTreeBalance(){return this.m_tree.GetMaxBalance();}/// Get the quality metric of the embedded tree.
      },{key:"GetTreeQuality",value:function GetTreeQuality(){return this.m_tree.GetAreaRatio();}/// Shift the world origin. Useful for large worlds.
      /// The shift formula is: position -= newOrigin
      /// @param newOrigin the new origin with respect to the old origin
      },{key:"ShiftOrigin",value:function ShiftOrigin(newOrigin){this.m_tree.ShiftOrigin(newOrigin);}},{key:"BufferMove",value:function BufferMove(proxy){this.m_moveBuffer[this.m_moveCount]=proxy;++this.m_moveCount;}},{key:"UnBufferMove",value:function UnBufferMove(proxy){var i=this.m_moveBuffer.indexOf(proxy);this.m_moveBuffer[i]=null;}}]);}();/// This is used to sort pairs.
      function b2PairLessThan(pair1,pair2){if(pair1.proxyA.m_id<pair2.proxyA.m_id){return true;}if(pair1.proxyA.m_id===pair2.proxyA.m_id){return pair1.proxyB.m_id<pair2.proxyB.m_id;}return false;}/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */exports.b2_toiTime=0;exports.b2_toiMaxTime=0;exports.b2_toiCalls=0;exports.b2_toiIters=0;exports.b2_toiMaxIters=0;exports.b2_toiRootIters=0;exports.b2_toiMaxRootIters=0;function b2_toi_reset(){exports.b2_toiTime=0;exports.b2_toiMaxTime=0;exports.b2_toiCalls=0;exports.b2_toiIters=0;exports.b2_toiMaxIters=0;exports.b2_toiRootIters=0;exports.b2_toiMaxRootIters=0;}var b2TimeOfImpact_s_xfA=new b2Transform();var b2TimeOfImpact_s_xfB=new b2Transform();var b2TimeOfImpact_s_pointA=new b2Vec2();var b2TimeOfImpact_s_pointB=new b2Vec2();var b2TimeOfImpact_s_normal=new b2Vec2();var b2TimeOfImpact_s_axisA=new b2Vec2();var b2TimeOfImpact_s_axisB=new b2Vec2();/// Input parameters for b2TimeOfImpact
      var b2TOIInput=/*#__PURE__*/_createClass(function b2TOIInput(){_classCallCheck(this,b2TOIInput);this.proxyA=new b2DistanceProxy();this.proxyB=new b2DistanceProxy();this.sweepA=new b2Sweep();this.sweepB=new b2Sweep();this.tMax=0;// defines sweep interval [0, tMax]
      });(function(b2TOIOutputState){b2TOIOutputState[b2TOIOutputState["e_unknown"]=0]="e_unknown";b2TOIOutputState[b2TOIOutputState["e_failed"]=1]="e_failed";b2TOIOutputState[b2TOIOutputState["e_overlapped"]=2]="e_overlapped";b2TOIOutputState[b2TOIOutputState["e_touching"]=3]="e_touching";b2TOIOutputState[b2TOIOutputState["e_separated"]=4]="e_separated";})(exports.b2TOIOutputState||(exports.b2TOIOutputState={}));var b2TOIOutput=/*#__PURE__*/_createClass(function b2TOIOutput(){_classCallCheck(this,b2TOIOutput);this.state=exports.b2TOIOutputState.e_unknown;this.t=0;});(function(b2SeparationFunctionType){b2SeparationFunctionType[b2SeparationFunctionType["e_unknown"]=-1]="e_unknown";b2SeparationFunctionType[b2SeparationFunctionType["e_points"]=0]="e_points";b2SeparationFunctionType[b2SeparationFunctionType["e_faceA"]=1]="e_faceA";b2SeparationFunctionType[b2SeparationFunctionType["e_faceB"]=2]="e_faceB";})(exports.b2SeparationFunctionType||(exports.b2SeparationFunctionType={}));var b2SeparationFunction=/*#__PURE__*/function(){function b2SeparationFunction(){_classCallCheck(this,b2SeparationFunction);this.m_sweepA=new b2Sweep();this.m_sweepB=new b2Sweep();this.m_type=exports.b2SeparationFunctionType.e_unknown;this.m_localPoint=new b2Vec2();this.m_axis=new b2Vec2();}return _createClass(b2SeparationFunction,[{key:"Initialize",value:function Initialize(cache,proxyA,sweepA,proxyB,sweepB,t1){this.m_proxyA=proxyA;this.m_proxyB=proxyB;var count=cache.count;// DEBUG: b2Assert(0 < count && count < 3);
      this.m_sweepA.Copy(sweepA);this.m_sweepB.Copy(sweepB);var xfA=b2TimeOfImpact_s_xfA;var xfB=b2TimeOfImpact_s_xfB;this.m_sweepA.GetTransform(xfA,t1);this.m_sweepB.GetTransform(xfB,t1);if(count===1){this.m_type=exports.b2SeparationFunctionType.e_points;var localPointA=this.m_proxyA.GetVertex(cache.indexA[0]);var localPointB=this.m_proxyB.GetVertex(cache.indexB[0]);var pointA=b2Transform.MulXV(xfA,localPointA,b2TimeOfImpact_s_pointA);var pointB=b2Transform.MulXV(xfB,localPointB,b2TimeOfImpact_s_pointB);b2Vec2.SubVV(pointB,pointA,this.m_axis);var s=this.m_axis.Normalize();// #if B2_ENABLE_PARTICLE
      this.m_localPoint.SetZero();// #endif
      return s;}else if(cache.indexA[0]===cache.indexA[1]){// Two points on B and one on A.
      this.m_type=exports.b2SeparationFunctionType.e_faceB;var localPointB1=this.m_proxyB.GetVertex(cache.indexB[0]);var localPointB2=this.m_proxyB.GetVertex(cache.indexB[1]);b2Vec2.CrossVOne(b2Vec2.SubVV(localPointB2,localPointB1,b2Vec2.s_t0),this.m_axis).SelfNormalize();var normal=b2Rot.MulRV(xfB.q,this.m_axis,b2TimeOfImpact_s_normal);b2Vec2.MidVV(localPointB1,localPointB2,this.m_localPoint);var _pointB=b2Transform.MulXV(xfB,this.m_localPoint,b2TimeOfImpact_s_pointB);var _localPointA=this.m_proxyA.GetVertex(cache.indexA[0]);var _pointA=b2Transform.MulXV(xfA,_localPointA,b2TimeOfImpact_s_pointA);var _s3=b2Vec2.DotVV(b2Vec2.SubVV(_pointA,_pointB,b2Vec2.s_t0),normal);if(_s3<0){this.m_axis.SelfNeg();_s3=-_s3;}return _s3;}else {// Two points on A and one or two points on B.
      this.m_type=exports.b2SeparationFunctionType.e_faceA;var localPointA1=this.m_proxyA.GetVertex(cache.indexA[0]);var localPointA2=this.m_proxyA.GetVertex(cache.indexA[1]);b2Vec2.CrossVOne(b2Vec2.SubVV(localPointA2,localPointA1,b2Vec2.s_t0),this.m_axis).SelfNormalize();var _normal=b2Rot.MulRV(xfA.q,this.m_axis,b2TimeOfImpact_s_normal);b2Vec2.MidVV(localPointA1,localPointA2,this.m_localPoint);var _pointA2=b2Transform.MulXV(xfA,this.m_localPoint,b2TimeOfImpact_s_pointA);var _localPointB=this.m_proxyB.GetVertex(cache.indexB[0]);var _pointB2=b2Transform.MulXV(xfB,_localPointB,b2TimeOfImpact_s_pointB);var _s4=b2Vec2.DotVV(b2Vec2.SubVV(_pointB2,_pointA2,b2Vec2.s_t0),_normal);if(_s4<0){this.m_axis.SelfNeg();_s4=-_s4;}return _s4;}}},{key:"FindMinSeparation",value:function FindMinSeparation(indexA,indexB,t){var xfA=b2TimeOfImpact_s_xfA;var xfB=b2TimeOfImpact_s_xfB;this.m_sweepA.GetTransform(xfA,t);this.m_sweepB.GetTransform(xfB,t);switch(this.m_type){case exports.b2SeparationFunctionType.e_points:{var axisA=b2Rot.MulTRV(xfA.q,this.m_axis,b2TimeOfImpact_s_axisA);var axisB=b2Rot.MulTRV(xfB.q,b2Vec2.NegV(this.m_axis,b2Vec2.s_t0),b2TimeOfImpact_s_axisB);indexA[0]=this.m_proxyA.GetSupport(axisA);indexB[0]=this.m_proxyB.GetSupport(axisB);var localPointA=this.m_proxyA.GetVertex(indexA[0]);var localPointB=this.m_proxyB.GetVertex(indexB[0]);var pointA=b2Transform.MulXV(xfA,localPointA,b2TimeOfImpact_s_pointA);var pointB=b2Transform.MulXV(xfB,localPointB,b2TimeOfImpact_s_pointB);var separation=b2Vec2.DotVV(b2Vec2.SubVV(pointB,pointA,b2Vec2.s_t0),this.m_axis);return separation;}case exports.b2SeparationFunctionType.e_faceA:{var normal=b2Rot.MulRV(xfA.q,this.m_axis,b2TimeOfImpact_s_normal);var _pointA3=b2Transform.MulXV(xfA,this.m_localPoint,b2TimeOfImpact_s_pointA);var _axisB=b2Rot.MulTRV(xfB.q,b2Vec2.NegV(normal,b2Vec2.s_t0),b2TimeOfImpact_s_axisB);indexA[0]=-1;indexB[0]=this.m_proxyB.GetSupport(_axisB);var _localPointB2=this.m_proxyB.GetVertex(indexB[0]);var _pointB3=b2Transform.MulXV(xfB,_localPointB2,b2TimeOfImpact_s_pointB);var _separation=b2Vec2.DotVV(b2Vec2.SubVV(_pointB3,_pointA3,b2Vec2.s_t0),normal);return _separation;}case exports.b2SeparationFunctionType.e_faceB:{var _normal2=b2Rot.MulRV(xfB.q,this.m_axis,b2TimeOfImpact_s_normal);var _pointB4=b2Transform.MulXV(xfB,this.m_localPoint,b2TimeOfImpact_s_pointB);var _axisA=b2Rot.MulTRV(xfA.q,b2Vec2.NegV(_normal2,b2Vec2.s_t0),b2TimeOfImpact_s_axisA);indexB[0]=-1;indexA[0]=this.m_proxyA.GetSupport(_axisA);var _localPointA2=this.m_proxyA.GetVertex(indexA[0]);var _pointA4=b2Transform.MulXV(xfA,_localPointA2,b2TimeOfImpact_s_pointA);var _separation2=b2Vec2.DotVV(b2Vec2.SubVV(_pointA4,_pointB4,b2Vec2.s_t0),_normal2);return _separation2;}default:// DEBUG: b2Assert(false);
      indexA[0]=-1;indexB[0]=-1;return 0;}}},{key:"Evaluate",value:function Evaluate(indexA,indexB,t){var xfA=b2TimeOfImpact_s_xfA;var xfB=b2TimeOfImpact_s_xfB;this.m_sweepA.GetTransform(xfA,t);this.m_sweepB.GetTransform(xfB,t);switch(this.m_type){case exports.b2SeparationFunctionType.e_points:{var localPointA=this.m_proxyA.GetVertex(indexA);var localPointB=this.m_proxyB.GetVertex(indexB);var pointA=b2Transform.MulXV(xfA,localPointA,b2TimeOfImpact_s_pointA);var pointB=b2Transform.MulXV(xfB,localPointB,b2TimeOfImpact_s_pointB);var separation=b2Vec2.DotVV(b2Vec2.SubVV(pointB,pointA,b2Vec2.s_t0),this.m_axis);return separation;}case exports.b2SeparationFunctionType.e_faceA:{var normal=b2Rot.MulRV(xfA.q,this.m_axis,b2TimeOfImpact_s_normal);var _pointA5=b2Transform.MulXV(xfA,this.m_localPoint,b2TimeOfImpact_s_pointA);var _localPointB3=this.m_proxyB.GetVertex(indexB);var _pointB5=b2Transform.MulXV(xfB,_localPointB3,b2TimeOfImpact_s_pointB);var _separation3=b2Vec2.DotVV(b2Vec2.SubVV(_pointB5,_pointA5,b2Vec2.s_t0),normal);return _separation3;}case exports.b2SeparationFunctionType.e_faceB:{var _normal3=b2Rot.MulRV(xfB.q,this.m_axis,b2TimeOfImpact_s_normal);var _pointB6=b2Transform.MulXV(xfB,this.m_localPoint,b2TimeOfImpact_s_pointB);var _localPointA3=this.m_proxyA.GetVertex(indexA);var _pointA6=b2Transform.MulXV(xfA,_localPointA3,b2TimeOfImpact_s_pointA);var _separation4=b2Vec2.DotVV(b2Vec2.SubVV(_pointA6,_pointB6,b2Vec2.s_t0),_normal3);return _separation4;}default:// DEBUG: b2Assert(false);
      return 0;}}}]);}();var b2TimeOfImpact_s_timer=new b2Timer();var b2TimeOfImpact_s_cache=new b2SimplexCache();var b2TimeOfImpact_s_distanceInput=new b2DistanceInput();var b2TimeOfImpact_s_distanceOutput=new b2DistanceOutput();var b2TimeOfImpact_s_fcn=new b2SeparationFunction();var b2TimeOfImpact_s_indexA=[0];var b2TimeOfImpact_s_indexB=[0];var b2TimeOfImpact_s_sweepA=new b2Sweep();var b2TimeOfImpact_s_sweepB=new b2Sweep();function b2TimeOfImpact(output,input){var timer=b2TimeOfImpact_s_timer.Reset();++exports.b2_toiCalls;output.state=exports.b2TOIOutputState.e_unknown;output.t=input.tMax;var proxyA=input.proxyA;var proxyB=input.proxyB;var maxVertices=b2Max(b2_maxPolygonVertices,b2Max(proxyA.m_count,proxyB.m_count));var sweepA=b2TimeOfImpact_s_sweepA.Copy(input.sweepA);var sweepB=b2TimeOfImpact_s_sweepB.Copy(input.sweepB);// Large rotations can make the root finder fail, so we normalize the
      // sweep angles.
      sweepA.Normalize();sweepB.Normalize();var tMax=input.tMax;var totalRadius=proxyA.m_radius+proxyB.m_radius;var target=b2Max(b2_linearSlop,totalRadius-3*b2_linearSlop);var tolerance=0.25*b2_linearSlop;// DEBUG: b2Assert(target > tolerance);
      var t1=0;var k_maxIterations=20;// TODO_ERIN b2Settings
      var iter=0;// Prepare input for distance query.
      var cache=b2TimeOfImpact_s_cache;cache.count=0;var distanceInput=b2TimeOfImpact_s_distanceInput;distanceInput.proxyA.Copy(input.proxyA);distanceInput.proxyB.Copy(input.proxyB);distanceInput.useRadii=false;// The outer loop progressively attempts to compute new separating axes.
      // This loop terminates when an axis is repeated (no progress is made).
      for(;;){var xfA=b2TimeOfImpact_s_xfA;var xfB=b2TimeOfImpact_s_xfB;sweepA.GetTransform(xfA,t1);sweepB.GetTransform(xfB,t1);// Get the distance between shapes. We can also use the results
      // to get a separating axis.
      distanceInput.transformA.Copy(xfA);distanceInput.transformB.Copy(xfB);var distanceOutput=b2TimeOfImpact_s_distanceOutput;b2Distance(distanceOutput,cache,distanceInput);// If the shapes are overlapped, we give up on continuous collision.
      if(distanceOutput.distance<=0){// Failure!
      output.state=exports.b2TOIOutputState.e_overlapped;output.t=0;break;}if(distanceOutput.distance<target+tolerance){// Victory!
      output.state=exports.b2TOIOutputState.e_touching;output.t=t1;break;}// Initialize the separating axis.
      var fcn=b2TimeOfImpact_s_fcn;fcn.Initialize(cache,proxyA,sweepA,proxyB,sweepB,t1);/*
                #if 0
                    // Dump the curve seen by the root finder {
                      const int32 N = 100;
                      float32 dx = 1.0f / N;
                      float32 xs[N+1];
                      float32 fs[N+1];
                
                      float32 x = 0.0f;
                
                      for (int32 i = 0; i <= N; ++i) {
                        sweepA.GetTransform(&xfA, x);
                        sweepB.GetTransform(&xfB, x);
                        float32 f = fcn.Evaluate(xfA, xfB) - target;
                
                        printf("%g %g\n", x, f);
                
                        xs[i] = x;
                        fs[i] = f;
                
                        x += dx;
                      }
                    }
                #endif
                */// Compute the TOI on the separating axis. We do this by successively
      // resolving the deepest point. This loop is bounded by the number of vertices.
      var done=false;var t2=tMax;var pushBackIter=0;for(;;){// Find the deepest point at t2. Store the witness point indices.
      var indexA=b2TimeOfImpact_s_indexA;var indexB=b2TimeOfImpact_s_indexB;var s2=fcn.FindMinSeparation(indexA,indexB,t2);// Is the final configuration separated?
      if(s2>target+tolerance){// Victory!
      output.state=exports.b2TOIOutputState.e_separated;output.t=tMax;done=true;break;}// Has the separation reached tolerance?
      if(s2>target-tolerance){// Advance the sweeps
      t1=t2;break;}// Compute the initial separation of the witness points.
      var s1=fcn.Evaluate(indexA[0],indexB[0],t1);// Check for initial overlap. This might happen if the root finder
      // runs out of iterations.
      if(s1<target-tolerance){output.state=exports.b2TOIOutputState.e_failed;output.t=t1;done=true;break;}// Check for touching
      if(s1<=target+tolerance){// Victory! t1 should hold the TOI (could be 0.0).
      output.state=exports.b2TOIOutputState.e_touching;output.t=t1;done=true;break;}// Compute 1D root of: f(x) - target = 0
      var rootIterCount=0;var a1=t1;var a2=t2;for(;;){// Use a mix of the secant rule and bisection.
      var t=0;if(rootIterCount&1){// Secant rule to improve convergence.
      t=a1+(target-s1)*(a2-a1)/(s2-s1);}else {// Bisection to guarantee progress.
      t=0.5*(a1+a2);}++rootIterCount;++exports.b2_toiRootIters;var s=fcn.Evaluate(indexA[0],indexB[0],t);if(b2Abs(s-target)<tolerance){// t2 holds a tentative value for t1
      t2=t;break;}// Ensure we continue to bracket the root.
      if(s>target){a1=t;s1=s;}else {a2=t;s2=s;}if(rootIterCount===50){break;}}exports.b2_toiMaxRootIters=b2Max(exports.b2_toiMaxRootIters,rootIterCount);++pushBackIter;if(pushBackIter===maxVertices){break;}}++iter;++exports.b2_toiIters;if(done){break;}if(iter===k_maxIterations){// Root finder got stuck. Semi-victory.
      output.state=exports.b2TOIOutputState.e_failed;output.t=t1;break;}}exports.b2_toiMaxIters=b2Max(exports.b2_toiMaxIters,iter);var time=timer.GetMilliseconds();exports.b2_toiMaxTime=b2Max(exports.b2_toiMaxTime,time);exports.b2_toiTime+=time;}var b2CollideCircles_s_pA=new b2Vec2();var b2CollideCircles_s_pB=new b2Vec2();function b2CollideCircles(manifold,circleA,xfA,circleB,xfB){manifold.pointCount=0;var pA=b2Transform.MulXV(xfA,circleA.m_p,b2CollideCircles_s_pA);var pB=b2Transform.MulXV(xfB,circleB.m_p,b2CollideCircles_s_pB);var distSqr=b2Vec2.DistanceSquaredVV(pA,pB);var radius=circleA.m_radius+circleB.m_radius;if(distSqr>radius*radius){return;}manifold.type=exports.b2ManifoldType.e_circles;manifold.localPoint.Copy(circleA.m_p);manifold.localNormal.SetZero();manifold.pointCount=1;manifold.points[0].localPoint.Copy(circleB.m_p);manifold.points[0].id.key=0;}var b2CollidePolygonAndCircle_s_c=new b2Vec2();var b2CollidePolygonAndCircle_s_cLocal=new b2Vec2();var b2CollidePolygonAndCircle_s_faceCenter=new b2Vec2();function b2CollidePolygonAndCircle(manifold,polygonA,xfA,circleB,xfB){manifold.pointCount=0;// Compute circle position in the frame of the polygon.
      var c=b2Transform.MulXV(xfB,circleB.m_p,b2CollidePolygonAndCircle_s_c);var cLocal=b2Transform.MulTXV(xfA,c,b2CollidePolygonAndCircle_s_cLocal);// Find the min separating edge.
      var normalIndex=0;var separation=-b2_maxFloat;var radius=polygonA.m_radius+circleB.m_radius;var vertexCount=polygonA.m_count;var vertices=polygonA.m_vertices;var normals=polygonA.m_normals;for(var i=0;i<vertexCount;++i){var s=b2Vec2.DotVV(normals[i],b2Vec2.SubVV(cLocal,vertices[i],b2Vec2.s_t0));if(s>radius){// Early out.
      return;}if(s>separation){separation=s;normalIndex=i;}}// Vertices that subtend the incident face.
      var vertIndex1=normalIndex;var vertIndex2=(vertIndex1+1)%vertexCount;var v1=vertices[vertIndex1];var v2=vertices[vertIndex2];// If the center is inside the polygon ...
      if(separation<b2_epsilon){manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_faceA;manifold.localNormal.Copy(normals[normalIndex]);b2Vec2.MidVV(v1,v2,manifold.localPoint);manifold.points[0].localPoint.Copy(circleB.m_p);manifold.points[0].id.key=0;return;}// Compute barycentric coordinates
      var u1=b2Vec2.DotVV(b2Vec2.SubVV(cLocal,v1,b2Vec2.s_t0),b2Vec2.SubVV(v2,v1,b2Vec2.s_t1));var u2=b2Vec2.DotVV(b2Vec2.SubVV(cLocal,v2,b2Vec2.s_t0),b2Vec2.SubVV(v1,v2,b2Vec2.s_t1));if(u1<=0){if(b2Vec2.DistanceSquaredVV(cLocal,v1)>radius*radius){return;}manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_faceA;b2Vec2.SubVV(cLocal,v1,manifold.localNormal).SelfNormalize();manifold.localPoint.Copy(v1);manifold.points[0].localPoint.Copy(circleB.m_p);manifold.points[0].id.key=0;}else if(u2<=0){if(b2Vec2.DistanceSquaredVV(cLocal,v2)>radius*radius){return;}manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_faceA;b2Vec2.SubVV(cLocal,v2,manifold.localNormal).SelfNormalize();manifold.localPoint.Copy(v2);manifold.points[0].localPoint.Copy(circleB.m_p);manifold.points[0].id.key=0;}else {var faceCenter=b2Vec2.MidVV(v1,v2,b2CollidePolygonAndCircle_s_faceCenter);var _separation5=b2Vec2.DotVV(b2Vec2.SubVV(cLocal,faceCenter,b2Vec2.s_t1),normals[vertIndex1]);if(_separation5>radius){return;}manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_faceA;manifold.localNormal.Copy(normals[vertIndex1]).SelfNormalize();manifold.localPoint.Copy(faceCenter);manifold.points[0].localPoint.Copy(circleB.m_p);manifold.points[0].id.key=0;}}// DEBUG: import { b2Assert } from "../common/b2_settings.js";
      var b2EdgeSeparation_s_normal1World=new b2Vec2();var b2EdgeSeparation_s_normal1=new b2Vec2();var b2EdgeSeparation_s_v1=new b2Vec2();var b2EdgeSeparation_s_v2=new b2Vec2();function b2EdgeSeparation(poly1,xf1,edge1,poly2,xf2){// DEBUG: const count1: number = poly1.m_count;
      var vertices1=poly1.m_vertices;var normals1=poly1.m_normals;var count2=poly2.m_count;var vertices2=poly2.m_vertices;// DEBUG: b2Assert(0 <= edge1 && edge1 < count1);
      // Convert normal from poly1's frame into poly2's frame.
      var normal1World=b2Rot.MulRV(xf1.q,normals1[edge1],b2EdgeSeparation_s_normal1World);var normal1=b2Rot.MulTRV(xf2.q,normal1World,b2EdgeSeparation_s_normal1);// Find support vertex on poly2 for -normal.
      var index=0;var minDot=b2_maxFloat;for(var i=0;i<count2;++i){var dot=b2Vec2.DotVV(vertices2[i],normal1);if(dot<minDot){minDot=dot;index=i;}}var v1=b2Transform.MulXV(xf1,vertices1[edge1],b2EdgeSeparation_s_v1);var v2=b2Transform.MulXV(xf2,vertices2[index],b2EdgeSeparation_s_v2);var separation=b2Vec2.DotVV(b2Vec2.SubVV(v2,v1,b2Vec2.s_t0),normal1World);return separation;}var b2FindMaxSeparation_s_d=new b2Vec2();var b2FindMaxSeparation_s_dLocal1=new b2Vec2();function b2FindMaxSeparation(edgeIndex,poly1,xf1,poly2,xf2){var count1=poly1.m_count;var normals1=poly1.m_normals;// Vector pointing from the centroid of poly1 to the centroid of poly2.
      var d=b2Vec2.SubVV(b2Transform.MulXV(xf2,poly2.m_centroid,b2Vec2.s_t0),b2Transform.MulXV(xf1,poly1.m_centroid,b2Vec2.s_t1),b2FindMaxSeparation_s_d);var dLocal1=b2Rot.MulTRV(xf1.q,d,b2FindMaxSeparation_s_dLocal1);// Find edge normal on poly1 that has the largest projection onto d.
      var edge=0;var maxDot=-b2_maxFloat;for(var i=0;i<count1;++i){var dot=b2Vec2.DotVV(normals1[i],dLocal1);if(dot>maxDot){maxDot=dot;edge=i;}}// Get the separation for the edge normal.
      var s=b2EdgeSeparation(poly1,xf1,edge,poly2,xf2);// Check the separation for the previous edge normal.
      var prevEdge=(edge+count1-1)%count1;var sPrev=b2EdgeSeparation(poly1,xf1,prevEdge,poly2,xf2);// Check the separation for the next edge normal.
      var nextEdge=(edge+1)%count1;var sNext=b2EdgeSeparation(poly1,xf1,nextEdge,poly2,xf2);// Find the best edge and the search direction.
      var bestEdge=0;var bestSeparation=0;var increment=0;if(sPrev>s&&sPrev>sNext){increment=-1;bestEdge=prevEdge;bestSeparation=sPrev;}else if(sNext>s){increment=1;bestEdge=nextEdge;bestSeparation=sNext;}else {edgeIndex[0]=edge;return s;}// Perform a local search for the best edge normal.
      while(true){if(increment===-1){edge=(bestEdge+count1-1)%count1;}else {edge=(bestEdge+1)%count1;}s=b2EdgeSeparation(poly1,xf1,edge,poly2,xf2);if(s>bestSeparation){bestEdge=edge;bestSeparation=s;}else {break;}}edgeIndex[0]=bestEdge;return bestSeparation;}var b2FindIncidentEdge_s_normal1=new b2Vec2();function b2FindIncidentEdge(c,poly1,xf1,edge1,poly2,xf2){// DEBUG: const count1: number = poly1.m_count;
      var normals1=poly1.m_normals;var count2=poly2.m_count;var vertices2=poly2.m_vertices;var normals2=poly2.m_normals;// DEBUG: b2Assert(0 <= edge1 && edge1 < count1);
      // Get the normal of the reference edge in poly2's frame.
      var normal1=b2Rot.MulTRV(xf2.q,b2Rot.MulRV(xf1.q,normals1[edge1],b2Vec2.s_t0),b2FindIncidentEdge_s_normal1);// Find the incident edge on poly2.
      var index=0;var minDot=b2_maxFloat;for(var i=0;i<count2;++i){var dot=b2Vec2.DotVV(normal1,normals2[i]);if(dot<minDot){minDot=dot;index=i;}}// Build the clip vertices for the incident edge.
      var i1=index;var i2=(i1+1)%count2;var c0=c[0];b2Transform.MulXV(xf2,vertices2[i1],c0.v);var cf0=c0.id.cf;cf0.indexA=edge1;cf0.indexB=i1;cf0.typeA=exports.b2ContactFeatureType.e_face;cf0.typeB=exports.b2ContactFeatureType.e_vertex;var c1=c[1];b2Transform.MulXV(xf2,vertices2[i2],c1.v);var cf1=c1.id.cf;cf1.indexA=edge1;cf1.indexB=i2;cf1.typeA=exports.b2ContactFeatureType.e_face;cf1.typeB=exports.b2ContactFeatureType.e_vertex;}var b2CollidePolygons_s_incidentEdge=b2ClipVertex.MakeArray(2);var b2CollidePolygons_s_clipPoints1=b2ClipVertex.MakeArray(2);var b2CollidePolygons_s_clipPoints2=b2ClipVertex.MakeArray(2);var b2CollidePolygons_s_edgeA=[0];var b2CollidePolygons_s_edgeB=[0];var b2CollidePolygons_s_localTangent=new b2Vec2();var b2CollidePolygons_s_localNormal=new b2Vec2();var b2CollidePolygons_s_planePoint=new b2Vec2();var b2CollidePolygons_s_normal=new b2Vec2();var b2CollidePolygons_s_tangent=new b2Vec2();var b2CollidePolygons_s_ntangent=new b2Vec2();var b2CollidePolygons_s_v11=new b2Vec2();var b2CollidePolygons_s_v12=new b2Vec2();function b2CollidePolygons(manifold,polyA,xfA,polyB,xfB){manifold.pointCount=0;var totalRadius=polyA.m_radius+polyB.m_radius;var edgeA=b2CollidePolygons_s_edgeA;edgeA[0]=0;var separationA=b2FindMaxSeparation(edgeA,polyA,xfA,polyB,xfB);if(separationA>totalRadius){return;}var edgeB=b2CollidePolygons_s_edgeB;edgeB[0]=0;var separationB=b2FindMaxSeparation(edgeB,polyB,xfB,polyA,xfA);if(separationB>totalRadius){return;}var poly1;// reference polygon
      var poly2;// incident polygon
      var xf1,xf2;var edge1=0;// reference edge
      var flip=0;var k_relativeTol=0.98;var k_absoluteTol=0.001;if(separationB>k_relativeTol*separationA+k_absoluteTol){poly1=polyB;poly2=polyA;xf1=xfB;xf2=xfA;edge1=edgeB[0];manifold.type=exports.b2ManifoldType.e_faceB;flip=1;}else {poly1=polyA;poly2=polyB;xf1=xfA;xf2=xfB;edge1=edgeA[0];manifold.type=exports.b2ManifoldType.e_faceA;flip=0;}var incidentEdge=b2CollidePolygons_s_incidentEdge;b2FindIncidentEdge(incidentEdge,poly1,xf1,edge1,poly2,xf2);var count1=poly1.m_count;var vertices1=poly1.m_vertices;var iv1=edge1;var iv2=(edge1+1)%count1;var local_v11=vertices1[iv1];var local_v12=vertices1[iv2];var localTangent=b2Vec2.SubVV(local_v12,local_v11,b2CollidePolygons_s_localTangent);localTangent.Normalize();var localNormal=b2Vec2.CrossVOne(localTangent,b2CollidePolygons_s_localNormal);var planePoint=b2Vec2.MidVV(local_v11,local_v12,b2CollidePolygons_s_planePoint);var tangent=b2Rot.MulRV(xf1.q,localTangent,b2CollidePolygons_s_tangent);var normal=b2Vec2.CrossVOne(tangent,b2CollidePolygons_s_normal);var v11=b2Transform.MulXV(xf1,local_v11,b2CollidePolygons_s_v11);var v12=b2Transform.MulXV(xf1,local_v12,b2CollidePolygons_s_v12);// Face offset.
      var frontOffset=b2Vec2.DotVV(normal,v11);// Side offsets, extended by polytope skin thickness.
      var sideOffset1=-b2Vec2.DotVV(tangent,v11)+totalRadius;var sideOffset2=b2Vec2.DotVV(tangent,v12)+totalRadius;// Clip incident edge against extruded edge1 side edges.
      var clipPoints1=b2CollidePolygons_s_clipPoints1;var clipPoints2=b2CollidePolygons_s_clipPoints2;var np;// Clip to box side 1
      var ntangent=b2Vec2.NegV(tangent,b2CollidePolygons_s_ntangent);np=b2ClipSegmentToLine(clipPoints1,incidentEdge,ntangent,sideOffset1,iv1);if(np<2){return;}// Clip to negative box side 1
      np=b2ClipSegmentToLine(clipPoints2,clipPoints1,tangent,sideOffset2,iv2);if(np<2){return;}// Now clipPoints2 contains the clipped points.
      manifold.localNormal.Copy(localNormal);manifold.localPoint.Copy(planePoint);var pointCount=0;for(var i=0;i<b2_maxManifoldPoints;++i){var cv=clipPoints2[i];var separation=b2Vec2.DotVV(normal,cv.v)-frontOffset;if(separation<=totalRadius){var cp=manifold.points[pointCount];b2Transform.MulTXV(xf2,cv.v,cp.localPoint);cp.id.Copy(cv.id);if(flip){// Swap features
      var cf=cp.id.cf;cp.id.cf.indexA=cf.indexB;cp.id.cf.indexB=cf.indexA;cp.id.cf.typeA=cf.typeB;cp.id.cf.typeB=cf.typeA;}++pointCount;}}manifold.pointCount=pointCount;}// DEBUG: import { b2Assert } from "../common/b2_settings.js";
      var b2CollideEdgeAndCircle_s_Q=new b2Vec2();var b2CollideEdgeAndCircle_s_e=new b2Vec2();var b2CollideEdgeAndCircle_s_d=new b2Vec2();var b2CollideEdgeAndCircle_s_e1=new b2Vec2();var b2CollideEdgeAndCircle_s_e2=new b2Vec2();var b2CollideEdgeAndCircle_s_P=new b2Vec2();var b2CollideEdgeAndCircle_s_n=new b2Vec2();var b2CollideEdgeAndCircle_s_id=new b2ContactID();function b2CollideEdgeAndCircle(manifold,edgeA,xfA,circleB,xfB){manifold.pointCount=0;// Compute circle in frame of edge
      var Q=b2Transform.MulTXV(xfA,b2Transform.MulXV(xfB,circleB.m_p,b2Vec2.s_t0),b2CollideEdgeAndCircle_s_Q);var A=edgeA.m_vertex1;var B=edgeA.m_vertex2;var e=b2Vec2.SubVV(B,A,b2CollideEdgeAndCircle_s_e);// Barycentric coordinates
      var u=b2Vec2.DotVV(e,b2Vec2.SubVV(B,Q,b2Vec2.s_t0));var v=b2Vec2.DotVV(e,b2Vec2.SubVV(Q,A,b2Vec2.s_t0));var radius=edgeA.m_radius+circleB.m_radius;// const cf: b2ContactFeature = new b2ContactFeature();
      var id=b2CollideEdgeAndCircle_s_id;id.cf.indexB=0;id.cf.typeB=exports.b2ContactFeatureType.e_vertex;// Region A
      if(v<=0){var _P=A;var _d=b2Vec2.SubVV(Q,_P,b2CollideEdgeAndCircle_s_d);var _dd=b2Vec2.DotVV(_d,_d);if(_dd>radius*radius){return;}// Is there an edge connected to A?
      if(edgeA.m_hasVertex0){var A1=edgeA.m_vertex0;var B1=A;var e1=b2Vec2.SubVV(B1,A1,b2CollideEdgeAndCircle_s_e1);var u1=b2Vec2.DotVV(e1,b2Vec2.SubVV(B1,Q,b2Vec2.s_t0));// Is the circle in Region AB of the previous edge?
      if(u1>0){return;}}id.cf.indexA=0;id.cf.typeA=exports.b2ContactFeatureType.e_vertex;manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_circles;manifold.localNormal.SetZero();manifold.localPoint.Copy(_P);manifold.points[0].id.Copy(id);// manifold.points[0].id.key = 0;
      // manifold.points[0].id.cf = cf;
      manifold.points[0].localPoint.Copy(circleB.m_p);return;}// Region B
      if(u<=0){var _P2=B;var _d2=b2Vec2.SubVV(Q,_P2,b2CollideEdgeAndCircle_s_d);var _dd2=b2Vec2.DotVV(_d2,_d2);if(_dd2>radius*radius){return;}// Is there an edge connected to B?
      if(edgeA.m_hasVertex3){var B2=edgeA.m_vertex3;var A2=B;var e2=b2Vec2.SubVV(B2,A2,b2CollideEdgeAndCircle_s_e2);var v2=b2Vec2.DotVV(e2,b2Vec2.SubVV(Q,A2,b2Vec2.s_t0));// Is the circle in Region AB of the next edge?
      if(v2>0){return;}}id.cf.indexA=1;id.cf.typeA=exports.b2ContactFeatureType.e_vertex;manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_circles;manifold.localNormal.SetZero();manifold.localPoint.Copy(_P2);manifold.points[0].id.Copy(id);// manifold.points[0].id.key = 0;
      // manifold.points[0].id.cf = cf;
      manifold.points[0].localPoint.Copy(circleB.m_p);return;}// Region AB
      var den=b2Vec2.DotVV(e,e);// DEBUG: b2Assert(den > 0);
      var P=b2CollideEdgeAndCircle_s_P;P.x=1/den*(u*A.x+v*B.x);P.y=1/den*(u*A.y+v*B.y);var d=b2Vec2.SubVV(Q,P,b2CollideEdgeAndCircle_s_d);var dd=b2Vec2.DotVV(d,d);if(dd>radius*radius){return;}var n=b2CollideEdgeAndCircle_s_n.Set(-e.y,e.x);if(b2Vec2.DotVV(n,b2Vec2.SubVV(Q,A,b2Vec2.s_t0))<0){n.Set(-n.x,-n.y);}n.Normalize();id.cf.indexA=0;id.cf.typeA=exports.b2ContactFeatureType.e_face;manifold.pointCount=1;manifold.type=exports.b2ManifoldType.e_faceA;manifold.localNormal.Copy(n);manifold.localPoint.Copy(A);manifold.points[0].id.Copy(id);// manifold.points[0].id.key = 0;
      // manifold.points[0].id.cf = cf;
      manifold.points[0].localPoint.Copy(circleB.m_p);}var b2EPAxisType;(function(b2EPAxisType){b2EPAxisType[b2EPAxisType["e_unknown"]=0]="e_unknown";b2EPAxisType[b2EPAxisType["e_edgeA"]=1]="e_edgeA";b2EPAxisType[b2EPAxisType["e_edgeB"]=2]="e_edgeB";})(b2EPAxisType||(b2EPAxisType={}));var b2EPAxis=/*#__PURE__*/_createClass(function b2EPAxis(){_classCallCheck(this,b2EPAxis);this.type=b2EPAxisType.e_unknown;this.index=0;this.separation=0;});var b2TempPolygon=/*#__PURE__*/_createClass(function b2TempPolygon(){_classCallCheck(this,b2TempPolygon);this.vertices=[];this.normals=[];this.count=0;});var b2ReferenceFace=/*#__PURE__*/_createClass(function b2ReferenceFace(){_classCallCheck(this,b2ReferenceFace);this.i1=0;this.i2=0;this.v1=new b2Vec2();this.v2=new b2Vec2();this.normal=new b2Vec2();this.sideNormal1=new b2Vec2();this.sideOffset1=0;this.sideNormal2=new b2Vec2();this.sideOffset2=0;});var b2EPColliderVertexType;(function(b2EPColliderVertexType){b2EPColliderVertexType[b2EPColliderVertexType["e_isolated"]=0]="e_isolated";b2EPColliderVertexType[b2EPColliderVertexType["e_concave"]=1]="e_concave";b2EPColliderVertexType[b2EPColliderVertexType["e_convex"]=2]="e_convex";})(b2EPColliderVertexType||(b2EPColliderVertexType={}));var b2EPCollider=/*#__PURE__*/function(){function b2EPCollider(){_classCallCheck(this,b2EPCollider);this.m_polygonB=new b2TempPolygon();this.m_xf=new b2Transform();this.m_centroidB=new b2Vec2();this.m_v0=new b2Vec2();this.m_v1=new b2Vec2();this.m_v2=new b2Vec2();this.m_v3=new b2Vec2();this.m_normal0=new b2Vec2();this.m_normal1=new b2Vec2();this.m_normal2=new b2Vec2();this.m_normal=new b2Vec2();this.m_type1=b2EPColliderVertexType.e_isolated;this.m_type2=b2EPColliderVertexType.e_isolated;this.m_lowerLimit=new b2Vec2();this.m_upperLimit=new b2Vec2();this.m_radius=0;this.m_front=false;}return _createClass(b2EPCollider,[{key:"Collide",value:function Collide(manifold,edgeA,xfA,polygonB,xfB){b2Transform.MulTXX(xfA,xfB,this.m_xf);b2Transform.MulXV(this.m_xf,polygonB.m_centroid,this.m_centroidB);this.m_v0.Copy(edgeA.m_vertex0);this.m_v1.Copy(edgeA.m_vertex1);this.m_v2.Copy(edgeA.m_vertex2);this.m_v3.Copy(edgeA.m_vertex3);var hasVertex0=edgeA.m_hasVertex0;var hasVertex3=edgeA.m_hasVertex3;var edge1=b2Vec2.SubVV(this.m_v2,this.m_v1,b2EPCollider.s_edge1);edge1.Normalize();this.m_normal1.Set(edge1.y,-edge1.x);var offset1=b2Vec2.DotVV(this.m_normal1,b2Vec2.SubVV(this.m_centroidB,this.m_v1,b2Vec2.s_t0));var offset0=0;var offset2=0;var convex1=false;var convex2=false;// Is there a preceding edge?
      if(hasVertex0){var edge0=b2Vec2.SubVV(this.m_v1,this.m_v0,b2EPCollider.s_edge0);edge0.Normalize();this.m_normal0.Set(edge0.y,-edge0.x);convex1=b2Vec2.CrossVV(edge0,edge1)>=0;offset0=b2Vec2.DotVV(this.m_normal0,b2Vec2.SubVV(this.m_centroidB,this.m_v0,b2Vec2.s_t0));}// Is there a following edge?
      if(hasVertex3){var edge2=b2Vec2.SubVV(this.m_v3,this.m_v2,b2EPCollider.s_edge2);edge2.Normalize();this.m_normal2.Set(edge2.y,-edge2.x);convex2=b2Vec2.CrossVV(edge1,edge2)>0;offset2=b2Vec2.DotVV(this.m_normal2,b2Vec2.SubVV(this.m_centroidB,this.m_v2,b2Vec2.s_t0));}// Determine front or back collision. Determine collision normal limits.
      if(hasVertex0&&hasVertex3){if(convex1&&convex2){this.m_front=offset0>=0||offset1>=0||offset2>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal0);this.m_upperLimit.Copy(this.m_normal2);}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();this.m_upperLimit.Copy(this.m_normal1).SelfNeg();}}else if(convex1){this.m_front=offset0>=0||offset1>=0&&offset2>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal0);this.m_upperLimit.Copy(this.m_normal1);}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal2).SelfNeg();this.m_upperLimit.Copy(this.m_normal1).SelfNeg();}}else if(convex2){this.m_front=offset2>=0||offset0>=0&&offset1>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal1);this.m_upperLimit.Copy(this.m_normal2);}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();this.m_upperLimit.Copy(this.m_normal0).SelfNeg();}}else {this.m_front=offset0>=0&&offset1>=0&&offset2>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal1);this.m_upperLimit.Copy(this.m_normal1);}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal2).SelfNeg();this.m_upperLimit.Copy(this.m_normal0).SelfNeg();}}}else if(hasVertex0){if(convex1){this.m_front=offset0>=0||offset1>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal0);this.m_upperLimit.Copy(this.m_normal1).SelfNeg();}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal1);this.m_upperLimit.Copy(this.m_normal1).SelfNeg();}}else {this.m_front=offset0>=0&&offset1>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal1);this.m_upperLimit.Copy(this.m_normal1).SelfNeg();}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal1);this.m_upperLimit.Copy(this.m_normal0).SelfNeg();}}}else if(hasVertex3){if(convex2){this.m_front=offset1>=0||offset2>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();this.m_upperLimit.Copy(this.m_normal2);}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();this.m_upperLimit.Copy(this.m_normal1);}}else {this.m_front=offset1>=0&&offset2>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();this.m_upperLimit.Copy(this.m_normal1);}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal2).SelfNeg();this.m_upperLimit.Copy(this.m_normal1);}}}else {this.m_front=offset1>=0;if(this.m_front){this.m_normal.Copy(this.m_normal1);this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();this.m_upperLimit.Copy(this.m_normal1).SelfNeg();}else {this.m_normal.Copy(this.m_normal1).SelfNeg();this.m_lowerLimit.Copy(this.m_normal1);this.m_upperLimit.Copy(this.m_normal1);}}// Get polygonB in frameA
      this.m_polygonB.count=polygonB.m_count;for(var i=0;i<polygonB.m_count;++i){if(this.m_polygonB.vertices.length<=i){this.m_polygonB.vertices.push(new b2Vec2());}if(this.m_polygonB.normals.length<=i){this.m_polygonB.normals.push(new b2Vec2());}b2Transform.MulXV(this.m_xf,polygonB.m_vertices[i],this.m_polygonB.vertices[i]);b2Rot.MulRV(this.m_xf.q,polygonB.m_normals[i],this.m_polygonB.normals[i]);}this.m_radius=polygonB.m_radius+edgeA.m_radius;manifold.pointCount=0;var edgeAxis=this.ComputeEdgeSeparation(b2EPCollider.s_edgeAxis);// If no valid normal can be found than this edge should not collide.
      if(edgeAxis.type===b2EPAxisType.e_unknown){return;}if(edgeAxis.separation>this.m_radius){return;}var polygonAxis=this.ComputePolygonSeparation(b2EPCollider.s_polygonAxis);if(polygonAxis.type!==b2EPAxisType.e_unknown&&polygonAxis.separation>this.m_radius){return;}// Use hysteresis for jitter reduction.
      var k_relativeTol=0.98;var k_absoluteTol=0.001;var primaryAxis;if(polygonAxis.type===b2EPAxisType.e_unknown){primaryAxis=edgeAxis;}else if(polygonAxis.separation>k_relativeTol*edgeAxis.separation+k_absoluteTol){primaryAxis=polygonAxis;}else {primaryAxis=edgeAxis;}var ie=b2EPCollider.s_ie;var rf=b2EPCollider.s_rf;if(primaryAxis.type===b2EPAxisType.e_edgeA){manifold.type=exports.b2ManifoldType.e_faceA;// Search for the polygon normal that is most anti-parallel to the edge normal.
      var bestIndex=0;var bestValue=b2Vec2.DotVV(this.m_normal,this.m_polygonB.normals[0]);for(var _i4=1;_i4<this.m_polygonB.count;++_i4){var value=b2Vec2.DotVV(this.m_normal,this.m_polygonB.normals[_i4]);if(value<bestValue){bestValue=value;bestIndex=_i4;}}var i1=bestIndex;var i2=(i1+1)%this.m_polygonB.count;var ie0=ie[0];ie0.v.Copy(this.m_polygonB.vertices[i1]);ie0.id.cf.indexA=0;ie0.id.cf.indexB=i1;ie0.id.cf.typeA=exports.b2ContactFeatureType.e_face;ie0.id.cf.typeB=exports.b2ContactFeatureType.e_vertex;var ie1=ie[1];ie1.v.Copy(this.m_polygonB.vertices[i2]);ie1.id.cf.indexA=0;ie1.id.cf.indexB=i2;ie1.id.cf.typeA=exports.b2ContactFeatureType.e_face;ie1.id.cf.typeB=exports.b2ContactFeatureType.e_vertex;if(this.m_front){rf.i1=0;rf.i2=1;rf.v1.Copy(this.m_v1);rf.v2.Copy(this.m_v2);rf.normal.Copy(this.m_normal1);}else {rf.i1=1;rf.i2=0;rf.v1.Copy(this.m_v2);rf.v2.Copy(this.m_v1);rf.normal.Copy(this.m_normal1).SelfNeg();}}else {manifold.type=exports.b2ManifoldType.e_faceB;var _ie=ie[0];_ie.v.Copy(this.m_v1);_ie.id.cf.indexA=0;_ie.id.cf.indexB=primaryAxis.index;_ie.id.cf.typeA=exports.b2ContactFeatureType.e_vertex;_ie.id.cf.typeB=exports.b2ContactFeatureType.e_face;var _ie2=ie[1];_ie2.v.Copy(this.m_v2);_ie2.id.cf.indexA=0;_ie2.id.cf.indexB=primaryAxis.index;_ie2.id.cf.typeA=exports.b2ContactFeatureType.e_vertex;_ie2.id.cf.typeB=exports.b2ContactFeatureType.e_face;rf.i1=primaryAxis.index;rf.i2=(rf.i1+1)%this.m_polygonB.count;rf.v1.Copy(this.m_polygonB.vertices[rf.i1]);rf.v2.Copy(this.m_polygonB.vertices[rf.i2]);rf.normal.Copy(this.m_polygonB.normals[rf.i1]);}rf.sideNormal1.Set(rf.normal.y,-rf.normal.x);rf.sideNormal2.Copy(rf.sideNormal1).SelfNeg();rf.sideOffset1=b2Vec2.DotVV(rf.sideNormal1,rf.v1);rf.sideOffset2=b2Vec2.DotVV(rf.sideNormal2,rf.v2);// Clip incident edge against extruded edge1 side edges.
      var clipPoints1=b2EPCollider.s_clipPoints1;var clipPoints2=b2EPCollider.s_clipPoints2;var np=0;// Clip to box side 1
      np=b2ClipSegmentToLine(clipPoints1,ie,rf.sideNormal1,rf.sideOffset1,rf.i1);if(np<b2_maxManifoldPoints){return;}// Clip to negative box side 1
      np=b2ClipSegmentToLine(clipPoints2,clipPoints1,rf.sideNormal2,rf.sideOffset2,rf.i2);if(np<b2_maxManifoldPoints){return;}// Now clipPoints2 contains the clipped points.
      if(primaryAxis.type===b2EPAxisType.e_edgeA){manifold.localNormal.Copy(rf.normal);manifold.localPoint.Copy(rf.v1);}else {manifold.localNormal.Copy(polygonB.m_normals[rf.i1]);manifold.localPoint.Copy(polygonB.m_vertices[rf.i1]);}var pointCount=0;for(var _i5=0;_i5<b2_maxManifoldPoints;++_i5){var separation=void 0;separation=b2Vec2.DotVV(rf.normal,b2Vec2.SubVV(clipPoints2[_i5].v,rf.v1,b2Vec2.s_t0));if(separation<=this.m_radius){var cp=manifold.points[pointCount];if(primaryAxis.type===b2EPAxisType.e_edgeA){b2Transform.MulTXV(this.m_xf,clipPoints2[_i5].v,cp.localPoint);cp.id.Copy(clipPoints2[_i5].id);}else {cp.localPoint.Copy(clipPoints2[_i5].v);cp.id.cf.typeA=clipPoints2[_i5].id.cf.typeB;cp.id.cf.typeB=clipPoints2[_i5].id.cf.typeA;cp.id.cf.indexA=clipPoints2[_i5].id.cf.indexB;cp.id.cf.indexB=clipPoints2[_i5].id.cf.indexA;}++pointCount;}}manifold.pointCount=pointCount;}},{key:"ComputeEdgeSeparation",value:function ComputeEdgeSeparation(out){var axis=out;axis.type=b2EPAxisType.e_edgeA;axis.index=this.m_front?0:1;axis.separation=b2_maxFloat;for(var i=0;i<this.m_polygonB.count;++i){var s=b2Vec2.DotVV(this.m_normal,b2Vec2.SubVV(this.m_polygonB.vertices[i],this.m_v1,b2Vec2.s_t0));if(s<axis.separation){axis.separation=s;}}return axis;}},{key:"ComputePolygonSeparation",value:function ComputePolygonSeparation(out){var axis=out;axis.type=b2EPAxisType.e_unknown;axis.index=-1;axis.separation=-b2_maxFloat;var perp=b2EPCollider.s_perp.Set(-this.m_normal.y,this.m_normal.x);for(var i=0;i<this.m_polygonB.count;++i){var n=b2Vec2.NegV(this.m_polygonB.normals[i],b2EPCollider.s_n);var s1=b2Vec2.DotVV(n,b2Vec2.SubVV(this.m_polygonB.vertices[i],this.m_v1,b2Vec2.s_t0));var s2=b2Vec2.DotVV(n,b2Vec2.SubVV(this.m_polygonB.vertices[i],this.m_v2,b2Vec2.s_t0));var s=b2Min(s1,s2);if(s>this.m_radius){// No collision
      axis.type=b2EPAxisType.e_edgeB;axis.index=i;axis.separation=s;return axis;}// Adjacency
      if(b2Vec2.DotVV(n,perp)>=0){if(b2Vec2.DotVV(b2Vec2.SubVV(n,this.m_upperLimit,b2Vec2.s_t0),this.m_normal)<-b2_angularSlop){continue;}}else {if(b2Vec2.DotVV(b2Vec2.SubVV(n,this.m_lowerLimit,b2Vec2.s_t0),this.m_normal)<-b2_angularSlop){continue;}}if(s>axis.separation){axis.type=b2EPAxisType.e_edgeB;axis.index=i;axis.separation=s;}}return axis;}}]);}();b2EPCollider.s_edge1=new b2Vec2();b2EPCollider.s_edge0=new b2Vec2();b2EPCollider.s_edge2=new b2Vec2();b2EPCollider.s_ie=b2ClipVertex.MakeArray(2);b2EPCollider.s_rf=new b2ReferenceFace();b2EPCollider.s_clipPoints1=b2ClipVertex.MakeArray(2);b2EPCollider.s_clipPoints2=b2ClipVertex.MakeArray(2);b2EPCollider.s_edgeAxis=new b2EPAxis();b2EPCollider.s_polygonAxis=new b2EPAxis();b2EPCollider.s_n=new b2Vec2();b2EPCollider.s_perp=new b2Vec2();var b2CollideEdgeAndPolygon_s_collider=new b2EPCollider();function b2CollideEdgeAndPolygon(manifold,edgeA,xfA,polygonB,xfB){var collider=b2CollideEdgeAndPolygon_s_collider;collider.Collide(manifold,edgeA,xfA,polygonB,xfB);}/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// This holds the mass data computed for a shape.
      var b2MassData=/*#__PURE__*/_createClass(function b2MassData(){_classCallCheck(this,b2MassData);/// The mass of the shape, usually in kilograms.
      this.mass=0;/// The position of the shape's centroid relative to the shape's origin.
      this.center=new b2Vec2(0,0);/// The rotational inertia of the shape about the local origin.
      this.I=0;});(function(b2ShapeType){b2ShapeType[b2ShapeType["e_unknown"]=-1]="e_unknown";b2ShapeType[b2ShapeType["e_circleShape"]=0]="e_circleShape";b2ShapeType[b2ShapeType["e_edgeShape"]=1]="e_edgeShape";b2ShapeType[b2ShapeType["e_polygonShape"]=2]="e_polygonShape";b2ShapeType[b2ShapeType["e_chainShape"]=3]="e_chainShape";b2ShapeType[b2ShapeType["e_shapeTypeCount"]=4]="e_shapeTypeCount";})(exports.b2ShapeType||(exports.b2ShapeType={}));/// A shape is used for collision detection. You can create a shape however you like.
      /// Shapes used for simulation in b2World are created automatically when a b2Fixture
      /// is created. Shapes may encapsulate a one or more child shapes.
      var b2Shape=/*#__PURE__*/function(){function b2Shape(type,radius){_classCallCheck(this,b2Shape);this.m_type=exports.b2ShapeType.e_unknown;/// Radius of a shape. For polygonal shapes this must be b2_polygonRadius. There is no support for
      /// making rounded polygons.
      this.m_radius=0;this.m_type=type;this.m_radius=radius;}return _createClass(b2Shape,[{key:"Copy",value:function Copy(other){// DEBUG: b2Assert(this.m_type === other.m_type);
      this.m_radius=other.m_radius;return this;}/// Get the type of this shape. You can use this to down cast to the concrete shape.
      /// @return the shape type.
      },{key:"GetType",value:function GetType(){return this.m_type;}}]);}();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// A circle shape.
      var b2CircleShape=/*#__PURE__*/function(_b2Shape){function b2CircleShape(){var _this2;var radius=arguments.length>0&&arguments[0]!==undefined?arguments[0]:0;_classCallCheck(this,b2CircleShape);_this2=_callSuper(this,b2CircleShape,[exports.b2ShapeType.e_circleShape,radius]);_this2.m_p=new b2Vec2();return _this2;}_inherits(b2CircleShape,_b2Shape);return _createClass(b2CircleShape,[{key:"Set",value:function Set(position){var radius=arguments.length>1&&arguments[1]!==undefined?arguments[1]:this.m_radius;this.m_p.Copy(position);this.m_radius=radius;return this;}/// Implement b2Shape.
      },{key:"Clone",value:function Clone(){return new b2CircleShape().Copy(this);}},{key:"Copy",value:function Copy(other){_superPropGet(b2CircleShape,"Copy",this,3)([other]);// DEBUG: b2Assert(other instanceof b2CircleShape);
      this.m_p.Copy(other.m_p);return this;}/// @see b2Shape::GetChildCount
      },{key:"GetChildCount",value:function GetChildCount(){return 1;}},{key:"TestPoint",value:function TestPoint(transform,p){var center=b2Transform.MulXV(transform,this.m_p,b2CircleShape.TestPoint_s_center);var d=b2Vec2.SubVV(p,center,b2CircleShape.TestPoint_s_d);return b2Vec2.DotVV(d,d)<=b2Sq(this.m_radius);}},{key:"ComputeDistance",value:function ComputeDistance(xf,p,normal,childIndex){var center=b2Transform.MulXV(xf,this.m_p,b2CircleShape.ComputeDistance_s_center);b2Vec2.SubVV(p,center,normal);return normal.Normalize()-this.m_radius;}},{key:"RayCast",value:function RayCast(output,input,transform,childIndex){var position=b2Transform.MulXV(transform,this.m_p,b2CircleShape.RayCast_s_position);var s=b2Vec2.SubVV(input.p1,position,b2CircleShape.RayCast_s_s);var b=b2Vec2.DotVV(s,s)-b2Sq(this.m_radius);// Solve quadratic equation.
      var r=b2Vec2.SubVV(input.p2,input.p1,b2CircleShape.RayCast_s_r);var c=b2Vec2.DotVV(s,r);var rr=b2Vec2.DotVV(r,r);var sigma=c*c-rr*b;// Check for negative discriminant and short segment.
      if(sigma<0||rr<b2_epsilon){return false;}// Find the point of intersection of the line with the circle.
      var a=-(c+b2Sqrt(sigma));// Is the intersection point on the segment?
      if(0<=a&&a<=input.maxFraction*rr){a/=rr;output.fraction=a;b2Vec2.AddVMulSV(s,a,r,output.normal).SelfNormalize();return true;}return false;}},{key:"ComputeAABB",value:function ComputeAABB(aabb,transform,childIndex){var p=b2Transform.MulXV(transform,this.m_p,b2CircleShape.ComputeAABB_s_p);aabb.lowerBound.Set(p.x-this.m_radius,p.y-this.m_radius);aabb.upperBound.Set(p.x+this.m_radius,p.y+this.m_radius);}/// @see b2Shape::ComputeMass
      },{key:"ComputeMass",value:function ComputeMass(massData,density){var radius_sq=b2Sq(this.m_radius);massData.mass=density*b2_pi*radius_sq;massData.center.Copy(this.m_p);// inertia about the local origin
      massData.I=massData.mass*(0.5*radius_sq+b2Vec2.DotVV(this.m_p,this.m_p));}},{key:"SetupDistanceProxy",value:function SetupDistanceProxy(proxy,index){proxy.m_vertices=proxy.m_buffer;proxy.m_vertices[0].Copy(this.m_p);proxy.m_count=1;proxy.m_radius=this.m_radius;}},{key:"ComputeSubmergedArea",value:function ComputeSubmergedArea(normal,offset,xf,c){var p=b2Transform.MulXV(xf,this.m_p,new b2Vec2());var l=-(b2Vec2.DotVV(normal,p)-offset);if(l<-this.m_radius+b2_epsilon){// Completely dry
      return 0;}if(l>this.m_radius){// Completely wet
      c.Copy(p);return b2_pi*this.m_radius*this.m_radius;}// Magic
      var r2=this.m_radius*this.m_radius;var l2=l*l;var area=r2*(b2Asin(l/this.m_radius)+b2_pi/2)+l*b2Sqrt(r2-l2);var com=-2/3*b2Pow(r2-l2,1.5)/area;c.x=p.x+normal.x*com;c.y=p.y+normal.y*com;return area;}},{key:"Dump",value:function Dump(log){log("    const shape: b2CircleShape = new b2CircleShape();\n");log("    shape.m_radius = %.15f;\n",this.m_radius);log("    shape.m_p.Set(%.15f, %.15f);\n",this.m_p.x,this.m_p.y);}}]);}(b2Shape);/// Implement b2Shape.
      b2CircleShape.TestPoint_s_center=new b2Vec2();b2CircleShape.TestPoint_s_d=new b2Vec2();// #if B2_ENABLE_PARTICLE
      /// @see b2Shape::ComputeDistance
      b2CircleShape.ComputeDistance_s_center=new b2Vec2();// #endif
      /// Implement b2Shape.
      // Collision Detection in Interactive 3D Environments by Gino van den Bergen
      // From Section 3.1.2
      // x = s + a * r
      // norm(x) = radius
      b2CircleShape.RayCast_s_position=new b2Vec2();b2CircleShape.RayCast_s_s=new b2Vec2();b2CircleShape.RayCast_s_r=new b2Vec2();/// @see b2Shape::ComputeAABB
      b2CircleShape.ComputeAABB_s_p=new b2Vec2();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// A convex polygon. It is assumed that the interior of the polygon is to
      /// the left of each edge.
      /// In most cases you should not need many vertices for a convex polygon.
      var b2PolygonShape=/*#__PURE__*/function(_b2Shape2){function b2PolygonShape(){var _this3;_classCallCheck(this,b2PolygonShape);_this3=_callSuper(this,b2PolygonShape,[exports.b2ShapeType.e_polygonShape,b2_polygonRadius]);_this3.m_centroid=new b2Vec2(0,0);_this3.m_vertices=[];_this3.m_normals=[];_this3.m_count=0;return _this3;}/// Implement b2Shape.
      _inherits(b2PolygonShape,_b2Shape2);return _createClass(b2PolygonShape,[{key:"Clone",value:function Clone(){return new b2PolygonShape().Copy(this);}},{key:"Copy",value:function Copy(other){_superPropGet(b2PolygonShape,"Copy",this,3)([other]);// DEBUG: b2Assert(other instanceof b2PolygonShape);
      this.m_centroid.Copy(other.m_centroid);this.m_count=other.m_count;this.m_vertices=b2Vec2.MakeArray(this.m_count);this.m_normals=b2Vec2.MakeArray(this.m_count);for(var i=0;i<this.m_count;++i){this.m_vertices[i].Copy(other.m_vertices[i]);this.m_normals[i].Copy(other.m_normals[i]);}return this;}/// @see b2Shape::GetChildCount
      },{key:"GetChildCount",value:function GetChildCount(){return 1;}},{key:"Set",value:function Set(){for(var _len5=arguments.length,args=new Array(_len5),_key6=0;_key6<_len5;_key6++){args[_key6]=arguments[_key6];}if(typeof args[0][0]==="number"){var vertices=args[0];if(vertices.length%2!==0){throw new Error();}return this._Set(function(index){return {x:vertices[index*2],y:vertices[index*2+1]};},vertices.length/2);}else {var _vertices=args[0];var count=args[1]||_vertices.length;return this._Set(function(index){return _vertices[index];},count);}}},{key:"_Set",value:function _Set(vertices,count){// DEBUG: b2Assert(3 <= count);
      if(count<3){return this.SetAsBox(1,1);}var n=count;// Perform welding and copy vertices into local buffer.
      var ps=[];for(var i=0;i<n;++i){var/*b2Vec2*/v=vertices(i);var/*bool*/unique=true;for(var/*int32*/j=0;j<ps.length;++j){if(b2Vec2.DistanceSquaredVV(v,ps[j])<0.5*b2_linearSlop*(0.5*b2_linearSlop)){unique=false;break;}}if(unique){ps.push(v);}}n=ps.length;if(n<3){// Polygon is degenerate.
      // DEBUG: b2Assert(false);
      return this.SetAsBox(1.0,1.0);}// Create the convex hull using the Gift wrapping algorithm
      // http://en.wikipedia.org/wiki/Gift_wrapping_algorithm
      // Find the right most point on the hull
      var i0=0;var x0=ps[0].x;for(var _i6=1;_i6<n;++_i6){var x=ps[_i6].x;if(x>x0||x===x0&&ps[_i6].y<ps[i0].y){i0=_i6;x0=x;}}var hull=[];var m=0;var ih=i0;for(;;){hull[m]=ih;var ie=0;for(var _j2=1;_j2<n;++_j2){if(ie===ih){ie=_j2;continue;}var r=b2Vec2.SubVV(ps[ie],ps[hull[m]],b2PolygonShape.Set_s_r);var _v2=b2Vec2.SubVV(ps[_j2],ps[hull[m]],b2PolygonShape.Set_s_v);var c=b2Vec2.CrossVV(r,_v2);if(c<0){ie=_j2;}// Collinearity check
      if(c===0&&_v2.LengthSquared()>r.LengthSquared()){ie=_j2;}}++m;ih=ie;if(ie===i0){break;}}this.m_count=m;this.m_vertices=b2Vec2.MakeArray(this.m_count);this.m_normals=b2Vec2.MakeArray(this.m_count);// Copy vertices.
      for(var _i7=0;_i7<m;++_i7){this.m_vertices[_i7].Copy(ps[hull[_i7]]);}// Compute normals. Ensure the edges have non-zero length.
      for(var _i8=0;_i8<m;++_i8){var vertexi1=this.m_vertices[_i8];var vertexi2=this.m_vertices[(_i8+1)%m];var edge=b2Vec2.SubVV(vertexi2,vertexi1,b2Vec2.s_t0);// edge uses s_t0
      // DEBUG: b2Assert(edge.LengthSquared() > b2_epsilon_sq);
      b2Vec2.CrossVOne(edge,this.m_normals[_i8]).SelfNormalize();}// Compute the polygon centroid.
      b2PolygonShape.ComputeCentroid(this.m_vertices,m,this.m_centroid);return this;}/// Build vertices to represent an axis-aligned box or an oriented box.
      /// @param hx the half-width.
      /// @param hy the half-height.
      /// @param center the center of the box in local coordinates.
      /// @param angle the rotation of the box in local coordinates.
      },{key:"SetAsBox",value:function SetAsBox(hx,hy,center){var angle=arguments.length>3&&arguments[3]!==undefined?arguments[3]:0;this.m_count=4;this.m_vertices=b2Vec2.MakeArray(this.m_count);this.m_normals=b2Vec2.MakeArray(this.m_count);this.m_vertices[0].Set(-hx,-hy);this.m_vertices[1].Set(hx,-hy);this.m_vertices[2].Set(hx,hy);this.m_vertices[3].Set(-hx,hy);this.m_normals[0].Set(0,-1);this.m_normals[1].Set(1,0);this.m_normals[2].Set(0,1);this.m_normals[3].Set(-1,0);this.m_centroid.SetZero();if(center){this.m_centroid.Copy(center);var xf=new b2Transform();xf.SetPosition(center);xf.SetRotationAngle(angle);// Transform vertices and normals.
      for(var i=0;i<this.m_count;++i){b2Transform.MulXV(xf,this.m_vertices[i],this.m_vertices[i]);b2Rot.MulRV(xf.q,this.m_normals[i],this.m_normals[i]);}}return this;}},{key:"TestPoint",value:function TestPoint(xf,p){var pLocal=b2Transform.MulTXV(xf,p,b2PolygonShape.TestPoint_s_pLocal);for(var i=0;i<this.m_count;++i){var dot=b2Vec2.DotVV(this.m_normals[i],b2Vec2.SubVV(pLocal,this.m_vertices[i],b2Vec2.s_t0));if(dot>0){return false;}}return true;}},{key:"ComputeDistance",value:function ComputeDistance(xf,p,normal,childIndex){var pLocal=b2Transform.MulTXV(xf,p,b2PolygonShape.ComputeDistance_s_pLocal);var maxDistance=-b2_maxFloat;var normalForMaxDistance=b2PolygonShape.ComputeDistance_s_normalForMaxDistance.Copy(pLocal);for(var i=0;i<this.m_count;++i){var dot=b2Vec2.DotVV(this.m_normals[i],b2Vec2.SubVV(pLocal,this.m_vertices[i],b2Vec2.s_t0));if(dot>maxDistance){maxDistance=dot;normalForMaxDistance.Copy(this.m_normals[i]);}}if(maxDistance>0){var minDistance=b2PolygonShape.ComputeDistance_s_minDistance.Copy(normalForMaxDistance);var minDistance2=maxDistance*maxDistance;for(var _i9=0;_i9<this.m_count;++_i9){var distance=b2Vec2.SubVV(pLocal,this.m_vertices[_i9],b2PolygonShape.ComputeDistance_s_distance);var distance2=distance.LengthSquared();if(minDistance2>distance2){minDistance.Copy(distance);minDistance2=distance2;}}b2Rot.MulRV(xf.q,minDistance,normal);normal.Normalize();return Math.sqrt(minDistance2);}else {b2Rot.MulRV(xf.q,normalForMaxDistance,normal);return maxDistance;}}},{key:"RayCast",value:function RayCast(output,input,xf,childIndex){// Put the ray into the polygon's frame of reference.
      var p1=b2Transform.MulTXV(xf,input.p1,b2PolygonShape.RayCast_s_p1);var p2=b2Transform.MulTXV(xf,input.p2,b2PolygonShape.RayCast_s_p2);var d=b2Vec2.SubVV(p2,p1,b2PolygonShape.RayCast_s_d);var lower=0,upper=input.maxFraction;var index=-1;for(var i=0;i<this.m_count;++i){// p = p1 + a * d
      // dot(normal, p - v) = 0
      // dot(normal, p1 - v) + a * dot(normal, d) = 0
      var numerator=b2Vec2.DotVV(this.m_normals[i],b2Vec2.SubVV(this.m_vertices[i],p1,b2Vec2.s_t0));var denominator=b2Vec2.DotVV(this.m_normals[i],d);if(denominator===0){if(numerator<0){return false;}}else {// Note: we want this predicate without division:
      // lower < numerator / denominator, where denominator < 0
      // Since denominator < 0, we have to flip the inequality:
      // lower < numerator / denominator <==> denominator * lower > numerator.
      if(denominator<0&&numerator<lower*denominator){// Increase lower.
      // The segment enters this half-space.
      lower=numerator/denominator;index=i;}else if(denominator>0&&numerator<upper*denominator){// Decrease upper.
      // The segment exits this half-space.
      upper=numerator/denominator;}}// The use of epsilon here causes the assert on lower to trip
      // in some cases. Apparently the use of epsilon was to make edge
      // shapes work, but now those are handled separately.
      // if (upper < lower - b2_epsilon)
      if(upper<lower){return false;}}// DEBUG: b2Assert(0 <= lower && lower <= input.maxFraction);
      if(index>=0){output.fraction=lower;b2Rot.MulRV(xf.q,this.m_normals[index],output.normal);return true;}return false;}},{key:"ComputeAABB",value:function ComputeAABB(aabb,xf,childIndex){var lower=b2Transform.MulXV(xf,this.m_vertices[0],aabb.lowerBound);var upper=aabb.upperBound.Copy(lower);for(var i=0;i<this.m_count;++i){var v=b2Transform.MulXV(xf,this.m_vertices[i],b2PolygonShape.ComputeAABB_s_v);b2Vec2.MinV(v,lower,lower);b2Vec2.MaxV(v,upper,upper);}var r=this.m_radius;lower.SelfSubXY(r,r);upper.SelfAddXY(r,r);}},{key:"ComputeMass",value:function ComputeMass(massData,density){// Polygon mass, centroid, and inertia.
      // Let rho be the polygon density in mass per unit area.
      // Then:
      // mass = rho * int(dA)
      // centroid.x = (1/mass) * rho * int(x * dA)
      // centroid.y = (1/mass) * rho * int(y * dA)
      // I = rho * int((x*x + y*y) * dA)
      //
      // We can compute these integrals by summing all the integrals
      // for each triangle of the polygon. To evaluate the integral
      // for a single triangle, we make a change of variables to
      // the (u,v) coordinates of the triangle:
      // x = x0 + e1x * u + e2x * v
      // y = y0 + e1y * u + e2y * v
      // where 0 <= u && 0 <= v && u + v <= 1.
      //
      // We integrate u from [0,1-v] and then v from [0,1].
      // We also need to use the Jacobian of the transformation:
      // D = cross(e1, e2)
      //
      // Simplification: triangle centroid = (1/3) * (p1 + p2 + p3)
      //
      // The rest of the derivation is handled by computer algebra.
      // DEBUG: b2Assert(this.m_count >= 3);
      var center=b2PolygonShape.ComputeMass_s_center.SetZero();var area=0;var I=0;// s is the reference point for forming triangles.
      // It's location doesn't change the result (except for rounding error).
      var s=b2PolygonShape.ComputeMass_s_s.SetZero();// This code would put the reference point inside the polygon.
      for(var i=0;i<this.m_count;++i){s.SelfAdd(this.m_vertices[i]);}s.SelfMul(1/this.m_count);var k_inv3=1/3;for(var _i0=0;_i0<this.m_count;++_i0){// Triangle vertices.
      var e1=b2Vec2.SubVV(this.m_vertices[_i0],s,b2PolygonShape.ComputeMass_s_e1);var e2=b2Vec2.SubVV(this.m_vertices[(_i0+1)%this.m_count],s,b2PolygonShape.ComputeMass_s_e2);var D=b2Vec2.CrossVV(e1,e2);var triangleArea=0.5*D;area+=triangleArea;// Area weighted centroid
      center.SelfAdd(b2Vec2.MulSV(triangleArea*k_inv3,b2Vec2.AddVV(e1,e2,b2Vec2.s_t0),b2Vec2.s_t1));var ex1=e1.x;var ey1=e1.y;var ex2=e2.x;var ey2=e2.y;var intx2=ex1*ex1+ex2*ex1+ex2*ex2;var inty2=ey1*ey1+ey2*ey1+ey2*ey2;I+=0.25*k_inv3*D*(intx2+inty2);}// Total mass
      massData.mass=density*area;// Center of mass
      // DEBUG: b2Assert(area > b2_epsilon);
      center.SelfMul(1/area);b2Vec2.AddVV(center,s,massData.center);// Inertia tensor relative to the local origin (point s).
      massData.I=density*I;// Shift to center of mass then to original body origin.
      massData.I+=massData.mass*(b2Vec2.DotVV(massData.center,massData.center)-b2Vec2.DotVV(center,center));}},{key:"Validate",value:function Validate(){for(var i=0;i<this.m_count;++i){var i1=i;var i2=(i+1)%this.m_count;var p=this.m_vertices[i1];var e=b2Vec2.SubVV(this.m_vertices[i2],p,b2PolygonShape.Validate_s_e);for(var j=0;j<this.m_count;++j){if(j===i1||j===i2){continue;}var v=b2Vec2.SubVV(this.m_vertices[j],p,b2PolygonShape.Validate_s_v);var c=b2Vec2.CrossVV(e,v);if(c<0){return false;}}}return true;}},{key:"SetupDistanceProxy",value:function SetupDistanceProxy(proxy,index){proxy.m_vertices=this.m_vertices;proxy.m_count=this.m_count;proxy.m_radius=this.m_radius;}},{key:"ComputeSubmergedArea",value:function ComputeSubmergedArea(normal,offset,xf,c){// Transform plane into shape co-ordinates
      var normalL=b2Rot.MulTRV(xf.q,normal,b2PolygonShape.ComputeSubmergedArea_s_normalL);var offsetL=offset-b2Vec2.DotVV(normal,xf.p);var depths=[];var diveCount=0;var intoIndex=-1;var outoIndex=-1;var lastSubmerged=false;for(var _i1=0;_i1<this.m_count;++_i1){depths[_i1]=b2Vec2.DotVV(normalL,this.m_vertices[_i1])-offsetL;var isSubmerged=depths[_i1]<-b2_epsilon;if(_i1>0){if(isSubmerged){if(!lastSubmerged){intoIndex=_i1-1;diveCount++;}}else {if(lastSubmerged){outoIndex=_i1-1;diveCount++;}}}lastSubmerged=isSubmerged;}switch(diveCount){case 0:if(lastSubmerged){// Completely submerged
      var md=b2PolygonShape.ComputeSubmergedArea_s_md;this.ComputeMass(md,1);b2Transform.MulXV(xf,md.center,c);return md.mass;}else {// Completely dry
      return 0;}case 1:if(intoIndex===-1){intoIndex=this.m_count-1;}else {outoIndex=this.m_count-1;}break;}var intoIndex2=(intoIndex+1)%this.m_count;var outoIndex2=(outoIndex+1)%this.m_count;var intoLamdda=(0-depths[intoIndex])/(depths[intoIndex2]-depths[intoIndex]);var outoLamdda=(0-depths[outoIndex])/(depths[outoIndex2]-depths[outoIndex]);var intoVec=b2PolygonShape.ComputeSubmergedArea_s_intoVec.Set(this.m_vertices[intoIndex].x*(1-intoLamdda)+this.m_vertices[intoIndex2].x*intoLamdda,this.m_vertices[intoIndex].y*(1-intoLamdda)+this.m_vertices[intoIndex2].y*intoLamdda);var outoVec=b2PolygonShape.ComputeSubmergedArea_s_outoVec.Set(this.m_vertices[outoIndex].x*(1-outoLamdda)+this.m_vertices[outoIndex2].x*outoLamdda,this.m_vertices[outoIndex].y*(1-outoLamdda)+this.m_vertices[outoIndex2].y*outoLamdda);// Initialize accumulator
      var area=0;var center=b2PolygonShape.ComputeSubmergedArea_s_center.SetZero();var p2=this.m_vertices[intoIndex2];var p3;// An awkward loop from intoIndex2+1 to outIndex2
      var i=intoIndex2;while(i!==outoIndex2){i=(i+1)%this.m_count;if(i===outoIndex2){p3=outoVec;}else {p3=this.m_vertices[i];}var triangleArea=0.5*((p2.x-intoVec.x)*(p3.y-intoVec.y)-(p2.y-intoVec.y)*(p3.x-intoVec.x));area+=triangleArea;// Area weighted centroid
      center.x+=triangleArea*(intoVec.x+p2.x+p3.x)/3;center.y+=triangleArea*(intoVec.y+p2.y+p3.y)/3;p2=p3;}// Normalize and transform centroid
      center.SelfMul(1/area);b2Transform.MulXV(xf,center,c);return area;}},{key:"Dump",value:function Dump(log){log("    const shape: b2PolygonShape = new b2PolygonShape();\n");log("    const vs: b2Vec2[] = [];\n");for(var i=0;i<this.m_count;++i){log("    vs[%d] = new b2Vec2(%.15f, %.15f);\n",i,this.m_vertices[i].x,this.m_vertices[i].y);}log("    shape.Set(vs, %d);\n",this.m_count);}}],[{key:"ComputeCentroid",value:function ComputeCentroid(vs,count,out){// DEBUG: b2Assert(count >= 3);
      var c=out;c.SetZero();var area=0;// s is the reference point for forming triangles.
      // It's location doesn't change the result (except for rounding error).
      var pRef=b2PolygonShape.ComputeCentroid_s_pRef.SetZero();/*
            #if 0
                // This code would put the reference point inside the polygon.
                for (let i: number = 0; i < count; ++i) {
                  pRef.SelfAdd(vs[i]);
                }
                pRef.SelfMul(1 / count);
            #endif
                */var inv3=1/3;for(var i=0;i<count;++i){// Triangle vertices.
      var p1=pRef;var p2=vs[i];var p3=vs[(i+1)%count];var e1=b2Vec2.SubVV(p2,p1,b2PolygonShape.ComputeCentroid_s_e1);var e2=b2Vec2.SubVV(p3,p1,b2PolygonShape.ComputeCentroid_s_e2);var D=b2Vec2.CrossVV(e1,e2);var triangleArea=0.5*D;area+=triangleArea;// Area weighted centroid
      c.x+=triangleArea*inv3*(p1.x+p2.x+p3.x);c.y+=triangleArea*inv3*(p1.y+p2.y+p3.y);}// Centroid
      // DEBUG: b2Assert(area > b2_epsilon);
      c.SelfMul(1/area);return c;}}]);}(b2Shape);/// Create a convex hull from the given array of points.
      /// @warning the points may be re-ordered, even if they form a convex polygon
      /// @warning collinear points are handled but not removed. Collinear points
      /// may lead to poor stacking behavior.
      b2PolygonShape.Set_s_r=new b2Vec2();b2PolygonShape.Set_s_v=new b2Vec2();/// @see b2Shape::TestPoint
      b2PolygonShape.TestPoint_s_pLocal=new b2Vec2();// #if B2_ENABLE_PARTICLE
      /// @see b2Shape::ComputeDistance
      b2PolygonShape.ComputeDistance_s_pLocal=new b2Vec2();b2PolygonShape.ComputeDistance_s_normalForMaxDistance=new b2Vec2();b2PolygonShape.ComputeDistance_s_minDistance=new b2Vec2();b2PolygonShape.ComputeDistance_s_distance=new b2Vec2();// #endif
      /// Implement b2Shape.
      b2PolygonShape.RayCast_s_p1=new b2Vec2();b2PolygonShape.RayCast_s_p2=new b2Vec2();b2PolygonShape.RayCast_s_d=new b2Vec2();/// @see b2Shape::ComputeAABB
      b2PolygonShape.ComputeAABB_s_v=new b2Vec2();/// @see b2Shape::ComputeMass
      b2PolygonShape.ComputeMass_s_center=new b2Vec2();b2PolygonShape.ComputeMass_s_s=new b2Vec2();b2PolygonShape.ComputeMass_s_e1=new b2Vec2();b2PolygonShape.ComputeMass_s_e2=new b2Vec2();b2PolygonShape.Validate_s_e=new b2Vec2();b2PolygonShape.Validate_s_v=new b2Vec2();b2PolygonShape.ComputeSubmergedArea_s_normalL=new b2Vec2();b2PolygonShape.ComputeSubmergedArea_s_md=new b2MassData();b2PolygonShape.ComputeSubmergedArea_s_intoVec=new b2Vec2();b2PolygonShape.ComputeSubmergedArea_s_outoVec=new b2Vec2();b2PolygonShape.ComputeSubmergedArea_s_center=new b2Vec2();b2PolygonShape.ComputeCentroid_s_pRef=new b2Vec2();b2PolygonShape.ComputeCentroid_s_e1=new b2Vec2();b2PolygonShape.ComputeCentroid_s_e2=new b2Vec2();/*
        * Copyright (c) 2006-2010 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// A line segment (edge) shape. These can be connected in chains or loops
      /// to other edge shapes. The connectivity information is used to ensure
      /// correct contact normals.
      var b2EdgeShape=/*#__PURE__*/function(_b2Shape3){function b2EdgeShape(){var _this4;_classCallCheck(this,b2EdgeShape);_this4=_callSuper(this,b2EdgeShape,[exports.b2ShapeType.e_edgeShape,b2_polygonRadius]);_this4.m_vertex1=new b2Vec2();_this4.m_vertex2=new b2Vec2();_this4.m_vertex0=new b2Vec2();_this4.m_vertex3=new b2Vec2();_this4.m_hasVertex0=false;_this4.m_hasVertex3=false;return _this4;}/// Set this as an isolated edge.
      _inherits(b2EdgeShape,_b2Shape3);return _createClass(b2EdgeShape,[{key:"Set",value:function Set(v1,v2){this.m_vertex1.Copy(v1);this.m_vertex2.Copy(v2);this.m_hasVertex0=false;this.m_hasVertex3=false;return this;}/// Implement b2Shape.
      },{key:"Clone",value:function Clone(){return new b2EdgeShape().Copy(this);}},{key:"Copy",value:function Copy(other){_superPropGet(b2EdgeShape,"Copy",this,3)([other]);// DEBUG: b2Assert(other instanceof b2EdgeShape);
      this.m_vertex1.Copy(other.m_vertex1);this.m_vertex2.Copy(other.m_vertex2);this.m_vertex0.Copy(other.m_vertex0);this.m_vertex3.Copy(other.m_vertex3);this.m_hasVertex0=other.m_hasVertex0;this.m_hasVertex3=other.m_hasVertex3;return this;}/// @see b2Shape::GetChildCount
      },{key:"GetChildCount",value:function GetChildCount(){return 1;}/// @see b2Shape::TestPoint
      },{key:"TestPoint",value:function TestPoint(xf,p){return false;}},{key:"ComputeDistance",value:function ComputeDistance(xf,p,normal,childIndex){var v1=b2Transform.MulXV(xf,this.m_vertex1,b2EdgeShape.ComputeDistance_s_v1);var v2=b2Transform.MulXV(xf,this.m_vertex2,b2EdgeShape.ComputeDistance_s_v2);var d=b2Vec2.SubVV(p,v1,b2EdgeShape.ComputeDistance_s_d);var s=b2Vec2.SubVV(v2,v1,b2EdgeShape.ComputeDistance_s_s);var ds=b2Vec2.DotVV(d,s);if(ds>0){var s2=b2Vec2.DotVV(s,s);if(ds>s2){b2Vec2.SubVV(p,v2,d);}else {d.SelfMulSub(ds/s2,s);}}normal.Copy(d);return normal.Normalize();}},{key:"RayCast",value:function RayCast(output,input,xf,childIndex){// Put the ray into the edge's frame of reference.
      var p1=b2Transform.MulTXV(xf,input.p1,b2EdgeShape.RayCast_s_p1);var p2=b2Transform.MulTXV(xf,input.p2,b2EdgeShape.RayCast_s_p2);var d=b2Vec2.SubVV(p2,p1,b2EdgeShape.RayCast_s_d);var v1=this.m_vertex1;var v2=this.m_vertex2;var e=b2Vec2.SubVV(v2,v1,b2EdgeShape.RayCast_s_e);var normal=output.normal.Set(e.y,-e.x).SelfNormalize();// q = p1 + t * d
      // dot(normal, q - v1) = 0
      // dot(normal, p1 - v1) + t * dot(normal, d) = 0
      var numerator=b2Vec2.DotVV(normal,b2Vec2.SubVV(v1,p1,b2Vec2.s_t0));var denominator=b2Vec2.DotVV(normal,d);if(denominator===0){return false;}var t=numerator/denominator;if(t<0||input.maxFraction<t){return false;}var q=b2Vec2.AddVMulSV(p1,t,d,b2EdgeShape.RayCast_s_q);// q = v1 + s * r
      // s = dot(q - v1, r) / dot(r, r)
      var r=b2Vec2.SubVV(v2,v1,b2EdgeShape.RayCast_s_r);var rr=b2Vec2.DotVV(r,r);if(rr===0){return false;}var s=b2Vec2.DotVV(b2Vec2.SubVV(q,v1,b2Vec2.s_t0),r)/rr;if(s<0||1<s){return false;}output.fraction=t;b2Rot.MulRV(xf.q,output.normal,output.normal);if(numerator>0){output.normal.SelfNeg();}return true;}},{key:"ComputeAABB",value:function ComputeAABB(aabb,xf,childIndex){var v1=b2Transform.MulXV(xf,this.m_vertex1,b2EdgeShape.ComputeAABB_s_v1);var v2=b2Transform.MulXV(xf,this.m_vertex2,b2EdgeShape.ComputeAABB_s_v2);b2Vec2.MinV(v1,v2,aabb.lowerBound);b2Vec2.MaxV(v1,v2,aabb.upperBound);var r=this.m_radius;aabb.lowerBound.SelfSubXY(r,r);aabb.upperBound.SelfAddXY(r,r);}/// @see b2Shape::ComputeMass
      },{key:"ComputeMass",value:function ComputeMass(massData,density){massData.mass=0;b2Vec2.MidVV(this.m_vertex1,this.m_vertex2,massData.center);massData.I=0;}},{key:"SetupDistanceProxy",value:function SetupDistanceProxy(proxy,index){proxy.m_vertices=proxy.m_buffer;proxy.m_vertices[0].Copy(this.m_vertex1);proxy.m_vertices[1].Copy(this.m_vertex2);proxy.m_count=2;proxy.m_radius=this.m_radius;}},{key:"ComputeSubmergedArea",value:function ComputeSubmergedArea(normal,offset,xf,c){c.SetZero();return 0;}},{key:"Dump",value:function Dump(log){log("    const shape: b2EdgeShape = new b2EdgeShape();\n");log("    shape.m_radius = %.15f;\n",this.m_radius);log("    shape.m_vertex0.Set(%.15f, %.15f);\n",this.m_vertex0.x,this.m_vertex0.y);log("    shape.m_vertex1.Set(%.15f, %.15f);\n",this.m_vertex1.x,this.m_vertex1.y);log("    shape.m_vertex2.Set(%.15f, %.15f);\n",this.m_vertex2.x,this.m_vertex2.y);log("    shape.m_vertex3.Set(%.15f, %.15f);\n",this.m_vertex3.x,this.m_vertex3.y);log("    shape.m_hasVertex0 = %s;\n",this.m_hasVertex0);log("    shape.m_hasVertex3 = %s;\n",this.m_hasVertex3);}}]);}(b2Shape);// #if B2_ENABLE_PARTICLE
      /// @see b2Shape::ComputeDistance
      b2EdgeShape.ComputeDistance_s_v1=new b2Vec2();b2EdgeShape.ComputeDistance_s_v2=new b2Vec2();b2EdgeShape.ComputeDistance_s_d=new b2Vec2();b2EdgeShape.ComputeDistance_s_s=new b2Vec2();// #endif
      /// Implement b2Shape.
      // p = p1 + t * d
      // v = v1 + s * e
      // p1 + t * d = v1 + s * e
      // s * e - t * d = p1 - v1
      b2EdgeShape.RayCast_s_p1=new b2Vec2();b2EdgeShape.RayCast_s_p2=new b2Vec2();b2EdgeShape.RayCast_s_d=new b2Vec2();b2EdgeShape.RayCast_s_e=new b2Vec2();b2EdgeShape.RayCast_s_q=new b2Vec2();b2EdgeShape.RayCast_s_r=new b2Vec2();/// @see b2Shape::ComputeAABB
      b2EdgeShape.ComputeAABB_s_v1=new b2Vec2();b2EdgeShape.ComputeAABB_s_v2=new b2Vec2();/*
        * Copyright (c) 2006-2010 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// A chain shape is a free form sequence of line segments.
      /// The chain has two-sided collision, so you can use inside and outside collision.
      /// Therefore, you may use any winding order.
      /// Since there may be many vertices, they are allocated using b2Alloc.
      /// Connectivity information is used to create smooth collisions.
      /// WARNING: The chain will not collide properly if there are self-intersections.
      var b2ChainShape=/*#__PURE__*/function(_b2Shape4){function b2ChainShape(){var _this5;_classCallCheck(this,b2ChainShape);_this5=_callSuper(this,b2ChainShape,[exports.b2ShapeType.e_chainShape,b2_polygonRadius]);_this5.m_vertices=[];_this5.m_count=0;_this5.m_prevVertex=new b2Vec2();_this5.m_nextVertex=new b2Vec2();_this5.m_hasPrevVertex=false;_this5.m_hasNextVertex=false;return _this5;}_inherits(b2ChainShape,_b2Shape4);return _createClass(b2ChainShape,[{key:"CreateLoop",value:function CreateLoop(){for(var _len6=arguments.length,args=new Array(_len6),_key7=0;_key7<_len6;_key7++){args[_key7]=arguments[_key7];}if(typeof args[0][0]==="number"){var vertices=args[0];if(vertices.length%2!==0){throw new Error();}return this._CreateLoop(function(index){return {x:vertices[index*2],y:vertices[index*2+1]};},vertices.length/2);}else {var _vertices2=args[0];var count=args[1]||_vertices2.length;return this._CreateLoop(function(index){return _vertices2[index];},count);}}},{key:"_CreateLoop",value:function _CreateLoop(vertices,count){// DEBUG: b2Assert(count >= 3);
      if(count<3){return this;}// DEBUG: for (let i: number = 1; i < count; ++i) {
      // DEBUG:   const v1 = vertices[start + i - 1];
      // DEBUG:   const v2 = vertices[start + i];
      // DEBUG:   // If the code crashes here, it means your vertices are too close together.
      // DEBUG:   b2Assert(b2Vec2.DistanceSquaredVV(v1, v2) > b2_linearSlop * b2_linearSlop);
      // DEBUG: }
      this.m_count=count+1;this.m_vertices=b2Vec2.MakeArray(this.m_count);for(var i=0;i<count;++i){this.m_vertices[i].Copy(vertices(i));}this.m_vertices[count].Copy(this.m_vertices[0]);this.m_prevVertex.Copy(this.m_vertices[this.m_count-2]);this.m_nextVertex.Copy(this.m_vertices[1]);this.m_hasPrevVertex=true;this.m_hasNextVertex=true;return this;}},{key:"CreateChain",value:function CreateChain(){for(var _len7=arguments.length,args=new Array(_len7),_key8=0;_key8<_len7;_key8++){args[_key8]=arguments[_key8];}if(typeof args[0][0]==="number"){var vertices=args[0];if(vertices.length%2!==0){throw new Error();}return this._CreateChain(function(index){return {x:vertices[index*2],y:vertices[index*2+1]};},vertices.length/2);}else {var _vertices3=args[0];var count=args[1]||_vertices3.length;return this._CreateChain(function(index){return _vertices3[index];},count);}}},{key:"_CreateChain",value:function _CreateChain(vertices,count){// DEBUG: b2Assert(count >= 2);
      // DEBUG: for (let i: number = 1; i < count; ++i) {
      // DEBUG:   const v1 = vertices[start + i - 1];
      // DEBUG:   const v2 = vertices[start + i];
      // DEBUG:   // If the code crashes here, it means your vertices are too close together.
      // DEBUG:   b2Assert(b2Vec2.DistanceSquaredVV(v1, v2) > b2_linearSlop * b2_linearSlop);
      // DEBUG: }
      this.m_count=count;this.m_vertices=b2Vec2.MakeArray(count);for(var i=0;i<count;++i){this.m_vertices[i].Copy(vertices(i));}this.m_hasPrevVertex=false;this.m_hasNextVertex=false;this.m_prevVertex.SetZero();this.m_nextVertex.SetZero();return this;}/// Establish connectivity to a vertex that precedes the first vertex.
      /// Don't call this for loops.
      },{key:"SetPrevVertex",value:function SetPrevVertex(prevVertex){this.m_prevVertex.Copy(prevVertex);this.m_hasPrevVertex=true;return this;}/// Establish connectivity to a vertex that follows the last vertex.
      /// Don't call this for loops.
      },{key:"SetNextVertex",value:function SetNextVertex(nextVertex){this.m_nextVertex.Copy(nextVertex);this.m_hasNextVertex=true;return this;}/// Implement b2Shape. Vertices are cloned using b2Alloc.
      },{key:"Clone",value:function Clone(){return new b2ChainShape().Copy(this);}},{key:"Copy",value:function Copy(other){_superPropGet(b2ChainShape,"Copy",this,3)([other]);// DEBUG: b2Assert(other instanceof b2ChainShape);
      this._CreateChain(function(index){return other.m_vertices[index];},other.m_count);this.m_prevVertex.Copy(other.m_prevVertex);this.m_nextVertex.Copy(other.m_nextVertex);this.m_hasPrevVertex=other.m_hasPrevVertex;this.m_hasNextVertex=other.m_hasNextVertex;return this;}/// @see b2Shape::GetChildCount
      },{key:"GetChildCount",value:function GetChildCount(){// edge count = vertex count - 1
      return this.m_count-1;}/// Get a child edge.
      },{key:"GetChildEdge",value:function GetChildEdge(edge,index){// DEBUG: b2Assert(0 <= index && index < this.m_count - 1);
      edge.m_radius=this.m_radius;edge.m_vertex1.Copy(this.m_vertices[index]);edge.m_vertex2.Copy(this.m_vertices[index+1]);if(index>0){edge.m_vertex0.Copy(this.m_vertices[index-1]);edge.m_hasVertex0=true;}else {edge.m_vertex0.Copy(this.m_prevVertex);edge.m_hasVertex0=this.m_hasPrevVertex;}if(index<this.m_count-2){edge.m_vertex3.Copy(this.m_vertices[index+2]);edge.m_hasVertex3=true;}else {edge.m_vertex3.Copy(this.m_nextVertex);edge.m_hasVertex3=this.m_hasNextVertex;}}/// This always return false.
      /// @see b2Shape::TestPoint
      },{key:"TestPoint",value:function TestPoint(xf,p){return false;}},{key:"ComputeDistance",value:function ComputeDistance(xf,p,normal,childIndex){var edge=b2ChainShape.ComputeDistance_s_edgeShape;this.GetChildEdge(edge,childIndex);return edge.ComputeDistance(xf,p,normal,0);}},{key:"RayCast",value:function RayCast(output,input,xf,childIndex){// DEBUG: b2Assert(childIndex < this.m_count);
      var edgeShape=b2ChainShape.RayCast_s_edgeShape;edgeShape.m_vertex1.Copy(this.m_vertices[childIndex]);edgeShape.m_vertex2.Copy(this.m_vertices[(childIndex+1)%this.m_count]);return edgeShape.RayCast(output,input,xf,0);}},{key:"ComputeAABB",value:function ComputeAABB(aabb,xf,childIndex){// DEBUG: b2Assert(childIndex < this.m_count);
      var vertexi1=this.m_vertices[childIndex];var vertexi2=this.m_vertices[(childIndex+1)%this.m_count];var v1=b2Transform.MulXV(xf,vertexi1,b2ChainShape.ComputeAABB_s_v1);var v2=b2Transform.MulXV(xf,vertexi2,b2ChainShape.ComputeAABB_s_v2);b2Vec2.MinV(v1,v2,aabb.lowerBound);b2Vec2.MaxV(v1,v2,aabb.upperBound);}/// Chains have zero mass.
      /// @see b2Shape::ComputeMass
      },{key:"ComputeMass",value:function ComputeMass(massData,density){massData.mass=0;massData.center.SetZero();massData.I=0;}},{key:"SetupDistanceProxy",value:function SetupDistanceProxy(proxy,index){// DEBUG: b2Assert(0 <= index && index < this.m_count);
      proxy.m_vertices=proxy.m_buffer;proxy.m_vertices[0].Copy(this.m_vertices[index]);if(index+1<this.m_count){proxy.m_vertices[1].Copy(this.m_vertices[index+1]);}else {proxy.m_vertices[1].Copy(this.m_vertices[0]);}proxy.m_count=2;proxy.m_radius=this.m_radius;}},{key:"ComputeSubmergedArea",value:function ComputeSubmergedArea(normal,offset,xf,c){c.SetZero();return 0;}},{key:"Dump",value:function Dump(log){log("    const shape: b2ChainShape = new b2ChainShape();\n");log("    const vs: b2Vec2[] = [];\n");for(var i=0;i<this.m_count;++i){log("    vs[%d] = new bVec2(%.15f, %.15f);\n",i,this.m_vertices[i].x,this.m_vertices[i].y);}log("    shape.CreateChain(vs, %d);\n",this.m_count);log("    shape.m_prevVertex.Set(%.15f, %.15f);\n",this.m_prevVertex.x,this.m_prevVertex.y);log("    shape.m_nextVertex.Set(%.15f, %.15f);\n",this.m_nextVertex.x,this.m_nextVertex.y);log("    shape.m_hasPrevVertex = %s;\n",this.m_hasPrevVertex?"true":"false");log("    shape.m_hasNextVertex = %s;\n",this.m_hasNextVertex?"true":"false");}}]);}(b2Shape);// #if B2_ENABLE_PARTICLE
      /// @see b2Shape::ComputeDistance
      b2ChainShape.ComputeDistance_s_edgeShape=new b2EdgeShape();// #endif
      /// Implement b2Shape.
      b2ChainShape.RayCast_s_edgeShape=new b2EdgeShape();/// @see b2Shape::ComputeAABB
      b2ChainShape.ComputeAABB_s_v1=new b2Vec2();b2ChainShape.ComputeAABB_s_v2=new b2Vec2();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// This holds contact filtering data.
      var b2Filter=/*#__PURE__*/function(){function b2Filter(){_classCallCheck(this,b2Filter);/// The collision category bits. Normally you would just set one bit.
      this.categoryBits=0x0001;/// The collision mask bits. This states the categories that this
      /// shape would accept for collision.
      this.maskBits=0xFFFF;/// Collision groups allow a certain group of objects to never collide (negative)
      /// or always collide (positive). Zero means no collision group. Non-zero group
      /// filtering always wins against the mask bits.
      this.groupIndex=0;}return _createClass(b2Filter,[{key:"Clone",value:function Clone(){return new b2Filter().Copy(this);}},{key:"Copy",value:function Copy(other){// DEBUG: b2Assert(this !== other);
      this.categoryBits=other.categoryBits;this.maskBits=other.maskBits;this.groupIndex=other.groupIndex||0;return this;}}]);}();b2Filter.DEFAULT=new b2Filter();/// A fixture definition is used to create a fixture. This class defines an
      /// abstract fixture definition. You can reuse fixture definitions safely.
      var b2FixtureDef=/*#__PURE__*/_createClass(function b2FixtureDef(){_classCallCheck(this,b2FixtureDef);/// Use this to store application specific fixture data.
      this.userData=null;/// The friction coefficient, usually in the range [0,1].
      this.friction=0.2;/// The restitution (elasticity) usually in the range [0,1].
      this.restitution=0;/// The density, usually in kg/m^2.
      this.density=0;/// A sensor shape collects contact information but never generates a collision
      /// response.
      this.isSensor=false;/// Contact filtering data.
      this.filter=new b2Filter();});/// This proxy is used internally to connect fixtures to the broad-phase.
      var b2FixtureProxy=/*#__PURE__*/function(){function b2FixtureProxy(fixture,childIndex){_classCallCheck(this,b2FixtureProxy);this.aabb=new b2AABB();this.childIndex=0;this.fixture=fixture;this.childIndex=childIndex;this.fixture.m_shape.ComputeAABB(this.aabb,this.fixture.m_body.GetTransform(),childIndex);this.treeNode=this.fixture.m_body.m_world.m_contactManager.m_broadPhase.CreateProxy(this.aabb,this);}return _createClass(b2FixtureProxy,[{key:"Reset",value:function Reset(){this.fixture.m_body.m_world.m_contactManager.m_broadPhase.DestroyProxy(this.treeNode);}},{key:"Touch",value:function Touch(){this.fixture.m_body.m_world.m_contactManager.m_broadPhase.TouchProxy(this.treeNode);}},{key:"Synchronize",value:function Synchronize(transform1,transform2,displacement){if(transform1===transform2){this.fixture.m_shape.ComputeAABB(this.aabb,transform1,this.childIndex);this.fixture.m_body.m_world.m_contactManager.m_broadPhase.MoveProxy(this.treeNode,this.aabb,displacement);}else {// Compute an AABB that covers the swept shape (may miss some rotation effect).
      var aabb1=b2FixtureProxy.Synchronize_s_aabb1;var aabb2=b2FixtureProxy.Synchronize_s_aabb2;this.fixture.m_shape.ComputeAABB(aabb1,transform1,this.childIndex);this.fixture.m_shape.ComputeAABB(aabb2,transform2,this.childIndex);this.aabb.Combine2(aabb1,aabb2);this.fixture.m_body.m_world.m_contactManager.m_broadPhase.MoveProxy(this.treeNode,this.aabb,displacement);}}}]);}();b2FixtureProxy.Synchronize_s_aabb1=new b2AABB();b2FixtureProxy.Synchronize_s_aabb2=new b2AABB();/// A fixture is used to attach a shape to a body for collision detection. A fixture
      /// inherits its transform from its parent. Fixtures hold additional non-geometric data
      /// such as friction, collision filters, etc.
      /// Fixtures are created via b2Body::CreateFixture.
      /// @warning you cannot reuse fixtures.
      var b2Fixture=/*#__PURE__*/function(){function b2Fixture(body,def){_classCallCheck(this,b2Fixture);this.m_density=0;this.m_next=null;this.m_friction=0;this.m_restitution=0;this.m_proxies=[];this.m_filter=new b2Filter();this.m_isSensor=false;this.m_userData=null;this.m_body=body;this.m_shape=def.shape.Clone();this.m_userData=b2Maybe(def.userData,null);this.m_friction=b2Maybe(def.friction,0.2);this.m_restitution=b2Maybe(def.restitution,0);this.m_filter.Copy(b2Maybe(def.filter,b2Filter.DEFAULT));this.m_isSensor=b2Maybe(def.isSensor,false);this.m_density=b2Maybe(def.density,0);}return _createClass(b2Fixture,[{key:"m_proxyCount",get:function get(){return this.m_proxies.length;}},{key:"Reset",value:function Reset(){// The proxies must be destroyed before calling this.
      // DEBUG: b2Assert(this.m_proxyCount === 0);
      }/// Get the type of the child shape. You can use this to down cast to the concrete shape.
      /// @return the shape type.
      },{key:"GetType",value:function GetType(){return this.m_shape.GetType();}/// Get the child shape. You can modify the child shape, however you should not change the
      /// number of vertices because this will crash some collision caching mechanisms.
      /// Manipulating the shape may lead to non-physical behavior.
      },{key:"GetShape",value:function GetShape(){return this.m_shape;}/// Set if this fixture is a sensor.
      },{key:"SetSensor",value:function SetSensor(sensor){if(sensor!==this.m_isSensor){this.m_body.SetAwake(true);this.m_isSensor=sensor;}}/// Is this fixture a sensor (non-solid)?
      /// @return the true if the shape is a sensor.
      },{key:"IsSensor",value:function IsSensor(){return this.m_isSensor;}/// Set the contact filtering data. This will not update contacts until the next time
      /// step when either parent body is active and awake.
      /// This automatically calls Refilter.
      },{key:"SetFilterData",value:function SetFilterData(filter){this.m_filter.Copy(filter);this.Refilter();}/// Get the contact filtering data.
      },{key:"GetFilterData",value:function GetFilterData(){return this.m_filter;}/// Call this if you want to establish collision that was previously disabled by b2ContactFilter::ShouldCollide.
      },{key:"Refilter",value:function Refilter(){// Flag associated contacts for filtering.
      var edge=this.m_body.GetContactList();while(edge){var contact=edge.contact;var fixtureA=contact.GetFixtureA();var fixtureB=contact.GetFixtureB();if(fixtureA===this||fixtureB===this){contact.FlagForFiltering();}edge=edge.next;}// Touch each proxy so that new pairs may be created
      this.TouchProxies();}/// Get the parent body of this fixture. This is NULL if the fixture is not attached.
      /// @return the parent body.
      },{key:"GetBody",value:function GetBody(){return this.m_body;}/// Get the next fixture in the parent body's fixture list.
      /// @return the next shape.
      },{key:"GetNext",value:function GetNext(){return this.m_next;}/// Get the user data that was assigned in the fixture definition. Use this to
      /// store your application specific data.
      },{key:"GetUserData",value:function GetUserData(){return this.m_userData;}/// Set the user data. Use this to store your application specific data.
      },{key:"SetUserData",value:function SetUserData(data){this.m_userData=data;}/// Test a point for containment in this fixture.
      /// @param p a point in world coordinates.
      },{key:"TestPoint",value:function TestPoint(p){return this.m_shape.TestPoint(this.m_body.GetTransform(),p);}// #if B2_ENABLE_PARTICLE
      },{key:"ComputeDistance",value:function ComputeDistance(p,normal,childIndex){return this.m_shape.ComputeDistance(this.m_body.GetTransform(),p,normal,childIndex);}// #endif
      /// Cast a ray against this shape.
      /// @param output the ray-cast results.
      /// @param input the ray-cast input parameters.
      },{key:"RayCast",value:function RayCast(output,input,childIndex){return this.m_shape.RayCast(output,input,this.m_body.GetTransform(),childIndex);}/// Get the mass data for this fixture. The mass data is based on the density and
      /// the shape. The rotational inertia is about the shape's origin. This operation
      /// may be expensive.
      },{key:"GetMassData",value:function GetMassData(){var massData=arguments.length>0&&arguments[0]!==undefined?arguments[0]:new b2MassData();this.m_shape.ComputeMass(massData,this.m_density);return massData;}/// Set the density of this fixture. This will _not_ automatically adjust the mass
      /// of the body. You must call b2Body::ResetMassData to update the body's mass.
      },{key:"SetDensity",value:function SetDensity(density){this.m_density=density;}/// Get the density of this fixture.
      },{key:"GetDensity",value:function GetDensity(){return this.m_density;}/// Get the coefficient of friction.
      },{key:"GetFriction",value:function GetFriction(){return this.m_friction;}/// Set the coefficient of friction. This will _not_ change the friction of
      /// existing contacts.
      },{key:"SetFriction",value:function SetFriction(friction){this.m_friction=friction;}/// Get the coefficient of restitution.
      },{key:"GetRestitution",value:function GetRestitution(){return this.m_restitution;}/// Set the coefficient of restitution. This will _not_ change the restitution of
      /// existing contacts.
      },{key:"SetRestitution",value:function SetRestitution(restitution){this.m_restitution=restitution;}/// Get the fixture's AABB. This AABB may be enlarge and/or stale.
      /// If you need a more accurate AABB, compute it using the shape and
      /// the body transform.
      },{key:"GetAABB",value:function GetAABB(childIndex){// DEBUG: b2Assert(0 <= childIndex && childIndex < this.m_proxyCount);
      return this.m_proxies[childIndex].aabb;}/// Dump this fixture to the log file.
      },{key:"Dump",value:function Dump(log,bodyIndex){log("    const fd: b2FixtureDef = new b2FixtureDef();\n");log("    fd.friction = %.15f;\n",this.m_friction);log("    fd.restitution = %.15f;\n",this.m_restitution);log("    fd.density = %.15f;\n",this.m_density);log("    fd.isSensor = %s;\n",this.m_isSensor?"true":"false");log("    fd.filter.categoryBits = %d;\n",this.m_filter.categoryBits);log("    fd.filter.maskBits = %d;\n",this.m_filter.maskBits);log("    fd.filter.groupIndex = %d;\n",this.m_filter.groupIndex);this.m_shape.Dump(log);log("\n");log("    fd.shape = shape;\n");log("\n");log("    bodies[%d].CreateFixture(fd);\n",bodyIndex);}// These support body activation/deactivation.
      },{key:"CreateProxies",value:function CreateProxies(){if(this.m_proxies.length!==0){throw new Error();}// Create proxies in the broad-phase.
      for(var i=0;i<this.m_shape.GetChildCount();++i){this.m_proxies[i]=new b2FixtureProxy(this,i);}}},{key:"DestroyProxies",value:function DestroyProxies(){// Destroy proxies in the broad-phase.
      var _iterator=_createForOfIteratorHelper(this.m_proxies),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var proxy=_step.value;proxy.Reset();}}catch(err){_iterator.e(err);}finally{_iterator.f();}this.m_proxies.length=0;}},{key:"TouchProxies",value:function TouchProxies(){var _iterator2=_createForOfIteratorHelper(this.m_proxies),_step2;try{for(_iterator2.s();!(_step2=_iterator2.n()).done;){var proxy=_step2.value;proxy.Touch();}}catch(err){_iterator2.e(err);}finally{_iterator2.f();}}},{key:"SynchronizeProxies",value:function SynchronizeProxies(transform1,transform2,displacement){var _iterator3=_createForOfIteratorHelper(this.m_proxies),_step3;try{for(_iterator3.s();!(_step3=_iterator3.n()).done;){var proxy=_step3.value;proxy.Synchronize(transform1,transform2,displacement);}}catch(err){_iterator3.e(err);}finally{_iterator3.f();}}}]);}();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */(function(b2BodyType){b2BodyType[b2BodyType["b2_unknown"]=-1]="b2_unknown";b2BodyType[b2BodyType["b2_staticBody"]=0]="b2_staticBody";b2BodyType[b2BodyType["b2_kinematicBody"]=1]="b2_kinematicBody";b2BodyType[b2BodyType["b2_dynamicBody"]=2]="b2_dynamicBody";// TODO_ERIN
      // b2_bulletBody = 3
      })(exports.b2BodyType||(exports.b2BodyType={}));/// A body definition holds all the data needed to construct a rigid body.
      /// You can safely re-use body definitions. Shapes are added to a body after construction.
      var b2BodyDef=/*#__PURE__*/_createClass(function b2BodyDef(){_classCallCheck(this,b2BodyDef);/// The body type: static, kinematic, or dynamic.
      /// Note: if a dynamic body would have zero mass, the mass is set to one.
      this.type=exports.b2BodyType.b2_staticBody;/// The world position of the body. Avoid creating bodies at the origin
      /// since this can lead to many overlapping shapes.
      this.position=new b2Vec2(0,0);/// The world angle of the body in radians.
      this.angle=0;/// The linear velocity of the body's origin in world co-ordinates.
      this.linearVelocity=new b2Vec2(0,0);/// The angular velocity of the body.
      this.angularVelocity=0;/// Linear damping is use to reduce the linear velocity. The damping parameter
      /// can be larger than 1.0f but the damping effect becomes sensitive to the
      /// time step when the damping parameter is large.
      this.linearDamping=0;/// Angular damping is use to reduce the angular velocity. The damping parameter
      /// can be larger than 1.0f but the damping effect becomes sensitive to the
      /// time step when the damping parameter is large.
      this.angularDamping=0;/// Set this flag to false if this body should never fall asleep. Note that
      /// this increases CPU usage.
      this.allowSleep=true;/// Is this body initially awake or sleeping?
      this.awake=true;/// Should this body be prevented from rotating? Useful for characters.
      this.fixedRotation=false;/// Is this a fast moving body that should be prevented from tunneling through
      /// other moving bodies? Note that all bodies are prevented from tunneling through
      /// kinematic and static bodies. This setting is only considered on dynamic bodies.
      /// @warning You should use this flag sparingly since it increases processing time.
      this.bullet=false;/// Does this body start out active?
      this.active=true;/// Use this to store application specific body data.
      this.userData=null;/// Scale the gravity applied to this body.
      this.gravityScale=1;});/// A rigid body. These are created via b2World::CreateBody.
      var b2Body=/*#__PURE__*/function(){// #endif
      function b2Body(bd,world){_classCallCheck(this,b2Body);this.m_type=exports.b2BodyType.b2_staticBody;this.m_islandFlag=false;this.m_awakeFlag=false;this.m_autoSleepFlag=false;this.m_bulletFlag=false;this.m_fixedRotationFlag=false;this.m_activeFlag=false;this.m_toiFlag=false;this.m_islandIndex=0;this.m_xf=new b2Transform();// the body origin transform
      // #if B2_ENABLE_PARTICLE
      this.m_xf0=new b2Transform();// #endif
      this.m_sweep=new b2Sweep();// the swept motion for CCD
      this.m_linearVelocity=new b2Vec2();this.m_angularVelocity=0;this.m_force=new b2Vec2();this.m_torque=0;this.m_prev=null;this.m_next=null;this.m_fixtureList=null;this.m_fixtureCount=0;this.m_jointList=null;this.m_contactList=null;this.m_mass=1;this.m_invMass=1;// Rotational inertia about the center of mass.
      this.m_I=0;this.m_invI=0;this.m_linearDamping=0;this.m_angularDamping=0;this.m_gravityScale=1;this.m_sleepTime=0;this.m_userData=null;// #if B2_ENABLE_CONTROLLER
      this.m_controllerList=null;this.m_controllerCount=0;this.m_bulletFlag=b2Maybe(bd.bullet,false);this.m_fixedRotationFlag=b2Maybe(bd.fixedRotation,false);this.m_autoSleepFlag=b2Maybe(bd.allowSleep,true);this.m_awakeFlag=b2Maybe(bd.awake,true);this.m_activeFlag=b2Maybe(bd.active,true);this.m_world=world;this.m_xf.p.Copy(b2Maybe(bd.position,b2Vec2.ZERO));// DEBUG: b2Assert(this.m_xf.p.IsValid());
      this.m_xf.q.SetAngle(b2Maybe(bd.angle,0));// DEBUG: b2Assert(b2IsValid(this.m_xf.q.GetAngle()));
      // #if B2_ENABLE_PARTICLE
      this.m_xf0.Copy(this.m_xf);// #endif
      this.m_sweep.localCenter.SetZero();this.m_sweep.c0.Copy(this.m_xf.p);this.m_sweep.c.Copy(this.m_xf.p);this.m_sweep.a0=this.m_sweep.a=this.m_xf.q.GetAngle();this.m_sweep.alpha0=0;this.m_linearVelocity.Copy(b2Maybe(bd.linearVelocity,b2Vec2.ZERO));// DEBUG: b2Assert(this.m_linearVelocity.IsValid());
      this.m_angularVelocity=b2Maybe(bd.angularVelocity,0);// DEBUG: b2Assert(b2IsValid(this.m_angularVelocity));
      this.m_linearDamping=b2Maybe(bd.linearDamping,0);this.m_angularDamping=b2Maybe(bd.angularDamping,0);this.m_gravityScale=b2Maybe(bd.gravityScale,1);// DEBUG: b2Assert(b2IsValid(this.m_gravityScale) && this.m_gravityScale >= 0);
      // DEBUG: b2Assert(b2IsValid(this.m_angularDamping) && this.m_angularDamping >= 0);
      // DEBUG: b2Assert(b2IsValid(this.m_linearDamping) && this.m_linearDamping >= 0);
      this.m_force.SetZero();this.m_torque=0;this.m_sleepTime=0;this.m_type=b2Maybe(bd.type,exports.b2BodyType.b2_staticBody);if(bd.type===exports.b2BodyType.b2_dynamicBody){this.m_mass=1;this.m_invMass=1;}else {this.m_mass=0;this.m_invMass=0;}this.m_I=0;this.m_invI=0;this.m_userData=bd.userData;this.m_fixtureList=null;this.m_fixtureCount=0;// #if B2_ENABLE_CONTROLLER
      this.m_controllerList=null;this.m_controllerCount=0;// #endif
      }return _createClass(b2Body,[{key:"CreateFixture",value:function CreateFixture(a){var b=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;if(a instanceof b2Shape){return this.CreateFixtureShapeDensity(a,b);}else {return this.CreateFixtureDef(a);}}/// Creates a fixture and attach it to this body. Use this function if you need
      /// to set some fixture parameters, like friction. Otherwise you can create the
      /// fixture directly from a shape.
      /// If the density is non-zero, this function automatically updates the mass of the body.
      /// Contacts are not created until the next time step.
      /// @param def the fixture definition.
      /// @warning This function is locked during callbacks.
      },{key:"CreateFixtureDef",value:function CreateFixtureDef(def){if(this.m_world.IsLocked()){throw new Error();}var fixture=new b2Fixture(this,def);if(this.m_activeFlag){fixture.CreateProxies();}fixture.m_next=this.m_fixtureList;this.m_fixtureList=fixture;++this.m_fixtureCount;// fixture.m_body = this;
      // Adjust mass properties if needed.
      if(fixture.m_density>0){this.ResetMassData();}// Let the world know we have a new fixture. This will cause new contacts
      // to be created at the beginning of the next time step.
      this.m_world.m_newFixture=true;return fixture;}},{key:"CreateFixtureShapeDensity",value:function CreateFixtureShapeDensity(shape){var density=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var def=b2Body.CreateFixtureShapeDensity_s_def;def.shape=shape;def.density=density;return this.CreateFixtureDef(def);}/// Destroy a fixture. This removes the fixture from the broad-phase and
      /// destroys all contacts associated with this fixture. This will
      /// automatically adjust the mass of the body if the body is dynamic and the
      /// fixture has positive density.
      /// All fixtures attached to a body are implicitly destroyed when the body is destroyed.
      /// @param fixture the fixture to be removed.
      /// @warning This function is locked during callbacks.
      },{key:"DestroyFixture",value:function DestroyFixture(fixture){if(this.m_world.IsLocked()){throw new Error();}// DEBUG: b2Assert(fixture.m_body === this);
      // Remove the fixture from this body's singly linked list.
      // DEBUG: b2Assert(this.m_fixtureCount > 0);
      var node=this.m_fixtureList;var ppF=null;// DEBUG: let found: boolean = false;
      while(node!==null){if(node===fixture){if(ppF){ppF.m_next=fixture.m_next;}else {this.m_fixtureList=fixture.m_next;}// DEBUG: found = true;
      break;}ppF=node;node=node.m_next;}// You tried to remove a shape that is not attached to this body.
      // DEBUG: b2Assert(found);
      // Destroy any contacts associated with the fixture.
      var edge=this.m_contactList;while(edge){var c=edge.contact;edge=edge.next;var fixtureA=c.GetFixtureA();var fixtureB=c.GetFixtureB();if(fixture===fixtureA||fixture===fixtureB){// This destroys the contact and removes it from
      // this body's contact list.
      this.m_world.m_contactManager.Destroy(c);}}if(this.m_activeFlag){fixture.DestroyProxies();}// fixture.m_body = null;
      fixture.m_next=null;fixture.Reset();--this.m_fixtureCount;// Reset the mass data.
      this.ResetMassData();}/// Set the position of the body's origin and rotation.
      /// This breaks any contacts and wakes the other bodies.
      /// Manipulating a body's transform may cause non-physical behavior.
      /// @param position the world position of the body's local origin.
      /// @param angle the world rotation in radians.
      },{key:"SetTransformVec",value:function SetTransformVec(position,angle){this.SetTransformXY(position.x,position.y,angle);}},{key:"SetTransformXY",value:function SetTransformXY(x,y,angle){if(this.m_world.IsLocked()){throw new Error();}this.m_xf.q.SetAngle(angle);this.m_xf.p.Set(x,y);// #if B2_ENABLE_PARTICLE
      this.m_xf0.Copy(this.m_xf);// #endif
      b2Transform.MulXV(this.m_xf,this.m_sweep.localCenter,this.m_sweep.c);this.m_sweep.a=angle;this.m_sweep.c0.Copy(this.m_sweep.c);this.m_sweep.a0=angle;for(var f=this.m_fixtureList;f;f=f.m_next){f.SynchronizeProxies(this.m_xf,this.m_xf,b2Vec2.ZERO);}this.m_world.m_contactManager.FindNewContacts();}},{key:"SetTransform",value:function SetTransform(xf){this.SetTransformVec(xf.p,xf.GetAngle());}/// Get the body transform for the body's origin.
      /// @return the world transform of the body's origin.
      },{key:"GetTransform",value:function GetTransform(){return this.m_xf;}/// Get the world body origin position.
      /// @return the world position of the body's origin.
      },{key:"GetPosition",value:function GetPosition(){return this.m_xf.p;}},{key:"SetPosition",value:function SetPosition(position){this.SetTransformVec(position,this.GetAngle());}},{key:"SetPositionXY",value:function SetPositionXY(x,y){this.SetTransformXY(x,y,this.GetAngle());}/// Get the angle in radians.
      /// @return the current world rotation angle in radians.
      },{key:"GetAngle",value:function GetAngle(){return this.m_sweep.a;}},{key:"SetAngle",value:function SetAngle(angle){this.SetTransformVec(this.GetPosition(),angle);}/// Get the world position of the center of mass.
      },{key:"GetWorldCenter",value:function GetWorldCenter(){return this.m_sweep.c;}/// Get the local position of the center of mass.
      },{key:"GetLocalCenter",value:function GetLocalCenter(){return this.m_sweep.localCenter;}/// Set the linear velocity of the center of mass.
      /// @param v the new linear velocity of the center of mass.
      },{key:"SetLinearVelocity",value:function SetLinearVelocity(v){if(this.m_type===exports.b2BodyType.b2_staticBody){return;}if(b2Vec2.DotVV(v,v)>0){this.SetAwake(true);}this.m_linearVelocity.Copy(v);}/// Get the linear velocity of the center of mass.
      /// @return the linear velocity of the center of mass.
      },{key:"GetLinearVelocity",value:function GetLinearVelocity(){return this.m_linearVelocity;}/// Set the angular velocity.
      /// @param omega the new angular velocity in radians/second.
      },{key:"SetAngularVelocity",value:function SetAngularVelocity(w){if(this.m_type===exports.b2BodyType.b2_staticBody){return;}if(w*w>0){this.SetAwake(true);}this.m_angularVelocity=w;}/// Get the angular velocity.
      /// @return the angular velocity in radians/second.
      },{key:"GetAngularVelocity",value:function GetAngularVelocity(){return this.m_angularVelocity;}},{key:"GetDefinition",value:function GetDefinition(bd){bd.type=this.GetType();bd.allowSleep=this.m_autoSleepFlag;bd.angle=this.GetAngle();bd.angularDamping=this.m_angularDamping;bd.gravityScale=this.m_gravityScale;bd.angularVelocity=this.m_angularVelocity;bd.fixedRotation=this.m_fixedRotationFlag;bd.bullet=this.m_bulletFlag;bd.awake=this.m_awakeFlag;bd.linearDamping=this.m_linearDamping;bd.linearVelocity.Copy(this.GetLinearVelocity());bd.position.Copy(this.GetPosition());bd.userData=this.GetUserData();return bd;}/// Apply a force at a world point. If the force is not
      /// applied at the center of mass, it will generate a torque and
      /// affect the angular velocity. This wakes up the body.
      /// @param force the world force vector, usually in Newtons (N).
      /// @param point the world position of the point of application.
      /// @param wake also wake up the body
      },{key:"ApplyForce",value:function ApplyForce(force,point){var wake=arguments.length>2&&arguments[2]!==undefined?arguments[2]:true;if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}if(wake&&!this.m_awakeFlag){this.SetAwake(true);}// Don't accumulate a force if the body is sleeping.
      if(this.m_awakeFlag){this.m_force.x+=force.x;this.m_force.y+=force.y;this.m_torque+=(point.x-this.m_sweep.c.x)*force.y-(point.y-this.m_sweep.c.y)*force.x;}}/// Apply a force to the center of mass. This wakes up the body.
      /// @param force the world force vector, usually in Newtons (N).
      /// @param wake also wake up the body
      },{key:"ApplyForceToCenter",value:function ApplyForceToCenter(force){var wake=arguments.length>1&&arguments[1]!==undefined?arguments[1]:true;if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}if(wake&&!this.m_awakeFlag){this.SetAwake(true);}// Don't accumulate a force if the body is sleeping.
      if(this.m_awakeFlag){this.m_force.x+=force.x;this.m_force.y+=force.y;}}/// Apply a torque. This affects the angular velocity
      /// without affecting the linear velocity of the center of mass.
      /// @param torque about the z-axis (out of the screen), usually in N-m.
      /// @param wake also wake up the body
      },{key:"ApplyTorque",value:function ApplyTorque(torque){var wake=arguments.length>1&&arguments[1]!==undefined?arguments[1]:true;if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}if(wake&&!this.m_awakeFlag){this.SetAwake(true);}// Don't accumulate a force if the body is sleeping.
      if(this.m_awakeFlag){this.m_torque+=torque;}}/// Apply an impulse at a point. This immediately modifies the velocity.
      /// It also modifies the angular velocity if the point of application
      /// is not at the center of mass. This wakes up the body.
      /// @param impulse the world impulse vector, usually in N-seconds or kg-m/s.
      /// @param point the world position of the point of application.
      /// @param wake also wake up the body
      },{key:"ApplyLinearImpulse",value:function ApplyLinearImpulse(impulse,point){var wake=arguments.length>2&&arguments[2]!==undefined?arguments[2]:true;if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}if(wake&&!this.m_awakeFlag){this.SetAwake(true);}// Don't accumulate a force if the body is sleeping.
      if(this.m_awakeFlag){this.m_linearVelocity.x+=this.m_invMass*impulse.x;this.m_linearVelocity.y+=this.m_invMass*impulse.y;this.m_angularVelocity+=this.m_invI*((point.x-this.m_sweep.c.x)*impulse.y-(point.y-this.m_sweep.c.y)*impulse.x);}}/// Apply an impulse at the center of gravity. This immediately modifies the velocity.
      /// @param impulse the world impulse vector, usually in N-seconds or kg-m/s.
      /// @param wake also wake up the body
      },{key:"ApplyLinearImpulseToCenter",value:function ApplyLinearImpulseToCenter(impulse){var wake=arguments.length>1&&arguments[1]!==undefined?arguments[1]:true;if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}if(wake&&!this.m_awakeFlag){this.SetAwake(true);}// Don't accumulate a force if the body is sleeping.
      if(this.m_awakeFlag){this.m_linearVelocity.x+=this.m_invMass*impulse.x;this.m_linearVelocity.y+=this.m_invMass*impulse.y;}}/// Apply an angular impulse.
      /// @param impulse the angular impulse in units of kg*m*m/s
      /// @param wake also wake up the body
      },{key:"ApplyAngularImpulse",value:function ApplyAngularImpulse(impulse){var wake=arguments.length>1&&arguments[1]!==undefined?arguments[1]:true;if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}if(wake&&!this.m_awakeFlag){this.SetAwake(true);}// Don't accumulate a force if the body is sleeping.
      if(this.m_awakeFlag){this.m_angularVelocity+=this.m_invI*impulse;}}/// Get the total mass of the body.
      /// @return the mass, usually in kilograms (kg).
      },{key:"GetMass",value:function GetMass(){return this.m_mass;}/// Get the rotational inertia of the body about the local origin.
      /// @return the rotational inertia, usually in kg-m^2.
      },{key:"GetInertia",value:function GetInertia(){return this.m_I+this.m_mass*b2Vec2.DotVV(this.m_sweep.localCenter,this.m_sweep.localCenter);}/// Get the mass data of the body.
      /// @return a struct containing the mass, inertia and center of the body.
      },{key:"GetMassData",value:function GetMassData(data){data.mass=this.m_mass;data.I=this.m_I+this.m_mass*b2Vec2.DotVV(this.m_sweep.localCenter,this.m_sweep.localCenter);data.center.Copy(this.m_sweep.localCenter);return data;}},{key:"SetMassData",value:function SetMassData(massData){if(this.m_world.IsLocked()){throw new Error();}if(this.m_type!==exports.b2BodyType.b2_dynamicBody){return;}this.m_invMass=0;this.m_I=0;this.m_invI=0;this.m_mass=massData.mass;if(this.m_mass<=0){this.m_mass=1;}this.m_invMass=1/this.m_mass;if(massData.I>0&&!this.m_fixedRotationFlag){this.m_I=massData.I-this.m_mass*b2Vec2.DotVV(massData.center,massData.center);// DEBUG: b2Assert(this.m_I > 0);
      this.m_invI=1/this.m_I;}// Move center of mass.
      var oldCenter=b2Body.SetMassData_s_oldCenter.Copy(this.m_sweep.c);this.m_sweep.localCenter.Copy(massData.center);b2Transform.MulXV(this.m_xf,this.m_sweep.localCenter,this.m_sweep.c);this.m_sweep.c0.Copy(this.m_sweep.c);// Update center of mass velocity.
      b2Vec2.AddVCrossSV(this.m_linearVelocity,this.m_angularVelocity,b2Vec2.SubVV(this.m_sweep.c,oldCenter,b2Vec2.s_t0),this.m_linearVelocity);}},{key:"ResetMassData",value:function ResetMassData(){// Compute mass data from shapes. Each shape has its own density.
      this.m_mass=0;this.m_invMass=0;this.m_I=0;this.m_invI=0;this.m_sweep.localCenter.SetZero();// Static and kinematic bodies have zero mass.
      if(this.m_type===exports.b2BodyType.b2_staticBody||this.m_type===exports.b2BodyType.b2_kinematicBody){this.m_sweep.c0.Copy(this.m_xf.p);this.m_sweep.c.Copy(this.m_xf.p);this.m_sweep.a0=this.m_sweep.a;return;}// DEBUG: b2Assert(this.m_type === b2BodyType.b2_dynamicBody);
      // Accumulate mass over all fixtures.
      var localCenter=b2Body.ResetMassData_s_localCenter.SetZero();for(var f=this.m_fixtureList;f;f=f.m_next){if(f.m_density===0){continue;}var massData=f.GetMassData(b2Body.ResetMassData_s_massData);this.m_mass+=massData.mass;localCenter.x+=massData.center.x*massData.mass;localCenter.y+=massData.center.y*massData.mass;this.m_I+=massData.I;}// Compute center of mass.
      if(this.m_mass>0){this.m_invMass=1/this.m_mass;localCenter.x*=this.m_invMass;localCenter.y*=this.m_invMass;}else {// Force all dynamic bodies to have a positive mass.
      this.m_mass=1;this.m_invMass=1;}if(this.m_I>0&&!this.m_fixedRotationFlag){// Center the inertia about the center of mass.
      this.m_I-=this.m_mass*b2Vec2.DotVV(localCenter,localCenter);// DEBUG: b2Assert(this.m_I > 0);
      this.m_invI=1/this.m_I;}else {this.m_I=0;this.m_invI=0;}// Move center of mass.
      var oldCenter=b2Body.ResetMassData_s_oldCenter.Copy(this.m_sweep.c);this.m_sweep.localCenter.Copy(localCenter);b2Transform.MulXV(this.m_xf,this.m_sweep.localCenter,this.m_sweep.c);this.m_sweep.c0.Copy(this.m_sweep.c);// Update center of mass velocity.
      b2Vec2.AddVCrossSV(this.m_linearVelocity,this.m_angularVelocity,b2Vec2.SubVV(this.m_sweep.c,oldCenter,b2Vec2.s_t0),this.m_linearVelocity);}/// Get the world coordinates of a point given the local coordinates.
      /// @param localPoint a point on the body measured relative the the body's origin.
      /// @return the same point expressed in world coordinates.
      },{key:"GetWorldPoint",value:function GetWorldPoint(localPoint,out){return b2Transform.MulXV(this.m_xf,localPoint,out);}/// Get the world coordinates of a vector given the local coordinates.
      /// @param localVector a vector fixed in the body.
      /// @return the same vector expressed in world coordinates.
      },{key:"GetWorldVector",value:function GetWorldVector(localVector,out){return b2Rot.MulRV(this.m_xf.q,localVector,out);}/// Gets a local point relative to the body's origin given a world point.
      /// @param a point in world coordinates.
      /// @return the corresponding local point relative to the body's origin.
      },{key:"GetLocalPoint",value:function GetLocalPoint(worldPoint,out){return b2Transform.MulTXV(this.m_xf,worldPoint,out);}/// Gets a local vector given a world vector.
      /// @param a vector in world coordinates.
      /// @return the corresponding local vector.
      },{key:"GetLocalVector",value:function GetLocalVector(worldVector,out){return b2Rot.MulTRV(this.m_xf.q,worldVector,out);}/// Get the world linear velocity of a world point attached to this body.
      /// @param a point in world coordinates.
      /// @return the world velocity of a point.
      },{key:"GetLinearVelocityFromWorldPoint",value:function GetLinearVelocityFromWorldPoint(worldPoint,out){return b2Vec2.AddVCrossSV(this.m_linearVelocity,this.m_angularVelocity,b2Vec2.SubVV(worldPoint,this.m_sweep.c,b2Vec2.s_t0),out);}/// Get the world velocity of a local point.
      /// @param a point in local coordinates.
      /// @return the world velocity of a point.
      },{key:"GetLinearVelocityFromLocalPoint",value:function GetLinearVelocityFromLocalPoint(localPoint,out){return this.GetLinearVelocityFromWorldPoint(this.GetWorldPoint(localPoint,out),out);}/// Get the linear damping of the body.
      },{key:"GetLinearDamping",value:function GetLinearDamping(){return this.m_linearDamping;}/// Set the linear damping of the body.
      },{key:"SetLinearDamping",value:function SetLinearDamping(linearDamping){this.m_linearDamping=linearDamping;}/// Get the angular damping of the body.
      },{key:"GetAngularDamping",value:function GetAngularDamping(){return this.m_angularDamping;}/// Set the angular damping of the body.
      },{key:"SetAngularDamping",value:function SetAngularDamping(angularDamping){this.m_angularDamping=angularDamping;}/// Get the gravity scale of the body.
      },{key:"GetGravityScale",value:function GetGravityScale(){return this.m_gravityScale;}/// Set the gravity scale of the body.
      },{key:"SetGravityScale",value:function SetGravityScale(scale){this.m_gravityScale=scale;}/// Set the type of this body. This may alter the mass and velocity.
      },{key:"SetType",value:function SetType(type){if(this.m_world.IsLocked()){throw new Error();}if(this.m_type===type){return;}this.m_type=type;this.ResetMassData();if(this.m_type===exports.b2BodyType.b2_staticBody){this.m_linearVelocity.SetZero();this.m_angularVelocity=0;this.m_sweep.a0=this.m_sweep.a;this.m_sweep.c0.Copy(this.m_sweep.c);this.SynchronizeFixtures();}this.SetAwake(true);this.m_force.SetZero();this.m_torque=0;// Delete the attached contacts.
      var ce=this.m_contactList;while(ce){var ce0=ce;ce=ce.next;this.m_world.m_contactManager.Destroy(ce0.contact);}this.m_contactList=null;// Touch the proxies so that new contacts will be created (when appropriate)
      for(var f=this.m_fixtureList;f;f=f.m_next){f.TouchProxies();}}/// Get the type of this body.
      },{key:"GetType",value:function GetType(){return this.m_type;}/// Should this body be treated like a bullet for continuous collision detection?
      },{key:"SetBullet",value:function SetBullet(flag){this.m_bulletFlag=flag;}/// Is this body treated like a bullet for continuous collision detection?
      },{key:"IsBullet",value:function IsBullet(){return this.m_bulletFlag;}/// You can disable sleeping on this body. If you disable sleeping, the
      /// body will be woken.
      },{key:"SetSleepingAllowed",value:function SetSleepingAllowed(flag){this.m_autoSleepFlag=flag;if(!flag){this.SetAwake(true);}}/// Is this body allowed to sleep
      },{key:"IsSleepingAllowed",value:function IsSleepingAllowed(){return this.m_autoSleepFlag;}/// Set the sleep state of the body. A sleeping body has very
      /// low CPU cost.
      /// @param flag set to true to wake the body, false to put it to sleep.
      },{key:"SetAwake",value:function SetAwake(flag){if(flag){this.m_awakeFlag=true;this.m_sleepTime=0;}else {this.m_awakeFlag=false;this.m_sleepTime=0;this.m_linearVelocity.SetZero();this.m_angularVelocity=0;this.m_force.SetZero();this.m_torque=0;}}/// Get the sleeping state of this body.
      /// @return true if the body is sleeping.
      },{key:"IsAwake",value:function IsAwake(){return this.m_awakeFlag;}/// Set the active state of the body. An inactive body is not
      /// simulated and cannot be collided with or woken up.
      /// If you pass a flag of true, all fixtures will be added to the
      /// broad-phase.
      /// If you pass a flag of false, all fixtures will be removed from
      /// the broad-phase and all contacts will be destroyed.
      /// Fixtures and joints are otherwise unaffected. You may continue
      /// to create/destroy fixtures and joints on inactive bodies.
      /// Fixtures on an inactive body are implicitly inactive and will
      /// not participate in collisions, ray-casts, or queries.
      /// Joints connected to an inactive body are implicitly inactive.
      /// An inactive body is still owned by a b2World object and remains
      /// in the body list.
      },{key:"SetActive",value:function SetActive(flag){if(this.m_world.IsLocked()){throw new Error();}if(flag===this.IsActive()){return;}this.m_activeFlag=flag;if(flag){// Create all proxies.
      for(var f=this.m_fixtureList;f;f=f.m_next){f.CreateProxies();}// Contacts are created the next time step.
      }else {// Destroy all proxies.
      for(var _f=this.m_fixtureList;_f;_f=_f.m_next){_f.DestroyProxies();}// Destroy the attached contacts.
      var ce=this.m_contactList;while(ce){var ce0=ce;ce=ce.next;this.m_world.m_contactManager.Destroy(ce0.contact);}this.m_contactList=null;}}/// Get the active state of the body.
      },{key:"IsActive",value:function IsActive(){return this.m_activeFlag;}/// Set this body to have fixed rotation. This causes the mass
      /// to be reset.
      },{key:"SetFixedRotation",value:function SetFixedRotation(flag){if(this.m_fixedRotationFlag===flag){return;}this.m_fixedRotationFlag=flag;this.m_angularVelocity=0;this.ResetMassData();}/// Does this body have fixed rotation?
      },{key:"IsFixedRotation",value:function IsFixedRotation(){return this.m_fixedRotationFlag;}/// Get the list of all fixtures attached to this body.
      },{key:"GetFixtureList",value:function GetFixtureList(){return this.m_fixtureList;}/// Get the list of all joints attached to this body.
      },{key:"GetJointList",value:function GetJointList(){return this.m_jointList;}/// Get the list of all contacts attached to this body.
      /// @warning this list changes during the time step and you may
      /// miss some collisions if you don't use b2ContactListener.
      },{key:"GetContactList",value:function GetContactList(){return this.m_contactList;}/// Get the next body in the world's body list.
      },{key:"GetNext",value:function GetNext(){return this.m_next;}/// Get the user data pointer that was provided in the body definition.
      },{key:"GetUserData",value:function GetUserData(){return this.m_userData;}/// Set the user data. Use this to store your application specific data.
      },{key:"SetUserData",value:function SetUserData(data){this.m_userData=data;}/// Get the parent world of this body.
      },{key:"GetWorld",value:function GetWorld(){return this.m_world;}/// Dump this body to a log file
      },{key:"Dump",value:function Dump(log){var bodyIndex=this.m_islandIndex;log("{\n");log("  const bd: b2BodyDef = new b2BodyDef();\n");var type_str="";switch(this.m_type){case exports.b2BodyType.b2_staticBody:type_str="b2BodyType.b2_staticBody";break;case exports.b2BodyType.b2_kinematicBody:type_str="b2BodyType.b2_kinematicBody";break;case exports.b2BodyType.b2_dynamicBody:type_str="b2BodyType.b2_dynamicBody";break;}log("  bd.type = %s;\n",type_str);log("  bd.position.Set(%.15f, %.15f);\n",this.m_xf.p.x,this.m_xf.p.y);log("  bd.angle = %.15f;\n",this.m_sweep.a);log("  bd.linearVelocity.Set(%.15f, %.15f);\n",this.m_linearVelocity.x,this.m_linearVelocity.y);log("  bd.angularVelocity = %.15f;\n",this.m_angularVelocity);log("  bd.linearDamping = %.15f;\n",this.m_linearDamping);log("  bd.angularDamping = %.15f;\n",this.m_angularDamping);log("  bd.allowSleep = %s;\n",this.m_autoSleepFlag?"true":"false");log("  bd.awake = %s;\n",this.m_awakeFlag?"true":"false");log("  bd.fixedRotation = %s;\n",this.m_fixedRotationFlag?"true":"false");log("  bd.bullet = %s;\n",this.m_bulletFlag?"true":"false");log("  bd.active = %s;\n",this.m_activeFlag?"true":"false");log("  bd.gravityScale = %.15f;\n",this.m_gravityScale);log("\n");log("  bodies[%d] = this.m_world.CreateBody(bd);\n",this.m_islandIndex);log("\n");for(var f=this.m_fixtureList;f;f=f.m_next){log("  {\n");f.Dump(log,bodyIndex);log("  }\n");}log("}\n");}},{key:"SynchronizeFixtures",value:function SynchronizeFixtures(){var xf1=b2Body.SynchronizeFixtures_s_xf1;xf1.q.SetAngle(this.m_sweep.a0);b2Rot.MulRV(xf1.q,this.m_sweep.localCenter,xf1.p);b2Vec2.SubVV(this.m_sweep.c0,xf1.p,xf1.p);// const displacement: b2Vec2 = b2Vec2.SubVV(this.m_xf.p, xf1.p, b2Body.SynchronizeFixtures_s_displacement);
      var displacement=b2Vec2.SubVV(this.m_sweep.c,this.m_sweep.c0,b2Body.SynchronizeFixtures_s_displacement);for(var f=this.m_fixtureList;f;f=f.m_next){f.SynchronizeProxies(xf1,this.m_xf,displacement);}}},{key:"SynchronizeTransform",value:function SynchronizeTransform(){this.m_xf.q.SetAngle(this.m_sweep.a);b2Rot.MulRV(this.m_xf.q,this.m_sweep.localCenter,this.m_xf.p);b2Vec2.SubVV(this.m_sweep.c,this.m_xf.p,this.m_xf.p);}// This is used to prevent connected bodies from colliding.
      // It may lie, depending on the collideConnected flag.
      },{key:"ShouldCollide",value:function ShouldCollide(other){// At least one body should be dynamic or kinematic.
      if(this.m_type===exports.b2BodyType.b2_staticBody&&other.m_type===exports.b2BodyType.b2_staticBody){return false;}return this.ShouldCollideConnected(other);}},{key:"ShouldCollideConnected",value:function ShouldCollideConnected(other){// Does a joint prevent collision?
      for(var jn=this.m_jointList;jn;jn=jn.next){if(jn.other===other){if(!jn.joint.m_collideConnected){return false;}}}return true;}},{key:"Advance",value:function Advance(alpha){// Advance to the new safe time. This doesn't sync the broad-phase.
      this.m_sweep.Advance(alpha);this.m_sweep.c.Copy(this.m_sweep.c0);this.m_sweep.a=this.m_sweep.a0;this.m_xf.q.SetAngle(this.m_sweep.a);b2Rot.MulRV(this.m_xf.q,this.m_sweep.localCenter,this.m_xf.p);b2Vec2.SubVV(this.m_sweep.c,this.m_xf.p,this.m_xf.p);}// #if B2_ENABLE_CONTROLLER
      },{key:"GetControllerList",value:function GetControllerList(){return this.m_controllerList;}},{key:"GetControllerCount",value:function GetControllerCount(){return this.m_controllerCount;}}]);}();/// Creates a fixture from a shape and attach it to this body.
      /// This is a convenience function. Use b2FixtureDef if you need to set parameters
      /// like friction, restitution, user data, or filtering.
      /// If the density is non-zero, this function automatically updates the mass of the body.
      /// @param shape the shape to be cloned.
      /// @param density the shape density (set to zero for static bodies).
      /// @warning This function is locked during callbacks.
      b2Body.CreateFixtureShapeDensity_s_def=new b2FixtureDef();/// Set the mass properties to override the mass properties of the fixtures.
      /// Note that this changes the center of mass position.
      /// Note that creating or destroying fixtures can also alter the mass.
      /// This function has no effect if the body isn't dynamic.
      /// @param massData the mass properties.
      b2Body.SetMassData_s_oldCenter=new b2Vec2();/// This resets the mass properties to the sum of the mass properties of the fixtures.
      /// This normally does not need to be called unless you called SetMassData to override
      /// the mass and you later want to reset the mass.
      b2Body.ResetMassData_s_localCenter=new b2Vec2();b2Body.ResetMassData_s_oldCenter=new b2Vec2();b2Body.ResetMassData_s_massData=new b2MassData();b2Body.SynchronizeFixtures_s_xf1=new b2Transform();b2Body.SynchronizeFixtures_s_displacement=new b2Vec2();/*
        * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */(function(b2JointType){b2JointType[b2JointType["e_unknownJoint"]=0]="e_unknownJoint";b2JointType[b2JointType["e_revoluteJoint"]=1]="e_revoluteJoint";b2JointType[b2JointType["e_prismaticJoint"]=2]="e_prismaticJoint";b2JointType[b2JointType["e_distanceJoint"]=3]="e_distanceJoint";b2JointType[b2JointType["e_pulleyJoint"]=4]="e_pulleyJoint";b2JointType[b2JointType["e_mouseJoint"]=5]="e_mouseJoint";b2JointType[b2JointType["e_gearJoint"]=6]="e_gearJoint";b2JointType[b2JointType["e_wheelJoint"]=7]="e_wheelJoint";b2JointType[b2JointType["e_weldJoint"]=8]="e_weldJoint";b2JointType[b2JointType["e_frictionJoint"]=9]="e_frictionJoint";b2JointType[b2JointType["e_ropeJoint"]=10]="e_ropeJoint";b2JointType[b2JointType["e_motorJoint"]=11]="e_motorJoint";b2JointType[b2JointType["e_areaJoint"]=12]="e_areaJoint";})(exports.b2JointType||(exports.b2JointType={}));(function(b2LimitState){b2LimitState[b2LimitState["e_inactiveLimit"]=0]="e_inactiveLimit";b2LimitState[b2LimitState["e_atLowerLimit"]=1]="e_atLowerLimit";b2LimitState[b2LimitState["e_atUpperLimit"]=2]="e_atUpperLimit";b2LimitState[b2LimitState["e_equalLimits"]=3]="e_equalLimits";})(exports.b2LimitState||(exports.b2LimitState={}));var b2Jacobian=/*#__PURE__*/function(){function b2Jacobian(){_classCallCheck(this,b2Jacobian);this.linear=new b2Vec2();this.angularA=0;this.angularB=0;}return _createClass(b2Jacobian,[{key:"SetZero",value:function SetZero(){this.linear.SetZero();this.angularA=0;this.angularB=0;return this;}},{key:"Set",value:function Set(x,a1,a2){this.linear.Copy(x);this.angularA=a1;this.angularB=a2;return this;}}]);}();/// A joint edge is used to connect bodies and joints together
      /// in a joint graph where each body is a node and each joint
      /// is an edge. A joint edge belongs to a doubly linked list
      /// maintained in each attached body. Each joint has two joint
      /// nodes, one for each attached body.
      var b2JointEdge=/*#__PURE__*/function(){function b2JointEdge(joint){_classCallCheck(this,b2JointEdge);this._other=null;///< provides quick access to the other body attached.
      this.prev=null;///< the previous joint edge in the body's joint list
      this.next=null;///< the next joint edge in the body's joint list
      this.joint=joint;}return _createClass(b2JointEdge,[{key:"other",get:function get(){if(this._other===null){throw new Error();}return this._other;},set:function set(value){if(this._other!==null){throw new Error();}this._other=value;}},{key:"Reset",value:function Reset(){this._other=null;this.prev=null;this.next=null;}}]);}();/// Joint definitions are used to construct joints.
      var b2JointDef=/*#__PURE__*/_createClass(function b2JointDef(type){_classCallCheck(this,b2JointDef);/// The joint type is set automatically for concrete joint types.
      this.type=exports.b2JointType.e_unknownJoint;/// Use this to attach application specific data to your joints.
      this.userData=null;/// Set this flag to true if the attached bodies should collide.
      this.collideConnected=false;this.type=type;});/// The base joint class. Joints are used to constraint two bodies together in
      /// various fashions. Some joints also feature limits and motors.
      var b2Joint=/*#__PURE__*/function(){function b2Joint(def){_classCallCheck(this,b2Joint);// DEBUG: b2Assert(def.bodyA !== def.bodyB);
      this.m_type=exports.b2JointType.e_unknownJoint;this.m_prev=null;this.m_next=null;this.m_edgeA=new b2JointEdge(this);this.m_edgeB=new b2JointEdge(this);this.m_index=0;this.m_islandFlag=false;this.m_collideConnected=false;this.m_userData=null;this.m_type=def.type;this.m_edgeA.other=def.bodyB;this.m_edgeB.other=def.bodyA;this.m_bodyA=def.bodyA;this.m_bodyB=def.bodyB;this.m_collideConnected=b2Maybe(def.collideConnected,false);this.m_userData=b2Maybe(def.userData,null);}/// Get the type of the concrete joint.
      return _createClass(b2Joint,[{key:"GetType",value:function GetType(){return this.m_type;}/// Get the first body attached to this joint.
      },{key:"GetBodyA",value:function GetBodyA(){return this.m_bodyA;}/// Get the second body attached to this joint.
      },{key:"GetBodyB",value:function GetBodyB(){return this.m_bodyB;}/// Get the next joint the world joint list.
      },{key:"GetNext",value:function GetNext(){return this.m_next;}/// Get the user data pointer.
      },{key:"GetUserData",value:function GetUserData(){return this.m_userData;}/// Set the user data pointer.
      },{key:"SetUserData",value:function SetUserData(data){this.m_userData=data;}/// Short-cut function to determine if either body is inactive.
      },{key:"IsActive",value:function IsActive(){return this.m_bodyA.IsActive()&&this.m_bodyB.IsActive();}/// Get collide connected.
      /// Note: modifying the collide connect flag won't work correctly because
      /// the flag is only checked when fixture AABBs begin to overlap.
      },{key:"GetCollideConnected",value:function GetCollideConnected(){return this.m_collideConnected;}/// Dump this joint to the log file.
      },{key:"Dump",value:function Dump(log){log("// Dump is not supported for this joint type.\n");}/// Shift the origin for any points stored in world coordinates.
      },{key:"ShiftOrigin",value:function ShiftOrigin(newOrigin){}}]);}();/*
        * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Distance joint definition. This requires defining an
      /// anchor point on both bodies and the non-zero length of the
      /// distance joint. The definition uses local anchor points
      /// so that the initial configuration can violate the constraint
      /// slightly. This helps when saving and loading a game.
      /// @warning Do not use a zero or short length.
      var b2DistanceJointDef=/*#__PURE__*/function(_b2JointDef){function b2DistanceJointDef(){var _this6;_classCallCheck(this,b2DistanceJointDef);_this6=_callSuper(this,b2DistanceJointDef,[exports.b2JointType.e_distanceJoint]);_this6.localAnchorA=new b2Vec2();_this6.localAnchorB=new b2Vec2();_this6.length=1;_this6.frequencyHz=0;_this6.dampingRatio=0;return _this6;}_inherits(b2DistanceJointDef,_b2JointDef);return _createClass(b2DistanceJointDef,[{key:"Initialize",value:function Initialize(b1,b2,anchor1,anchor2){this.bodyA=b1;this.bodyB=b2;this.bodyA.GetLocalPoint(anchor1,this.localAnchorA);this.bodyB.GetLocalPoint(anchor2,this.localAnchorB);this.length=b2Vec2.DistanceVV(anchor1,anchor2);this.frequencyHz=0;this.dampingRatio=0;}}]);}(b2JointDef);var b2DistanceJoint=/*#__PURE__*/function(_b2Joint){function b2DistanceJoint(def){var _this7;_classCallCheck(this,b2DistanceJoint);_this7=_callSuper(this,b2DistanceJoint,[def]);_this7.m_frequencyHz=0;_this7.m_dampingRatio=0;_this7.m_bias=0;// Solver shared
      _this7.m_localAnchorA=new b2Vec2();_this7.m_localAnchorB=new b2Vec2();_this7.m_gamma=0;_this7.m_impulse=0;_this7.m_length=0;// Solver temp
      _this7.m_indexA=0;_this7.m_indexB=0;_this7.m_u=new b2Vec2();_this7.m_rA=new b2Vec2();_this7.m_rB=new b2Vec2();_this7.m_localCenterA=new b2Vec2();_this7.m_localCenterB=new b2Vec2();_this7.m_invMassA=0;_this7.m_invMassB=0;_this7.m_invIA=0;_this7.m_invIB=0;_this7.m_mass=0;_this7.m_qA=new b2Rot();_this7.m_qB=new b2Rot();_this7.m_lalcA=new b2Vec2();_this7.m_lalcB=new b2Vec2();_this7.m_frequencyHz=b2Maybe(def.frequencyHz,0);_this7.m_dampingRatio=b2Maybe(def.dampingRatio,0);_this7.m_localAnchorA.Copy(def.localAnchorA);_this7.m_localAnchorB.Copy(def.localAnchorB);_this7.m_length=def.length;return _this7;}_inherits(b2DistanceJoint,_b2Joint);return _createClass(b2DistanceJoint,[{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){out.x=inv_dt*this.m_impulse*this.m_u.x;out.y=inv_dt*this.m_impulse*this.m_u.y;return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return 0;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"SetLength",value:function SetLength(length){this.m_length=length;}},{key:"Length",value:function Length(){return this.m_length;}},{key:"SetFrequency",value:function SetFrequency(hz){this.m_frequencyHz=hz;}},{key:"GetFrequency",value:function GetFrequency(){return this.m_frequencyHz;}},{key:"SetDampingRatio",value:function SetDampingRatio(ratio){this.m_dampingRatio=ratio;}},{key:"GetDampingRatio",value:function GetDampingRatio(){return this.m_dampingRatio;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2DistanceJointDef = new b2DistanceJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.length = %.15f;\n",this.m_length);log("  jd.frequencyHz = %.15f;\n",this.m_frequencyHz);log("  jd.dampingRatio = %.15f;\n",this.m_dampingRatio);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}},{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// const qA: b2Rot = new b2Rot(aA), qB: b2Rot = new b2Rot(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// m_u = cB + m_rB - cA - m_rA;
      this.m_u.x=cB.x+this.m_rB.x-cA.x-this.m_rA.x;this.m_u.y=cB.y+this.m_rB.y-cA.y-this.m_rA.y;// Handle singularity.
      var length=this.m_u.Length();if(length>b2_linearSlop){this.m_u.SelfMul(1/length);}else {this.m_u.SetZero();}// float32 crAu = b2Cross(m_rA, m_u);
      var crAu=b2Vec2.CrossVV(this.m_rA,this.m_u);// float32 crBu = b2Cross(m_rB, m_u);
      var crBu=b2Vec2.CrossVV(this.m_rB,this.m_u);// float32 invMass = m_invMassA + m_invIA * crAu * crAu + m_invMassB + m_invIB * crBu * crBu;
      var invMass=this.m_invMassA+this.m_invIA*crAu*crAu+this.m_invMassB+this.m_invIB*crBu*crBu;// Compute the effective mass matrix.
      this.m_mass=invMass!==0?1/invMass:0;if(this.m_frequencyHz>0){var C=length-this.m_length;// Frequency
      var omega=2*b2_pi*this.m_frequencyHz;// Damping coefficient
      var d=2*this.m_mass*this.m_dampingRatio*omega;// Spring stiffness
      var k=this.m_mass*omega*omega;// magic formulas
      var h=data.step.dt;this.m_gamma=h*(d+h*k);this.m_gamma=this.m_gamma!==0?1/this.m_gamma:0;this.m_bias=C*h*k*this.m_gamma;invMass+=this.m_gamma;this.m_mass=invMass!==0?1/invMass:0;}else {this.m_gamma=0;this.m_bias=0;}if(data.step.warmStarting){// Scale the impulse to support a variable time step.
      this.m_impulse*=data.step.dtRatio;// b2Vec2 P = m_impulse * m_u;
      var P=b2Vec2.MulSV(this.m_impulse,this.m_u,b2DistanceJoint.InitVelocityConstraints_s_P);// vA -= m_invMassA * P;
      vA.SelfMulSub(this.m_invMassA,P);// wA -= m_invIA * b2Cross(m_rA, P);
      wA-=this.m_invIA*b2Vec2.CrossVV(this.m_rA,P);// vB += m_invMassB * P;
      vB.SelfMulAdd(this.m_invMassB,P);// wB += m_invIB * b2Cross(m_rB, P);
      wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,P);}else {this.m_impulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// b2Vec2 vpA = vA + b2Cross(wA, m_rA);
      var vpA=b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2DistanceJoint.SolveVelocityConstraints_s_vpA);// b2Vec2 vpB = vB + b2Cross(wB, m_rB);
      var vpB=b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2DistanceJoint.SolveVelocityConstraints_s_vpB);// float32 Cdot = b2Dot(m_u, vpB - vpA);
      var Cdot=b2Vec2.DotVV(this.m_u,b2Vec2.SubVV(vpB,vpA,b2Vec2.s_t0));var impulse=-this.m_mass*(Cdot+this.m_bias+this.m_gamma*this.m_impulse);this.m_impulse+=impulse;// b2Vec2 P = impulse * m_u;
      var P=b2Vec2.MulSV(impulse,this.m_u,b2DistanceJoint.SolveVelocityConstraints_s_P);// vA -= m_invMassA * P;
      vA.SelfMulSub(this.m_invMassA,P);// wA -= m_invIA * b2Cross(m_rA, P);
      wA-=this.m_invIA*b2Vec2.CrossVV(this.m_rA,P);// vB += m_invMassB * P;
      vB.SelfMulAdd(this.m_invMassB,P);// wB += m_invIB * b2Cross(m_rB, P);
      wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,P);// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){if(this.m_frequencyHz>0){// There is no position correction for soft distance constraints.
      return true;}var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;// const qA: b2Rot = new b2Rot(aA), qB: b2Rot = new b2Rot(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// use m_rA
      // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// use m_rB
      // b2Vec2 u = cB + rB - cA - rA;
      var u=this.m_u;// use m_u
      u.x=cB.x+rB.x-cA.x-rA.x;u.y=cB.y+rB.y-cA.y-rA.y;// float32 length = u.Normalize();
      var length=this.m_u.Normalize();// float32 C = length - m_length;
      var C=length-this.m_length;C=b2Clamp(C,-b2_maxLinearCorrection,b2_maxLinearCorrection);var impulse=-this.m_mass*C;// b2Vec2 P = impulse * u;
      var P=b2Vec2.MulSV(impulse,u,b2DistanceJoint.SolvePositionConstraints_s_P);// cA -= m_invMassA * P;
      cA.SelfMulSub(this.m_invMassA,P);// aA -= m_invIA * b2Cross(rA, P);
      aA-=this.m_invIA*b2Vec2.CrossVV(rA,P);// cB += m_invMassB * P;
      cB.SelfMulAdd(this.m_invMassB,P);// aB += m_invIB * b2Cross(rB, P);
      aB+=this.m_invIB*b2Vec2.CrossVV(rB,P);// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return b2Abs(C)<b2_linearSlop;}}]);}(b2Joint);b2DistanceJoint.InitVelocityConstraints_s_P=new b2Vec2();b2DistanceJoint.SolveVelocityConstraints_s_vpA=new b2Vec2();b2DistanceJoint.SolveVelocityConstraints_s_vpB=new b2Vec2();b2DistanceJoint.SolveVelocityConstraints_s_P=new b2Vec2();b2DistanceJoint.SolvePositionConstraints_s_P=new b2Vec2();// DEBUG: import { b2Assert } from "../common/b2_settings.js";
      var b2AreaJointDef=/*#__PURE__*/function(_b2JointDef2){function b2AreaJointDef(){var _this8;_classCallCheck(this,b2AreaJointDef);_this8=_callSuper(this,b2AreaJointDef,[exports.b2JointType.e_areaJoint]);_this8.bodies=[];_this8.frequencyHz=0;_this8.dampingRatio=0;return _this8;}_inherits(b2AreaJointDef,_b2JointDef2);return _createClass(b2AreaJointDef,[{key:"AddBody",value:function AddBody(body){this.bodies.push(body);if(this.bodies.length===1){this.bodyA=body;}else if(this.bodies.length===2){this.bodyB=body;}}}]);}(b2JointDef);var b2AreaJoint=/*#__PURE__*/function(_b2Joint2){function b2AreaJoint(def){var _this9;_classCallCheck(this,b2AreaJoint);_this9=_callSuper(this,b2AreaJoint,[def]);_this9.m_frequencyHz=0;_this9.m_dampingRatio=0;// Solver shared
      _this9.m_impulse=0;_this9.m_targetArea=0;_this9.m_delta=new b2Vec2();// DEBUG: b2Assert(def.bodies.length >= 3, "You cannot create an area joint with less than three bodies.");
      _this9.m_bodies=def.bodies;_this9.m_frequencyHz=b2Maybe(def.frequencyHz,0);_this9.m_dampingRatio=b2Maybe(def.dampingRatio,0);_this9.m_targetLengths=b2MakeNumberArray(def.bodies.length);_this9.m_normals=b2Vec2.MakeArray(def.bodies.length);_this9.m_joints=[];// b2MakeNullArray(def.bodies.length);
      _this9.m_deltas=b2Vec2.MakeArray(def.bodies.length);var djd=new b2DistanceJointDef();djd.frequencyHz=_this9.m_frequencyHz;djd.dampingRatio=_this9.m_dampingRatio;_this9.m_targetArea=0;for(var i=0;i<_this9.m_bodies.length;++i){var body=_this9.m_bodies[i];var next=_this9.m_bodies[(i+1)%_this9.m_bodies.length];var body_c=body.GetWorldCenter();var next_c=next.GetWorldCenter();_this9.m_targetLengths[i]=b2Vec2.DistanceVV(body_c,next_c);_this9.m_targetArea+=b2Vec2.CrossVV(body_c,next_c);djd.Initialize(body,next,body_c,next_c);_this9.m_joints[i]=body.GetWorld().CreateJoint(djd);}_this9.m_targetArea*=0.5;return _this9;}_inherits(b2AreaJoint,_b2Joint2);return _createClass(b2AreaJoint,[{key:"GetAnchorA",value:function GetAnchorA(out){return out;}},{key:"GetAnchorB",value:function GetAnchorB(out){return out;}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return 0;}},{key:"SetFrequency",value:function SetFrequency(hz){this.m_frequencyHz=hz;for(var i=0;i<this.m_joints.length;++i){this.m_joints[i].SetFrequency(hz);}}},{key:"GetFrequency",value:function GetFrequency(){return this.m_frequencyHz;}},{key:"SetDampingRatio",value:function SetDampingRatio(ratio){this.m_dampingRatio=ratio;for(var i=0;i<this.m_joints.length;++i){this.m_joints[i].SetDampingRatio(ratio);}}},{key:"GetDampingRatio",value:function GetDampingRatio(){return this.m_dampingRatio;}},{key:"Dump",value:function Dump(log){log("Area joint dumping is not supported.\n");}},{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){for(var i=0;i<this.m_bodies.length;++i){var prev=this.m_bodies[(i+this.m_bodies.length-1)%this.m_bodies.length];var next=this.m_bodies[(i+1)%this.m_bodies.length];var prev_c=data.positions[prev.m_islandIndex].c;var next_c=data.positions[next.m_islandIndex].c;var delta=this.m_deltas[i];b2Vec2.SubVV(next_c,prev_c,delta);}if(data.step.warmStarting){this.m_impulse*=data.step.dtRatio;for(var _i10=0;_i10<this.m_bodies.length;++_i10){var body=this.m_bodies[_i10];var body_v=data.velocities[body.m_islandIndex].v;var _delta=this.m_deltas[_i10];body_v.x+=body.m_invMass*_delta.y*0.5*this.m_impulse;body_v.y+=body.m_invMass*-_delta.x*0.5*this.m_impulse;}}else {this.m_impulse=0;}}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var dotMassSum=0;var crossMassSum=0;for(var i=0;i<this.m_bodies.length;++i){var body=this.m_bodies[i];var body_v=data.velocities[body.m_islandIndex].v;var delta=this.m_deltas[i];dotMassSum+=delta.LengthSquared()/body.GetMass();crossMassSum+=b2Vec2.CrossVV(body_v,delta);}var lambda=-2*crossMassSum/dotMassSum;// lambda = b2Clamp(lambda, -b2_maxLinearCorrection, b2_maxLinearCorrection);
      this.m_impulse+=lambda;for(var _i11=0;_i11<this.m_bodies.length;++_i11){var _body=this.m_bodies[_i11];var _body_v=data.velocities[_body.m_islandIndex].v;var _delta2=this.m_deltas[_i11];_body_v.x+=_body.m_invMass*_delta2.y*0.5*lambda;_body_v.y+=_body.m_invMass*-_delta2.x*0.5*lambda;}}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var perimeter=0;var area=0;for(var i=0;i<this.m_bodies.length;++i){var body=this.m_bodies[i];var next=this.m_bodies[(i+1)%this.m_bodies.length];var body_c=data.positions[body.m_islandIndex].c;var next_c=data.positions[next.m_islandIndex].c;var delta=b2Vec2.SubVV(next_c,body_c,this.m_delta);var dist=delta.Length();if(dist<b2_epsilon){dist=1;}this.m_normals[i].x=delta.y/dist;this.m_normals[i].y=-delta.x/dist;perimeter+=dist;area+=b2Vec2.CrossVV(body_c,next_c);}area*=0.5;var deltaArea=this.m_targetArea-area;var toExtrude=0.5*deltaArea/perimeter;var done=true;for(var _i12=0;_i12<this.m_bodies.length;++_i12){var _body2=this.m_bodies[_i12];var _body_c=data.positions[_body2.m_islandIndex].c;var next_i=(_i12+1)%this.m_bodies.length;var _delta3=b2Vec2.AddVV(this.m_normals[_i12],this.m_normals[next_i],this.m_delta);_delta3.SelfMul(toExtrude);var norm_sq=_delta3.LengthSquared();if(norm_sq>b2Sq(b2_maxLinearCorrection)){_delta3.SelfMul(b2_maxLinearCorrection/b2Sqrt(norm_sq));}if(norm_sq>b2Sq(b2_linearSlop)){done=false;}_body_c.x+=_delta3.x;_body_c.y+=_delta3.y;}return done;}}]);}(b2Joint);/*
        * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Friction joint definition.
      var b2FrictionJointDef=/*#__PURE__*/function(_b2JointDef3){function b2FrictionJointDef(){var _this0;_classCallCheck(this,b2FrictionJointDef);_this0=_callSuper(this,b2FrictionJointDef,[exports.b2JointType.e_frictionJoint]);_this0.localAnchorA=new b2Vec2();_this0.localAnchorB=new b2Vec2();_this0.maxForce=0;_this0.maxTorque=0;return _this0;}_inherits(b2FrictionJointDef,_b2JointDef3);return _createClass(b2FrictionJointDef,[{key:"Initialize",value:function Initialize(bA,bB,anchor){this.bodyA=bA;this.bodyB=bB;this.bodyA.GetLocalPoint(anchor,this.localAnchorA);this.bodyB.GetLocalPoint(anchor,this.localAnchorB);}}]);}(b2JointDef);var b2FrictionJoint=/*#__PURE__*/function(_b2Joint3){function b2FrictionJoint(def){var _this1;_classCallCheck(this,b2FrictionJoint);_this1=_callSuper(this,b2FrictionJoint,[def]);_this1.m_localAnchorA=new b2Vec2();_this1.m_localAnchorB=new b2Vec2();// Solver shared
      _this1.m_linearImpulse=new b2Vec2();_this1.m_angularImpulse=0;_this1.m_maxForce=0;_this1.m_maxTorque=0;// Solver temp
      _this1.m_indexA=0;_this1.m_indexB=0;_this1.m_rA=new b2Vec2();_this1.m_rB=new b2Vec2();_this1.m_localCenterA=new b2Vec2();_this1.m_localCenterB=new b2Vec2();_this1.m_invMassA=0;_this1.m_invMassB=0;_this1.m_invIA=0;_this1.m_invIB=0;_this1.m_linearMass=new b2Mat22();_this1.m_angularMass=0;_this1.m_qA=new b2Rot();_this1.m_qB=new b2Rot();_this1.m_lalcA=new b2Vec2();_this1.m_lalcB=new b2Vec2();_this1.m_K=new b2Mat22();_this1.m_localAnchorA.Copy(def.localAnchorA);_this1.m_localAnchorB.Copy(def.localAnchorB);_this1.m_linearImpulse.SetZero();_this1.m_maxForce=b2Maybe(def.maxForce,0);_this1.m_maxTorque=b2Maybe(def.maxTorque,0);_this1.m_linearMass.SetZero();return _this1;}_inherits(b2FrictionJoint,_b2Joint3);return _createClass(b2FrictionJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;// const cA: b2Vec2 = data.positions[this.m_indexA].c;
      var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;// const cB: b2Vec2 = data.positions[this.m_indexB].c;
      var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// const qA: b2Rot = new b2Rot(aA), qB: b2Rot = new b2Rot(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// Compute the effective mass matrix.
      // m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// J = [-I -r1_skew I r2_skew]
      //     [ 0       -1 0       1]
      // r_skew = [-ry; rx]
      // Matlab
      // K = [ mA+r1y^2*iA+mB+r2y^2*iB,  -r1y*iA*r1x-r2y*iB*r2x,          -r1y*iA-r2y*iB]
      //     [  -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB,           r1x*iA+r2x*iB]
      //     [          -r1y*iA-r2y*iB,           r1x*iA+r2x*iB,                   iA+iB]
      var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var K=this.m_K;// new b2Mat22();
      K.ex.x=mA+mB+iA*rA.y*rA.y+iB*rB.y*rB.y;K.ex.y=-iA*rA.x*rA.y-iB*rB.x*rB.y;K.ey.x=K.ex.y;K.ey.y=mA+mB+iA*rA.x*rA.x+iB*rB.x*rB.x;K.GetInverse(this.m_linearMass);this.m_angularMass=iA+iB;if(this.m_angularMass>0){this.m_angularMass=1/this.m_angularMass;}if(data.step.warmStarting){// Scale impulses to support a variable time step.
      // m_linearImpulse *= data.step.dtRatio;
      this.m_linearImpulse.SelfMul(data.step.dtRatio);this.m_angularImpulse*=data.step.dtRatio;// const P: b2Vec2(m_linearImpulse.x, m_linearImpulse.y);
      var P=this.m_linearImpulse;// vA -= mA * P;
      vA.SelfMulSub(mA,P);// wA -= iA * (b2Cross(m_rA, P) + m_angularImpulse);
      wA-=iA*(b2Vec2.CrossVV(this.m_rA,P)+this.m_angularImpulse);// vB += mB * P;
      vB.SelfMulAdd(mB,P);// wB += iB * (b2Cross(m_rB, P) + m_angularImpulse);
      wB+=iB*(b2Vec2.CrossVV(this.m_rB,P)+this.m_angularImpulse);}else {this.m_linearImpulse.SetZero();this.m_angularImpulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var h=data.step.dt;// Solve angular friction
      {var Cdot=wB-wA;var impulse=-this.m_angularMass*Cdot;var oldImpulse=this.m_angularImpulse;var maxImpulse=h*this.m_maxTorque;this.m_angularImpulse=b2Clamp(this.m_angularImpulse+impulse,-maxImpulse,maxImpulse);impulse=this.m_angularImpulse-oldImpulse;wA-=iA*impulse;wB+=iB*impulse;}// Solve linear friction
      {// b2Vec2 Cdot = vB + b2Cross(wB, m_rB) - vA - b2Cross(wA, m_rA);
      var Cdot_v2=b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2Vec2.s_t1),b2FrictionJoint.SolveVelocityConstraints_s_Cdot_v2);// b2Vec2 impulse = -b2Mul(m_linearMass, Cdot);
      var impulseV=b2Mat22.MulMV(this.m_linearMass,Cdot_v2,b2FrictionJoint.SolveVelocityConstraints_s_impulseV).SelfNeg();// b2Vec2 oldImpulse = m_linearImpulse;
      var oldImpulseV=b2FrictionJoint.SolveVelocityConstraints_s_oldImpulseV.Copy(this.m_linearImpulse);// m_linearImpulse += impulse;
      this.m_linearImpulse.SelfAdd(impulseV);var _maxImpulse=h*this.m_maxForce;if(this.m_linearImpulse.LengthSquared()>_maxImpulse*_maxImpulse){this.m_linearImpulse.Normalize();this.m_linearImpulse.SelfMul(_maxImpulse);}// impulse = m_linearImpulse - oldImpulse;
      b2Vec2.SubVV(this.m_linearImpulse,oldImpulseV,impulseV);// vA -= mA * impulse;
      vA.SelfMulSub(mA,impulseV);// wA -= iA * b2Cross(m_rA, impulse);
      wA-=iA*b2Vec2.CrossVV(this.m_rA,impulseV);// vB += mB * impulse;
      vB.SelfMulAdd(mB,impulseV);// wB += iB * b2Cross(m_rB, impulse);
      wB+=iB*b2Vec2.CrossVV(this.m_rB,impulseV);}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){return true;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){out.x=inv_dt*this.m_linearImpulse.x;out.y=inv_dt*this.m_linearImpulse.y;return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return inv_dt*this.m_angularImpulse;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"SetMaxForce",value:function SetMaxForce(force){this.m_maxForce=force;}},{key:"GetMaxForce",value:function GetMaxForce(){return this.m_maxForce;}},{key:"SetMaxTorque",value:function SetMaxTorque(torque){this.m_maxTorque=torque;}},{key:"GetMaxTorque",value:function GetMaxTorque(){return this.m_maxTorque;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2FrictionJointDef = new b2FrictionJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.maxForce = %.15f;\n",this.m_maxForce);log("  jd.maxTorque = %.15f;\n",this.m_maxTorque);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2FrictionJoint.SolveVelocityConstraints_s_Cdot_v2=new b2Vec2();b2FrictionJoint.SolveVelocityConstraints_s_impulseV=new b2Vec2();b2FrictionJoint.SolveVelocityConstraints_s_oldImpulseV=new b2Vec2();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Gear joint definition. This definition requires two existing
      /// revolute or prismatic joints (any combination will work).
      var b2GearJointDef=/*#__PURE__*/function(_b2JointDef4){function b2GearJointDef(){var _this10;_classCallCheck(this,b2GearJointDef);_this10=_callSuper(this,b2GearJointDef,[exports.b2JointType.e_gearJoint]);_this10.ratio=1;return _this10;}_inherits(b2GearJointDef,_b2JointDef4);return _createClass(b2GearJointDef);}(b2JointDef);var b2GearJoint=/*#__PURE__*/function(_b2Joint4){function b2GearJoint(def){var _this11;_classCallCheck(this,b2GearJoint);_this11=_callSuper(this,b2GearJoint,[def]);_this11.m_typeA=exports.b2JointType.e_unknownJoint;_this11.m_typeB=exports.b2JointType.e_unknownJoint;// Solver shared
      _this11.m_localAnchorA=new b2Vec2();_this11.m_localAnchorB=new b2Vec2();_this11.m_localAnchorC=new b2Vec2();_this11.m_localAnchorD=new b2Vec2();_this11.m_localAxisC=new b2Vec2();_this11.m_localAxisD=new b2Vec2();_this11.m_referenceAngleA=0;_this11.m_referenceAngleB=0;_this11.m_constant=0;_this11.m_ratio=0;_this11.m_impulse=0;// Solver temp
      _this11.m_indexA=0;_this11.m_indexB=0;_this11.m_indexC=0;_this11.m_indexD=0;_this11.m_lcA=new b2Vec2();_this11.m_lcB=new b2Vec2();_this11.m_lcC=new b2Vec2();_this11.m_lcD=new b2Vec2();_this11.m_mA=0;_this11.m_mB=0;_this11.m_mC=0;_this11.m_mD=0;_this11.m_iA=0;_this11.m_iB=0;_this11.m_iC=0;_this11.m_iD=0;_this11.m_JvAC=new b2Vec2();_this11.m_JvBD=new b2Vec2();_this11.m_JwA=0;_this11.m_JwB=0;_this11.m_JwC=0;_this11.m_JwD=0;_this11.m_mass=0;_this11.m_qA=new b2Rot();_this11.m_qB=new b2Rot();_this11.m_qC=new b2Rot();_this11.m_qD=new b2Rot();_this11.m_lalcA=new b2Vec2();_this11.m_lalcB=new b2Vec2();_this11.m_lalcC=new b2Vec2();_this11.m_lalcD=new b2Vec2();_this11.m_joint1=def.joint1;_this11.m_joint2=def.joint2;_this11.m_typeA=_this11.m_joint1.GetType();_this11.m_typeB=_this11.m_joint2.GetType();// DEBUG: b2Assert(this.m_typeA === b2JointType.e_revoluteJoint || this.m_typeA === b2JointType.e_prismaticJoint);
      // DEBUG: b2Assert(this.m_typeB === b2JointType.e_revoluteJoint || this.m_typeB === b2JointType.e_prismaticJoint);
      var coordinateA,coordinateB;// TODO_ERIN there might be some problem with the joint edges in b2Joint.
      _this11.m_bodyC=_this11.m_joint1.GetBodyA();_this11.m_bodyA=_this11.m_joint1.GetBodyB();// Get geometry of joint1
      var xfA=_this11.m_bodyA.m_xf;var aA=_this11.m_bodyA.m_sweep.a;var xfC=_this11.m_bodyC.m_xf;var aC=_this11.m_bodyC.m_sweep.a;if(_this11.m_typeA===exports.b2JointType.e_revoluteJoint){var revolute=def.joint1;_this11.m_localAnchorC.Copy(revolute.m_localAnchorA);_this11.m_localAnchorA.Copy(revolute.m_localAnchorB);_this11.m_referenceAngleA=revolute.m_referenceAngle;_this11.m_localAxisC.SetZero();coordinateA=aA-aC-_this11.m_referenceAngleA;}else {var prismatic=def.joint1;_this11.m_localAnchorC.Copy(prismatic.m_localAnchorA);_this11.m_localAnchorA.Copy(prismatic.m_localAnchorB);_this11.m_referenceAngleA=prismatic.m_referenceAngle;_this11.m_localAxisC.Copy(prismatic.m_localXAxisA);// b2Vec2 pC = m_localAnchorC;
      var pC=_this11.m_localAnchorC;// b2Vec2 pA = b2MulT(xfC.q, b2Mul(xfA.q, m_localAnchorA) + (xfA.p - xfC.p));
      var pA=b2Rot.MulTRV(xfC.q,b2Vec2.AddVV(b2Rot.MulRV(xfA.q,_this11.m_localAnchorA,b2Vec2.s_t0),b2Vec2.SubVV(xfA.p,xfC.p,b2Vec2.s_t1),b2Vec2.s_t0),b2Vec2.s_t0);// pA uses s_t0
      // coordinateA = b2Dot(pA - pC, m_localAxisC);
      coordinateA=b2Vec2.DotVV(b2Vec2.SubVV(pA,pC,b2Vec2.s_t0),_this11.m_localAxisC);}_this11.m_bodyD=_this11.m_joint2.GetBodyA();_this11.m_bodyB=_this11.m_joint2.GetBodyB();// Get geometry of joint2
      var xfB=_this11.m_bodyB.m_xf;var aB=_this11.m_bodyB.m_sweep.a;var xfD=_this11.m_bodyD.m_xf;var aD=_this11.m_bodyD.m_sweep.a;if(_this11.m_typeB===exports.b2JointType.e_revoluteJoint){var _revolute=def.joint2;_this11.m_localAnchorD.Copy(_revolute.m_localAnchorA);_this11.m_localAnchorB.Copy(_revolute.m_localAnchorB);_this11.m_referenceAngleB=_revolute.m_referenceAngle;_this11.m_localAxisD.SetZero();coordinateB=aB-aD-_this11.m_referenceAngleB;}else {var _prismatic=def.joint2;_this11.m_localAnchorD.Copy(_prismatic.m_localAnchorA);_this11.m_localAnchorB.Copy(_prismatic.m_localAnchorB);_this11.m_referenceAngleB=_prismatic.m_referenceAngle;_this11.m_localAxisD.Copy(_prismatic.m_localXAxisA);// b2Vec2 pD = m_localAnchorD;
      var pD=_this11.m_localAnchorD;// b2Vec2 pB = b2MulT(xfD.q, b2Mul(xfB.q, m_localAnchorB) + (xfB.p - xfD.p));
      var pB=b2Rot.MulTRV(xfD.q,b2Vec2.AddVV(b2Rot.MulRV(xfB.q,_this11.m_localAnchorB,b2Vec2.s_t0),b2Vec2.SubVV(xfB.p,xfD.p,b2Vec2.s_t1),b2Vec2.s_t0),b2Vec2.s_t0);// pB uses s_t0
      // coordinateB = b2Dot(pB - pD, m_localAxisD);
      coordinateB=b2Vec2.DotVV(b2Vec2.SubVV(pB,pD,b2Vec2.s_t0),_this11.m_localAxisD);}_this11.m_ratio=b2Maybe(def.ratio,1);_this11.m_constant=coordinateA+_this11.m_ratio*coordinateB;_this11.m_impulse=0;return _this11;}_inherits(b2GearJoint,_b2Joint4);return _createClass(b2GearJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_indexC=this.m_bodyC.m_islandIndex;this.m_indexD=this.m_bodyD.m_islandIndex;this.m_lcA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_lcB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_lcC.Copy(this.m_bodyC.m_sweep.localCenter);this.m_lcD.Copy(this.m_bodyD.m_sweep.localCenter);this.m_mA=this.m_bodyA.m_invMass;this.m_mB=this.m_bodyB.m_invMass;this.m_mC=this.m_bodyC.m_invMass;this.m_mD=this.m_bodyD.m_invMass;this.m_iA=this.m_bodyA.m_invI;this.m_iB=this.m_bodyB.m_invI;this.m_iC=this.m_bodyC.m_invI;this.m_iD=this.m_bodyD.m_invI;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var aC=data.positions[this.m_indexC].a;var vC=data.velocities[this.m_indexC].v;var wC=data.velocities[this.m_indexC].w;var aD=data.positions[this.m_indexD].a;var vD=data.velocities[this.m_indexD].v;var wD=data.velocities[this.m_indexD].w;// b2Rot qA(aA), qB(aB), qC(aC), qD(aD);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB),qC=this.m_qC.SetAngle(aC),qD=this.m_qD.SetAngle(aD);this.m_mass=0;if(this.m_typeA===exports.b2JointType.e_revoluteJoint){this.m_JvAC.SetZero();this.m_JwA=1;this.m_JwC=1;this.m_mass+=this.m_iA+this.m_iC;}else {// b2Vec2 u = b2Mul(qC, m_localAxisC);
      var u=b2Rot.MulRV(qC,this.m_localAxisC,b2GearJoint.InitVelocityConstraints_s_u);// b2Vec2 rC = b2Mul(qC, m_localAnchorC - m_lcC);
      b2Vec2.SubVV(this.m_localAnchorC,this.m_lcC,this.m_lalcC);var rC=b2Rot.MulRV(qC,this.m_lalcC,b2GearJoint.InitVelocityConstraints_s_rC);// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_lcA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_lcA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,b2GearJoint.InitVelocityConstraints_s_rA);// m_JvAC = u;
      this.m_JvAC.Copy(u);// m_JwC = b2Cross(rC, u);
      this.m_JwC=b2Vec2.CrossVV(rC,u);// m_JwA = b2Cross(rA, u);
      this.m_JwA=b2Vec2.CrossVV(rA,u);this.m_mass+=this.m_mC+this.m_mA+this.m_iC*this.m_JwC*this.m_JwC+this.m_iA*this.m_JwA*this.m_JwA;}if(this.m_typeB===exports.b2JointType.e_revoluteJoint){this.m_JvBD.SetZero();this.m_JwB=this.m_ratio;this.m_JwD=this.m_ratio;this.m_mass+=this.m_ratio*this.m_ratio*(this.m_iB+this.m_iD);}else {// b2Vec2 u = b2Mul(qD, m_localAxisD);
      var _u=b2Rot.MulRV(qD,this.m_localAxisD,b2GearJoint.InitVelocityConstraints_s_u);// b2Vec2 rD = b2Mul(qD, m_localAnchorD - m_lcD);
      b2Vec2.SubVV(this.m_localAnchorD,this.m_lcD,this.m_lalcD);var rD=b2Rot.MulRV(qD,this.m_lalcD,b2GearJoint.InitVelocityConstraints_s_rD);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_lcB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_lcB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,b2GearJoint.InitVelocityConstraints_s_rB);// m_JvBD = m_ratio * u;
      b2Vec2.MulSV(this.m_ratio,_u,this.m_JvBD);// m_JwD = m_ratio * b2Cross(rD, u);
      this.m_JwD=this.m_ratio*b2Vec2.CrossVV(rD,_u);// m_JwB = m_ratio * b2Cross(rB, u);
      this.m_JwB=this.m_ratio*b2Vec2.CrossVV(rB,_u);this.m_mass+=this.m_ratio*this.m_ratio*(this.m_mD+this.m_mB)+this.m_iD*this.m_JwD*this.m_JwD+this.m_iB*this.m_JwB*this.m_JwB;}// Compute effective mass.
      this.m_mass=this.m_mass>0?1/this.m_mass:0;if(data.step.warmStarting){// vA += (m_mA * m_impulse) * m_JvAC;
      vA.SelfMulAdd(this.m_mA*this.m_impulse,this.m_JvAC);wA+=this.m_iA*this.m_impulse*this.m_JwA;// vB += (m_mB * m_impulse) * m_JvBD;
      vB.SelfMulAdd(this.m_mB*this.m_impulse,this.m_JvBD);wB+=this.m_iB*this.m_impulse*this.m_JwB;// vC -= (m_mC * m_impulse) * m_JvAC;
      vC.SelfMulSub(this.m_mC*this.m_impulse,this.m_JvAC);wC-=this.m_iC*this.m_impulse*this.m_JwC;// vD -= (m_mD * m_impulse) * m_JvBD;
      vD.SelfMulSub(this.m_mD*this.m_impulse,this.m_JvBD);wD-=this.m_iD*this.m_impulse*this.m_JwD;}else {this.m_impulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;// data.velocities[this.m_indexC].v = vC;
      data.velocities[this.m_indexC].w=wC;// data.velocities[this.m_indexD].v = vD;
      data.velocities[this.m_indexD].w=wD;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var vC=data.velocities[this.m_indexC].v;var wC=data.velocities[this.m_indexC].w;var vD=data.velocities[this.m_indexD].v;var wD=data.velocities[this.m_indexD].w;// float32 Cdot = b2Dot(m_JvAC, vA - vC) + b2Dot(m_JvBD, vB - vD);
      var Cdot=b2Vec2.DotVV(this.m_JvAC,b2Vec2.SubVV(vA,vC,b2Vec2.s_t0))+b2Vec2.DotVV(this.m_JvBD,b2Vec2.SubVV(vB,vD,b2Vec2.s_t0));Cdot+=this.m_JwA*wA-this.m_JwC*wC+(this.m_JwB*wB-this.m_JwD*wD);var impulse=-this.m_mass*Cdot;this.m_impulse+=impulse;// vA += (m_mA * impulse) * m_JvAC;
      vA.SelfMulAdd(this.m_mA*impulse,this.m_JvAC);wA+=this.m_iA*impulse*this.m_JwA;// vB += (m_mB * impulse) * m_JvBD;
      vB.SelfMulAdd(this.m_mB*impulse,this.m_JvBD);wB+=this.m_iB*impulse*this.m_JwB;// vC -= (m_mC * impulse) * m_JvAC;
      vC.SelfMulSub(this.m_mC*impulse,this.m_JvAC);wC-=this.m_iC*impulse*this.m_JwC;// vD -= (m_mD * impulse) * m_JvBD;
      vD.SelfMulSub(this.m_mD*impulse,this.m_JvBD);wD-=this.m_iD*impulse*this.m_JwD;// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;// data.velocities[this.m_indexC].v = vC;
      data.velocities[this.m_indexC].w=wC;// data.velocities[this.m_indexD].v = vD;
      data.velocities[this.m_indexD].w=wD;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var cC=data.positions[this.m_indexC].c;var aC=data.positions[this.m_indexC].a;var cD=data.positions[this.m_indexD].c;var aD=data.positions[this.m_indexD].a;// b2Rot qA(aA), qB(aB), qC(aC), qD(aD);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB),qC=this.m_qC.SetAngle(aC),qD=this.m_qD.SetAngle(aD);var linearError=0;var coordinateA,coordinateB;var JvAC=this.m_JvAC,JvBD=this.m_JvBD;var JwA,JwB,JwC,JwD;var mass=0;if(this.m_typeA===exports.b2JointType.e_revoluteJoint){JvAC.SetZero();JwA=1;JwC=1;mass+=this.m_iA+this.m_iC;coordinateA=aA-aC-this.m_referenceAngleA;}else {// b2Vec2 u = b2Mul(qC, m_localAxisC);
      var u=b2Rot.MulRV(qC,this.m_localAxisC,b2GearJoint.SolvePositionConstraints_s_u);// b2Vec2 rC = b2Mul(qC, m_localAnchorC - m_lcC);
      var rC=b2Rot.MulRV(qC,this.m_lalcC,b2GearJoint.SolvePositionConstraints_s_rC);// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_lcA);
      var rA=b2Rot.MulRV(qA,this.m_lalcA,b2GearJoint.SolvePositionConstraints_s_rA);// JvAC = u;
      JvAC.Copy(u);// JwC = b2Cross(rC, u);
      JwC=b2Vec2.CrossVV(rC,u);// JwA = b2Cross(rA, u);
      JwA=b2Vec2.CrossVV(rA,u);mass+=this.m_mC+this.m_mA+this.m_iC*JwC*JwC+this.m_iA*JwA*JwA;// b2Vec2 pC = m_localAnchorC - m_lcC;
      var pC=this.m_lalcC;// b2Vec2 pA = b2MulT(qC, rA + (cA - cC));
      var pA=b2Rot.MulTRV(qC,b2Vec2.AddVV(rA,b2Vec2.SubVV(cA,cC,b2Vec2.s_t0),b2Vec2.s_t0),b2Vec2.s_t0);// pA uses s_t0
      // coordinateA = b2Dot(pA - pC, m_localAxisC);
      coordinateA=b2Vec2.DotVV(b2Vec2.SubVV(pA,pC,b2Vec2.s_t0),this.m_localAxisC);}if(this.m_typeB===exports.b2JointType.e_revoluteJoint){JvBD.SetZero();JwB=this.m_ratio;JwD=this.m_ratio;mass+=this.m_ratio*this.m_ratio*(this.m_iB+this.m_iD);coordinateB=aB-aD-this.m_referenceAngleB;}else {// b2Vec2 u = b2Mul(qD, m_localAxisD);
      var _u2=b2Rot.MulRV(qD,this.m_localAxisD,b2GearJoint.SolvePositionConstraints_s_u);// b2Vec2 rD = b2Mul(qD, m_localAnchorD - m_lcD);
      var rD=b2Rot.MulRV(qD,this.m_lalcD,b2GearJoint.SolvePositionConstraints_s_rD);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_lcB);
      var rB=b2Rot.MulRV(qB,this.m_lalcB,b2GearJoint.SolvePositionConstraints_s_rB);// JvBD = m_ratio * u;
      b2Vec2.MulSV(this.m_ratio,_u2,JvBD);// JwD = m_ratio * b2Cross(rD, u);
      JwD=this.m_ratio*b2Vec2.CrossVV(rD,_u2);// JwB = m_ratio * b2Cross(rB, u);
      JwB=this.m_ratio*b2Vec2.CrossVV(rB,_u2);mass+=this.m_ratio*this.m_ratio*(this.m_mD+this.m_mB)+this.m_iD*JwD*JwD+this.m_iB*JwB*JwB;// b2Vec2 pD = m_localAnchorD - m_lcD;
      var pD=this.m_lalcD;// b2Vec2 pB = b2MulT(qD, rB + (cB - cD));
      var pB=b2Rot.MulTRV(qD,b2Vec2.AddVV(rB,b2Vec2.SubVV(cB,cD,b2Vec2.s_t0),b2Vec2.s_t0),b2Vec2.s_t0);// pB uses s_t0
      // coordinateB = b2Dot(pB - pD, m_localAxisD);
      coordinateB=b2Vec2.DotVV(b2Vec2.SubVV(pB,pD,b2Vec2.s_t0),this.m_localAxisD);}var C=coordinateA+this.m_ratio*coordinateB-this.m_constant;var impulse=0;if(mass>0){impulse=-C/mass;}// cA += m_mA * impulse * JvAC;
      cA.SelfMulAdd(this.m_mA*impulse,JvAC);aA+=this.m_iA*impulse*JwA;// cB += m_mB * impulse * JvBD;
      cB.SelfMulAdd(this.m_mB*impulse,JvBD);aB+=this.m_iB*impulse*JwB;// cC -= m_mC * impulse * JvAC;
      cC.SelfMulSub(this.m_mC*impulse,JvAC);aC-=this.m_iC*impulse*JwC;// cD -= m_mD * impulse * JvBD;
      cD.SelfMulSub(this.m_mD*impulse,JvBD);aD-=this.m_iD*impulse*JwD;// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;// data.positions[this.m_indexC].c = cC;
      data.positions[this.m_indexC].a=aC;// data.positions[this.m_indexD].c = cD;
      data.positions[this.m_indexD].a=aD;// TODO_ERIN not implemented
      return linearError<b2_linearSlop;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// b2Vec2 P = m_impulse * m_JvAC;
      // return inv_dt * P;
      return b2Vec2.MulSV(inv_dt*this.m_impulse,this.m_JvAC,out);}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){// float32 L = m_impulse * m_JwA;
      // return inv_dt * L;
      return inv_dt*this.m_impulse*this.m_JwA;}},{key:"GetJoint1",value:function GetJoint1(){return this.m_joint1;}},{key:"GetJoint2",value:function GetJoint2(){return this.m_joint2;}},{key:"GetRatio",value:function GetRatio(){return this.m_ratio;}},{key:"SetRatio",value:function SetRatio(ratio){// DEBUG: b2Assert(b2IsValid(ratio));
      this.m_ratio=ratio;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;var index1=this.m_joint1.m_index;var index2=this.m_joint2.m_index;log("  const jd: b2GearJointDef = new b2GearJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.joint1 = joints[%d];\n",index1);log("  jd.joint2 = joints[%d];\n",index2);log("  jd.ratio = %.15f;\n",this.m_ratio);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2GearJoint.InitVelocityConstraints_s_u=new b2Vec2();b2GearJoint.InitVelocityConstraints_s_rA=new b2Vec2();b2GearJoint.InitVelocityConstraints_s_rB=new b2Vec2();b2GearJoint.InitVelocityConstraints_s_rC=new b2Vec2();b2GearJoint.InitVelocityConstraints_s_rD=new b2Vec2();b2GearJoint.SolvePositionConstraints_s_u=new b2Vec2();b2GearJoint.SolvePositionConstraints_s_rA=new b2Vec2();b2GearJoint.SolvePositionConstraints_s_rB=new b2Vec2();b2GearJoint.SolvePositionConstraints_s_rC=new b2Vec2();b2GearJoint.SolvePositionConstraints_s_rD=new b2Vec2();/*
        * Copyright (c) 2006-2012 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2MotorJointDef=/*#__PURE__*/function(_b2JointDef5){function b2MotorJointDef(){var _this12;_classCallCheck(this,b2MotorJointDef);_this12=_callSuper(this,b2MotorJointDef,[exports.b2JointType.e_motorJoint]);_this12.linearOffset=new b2Vec2(0,0);_this12.angularOffset=0;_this12.maxForce=1;_this12.maxTorque=1;_this12.correctionFactor=0.3;return _this12;}_inherits(b2MotorJointDef,_b2JointDef5);return _createClass(b2MotorJointDef,[{key:"Initialize",value:function Initialize(bA,bB){this.bodyA=bA;this.bodyB=bB;// b2Vec2 xB = bodyB->GetPosition();
      // linearOffset = bodyA->GetLocalPoint(xB);
      this.bodyA.GetLocalPoint(this.bodyB.GetPosition(),this.linearOffset);var angleA=this.bodyA.GetAngle();var angleB=this.bodyB.GetAngle();this.angularOffset=angleB-angleA;}}]);}(b2JointDef);var b2MotorJoint=/*#__PURE__*/function(_b2Joint5){function b2MotorJoint(def){var _this13;_classCallCheck(this,b2MotorJoint);_this13=_callSuper(this,b2MotorJoint,[def]);// Solver shared
      _this13.m_linearOffset=new b2Vec2();_this13.m_angularOffset=0;_this13.m_linearImpulse=new b2Vec2();_this13.m_angularImpulse=0;_this13.m_maxForce=0;_this13.m_maxTorque=0;_this13.m_correctionFactor=0.3;// Solver temp
      _this13.m_indexA=0;_this13.m_indexB=0;_this13.m_rA=new b2Vec2();_this13.m_rB=new b2Vec2();_this13.m_localCenterA=new b2Vec2();_this13.m_localCenterB=new b2Vec2();_this13.m_linearError=new b2Vec2();_this13.m_angularError=0;_this13.m_invMassA=0;_this13.m_invMassB=0;_this13.m_invIA=0;_this13.m_invIB=0;_this13.m_linearMass=new b2Mat22();_this13.m_angularMass=0;_this13.m_qA=new b2Rot();_this13.m_qB=new b2Rot();_this13.m_K=new b2Mat22();_this13.m_linearOffset.Copy(b2Maybe(def.linearOffset,b2Vec2.ZERO));_this13.m_linearImpulse.SetZero();_this13.m_maxForce=b2Maybe(def.maxForce,0);_this13.m_maxTorque=b2Maybe(def.maxTorque,0);_this13.m_correctionFactor=b2Maybe(def.correctionFactor,0.3);return _this13;}_inherits(b2MotorJoint,_b2Joint5);return _createClass(b2MotorJoint,[{key:"GetAnchorA",value:function GetAnchorA(out){var pos=this.m_bodyA.GetPosition();out.x=pos.x;out.y=pos.y;return out;}},{key:"GetAnchorB",value:function GetAnchorB(out){var pos=this.m_bodyB.GetPosition();out.x=pos.x;out.y=pos.y;return out;}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// return inv_dt * m_linearImpulse;
      return b2Vec2.MulSV(inv_dt,this.m_linearImpulse,out);}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return inv_dt*this.m_angularImpulse;}},{key:"SetLinearOffset",value:function SetLinearOffset(linearOffset){if(!b2Vec2.IsEqualToV(linearOffset,this.m_linearOffset)){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_linearOffset.Copy(linearOffset);}}},{key:"GetLinearOffset",value:function GetLinearOffset(){return this.m_linearOffset;}},{key:"SetAngularOffset",value:function SetAngularOffset(angularOffset){if(angularOffset!==this.m_angularOffset){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_angularOffset=angularOffset;}}},{key:"GetAngularOffset",value:function GetAngularOffset(){return this.m_angularOffset;}},{key:"SetMaxForce",value:function SetMaxForce(force){// DEBUG: b2Assert(b2IsValid(force) && force >= 0);
      this.m_maxForce=force;}},{key:"GetMaxForce",value:function GetMaxForce(){return this.m_maxForce;}},{key:"SetMaxTorque",value:function SetMaxTorque(torque){// DEBUG: b2Assert(b2IsValid(torque) && torque >= 0);
      this.m_maxTorque=torque;}},{key:"GetMaxTorque",value:function GetMaxTorque(){return this.m_maxTorque;}},{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// Compute the effective mass matrix.
      // this.m_rA = b2Mul(qA, m_linearOffset - this.m_localCenterA);
      var rA=b2Rot.MulRV(qA,b2Vec2.SubVV(this.m_linearOffset,this.m_localCenterA,b2Vec2.s_t0),this.m_rA);// this.m_rB = b2Mul(qB, -this.m_localCenterB);
      var rB=b2Rot.MulRV(qB,b2Vec2.NegV(this.m_localCenterB,b2Vec2.s_t0),this.m_rB);// J = [-I -r1_skew I r2_skew]
      // r_skew = [-ry; rx]
      // Matlab
      // K = [ mA+r1y^2*iA+mB+r2y^2*iB,  -r1y*iA*r1x-r2y*iB*r2x,          -r1y*iA-r2y*iB]
      //     [  -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB,           r1x*iA+r2x*iB]
      //     [          -r1y*iA-r2y*iB,           r1x*iA+r2x*iB,                   iA+iB]
      var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;// Upper 2 by 2 of K for point to point
      var K=this.m_K;K.ex.x=mA+mB+iA*rA.y*rA.y+iB*rB.y*rB.y;K.ex.y=-iA*rA.x*rA.y-iB*rB.x*rB.y;K.ey.x=K.ex.y;K.ey.y=mA+mB+iA*rA.x*rA.x+iB*rB.x*rB.x;// this.m_linearMass = K.GetInverse();
      K.GetInverse(this.m_linearMass);this.m_angularMass=iA+iB;if(this.m_angularMass>0){this.m_angularMass=1/this.m_angularMass;}// this.m_linearError = cB + rB - cA - rA;
      b2Vec2.SubVV(b2Vec2.AddVV(cB,rB,b2Vec2.s_t0),b2Vec2.AddVV(cA,rA,b2Vec2.s_t1),this.m_linearError);this.m_angularError=aB-aA-this.m_angularOffset;if(data.step.warmStarting){// Scale impulses to support a variable time step.
      // this.m_linearImpulse *= data.step.dtRatio;
      this.m_linearImpulse.SelfMul(data.step.dtRatio);this.m_angularImpulse*=data.step.dtRatio;// b2Vec2 P(this.m_linearImpulse.x, this.m_linearImpulse.y);
      var P=this.m_linearImpulse;// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*(b2Vec2.CrossVV(rA,P)+this.m_angularImpulse);// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*(b2Vec2.CrossVV(rB,P)+this.m_angularImpulse);}else {this.m_linearImpulse.SetZero();this.m_angularImpulse=0;}// data.velocities[this.m_indexA].v = vA; // vA is a reference
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB; // vB is a reference
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var h=data.step.dt;var inv_h=data.step.inv_dt;// Solve angular friction
      {var Cdot=wB-wA+inv_h*this.m_correctionFactor*this.m_angularError;var impulse=-this.m_angularMass*Cdot;var oldImpulse=this.m_angularImpulse;var maxImpulse=h*this.m_maxTorque;this.m_angularImpulse=b2Clamp(this.m_angularImpulse+impulse,-maxImpulse,maxImpulse);impulse=this.m_angularImpulse-oldImpulse;wA-=iA*impulse;wB+=iB*impulse;}// Solve linear friction
      {var rA=this.m_rA;var rB=this.m_rB;// b2Vec2 Cdot = vB + b2Vec2.CrossSV(wB, rB) - vA - b2Vec2.CrossSV(wA, rA) + inv_h * this.m_correctionFactor * this.m_linearError;
      var Cdot_v2=b2Vec2.AddVV(b2Vec2.SubVV(b2Vec2.AddVV(vB,b2Vec2.CrossSV(wB,rB,b2Vec2.s_t0),b2Vec2.s_t0),b2Vec2.AddVV(vA,b2Vec2.CrossSV(wA,rA,b2Vec2.s_t1),b2Vec2.s_t1),b2Vec2.s_t2),b2Vec2.MulSV(inv_h*this.m_correctionFactor,this.m_linearError,b2Vec2.s_t3),b2MotorJoint.SolveVelocityConstraints_s_Cdot_v2);// b2Vec2 impulse = -b2Mul(this.m_linearMass, Cdot);
      var impulse_v2=b2Mat22.MulMV(this.m_linearMass,Cdot_v2,b2MotorJoint.SolveVelocityConstraints_s_impulse_v2).SelfNeg();// b2Vec2 oldImpulse = this.m_linearImpulse;
      var oldImpulse_v2=b2MotorJoint.SolveVelocityConstraints_s_oldImpulse_v2.Copy(this.m_linearImpulse);// this.m_linearImpulse += impulse;
      this.m_linearImpulse.SelfAdd(impulse_v2);var _maxImpulse2=h*this.m_maxForce;if(this.m_linearImpulse.LengthSquared()>_maxImpulse2*_maxImpulse2){this.m_linearImpulse.Normalize();// this.m_linearImpulse *= maxImpulse;
      this.m_linearImpulse.SelfMul(_maxImpulse2);}// impulse = this.m_linearImpulse - oldImpulse;
      b2Vec2.SubVV(this.m_linearImpulse,oldImpulse_v2,impulse_v2);// vA -= mA * impulse;
      vA.SelfMulSub(mA,impulse_v2);// wA -= iA * b2Vec2.CrossVV(rA, impulse);
      wA-=iA*b2Vec2.CrossVV(rA,impulse_v2);// vB += mB * impulse;
      vB.SelfMulAdd(mB,impulse_v2);// wB += iB * b2Vec2.CrossVV(rB, impulse);
      wB+=iB*b2Vec2.CrossVV(rB,impulse_v2);}// data.velocities[this.m_indexA].v = vA; // vA is a reference
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB; // vB is a reference
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){return true;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2MotorJointDef = new b2MotorJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.linearOffset.Set(%.15f, %.15f);\n",this.m_linearOffset.x,this.m_linearOffset.y);log("  jd.angularOffset = %.15f;\n",this.m_angularOffset);log("  jd.maxForce = %.15f;\n",this.m_maxForce);log("  jd.maxTorque = %.15f;\n",this.m_maxTorque);log("  jd.correctionFactor = %.15f;\n",this.m_correctionFactor);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2MotorJoint.SolveVelocityConstraints_s_Cdot_v2=new b2Vec2();b2MotorJoint.SolveVelocityConstraints_s_impulse_v2=new b2Vec2();b2MotorJoint.SolveVelocityConstraints_s_oldImpulse_v2=new b2Vec2();/*
        * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Mouse joint definition. This requires a world target point,
      /// tuning parameters, and the time step.
      var b2MouseJointDef=/*#__PURE__*/function(_b2JointDef6){function b2MouseJointDef(){var _this14;_classCallCheck(this,b2MouseJointDef);_this14=_callSuper(this,b2MouseJointDef,[exports.b2JointType.e_mouseJoint]);_this14.target=new b2Vec2();_this14.maxForce=0;_this14.frequencyHz=5;_this14.dampingRatio=0.7;return _this14;}_inherits(b2MouseJointDef,_b2JointDef6);return _createClass(b2MouseJointDef);}(b2JointDef);var b2MouseJoint=/*#__PURE__*/function(_b2Joint6){function b2MouseJoint(def){var _this15;_classCallCheck(this,b2MouseJoint);_this15=_callSuper(this,b2MouseJoint,[def]);_this15.m_localAnchorB=new b2Vec2();_this15.m_targetA=new b2Vec2();_this15.m_frequencyHz=0;_this15.m_dampingRatio=0;_this15.m_beta=0;// Solver shared
      _this15.m_impulse=new b2Vec2();_this15.m_maxForce=0;_this15.m_gamma=0;// Solver temp
      _this15.m_indexA=0;_this15.m_indexB=0;_this15.m_rB=new b2Vec2();_this15.m_localCenterB=new b2Vec2();_this15.m_invMassB=0;_this15.m_invIB=0;_this15.m_mass=new b2Mat22();_this15.m_C=new b2Vec2();_this15.m_qB=new b2Rot();_this15.m_lalcB=new b2Vec2();_this15.m_K=new b2Mat22();_this15.m_targetA.Copy(b2Maybe(def.target,b2Vec2.ZERO));// DEBUG: b2Assert(this.m_targetA.IsValid());
      b2Transform.MulTXV(_this15.m_bodyB.GetTransform(),_this15.m_targetA,_this15.m_localAnchorB);_this15.m_maxForce=b2Maybe(def.maxForce,0);// DEBUG: b2Assert(b2IsValid(this.m_maxForce) && this.m_maxForce >= 0);
      _this15.m_impulse.SetZero();_this15.m_frequencyHz=b2Maybe(def.frequencyHz,0);// DEBUG: b2Assert(b2IsValid(this.m_frequencyHz) && this.m_frequencyHz >= 0);
      _this15.m_dampingRatio=b2Maybe(def.dampingRatio,0);// DEBUG: b2Assert(b2IsValid(this.m_dampingRatio) && this.m_dampingRatio >= 0);
      _this15.m_beta=0;_this15.m_gamma=0;return _this15;}_inherits(b2MouseJoint,_b2Joint6);return _createClass(b2MouseJoint,[{key:"SetTarget",value:function SetTarget(target){if(!this.m_bodyB.IsAwake()){this.m_bodyB.SetAwake(true);}this.m_targetA.Copy(target);}},{key:"GetTarget",value:function GetTarget(){return this.m_targetA;}},{key:"SetMaxForce",value:function SetMaxForce(maxForce){this.m_maxForce=maxForce;}},{key:"GetMaxForce",value:function GetMaxForce(){return this.m_maxForce;}},{key:"SetFrequency",value:function SetFrequency(hz){this.m_frequencyHz=hz;}},{key:"GetFrequency",value:function GetFrequency(){return this.m_frequencyHz;}},{key:"SetDampingRatio",value:function SetDampingRatio(ratio){this.m_dampingRatio=ratio;}},{key:"GetDampingRatio",value:function GetDampingRatio(){return this.m_dampingRatio;}},{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIB=this.m_bodyB.m_invI;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var qB=this.m_qB.SetAngle(aB);var mass=this.m_bodyB.GetMass();// Frequency
      var omega=2*b2_pi*this.m_frequencyHz;// Damping coefficient
      var d=2*mass*this.m_dampingRatio*omega;// Spring stiffness
      var k=mass*(omega*omega);// magic formulas
      // gamma has units of inverse mass.
      // beta has units of inverse time.
      var h=data.step.dt;// DEBUG: b2Assert(d + h * k > b2_epsilon);
      this.m_gamma=h*(d+h*k);if(this.m_gamma!==0){this.m_gamma=1/this.m_gamma;}this.m_beta=h*k*this.m_gamma;// Compute the effective mass matrix.
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// K    = [(1/m1 + 1/m2) * eye(2) - skew(r1) * invI1 * skew(r1) - skew(r2) * invI2 * skew(r2)]
      //      = [1/m1+1/m2     0    ] + invI1 * [r1.y*r1.y -r1.x*r1.y] + invI2 * [r1.y*r1.y -r1.x*r1.y]
      //        [    0     1/m1+1/m2]           [-r1.x*r1.y r1.x*r1.x]           [-r1.x*r1.y r1.x*r1.x]
      var K=this.m_K;K.ex.x=this.m_invMassB+this.m_invIB*this.m_rB.y*this.m_rB.y+this.m_gamma;K.ex.y=-this.m_invIB*this.m_rB.x*this.m_rB.y;K.ey.x=K.ex.y;K.ey.y=this.m_invMassB+this.m_invIB*this.m_rB.x*this.m_rB.x+this.m_gamma;K.GetInverse(this.m_mass);// m_C = cB + m_rB - m_targetA;
      this.m_C.x=cB.x+this.m_rB.x-this.m_targetA.x;this.m_C.y=cB.y+this.m_rB.y-this.m_targetA.y;// m_C *= m_beta;
      this.m_C.SelfMul(this.m_beta);// Cheat with some damping
      wB*=0.98;if(data.step.warmStarting){this.m_impulse.SelfMul(data.step.dtRatio);// vB += m_invMassB * m_impulse;
      vB.x+=this.m_invMassB*this.m_impulse.x;vB.y+=this.m_invMassB*this.m_impulse.y;wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,this.m_impulse);}else {this.m_impulse.SetZero();}// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// Cdot = v + cross(w, r)
      // b2Vec2 Cdot = vB + b2Cross(wB, m_rB);
      var Cdot=b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2MouseJoint.SolveVelocityConstraints_s_Cdot);//  b2Vec2 impulse = b2Mul(m_mass, -(Cdot + m_C + m_gamma * m_impulse));
      var impulse=b2Mat22.MulMV(this.m_mass,b2Vec2.AddVV(Cdot,b2Vec2.AddVV(this.m_C,b2Vec2.MulSV(this.m_gamma,this.m_impulse,b2Vec2.s_t0),b2Vec2.s_t0),b2Vec2.s_t0).SelfNeg(),b2MouseJoint.SolveVelocityConstraints_s_impulse);// b2Vec2 oldImpulse = m_impulse;
      var oldImpulse=b2MouseJoint.SolveVelocityConstraints_s_oldImpulse.Copy(this.m_impulse);// m_impulse += impulse;
      this.m_impulse.SelfAdd(impulse);var maxImpulse=data.step.dt*this.m_maxForce;if(this.m_impulse.LengthSquared()>maxImpulse*maxImpulse){this.m_impulse.SelfMul(maxImpulse/this.m_impulse.Length());}// impulse = m_impulse - oldImpulse;
      b2Vec2.SubVV(this.m_impulse,oldImpulse,impulse);// vB += m_invMassB * impulse;
      vB.SelfMulAdd(this.m_invMassB,impulse);wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,impulse);// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){return true;}},{key:"GetAnchorA",value:function GetAnchorA(out){out.x=this.m_targetA.x;out.y=this.m_targetA.y;return out;}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){return b2Vec2.MulSV(inv_dt,this.m_impulse,out);}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return 0;}},{key:"Dump",value:function Dump(log){log("Mouse joint dumping is not supported.\n");}},{key:"ShiftOrigin",value:function ShiftOrigin(newOrigin){this.m_targetA.SelfSub(newOrigin);}}]);}(b2Joint);b2MouseJoint.SolveVelocityConstraints_s_Cdot=new b2Vec2();b2MouseJoint.SolveVelocityConstraints_s_impulse=new b2Vec2();b2MouseJoint.SolveVelocityConstraints_s_oldImpulse=new b2Vec2();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Prismatic joint definition. This requires defining a line of
      /// motion using an axis and an anchor point. The definition uses local
      /// anchor points and a local axis so that the initial configuration
      /// can violate the constraint slightly. The joint translation is zero
      /// when the local anchor points coincide in world space. Using local
      /// anchors and a local axis helps when saving and loading a game.
      var b2PrismaticJointDef=/*#__PURE__*/function(_b2JointDef7){function b2PrismaticJointDef(){var _this16;_classCallCheck(this,b2PrismaticJointDef);_this16=_callSuper(this,b2PrismaticJointDef,[exports.b2JointType.e_prismaticJoint]);_this16.localAnchorA=new b2Vec2();_this16.localAnchorB=new b2Vec2();_this16.localAxisA=new b2Vec2(1,0);_this16.referenceAngle=0;_this16.enableLimit=false;_this16.lowerTranslation=0;_this16.upperTranslation=0;_this16.enableMotor=false;_this16.maxMotorForce=0;_this16.motorSpeed=0;return _this16;}_inherits(b2PrismaticJointDef,_b2JointDef7);return _createClass(b2PrismaticJointDef,[{key:"Initialize",value:function Initialize(bA,bB,anchor,axis){this.bodyA=bA;this.bodyB=bB;this.bodyA.GetLocalPoint(anchor,this.localAnchorA);this.bodyB.GetLocalPoint(anchor,this.localAnchorB);this.bodyA.GetLocalVector(axis,this.localAxisA);this.referenceAngle=this.bodyB.GetAngle()-this.bodyA.GetAngle();}}]);}(b2JointDef);var b2PrismaticJoint=/*#__PURE__*/function(_b2Joint7){function b2PrismaticJoint(def){var _this17;_classCallCheck(this,b2PrismaticJoint);_this17=_callSuper(this,b2PrismaticJoint,[def]);// Solver shared
      _this17.m_localAnchorA=new b2Vec2();_this17.m_localAnchorB=new b2Vec2();_this17.m_localXAxisA=new b2Vec2();_this17.m_localYAxisA=new b2Vec2();_this17.m_referenceAngle=0;_this17.m_impulse=new b2Vec3(0,0,0);_this17.m_motorImpulse=0;_this17.m_lowerTranslation=0;_this17.m_upperTranslation=0;_this17.m_maxMotorForce=0;_this17.m_motorSpeed=0;_this17.m_enableLimit=false;_this17.m_enableMotor=false;_this17.m_limitState=exports.b2LimitState.e_inactiveLimit;// Solver temp
      _this17.m_indexA=0;_this17.m_indexB=0;_this17.m_localCenterA=new b2Vec2();_this17.m_localCenterB=new b2Vec2();_this17.m_invMassA=0;_this17.m_invMassB=0;_this17.m_invIA=0;_this17.m_invIB=0;_this17.m_axis=new b2Vec2(0,0);_this17.m_perp=new b2Vec2(0,0);_this17.m_s1=0;_this17.m_s2=0;_this17.m_a1=0;_this17.m_a2=0;_this17.m_K=new b2Mat33();_this17.m_K3=new b2Mat33();_this17.m_K2=new b2Mat22();_this17.m_motorMass=0;_this17.m_qA=new b2Rot();_this17.m_qB=new b2Rot();_this17.m_lalcA=new b2Vec2();_this17.m_lalcB=new b2Vec2();_this17.m_rA=new b2Vec2();_this17.m_rB=new b2Vec2();_this17.m_localAnchorA.Copy(b2Maybe(def.localAnchorA,b2Vec2.ZERO));_this17.m_localAnchorB.Copy(b2Maybe(def.localAnchorB,b2Vec2.ZERO));_this17.m_localXAxisA.Copy(b2Maybe(def.localAxisA,new b2Vec2(1,0))).SelfNormalize();b2Vec2.CrossOneV(_this17.m_localXAxisA,_this17.m_localYAxisA);_this17.m_referenceAngle=b2Maybe(def.referenceAngle,0);_this17.m_lowerTranslation=b2Maybe(def.lowerTranslation,0);_this17.m_upperTranslation=b2Maybe(def.upperTranslation,0);_this17.m_maxMotorForce=b2Maybe(def.maxMotorForce,0);_this17.m_motorSpeed=b2Maybe(def.motorSpeed,0);_this17.m_enableLimit=b2Maybe(def.enableLimit,false);_this17.m_enableMotor=b2Maybe(def.enableMotor,false);return _this17;}_inherits(b2PrismaticJoint,_b2Joint7);return _createClass(b2PrismaticJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// Compute the effective masses.
      // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// b2Vec2 d = (cB - cA) + rB - rA;
      var d=b2Vec2.AddVV(b2Vec2.SubVV(cB,cA,b2Vec2.s_t0),b2Vec2.SubVV(rB,rA,b2Vec2.s_t1),b2PrismaticJoint.InitVelocityConstraints_s_d);var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;// Compute motor Jacobian and effective mass.
      {// m_axis = b2Mul(qA, m_localXAxisA);
      b2Rot.MulRV(qA,this.m_localXAxisA,this.m_axis);// m_a1 = b2Cross(d + rA, m_axis);
      this.m_a1=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),this.m_axis);// m_a2 = b2Cross(rB, m_axis);
      this.m_a2=b2Vec2.CrossVV(rB,this.m_axis);this.m_motorMass=mA+mB+iA*this.m_a1*this.m_a1+iB*this.m_a2*this.m_a2;if(this.m_motorMass>0){this.m_motorMass=1/this.m_motorMass;}}// Prismatic constraint.
      {// m_perp = b2Mul(qA, m_localYAxisA);
      b2Rot.MulRV(qA,this.m_localYAxisA,this.m_perp);// m_s1 = b2Cross(d + rA, m_perp);
      this.m_s1=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),this.m_perp);// m_s2 = b2Cross(rB, m_perp);
      this.m_s2=b2Vec2.CrossVV(rB,this.m_perp);// float32 k11 = mA + mB + iA * m_s1 * m_s1 + iB * m_s2 * m_s2;
      this.m_K.ex.x=mA+mB+iA*this.m_s1*this.m_s1+iB*this.m_s2*this.m_s2;// float32 k12 = iA * m_s1 + iB * m_s2;
      this.m_K.ex.y=iA*this.m_s1+iB*this.m_s2;// float32 k13 = iA * m_s1 * m_a1 + iB * m_s2 * m_a2;
      this.m_K.ex.z=iA*this.m_s1*this.m_a1+iB*this.m_s2*this.m_a2;this.m_K.ey.x=this.m_K.ex.y;// float32 k22 = iA + iB;
      this.m_K.ey.y=iA+iB;if(this.m_K.ey.y===0){// For bodies with fixed rotation.
      this.m_K.ey.y=1;}// float32 k23 = iA * m_a1 + iB * m_a2;
      this.m_K.ey.z=iA*this.m_a1+iB*this.m_a2;this.m_K.ez.x=this.m_K.ex.z;this.m_K.ez.y=this.m_K.ey.z;// float32 k33 = mA + mB + iA * m_a1 * m_a1 + iB * m_a2 * m_a2;
      this.m_K.ez.z=mA+mB+iA*this.m_a1*this.m_a1+iB*this.m_a2*this.m_a2;// m_K.ex.Set(k11, k12, k13);
      // m_K.ey.Set(k12, k22, k23);
      // m_K.ez.Set(k13, k23, k33);
      }// Compute motor and limit terms.
      if(this.m_enableLimit){// float32 jointTranslation = b2Dot(m_axis, d);
      var jointTranslation=b2Vec2.DotVV(this.m_axis,d);if(b2Abs(this.m_upperTranslation-this.m_lowerTranslation)<2*b2_linearSlop){this.m_limitState=exports.b2LimitState.e_equalLimits;}else if(jointTranslation<=this.m_lowerTranslation){if(this.m_limitState!==exports.b2LimitState.e_atLowerLimit){this.m_limitState=exports.b2LimitState.e_atLowerLimit;this.m_impulse.z=0;}}else if(jointTranslation>=this.m_upperTranslation){if(this.m_limitState!==exports.b2LimitState.e_atUpperLimit){this.m_limitState=exports.b2LimitState.e_atUpperLimit;this.m_impulse.z=0;}}else {this.m_limitState=exports.b2LimitState.e_inactiveLimit;this.m_impulse.z=0;}}else {this.m_limitState=exports.b2LimitState.e_inactiveLimit;this.m_impulse.z=0;}if(!this.m_enableMotor){this.m_motorImpulse=0;}if(data.step.warmStarting){// Account for variable time step.
      // m_impulse *= data.step.dtRatio;
      this.m_impulse.SelfMul(data.step.dtRatio);this.m_motorImpulse*=data.step.dtRatio;// b2Vec2 P = m_impulse.x * m_perp + (m_motorImpulse + m_impulse.z) * m_axis;
      var P=b2Vec2.AddVV(b2Vec2.MulSV(this.m_impulse.x,this.m_perp,b2Vec2.s_t0),b2Vec2.MulSV(this.m_motorImpulse+this.m_impulse.z,this.m_axis,b2Vec2.s_t1),b2PrismaticJoint.InitVelocityConstraints_s_P);// float32 LA = m_impulse.x * m_s1 + m_impulse.y + (m_motorImpulse + m_impulse.z) * m_a1;
      var LA=this.m_impulse.x*this.m_s1+this.m_impulse.y+(this.m_motorImpulse+this.m_impulse.z)*this.m_a1;// float32 LB = m_impulse.x * m_s2 + m_impulse.y + (m_motorImpulse + m_impulse.z) * m_a2;
      var LB=this.m_impulse.x*this.m_s2+this.m_impulse.y+(this.m_motorImpulse+this.m_impulse.z)*this.m_a2;// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*LA;// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*LB;}else {this.m_impulse.SetZero();this.m_motorImpulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;// Solve linear motor constraint.
      if(this.m_enableMotor&&this.m_limitState!==exports.b2LimitState.e_equalLimits){// float32 Cdot = b2Dot(m_axis, vB - vA) + m_a2 * wB - m_a1 * wA;
      var Cdot=b2Vec2.DotVV(this.m_axis,b2Vec2.SubVV(vB,vA,b2Vec2.s_t0))+this.m_a2*wB-this.m_a1*wA;var impulse=this.m_motorMass*(this.m_motorSpeed-Cdot);var oldImpulse=this.m_motorImpulse;var maxImpulse=data.step.dt*this.m_maxMotorForce;this.m_motorImpulse=b2Clamp(this.m_motorImpulse+impulse,-maxImpulse,maxImpulse);impulse=this.m_motorImpulse-oldImpulse;// b2Vec2 P = impulse * m_axis;
      var P=b2Vec2.MulSV(impulse,this.m_axis,b2PrismaticJoint.SolveVelocityConstraints_s_P);var LA=impulse*this.m_a1;var LB=impulse*this.m_a2;// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*LA;// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*LB;}// b2Vec2 Cdot1;
      // Cdot1.x = b2Dot(m_perp, vB - vA) + m_s2 * wB - m_s1 * wA;
      var Cdot1_x=b2Vec2.DotVV(this.m_perp,b2Vec2.SubVV(vB,vA,b2Vec2.s_t0))+this.m_s2*wB-this.m_s1*wA;// Cdot1.y = wB - wA;
      var Cdot1_y=wB-wA;if(this.m_enableLimit&&this.m_limitState!==exports.b2LimitState.e_inactiveLimit){// Solve prismatic and limit constraint in block form.
      // float32 Cdot2;
      // Cdot2 = b2Dot(m_axis, vB - vA) + m_a2 * wB - m_a1 * wA;
      var Cdot2=b2Vec2.DotVV(this.m_axis,b2Vec2.SubVV(vB,vA,b2Vec2.s_t0))+this.m_a2*wB-this.m_a1*wA;// b2Vec3 Cdot(Cdot1.x, Cdot1.y, Cdot2);
      // b2Vec3 f1 = m_impulse;
      var f1=b2PrismaticJoint.SolveVelocityConstraints_s_f1.Copy(this.m_impulse);// b2Vec3 df =  m_K.Solve33(-Cdot);
      var df3=this.m_K.Solve33(-Cdot1_x,-Cdot1_y,-Cdot2,b2PrismaticJoint.SolveVelocityConstraints_s_df3);// m_impulse += df;
      this.m_impulse.SelfAdd(df3);if(this.m_limitState===exports.b2LimitState.e_atLowerLimit){this.m_impulse.z=b2Max(this.m_impulse.z,0);}else if(this.m_limitState===exports.b2LimitState.e_atUpperLimit){this.m_impulse.z=b2Min(this.m_impulse.z,0);}// f2(1:2) = invK(1:2,1:2) * (-Cdot(1:2) - K(1:2,3) * (f2(3) - f1(3))) + f1(1:2)
      // b2Vec2 b = -Cdot1 - (m_impulse.z - f1.z) * b2Vec2(m_K.ez.x, m_K.ez.y);
      var b_x=-Cdot1_x-(this.m_impulse.z-f1.z)*this.m_K.ez.x;var b_y=-Cdot1_y-(this.m_impulse.z-f1.z)*this.m_K.ez.y;// b2Vec2 f2r = m_K.Solve22(b) + b2Vec2(f1.x, f1.y);
      var f2r=this.m_K.Solve22(b_x,b_y,b2PrismaticJoint.SolveVelocityConstraints_s_f2r);f2r.x+=f1.x;f2r.y+=f1.y;// m_impulse.x = f2r.x;
      this.m_impulse.x=f2r.x;// m_impulse.y = f2r.y;
      this.m_impulse.y=f2r.y;// df = m_impulse - f1;
      df3.x=this.m_impulse.x-f1.x;df3.y=this.m_impulse.y-f1.y;df3.z=this.m_impulse.z-f1.z;// b2Vec2 P = df.x * m_perp + df.z * m_axis;
      var _P3=b2Vec2.AddVV(b2Vec2.MulSV(df3.x,this.m_perp,b2Vec2.s_t0),b2Vec2.MulSV(df3.z,this.m_axis,b2Vec2.s_t1),b2PrismaticJoint.SolveVelocityConstraints_s_P);// float32 LA = df.x * m_s1 + df.y + df.z * m_a1;
      var _LA=df3.x*this.m_s1+df3.y+df3.z*this.m_a1;// float32 LB = df.x * m_s2 + df.y + df.z * m_a2;
      var _LB=df3.x*this.m_s2+df3.y+df3.z*this.m_a2;// vA -= mA * P;
      vA.SelfMulSub(mA,_P3);wA-=iA*_LA;// vB += mB * P;
      vB.SelfMulAdd(mB,_P3);wB+=iB*_LB;}else {// Limit is inactive, just solve the prismatic constraint in block form.
      // b2Vec2 df = m_K.Solve22(-Cdot1);
      var df2=this.m_K.Solve22(-Cdot1_x,-Cdot1_y,b2PrismaticJoint.SolveVelocityConstraints_s_df2);this.m_impulse.x+=df2.x;this.m_impulse.y+=df2.y;// b2Vec2 P = df.x * m_perp;
      var _P4=b2Vec2.MulSV(df2.x,this.m_perp,b2PrismaticJoint.SolveVelocityConstraints_s_P);// float32 LA = df.x * m_s1 + df.y;
      var _LA2=df2.x*this.m_s1+df2.y;// float32 LB = df.x * m_s2 + df.y;
      var _LB2=df2.x*this.m_s2+df2.y;// vA -= mA * P;
      vA.SelfMulSub(mA,_P4);wA-=iA*_LA2;// vB += mB * P;
      vB.SelfMulAdd(mB,_P4);wB+=iB*_LB2;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// b2Vec2 d = cB + rB - cA - rA;
      var d=b2Vec2.SubVV(b2Vec2.AddVV(cB,rB,b2Vec2.s_t0),b2Vec2.AddVV(cA,rA,b2Vec2.s_t1),b2PrismaticJoint.SolvePositionConstraints_s_d);// b2Vec2 axis = b2Mul(qA, m_localXAxisA);
      var axis=b2Rot.MulRV(qA,this.m_localXAxisA,this.m_axis);// float32 a1 = b2Cross(d + rA, axis);
      var a1=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),axis);// float32 a2 = b2Cross(rB, axis);
      var a2=b2Vec2.CrossVV(rB,axis);// b2Vec2 perp = b2Mul(qA, m_localYAxisA);
      var perp=b2Rot.MulRV(qA,this.m_localYAxisA,this.m_perp);// float32 s1 = b2Cross(d + rA, perp);
      var s1=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),perp);// float32 s2 = b2Cross(rB, perp);
      var s2=b2Vec2.CrossVV(rB,perp);// b2Vec3 impulse;
      var impulse=b2PrismaticJoint.SolvePositionConstraints_s_impulse;// b2Vec2 C1;
      // C1.x = b2Dot(perp, d);
      var C1_x=b2Vec2.DotVV(perp,d);// C1.y = aB - aA - m_referenceAngle;
      var C1_y=aB-aA-this.m_referenceAngle;var linearError=b2Abs(C1_x);var angularError=b2Abs(C1_y);var active=false;var C2=0;if(this.m_enableLimit){// float32 translation = b2Dot(axis, d);
      var translation=b2Vec2.DotVV(axis,d);if(b2Abs(this.m_upperTranslation-this.m_lowerTranslation)<2*b2_linearSlop){// Prevent large angular corrections
      C2=b2Clamp(translation,-b2_maxLinearCorrection,b2_maxLinearCorrection);linearError=b2Max(linearError,b2Abs(translation));active=true;}else if(translation<=this.m_lowerTranslation){// Prevent large linear corrections and allow some slop.
      C2=b2Clamp(translation-this.m_lowerTranslation+b2_linearSlop,-b2_maxLinearCorrection,0);linearError=b2Max(linearError,this.m_lowerTranslation-translation);active=true;}else if(translation>=this.m_upperTranslation){// Prevent large linear corrections and allow some slop.
      C2=b2Clamp(translation-this.m_upperTranslation-b2_linearSlop,0,b2_maxLinearCorrection);linearError=b2Max(linearError,translation-this.m_upperTranslation);active=true;}}if(active){// float32 k11 = mA + mB + iA * s1 * s1 + iB * s2 * s2;
      var k11=mA+mB+iA*s1*s1+iB*s2*s2;// float32 k12 = iA * s1 + iB * s2;
      var k12=iA*s1+iB*s2;// float32 k13 = iA * s1 * a1 + iB * s2 * a2;
      var k13=iA*s1*a1+iB*s2*a2;// float32 k22 = iA + iB;
      var k22=iA+iB;if(k22===0){// For fixed rotation
      k22=1;}// float32 k23 = iA * a1 + iB * a2;
      var k23=iA*a1+iB*a2;// float32 k33 = mA + mB + iA * a1 * a1 + iB * a2 * a2;
      var k33=mA+mB+iA*a1*a1+iB*a2*a2;// b2Mat33 K;
      var K=this.m_K3;// K.ex.Set(k11, k12, k13);
      K.ex.SetXYZ(k11,k12,k13);// K.ey.Set(k12, k22, k23);
      K.ey.SetXYZ(k12,k22,k23);// K.ez.Set(k13, k23, k33);
      K.ez.SetXYZ(k13,k23,k33);// b2Vec3 C;
      // C.x = C1.x;
      // C.y = C1.y;
      // C.z = C2;
      // impulse = K.Solve33(-C);
      impulse=K.Solve33(-C1_x,-C1_y,-C2,impulse);}else {// float32 k11 = mA + mB + iA * s1 * s1 + iB * s2 * s2;
      var _k=mA+mB+iA*s1*s1+iB*s2*s2;// float32 k12 = iA * s1 + iB * s2;
      var _k2=iA*s1+iB*s2;// float32 k22 = iA + iB;
      var _k3=iA+iB;if(_k3===0){_k3=1;}// b2Mat22 K;
      var K2=this.m_K2;// K.ex.Set(k11, k12);
      K2.ex.Set(_k,_k2);// K.ey.Set(k12, k22);
      K2.ey.Set(_k2,_k3);// b2Vec2 impulse1 = K.Solve(-C1);
      var impulse1=K2.Solve(-C1_x,-C1_y,b2PrismaticJoint.SolvePositionConstraints_s_impulse1);impulse.x=impulse1.x;impulse.y=impulse1.y;impulse.z=0;}// b2Vec2 P = impulse.x * perp + impulse.z * axis;
      var P=b2Vec2.AddVV(b2Vec2.MulSV(impulse.x,perp,b2Vec2.s_t0),b2Vec2.MulSV(impulse.z,axis,b2Vec2.s_t1),b2PrismaticJoint.SolvePositionConstraints_s_P);// float32 LA = impulse.x * s1 + impulse.y + impulse.z * a1;
      var LA=impulse.x*s1+impulse.y+impulse.z*a1;// float32 LB = impulse.x * s2 + impulse.y + impulse.z * a2;
      var LB=impulse.x*s2+impulse.y+impulse.z*a2;// cA -= mA * P;
      cA.SelfMulSub(mA,P);aA-=iA*LA;// cB += mB * P;
      cB.SelfMulAdd(mB,P);aB+=iB*LB;// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return linearError<=b2_linearSlop&&angularError<=b2_angularSlop;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// return inv_dt * (m_impulse.x * m_perp + (m_motorImpulse + m_impulse.z) * m_axis);
      out.x=inv_dt*(this.m_impulse.x*this.m_perp.x+(this.m_motorImpulse+this.m_impulse.z)*this.m_axis.x);out.y=inv_dt*(this.m_impulse.x*this.m_perp.y+(this.m_motorImpulse+this.m_impulse.z)*this.m_axis.y);return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return inv_dt*this.m_impulse.y;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"GetLocalAxisA",value:function GetLocalAxisA(){return this.m_localXAxisA;}},{key:"GetReferenceAngle",value:function GetReferenceAngle(){return this.m_referenceAngle;}},{key:"GetJointTranslation",value:function GetJointTranslation(){// b2Vec2 pA = m_bodyA.GetWorldPoint(m_localAnchorA);
      var pA=this.m_bodyA.GetWorldPoint(this.m_localAnchorA,b2PrismaticJoint.GetJointTranslation_s_pA);// b2Vec2 pB = m_bodyB.GetWorldPoint(m_localAnchorB);
      var pB=this.m_bodyB.GetWorldPoint(this.m_localAnchorB,b2PrismaticJoint.GetJointTranslation_s_pB);// b2Vec2 d = pB - pA;
      var d=b2Vec2.SubVV(pB,pA,b2PrismaticJoint.GetJointTranslation_s_d);// b2Vec2 axis = m_bodyA.GetWorldVector(m_localXAxisA);
      var axis=this.m_bodyA.GetWorldVector(this.m_localXAxisA,b2PrismaticJoint.GetJointTranslation_s_axis);// float32 translation = b2Dot(d, axis);
      var translation=b2Vec2.DotVV(d,axis);return translation;}},{key:"GetJointSpeed",value:function GetJointSpeed(){var bA=this.m_bodyA;var bB=this.m_bodyB;// b2Vec2 rA = b2Mul(bA->m_xf.q, m_localAnchorA - bA->m_sweep.localCenter);
      b2Vec2.SubVV(this.m_localAnchorA,bA.m_sweep.localCenter,this.m_lalcA);var rA=b2Rot.MulRV(bA.m_xf.q,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(bB->m_xf.q, m_localAnchorB - bB->m_sweep.localCenter);
      b2Vec2.SubVV(this.m_localAnchorB,bB.m_sweep.localCenter,this.m_lalcB);var rB=b2Rot.MulRV(bB.m_xf.q,this.m_lalcB,this.m_rB);// b2Vec2 pA = bA->m_sweep.c + rA;
      var pA=b2Vec2.AddVV(bA.m_sweep.c,rA,b2Vec2.s_t0);// pA uses s_t0
      // b2Vec2 pB = bB->m_sweep.c + rB;
      var pB=b2Vec2.AddVV(bB.m_sweep.c,rB,b2Vec2.s_t1);// pB uses s_t1
      // b2Vec2 d = pB - pA;
      var d=b2Vec2.SubVV(pB,pA,b2Vec2.s_t2);// d uses s_t2
      // b2Vec2 axis = b2Mul(bA.m_xf.q, m_localXAxisA);
      var axis=bA.GetWorldVector(this.m_localXAxisA,this.m_axis);var vA=bA.m_linearVelocity;var vB=bB.m_linearVelocity;var wA=bA.m_angularVelocity;var wB=bB.m_angularVelocity;// float32 speed = b2Dot(d, b2Cross(wA, axis)) + b2Dot(axis, vB + b2Cross(wB, rB) - vA - b2Cross(wA, rA));
      var speed=b2Vec2.DotVV(d,b2Vec2.CrossSV(wA,axis,b2Vec2.s_t0))+b2Vec2.DotVV(axis,b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,rA,b2Vec2.s_t1),b2Vec2.s_t0));return speed;}},{key:"IsLimitEnabled",value:function IsLimitEnabled(){return this.m_enableLimit;}},{key:"EnableLimit",value:function EnableLimit(flag){if(flag!==this.m_enableLimit){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableLimit=flag;this.m_impulse.z=0;}}},{key:"GetLowerLimit",value:function GetLowerLimit(){return this.m_lowerTranslation;}},{key:"GetUpperLimit",value:function GetUpperLimit(){return this.m_upperTranslation;}},{key:"SetLimits",value:function SetLimits(lower,upper){if(lower!==this.m_lowerTranslation||upper!==this.m_upperTranslation){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_lowerTranslation=lower;this.m_upperTranslation=upper;this.m_impulse.z=0;}}},{key:"IsMotorEnabled",value:function IsMotorEnabled(){return this.m_enableMotor;}},{key:"EnableMotor",value:function EnableMotor(flag){if(flag!==this.m_enableMotor){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableMotor=flag;}}},{key:"SetMotorSpeed",value:function SetMotorSpeed(speed){if(speed!==this.m_motorSpeed){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_motorSpeed=speed;}}},{key:"GetMotorSpeed",value:function GetMotorSpeed(){return this.m_motorSpeed;}},{key:"SetMaxMotorForce",value:function SetMaxMotorForce(force){if(force!==this.m_maxMotorForce){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_maxMotorForce=force;}}},{key:"GetMaxMotorForce",value:function GetMaxMotorForce(){return this.m_maxMotorForce;}},{key:"GetMotorForce",value:function GetMotorForce(inv_dt){return inv_dt*this.m_motorImpulse;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2PrismaticJointDef = new b2PrismaticJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.localAxisA.Set(%.15f, %.15f);\n",this.m_localXAxisA.x,this.m_localXAxisA.y);log("  jd.referenceAngle = %.15f;\n",this.m_referenceAngle);log("  jd.enableLimit = %s;\n",this.m_enableLimit?"true":"false");log("  jd.lowerTranslation = %.15f;\n",this.m_lowerTranslation);log("  jd.upperTranslation = %.15f;\n",this.m_upperTranslation);log("  jd.enableMotor = %s;\n",this.m_enableMotor?"true":"false");log("  jd.motorSpeed = %.15f;\n",this.m_motorSpeed);log("  jd.maxMotorForce = %.15f;\n",this.m_maxMotorForce);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2PrismaticJoint.InitVelocityConstraints_s_d=new b2Vec2();b2PrismaticJoint.InitVelocityConstraints_s_P=new b2Vec2();b2PrismaticJoint.SolveVelocityConstraints_s_P=new b2Vec2();b2PrismaticJoint.SolveVelocityConstraints_s_f2r=new b2Vec2();b2PrismaticJoint.SolveVelocityConstraints_s_f1=new b2Vec3();b2PrismaticJoint.SolveVelocityConstraints_s_df3=new b2Vec3();b2PrismaticJoint.SolveVelocityConstraints_s_df2=new b2Vec2();// A velocity based solver computes reaction forces(impulses) using the velocity constraint solver.Under this context,
      // the position solver is not there to resolve forces.It is only there to cope with integration error.
      //
      // Therefore, the pseudo impulses in the position solver do not have any physical meaning.Thus it is okay if they suck.
      //
      // We could take the active state from the velocity solver.However, the joint might push past the limit when the velocity
      // solver indicates the limit is inactive.
      b2PrismaticJoint.SolvePositionConstraints_s_d=new b2Vec2();b2PrismaticJoint.SolvePositionConstraints_s_impulse=new b2Vec3();b2PrismaticJoint.SolvePositionConstraints_s_impulse1=new b2Vec2();b2PrismaticJoint.SolvePositionConstraints_s_P=new b2Vec2();b2PrismaticJoint.GetJointTranslation_s_pA=new b2Vec2();b2PrismaticJoint.GetJointTranslation_s_pB=new b2Vec2();b2PrismaticJoint.GetJointTranslation_s_d=new b2Vec2();b2PrismaticJoint.GetJointTranslation_s_axis=new b2Vec2();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2_minPulleyLength=2;/// Pulley joint definition. This requires two ground anchors,
      /// two dynamic body anchor points, and a pulley ratio.
      var b2PulleyJointDef=/*#__PURE__*/function(_b2JointDef8){function b2PulleyJointDef(){var _this18;_classCallCheck(this,b2PulleyJointDef);_this18=_callSuper(this,b2PulleyJointDef,[exports.b2JointType.e_pulleyJoint]);_this18.groundAnchorA=new b2Vec2(-1,1);_this18.groundAnchorB=new b2Vec2(1,1);_this18.localAnchorA=new b2Vec2(-1,0);_this18.localAnchorB=new b2Vec2(1,0);_this18.lengthA=0;_this18.lengthB=0;_this18.ratio=1;_this18.collideConnected=true;return _this18;}_inherits(b2PulleyJointDef,_b2JointDef8);return _createClass(b2PulleyJointDef,[{key:"Initialize",value:function Initialize(bA,bB,groundA,groundB,anchorA,anchorB,r){this.bodyA=bA;this.bodyB=bB;this.groundAnchorA.Copy(groundA);this.groundAnchorB.Copy(groundB);this.bodyA.GetLocalPoint(anchorA,this.localAnchorA);this.bodyB.GetLocalPoint(anchorB,this.localAnchorB);this.lengthA=b2Vec2.DistanceVV(anchorA,groundA);this.lengthB=b2Vec2.DistanceVV(anchorB,groundB);this.ratio=r;// DEBUG: b2Assert(this.ratio > b2_epsilon);
      }}]);}(b2JointDef);var b2PulleyJoint=/*#__PURE__*/function(_b2Joint8){function b2PulleyJoint(def){var _this19;_classCallCheck(this,b2PulleyJoint);_this19=_callSuper(this,b2PulleyJoint,[def]);_this19.m_groundAnchorA=new b2Vec2();_this19.m_groundAnchorB=new b2Vec2();_this19.m_lengthA=0;_this19.m_lengthB=0;// Solver shared
      _this19.m_localAnchorA=new b2Vec2();_this19.m_localAnchorB=new b2Vec2();_this19.m_constant=0;_this19.m_ratio=0;_this19.m_impulse=0;// Solver temp
      _this19.m_indexA=0;_this19.m_indexB=0;_this19.m_uA=new b2Vec2();_this19.m_uB=new b2Vec2();_this19.m_rA=new b2Vec2();_this19.m_rB=new b2Vec2();_this19.m_localCenterA=new b2Vec2();_this19.m_localCenterB=new b2Vec2();_this19.m_invMassA=0;_this19.m_invMassB=0;_this19.m_invIA=0;_this19.m_invIB=0;_this19.m_mass=0;_this19.m_qA=new b2Rot();_this19.m_qB=new b2Rot();_this19.m_lalcA=new b2Vec2();_this19.m_lalcB=new b2Vec2();_this19.m_groundAnchorA.Copy(b2Maybe(def.groundAnchorA,new b2Vec2(-1,1)));_this19.m_groundAnchorB.Copy(b2Maybe(def.groundAnchorB,new b2Vec2(1,0)));_this19.m_localAnchorA.Copy(b2Maybe(def.localAnchorA,new b2Vec2(-1,0)));_this19.m_localAnchorB.Copy(b2Maybe(def.localAnchorB,new b2Vec2(1,0)));_this19.m_lengthA=b2Maybe(def.lengthA,0);_this19.m_lengthB=b2Maybe(def.lengthB,0);// DEBUG: b2Assert(b2Maybe(def.ratio, 1) !== 0);
      _this19.m_ratio=b2Maybe(def.ratio,1);_this19.m_constant=b2Maybe(def.lengthA,0)+_this19.m_ratio*b2Maybe(def.lengthB,0);_this19.m_impulse=0;return _this19;}_inherits(b2PulleyJoint,_b2Joint8);return _createClass(b2PulleyJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// b2Rot qA(aA), qB(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// Get the pulley axes.
      // m_uA = cA + m_rA - m_groundAnchorA;
      this.m_uA.Copy(cA).SelfAdd(this.m_rA).SelfSub(this.m_groundAnchorA);// m_uB = cB + m_rB - m_groundAnchorB;
      this.m_uB.Copy(cB).SelfAdd(this.m_rB).SelfSub(this.m_groundAnchorB);var lengthA=this.m_uA.Length();var lengthB=this.m_uB.Length();if(lengthA>10*b2_linearSlop){this.m_uA.SelfMul(1/lengthA);}else {this.m_uA.SetZero();}if(lengthB>10*b2_linearSlop){this.m_uB.SelfMul(1/lengthB);}else {this.m_uB.SetZero();}// Compute effective mass.
      var ruA=b2Vec2.CrossVV(this.m_rA,this.m_uA);var ruB=b2Vec2.CrossVV(this.m_rB,this.m_uB);var mA=this.m_invMassA+this.m_invIA*ruA*ruA;var mB=this.m_invMassB+this.m_invIB*ruB*ruB;this.m_mass=mA+this.m_ratio*this.m_ratio*mB;if(this.m_mass>0){this.m_mass=1/this.m_mass;}if(data.step.warmStarting){// Scale impulses to support variable time steps.
      this.m_impulse*=data.step.dtRatio;// Warm starting.
      // b2Vec2 PA = -(m_impulse) * m_uA;
      var PA=b2Vec2.MulSV(-this.m_impulse,this.m_uA,b2PulleyJoint.InitVelocityConstraints_s_PA);// b2Vec2 PB = (-m_ratio * m_impulse) * m_uB;
      var PB=b2Vec2.MulSV(-this.m_ratio*this.m_impulse,this.m_uB,b2PulleyJoint.InitVelocityConstraints_s_PB);// vA += m_invMassA * PA;
      vA.SelfMulAdd(this.m_invMassA,PA);wA+=this.m_invIA*b2Vec2.CrossVV(this.m_rA,PA);// vB += m_invMassB * PB;
      vB.SelfMulAdd(this.m_invMassB,PB);wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,PB);}else {this.m_impulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// b2Vec2 vpA = vA + b2Cross(wA, m_rA);
      var vpA=b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2PulleyJoint.SolveVelocityConstraints_s_vpA);// b2Vec2 vpB = vB + b2Cross(wB, m_rB);
      var vpB=b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2PulleyJoint.SolveVelocityConstraints_s_vpB);var Cdot=-b2Vec2.DotVV(this.m_uA,vpA)-this.m_ratio*b2Vec2.DotVV(this.m_uB,vpB);var impulse=-this.m_mass*Cdot;this.m_impulse+=impulse;// b2Vec2 PA = -impulse * m_uA;
      var PA=b2Vec2.MulSV(-impulse,this.m_uA,b2PulleyJoint.SolveVelocityConstraints_s_PA);// b2Vec2 PB = -m_ratio * impulse * m_uB;
      var PB=b2Vec2.MulSV(-this.m_ratio*impulse,this.m_uB,b2PulleyJoint.SolveVelocityConstraints_s_PB);// vA += m_invMassA * PA;
      vA.SelfMulAdd(this.m_invMassA,PA);wA+=this.m_invIA*b2Vec2.CrossVV(this.m_rA,PA);// vB += m_invMassB * PB;
      vB.SelfMulAdd(this.m_invMassB,PB);wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,PB);// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;// b2Rot qA(aA), qB(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// Get the pulley axes.
      // b2Vec2 uA = cA + rA - m_groundAnchorA;
      var uA=this.m_uA.Copy(cA).SelfAdd(rA).SelfSub(this.m_groundAnchorA);// b2Vec2 uB = cB + rB - m_groundAnchorB;
      var uB=this.m_uB.Copy(cB).SelfAdd(rB).SelfSub(this.m_groundAnchorB);var lengthA=uA.Length();var lengthB=uB.Length();if(lengthA>10*b2_linearSlop){uA.SelfMul(1/lengthA);}else {uA.SetZero();}if(lengthB>10*b2_linearSlop){uB.SelfMul(1/lengthB);}else {uB.SetZero();}// Compute effective mass.
      var ruA=b2Vec2.CrossVV(rA,uA);var ruB=b2Vec2.CrossVV(rB,uB);var mA=this.m_invMassA+this.m_invIA*ruA*ruA;var mB=this.m_invMassB+this.m_invIB*ruB*ruB;var mass=mA+this.m_ratio*this.m_ratio*mB;if(mass>0){mass=1/mass;}var C=this.m_constant-lengthA-this.m_ratio*lengthB;var linearError=b2Abs(C);var impulse=-mass*C;// b2Vec2 PA = -impulse * uA;
      var PA=b2Vec2.MulSV(-impulse,uA,b2PulleyJoint.SolvePositionConstraints_s_PA);// b2Vec2 PB = -m_ratio * impulse * uB;
      var PB=b2Vec2.MulSV(-this.m_ratio*impulse,uB,b2PulleyJoint.SolvePositionConstraints_s_PB);// cA += m_invMassA * PA;
      cA.SelfMulAdd(this.m_invMassA,PA);aA+=this.m_invIA*b2Vec2.CrossVV(rA,PA);// cB += m_invMassB * PB;
      cB.SelfMulAdd(this.m_invMassB,PB);aB+=this.m_invIB*b2Vec2.CrossVV(rB,PB);// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return linearError<b2_linearSlop;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// b2Vec2 P = m_impulse * m_uB;
      // return inv_dt * P;
      out.x=inv_dt*this.m_impulse*this.m_uB.x;out.y=inv_dt*this.m_impulse*this.m_uB.y;return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return 0;}},{key:"GetGroundAnchorA",value:function GetGroundAnchorA(){return this.m_groundAnchorA;}},{key:"GetGroundAnchorB",value:function GetGroundAnchorB(){return this.m_groundAnchorB;}},{key:"GetLengthA",value:function GetLengthA(){return this.m_lengthA;}},{key:"GetLengthB",value:function GetLengthB(){return this.m_lengthB;}},{key:"GetRatio",value:function GetRatio(){return this.m_ratio;}},{key:"GetCurrentLengthA",value:function GetCurrentLengthA(){// b2Vec2 p = m_bodyA->GetWorldPoint(m_localAnchorA);
      // b2Vec2 s = m_groundAnchorA;
      // b2Vec2 d = p - s;
      // return d.Length();
      var p=this.m_bodyA.GetWorldPoint(this.m_localAnchorA,b2PulleyJoint.GetCurrentLengthA_s_p);var s=this.m_groundAnchorA;return b2Vec2.DistanceVV(p,s);}},{key:"GetCurrentLengthB",value:function GetCurrentLengthB(){// b2Vec2 p = m_bodyB->GetWorldPoint(m_localAnchorB);
      // b2Vec2 s = m_groundAnchorB;
      // b2Vec2 d = p - s;
      // return d.Length();
      var p=this.m_bodyB.GetWorldPoint(this.m_localAnchorB,b2PulleyJoint.GetCurrentLengthB_s_p);var s=this.m_groundAnchorB;return b2Vec2.DistanceVV(p,s);}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2PulleyJointDef = new b2PulleyJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.groundAnchorA.Set(%.15f, %.15f);\n",this.m_groundAnchorA.x,this.m_groundAnchorA.y);log("  jd.groundAnchorB.Set(%.15f, %.15f);\n",this.m_groundAnchorB.x,this.m_groundAnchorB.y);log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.lengthA = %.15f;\n",this.m_lengthA);log("  jd.lengthB = %.15f;\n",this.m_lengthB);log("  jd.ratio = %.15f;\n",this.m_ratio);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}},{key:"ShiftOrigin",value:function ShiftOrigin(newOrigin){this.m_groundAnchorA.SelfSub(newOrigin);this.m_groundAnchorB.SelfSub(newOrigin);}}]);}(b2Joint);b2PulleyJoint.InitVelocityConstraints_s_PA=new b2Vec2();b2PulleyJoint.InitVelocityConstraints_s_PB=new b2Vec2();b2PulleyJoint.SolveVelocityConstraints_s_vpA=new b2Vec2();b2PulleyJoint.SolveVelocityConstraints_s_vpB=new b2Vec2();b2PulleyJoint.SolveVelocityConstraints_s_PA=new b2Vec2();b2PulleyJoint.SolveVelocityConstraints_s_PB=new b2Vec2();b2PulleyJoint.SolvePositionConstraints_s_PA=new b2Vec2();b2PulleyJoint.SolvePositionConstraints_s_PB=new b2Vec2();b2PulleyJoint.GetCurrentLengthA_s_p=new b2Vec2();b2PulleyJoint.GetCurrentLengthB_s_p=new b2Vec2();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Revolute joint definition. This requires defining an
      /// anchor point where the bodies are joined. The definition
      /// uses local anchor points so that the initial configuration
      /// can violate the constraint slightly. You also need to
      /// specify the initial relative angle for joint limits. This
      /// helps when saving and loading a game.
      /// The local anchor points are measured from the body's origin
      /// rather than the center of mass because:
      /// 1. you might not know where the center of mass will be.
      /// 2. if you add/remove shapes from a body and recompute the mass,
      ///    the joints will be broken.
      var b2RevoluteJointDef=/*#__PURE__*/function(_b2JointDef9){function b2RevoluteJointDef(){var _this20;_classCallCheck(this,b2RevoluteJointDef);_this20=_callSuper(this,b2RevoluteJointDef,[exports.b2JointType.e_revoluteJoint]);_this20.localAnchorA=new b2Vec2(0,0);_this20.localAnchorB=new b2Vec2(0,0);_this20.referenceAngle=0;_this20.enableLimit=false;_this20.lowerAngle=0;_this20.upperAngle=0;_this20.enableMotor=false;_this20.motorSpeed=0;_this20.maxMotorTorque=0;return _this20;}_inherits(b2RevoluteJointDef,_b2JointDef9);return _createClass(b2RevoluteJointDef,[{key:"Initialize",value:function Initialize(bA,bB,anchor){this.bodyA=bA;this.bodyB=bB;this.bodyA.GetLocalPoint(anchor,this.localAnchorA);this.bodyB.GetLocalPoint(anchor,this.localAnchorB);this.referenceAngle=this.bodyB.GetAngle()-this.bodyA.GetAngle();}}]);}(b2JointDef);var b2RevoluteJoint=/*#__PURE__*/function(_b2Joint9){function b2RevoluteJoint(def){var _this21;_classCallCheck(this,b2RevoluteJoint);_this21=_callSuper(this,b2RevoluteJoint,[def]);// Solver shared
      _this21.m_localAnchorA=new b2Vec2();_this21.m_localAnchorB=new b2Vec2();_this21.m_impulse=new b2Vec3();_this21.m_motorImpulse=0;_this21.m_enableMotor=false;_this21.m_maxMotorTorque=0;_this21.m_motorSpeed=0;_this21.m_enableLimit=false;_this21.m_referenceAngle=0;_this21.m_lowerAngle=0;_this21.m_upperAngle=0;// Solver temp
      _this21.m_indexA=0;_this21.m_indexB=0;_this21.m_rA=new b2Vec2();_this21.m_rB=new b2Vec2();_this21.m_localCenterA=new b2Vec2();_this21.m_localCenterB=new b2Vec2();_this21.m_invMassA=0;_this21.m_invMassB=0;_this21.m_invIA=0;_this21.m_invIB=0;_this21.m_mass=new b2Mat33();// effective mass for point-to-point constraint.
      _this21.m_motorMass=0;// effective mass for motor/limit angular constraint.
      _this21.m_limitState=exports.b2LimitState.e_inactiveLimit;_this21.m_qA=new b2Rot();_this21.m_qB=new b2Rot();_this21.m_lalcA=new b2Vec2();_this21.m_lalcB=new b2Vec2();_this21.m_K=new b2Mat22();_this21.m_localAnchorA.Copy(b2Maybe(def.localAnchorA,b2Vec2.ZERO));_this21.m_localAnchorB.Copy(b2Maybe(def.localAnchorB,b2Vec2.ZERO));_this21.m_referenceAngle=b2Maybe(def.referenceAngle,0);_this21.m_impulse.SetZero();_this21.m_motorImpulse=0;_this21.m_lowerAngle=b2Maybe(def.lowerAngle,0);_this21.m_upperAngle=b2Maybe(def.upperAngle,0);_this21.m_maxMotorTorque=b2Maybe(def.maxMotorTorque,0);_this21.m_motorSpeed=b2Maybe(def.motorSpeed,0);_this21.m_enableLimit=b2Maybe(def.enableLimit,false);_this21.m_enableMotor=b2Maybe(def.enableMotor,false);_this21.m_limitState=exports.b2LimitState.e_inactiveLimit;return _this21;}_inherits(b2RevoluteJoint,_b2Joint9);return _createClass(b2RevoluteJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// b2Rot qA(aA), qB(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// J = [-I -r1_skew I r2_skew]
      //     [ 0       -1 0       1]
      // r_skew = [-ry; rx]
      // Matlab
      // K = [ mA+r1y^2*iA+mB+r2y^2*iB,  -r1y*iA*r1x-r2y*iB*r2x,          -r1y*iA-r2y*iB]
      //     [  -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB,           r1x*iA+r2x*iB]
      //     [          -r1y*iA-r2y*iB,           r1x*iA+r2x*iB,                   iA+iB]
      var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var fixedRotation=iA+iB===0;this.m_mass.ex.x=mA+mB+this.m_rA.y*this.m_rA.y*iA+this.m_rB.y*this.m_rB.y*iB;this.m_mass.ey.x=-this.m_rA.y*this.m_rA.x*iA-this.m_rB.y*this.m_rB.x*iB;this.m_mass.ez.x=-this.m_rA.y*iA-this.m_rB.y*iB;this.m_mass.ex.y=this.m_mass.ey.x;this.m_mass.ey.y=mA+mB+this.m_rA.x*this.m_rA.x*iA+this.m_rB.x*this.m_rB.x*iB;this.m_mass.ez.y=this.m_rA.x*iA+this.m_rB.x*iB;this.m_mass.ex.z=this.m_mass.ez.x;this.m_mass.ey.z=this.m_mass.ez.y;this.m_mass.ez.z=iA+iB;this.m_motorMass=iA+iB;if(this.m_motorMass>0){this.m_motorMass=1/this.m_motorMass;}if(!this.m_enableMotor||fixedRotation){this.m_motorImpulse=0;}if(this.m_enableLimit&&!fixedRotation){var jointAngle=aB-aA-this.m_referenceAngle;if(b2Abs(this.m_upperAngle-this.m_lowerAngle)<2*b2_angularSlop){this.m_limitState=exports.b2LimitState.e_equalLimits;}else if(jointAngle<=this.m_lowerAngle){if(this.m_limitState!==exports.b2LimitState.e_atLowerLimit){this.m_impulse.z=0;}this.m_limitState=exports.b2LimitState.e_atLowerLimit;}else if(jointAngle>=this.m_upperAngle){if(this.m_limitState!==exports.b2LimitState.e_atUpperLimit){this.m_impulse.z=0;}this.m_limitState=exports.b2LimitState.e_atUpperLimit;}else {this.m_limitState=exports.b2LimitState.e_inactiveLimit;this.m_impulse.z=0;}}else {this.m_limitState=exports.b2LimitState.e_inactiveLimit;}if(data.step.warmStarting){// Scale impulses to support a variable time step.
      this.m_impulse.SelfMul(data.step.dtRatio);this.m_motorImpulse*=data.step.dtRatio;// b2Vec2 P(m_impulse.x, m_impulse.y);
      var P=b2RevoluteJoint.InitVelocityConstraints_s_P.Set(this.m_impulse.x,this.m_impulse.y);// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*(b2Vec2.CrossVV(this.m_rA,P)+this.m_motorImpulse+this.m_impulse.z);// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*(b2Vec2.CrossVV(this.m_rB,P)+this.m_motorImpulse+this.m_impulse.z);}else {this.m_impulse.SetZero();this.m_motorImpulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var fixedRotation=iA+iB===0;// Solve motor constraint.
      if(this.m_enableMotor&&this.m_limitState!==exports.b2LimitState.e_equalLimits&&!fixedRotation){var Cdot=wB-wA-this.m_motorSpeed;var impulse=-this.m_motorMass*Cdot;var oldImpulse=this.m_motorImpulse;var maxImpulse=data.step.dt*this.m_maxMotorTorque;this.m_motorImpulse=b2Clamp(this.m_motorImpulse+impulse,-maxImpulse,maxImpulse);impulse=this.m_motorImpulse-oldImpulse;wA-=iA*impulse;wB+=iB*impulse;}// Solve limit constraint.
      if(this.m_enableLimit&&this.m_limitState!==exports.b2LimitState.e_inactiveLimit&&!fixedRotation){// b2Vec2 Cdot1 = vB + b2Cross(wB, m_rB) - vA - b2Cross(wA, m_rA);
      var Cdot1=b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2Vec2.s_t1),b2RevoluteJoint.SolveVelocityConstraints_s_Cdot1);var Cdot2=wB-wA;// b2Vec3 Cdot(Cdot1.x, Cdot1.y, Cdot2);
      // b2Vec3 impulse = -this.m_mass.Solve33(Cdot);
      var impulse_v3=this.m_mass.Solve33(Cdot1.x,Cdot1.y,Cdot2,b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v3).SelfNeg();if(this.m_limitState===exports.b2LimitState.e_equalLimits){this.m_impulse.SelfAdd(impulse_v3);}else if(this.m_limitState===exports.b2LimitState.e_atLowerLimit){var newImpulse=this.m_impulse.z+impulse_v3.z;if(newImpulse<0){// b2Vec2 rhs = -Cdot1 + m_impulse.z * b2Vec2(m_mass.ez.x, m_mass.ez.y);
      var rhs_x=-Cdot1.x+this.m_impulse.z*this.m_mass.ez.x;var rhs_y=-Cdot1.y+this.m_impulse.z*this.m_mass.ez.y;var reduced_v2=this.m_mass.Solve22(rhs_x,rhs_y,b2RevoluteJoint.SolveVelocityConstraints_s_reduced_v2);impulse_v3.x=reduced_v2.x;impulse_v3.y=reduced_v2.y;impulse_v3.z=-this.m_impulse.z;this.m_impulse.x+=reduced_v2.x;this.m_impulse.y+=reduced_v2.y;this.m_impulse.z=0;}else {this.m_impulse.SelfAdd(impulse_v3);}}else if(this.m_limitState===exports.b2LimitState.e_atUpperLimit){var _newImpulse=this.m_impulse.z+impulse_v3.z;if(_newImpulse>0){// b2Vec2 rhs = -Cdot1 + m_impulse.z * b2Vec2(m_mass.ez.x, m_mass.ez.y);
      var _rhs_x=-Cdot1.x+this.m_impulse.z*this.m_mass.ez.x;var _rhs_y=-Cdot1.y+this.m_impulse.z*this.m_mass.ez.y;var _reduced_v=this.m_mass.Solve22(_rhs_x,_rhs_y,b2RevoluteJoint.SolveVelocityConstraints_s_reduced_v2);impulse_v3.x=_reduced_v.x;impulse_v3.y=_reduced_v.y;impulse_v3.z=-this.m_impulse.z;this.m_impulse.x+=_reduced_v.x;this.m_impulse.y+=_reduced_v.y;this.m_impulse.z=0;}else {this.m_impulse.SelfAdd(impulse_v3);}}// b2Vec2 P(impulse.x, impulse.y);
      var P=b2RevoluteJoint.SolveVelocityConstraints_s_P.Set(impulse_v3.x,impulse_v3.y);// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*(b2Vec2.CrossVV(this.m_rA,P)+impulse_v3.z);// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*(b2Vec2.CrossVV(this.m_rB,P)+impulse_v3.z);}else {// Solve point-to-point constraint
      // b2Vec2 Cdot = vB + b2Cross(wB, m_rB) - vA - b2Cross(wA, m_rA);
      var Cdot_v2=b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2Vec2.s_t1),b2RevoluteJoint.SolveVelocityConstraints_s_Cdot_v2);// b2Vec2 impulse = m_mass.Solve22(-Cdot);
      var impulse_v2=this.m_mass.Solve22(-Cdot_v2.x,-Cdot_v2.y,b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v2);this.m_impulse.x+=impulse_v2.x;this.m_impulse.y+=impulse_v2.y;// vA -= mA * impulse;
      vA.SelfMulSub(mA,impulse_v2);wA-=iA*b2Vec2.CrossVV(this.m_rA,impulse_v2);// vB += mB * impulse;
      vB.SelfMulAdd(mB,impulse_v2);wB+=iB*b2Vec2.CrossVV(this.m_rB,impulse_v2);}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;// b2Rot qA(aA), qB(aB);
      var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);var angularError=0;var positionError=0;var fixedRotation=this.m_invIA+this.m_invIB===0;// Solve angular limit constraint.
      if(this.m_enableLimit&&this.m_limitState!==exports.b2LimitState.e_inactiveLimit&&!fixedRotation){var angle=aB-aA-this.m_referenceAngle;var limitImpulse=0;if(this.m_limitState===exports.b2LimitState.e_equalLimits){// Prevent large angular corrections
      var C=b2Clamp(angle-this.m_lowerAngle,-b2_maxAngularCorrection,b2_maxAngularCorrection);limitImpulse=-this.m_motorMass*C;angularError=b2Abs(C);}else if(this.m_limitState===exports.b2LimitState.e_atLowerLimit){var _C=angle-this.m_lowerAngle;angularError=-_C;// Prevent large angular corrections and allow some slop.
      _C=b2Clamp(_C+b2_angularSlop,-b2_maxAngularCorrection,0);limitImpulse=-this.m_motorMass*_C;}else if(this.m_limitState===exports.b2LimitState.e_atUpperLimit){var _C2=angle-this.m_upperAngle;angularError=_C2;// Prevent large angular corrections and allow some slop.
      _C2=b2Clamp(_C2-b2_angularSlop,0,b2_maxAngularCorrection);limitImpulse=-this.m_motorMass*_C2;}aA-=this.m_invIA*limitImpulse;aB+=this.m_invIB*limitImpulse;}// Solve point-to-point constraint.
      {qA.SetAngle(aA);qB.SetAngle(aB);// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// b2Vec2 C = cB + rB - cA - rA;
      var C_v2=b2Vec2.SubVV(b2Vec2.AddVV(cB,rB,b2Vec2.s_t0),b2Vec2.AddVV(cA,rA,b2Vec2.s_t1),b2RevoluteJoint.SolvePositionConstraints_s_C_v2);// positionError = C.Length();
      positionError=C_v2.Length();var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var K=this.m_K;K.ex.x=mA+mB+iA*rA.y*rA.y+iB*rB.y*rB.y;K.ex.y=-iA*rA.x*rA.y-iB*rB.x*rB.y;K.ey.x=K.ex.y;K.ey.y=mA+mB+iA*rA.x*rA.x+iB*rB.x*rB.x;// b2Vec2 impulse = -K.Solve(C);
      var impulse=K.Solve(C_v2.x,C_v2.y,b2RevoluteJoint.SolvePositionConstraints_s_impulse).SelfNeg();// cA -= mA * impulse;
      cA.SelfMulSub(mA,impulse);aA-=iA*b2Vec2.CrossVV(rA,impulse);// cB += mB * impulse;
      cB.SelfMulAdd(mB,impulse);aB+=iB*b2Vec2.CrossVV(rB,impulse);}// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return positionError<=b2_linearSlop&&angularError<=b2_angularSlop;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// b2Vec2 P(this.m_impulse.x, this.m_impulse.y);
      // return inv_dt * P;
      out.x=inv_dt*this.m_impulse.x;out.y=inv_dt*this.m_impulse.y;return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return inv_dt*this.m_impulse.z;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"GetReferenceAngle",value:function GetReferenceAngle(){return this.m_referenceAngle;}},{key:"GetJointAngle",value:function GetJointAngle(){// b2Body* bA = this.m_bodyA;
      // b2Body* bB = this.m_bodyB;
      // return bB->this.m_sweep.a - bA->this.m_sweep.a - this.m_referenceAngle;
      return this.m_bodyB.m_sweep.a-this.m_bodyA.m_sweep.a-this.m_referenceAngle;}},{key:"GetJointSpeed",value:function GetJointSpeed(){// b2Body* bA = this.m_bodyA;
      // b2Body* bB = this.m_bodyB;
      // return bB->this.m_angularVelocity - bA->this.m_angularVelocity;
      return this.m_bodyB.m_angularVelocity-this.m_bodyA.m_angularVelocity;}},{key:"IsMotorEnabled",value:function IsMotorEnabled(){return this.m_enableMotor;}},{key:"EnableMotor",value:function EnableMotor(flag){if(flag!==this.m_enableMotor){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableMotor=flag;}}},{key:"GetMotorTorque",value:function GetMotorTorque(inv_dt){return inv_dt*this.m_motorImpulse;}},{key:"GetMotorSpeed",value:function GetMotorSpeed(){return this.m_motorSpeed;}},{key:"SetMaxMotorTorque",value:function SetMaxMotorTorque(torque){if(torque!==this.m_maxMotorTorque){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_maxMotorTorque=torque;}}},{key:"GetMaxMotorTorque",value:function GetMaxMotorTorque(){return this.m_maxMotorTorque;}},{key:"IsLimitEnabled",value:function IsLimitEnabled(){return this.m_enableLimit;}},{key:"EnableLimit",value:function EnableLimit(flag){if(flag!==this.m_enableLimit){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableLimit=flag;this.m_impulse.z=0;}}},{key:"GetLowerLimit",value:function GetLowerLimit(){return this.m_lowerAngle;}},{key:"GetUpperLimit",value:function GetUpperLimit(){return this.m_upperAngle;}},{key:"SetLimits",value:function SetLimits(lower,upper){if(lower!==this.m_lowerAngle||upper!==this.m_upperAngle){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_impulse.z=0;this.m_lowerAngle=lower;this.m_upperAngle=upper;}}},{key:"SetMotorSpeed",value:function SetMotorSpeed(speed){if(speed!==this.m_motorSpeed){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_motorSpeed=speed;}}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2RevoluteJointDef = new b2RevoluteJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.referenceAngle = %.15f;\n",this.m_referenceAngle);log("  jd.enableLimit = %s;\n",this.m_enableLimit?"true":"false");log("  jd.lowerAngle = %.15f;\n",this.m_lowerAngle);log("  jd.upperAngle = %.15f;\n",this.m_upperAngle);log("  jd.enableMotor = %s;\n",this.m_enableMotor?"true":"false");log("  jd.motorSpeed = %.15f;\n",this.m_motorSpeed);log("  jd.maxMotorTorque = %.15f;\n",this.m_maxMotorTorque);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2RevoluteJoint.InitVelocityConstraints_s_P=new b2Vec2();b2RevoluteJoint.SolveVelocityConstraints_s_P=new b2Vec2();b2RevoluteJoint.SolveVelocityConstraints_s_Cdot_v2=new b2Vec2();b2RevoluteJoint.SolveVelocityConstraints_s_Cdot1=new b2Vec2();b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v3=new b2Vec3();b2RevoluteJoint.SolveVelocityConstraints_s_reduced_v2=new b2Vec2();b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v2=new b2Vec2();b2RevoluteJoint.SolvePositionConstraints_s_C_v2=new b2Vec2();b2RevoluteJoint.SolvePositionConstraints_s_impulse=new b2Vec2();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Rope joint definition. This requires two body anchor points and
      /// a maximum lengths.
      /// Note: by default the connected objects will not collide.
      /// see collideConnected in b2JointDef.
      var b2RopeJointDef=/*#__PURE__*/function(_b2JointDef0){function b2RopeJointDef(){var _this22;_classCallCheck(this,b2RopeJointDef);_this22=_callSuper(this,b2RopeJointDef,[exports.b2JointType.e_ropeJoint]);_this22.localAnchorA=new b2Vec2(-1,0);_this22.localAnchorB=new b2Vec2(1,0);_this22.maxLength=0;return _this22;}_inherits(b2RopeJointDef,_b2JointDef0);return _createClass(b2RopeJointDef);}(b2JointDef);var b2RopeJoint=/*#__PURE__*/function(_b2Joint0){function b2RopeJoint(def){var _this23;_classCallCheck(this,b2RopeJoint);_this23=_callSuper(this,b2RopeJoint,[def]);// Solver shared
      _this23.m_localAnchorA=new b2Vec2();_this23.m_localAnchorB=new b2Vec2();_this23.m_maxLength=0;_this23.m_length=0;_this23.m_impulse=0;// Solver temp
      _this23.m_indexA=0;_this23.m_indexB=0;_this23.m_u=new b2Vec2();_this23.m_rA=new b2Vec2();_this23.m_rB=new b2Vec2();_this23.m_localCenterA=new b2Vec2();_this23.m_localCenterB=new b2Vec2();_this23.m_invMassA=0;_this23.m_invMassB=0;_this23.m_invIA=0;_this23.m_invIB=0;_this23.m_mass=0;_this23.m_state=exports.b2LimitState.e_inactiveLimit;_this23.m_qA=new b2Rot();_this23.m_qB=new b2Rot();_this23.m_lalcA=new b2Vec2();_this23.m_lalcB=new b2Vec2();_this23.m_localAnchorA.Copy(b2Maybe(def.localAnchorA,new b2Vec2(-1,0)));_this23.m_localAnchorB.Copy(b2Maybe(def.localAnchorB,new b2Vec2(1,0)));_this23.m_maxLength=b2Maybe(def.maxLength,0);return _this23;}_inherits(b2RopeJoint,_b2Joint0);return _createClass(b2RopeJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// this.m_rA = b2Mul(qA, this.m_localAnchorA - this.m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// this.m_rB = b2Mul(qB, this.m_localAnchorB - this.m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// this.m_u = cB + this.m_rB - cA - this.m_rA;
      this.m_u.Copy(cB).SelfAdd(this.m_rB).SelfSub(cA).SelfSub(this.m_rA);this.m_length=this.m_u.Length();var C=this.m_length-this.m_maxLength;if(C>0){this.m_state=exports.b2LimitState.e_atUpperLimit;}else {this.m_state=exports.b2LimitState.e_inactiveLimit;}if(this.m_length>b2_linearSlop){this.m_u.SelfMul(1/this.m_length);}else {this.m_u.SetZero();this.m_mass=0;this.m_impulse=0;return;}// Compute effective mass.
      var crA=b2Vec2.CrossVV(this.m_rA,this.m_u);var crB=b2Vec2.CrossVV(this.m_rB,this.m_u);var invMass=this.m_invMassA+this.m_invIA*crA*crA+this.m_invMassB+this.m_invIB*crB*crB;this.m_mass=invMass!==0?1/invMass:0;if(data.step.warmStarting){// Scale the impulse to support a variable time step.
      this.m_impulse*=data.step.dtRatio;// b2Vec2 P = m_impulse * m_u;
      var P=b2Vec2.MulSV(this.m_impulse,this.m_u,b2RopeJoint.InitVelocityConstraints_s_P);// vA -= m_invMassA * P;
      vA.SelfMulSub(this.m_invMassA,P);wA-=this.m_invIA*b2Vec2.CrossVV(this.m_rA,P);// vB += m_invMassB * P;
      vB.SelfMulAdd(this.m_invMassB,P);wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,P);}else {this.m_impulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// Cdot = dot(u, v + cross(w, r))
      // b2Vec2 vpA = vA + b2Cross(wA, m_rA);
      var vpA=b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2RopeJoint.SolveVelocityConstraints_s_vpA);// b2Vec2 vpB = vB + b2Cross(wB, m_rB);
      var vpB=b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2RopeJoint.SolveVelocityConstraints_s_vpB);// float32 C = m_length - m_maxLength;
      var C=this.m_length-this.m_maxLength;// float32 Cdot = b2Dot(m_u, vpB - vpA);
      var Cdot=b2Vec2.DotVV(this.m_u,b2Vec2.SubVV(vpB,vpA,b2Vec2.s_t0));// Predictive constraint.
      if(C<0){Cdot+=data.step.inv_dt*C;}var impulse=-this.m_mass*Cdot;var oldImpulse=this.m_impulse;this.m_impulse=b2Min(0,this.m_impulse+impulse);impulse=this.m_impulse-oldImpulse;// b2Vec2 P = impulse * m_u;
      var P=b2Vec2.MulSV(impulse,this.m_u,b2RopeJoint.SolveVelocityConstraints_s_P);// vA -= m_invMassA * P;
      vA.SelfMulSub(this.m_invMassA,P);wA-=this.m_invIA*b2Vec2.CrossVV(this.m_rA,P);// vB += m_invMassB * P;
      vB.SelfMulAdd(this.m_invMassB,P);wB+=this.m_invIB*b2Vec2.CrossVV(this.m_rB,P);// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// b2Vec2 rA = b2Mul(qA, this.m_localAnchorA - this.m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, this.m_localAnchorB - this.m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// b2Vec2 u = cB + rB - cA - rA;
      var u=this.m_u.Copy(cB).SelfAdd(rB).SelfSub(cA).SelfSub(rA);var length=u.Normalize();var C=length-this.m_maxLength;C=b2Clamp(C,0,b2_maxLinearCorrection);var impulse=-this.m_mass*C;// b2Vec2 P = impulse * u;
      var P=b2Vec2.MulSV(impulse,u,b2RopeJoint.SolvePositionConstraints_s_P);// cA -= m_invMassA * P;
      cA.SelfMulSub(this.m_invMassA,P);aA-=this.m_invIA*b2Vec2.CrossVV(rA,P);// cB += m_invMassB * P;
      cB.SelfMulAdd(this.m_invMassB,P);aB+=this.m_invIB*b2Vec2.CrossVV(rB,P);// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return length-this.m_maxLength<b2_linearSlop;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// return out.Set(inv_dt * this.m_linearImpulse.x, inv_dt * this.m_linearImpulse.y);
      return b2Vec2.MulSV(inv_dt*this.m_impulse,this.m_u,out);}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return 0;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"SetMaxLength",value:function SetMaxLength(length){this.m_maxLength=length;}},{key:"GetMaxLength",value:function GetMaxLength(){return this.m_maxLength;}},{key:"GetLimitState",value:function GetLimitState(){return this.m_state;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2RopeJointDef = new b2RopeJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.maxLength = %.15f;\n",this.m_maxLength);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2RopeJoint.InitVelocityConstraints_s_P=new b2Vec2();b2RopeJoint.SolveVelocityConstraints_s_vpA=new b2Vec2();b2RopeJoint.SolveVelocityConstraints_s_vpB=new b2Vec2();b2RopeJoint.SolveVelocityConstraints_s_P=new b2Vec2();b2RopeJoint.SolvePositionConstraints_s_P=new b2Vec2();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Weld joint definition. You need to specify local anchor points
      /// where they are attached and the relative body angle. The position
      /// of the anchor points is important for computing the reaction torque.
      var b2WeldJointDef=/*#__PURE__*/function(_b2JointDef1){function b2WeldJointDef(){var _this24;_classCallCheck(this,b2WeldJointDef);_this24=_callSuper(this,b2WeldJointDef,[exports.b2JointType.e_weldJoint]);_this24.localAnchorA=new b2Vec2();_this24.localAnchorB=new b2Vec2();_this24.referenceAngle=0;_this24.frequencyHz=0;_this24.dampingRatio=0;return _this24;}_inherits(b2WeldJointDef,_b2JointDef1);return _createClass(b2WeldJointDef,[{key:"Initialize",value:function Initialize(bA,bB,anchor){this.bodyA=bA;this.bodyB=bB;this.bodyA.GetLocalPoint(anchor,this.localAnchorA);this.bodyB.GetLocalPoint(anchor,this.localAnchorB);this.referenceAngle=this.bodyB.GetAngle()-this.bodyA.GetAngle();}}]);}(b2JointDef);var b2WeldJoint=/*#__PURE__*/function(_b2Joint1){function b2WeldJoint(def){var _this25;_classCallCheck(this,b2WeldJoint);_this25=_callSuper(this,b2WeldJoint,[def]);_this25.m_frequencyHz=0;_this25.m_dampingRatio=0;_this25.m_bias=0;// Solver shared
      _this25.m_localAnchorA=new b2Vec2();_this25.m_localAnchorB=new b2Vec2();_this25.m_referenceAngle=0;_this25.m_gamma=0;_this25.m_impulse=new b2Vec3(0,0,0);// Solver temp
      _this25.m_indexA=0;_this25.m_indexB=0;_this25.m_rA=new b2Vec2();_this25.m_rB=new b2Vec2();_this25.m_localCenterA=new b2Vec2();_this25.m_localCenterB=new b2Vec2();_this25.m_invMassA=0;_this25.m_invMassB=0;_this25.m_invIA=0;_this25.m_invIB=0;_this25.m_mass=new b2Mat33();_this25.m_qA=new b2Rot();_this25.m_qB=new b2Rot();_this25.m_lalcA=new b2Vec2();_this25.m_lalcB=new b2Vec2();_this25.m_K=new b2Mat33();_this25.m_frequencyHz=b2Maybe(def.frequencyHz,0);_this25.m_dampingRatio=b2Maybe(def.dampingRatio,0);_this25.m_localAnchorA.Copy(b2Maybe(def.localAnchorA,b2Vec2.ZERO));_this25.m_localAnchorB.Copy(b2Maybe(def.localAnchorB,b2Vec2.ZERO));_this25.m_referenceAngle=b2Maybe(def.referenceAngle,0);_this25.m_impulse.SetZero();return _this25;}_inherits(b2WeldJoint,_b2Joint1);return _createClass(b2WeldJoint,[{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// J = [-I -r1_skew I r2_skew]
      //     [ 0       -1 0       1]
      // r_skew = [-ry; rx]
      // Matlab
      // K = [ mA+r1y^2*iA+mB+r2y^2*iB,  -r1y*iA*r1x-r2y*iB*r2x,          -r1y*iA-r2y*iB]
      //     [  -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB,           r1x*iA+r2x*iB]
      //     [          -r1y*iA-r2y*iB,           r1x*iA+r2x*iB,                   iA+iB]
      var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var K=this.m_K;K.ex.x=mA+mB+this.m_rA.y*this.m_rA.y*iA+this.m_rB.y*this.m_rB.y*iB;K.ey.x=-this.m_rA.y*this.m_rA.x*iA-this.m_rB.y*this.m_rB.x*iB;K.ez.x=-this.m_rA.y*iA-this.m_rB.y*iB;K.ex.y=K.ey.x;K.ey.y=mA+mB+this.m_rA.x*this.m_rA.x*iA+this.m_rB.x*this.m_rB.x*iB;K.ez.y=this.m_rA.x*iA+this.m_rB.x*iB;K.ex.z=K.ez.x;K.ey.z=K.ez.y;K.ez.z=iA+iB;if(this.m_frequencyHz>0){K.GetInverse22(this.m_mass);var invM=iA+iB;var m=invM>0?1/invM:0;var C=aB-aA-this.m_referenceAngle;// Frequency
      var omega=2*b2_pi*this.m_frequencyHz;// Damping coefficient
      var d=2*m*this.m_dampingRatio*omega;// Spring stiffness
      var k=m*omega*omega;// magic formulas
      var h=data.step.dt;this.m_gamma=h*(d+h*k);this.m_gamma=this.m_gamma!==0?1/this.m_gamma:0;this.m_bias=C*h*k*this.m_gamma;invM+=this.m_gamma;this.m_mass.ez.z=invM!==0?1/invM:0;}else {K.GetSymInverse33(this.m_mass);this.m_gamma=0;this.m_bias=0;}if(data.step.warmStarting){// Scale impulses to support a variable time step.
      this.m_impulse.SelfMul(data.step.dtRatio);// b2Vec2 P(m_impulse.x, m_impulse.y);
      var P=b2WeldJoint.InitVelocityConstraints_s_P.Set(this.m_impulse.x,this.m_impulse.y);// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*(b2Vec2.CrossVV(this.m_rA,P)+this.m_impulse.z);// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*(b2Vec2.CrossVV(this.m_rB,P)+this.m_impulse.z);}else {this.m_impulse.SetZero();}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;if(this.m_frequencyHz>0){var Cdot2=wB-wA;var impulse2=-this.m_mass.ez.z*(Cdot2+this.m_bias+this.m_gamma*this.m_impulse.z);this.m_impulse.z+=impulse2;wA-=iA*impulse2;wB+=iB*impulse2;// b2Vec2 Cdot1 = vB + b2Vec2.CrossSV(wB, this.m_rB) - vA - b2Vec2.CrossSV(wA, this.m_rA);
      var Cdot1=b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2Vec2.s_t1),b2WeldJoint.SolveVelocityConstraints_s_Cdot1);// b2Vec2 impulse1 = -b2Mul22(m_mass, Cdot1);
      var impulse1=b2Mat33.MulM33XY(this.m_mass,Cdot1.x,Cdot1.y,b2WeldJoint.SolveVelocityConstraints_s_impulse1).SelfNeg();this.m_impulse.x+=impulse1.x;this.m_impulse.y+=impulse1.y;// b2Vec2 P = impulse1;
      var P=impulse1;// vA -= mA * P;
      vA.SelfMulSub(mA,P);// wA -= iA * b2Cross(m_rA, P);
      wA-=iA*b2Vec2.CrossVV(this.m_rA,P);// vB += mB * P;
      vB.SelfMulAdd(mB,P);// wB += iB * b2Cross(m_rB, P);
      wB+=iB*b2Vec2.CrossVV(this.m_rB,P);}else {// b2Vec2 Cdot1 = vB + b2Cross(wB, this.m_rB) - vA - b2Cross(wA, this.m_rA);
      var _Cdot=b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,this.m_rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,this.m_rA,b2Vec2.s_t1),b2WeldJoint.SolveVelocityConstraints_s_Cdot1);var _Cdot2=wB-wA;// b2Vec3 const Cdot(Cdot1.x, Cdot1.y, Cdot2);
      // b2Vec3 impulse = -b2Mul(m_mass, Cdot);
      var impulse=b2Mat33.MulM33XYZ(this.m_mass,_Cdot.x,_Cdot.y,_Cdot2,b2WeldJoint.SolveVelocityConstraints_s_impulse).SelfNeg();this.m_impulse.SelfAdd(impulse);// b2Vec2 P(impulse.x, impulse.y);
      var _P5=b2WeldJoint.SolveVelocityConstraints_s_P.Set(impulse.x,impulse.y);// vA -= mA * P;
      vA.SelfMulSub(mA,_P5);wA-=iA*(b2Vec2.CrossVV(this.m_rA,_P5)+impulse.z);// vB += mB * P;
      vB.SelfMulAdd(mB,_P5);wB+=iB*(b2Vec2.CrossVV(this.m_rB,_P5)+impulse.z);}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);var positionError,angularError;var K=this.m_K;K.ex.x=mA+mB+rA.y*rA.y*iA+rB.y*rB.y*iB;K.ey.x=-rA.y*rA.x*iA-rB.y*rB.x*iB;K.ez.x=-rA.y*iA-rB.y*iB;K.ex.y=K.ey.x;K.ey.y=mA+mB+rA.x*rA.x*iA+rB.x*rB.x*iB;K.ez.y=rA.x*iA+rB.x*iB;K.ex.z=K.ez.x;K.ey.z=K.ez.y;K.ez.z=iA+iB;if(this.m_frequencyHz>0){// b2Vec2 C1 =  cB + rB - cA - rA;
      var C1=b2Vec2.SubVV(b2Vec2.AddVV(cB,rB,b2Vec2.s_t0),b2Vec2.AddVV(cA,rA,b2Vec2.s_t1),b2WeldJoint.SolvePositionConstraints_s_C1);positionError=C1.Length();angularError=0;// b2Vec2 P = -K.Solve22(C1);
      var P=K.Solve22(C1.x,C1.y,b2WeldJoint.SolvePositionConstraints_s_P).SelfNeg();// cA -= mA * P;
      cA.SelfMulSub(mA,P);aA-=iA*b2Vec2.CrossVV(rA,P);// cB += mB * P;
      cB.SelfMulAdd(mB,P);aB+=iB*b2Vec2.CrossVV(rB,P);}else {// b2Vec2 C1 =  cB + rB - cA - rA;
      var _C3=b2Vec2.SubVV(b2Vec2.AddVV(cB,rB,b2Vec2.s_t0),b2Vec2.AddVV(cA,rA,b2Vec2.s_t1),b2WeldJoint.SolvePositionConstraints_s_C1);var C2=aB-aA-this.m_referenceAngle;positionError=_C3.Length();angularError=b2Abs(C2);// b2Vec3 C(C1.x, C1.y, C2);
      // b2Vec3 impulse = -K.Solve33(C);
      var impulse=K.Solve33(_C3.x,_C3.y,C2,b2WeldJoint.SolvePositionConstraints_s_impulse).SelfNeg();// b2Vec2 P(impulse.x, impulse.y);
      var _P6=b2WeldJoint.SolvePositionConstraints_s_P.Set(impulse.x,impulse.y);// cA -= mA * P;
      cA.SelfMulSub(mA,_P6);aA-=iA*(b2Vec2.CrossVV(this.m_rA,_P6)+impulse.z);// cB += mB * P;
      cB.SelfMulAdd(mB,_P6);aB+=iB*(b2Vec2.CrossVV(this.m_rB,_P6)+impulse.z);}// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return positionError<=b2_linearSlop&&angularError<=b2_angularSlop;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// b2Vec2 P(this.m_impulse.x, this.m_impulse.y);
      // return inv_dt * P;
      out.x=inv_dt*this.m_impulse.x;out.y=inv_dt*this.m_impulse.y;return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return inv_dt*this.m_impulse.z;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"GetReferenceAngle",value:function GetReferenceAngle(){return this.m_referenceAngle;}},{key:"SetFrequency",value:function SetFrequency(hz){this.m_frequencyHz=hz;}},{key:"GetFrequency",value:function GetFrequency(){return this.m_frequencyHz;}},{key:"SetDampingRatio",value:function SetDampingRatio(ratio){this.m_dampingRatio=ratio;}},{key:"GetDampingRatio",value:function GetDampingRatio(){return this.m_dampingRatio;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2WeldJointDef = new b2WeldJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.referenceAngle = %.15f;\n",this.m_referenceAngle);log("  jd.frequencyHz = %.15f;\n",this.m_frequencyHz);log("  jd.dampingRatio = %.15f;\n",this.m_dampingRatio);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2WeldJoint.InitVelocityConstraints_s_P=new b2Vec2();b2WeldJoint.SolveVelocityConstraints_s_Cdot1=new b2Vec2();b2WeldJoint.SolveVelocityConstraints_s_impulse1=new b2Vec2();b2WeldJoint.SolveVelocityConstraints_s_impulse=new b2Vec3();b2WeldJoint.SolveVelocityConstraints_s_P=new b2Vec2();b2WeldJoint.SolvePositionConstraints_s_C1=new b2Vec2();b2WeldJoint.SolvePositionConstraints_s_P=new b2Vec2();b2WeldJoint.SolvePositionConstraints_s_impulse=new b2Vec3();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Wheel joint definition. This requires defining a line of
      /// motion using an axis and an anchor point. The definition uses local
      /// anchor points and a local axis so that the initial configuration
      /// can violate the constraint slightly. The joint translation is zero
      /// when the local anchor points coincide in world space. Using local
      /// anchors and a local axis helps when saving and loading a game.
      var b2WheelJointDef=/*#__PURE__*/function(_b2JointDef10){function b2WheelJointDef(){var _this26;_classCallCheck(this,b2WheelJointDef);_this26=_callSuper(this,b2WheelJointDef,[exports.b2JointType.e_wheelJoint]);_this26.localAnchorA=new b2Vec2(0,0);_this26.localAnchorB=new b2Vec2(0,0);_this26.localAxisA=new b2Vec2(1,0);_this26.enableMotor=false;_this26.maxMotorTorque=0;_this26.motorSpeed=0;_this26.frequencyHz=2;_this26.dampingRatio=0.7;return _this26;}_inherits(b2WheelJointDef,_b2JointDef10);return _createClass(b2WheelJointDef,[{key:"Initialize",value:function Initialize(bA,bB,anchor,axis){this.bodyA=bA;this.bodyB=bB;this.bodyA.GetLocalPoint(anchor,this.localAnchorA);this.bodyB.GetLocalPoint(anchor,this.localAnchorB);this.bodyA.GetLocalVector(axis,this.localAxisA);}}]);}(b2JointDef);var b2WheelJoint=/*#__PURE__*/function(_b2Joint10){function b2WheelJoint(def){var _this27;_classCallCheck(this,b2WheelJoint);_this27=_callSuper(this,b2WheelJoint,[def]);_this27.m_frequencyHz=0;_this27.m_dampingRatio=0;// Solver shared
      _this27.m_localAnchorA=new b2Vec2();_this27.m_localAnchorB=new b2Vec2();_this27.m_localXAxisA=new b2Vec2();_this27.m_localYAxisA=new b2Vec2();_this27.m_impulse=0;_this27.m_motorImpulse=0;_this27.m_springImpulse=0;_this27.m_maxMotorTorque=0;_this27.m_motorSpeed=0;_this27.m_enableMotor=false;// Solver temp
      _this27.m_indexA=0;_this27.m_indexB=0;_this27.m_localCenterA=new b2Vec2();_this27.m_localCenterB=new b2Vec2();_this27.m_invMassA=0;_this27.m_invMassB=0;_this27.m_invIA=0;_this27.m_invIB=0;_this27.m_ax=new b2Vec2();_this27.m_ay=new b2Vec2();_this27.m_sAx=0;_this27.m_sBx=0;_this27.m_sAy=0;_this27.m_sBy=0;_this27.m_mass=0;_this27.m_motorMass=0;_this27.m_springMass=0;_this27.m_bias=0;_this27.m_gamma=0;_this27.m_qA=new b2Rot();_this27.m_qB=new b2Rot();_this27.m_lalcA=new b2Vec2();_this27.m_lalcB=new b2Vec2();_this27.m_rA=new b2Vec2();_this27.m_rB=new b2Vec2();_this27.m_frequencyHz=b2Maybe(def.frequencyHz,2);_this27.m_dampingRatio=b2Maybe(def.dampingRatio,0.7);_this27.m_localAnchorA.Copy(b2Maybe(def.localAnchorA,b2Vec2.ZERO));_this27.m_localAnchorB.Copy(b2Maybe(def.localAnchorB,b2Vec2.ZERO));_this27.m_localXAxisA.Copy(b2Maybe(def.localAxisA,b2Vec2.UNITX));b2Vec2.CrossOneV(_this27.m_localXAxisA,_this27.m_localYAxisA);_this27.m_maxMotorTorque=b2Maybe(def.maxMotorTorque,0);_this27.m_motorSpeed=b2Maybe(def.motorSpeed,0);_this27.m_enableMotor=b2Maybe(def.enableMotor,false);_this27.m_ax.SetZero();_this27.m_ay.SetZero();return _this27;}_inherits(b2WheelJoint,_b2Joint10);return _createClass(b2WheelJoint,[{key:"GetMotorSpeed",value:function GetMotorSpeed(){return this.m_motorSpeed;}},{key:"GetMaxMotorTorque",value:function GetMaxMotorTorque(){return this.m_maxMotorTorque;}},{key:"SetSpringFrequencyHz",value:function SetSpringFrequencyHz(hz){this.m_frequencyHz=hz;}},{key:"GetSpringFrequencyHz",value:function GetSpringFrequencyHz(){return this.m_frequencyHz;}},{key:"SetSpringDampingRatio",value:function SetSpringDampingRatio(ratio){this.m_dampingRatio=ratio;}},{key:"GetSpringDampingRatio",value:function GetSpringDampingRatio(){return this.m_dampingRatio;}},{key:"InitVelocityConstraints",value:function InitVelocityConstraints(data){this.m_indexA=this.m_bodyA.m_islandIndex;this.m_indexB=this.m_bodyB.m_islandIndex;this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);this.m_invMassA=this.m_bodyA.m_invMass;this.m_invMassB=this.m_bodyB.m_invMass;this.m_invIA=this.m_bodyA.m_invI;this.m_invIB=this.m_bodyB.m_invI;var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// Compute the effective masses.
      // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// b2Vec2 d = cB + rB - cA - rA;
      var d=b2Vec2.SubVV(b2Vec2.AddVV(cB,rB,b2Vec2.s_t0),b2Vec2.AddVV(cA,rA,b2Vec2.s_t1),b2WheelJoint.InitVelocityConstraints_s_d);// Point to line constraint
      {// m_ay = b2Mul(qA, m_localYAxisA);
      b2Rot.MulRV(qA,this.m_localYAxisA,this.m_ay);// m_sAy = b2Cross(d + rA, m_ay);
      this.m_sAy=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),this.m_ay);// m_sBy = b2Cross(rB, m_ay);
      this.m_sBy=b2Vec2.CrossVV(rB,this.m_ay);this.m_mass=mA+mB+iA*this.m_sAy*this.m_sAy+iB*this.m_sBy*this.m_sBy;if(this.m_mass>0){this.m_mass=1/this.m_mass;}}// Spring constraint
      this.m_springMass=0;this.m_bias=0;this.m_gamma=0;if(this.m_frequencyHz>0){// m_ax = b2Mul(qA, m_localXAxisA);
      b2Rot.MulRV(qA,this.m_localXAxisA,this.m_ax);// m_sAx = b2Cross(d + rA, m_ax);
      this.m_sAx=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),this.m_ax);// m_sBx = b2Cross(rB, m_ax);
      this.m_sBx=b2Vec2.CrossVV(rB,this.m_ax);var invMass=mA+mB+iA*this.m_sAx*this.m_sAx+iB*this.m_sBx*this.m_sBx;if(invMass>0){this.m_springMass=1/invMass;var C=b2Vec2.DotVV(d,this.m_ax);// Frequency
      var omega=2*b2_pi*this.m_frequencyHz;// Damping coefficient
      var damp=2*this.m_springMass*this.m_dampingRatio*omega;// Spring stiffness
      var k=this.m_springMass*omega*omega;// magic formulas
      var h=data.step.dt;this.m_gamma=h*(damp+h*k);if(this.m_gamma>0){this.m_gamma=1/this.m_gamma;}this.m_bias=C*h*k*this.m_gamma;this.m_springMass=invMass+this.m_gamma;if(this.m_springMass>0){this.m_springMass=1/this.m_springMass;}}}else {this.m_springImpulse=0;}// Rotational motor
      if(this.m_enableMotor){this.m_motorMass=iA+iB;if(this.m_motorMass>0){this.m_motorMass=1/this.m_motorMass;}}else {this.m_motorMass=0;this.m_motorImpulse=0;}if(data.step.warmStarting){// Account for variable time step.
      this.m_impulse*=data.step.dtRatio;this.m_springImpulse*=data.step.dtRatio;this.m_motorImpulse*=data.step.dtRatio;// b2Vec2 P = m_impulse * m_ay + m_springImpulse * m_ax;
      var P=b2Vec2.AddVV(b2Vec2.MulSV(this.m_impulse,this.m_ay,b2Vec2.s_t0),b2Vec2.MulSV(this.m_springImpulse,this.m_ax,b2Vec2.s_t1),b2WheelJoint.InitVelocityConstraints_s_P);// float32 LA = m_impulse * m_sAy + m_springImpulse * m_sAx + m_motorImpulse;
      var LA=this.m_impulse*this.m_sAy+this.m_springImpulse*this.m_sAx+this.m_motorImpulse;// float32 LB = m_impulse * m_sBy + m_springImpulse * m_sBx + m_motorImpulse;
      var LB=this.m_impulse*this.m_sBy+this.m_springImpulse*this.m_sBx+this.m_motorImpulse;// vA -= m_invMassA * P;
      vA.SelfMulSub(this.m_invMassA,P);wA-=this.m_invIA*LA;// vB += m_invMassB * P;
      vB.SelfMulAdd(this.m_invMassB,P);wB+=this.m_invIB*LB;}else {this.m_impulse=0;this.m_springImpulse=0;this.m_motorImpulse=0;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(data){var mA=this.m_invMassA,mB=this.m_invMassB;var iA=this.m_invIA,iB=this.m_invIB;var vA=data.velocities[this.m_indexA].v;var wA=data.velocities[this.m_indexA].w;var vB=data.velocities[this.m_indexB].v;var wB=data.velocities[this.m_indexB].w;// Solve spring constraint
      {var Cdot=b2Vec2.DotVV(this.m_ax,b2Vec2.SubVV(vB,vA,b2Vec2.s_t0))+this.m_sBx*wB-this.m_sAx*wA;var impulse=-this.m_springMass*(Cdot+this.m_bias+this.m_gamma*this.m_springImpulse);this.m_springImpulse+=impulse;// b2Vec2 P = impulse * m_ax;
      var P=b2Vec2.MulSV(impulse,this.m_ax,b2WheelJoint.SolveVelocityConstraints_s_P);var LA=impulse*this.m_sAx;var LB=impulse*this.m_sBx;// vA -= mA * P;
      vA.SelfMulSub(mA,P);wA-=iA*LA;// vB += mB * P;
      vB.SelfMulAdd(mB,P);wB+=iB*LB;}// Solve rotational motor constraint
      {var _Cdot3=wB-wA-this.m_motorSpeed;var _impulse=-this.m_motorMass*_Cdot3;var oldImpulse=this.m_motorImpulse;var maxImpulse=data.step.dt*this.m_maxMotorTorque;this.m_motorImpulse=b2Clamp(this.m_motorImpulse+_impulse,-maxImpulse,maxImpulse);_impulse=this.m_motorImpulse-oldImpulse;wA-=iA*_impulse;wB+=iB*_impulse;}// Solve point to line constraint
      {var _Cdot4=b2Vec2.DotVV(this.m_ay,b2Vec2.SubVV(vB,vA,b2Vec2.s_t0))+this.m_sBy*wB-this.m_sAy*wA;var _impulse2=-this.m_mass*_Cdot4;this.m_impulse+=_impulse2;// b2Vec2 P = impulse * m_ay;
      var _P7=b2Vec2.MulSV(_impulse2,this.m_ay,b2WheelJoint.SolveVelocityConstraints_s_P);var _LA3=_impulse2*this.m_sAy;var _LB3=_impulse2*this.m_sBy;// vA -= mA * P;
      vA.SelfMulSub(mA,_P7);wA-=iA*_LA3;// vB += mB * P;
      vB.SelfMulAdd(mB,_P7);wB+=iB*_LB3;}// data.velocities[this.m_indexA].v = vA;
      data.velocities[this.m_indexA].w=wA;// data.velocities[this.m_indexB].v = vB;
      data.velocities[this.m_indexB].w=wB;}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(data){var cA=data.positions[this.m_indexA].c;var aA=data.positions[this.m_indexA].a;var cB=data.positions[this.m_indexB].c;var aB=data.positions[this.m_indexB].a;var qA=this.m_qA.SetAngle(aA),qB=this.m_qB.SetAngle(aB);// b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
      b2Vec2.SubVV(this.m_localAnchorA,this.m_localCenterA,this.m_lalcA);var rA=b2Rot.MulRV(qA,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
      b2Vec2.SubVV(this.m_localAnchorB,this.m_localCenterB,this.m_lalcB);var rB=b2Rot.MulRV(qB,this.m_lalcB,this.m_rB);// b2Vec2 d = (cB - cA) + rB - rA;
      var d=b2Vec2.AddVV(b2Vec2.SubVV(cB,cA,b2Vec2.s_t0),b2Vec2.SubVV(rB,rA,b2Vec2.s_t1),b2WheelJoint.SolvePositionConstraints_s_d);// b2Vec2 ay = b2Mul(qA, m_localYAxisA);
      var ay=b2Rot.MulRV(qA,this.m_localYAxisA,this.m_ay);// float32 sAy = b2Cross(d + rA, ay);
      var sAy=b2Vec2.CrossVV(b2Vec2.AddVV(d,rA,b2Vec2.s_t0),ay);// float32 sBy = b2Cross(rB, ay);
      var sBy=b2Vec2.CrossVV(rB,ay);// float32 C = b2Dot(d, ay);
      var C=b2Vec2.DotVV(d,this.m_ay);var k=this.m_invMassA+this.m_invMassB+this.m_invIA*this.m_sAy*this.m_sAy+this.m_invIB*this.m_sBy*this.m_sBy;var impulse;if(k!==0){impulse=-C/k;}else {impulse=0;}// b2Vec2 P = impulse * ay;
      var P=b2Vec2.MulSV(impulse,ay,b2WheelJoint.SolvePositionConstraints_s_P);var LA=impulse*sAy;var LB=impulse*sBy;// cA -= m_invMassA * P;
      cA.SelfMulSub(this.m_invMassA,P);aA-=this.m_invIA*LA;// cB += m_invMassB * P;
      cB.SelfMulAdd(this.m_invMassB,P);aB+=this.m_invIB*LB;// data.positions[this.m_indexA].c = cA;
      data.positions[this.m_indexA].a=aA;// data.positions[this.m_indexB].c = cB;
      data.positions[this.m_indexB].a=aB;return b2Abs(C)<=b2_linearSlop;}},{key:"GetDefinition",value:function GetDefinition(def){// DEBUG: b2Assert(false); // TODO
      return def;}},{key:"GetAnchorA",value:function GetAnchorA(out){return this.m_bodyA.GetWorldPoint(this.m_localAnchorA,out);}},{key:"GetAnchorB",value:function GetAnchorB(out){return this.m_bodyB.GetWorldPoint(this.m_localAnchorB,out);}},{key:"GetReactionForce",value:function GetReactionForce(inv_dt,out){// return inv_dt * (m_impulse * m_ay + m_springImpulse * m_ax);
      out.x=inv_dt*(this.m_impulse*this.m_ay.x+this.m_springImpulse*this.m_ax.x);out.y=inv_dt*(this.m_impulse*this.m_ay.y+this.m_springImpulse*this.m_ax.y);return out;}},{key:"GetReactionTorque",value:function GetReactionTorque(inv_dt){return inv_dt*this.m_motorImpulse;}},{key:"GetLocalAnchorA",value:function GetLocalAnchorA(){return this.m_localAnchorA;}},{key:"GetLocalAnchorB",value:function GetLocalAnchorB(){return this.m_localAnchorB;}},{key:"GetLocalAxisA",value:function GetLocalAxisA(){return this.m_localXAxisA;}},{key:"GetJointTranslation",value:function GetJointTranslation(){return this.GetPrismaticJointTranslation();}},{key:"GetJointLinearSpeed",value:function GetJointLinearSpeed(){return this.GetPrismaticJointSpeed();}},{key:"GetJointAngle",value:function GetJointAngle(){return this.GetRevoluteJointAngle();}},{key:"GetJointAngularSpeed",value:function GetJointAngularSpeed(){return this.GetRevoluteJointSpeed();}},{key:"GetPrismaticJointTranslation",value:function GetPrismaticJointTranslation(){var bA=this.m_bodyA;var bB=this.m_bodyB;var pA=bA.GetWorldPoint(this.m_localAnchorA,new b2Vec2());var pB=bB.GetWorldPoint(this.m_localAnchorB,new b2Vec2());var d=b2Vec2.SubVV(pB,pA,new b2Vec2());var axis=bA.GetWorldVector(this.m_localXAxisA,new b2Vec2());var translation=b2Vec2.DotVV(d,axis);return translation;}},{key:"GetPrismaticJointSpeed",value:function GetPrismaticJointSpeed(){var bA=this.m_bodyA;var bB=this.m_bodyB;// b2Vec2 rA = b2Mul(bA->m_xf.q, m_localAnchorA - bA->m_sweep.localCenter);
      b2Vec2.SubVV(this.m_localAnchorA,bA.m_sweep.localCenter,this.m_lalcA);var rA=b2Rot.MulRV(bA.m_xf.q,this.m_lalcA,this.m_rA);// b2Vec2 rB = b2Mul(bB->m_xf.q, m_localAnchorB - bB->m_sweep.localCenter);
      b2Vec2.SubVV(this.m_localAnchorB,bB.m_sweep.localCenter,this.m_lalcB);var rB=b2Rot.MulRV(bB.m_xf.q,this.m_lalcB,this.m_rB);// b2Vec2 pA = bA->m_sweep.c + rA;
      var pA=b2Vec2.AddVV(bA.m_sweep.c,rA,b2Vec2.s_t0);// pA uses s_t0
      // b2Vec2 pB = bB->m_sweep.c + rB;
      var pB=b2Vec2.AddVV(bB.m_sweep.c,rB,b2Vec2.s_t1);// pB uses s_t1
      // b2Vec2 d = pB - pA;
      var d=b2Vec2.SubVV(pB,pA,b2Vec2.s_t2);// d uses s_t2
      // b2Vec2 axis = b2Mul(bA.m_xf.q, m_localXAxisA);
      var axis=bA.GetWorldVector(this.m_localXAxisA,new b2Vec2());var vA=bA.m_linearVelocity;var vB=bB.m_linearVelocity;var wA=bA.m_angularVelocity;var wB=bB.m_angularVelocity;// float32 speed = b2Dot(d, b2Cross(wA, axis)) + b2Dot(axis, vB + b2Cross(wB, rB) - vA - b2Cross(wA, rA));
      var speed=b2Vec2.DotVV(d,b2Vec2.CrossSV(wA,axis,b2Vec2.s_t0))+b2Vec2.DotVV(axis,b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,rA,b2Vec2.s_t1),b2Vec2.s_t0));return speed;}},{key:"GetRevoluteJointAngle",value:function GetRevoluteJointAngle(){// b2Body* bA = this.m_bodyA;
      // b2Body* bB = this.m_bodyB;
      // return bB->this.m_sweep.a - bA->this.m_sweep.a;
      return this.m_bodyB.m_sweep.a-this.m_bodyA.m_sweep.a;}},{key:"GetRevoluteJointSpeed",value:function GetRevoluteJointSpeed(){var wA=this.m_bodyA.m_angularVelocity;var wB=this.m_bodyB.m_angularVelocity;return wB-wA;}},{key:"IsMotorEnabled",value:function IsMotorEnabled(){return this.m_enableMotor;}},{key:"EnableMotor",value:function EnableMotor(flag){if(flag!==this.m_enableMotor){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_enableMotor=flag;}}},{key:"SetMotorSpeed",value:function SetMotorSpeed(speed){if(speed!==this.m_motorSpeed){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_motorSpeed=speed;}}},{key:"SetMaxMotorTorque",value:function SetMaxMotorTorque(force){if(force!==this.m_maxMotorTorque){this.m_bodyA.SetAwake(true);this.m_bodyB.SetAwake(true);this.m_maxMotorTorque=force;}}},{key:"GetMotorTorque",value:function GetMotorTorque(inv_dt){return inv_dt*this.m_motorImpulse;}},{key:"Dump",value:function Dump(log){var indexA=this.m_bodyA.m_islandIndex;var indexB=this.m_bodyB.m_islandIndex;log("  const jd: b2WheelJointDef = new b2WheelJointDef();\n");log("  jd.bodyA = bodies[%d];\n",indexA);log("  jd.bodyB = bodies[%d];\n",indexB);log("  jd.collideConnected = %s;\n",this.m_collideConnected?"true":"false");log("  jd.localAnchorA.Set(%.15f, %.15f);\n",this.m_localAnchorA.x,this.m_localAnchorA.y);log("  jd.localAnchorB.Set(%.15f, %.15f);\n",this.m_localAnchorB.x,this.m_localAnchorB.y);log("  jd.localAxisA.Set(%.15f, %.15f);\n",this.m_localXAxisA.x,this.m_localXAxisA.y);log("  jd.enableMotor = %s;\n",this.m_enableMotor?"true":"false");log("  jd.motorSpeed = %.15f;\n",this.m_motorSpeed);log("  jd.maxMotorTorque = %.15f;\n",this.m_maxMotorTorque);log("  jd.frequencyHz = %.15f;\n",this.m_frequencyHz);log("  jd.dampingRatio = %.15f;\n",this.m_dampingRatio);log("  joints[%d] = this.m_world.CreateJoint(jd);\n",this.m_index);}}]);}(b2Joint);b2WheelJoint.InitVelocityConstraints_s_d=new b2Vec2();b2WheelJoint.InitVelocityConstraints_s_P=new b2Vec2();b2WheelJoint.SolveVelocityConstraints_s_P=new b2Vec2();b2WheelJoint.SolvePositionConstraints_s_d=new b2Vec2();b2WheelJoint.SolvePositionConstraints_s_P=new b2Vec2();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Friction mixing law. The idea is to allow either fixture to drive the friction to zero.
      /// For example, anything slides on ice.
      function b2MixFriction(friction1,friction2){return b2Sqrt(friction1*friction2);}/// Restitution mixing law. The idea is allow for anything to bounce off an inelastic surface.
      /// For example, a superball bounces on anything.
      function b2MixRestitution(restitution1,restitution2){return restitution1>restitution2?restitution1:restitution2;}var b2ContactEdge=/*#__PURE__*/function(){function b2ContactEdge(contact){_classCallCheck(this,b2ContactEdge);this._other=null;///< provides quick access to the other body attached.
      this.prev=null;///< the previous contact edge in the body's contact list
      this.next=null;///< the next contact edge in the body's contact list
      this.contact=contact;}return _createClass(b2ContactEdge,[{key:"other",get:function get(){if(this._other===null){throw new Error();}return this._other;},set:function set(value){if(this._other!==null){throw new Error();}this._other=value;}},{key:"Reset",value:function Reset(){this._other=null;this.prev=null;this.next=null;}}]);}();var b2Contact=/*#__PURE__*/function(){function b2Contact(){_classCallCheck(this,b2Contact);this.m_islandFlag=false;/// Used when crawling contact graph when forming islands.
      this.m_touchingFlag=false;/// Set when the shapes are touching.
      this.m_enabledFlag=false;/// This contact can be disabled (by user)
      this.m_filterFlag=false;/// This contact needs filtering because a fixture filter was changed.
      this.m_bulletHitFlag=false;/// This bullet contact had a TOI event
      this.m_toiFlag=false;/// This contact has a valid TOI in m_toi
      this.m_prev=null;this.m_next=null;this.m_nodeA=new b2ContactEdge(this);this.m_nodeB=new b2ContactEdge(this);this.m_indexA=0;this.m_indexB=0;this.m_manifold=new b2Manifold();// TODO: readonly
      this.m_toiCount=0;this.m_toi=0;this.m_friction=0;this.m_restitution=0;this.m_tangentSpeed=0;this.m_oldManifold=new b2Manifold();// TODO: readonly
      }return _createClass(b2Contact,[{key:"GetManifold",value:function GetManifold(){return this.m_manifold;}},{key:"GetWorldManifold",value:function GetWorldManifold(worldManifold){var bodyA=this.m_fixtureA.GetBody();var bodyB=this.m_fixtureB.GetBody();var shapeA=this.GetShapeA();var shapeB=this.GetShapeB();worldManifold.Initialize(this.m_manifold,bodyA.GetTransform(),shapeA.m_radius,bodyB.GetTransform(),shapeB.m_radius);}},{key:"IsTouching",value:function IsTouching(){return this.m_touchingFlag;}},{key:"SetEnabled",value:function SetEnabled(flag){this.m_enabledFlag=flag;}},{key:"IsEnabled",value:function IsEnabled(){return this.m_enabledFlag;}},{key:"GetNext",value:function GetNext(){return this.m_next;}},{key:"GetFixtureA",value:function GetFixtureA(){return this.m_fixtureA;}},{key:"GetChildIndexA",value:function GetChildIndexA(){return this.m_indexA;}},{key:"GetShapeA",value:function GetShapeA(){return this.m_fixtureA.GetShape();}},{key:"GetFixtureB",value:function GetFixtureB(){return this.m_fixtureB;}},{key:"GetChildIndexB",value:function GetChildIndexB(){return this.m_indexB;}},{key:"GetShapeB",value:function GetShapeB(){return this.m_fixtureB.GetShape();}},{key:"FlagForFiltering",value:function FlagForFiltering(){this.m_filterFlag=true;}},{key:"SetFriction",value:function SetFriction(friction){this.m_friction=friction;}},{key:"GetFriction",value:function GetFriction(){return this.m_friction;}},{key:"ResetFriction",value:function ResetFriction(){this.m_friction=b2MixFriction(this.m_fixtureA.m_friction,this.m_fixtureB.m_friction);}},{key:"SetRestitution",value:function SetRestitution(restitution){this.m_restitution=restitution;}},{key:"GetRestitution",value:function GetRestitution(){return this.m_restitution;}},{key:"ResetRestitution",value:function ResetRestitution(){this.m_restitution=b2MixRestitution(this.m_fixtureA.m_restitution,this.m_fixtureB.m_restitution);}},{key:"SetTangentSpeed",value:function SetTangentSpeed(speed){this.m_tangentSpeed=speed;}},{key:"GetTangentSpeed",value:function GetTangentSpeed(){return this.m_tangentSpeed;}},{key:"Reset",value:function Reset(fixtureA,indexA,fixtureB,indexB){this.m_islandFlag=false;this.m_touchingFlag=false;this.m_enabledFlag=true;this.m_filterFlag=false;this.m_bulletHitFlag=false;this.m_toiFlag=false;this.m_fixtureA=fixtureA;this.m_fixtureB=fixtureB;this.m_indexA=indexA;this.m_indexB=indexB;this.m_manifold.pointCount=0;this.m_prev=null;this.m_next=null;this.m_nodeA.Reset();this.m_nodeB.Reset();this.m_toiCount=0;this.m_friction=b2MixFriction(this.m_fixtureA.m_friction,this.m_fixtureB.m_friction);this.m_restitution=b2MixRestitution(this.m_fixtureA.m_restitution,this.m_fixtureB.m_restitution);}},{key:"Update",value:function Update(listener){var tManifold=this.m_oldManifold;this.m_oldManifold=this.m_manifold;this.m_manifold=tManifold;// Re-enable this contact.
      this.m_enabledFlag=true;var touching=false;var wasTouching=this.m_touchingFlag;var sensorA=this.m_fixtureA.IsSensor();var sensorB=this.m_fixtureB.IsSensor();var sensor=sensorA||sensorB;var bodyA=this.m_fixtureA.GetBody();var bodyB=this.m_fixtureB.GetBody();var xfA=bodyA.GetTransform();var xfB=bodyB.GetTransform();// Is this contact a sensor?
      if(sensor){var shapeA=this.GetShapeA();var shapeB=this.GetShapeB();touching=b2TestOverlapShape(shapeA,this.m_indexA,shapeB,this.m_indexB,xfA,xfB);// Sensors don't generate manifolds.
      this.m_manifold.pointCount=0;}else {this.Evaluate(this.m_manifold,xfA,xfB);touching=this.m_manifold.pointCount>0;// Match old contact ids to new contact ids and copy the
      // stored impulses to warm start the solver.
      for(var i=0;i<this.m_manifold.pointCount;++i){var mp2=this.m_manifold.points[i];mp2.normalImpulse=0;mp2.tangentImpulse=0;var id2=mp2.id;for(var j=0;j<this.m_oldManifold.pointCount;++j){var mp1=this.m_oldManifold.points[j];if(mp1.id.key===id2.key){mp2.normalImpulse=mp1.normalImpulse;mp2.tangentImpulse=mp1.tangentImpulse;break;}}}if(touching!==wasTouching){bodyA.SetAwake(true);bodyB.SetAwake(true);}}this.m_touchingFlag=touching;if(!wasTouching&&touching&&listener){listener.BeginContact(this);}if(wasTouching&&!touching&&listener){listener.EndContact(this);}if(!sensor&&touching&&listener){listener.PreSolve(this,this.m_oldManifold);}}},{key:"ComputeTOI",value:function ComputeTOI(sweepA,sweepB){var input=b2Contact.ComputeTOI_s_input;input.proxyA.SetShape(this.GetShapeA(),this.m_indexA);input.proxyB.SetShape(this.GetShapeB(),this.m_indexB);input.sweepA.Copy(sweepA);input.sweepB.Copy(sweepB);input.tMax=b2_linearSlop;var output=b2Contact.ComputeTOI_s_output;b2TimeOfImpact(output,input);return output.t;}}]);}();b2Contact.ComputeTOI_s_input=new b2TOIInput();b2Contact.ComputeTOI_s_output=new b2TOIOutput();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2CircleContact=/*#__PURE__*/function(_b2Contact){function b2CircleContact(){_classCallCheck(this,b2CircleContact);return _callSuper(this,b2CircleContact,arguments);}_inherits(b2CircleContact,_b2Contact);return _createClass(b2CircleContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){b2CollideCircles(manifold,this.GetShapeA(),xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2CircleContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2PolygonContact=/*#__PURE__*/function(_b2Contact2){function b2PolygonContact(){_classCallCheck(this,b2PolygonContact);return _callSuper(this,b2PolygonContact,arguments);}_inherits(b2PolygonContact,_b2Contact2);return _createClass(b2PolygonContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){b2CollidePolygons(manifold,this.GetShapeA(),xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2PolygonContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2PolygonAndCircleContact=/*#__PURE__*/function(_b2Contact3){function b2PolygonAndCircleContact(){_classCallCheck(this,b2PolygonAndCircleContact);return _callSuper(this,b2PolygonAndCircleContact,arguments);}_inherits(b2PolygonAndCircleContact,_b2Contact3);return _createClass(b2PolygonAndCircleContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){b2CollidePolygonAndCircle(manifold,this.GetShapeA(),xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2PolygonAndCircleContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2EdgeAndCircleContact=/*#__PURE__*/function(_b2Contact4){function b2EdgeAndCircleContact(){_classCallCheck(this,b2EdgeAndCircleContact);return _callSuper(this,b2EdgeAndCircleContact,arguments);}_inherits(b2EdgeAndCircleContact,_b2Contact4);return _createClass(b2EdgeAndCircleContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){b2CollideEdgeAndCircle(manifold,this.GetShapeA(),xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2EdgeAndCircleContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2EdgeAndPolygonContact=/*#__PURE__*/function(_b2Contact5){function b2EdgeAndPolygonContact(){_classCallCheck(this,b2EdgeAndPolygonContact);return _callSuper(this,b2EdgeAndPolygonContact,arguments);}_inherits(b2EdgeAndPolygonContact,_b2Contact5);return _createClass(b2EdgeAndPolygonContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){b2CollideEdgeAndPolygon(manifold,this.GetShapeA(),xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2EdgeAndPolygonContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2ChainAndCircleContact=/*#__PURE__*/function(_b2Contact6){function b2ChainAndCircleContact(){_classCallCheck(this,b2ChainAndCircleContact);return _callSuper(this,b2ChainAndCircleContact,arguments);}_inherits(b2ChainAndCircleContact,_b2Contact6);return _createClass(b2ChainAndCircleContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){var edge=b2ChainAndCircleContact.Evaluate_s_edge;this.GetShapeA().GetChildEdge(edge,this.m_indexA);b2CollideEdgeAndCircle(manifold,edge,xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2ChainAndCircleContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);b2ChainAndCircleContact.Evaluate_s_edge=new b2EdgeShape();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */var b2ChainAndPolygonContact=/*#__PURE__*/function(_b2Contact7){function b2ChainAndPolygonContact(){_classCallCheck(this,b2ChainAndPolygonContact);return _callSuper(this,b2ChainAndPolygonContact,arguments);}_inherits(b2ChainAndPolygonContact,_b2Contact7);return _createClass(b2ChainAndPolygonContact,[{key:"Evaluate",value:function Evaluate(manifold,xfA,xfB){var edge=b2ChainAndPolygonContact.Evaluate_s_edge;this.GetShapeA().GetChildEdge(edge,this.m_indexA);b2CollideEdgeAndPolygon(manifold,edge,xfA,this.GetShapeB(),xfB);}}],[{key:"Create",value:function Create(){return new b2ChainAndPolygonContact();}},{key:"Destroy",value:function Destroy(contact){}}]);}(b2Contact);b2ChainAndPolygonContact.Evaluate_s_edge=new b2EdgeShape();// DEBUG: import { b2Assert } from "../common/b2_settings.js";
      var b2ContactRegister=/*#__PURE__*/_createClass(function b2ContactRegister(){_classCallCheck(this,b2ContactRegister);this.pool=[];this.createFcn=null;this.destroyFcn=null;this.primary=false;});var b2ContactFactory=/*#__PURE__*/function(){function b2ContactFactory(){_classCallCheck(this,b2ContactFactory);this.m_registers=[];this.InitializeRegisters();}return _createClass(b2ContactFactory,[{key:"AddType",value:function AddType(createFcn,destroyFcn,typeA,typeB){var pool=[];function poolCreateFcn(){return pool.pop()||createFcn();}function poolDestroyFcn(contact){pool.push(contact);}this.m_registers[typeA][typeB].pool=pool;this.m_registers[typeA][typeB].createFcn=poolCreateFcn;// createFcn;
      this.m_registers[typeA][typeB].destroyFcn=poolDestroyFcn;// destroyFcn;
      this.m_registers[typeA][typeB].primary=true;if(typeA!==typeB){this.m_registers[typeB][typeA].pool=pool;this.m_registers[typeB][typeA].createFcn=poolCreateFcn;// createFcn;
      this.m_registers[typeB][typeA].destroyFcn=poolDestroyFcn;// destroyFcn;
      this.m_registers[typeB][typeA].primary=false;}}},{key:"InitializeRegisters",value:function InitializeRegisters(){for(var i=0;i<exports.b2ShapeType.e_shapeTypeCount;i++){this.m_registers[i]=[];for(var j=0;j<exports.b2ShapeType.e_shapeTypeCount;j++){this.m_registers[i][j]=new b2ContactRegister();}}this.AddType(b2CircleContact.Create,b2CircleContact.Destroy,exports.b2ShapeType.e_circleShape,exports.b2ShapeType.e_circleShape);this.AddType(b2PolygonAndCircleContact.Create,b2PolygonAndCircleContact.Destroy,exports.b2ShapeType.e_polygonShape,exports.b2ShapeType.e_circleShape);this.AddType(b2PolygonContact.Create,b2PolygonContact.Destroy,exports.b2ShapeType.e_polygonShape,exports.b2ShapeType.e_polygonShape);this.AddType(b2EdgeAndCircleContact.Create,b2EdgeAndCircleContact.Destroy,exports.b2ShapeType.e_edgeShape,exports.b2ShapeType.e_circleShape);this.AddType(b2EdgeAndPolygonContact.Create,b2EdgeAndPolygonContact.Destroy,exports.b2ShapeType.e_edgeShape,exports.b2ShapeType.e_polygonShape);this.AddType(b2ChainAndCircleContact.Create,b2ChainAndCircleContact.Destroy,exports.b2ShapeType.e_chainShape,exports.b2ShapeType.e_circleShape);this.AddType(b2ChainAndPolygonContact.Create,b2ChainAndPolygonContact.Destroy,exports.b2ShapeType.e_chainShape,exports.b2ShapeType.e_polygonShape);}},{key:"Create",value:function Create(fixtureA,indexA,fixtureB,indexB){var typeA=fixtureA.GetType();var typeB=fixtureB.GetType();// DEBUG: b2Assert(0 <= typeA && typeA < b2ShapeType.e_shapeTypeCount);
      // DEBUG: b2Assert(0 <= typeB && typeB < b2ShapeType.e_shapeTypeCount);
      var reg=this.m_registers[typeA][typeB];if(reg.createFcn){var c=reg.createFcn();if(reg.primary){c.Reset(fixtureA,indexA,fixtureB,indexB);}else {c.Reset(fixtureB,indexB,fixtureA,indexA);}return c;}else {return null;}}},{key:"Destroy",value:function Destroy(contact){var typeA=contact.m_fixtureA.GetType();var typeB=contact.m_fixtureB.GetType();// DEBUG: b2Assert(0 <= typeA && typeB < b2ShapeType.e_shapeTypeCount);
      // DEBUG: b2Assert(0 <= typeA && typeB < b2ShapeType.e_shapeTypeCount);
      var reg=this.m_registers[typeA][typeB];if(reg.destroyFcn){reg.destroyFcn(contact);}}}]);}();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */// #endif
      /// Joints and fixtures are destroyed when their associated
      /// body is destroyed. Implement this listener so that you
      /// may nullify references to these joints and shapes.
      var b2DestructionListener=/*#__PURE__*/function(){function b2DestructionListener(){_classCallCheck(this,b2DestructionListener);}return _createClass(b2DestructionListener,[{key:"SayGoodbyeJoint",value:/// Called when any joint is about to be destroyed due
      /// to the destruction of one of its attached bodies.
      function SayGoodbyeJoint(joint){}/// Called when any fixture is about to be destroyed due
      /// to the destruction of its parent body.
      },{key:"SayGoodbyeFixture",value:function SayGoodbyeFixture(fixture){}// #if B2_ENABLE_PARTICLE
      /// Called when any particle group is about to be destroyed.
      },{key:"SayGoodbyeParticleGroup",value:function SayGoodbyeParticleGroup(group){}/// Called when a particle is about to be destroyed.
      /// The index can be used in conjunction with
      /// b2ParticleSystem::GetUserDataBuffer() or
      /// b2ParticleSystem::GetParticleHandleFromIndex() to determine which
      /// particle has been destroyed.
      },{key:"SayGoodbyeParticle",value:function SayGoodbyeParticle(system,index){}}]);}();/// Implement this class to provide collision filtering. In other words, you can implement
      /// this class if you want finer control over contact creation.
      var b2ContactFilter=/*#__PURE__*/function(){function b2ContactFilter(){_classCallCheck(this,b2ContactFilter);}return _createClass(b2ContactFilter,[{key:"ShouldCollide",value:/// Return true if contact calculations should be performed between these two shapes.
      /// @warning for performance reasons this is only called when the AABBs begin to overlap.
      function ShouldCollide(fixtureA,fixtureB){var bodyA=fixtureA.GetBody();var bodyB=fixtureB.GetBody();// At least one body should be dynamic or kinematic.
      if(bodyB.GetType()===exports.b2BodyType.b2_staticBody&&bodyA.GetType()===exports.b2BodyType.b2_staticBody){return false;}// Does a joint prevent collision?
      if(!bodyB.ShouldCollideConnected(bodyA)){return false;}var filter1=fixtureA.GetFilterData();var filter2=fixtureB.GetFilterData();if(filter1.groupIndex===filter2.groupIndex&&filter1.groupIndex!==0){return filter1.groupIndex>0;}var collide=(filter1.maskBits&filter2.categoryBits)!==0&&(filter1.categoryBits&filter2.maskBits)!==0;return collide;}// #if B2_ENABLE_PARTICLE
      },{key:"ShouldCollideFixtureParticle",value:function ShouldCollideFixtureParticle(fixture,system,index){return true;}},{key:"ShouldCollideParticleParticle",value:function ShouldCollideParticleParticle(system,indexA,indexB){return true;}}]);}();// #endif
      b2ContactFilter.b2_defaultFilter=new b2ContactFilter();/// Contact impulses for reporting. Impulses are used instead of forces because
      /// sub-step forces may approach infinity for rigid body collisions. These
      /// match up one-to-one with the contact points in b2Manifold.
      var b2ContactImpulse=/*#__PURE__*/_createClass(function b2ContactImpulse(){_classCallCheck(this,b2ContactImpulse);this.normalImpulses=b2MakeNumberArray(b2_maxManifoldPoints);this.tangentImpulses=b2MakeNumberArray(b2_maxManifoldPoints);this.count=0;});/// Implement this class to get contact information. You can use these results for
      /// things like sounds and game logic. You can also get contact results by
      /// traversing the contact lists after the time step. However, you might miss
      /// some contacts because continuous physics leads to sub-stepping.
      /// Additionally you may receive multiple callbacks for the same contact in a
      /// single time step.
      /// You should strive to make your callbacks efficient because there may be
      /// many callbacks per time step.
      /// @warning You cannot create/destroy Box2D entities inside these callbacks.
      var b2ContactListener=/*#__PURE__*/function(){function b2ContactListener(){_classCallCheck(this,b2ContactListener);}return _createClass(b2ContactListener,[{key:"BeginContact",value:/// Called when two fixtures begin to touch.
      function BeginContact(contact){}/// Called when two fixtures cease to touch.
      },{key:"EndContact",value:function EndContact(contact){}// #if B2_ENABLE_PARTICLE
      },{key:"BeginContactFixtureParticle",value:function BeginContactFixtureParticle(system,contact){}},{key:"EndContactFixtureParticle",value:function EndContactFixtureParticle(system,contact){}},{key:"BeginContactParticleParticle",value:function BeginContactParticleParticle(system,contact){}},{key:"EndContactParticleParticle",value:function EndContactParticleParticle(system,contact){}// #endif
      /// This is called after a contact is updated. This allows you to inspect a
      /// contact before it goes to the solver. If you are careful, you can modify the
      /// contact manifold (e.g. disable contact).
      /// A copy of the old manifold is provided so that you can detect changes.
      /// Note: this is called only for awake bodies.
      /// Note: this is called even when the number of contact points is zero.
      /// Note: this is not called for sensors.
      /// Note: if you set the number of contact points to zero, you will not
      /// get an EndContact callback. However, you may get a BeginContact callback
      /// the next step.
      },{key:"PreSolve",value:function PreSolve(contact,oldManifold){}/// This lets you inspect a contact after the solver is finished. This is useful
      /// for inspecting impulses.
      /// Note: the contact manifold does not include time of impact impulses, which can be
      /// arbitrarily large if the sub-step is small. Hence the impulse is provided explicitly
      /// in a separate data structure.
      /// Note: this is only called for contacts that are touching, solid, and awake.
      },{key:"PostSolve",value:function PostSolve(contact,impulse){}}]);}();b2ContactListener.b2_defaultListener=new b2ContactListener();/// Callback class for AABB queries.
      /// See b2World::Query
      var b2QueryCallback=/*#__PURE__*/function(){function b2QueryCallback(){_classCallCheck(this,b2QueryCallback);}return _createClass(b2QueryCallback,[{key:"ReportFixture",value:/// Called for each fixture found in the query AABB.
      /// @return false to terminate the query.
      function ReportFixture(fixture){return true;}// #if B2_ENABLE_PARTICLE
      },{key:"ReportParticle",value:function ReportParticle(system,index){return false;}},{key:"ShouldQueryParticleSystem",value:function ShouldQueryParticleSystem(system){return true;}}]);}();/// Callback class for ray casts.
      /// See b2World::RayCast
      var b2RayCastCallback=/*#__PURE__*/function(){function b2RayCastCallback(){_classCallCheck(this,b2RayCastCallback);}return _createClass(b2RayCastCallback,[{key:"ReportFixture",value:/// Called for each fixture found in the query. You control how the ray cast
      /// proceeds by returning a float:
      /// return -1: ignore this fixture and continue
      /// return 0: terminate the ray cast
      /// return fraction: clip the ray to this point
      /// return 1: don't clip the ray and continue
      /// @param fixture the fixture hit by the ray
      /// @param point the point of initial intersection
      /// @param normal the normal vector at the point of intersection
      /// @return -1 to filter, 0 to terminate, fraction to clip the ray for
      /// closest hit, 1 to continue
      function ReportFixture(fixture,point,normal,fraction){return fraction;}// #if B2_ENABLE_PARTICLE
      },{key:"ReportParticle",value:function ReportParticle(system,index,point,normal,fraction){return 0;}},{key:"ShouldQueryParticleSystem",value:function ShouldQueryParticleSystem(system){return true;}}]);}();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */// Delegate of b2World.
      var b2ContactManager=/*#__PURE__*/function(){function b2ContactManager(){_classCallCheck(this,b2ContactManager);this.m_broadPhase=new b2BroadPhase();this.m_contactList=null;this.m_contactCount=0;this.m_contactFilter=b2ContactFilter.b2_defaultFilter;this.m_contactListener=b2ContactListener.b2_defaultListener;this.m_contactFactory=new b2ContactFactory();}// Broad-phase callback.
      return _createClass(b2ContactManager,[{key:"AddPair",value:function AddPair(proxyA,proxyB){// DEBUG: b2Assert(proxyA instanceof b2FixtureProxy);
      // DEBUG: b2Assert(proxyB instanceof b2FixtureProxy);
      var fixtureA=proxyA.fixture;var fixtureB=proxyB.fixture;var indexA=proxyA.childIndex;var indexB=proxyB.childIndex;var bodyA=fixtureA.GetBody();var bodyB=fixtureB.GetBody();// Are the fixtures on the same body?
      if(bodyA===bodyB){return;}// TODO_ERIN use a hash table to remove a potential bottleneck when both
      // bodies have a lot of contacts.
      // Does a contact already exist?
      var edge=bodyB.GetContactList();while(edge){if(edge.other===bodyA){var fA=edge.contact.GetFixtureA();var fB=edge.contact.GetFixtureB();var iA=edge.contact.GetChildIndexA();var iB=edge.contact.GetChildIndexB();if(fA===fixtureA&&fB===fixtureB&&iA===indexA&&iB===indexB){// A contact already exists.
      return;}if(fA===fixtureB&&fB===fixtureA&&iA===indexB&&iB===indexA){// A contact already exists.
      return;}}edge=edge.next;}// Check user filtering.
      if(this.m_contactFilter&&!this.m_contactFilter.ShouldCollide(fixtureA,fixtureB)){return;}// Call the factory.
      var c=this.m_contactFactory.Create(fixtureA,indexA,fixtureB,indexB);if(c===null){return;}// Contact creation may swap fixtures.
      fixtureA=c.GetFixtureA();fixtureB=c.GetFixtureB();indexA=c.GetChildIndexA();indexB=c.GetChildIndexB();bodyA=fixtureA.m_body;bodyB=fixtureB.m_body;// Insert into the world.
      c.m_prev=null;c.m_next=this.m_contactList;if(this.m_contactList!==null){this.m_contactList.m_prev=c;}this.m_contactList=c;// Connect to island graph.
      // Connect to body A
      c.m_nodeA.other=bodyB;c.m_nodeA.prev=null;c.m_nodeA.next=bodyA.m_contactList;if(bodyA.m_contactList!==null){bodyA.m_contactList.prev=c.m_nodeA;}bodyA.m_contactList=c.m_nodeA;// Connect to body B
      c.m_nodeB.other=bodyA;c.m_nodeB.prev=null;c.m_nodeB.next=bodyB.m_contactList;if(bodyB.m_contactList!==null){bodyB.m_contactList.prev=c.m_nodeB;}bodyB.m_contactList=c.m_nodeB;// Wake up the bodies
      if(!fixtureA.IsSensor()&&!fixtureB.IsSensor()){bodyA.SetAwake(true);bodyB.SetAwake(true);}++this.m_contactCount;}},{key:"FindNewContacts",value:function FindNewContacts(){var _this28=this;this.m_broadPhase.UpdatePairs(function(proxyA,proxyB){_this28.AddPair(proxyA,proxyB);});}},{key:"Destroy",value:function Destroy(c){var fixtureA=c.GetFixtureA();var fixtureB=c.GetFixtureB();var bodyA=fixtureA.GetBody();var bodyB=fixtureB.GetBody();if(this.m_contactListener&&c.IsTouching()){this.m_contactListener.EndContact(c);}// Remove from the world.
      if(c.m_prev){c.m_prev.m_next=c.m_next;}if(c.m_next){c.m_next.m_prev=c.m_prev;}if(c===this.m_contactList){this.m_contactList=c.m_next;}// Remove from body 1
      if(c.m_nodeA.prev){c.m_nodeA.prev.next=c.m_nodeA.next;}if(c.m_nodeA.next){c.m_nodeA.next.prev=c.m_nodeA.prev;}if(c.m_nodeA===bodyA.m_contactList){bodyA.m_contactList=c.m_nodeA.next;}// Remove from body 2
      if(c.m_nodeB.prev){c.m_nodeB.prev.next=c.m_nodeB.next;}if(c.m_nodeB.next){c.m_nodeB.next.prev=c.m_nodeB.prev;}if(c.m_nodeB===bodyB.m_contactList){bodyB.m_contactList=c.m_nodeB.next;}// moved this from b2ContactFactory:Destroy
      if(c.m_manifold.pointCount>0&&!fixtureA.IsSensor()&&!fixtureB.IsSensor()){fixtureA.GetBody().SetAwake(true);fixtureB.GetBody().SetAwake(true);}// Call the factory.
      this.m_contactFactory.Destroy(c);--this.m_contactCount;}// This is the top level collision call for the time step. Here
      // all the narrow phase collision is processed for the world
      // contact list.
      },{key:"Collide",value:function Collide(){// Update awake contacts.
      var c=this.m_contactList;while(c){var fixtureA=c.GetFixtureA();var fixtureB=c.GetFixtureB();var indexA=c.GetChildIndexA();var indexB=c.GetChildIndexB();var bodyA=fixtureA.GetBody();var bodyB=fixtureB.GetBody();// Is this contact flagged for filtering?
      if(c.m_filterFlag){// Check user filtering.
      if(this.m_contactFilter&&!this.m_contactFilter.ShouldCollide(fixtureA,fixtureB)){var cNuke=c;c=cNuke.m_next;this.Destroy(cNuke);continue;}// Clear the filtering flag.
      c.m_filterFlag=false;}var activeA=bodyA.IsAwake()&&bodyA.m_type!==exports.b2BodyType.b2_staticBody;var activeB=bodyB.IsAwake()&&bodyB.m_type!==exports.b2BodyType.b2_staticBody;// At least one body must be awake and it must be dynamic or kinematic.
      if(!activeA&&!activeB){c=c.m_next;continue;}var treeNodeA=fixtureA.m_proxies[indexA].treeNode;var treeNodeB=fixtureB.m_proxies[indexB].treeNode;var overlap=b2TestOverlapAABB(treeNodeA.aabb,treeNodeB.aabb);// Here we destroy contacts that cease to overlap in the broad-phase.
      if(!overlap){var _cNuke=c;c=_cNuke.m_next;this.Destroy(_cNuke);continue;}// The contact persists.
      c.Update(this.m_contactListener);c=c.m_next;}}}]);}();/*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//// Profiling data. Times are in milliseconds.
      var b2Profile=/*#__PURE__*/function(){function b2Profile(){_classCallCheck(this,b2Profile);this.step=0;this.collide=0;this.solve=0;this.solveInit=0;this.solveVelocity=0;this.solvePosition=0;this.broadphase=0;this.solveTOI=0;}return _createClass(b2Profile,[{key:"Reset",value:function Reset(){this.step=0;this.collide=0;this.solve=0;this.solveInit=0;this.solveVelocity=0;this.solvePosition=0;this.broadphase=0;this.solveTOI=0;return this;}}]);}();/// This is an internal structure.
      var b2TimeStep=/*#__PURE__*/function(){function b2TimeStep(){_classCallCheck(this,b2TimeStep);this.dt=0;// time step
      this.inv_dt=0;// inverse time step (0 if dt == 0).
      this.dtRatio=0;// dt * inv_dt0
      this.velocityIterations=0;this.positionIterations=0;// #if B2_ENABLE_PARTICLE
      this.particleIterations=0;// #endif
      this.warmStarting=false;}return _createClass(b2TimeStep,[{key:"Copy",value:function Copy(step){this.dt=step.dt;this.inv_dt=step.inv_dt;this.dtRatio=step.dtRatio;this.positionIterations=step.positionIterations;this.velocityIterations=step.velocityIterations;// #if B2_ENABLE_PARTICLE
      this.particleIterations=step.particleIterations;// #endif
      this.warmStarting=step.warmStarting;return this;}}]);}();var b2Position=/*#__PURE__*/function(){function b2Position(){_classCallCheck(this,b2Position);this.c=new b2Vec2();this.a=0;}return _createClass(b2Position,null,[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2Position();});}}]);}();var b2Velocity=/*#__PURE__*/function(){function b2Velocity(){_classCallCheck(this,b2Velocity);this.v=new b2Vec2();this.w=0;}return _createClass(b2Velocity,null,[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2Velocity();});}}]);}();var b2SolverData=/*#__PURE__*/_createClass(function b2SolverData(){_classCallCheck(this,b2SolverData);this.step=new b2TimeStep();});/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */// Solver debugging is normally disabled because the block solver sometimes has to deal with a poorly conditioned effective mass matrix.
      // #define B2_DEBUG_SOLVER 0
      var g_blockSolve=false;var b2VelocityConstraintPoint=/*#__PURE__*/function(){function b2VelocityConstraintPoint(){_classCallCheck(this,b2VelocityConstraintPoint);this.rA=new b2Vec2();this.rB=new b2Vec2();this.normalImpulse=0;this.tangentImpulse=0;this.normalMass=0;this.tangentMass=0;this.velocityBias=0;}return _createClass(b2VelocityConstraintPoint,null,[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2VelocityConstraintPoint();});}}]);}();var b2ContactVelocityConstraint=/*#__PURE__*/function(){function b2ContactVelocityConstraint(){_classCallCheck(this,b2ContactVelocityConstraint);this.points=b2VelocityConstraintPoint.MakeArray(b2_maxManifoldPoints);this.normal=new b2Vec2();this.tangent=new b2Vec2();this.normalMass=new b2Mat22();this.K=new b2Mat22();this.indexA=0;this.indexB=0;this.invMassA=0;this.invMassB=0;this.invIA=0;this.invIB=0;this.friction=0;this.restitution=0;this.tangentSpeed=0;this.pointCount=0;this.contactIndex=0;}return _createClass(b2ContactVelocityConstraint,null,[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2ContactVelocityConstraint();});}}]);}();var b2ContactPositionConstraint=/*#__PURE__*/function(){function b2ContactPositionConstraint(){_classCallCheck(this,b2ContactPositionConstraint);this.localPoints=b2Vec2.MakeArray(b2_maxManifoldPoints);this.localNormal=new b2Vec2();this.localPoint=new b2Vec2();this.indexA=0;this.indexB=0;this.invMassA=0;this.invMassB=0;this.localCenterA=new b2Vec2();this.localCenterB=new b2Vec2();this.invIA=0;this.invIB=0;this.type=exports.b2ManifoldType.e_unknown;this.radiusA=0;this.radiusB=0;this.pointCount=0;}return _createClass(b2ContactPositionConstraint,null,[{key:"MakeArray",value:function MakeArray(length){return b2MakeArray(length,function(i){return new b2ContactPositionConstraint();});}}]);}();var b2ContactSolverDef=/*#__PURE__*/_createClass(function b2ContactSolverDef(){_classCallCheck(this,b2ContactSolverDef);this.step=new b2TimeStep();this.count=0;});var b2PositionSolverManifold=/*#__PURE__*/function(){function b2PositionSolverManifold(){_classCallCheck(this,b2PositionSolverManifold);this.normal=new b2Vec2();this.point=new b2Vec2();this.separation=0;}return _createClass(b2PositionSolverManifold,[{key:"Initialize",value:function Initialize(pc,xfA,xfB,index){var pointA=b2PositionSolverManifold.Initialize_s_pointA;var pointB=b2PositionSolverManifold.Initialize_s_pointB;var planePoint=b2PositionSolverManifold.Initialize_s_planePoint;var clipPoint=b2PositionSolverManifold.Initialize_s_clipPoint;// DEBUG: b2Assert(pc.pointCount > 0);
      switch(pc.type){case exports.b2ManifoldType.e_circles:{// b2Vec2 pointA = b2Mul(xfA, pc->localPoint);
      b2Transform.MulXV(xfA,pc.localPoint,pointA);// b2Vec2 pointB = b2Mul(xfB, pc->localPoints[0]);
      b2Transform.MulXV(xfB,pc.localPoints[0],pointB);// normal = pointB - pointA;
      // normal.Normalize();
      b2Vec2.SubVV(pointB,pointA,this.normal).SelfNormalize();// point = 0.5f * (pointA + pointB);
      b2Vec2.MidVV(pointA,pointB,this.point);// separation = b2Dot(pointB - pointA, normal) - pc->radius;
      this.separation=b2Vec2.DotVV(b2Vec2.SubVV(pointB,pointA,b2Vec2.s_t0),this.normal)-pc.radiusA-pc.radiusB;break;}case exports.b2ManifoldType.e_faceA:{// normal = b2Mul(xfA.q, pc->localNormal);
      b2Rot.MulRV(xfA.q,pc.localNormal,this.normal);// b2Vec2 planePoint = b2Mul(xfA, pc->localPoint);
      b2Transform.MulXV(xfA,pc.localPoint,planePoint);// b2Vec2 clipPoint = b2Mul(xfB, pc->localPoints[index]);
      b2Transform.MulXV(xfB,pc.localPoints[index],clipPoint);// separation = b2Dot(clipPoint - planePoint, normal) - pc->radius;
      this.separation=b2Vec2.DotVV(b2Vec2.SubVV(clipPoint,planePoint,b2Vec2.s_t0),this.normal)-pc.radiusA-pc.radiusB;// point = clipPoint;
      this.point.Copy(clipPoint);break;}case exports.b2ManifoldType.e_faceB:{// normal = b2Mul(xfB.q, pc->localNormal);
      b2Rot.MulRV(xfB.q,pc.localNormal,this.normal);// b2Vec2 planePoint = b2Mul(xfB, pc->localPoint);
      b2Transform.MulXV(xfB,pc.localPoint,planePoint);// b2Vec2 clipPoint = b2Mul(xfA, pc->localPoints[index]);
      b2Transform.MulXV(xfA,pc.localPoints[index],clipPoint);// separation = b2Dot(clipPoint - planePoint, normal) - pc->radius;
      this.separation=b2Vec2.DotVV(b2Vec2.SubVV(clipPoint,planePoint,b2Vec2.s_t0),this.normal)-pc.radiusA-pc.radiusB;// point = clipPoint;
      this.point.Copy(clipPoint);// Ensure normal points from A to B
      // normal = -normal;
      this.normal.SelfNeg();break;}}}}]);}();b2PositionSolverManifold.Initialize_s_pointA=new b2Vec2();b2PositionSolverManifold.Initialize_s_pointB=new b2Vec2();b2PositionSolverManifold.Initialize_s_planePoint=new b2Vec2();b2PositionSolverManifold.Initialize_s_clipPoint=new b2Vec2();var b2ContactSolver=/*#__PURE__*/function(){function b2ContactSolver(){_classCallCheck(this,b2ContactSolver);this.m_step=new b2TimeStep();this.m_positionConstraints=b2ContactPositionConstraint.MakeArray(1024);// TODO: b2Settings
      this.m_velocityConstraints=b2ContactVelocityConstraint.MakeArray(1024);// TODO: b2Settings
      this.m_count=0;}return _createClass(b2ContactSolver,[{key:"Initialize",value:function Initialize(def){this.m_step.Copy(def.step);this.m_count=def.count;// TODO:
      if(this.m_positionConstraints.length<this.m_count){var new_length=b2Max(this.m_positionConstraints.length*2,this.m_count);while(this.m_positionConstraints.length<new_length){this.m_positionConstraints[this.m_positionConstraints.length]=new b2ContactPositionConstraint();}}// TODO:
      if(this.m_velocityConstraints.length<this.m_count){var _new_length=b2Max(this.m_velocityConstraints.length*2,this.m_count);while(this.m_velocityConstraints.length<_new_length){this.m_velocityConstraints[this.m_velocityConstraints.length]=new b2ContactVelocityConstraint();}}this.m_positions=def.positions;this.m_velocities=def.velocities;this.m_contacts=def.contacts;// Initialize position independent portions of the constraints.
      for(var i=0;i<this.m_count;++i){var contact=this.m_contacts[i];var fixtureA=contact.m_fixtureA;var fixtureB=contact.m_fixtureB;var shapeA=fixtureA.GetShape();var shapeB=fixtureB.GetShape();var radiusA=shapeA.m_radius;var radiusB=shapeB.m_radius;var bodyA=fixtureA.GetBody();var bodyB=fixtureB.GetBody();var manifold=contact.GetManifold();var pointCount=manifold.pointCount;// DEBUG: b2Assert(pointCount > 0);
      var vc=this.m_velocityConstraints[i];vc.friction=contact.m_friction;vc.restitution=contact.m_restitution;vc.tangentSpeed=contact.m_tangentSpeed;vc.indexA=bodyA.m_islandIndex;vc.indexB=bodyB.m_islandIndex;vc.invMassA=bodyA.m_invMass;vc.invMassB=bodyB.m_invMass;vc.invIA=bodyA.m_invI;vc.invIB=bodyB.m_invI;vc.contactIndex=i;vc.pointCount=pointCount;vc.K.SetZero();vc.normalMass.SetZero();var pc=this.m_positionConstraints[i];pc.indexA=bodyA.m_islandIndex;pc.indexB=bodyB.m_islandIndex;pc.invMassA=bodyA.m_invMass;pc.invMassB=bodyB.m_invMass;pc.localCenterA.Copy(bodyA.m_sweep.localCenter);pc.localCenterB.Copy(bodyB.m_sweep.localCenter);pc.invIA=bodyA.m_invI;pc.invIB=bodyB.m_invI;pc.localNormal.Copy(manifold.localNormal);pc.localPoint.Copy(manifold.localPoint);pc.pointCount=pointCount;pc.radiusA=radiusA;pc.radiusB=radiusB;pc.type=manifold.type;for(var j=0;j<pointCount;++j){var cp=manifold.points[j];var vcp=vc.points[j];if(this.m_step.warmStarting){vcp.normalImpulse=this.m_step.dtRatio*cp.normalImpulse;vcp.tangentImpulse=this.m_step.dtRatio*cp.tangentImpulse;}else {vcp.normalImpulse=0;vcp.tangentImpulse=0;}vcp.rA.SetZero();vcp.rB.SetZero();vcp.normalMass=0;vcp.tangentMass=0;vcp.velocityBias=0;pc.localPoints[j].Copy(cp.localPoint);}}return this;}},{key:"InitializeVelocityConstraints",value:function InitializeVelocityConstraints(){var xfA=b2ContactSolver.InitializeVelocityConstraints_s_xfA;var xfB=b2ContactSolver.InitializeVelocityConstraints_s_xfB;var worldManifold=b2ContactSolver.InitializeVelocityConstraints_s_worldManifold;var k_maxConditionNumber=1000;for(var i=0;i<this.m_count;++i){var vc=this.m_velocityConstraints[i];var pc=this.m_positionConstraints[i];var radiusA=pc.radiusA;var radiusB=pc.radiusB;var manifold=this.m_contacts[vc.contactIndex].GetManifold();var indexA=vc.indexA;var indexB=vc.indexB;var mA=vc.invMassA;var mB=vc.invMassB;var iA=vc.invIA;var iB=vc.invIB;var localCenterA=pc.localCenterA;var localCenterB=pc.localCenterB;var cA=this.m_positions[indexA].c;var aA=this.m_positions[indexA].a;var vA=this.m_velocities[indexA].v;var wA=this.m_velocities[indexA].w;var cB=this.m_positions[indexB].c;var aB=this.m_positions[indexB].a;var vB=this.m_velocities[indexB].v;var wB=this.m_velocities[indexB].w;// DEBUG: b2Assert(manifold.pointCount > 0);
      xfA.q.SetAngle(aA);xfB.q.SetAngle(aB);b2Vec2.SubVV(cA,b2Rot.MulRV(xfA.q,localCenterA,b2Vec2.s_t0),xfA.p);b2Vec2.SubVV(cB,b2Rot.MulRV(xfB.q,localCenterB,b2Vec2.s_t0),xfB.p);worldManifold.Initialize(manifold,xfA,radiusA,xfB,radiusB);vc.normal.Copy(worldManifold.normal);b2Vec2.CrossVOne(vc.normal,vc.tangent);// compute from normal
      var pointCount=vc.pointCount;for(var j=0;j<pointCount;++j){var vcp=vc.points[j];// vcp->rA = worldManifold.points[j] - cA;
      b2Vec2.SubVV(worldManifold.points[j],cA,vcp.rA);// vcp->rB = worldManifold.points[j] - cB;
      b2Vec2.SubVV(worldManifold.points[j],cB,vcp.rB);var rnA=b2Vec2.CrossVV(vcp.rA,vc.normal);var rnB=b2Vec2.CrossVV(vcp.rB,vc.normal);var kNormal=mA+mB+iA*rnA*rnA+iB*rnB*rnB;vcp.normalMass=kNormal>0?1/kNormal:0;// b2Vec2 tangent = b2Cross(vc->normal, 1.0f);
      var tangent=vc.tangent;// precomputed from normal
      var rtA=b2Vec2.CrossVV(vcp.rA,tangent);var rtB=b2Vec2.CrossVV(vcp.rB,tangent);var kTangent=mA+mB+iA*rtA*rtA+iB*rtB*rtB;vcp.tangentMass=kTangent>0?1/kTangent:0;// Setup a velocity bias for restitution.
      vcp.velocityBias=0;// float32 vRel = b2Dot(vc->normal, vB + b2Cross(wB, vcp->rB) - vA - b2Cross(wA, vcp->rA));
      var vRel=b2Vec2.DotVV(vc.normal,b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,vcp.rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,vcp.rA,b2Vec2.s_t1),b2Vec2.s_t0));if(vRel<-b2_velocityThreshold){vcp.velocityBias+=-vc.restitution*vRel;}}// If we have two points, then prepare the block solver.
      if(vc.pointCount===2&&g_blockSolve){var vcp1=vc.points[0];var vcp2=vc.points[1];var rn1A=b2Vec2.CrossVV(vcp1.rA,vc.normal);var rn1B=b2Vec2.CrossVV(vcp1.rB,vc.normal);var rn2A=b2Vec2.CrossVV(vcp2.rA,vc.normal);var rn2B=b2Vec2.CrossVV(vcp2.rB,vc.normal);var k11=mA+mB+iA*rn1A*rn1A+iB*rn1B*rn1B;var k22=mA+mB+iA*rn2A*rn2A+iB*rn2B*rn2B;var k12=mA+mB+iA*rn1A*rn2A+iB*rn1B*rn2B;// Ensure a reasonable condition number.
      // float32 k_maxConditionNumber = 1000.0f;
      if(k11*k11<k_maxConditionNumber*(k11*k22-k12*k12)){// K is safe to invert.
      vc.K.ex.Set(k11,k12);vc.K.ey.Set(k12,k22);vc.K.GetInverse(vc.normalMass);}else {// The constraints are redundant, just use one.
      // TODO_ERIN use deepest?
      vc.pointCount=1;}}}}},{key:"WarmStart",value:function WarmStart(){var P=b2ContactSolver.WarmStart_s_P;// Warm start.
      for(var i=0;i<this.m_count;++i){var vc=this.m_velocityConstraints[i];var indexA=vc.indexA;var indexB=vc.indexB;var mA=vc.invMassA;var iA=vc.invIA;var mB=vc.invMassB;var iB=vc.invIB;var pointCount=vc.pointCount;var vA=this.m_velocities[indexA].v;var wA=this.m_velocities[indexA].w;var vB=this.m_velocities[indexB].v;var wB=this.m_velocities[indexB].w;var normal=vc.normal;// b2Vec2 tangent = b2Cross(normal, 1.0f);
      var tangent=vc.tangent;// precomputed from normal
      for(var j=0;j<pointCount;++j){var vcp=vc.points[j];// b2Vec2 P = vcp->normalImpulse * normal + vcp->tangentImpulse * tangent;
      b2Vec2.AddVV(b2Vec2.MulSV(vcp.normalImpulse,normal,b2Vec2.s_t0),b2Vec2.MulSV(vcp.tangentImpulse,tangent,b2Vec2.s_t1),P);// wA -= iA * b2Cross(vcp->rA, P);
      wA-=iA*b2Vec2.CrossVV(vcp.rA,P);// vA -= mA * P;
      vA.SelfMulSub(mA,P);// wB += iB * b2Cross(vcp->rB, P);
      wB+=iB*b2Vec2.CrossVV(vcp.rB,P);// vB += mB * P;
      vB.SelfMulAdd(mB,P);}// this.m_velocities[indexA].v = vA;
      this.m_velocities[indexA].w=wA;// this.m_velocities[indexB].v = vB;
      this.m_velocities[indexB].w=wB;}}},{key:"SolveVelocityConstraints",value:function SolveVelocityConstraints(){var dv=b2ContactSolver.SolveVelocityConstraints_s_dv;var dv1=b2ContactSolver.SolveVelocityConstraints_s_dv1;var dv2=b2ContactSolver.SolveVelocityConstraints_s_dv2;var P=b2ContactSolver.SolveVelocityConstraints_s_P;var a=b2ContactSolver.SolveVelocityConstraints_s_a;var b=b2ContactSolver.SolveVelocityConstraints_s_b;var x=b2ContactSolver.SolveVelocityConstraints_s_x;var d=b2ContactSolver.SolveVelocityConstraints_s_d;var P1=b2ContactSolver.SolveVelocityConstraints_s_P1;var P2=b2ContactSolver.SolveVelocityConstraints_s_P2;var P1P2=b2ContactSolver.SolveVelocityConstraints_s_P1P2;for(var i=0;i<this.m_count;++i){var vc=this.m_velocityConstraints[i];var indexA=vc.indexA;var indexB=vc.indexB;var mA=vc.invMassA;var iA=vc.invIA;var mB=vc.invMassB;var iB=vc.invIB;var pointCount=vc.pointCount;var vA=this.m_velocities[indexA].v;var wA=this.m_velocities[indexA].w;var vB=this.m_velocities[indexB].v;var wB=this.m_velocities[indexB].w;// b2Vec2 normal = vc->normal;
      var normal=vc.normal;// b2Vec2 tangent = b2Cross(normal, 1.0f);
      var tangent=vc.tangent;// precomputed from normal
      var friction=vc.friction;// DEBUG: b2Assert(pointCount === 1 || pointCount === 2);
      // Solve tangent constraints first because non-penetration is more important
      // than friction.
      for(var j=0;j<pointCount;++j){var vcp=vc.points[j];// Relative velocity at contact
      // b2Vec2 dv = vB + b2Cross(wB, vcp->rB) - vA - b2Cross(wA, vcp->rA);
      b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,vcp.rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,vcp.rA,b2Vec2.s_t1),dv);// Compute tangent force
      // float32 vt = b2Dot(dv, tangent) - vc->tangentSpeed;
      var vt=b2Vec2.DotVV(dv,tangent)-vc.tangentSpeed;var lambda=vcp.tangentMass*-vt;// b2Clamp the accumulated force
      var maxFriction=friction*vcp.normalImpulse;var newImpulse=b2Clamp(vcp.tangentImpulse+lambda,-maxFriction,maxFriction);lambda=newImpulse-vcp.tangentImpulse;vcp.tangentImpulse=newImpulse;// Apply contact impulse
      // b2Vec2 P = lambda * tangent;
      b2Vec2.MulSV(lambda,tangent,P);// vA -= mA * P;
      vA.SelfMulSub(mA,P);// wA -= iA * b2Cross(vcp->rA, P);
      wA-=iA*b2Vec2.CrossVV(vcp.rA,P);// vB += mB * P;
      vB.SelfMulAdd(mB,P);// wB += iB * b2Cross(vcp->rB, P);
      wB+=iB*b2Vec2.CrossVV(vcp.rB,P);}// Solve normal constraints
      if(vc.pointCount===1||g_blockSolve===false){for(var _j3=0;_j3<pointCount;++_j3){var _vcp=vc.points[_j3];// Relative velocity at contact
      // b2Vec2 dv = vB + b2Cross(wB, vcp->rB) - vA - b2Cross(wA, vcp->rA);
      b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,_vcp.rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,_vcp.rA,b2Vec2.s_t1),dv);// Compute normal impulse
      // float32 vn = b2Dot(dv, normal);
      var vn=b2Vec2.DotVV(dv,normal);var _lambda=-_vcp.normalMass*(vn-_vcp.velocityBias);// b2Clamp the accumulated impulse
      // float32 newImpulse = b2Max(vcp->normalImpulse + lambda, 0.0f);
      var _newImpulse2=b2Max(_vcp.normalImpulse+_lambda,0);_lambda=_newImpulse2-_vcp.normalImpulse;_vcp.normalImpulse=_newImpulse2;// Apply contact impulse
      // b2Vec2 P = lambda * normal;
      b2Vec2.MulSV(_lambda,normal,P);// vA -= mA * P;
      vA.SelfMulSub(mA,P);// wA -= iA * b2Cross(vcp->rA, P);
      wA-=iA*b2Vec2.CrossVV(_vcp.rA,P);// vB += mB * P;
      vB.SelfMulAdd(mB,P);// wB += iB * b2Cross(vcp->rB, P);
      wB+=iB*b2Vec2.CrossVV(_vcp.rB,P);}}else {// Block solver developed in collaboration with Dirk Gregorius (back in 01/07 on Box2D_Lite).
      // Build the mini LCP for this contact patch
      //
      // vn = A * x + b, vn >= 0, x >= 0 and vn_i * x_i = 0 with i = 1..2
      //
      // A = J * W * JT and J = ( -n, -r1 x n, n, r2 x n )
      // b = vn0 - velocityBias
      //
      // The system is solved using the "Total enumeration method" (s. Murty). The complementary constraint vn_i * x_i
      // implies that we must have in any solution either vn_i = 0 or x_i = 0. So for the 2D contact problem the cases
      // vn1 = 0 and vn2 = 0, x1 = 0 and x2 = 0, x1 = 0 and vn2 = 0, x2 = 0 and vn1 = 0 need to be tested. The first valid
      // solution that satisfies the problem is chosen.
      //
      // In order to account of the accumulated impulse 'a' (because of the iterative nature of the solver which only requires
      // that the accumulated impulse is clamped and not the incremental impulse) we change the impulse variable (x_i).
      //
      // Substitute:
      //
      // x = a + d
      //
      // a := old total impulse
      // x := new total impulse
      // d := incremental impulse
      //
      // For the current iteration we extend the formula for the incremental impulse
      // to compute the new total impulse:
      //
      // vn = A * d + b
      //    = A * (x - a) + b
      //    = A * x + b - A * a
      //    = A * x + b'
      // b' = b - A * a;
      var cp1=vc.points[0];var cp2=vc.points[1];// b2Vec2 a(cp1->normalImpulse, cp2->normalImpulse);
      a.Set(cp1.normalImpulse,cp2.normalImpulse);// DEBUG: b2Assert(a.x >= 0 && a.y >= 0);
      // Relative velocity at contact
      // b2Vec2 dv1 = vB + b2Cross(wB, cp1->rB) - vA - b2Cross(wA, cp1->rA);
      b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,cp1.rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,cp1.rA,b2Vec2.s_t1),dv1);// b2Vec2 dv2 = vB + b2Cross(wB, cp2->rB) - vA - b2Cross(wA, cp2->rA);
      b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB,wB,cp2.rB,b2Vec2.s_t0),b2Vec2.AddVCrossSV(vA,wA,cp2.rA,b2Vec2.s_t1),dv2);// Compute normal velocity
      // float32 vn1 = b2Dot(dv1, normal);
      var vn1=b2Vec2.DotVV(dv1,normal);// float32 vn2 = b2Dot(dv2, normal);
      var vn2=b2Vec2.DotVV(dv2,normal);// b2Vec2 b;
      b.x=vn1-cp1.velocityBias;b.y=vn2-cp2.velocityBias;// Compute b'
      // b -= b2Mul(vc->K, a);
      b.SelfSub(b2Mat22.MulMV(vc.K,a,b2Vec2.s_t0));/*
                        #if B2_DEBUG_SOLVER === 1
                        const k_errorTol: number = 0.001;
                        #endif
                        */for(;;){//
      // Case 1: vn = 0
      //
      // 0 = A * x + b'
      //
      // Solve for x:
      //
      // x = - inv(A) * b'
      //
      // b2Vec2 x = - b2Mul(vc->normalMass, b);
      b2Mat22.MulMV(vc.normalMass,b,x).SelfNeg();if(x.x>=0&&x.y>=0){// Get the incremental impulse
      // b2Vec2 d = x - a;
      b2Vec2.SubVV(x,a,d);// Apply incremental impulse
      // b2Vec2 P1 = d.x * normal;
      b2Vec2.MulSV(d.x,normal,P1);// b2Vec2 P2 = d.y * normal;
      b2Vec2.MulSV(d.y,normal,P2);b2Vec2.AddVV(P1,P2,P1P2);// vA -= mA * (P1 + P2);
      vA.SelfMulSub(mA,P1P2);// wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
      wA-=iA*(b2Vec2.CrossVV(cp1.rA,P1)+b2Vec2.CrossVV(cp2.rA,P2));// vB += mB * (P1 + P2);
      vB.SelfMulAdd(mB,P1P2);// wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
      wB+=iB*(b2Vec2.CrossVV(cp1.rB,P1)+b2Vec2.CrossVV(cp2.rB,P2));// Accumulate
      cp1.normalImpulse=x.x;cp2.normalImpulse=x.y;/*
                                #if B2_DEBUG_SOLVER === 1
                                // Postconditions
                                dv1 = vB + b2Cross(wB, cp1->rB) - vA - b2Cross(wA, cp1->rA);
                                dv2 = vB + b2Cross(wB, cp2->rB) - vA - b2Cross(wA, cp2->rA);
                    
                                // Compute normal velocity
                                vn1 = b2Dot(dv1, normal);
                                vn2 = b2Dot(dv2, normal);
                    
                                b2Assert(b2Abs(vn1 - cp1->velocityBias) < k_errorTol);
                                b2Assert(b2Abs(vn2 - cp2->velocityBias) < k_errorTol);
                                #endif
                                */break;}//
      // Case 2: vn1 = 0 and x2 = 0
      //
      //   0 = a11 * x1 + a12 * 0 + b1'
      // vn2 = a21 * x1 + a22 * 0 + b2'
      //
      x.x=-cp1.normalMass*b.x;x.y=0;vn1=0;vn2=vc.K.ex.y*x.x+b.y;if(x.x>=0&&vn2>=0){// Get the incremental impulse
      // b2Vec2 d = x - a;
      b2Vec2.SubVV(x,a,d);// Apply incremental impulse
      // b2Vec2 P1 = d.x * normal;
      b2Vec2.MulSV(d.x,normal,P1);// b2Vec2 P2 = d.y * normal;
      b2Vec2.MulSV(d.y,normal,P2);b2Vec2.AddVV(P1,P2,P1P2);// vA -= mA * (P1 + P2);
      vA.SelfMulSub(mA,P1P2);// wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
      wA-=iA*(b2Vec2.CrossVV(cp1.rA,P1)+b2Vec2.CrossVV(cp2.rA,P2));// vB += mB * (P1 + P2);
      vB.SelfMulAdd(mB,P1P2);// wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
      wB+=iB*(b2Vec2.CrossVV(cp1.rB,P1)+b2Vec2.CrossVV(cp2.rB,P2));// Accumulate
      cp1.normalImpulse=x.x;cp2.normalImpulse=x.y;/*
                                #if B2_DEBUG_SOLVER === 1
                                // Postconditions
                                dv1 = vB + b2Cross(wB, cp1->rB) - vA - b2Cross(wA, cp1->rA);
                    
                                // Compute normal velocity
                                vn1 = b2Dot(dv1, normal);
                    
                                b2Assert(b2Abs(vn1 - cp1->velocityBias) < k_errorTol);
                                #endif
                                */break;}//
      // Case 3: vn2 = 0 and x1 = 0
      //
      // vn1 = a11 * 0 + a12 * x2 + b1'
      //   0 = a21 * 0 + a22 * x2 + b2'
      //
      x.x=0;x.y=-cp2.normalMass*b.y;vn1=vc.K.ey.x*x.y+b.x;vn2=0;if(x.y>=0&&vn1>=0){// Resubstitute for the incremental impulse
      // b2Vec2 d = x - a;
      b2Vec2.SubVV(x,a,d);// Apply incremental impulse
      // b2Vec2 P1 = d.x * normal;
      b2Vec2.MulSV(d.x,normal,P1);// b2Vec2 P2 = d.y * normal;
      b2Vec2.MulSV(d.y,normal,P2);b2Vec2.AddVV(P1,P2,P1P2);// vA -= mA * (P1 + P2);
      vA.SelfMulSub(mA,P1P2);// wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
      wA-=iA*(b2Vec2.CrossVV(cp1.rA,P1)+b2Vec2.CrossVV(cp2.rA,P2));// vB += mB * (P1 + P2);
      vB.SelfMulAdd(mB,P1P2);// wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
      wB+=iB*(b2Vec2.CrossVV(cp1.rB,P1)+b2Vec2.CrossVV(cp2.rB,P2));// Accumulate
      cp1.normalImpulse=x.x;cp2.normalImpulse=x.y;/*
                                #if B2_DEBUG_SOLVER === 1
                                // Postconditions
                                dv2 = vB + b2Cross(wB, cp2->rB) - vA - b2Cross(wA, cp2->rA);
                    
                                // Compute normal velocity
                                vn2 = b2Dot(dv2, normal);
                    
                                b2Assert(b2Abs(vn2 - cp2->velocityBias) < k_errorTol);
                                #endif
                                */break;}//
      // Case 4: x1 = 0 and x2 = 0
      //
      // vn1 = b1
      // vn2 = b2;
      x.x=0;x.y=0;vn1=b.x;vn2=b.y;if(vn1>=0&&vn2>=0){// Resubstitute for the incremental impulse
      // b2Vec2 d = x - a;
      b2Vec2.SubVV(x,a,d);// Apply incremental impulse
      // b2Vec2 P1 = d.x * normal;
      b2Vec2.MulSV(d.x,normal,P1);// b2Vec2 P2 = d.y * normal;
      b2Vec2.MulSV(d.y,normal,P2);b2Vec2.AddVV(P1,P2,P1P2);// vA -= mA * (P1 + P2);
      vA.SelfMulSub(mA,P1P2);// wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
      wA-=iA*(b2Vec2.CrossVV(cp1.rA,P1)+b2Vec2.CrossVV(cp2.rA,P2));// vB += mB * (P1 + P2);
      vB.SelfMulAdd(mB,P1P2);// wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
      wB+=iB*(b2Vec2.CrossVV(cp1.rB,P1)+b2Vec2.CrossVV(cp2.rB,P2));// Accumulate
      cp1.normalImpulse=x.x;cp2.normalImpulse=x.y;break;}// No solution, give up. This is hit sometimes, but it doesn't seem to matter.
      break;}}// this.m_velocities[indexA].v = vA;
      this.m_velocities[indexA].w=wA;// this.m_velocities[indexB].v = vB;
      this.m_velocities[indexB].w=wB;}}},{key:"StoreImpulses",value:function StoreImpulses(){for(var i=0;i<this.m_count;++i){var vc=this.m_velocityConstraints[i];var manifold=this.m_contacts[vc.contactIndex].GetManifold();for(var j=0;j<vc.pointCount;++j){manifold.points[j].normalImpulse=vc.points[j].normalImpulse;manifold.points[j].tangentImpulse=vc.points[j].tangentImpulse;}}}},{key:"SolvePositionConstraints",value:function SolvePositionConstraints(){var xfA=b2ContactSolver.SolvePositionConstraints_s_xfA;var xfB=b2ContactSolver.SolvePositionConstraints_s_xfB;var psm=b2ContactSolver.SolvePositionConstraints_s_psm;var rA=b2ContactSolver.SolvePositionConstraints_s_rA;var rB=b2ContactSolver.SolvePositionConstraints_s_rB;var P=b2ContactSolver.SolvePositionConstraints_s_P;var minSeparation=0;for(var i=0;i<this.m_count;++i){var pc=this.m_positionConstraints[i];var indexA=pc.indexA;var indexB=pc.indexB;var localCenterA=pc.localCenterA;var mA=pc.invMassA;var iA=pc.invIA;var localCenterB=pc.localCenterB;var mB=pc.invMassB;var iB=pc.invIB;var pointCount=pc.pointCount;var cA=this.m_positions[indexA].c;var aA=this.m_positions[indexA].a;var cB=this.m_positions[indexB].c;var aB=this.m_positions[indexB].a;// Solve normal constraints
      for(var j=0;j<pointCount;++j){xfA.q.SetAngle(aA);xfB.q.SetAngle(aB);b2Vec2.SubVV(cA,b2Rot.MulRV(xfA.q,localCenterA,b2Vec2.s_t0),xfA.p);b2Vec2.SubVV(cB,b2Rot.MulRV(xfB.q,localCenterB,b2Vec2.s_t0),xfB.p);psm.Initialize(pc,xfA,xfB,j);var normal=psm.normal;var point=psm.point;var separation=psm.separation;// b2Vec2 rA = point - cA;
      b2Vec2.SubVV(point,cA,rA);// b2Vec2 rB = point - cB;
      b2Vec2.SubVV(point,cB,rB);// Track max constraint error.
      minSeparation=b2Min(minSeparation,separation);// Prevent large corrections and allow slop.
      var C=b2Clamp(b2_baumgarte*(separation+b2_linearSlop),-b2_maxLinearCorrection,0);// Compute the effective mass.
      // float32 rnA = b2Cross(rA, normal);
      var rnA=b2Vec2.CrossVV(rA,normal);// float32 rnB = b2Cross(rB, normal);
      var rnB=b2Vec2.CrossVV(rB,normal);// float32 K = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
      var K=mA+mB+iA*rnA*rnA+iB*rnB*rnB;// Compute normal impulse
      var impulse=K>0?-C/K:0;// b2Vec2 P = impulse * normal;
      b2Vec2.MulSV(impulse,normal,P);// cA -= mA * P;
      cA.SelfMulSub(mA,P);// aA -= iA * b2Cross(rA, P);
      aA-=iA*b2Vec2.CrossVV(rA,P);// cB += mB * P;
      cB.SelfMulAdd(mB,P);// aB += iB * b2Cross(rB, P);
      aB+=iB*b2Vec2.CrossVV(rB,P);}// this.m_positions[indexA].c = cA;
      this.m_positions[indexA].a=aA;// this.m_positions[indexB].c = cB;
      this.m_positions[indexB].a=aB;}// We can't expect minSpeparation >= -b2_linearSlop because we don't
      // push the separation above -b2_linearSlop.
      return minSeparation>-3*b2_linearSlop;}},{key:"SolveTOIPositionConstraints",value:function SolveTOIPositionConstraints(toiIndexA,toiIndexB){var xfA=b2ContactSolver.SolveTOIPositionConstraints_s_xfA;var xfB=b2ContactSolver.SolveTOIPositionConstraints_s_xfB;var psm=b2ContactSolver.SolveTOIPositionConstraints_s_psm;var rA=b2ContactSolver.SolveTOIPositionConstraints_s_rA;var rB=b2ContactSolver.SolveTOIPositionConstraints_s_rB;var P=b2ContactSolver.SolveTOIPositionConstraints_s_P;var minSeparation=0;for(var i=0;i<this.m_count;++i){var pc=this.m_positionConstraints[i];var indexA=pc.indexA;var indexB=pc.indexB;var localCenterA=pc.localCenterA;var localCenterB=pc.localCenterB;var pointCount=pc.pointCount;var mA=0;var iA=0;if(indexA===toiIndexA||indexA===toiIndexB){mA=pc.invMassA;iA=pc.invIA;}var mB=0;var iB=0;if(indexB===toiIndexA||indexB===toiIndexB){mB=pc.invMassB;iB=pc.invIB;}var cA=this.m_positions[indexA].c;var aA=this.m_positions[indexA].a;var cB=this.m_positions[indexB].c;var aB=this.m_positions[indexB].a;// Solve normal constraints
      for(var j=0;j<pointCount;++j){xfA.q.SetAngle(aA);xfB.q.SetAngle(aB);b2Vec2.SubVV(cA,b2Rot.MulRV(xfA.q,localCenterA,b2Vec2.s_t0),xfA.p);b2Vec2.SubVV(cB,b2Rot.MulRV(xfB.q,localCenterB,b2Vec2.s_t0),xfB.p);psm.Initialize(pc,xfA,xfB,j);var normal=psm.normal;var point=psm.point;var separation=psm.separation;// b2Vec2 rA = point - cA;
      b2Vec2.SubVV(point,cA,rA);// b2Vec2 rB = point - cB;
      b2Vec2.SubVV(point,cB,rB);// Track max constraint error.
      minSeparation=b2Min(minSeparation,separation);// Prevent large corrections and allow slop.
      var C=b2Clamp(b2_toiBaumgarte*(separation+b2_linearSlop),-b2_maxLinearCorrection,0);// Compute the effective mass.
      // float32 rnA = b2Cross(rA, normal);
      var rnA=b2Vec2.CrossVV(rA,normal);// float32 rnB = b2Cross(rB, normal);
      var rnB=b2Vec2.CrossVV(rB,normal);// float32 K = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
      var K=mA+mB+iA*rnA*rnA+iB*rnB*rnB;// Compute normal impulse
      var impulse=K>0?-C/K:0;// b2Vec2 P = impulse * normal;
      b2Vec2.MulSV(impulse,normal,P);// cA -= mA * P;
      cA.SelfMulSub(mA,P);// aA -= iA * b2Cross(rA, P);
      aA-=iA*b2Vec2.CrossVV(rA,P);// cB += mB * P;
      cB.SelfMulAdd(mB,P);// aB += iB * b2Cross(rB, P);
      aB+=iB*b2Vec2.CrossVV(rB,P);}// this.m_positions[indexA].c = cA;
      this.m_positions[indexA].a=aA;// this.m_positions[indexB].c = cB;
      this.m_positions[indexB].a=aB;}// We can't expect minSpeparation >= -b2_linearSlop because we don't
      // push the separation above -b2_linearSlop.
      return minSeparation>=-1.5*b2_linearSlop;}}]);}();b2ContactSolver.InitializeVelocityConstraints_s_xfA=new b2Transform();b2ContactSolver.InitializeVelocityConstraints_s_xfB=new b2Transform();b2ContactSolver.InitializeVelocityConstraints_s_worldManifold=new b2WorldManifold();b2ContactSolver.WarmStart_s_P=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_dv=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_dv1=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_dv2=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_P=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_a=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_b=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_x=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_d=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_P1=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_P2=new b2Vec2();b2ContactSolver.SolveVelocityConstraints_s_P1P2=new b2Vec2();b2ContactSolver.SolvePositionConstraints_s_xfA=new b2Transform();b2ContactSolver.SolvePositionConstraints_s_xfB=new b2Transform();b2ContactSolver.SolvePositionConstraints_s_psm=new b2PositionSolverManifold();b2ContactSolver.SolvePositionConstraints_s_rA=new b2Vec2();b2ContactSolver.SolvePositionConstraints_s_rB=new b2Vec2();b2ContactSolver.SolvePositionConstraints_s_P=new b2Vec2();b2ContactSolver.SolveTOIPositionConstraints_s_xfA=new b2Transform();b2ContactSolver.SolveTOIPositionConstraints_s_xfB=new b2Transform();b2ContactSolver.SolveTOIPositionConstraints_s_psm=new b2PositionSolverManifold();b2ContactSolver.SolveTOIPositionConstraints_s_rA=new b2Vec2();b2ContactSolver.SolveTOIPositionConstraints_s_rB=new b2Vec2();b2ContactSolver.SolveTOIPositionConstraints_s_P=new b2Vec2();/*
        * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *//*
        Position Correction Notes
        =========================
        I tried the several algorithms for position correction of the 2D revolute joint.
        I looked at these systems:
        - simple pendulum (1m diameter sphere on massless 5m stick) with initial angular velocity of 100 rad/s.
        - suspension bridge with 30 1m long planks of length 1m.
        - multi-link chain with 30 1m long links.

        Here are the algorithms:

        Baumgarte - A fraction of the position error is added to the velocity error. There is no
        separate position solver.

        Pseudo Velocities - After the velocity solver and position integration,
        the position error, Jacobian, and effective mass are recomputed. Then
        the velocity constraints are solved with pseudo velocities and a fraction
        of the position error is added to the pseudo velocity error. The pseudo
        velocities are initialized to zero and there is no warm-starting. After
        the position solver, the pseudo velocities are added to the positions.
        This is also called the First Order World method or the Position LCP method.

        Modified Nonlinear Gauss-Seidel (NGS) - Like Pseudo Velocities except the
        position error is re-computed for each constraint and the positions are updated
        after the constraint is solved. The radius vectors (aka Jacobians) are
        re-computed too (otherwise the algorithm has horrible instability). The pseudo
        velocity states are not needed because they are effectively zero at the beginning
        of each iteration. Since we have the current position error, we allow the
        iterations to terminate early if the error becomes smaller than b2_linearSlop.

        Full NGS or just NGS - Like Modified NGS except the effective mass are re-computed
        each time a constraint is solved.

        Here are the results:
        Baumgarte - this is the cheapest algorithm but it has some stability problems,
        especially with the bridge. The chain links separate easily close to the root
        and they jitter as they struggle to pull together. This is one of the most common
        methods in the field. The big drawback is that the position correction artificially
        affects the momentum, thus leading to instabilities and false bounce. I used a
        bias factor of 0.2. A larger bias factor makes the bridge less stable, a smaller
        factor makes joints and contacts more spongy.

        Pseudo Velocities - the is more stable than the Baumgarte method. The bridge is
        stable. However, joints still separate with large angular velocities. Drag the
        simple pendulum in a circle quickly and the joint will separate. The chain separates
        easily and does not recover. I used a bias factor of 0.2. A larger value lead to
        the bridge collapsing when a heavy cube drops on it.

        Modified NGS - this algorithm is better in some ways than Baumgarte and Pseudo
        Velocities, but in other ways it is worse. The bridge and chain are much more
        stable, but the simple pendulum goes unstable at high angular velocities.

        Full NGS - stable in all tests. The joints display good stiffness. The bridge
        still sags, but this is better than infinite forces.

        Recommendations
        Pseudo Velocities are not really worthwhile because the bridge and chain cannot
        recover from joint separation. In other cases the benefit over Baumgarte is small.

        Modified NGS is not a robust method for the revolute joint due to the violent
        instability seen in the simple pendulum. Perhaps it is viable with other constraint
        types, especially scalar constraints where the effective mass is a scalar.

        This leaves Baumgarte and Full NGS. Baumgarte has small, but manageable instabilities
        and is very fast. I don't think we can escape Baumgarte, especially in highly
        demanding cases where high constraint fidelity is not needed.

        Full NGS is robust and easy on the eyes. I recommend this as an option for
        higher fidelity simulation and certainly for suspension bridges and long chains.
        Full NGS might be a good choice for ragdolls, especially motorized ragdolls where
        joint separation can be problematic. The number of NGS iterations can be reduced
        for better performance without harming robustness much.

        Each joint in a can be handled differently in the position solver. So I recommend
        a system where the user can select the algorithm on a per joint basis. I would
        probably default to the slower Full NGS and let the user select the faster
        Baumgarte method in performance critical scenarios.
        *//*
        Cache Performance

        The Box2D solvers are dominated by cache misses. Data structures are designed
        to increase the number of cache hits. Much of misses are due to random access
        to body data. The constraint structures are iterated over linearly, which leads
        to few cache misses.

        The bodies are not accessed during iteration. Instead read only data, such as
        the mass values are stored with the constraints. The mutable data are the constraint
        impulses and the bodies velocities/positions. The impulses are held inside the
        constraint structures. The body velocities/positions are held in compact, temporary
        arrays to increase the number of cache hits. Linear and angular velocity are
        stored in a single array since multiple arrays lead to multiple misses.
        *//*
        2D Rotation

        R = [cos(theta) -sin(theta)]
            [sin(theta) cos(theta) ]

        thetaDot = omega

        Let q1 = cos(theta), q2 = sin(theta).
        R = [q1 -q2]
            [q2  q1]

        q1Dot = -thetaDot * q2
        q2Dot = thetaDot * q1

        q1_new = q1_old - dt * w * q2
        q2_new = q2_old + dt * w * q1
        then normalize.

        This might be faster than computing sin+cos.
        However, we can compute sin+cos of the same angle fast.
        */var b2Island=/*#__PURE__*/function(){function b2Island(){_classCallCheck(this,b2Island);this.m_bodies=[/*1024*/];// TODO: b2Settings
      this.m_contacts=[/*1024*/];// TODO: b2Settings
      this.m_joints=[/*1024*/];// TODO: b2Settings
      this.m_positions=b2Position.MakeArray(1024);// TODO: b2Settings
      this.m_velocities=b2Velocity.MakeArray(1024);// TODO: b2Settings
      this.m_bodyCount=0;this.m_jointCount=0;this.m_contactCount=0;this.m_bodyCapacity=0;this.m_contactCapacity=0;this.m_jointCapacity=0;}return _createClass(b2Island,[{key:"Initialize",value:function Initialize(bodyCapacity,contactCapacity,jointCapacity,listener){this.m_bodyCapacity=bodyCapacity;this.m_contactCapacity=contactCapacity;this.m_jointCapacity=jointCapacity;this.m_bodyCount=0;this.m_contactCount=0;this.m_jointCount=0;this.m_listener=listener;// TODO:
      // while (this.m_bodies.length < bodyCapacity) {
      //   this.m_bodies[this.m_bodies.length] = null;
      // }
      // TODO:
      // while (this.m_contacts.length < contactCapacity) {
      //   this.m_contacts[this.m_contacts.length] = null;
      // }
      // TODO:
      // while (this.m_joints.length < jointCapacity) {
      //   this.m_joints[this.m_joints.length] = null;
      // }
      // TODO:
      if(this.m_positions.length<bodyCapacity){var new_length=b2Max(this.m_positions.length*2,bodyCapacity);while(this.m_positions.length<new_length){this.m_positions[this.m_positions.length]=new b2Position();}}// TODO:
      if(this.m_velocities.length<bodyCapacity){var _new_length2=b2Max(this.m_velocities.length*2,bodyCapacity);while(this.m_velocities.length<_new_length2){this.m_velocities[this.m_velocities.length]=new b2Velocity();}}}},{key:"Clear",value:function Clear(){this.m_bodyCount=0;this.m_contactCount=0;this.m_jointCount=0;}},{key:"AddBody",value:function AddBody(body){// DEBUG: b2Assert(this.m_bodyCount < this.m_bodyCapacity);
      body.m_islandIndex=this.m_bodyCount;this.m_bodies[this.m_bodyCount++]=body;}},{key:"AddContact",value:function AddContact(contact){// DEBUG: b2Assert(this.m_contactCount < this.m_contactCapacity);
      this.m_contacts[this.m_contactCount++]=contact;}},{key:"AddJoint",value:function AddJoint(joint){// DEBUG: b2Assert(this.m_jointCount < this.m_jointCapacity);
      this.m_joints[this.m_jointCount++]=joint;}},{key:"Solve",value:function Solve(profile,step,gravity,allowSleep){var timer=b2Island.s_timer.Reset();var h=step.dt;// Integrate velocities and apply damping. Initialize the body state.
      for(var i=0;i<this.m_bodyCount;++i){var b=this.m_bodies[i];// const c: b2Vec2 =
      this.m_positions[i].c.Copy(b.m_sweep.c);var a=b.m_sweep.a;var v=this.m_velocities[i].v.Copy(b.m_linearVelocity);var w=b.m_angularVelocity;// Store positions for continuous collision.
      b.m_sweep.c0.Copy(b.m_sweep.c);b.m_sweep.a0=b.m_sweep.a;if(b.m_type===exports.b2BodyType.b2_dynamicBody){// Integrate velocities.
      v.x+=h*(b.m_gravityScale*gravity.x+b.m_invMass*b.m_force.x);v.y+=h*(b.m_gravityScale*gravity.y+b.m_invMass*b.m_force.y);w+=h*b.m_invI*b.m_torque;// Apply damping.
      // ODE: dv/dt + c * v = 0
      // Solution: v(t) = v0 * exp(-c * t)
      // Time step: v(t + dt) = v0 * exp(-c * (t + dt)) = v0 * exp(-c * t) * exp(-c * dt) = v * exp(-c * dt)
      // v2 = exp(-c * dt) * v1
      // Pade approximation:
      // v2 = v1 * 1 / (1 + c * dt)
      v.SelfMul(1.0/(1.0+h*b.m_linearDamping));w*=1.0/(1.0+h*b.m_angularDamping);}// this.m_positions[i].c = c;
      this.m_positions[i].a=a;// this.m_velocities[i].v = v;
      this.m_velocities[i].w=w;}timer.Reset();// Solver data
      var solverData=b2Island.s_solverData;solverData.step.Copy(step);solverData.positions=this.m_positions;solverData.velocities=this.m_velocities;// Initialize velocity constraints.
      var contactSolverDef=b2Island.s_contactSolverDef;contactSolverDef.step.Copy(step);contactSolverDef.contacts=this.m_contacts;contactSolverDef.count=this.m_contactCount;contactSolverDef.positions=this.m_positions;contactSolverDef.velocities=this.m_velocities;var contactSolver=b2Island.s_contactSolver.Initialize(contactSolverDef);contactSolver.InitializeVelocityConstraints();if(step.warmStarting){contactSolver.WarmStart();}for(var _i13=0;_i13<this.m_jointCount;++_i13){this.m_joints[_i13].InitVelocityConstraints(solverData);}profile.solveInit=timer.GetMilliseconds();// Solve velocity constraints.
      timer.Reset();for(var _i14=0;_i14<step.velocityIterations;++_i14){for(var j=0;j<this.m_jointCount;++j){this.m_joints[j].SolveVelocityConstraints(solverData);}contactSolver.SolveVelocityConstraints();}// Store impulses for warm starting
      contactSolver.StoreImpulses();profile.solveVelocity=timer.GetMilliseconds();// Integrate positions.
      for(var _i15=0;_i15<this.m_bodyCount;++_i15){var c=this.m_positions[_i15].c;var _a=this.m_positions[_i15].a;var _v3=this.m_velocities[_i15].v;var _w=this.m_velocities[_i15].w;// Check for large velocities
      var translation=b2Vec2.MulSV(h,_v3,b2Island.s_translation);if(b2Vec2.DotVV(translation,translation)>b2_maxTranslationSquared){var ratio=b2_maxTranslation/translation.Length();_v3.SelfMul(ratio);}var rotation=h*_w;if(rotation*rotation>b2_maxRotationSquared){var _ratio=b2_maxRotation/b2Abs(rotation);_w*=_ratio;}// Integrate
      c.x+=h*_v3.x;c.y+=h*_v3.y;_a+=h*_w;// this.m_positions[i].c = c;
      this.m_positions[_i15].a=_a;// this.m_velocities[i].v = v;
      this.m_velocities[_i15].w=_w;}// Solve position constraints
      timer.Reset();var positionSolved=false;for(var _i16=0;_i16<step.positionIterations;++_i16){var contactsOkay=contactSolver.SolvePositionConstraints();var jointsOkay=true;for(var _j4=0;_j4<this.m_jointCount;++_j4){var jointOkay=this.m_joints[_j4].SolvePositionConstraints(solverData);jointsOkay=jointsOkay&&jointOkay;}if(contactsOkay&&jointsOkay){// Exit early if the position errors are small.
      positionSolved=true;break;}}// Copy state buffers back to the bodies
      for(var _i17=0;_i17<this.m_bodyCount;++_i17){var body=this.m_bodies[_i17];body.m_sweep.c.Copy(this.m_positions[_i17].c);body.m_sweep.a=this.m_positions[_i17].a;body.m_linearVelocity.Copy(this.m_velocities[_i17].v);body.m_angularVelocity=this.m_velocities[_i17].w;body.SynchronizeTransform();}profile.solvePosition=timer.GetMilliseconds();this.Report(contactSolver.m_velocityConstraints);if(allowSleep){var minSleepTime=b2_maxFloat;var linTolSqr=b2_linearSleepTolerance*b2_linearSleepTolerance;var angTolSqr=b2_angularSleepTolerance*b2_angularSleepTolerance;for(var _i18=0;_i18<this.m_bodyCount;++_i18){var _b=this.m_bodies[_i18];if(_b.GetType()===exports.b2BodyType.b2_staticBody){continue;}if(!_b.m_autoSleepFlag||_b.m_angularVelocity*_b.m_angularVelocity>angTolSqr||b2Vec2.DotVV(_b.m_linearVelocity,_b.m_linearVelocity)>linTolSqr){_b.m_sleepTime=0;minSleepTime=0;}else {_b.m_sleepTime+=h;minSleepTime=b2Min(minSleepTime,_b.m_sleepTime);}}if(minSleepTime>=b2_timeToSleep&&positionSolved){for(var _i19=0;_i19<this.m_bodyCount;++_i19){var _b2=this.m_bodies[_i19];_b2.SetAwake(false);}}}}},{key:"SolveTOI",value:function SolveTOI(subStep,toiIndexA,toiIndexB){// DEBUG: b2Assert(toiIndexA < this.m_bodyCount);
      // DEBUG: b2Assert(toiIndexB < this.m_bodyCount);
      // Initialize the body state.
      for(var i=0;i<this.m_bodyCount;++i){var b=this.m_bodies[i];this.m_positions[i].c.Copy(b.m_sweep.c);this.m_positions[i].a=b.m_sweep.a;this.m_velocities[i].v.Copy(b.m_linearVelocity);this.m_velocities[i].w=b.m_angularVelocity;}var contactSolverDef=b2Island.s_contactSolverDef;contactSolverDef.contacts=this.m_contacts;contactSolverDef.count=this.m_contactCount;contactSolverDef.step.Copy(subStep);contactSolverDef.positions=this.m_positions;contactSolverDef.velocities=this.m_velocities;var contactSolver=b2Island.s_contactSolver.Initialize(contactSolverDef);// Solve position constraints.
      for(var _i20=0;_i20<subStep.positionIterations;++_i20){var contactsOkay=contactSolver.SolveTOIPositionConstraints(toiIndexA,toiIndexB);if(contactsOkay){break;}}/*
                #if 0
                  // Is the new position really safe?
                  for (int32 i = 0; i < this.m_contactCount; ++i) {
                    b2Contact* c = this.m_contacts[i];
                    b2Fixture* fA = c.GetFixtureA();
                    b2Fixture* fB = c.GetFixtureB();
              
                    b2Body* bA = fA.GetBody();
                    b2Body* bB = fB.GetBody();
              
                    int32 indexA = c.GetChildIndexA();
                    int32 indexB = c.GetChildIndexB();
              
                    b2DistanceInput input;
                    input.proxyA.Set(fA.GetShape(), indexA);
                    input.proxyB.Set(fB.GetShape(), indexB);
                    input.transformA = bA.GetTransform();
                    input.transformB = bB.GetTransform();
                    input.useRadii = false;
              
                    b2DistanceOutput output;
                    b2SimplexCache cache;
                    cache.count = 0;
                    b2Distance(&output, &cache, &input);
              
                    if (output.distance === 0 || cache.count === 3) {
                      cache.count += 0;
                    }
                  }
                #endif
                */// Leap of faith to new safe state.
      this.m_bodies[toiIndexA].m_sweep.c0.Copy(this.m_positions[toiIndexA].c);this.m_bodies[toiIndexA].m_sweep.a0=this.m_positions[toiIndexA].a;this.m_bodies[toiIndexB].m_sweep.c0.Copy(this.m_positions[toiIndexB].c);this.m_bodies[toiIndexB].m_sweep.a0=this.m_positions[toiIndexB].a;// No warm starting is needed for TOI events because warm
      // starting impulses were applied in the discrete solver.
      contactSolver.InitializeVelocityConstraints();// Solve velocity constraints.
      for(var _i21=0;_i21<subStep.velocityIterations;++_i21){contactSolver.SolveVelocityConstraints();}// Don't store the TOI contact forces for warm starting
      // because they can be quite large.
      var h=subStep.dt;// Integrate positions
      for(var _i22=0;_i22<this.m_bodyCount;++_i22){var c=this.m_positions[_i22].c;var a=this.m_positions[_i22].a;var v=this.m_velocities[_i22].v;var w=this.m_velocities[_i22].w;// Check for large velocities
      var translation=b2Vec2.MulSV(h,v,b2Island.s_translation);if(b2Vec2.DotVV(translation,translation)>b2_maxTranslationSquared){var ratio=b2_maxTranslation/translation.Length();v.SelfMul(ratio);}var rotation=h*w;if(rotation*rotation>b2_maxRotationSquared){var _ratio2=b2_maxRotation/b2Abs(rotation);w*=_ratio2;}// Integrate
      c.SelfMulAdd(h,v);a+=h*w;// this.m_positions[i].c = c;
      this.m_positions[_i22].a=a;// this.m_velocities[i].v = v;
      this.m_velocities[_i22].w=w;// Sync bodies
      var body=this.m_bodies[_i22];body.m_sweep.c.Copy(c);body.m_sweep.a=a;body.m_linearVelocity.Copy(v);body.m_angularVelocity=w;body.SynchronizeTransform();}this.Report(contactSolver.m_velocityConstraints);}},{key:"Report",value:function Report(constraints){if(this.m_listener===null){return;}for(var i=0;i<this.m_contactCount;++i){var c=this.m_contacts[i];if(!c){continue;}var vc=constraints[i];var impulse=b2Island.s_impulse;impulse.count=vc.pointCount;for(var j=0;j<vc.pointCount;++j){impulse.normalImpulses[j]=vc.points[j].normalImpulse;impulse.tangentImpulses[j]=vc.points[j].tangentImpulse;}this.m_listener.PostSolve(c,impulse);}}}]);}();b2Island.s_timer=new b2Timer();b2Island.s_solverData=new b2SolverData();b2Island.s_contactSolverDef=new b2ContactSolverDef();b2Island.s_contactSolver=new b2ContactSolver();b2Island.s_translation=new b2Vec2();b2Island.s_impulse=new b2ContactImpulse();/*
         * Copyright (c) 2013 Google, Inc.
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         */(function(b2ParticleFlag){/// Water particle.
      b2ParticleFlag[b2ParticleFlag["b2_waterParticle"]=0]="b2_waterParticle";/// Removed after next simulation step.
      b2ParticleFlag[b2ParticleFlag["b2_zombieParticle"]=2]="b2_zombieParticle";/// Zero velocity.
      b2ParticleFlag[b2ParticleFlag["b2_wallParticle"]=4]="b2_wallParticle";/// With restitution from stretching.
      b2ParticleFlag[b2ParticleFlag["b2_springParticle"]=8]="b2_springParticle";/// With restitution from deformation.
      b2ParticleFlag[b2ParticleFlag["b2_elasticParticle"]=16]="b2_elasticParticle";/// With viscosity.
      b2ParticleFlag[b2ParticleFlag["b2_viscousParticle"]=32]="b2_viscousParticle";/// Without isotropic pressure.
      b2ParticleFlag[b2ParticleFlag["b2_powderParticle"]=64]="b2_powderParticle";/// With surface tension.
      b2ParticleFlag[b2ParticleFlag["b2_tensileParticle"]=128]="b2_tensileParticle";/// Mix color between contacting particles.
      b2ParticleFlag[b2ParticleFlag["b2_colorMixingParticle"]=256]="b2_colorMixingParticle";/// Call b2DestructionListener on destruction.
      b2ParticleFlag[b2ParticleFlag["b2_destructionListenerParticle"]=512]="b2_destructionListenerParticle";/// Prevents other particles from leaking.
      b2ParticleFlag[b2ParticleFlag["b2_barrierParticle"]=1024]="b2_barrierParticle";/// Less compressibility.
      b2ParticleFlag[b2ParticleFlag["b2_staticPressureParticle"]=2048]="b2_staticPressureParticle";/// Makes pairs or triads with other particles.
      b2ParticleFlag[b2ParticleFlag["b2_reactiveParticle"]=4096]="b2_reactiveParticle";/// With high repulsive force.
      b2ParticleFlag[b2ParticleFlag["b2_repulsiveParticle"]=8192]="b2_repulsiveParticle";/// Call b2ContactListener when this particle is about to interact with
      /// a rigid body or stops interacting with a rigid body.
      /// This results in an expensive operation compared to using
      /// b2_fixtureContactFilterParticle to detect collisions between
      /// particles.
      b2ParticleFlag[b2ParticleFlag["b2_fixtureContactListenerParticle"]=16384]="b2_fixtureContactListenerParticle";/// Call b2ContactListener when this particle is about to interact with
      /// another particle or stops interacting with another particle.
      /// This results in an expensive operation compared to using
      /// b2_particleContactFilterParticle to detect collisions between
      /// particles.
      b2ParticleFlag[b2ParticleFlag["b2_particleContactListenerParticle"]=32768]="b2_particleContactListenerParticle";/// Call b2ContactFilter when this particle interacts with rigid bodies.
      b2ParticleFlag[b2ParticleFlag["b2_fixtureContactFilterParticle"]=65536]="b2_fixtureContactFilterParticle";/// Call b2ContactFilter when this particle interacts with other
      /// particles.
      b2ParticleFlag[b2ParticleFlag["b2_particleContactFilterParticle"]=131072]="b2_particleContactFilterParticle";})(exports.b2ParticleFlag||(exports.b2ParticleFlag={}));var b2ParticleDef=/*#__PURE__*/_createClass(function b2ParticleDef(){_classCallCheck(this,b2ParticleDef);this.flags=0;this.position=new b2Vec2();this.velocity=new b2Vec2();this.color=new b2Color(0,0,0,0);this.lifetime=0.0;this.userData=null;this.group=null;});function b2CalculateParticleIterations(gravity,radius,timeStep){// In some situations you may want more particle iterations than this,
      // but to avoid excessive cycle cost, don't recommend more than this.
      var B2_MAX_RECOMMENDED_PARTICLE_ITERATIONS=8;var B2_RADIUS_THRESHOLD=0.01;var iterations=Math.ceil(Math.sqrt(gravity/(B2_RADIUS_THRESHOLD*radius))*timeStep);return b2Clamp(iterations,1,B2_MAX_RECOMMENDED_PARTICLE_ITERATIONS);}var b2ParticleHandle=/*#__PURE__*/function(){function b2ParticleHandle(){_classCallCheck(this,b2ParticleHandle);this.m_index=b2_invalidParticleIndex;}return _createClass(b2ParticleHandle,[{key:"GetIndex",value:function GetIndex(){return this.m_index;}},{key:"SetIndex",value:function SetIndex(index){this.m_index=index;}}]);}();// #endif
      /*
         * Copyright (c) 2013 Google, Inc.
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         */(function(b2ParticleGroupFlag){/// Prevents overlapping or leaking.
      b2ParticleGroupFlag[b2ParticleGroupFlag["b2_solidParticleGroup"]=1]="b2_solidParticleGroup";/// Keeps its shape.
      b2ParticleGroupFlag[b2ParticleGroupFlag["b2_rigidParticleGroup"]=2]="b2_rigidParticleGroup";/// Won't be destroyed if it gets empty.
      b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupCanBeEmpty"]=4]="b2_particleGroupCanBeEmpty";/// Will be destroyed on next simulation step.
      b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupWillBeDestroyed"]=8]="b2_particleGroupWillBeDestroyed";/// Updates depth data on next simulation step.
      b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupNeedsUpdateDepth"]=16]="b2_particleGroupNeedsUpdateDepth";b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupInternalMask"]=24]="b2_particleGroupInternalMask";})(exports.b2ParticleGroupFlag||(exports.b2ParticleGroupFlag={}));var b2ParticleGroupDef=/*#__PURE__*/_createClass(function b2ParticleGroupDef(){_classCallCheck(this,b2ParticleGroupDef);this.flags=0;this.groupFlags=0;this.position=new b2Vec2();this.angle=0.0;this.linearVelocity=new b2Vec2();this.angularVelocity=0.0;this.color=new b2Color();this.strength=1.0;this.shapeCount=0;this.stride=0;this.particleCount=0;this.lifetime=0;this.userData=null;this.group=null;});var b2ParticleGroup=/*#__PURE__*/function(){function b2ParticleGroup(system){_classCallCheck(this,b2ParticleGroup);this.m_firstIndex=0;this.m_lastIndex=0;this.m_groupFlags=0;this.m_strength=1.0;this.m_prev=null;this.m_next=null;this.m_timestamp=-1;this.m_mass=0.0;this.m_inertia=0.0;this.m_center=new b2Vec2();this.m_linearVelocity=new b2Vec2();this.m_angularVelocity=0.0;this.m_transform=new b2Transform();///m_transform.SetIdentity();
      this.m_userData=null;this.m_system=system;}return _createClass(b2ParticleGroup,[{key:"GetNext",value:function GetNext(){return this.m_next;}},{key:"GetParticleSystem",value:function GetParticleSystem(){return this.m_system;}},{key:"GetParticleCount",value:function GetParticleCount(){return this.m_lastIndex-this.m_firstIndex;}},{key:"GetBufferIndex",value:function GetBufferIndex(){return this.m_firstIndex;}},{key:"ContainsParticle",value:function ContainsParticle(index){return this.m_firstIndex<=index&&index<this.m_lastIndex;}},{key:"GetAllParticleFlags",value:function GetAllParticleFlags(){if(!this.m_system.m_flagsBuffer.data){throw new Error();}var flags=0;for(var i=this.m_firstIndex;i<this.m_lastIndex;i++){flags|=this.m_system.m_flagsBuffer.data[i];}return flags;}},{key:"GetGroupFlags",value:function GetGroupFlags(){return this.m_groupFlags;}},{key:"SetGroupFlags",value:function SetGroupFlags(flags){// DEBUG: b2Assert((flags & b2ParticleGroupFlag.b2_particleGroupInternalMask) === 0);
      flags|=this.m_groupFlags&exports.b2ParticleGroupFlag.b2_particleGroupInternalMask;this.m_system.SetGroupFlags(this,flags);}},{key:"GetMass",value:function GetMass(){this.UpdateStatistics();return this.m_mass;}},{key:"GetInertia",value:function GetInertia(){this.UpdateStatistics();return this.m_inertia;}},{key:"GetCenter",value:function GetCenter(){this.UpdateStatistics();return this.m_center;}},{key:"GetLinearVelocity",value:function GetLinearVelocity(){this.UpdateStatistics();return this.m_linearVelocity;}},{key:"GetAngularVelocity",value:function GetAngularVelocity(){this.UpdateStatistics();return this.m_angularVelocity;}},{key:"GetTransform",value:function GetTransform(){return this.m_transform;}},{key:"GetPosition",value:function GetPosition(){return this.m_transform.p;}},{key:"GetAngle",value:function GetAngle(){return this.m_transform.q.GetAngle();}},{key:"GetLinearVelocityFromWorldPoint",value:function GetLinearVelocityFromWorldPoint(worldPoint,out){var s_t0=b2ParticleGroup.GetLinearVelocityFromWorldPoint_s_t0;this.UpdateStatistics();///  return m_linearVelocity + b2Cross(m_angularVelocity, worldPoint - m_center);
      return b2Vec2.AddVCrossSV(this.m_linearVelocity,this.m_angularVelocity,b2Vec2.SubVV(worldPoint,this.m_center,s_t0),out);}},{key:"GetUserData",value:function GetUserData(){return this.m_userData;}},{key:"SetUserData",value:function SetUserData(data){this.m_userData=data;}},{key:"ApplyForce",value:function ApplyForce(force){this.m_system.ApplyForce(this.m_firstIndex,this.m_lastIndex,force);}},{key:"ApplyLinearImpulse",value:function ApplyLinearImpulse(impulse){this.m_system.ApplyLinearImpulse(this.m_firstIndex,this.m_lastIndex,impulse);}},{key:"DestroyParticles",value:function DestroyParticles(callDestructionListener){if(this.m_system.m_world.IsLocked()){throw new Error();}for(var i=this.m_firstIndex;i<this.m_lastIndex;i++){this.m_system.DestroyParticle(i,callDestructionListener);}}},{key:"UpdateStatistics",value:function UpdateStatistics(){if(!this.m_system.m_positionBuffer.data){throw new Error();}if(!this.m_system.m_velocityBuffer.data){throw new Error();}var p=new b2Vec2();var v=new b2Vec2();if(this.m_timestamp!==this.m_system.m_timestamp){var m=this.m_system.GetParticleMass();///  this.m_mass = 0;
      this.m_mass=m*(this.m_lastIndex-this.m_firstIndex);this.m_center.SetZero();this.m_linearVelocity.SetZero();for(var i=this.m_firstIndex;i<this.m_lastIndex;i++){///  this.m_mass += m;
      ///  this.m_center += m * this.m_system.m_positionBuffer.data[i];
      this.m_center.SelfMulAdd(m,this.m_system.m_positionBuffer.data[i]);///  this.m_linearVelocity += m * this.m_system.m_velocityBuffer.data[i];
      this.m_linearVelocity.SelfMulAdd(m,this.m_system.m_velocityBuffer.data[i]);}if(this.m_mass>0){var inv_mass=1/this.m_mass;///this.m_center *= 1 / this.m_mass;
      this.m_center.SelfMul(inv_mass);///this.m_linearVelocity *= 1 / this.m_mass;
      this.m_linearVelocity.SelfMul(inv_mass);}this.m_inertia=0;this.m_angularVelocity=0;for(var _i23=this.m_firstIndex;_i23<this.m_lastIndex;_i23++){///b2Vec2 p = this.m_system.m_positionBuffer.data[i] - this.m_center;
      b2Vec2.SubVV(this.m_system.m_positionBuffer.data[_i23],this.m_center,p);///b2Vec2 v = this.m_system.m_velocityBuffer.data[i] - this.m_linearVelocity;
      b2Vec2.SubVV(this.m_system.m_velocityBuffer.data[_i23],this.m_linearVelocity,v);this.m_inertia+=m*b2Vec2.DotVV(p,p);this.m_angularVelocity+=m*b2Vec2.CrossVV(p,v);}if(this.m_inertia>0){this.m_angularVelocity*=1/this.m_inertia;}this.m_timestamp=this.m_system.m_timestamp;}}}]);}();b2ParticleGroup.GetLinearVelocityFromWorldPoint_s_t0=new b2Vec2();// #endif
      /*
         * Copyright (c) 2013 Google, Inc.
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         */// #if B2_ENABLE_PARTICLE
      // DEBUG: import { b2Assert } from "../common/b2_settings.js";
      var b2StackQueue=/*#__PURE__*/function(){function b2StackQueue(capacity){_classCallCheck(this,b2StackQueue);this.m_buffer=[];this.m_front=0;this.m_back=0;this.m_buffer.fill(null,0,capacity);}return _createClass(b2StackQueue,[{key:"m_capacity",get:function get(){return this.m_buffer.length;}},{key:"Push",value:function Push(item){if(this.m_back>=this.m_capacity){for(var i=this.m_front;i<this.m_back;i++){this.m_buffer[i-this.m_front]=this.m_buffer[i];}this.m_back-=this.m_front;this.m_front=0;}this.m_buffer[this.m_back]=item;this.m_back++;}},{key:"Pop",value:function Pop(){// DEBUG: b2Assert(this.m_front < this.m_back);
      this.m_buffer[this.m_front]=null;this.m_front++;}},{key:"Empty",value:function Empty(){// DEBUG: b2Assert(this.m_front <= this.m_back);
      return this.m_front===this.m_back;}},{key:"Front",value:function Front(){var item=this.m_buffer[this.m_front];if(!item){throw new Error();}return item;}}]);}();// #endif
      /*
         * Copyright (c) 2013 Google, Inc.
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * A field representing the nearest generator from each point.
         */var b2VoronoiDiagram=/*#__PURE__*/function(){function b2VoronoiDiagram(generatorCapacity){_classCallCheck(this,b2VoronoiDiagram);this.m_generatorCapacity=0;this.m_generatorCount=0;this.m_countX=0;this.m_countY=0;this.m_diagram=[];this.m_generatorBuffer=b2MakeArray(generatorCapacity,function(index){return new b2VoronoiDiagram_Generator();});this.m_generatorCapacity=generatorCapacity;}/**
             * Add a generator.
             *
             * @param center the position of the generator.
             * @param tag a tag used to identify the generator in callback functions.
             * @param necessary whether to callback for nodes associated with the generator.
             */return _createClass(b2VoronoiDiagram,[{key:"AddGenerator",value:function AddGenerator(center,tag,necessary){// DEBUG: b2Assert(this.m_generatorCount < this.m_generatorCapacity);
      var g=this.m_generatorBuffer[this.m_generatorCount++];g.center.Copy(center);g.tag=tag;g.necessary=necessary;}/**
             * Generate the Voronoi diagram. It is rasterized with a given
             * interval in the same range as the necessary generators exist.
             *
             * @param radius the interval of the diagram.
             * @param margin margin for which the range of the diagram is extended.
             */},{key:"Generate",value:function Generate(radius,margin){var inverseRadius=1/radius;var lower=new b2Vec2(+b2_maxFloat,+b2_maxFloat);var upper=new b2Vec2(-b2_maxFloat,-b2_maxFloat);var necessary_count=0;for(var k=0;k<this.m_generatorCount;k++){var g=this.m_generatorBuffer[k];if(g.necessary){b2Vec2.MinV(lower,g.center,lower);b2Vec2.MaxV(upper,g.center,upper);++necessary_count;}}if(necessary_count===0){///debugger;
      this.m_countX=0;this.m_countY=0;return;}lower.x-=margin;lower.y-=margin;upper.x+=margin;upper.y+=margin;this.m_countX=1+Math.floor(inverseRadius*(upper.x-lower.x));this.m_countY=1+Math.floor(inverseRadius*(upper.y-lower.y));this.m_diagram=[];// b2MakeArray(this.m_countX * this.m_countY, (index) => null);
      // (4 * m_countX * m_countY) is the queue capacity that is experimentally
      // known to be necessary and sufficient for general particle distributions.
      var queue=new b2StackQueue(4*this.m_countX*this.m_countY);for(var _k4=0;_k4<this.m_generatorCount;_k4++){var _g=this.m_generatorBuffer[_k4];///  g.center = inverseRadius * (g.center - lower);
      _g.center.SelfSub(lower).SelfMul(inverseRadius);var x=Math.floor(_g.center.x);var y=Math.floor(_g.center.y);if(x>=0&&y>=0&&x<this.m_countX&&y<this.m_countY){queue.Push(new b2VoronoiDiagram_Task(x,y,x+y*this.m_countX,_g));}}while(!queue.Empty()){var task=queue.Front();var _x=task.m_x;var _y=task.m_y;var i=task.m_i;var _g2=task.m_generator;queue.Pop();if(!this.m_diagram[i]){this.m_diagram[i]=_g2;if(_x>0){queue.Push(new b2VoronoiDiagram_Task(_x-1,_y,i-1,_g2));}if(_y>0){queue.Push(new b2VoronoiDiagram_Task(_x,_y-1,i-this.m_countX,_g2));}if(_x<this.m_countX-1){queue.Push(new b2VoronoiDiagram_Task(_x+1,_y,i+1,_g2));}if(_y<this.m_countY-1){queue.Push(new b2VoronoiDiagram_Task(_x,_y+1,i+this.m_countX,_g2));}}}for(var _y2=0;_y2<this.m_countY;_y2++){for(var _x2=0;_x2<this.m_countX-1;_x2++){var _i24=_x2+_y2*this.m_countX;var a=this.m_diagram[_i24];var b=this.m_diagram[_i24+1];if(a!==b){queue.Push(new b2VoronoiDiagram_Task(_x2,_y2,_i24,b));queue.Push(new b2VoronoiDiagram_Task(_x2+1,_y2,_i24+1,a));}}}for(var _y3=0;_y3<this.m_countY-1;_y3++){for(var _x3=0;_x3<this.m_countX;_x3++){var _i25=_x3+_y3*this.m_countX;var _a2=this.m_diagram[_i25];var _b3=this.m_diagram[_i25+this.m_countX];if(_a2!==_b3){queue.Push(new b2VoronoiDiagram_Task(_x3,_y3,_i25,_b3));queue.Push(new b2VoronoiDiagram_Task(_x3,_y3+1,_i25+this.m_countX,_a2));}}}while(!queue.Empty()){var _task=queue.Front();var _x4=_task.m_x;var _y4=_task.m_y;var _i26=_task.m_i;var _k5=_task.m_generator;queue.Pop();var _a3=this.m_diagram[_i26];var _b4=_k5;if(_a3!==_b4){var ax=_a3.center.x-_x4;var ay=_a3.center.y-_y4;var bx=_b4.center.x-_x4;var by=_b4.center.y-_y4;var a2=ax*ax+ay*ay;var b2=bx*bx+by*by;if(a2>b2){this.m_diagram[_i26]=_b4;if(_x4>0){queue.Push(new b2VoronoiDiagram_Task(_x4-1,_y4,_i26-1,_b4));}if(_y4>0){queue.Push(new b2VoronoiDiagram_Task(_x4,_y4-1,_i26-this.m_countX,_b4));}if(_x4<this.m_countX-1){queue.Push(new b2VoronoiDiagram_Task(_x4+1,_y4,_i26+1,_b4));}if(_y4<this.m_countY-1){queue.Push(new b2VoronoiDiagram_Task(_x4,_y4+1,_i26+this.m_countX,_b4));}}}}}/**
             * Enumerate all nodes that contain at least one necessary
             * generator.
             */},{key:"GetNodes",value:function GetNodes(callback){for(var y=0;y<this.m_countY-1;y++){for(var x=0;x<this.m_countX-1;x++){var i=x+y*this.m_countX;var a=this.m_diagram[i];var b=this.m_diagram[i+1];var c=this.m_diagram[i+this.m_countX];var d=this.m_diagram[i+1+this.m_countX];if(b!==c){if(a!==b&&a!==c&&(a.necessary||b.necessary||c.necessary)){callback(a.tag,b.tag,c.tag);}if(d!==b&&d!==c&&(a.necessary||b.necessary||c.necessary)){callback(b.tag,d.tag,c.tag);}}}}}}]);}();var b2VoronoiDiagram_Generator=/*#__PURE__*/_createClass(function b2VoronoiDiagram_Generator(){_classCallCheck(this,b2VoronoiDiagram_Generator);this.center=new b2Vec2();this.tag=0;this.necessary=false;});var b2VoronoiDiagram_Task=/*#__PURE__*/_createClass(function b2VoronoiDiagram_Task(x,y,i,g){_classCallCheck(this,b2VoronoiDiagram_Task);this.m_x=x;this.m_y=y;this.m_i=i;this.m_generator=g;});// #endif
      /*
         * Copyright (c) 2013 Google, Inc.
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         */function std_iter_swap$1(array,a,b){var tmp=array[a];array[a]=array[b];array[b]=tmp;}function default_compare$1(a,b){return a<b;}function std_sort$1(array){var first=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var len=arguments.length>2&&arguments[2]!==undefined?arguments[2]:array.length-first;var cmp=arguments.length>3&&arguments[3]!==undefined?arguments[3]:default_compare$1;var left=first;var stack=[];var pos=0;for(;;){/* outer loop */for(;left+1<len;len++){/* sort left to len-1 */var pivot=array[left+Math.floor(Math.random()*(len-left))];/* pick random pivot */stack[pos++]=len;/* sort right part later */for(var right=left-1;;){/* inner loop: partitioning */while(cmp(array[++right],pivot)){}/* look for greater element */while(cmp(pivot,array[--len])){}/* look for smaller element */if(right>=len){break;}/* partition point found? */std_iter_swap$1(array,right,len);/* the only swap */}/* partitioned, continue left part */}if(pos===0){break;}/* stack empty? */left=len;/* left to right is sorted */len=stack[--pos];/* get next range to sort */}return array;}function std_stable_sort(array){var first=arguments.length>1&&arguments[1]!==undefined?arguments[1]:0;var len=arguments.length>2&&arguments[2]!==undefined?arguments[2]:array.length-first;var cmp=arguments.length>3&&arguments[3]!==undefined?arguments[3]:default_compare$1;return std_sort$1(array,first,len,cmp);}function std_remove_if(array,predicate){var length=arguments.length>2&&arguments[2]!==undefined?arguments[2]:array.length;var l=0;for(var c=0;c<length;++c){// if we can be collapsed, keep l where it is.
      if(predicate(array[c])){continue;}// this node can't be collapsed; push it back as far as we can.
      if(c===l){++l;continue;// quick exit if we're already in the right spot
      }// array[l++] = array[c];
      std_iter_swap$1(array,l++,c);}return l;}function std_lower_bound(array,first,last,val,cmp){var count=last-first;while(count>0){var step=Math.floor(count/2);var it=first+step;if(cmp(array[it],val)){first=++it;count-=step+1;}else {count=step;}}return first;}function std_upper_bound(array,first,last,val,cmp){var count=last-first;while(count>0){var step=Math.floor(count/2);var it=first+step;if(!cmp(val,array[it])){first=++it;count-=step+1;}else {count=step;}}return first;}function std_rotate(array,first,n_first,last){var next=n_first;while(first!==next){std_iter_swap$1(array,first++,next++);if(next===last){next=n_first;}else if(first===n_first){n_first=next;}}}function std_unique(array,first,last,cmp){if(first===last){return last;}var result=first;while(++first!==last){if(!cmp(array[result],array[first])){///array[++result] = array[first];
      std_iter_swap$1(array,++result,first);}}return ++result;}var b2GrowableBuffer=/*#__PURE__*/function(){function b2GrowableBuffer(allocator){_classCallCheck(this,b2GrowableBuffer);this.data=[];this.count=0;this.capacity=0;this.allocator=allocator;}return _createClass(b2GrowableBuffer,[{key:"Append",value:function Append(){if(this.count>=this.capacity){this.Grow();}return this.count++;}},{key:"Reserve",value:function Reserve(newCapacity){if(this.capacity>=newCapacity){return;}// DEBUG: b2Assert(this.capacity === this.data.length);
      for(var i=this.capacity;i<newCapacity;++i){this.data[i]=this.allocator();}this.capacity=newCapacity;}},{key:"Grow",value:function Grow(){// Double the capacity.
      var newCapacity=this.capacity?2*this.capacity:b2_minParticleSystemBufferCapacity;// DEBUG: b2Assert(newCapacity > this.capacity);
      this.Reserve(newCapacity);}},{key:"Free",value:function Free(){if(this.data.length===0){return;}this.data=[];this.capacity=0;this.count=0;}},{key:"Shorten",value:function Shorten(newEnd){// DEBUG: b2Assert(false);
      }},{key:"Data",value:function Data(){return this.data;}},{key:"GetCount",value:function GetCount(){return this.count;}},{key:"SetCount",value:function SetCount(newCount){// DEBUG: b2Assert(0 <= newCount && newCount <= this.capacity);
      this.count=newCount;}},{key:"GetCapacity",value:function GetCapacity(){return this.capacity;}},{key:"RemoveIf",value:function RemoveIf(pred){// DEBUG: let count = 0;
      // DEBUG: for (let i = 0; i < this.count; ++i) {
      // DEBUG:   if (!pred(this.data[i])) {
      // DEBUG:     count++;
      // DEBUG:   }
      // DEBUG: }
      this.count=std_remove_if(this.data,pred,this.count);// DEBUG: b2Assert(count === this.count);
      }},{key:"Unique",value:function Unique(pred){this.count=std_unique(this.data,0,this.count,pred);}}]);}();var b2FixtureParticleQueryCallback=/*#__PURE__*/function(_b2QueryCallback){function b2FixtureParticleQueryCallback(system){var _this29;_classCallCheck(this,b2FixtureParticleQueryCallback);_this29=_callSuper(this,b2FixtureParticleQueryCallback);_this29.m_system=system;return _this29;}_inherits(b2FixtureParticleQueryCallback,_b2QueryCallback);return _createClass(b2FixtureParticleQueryCallback,[{key:"ShouldQueryParticleSystem",value:function ShouldQueryParticleSystem(system){// Skip reporting particles.
      return false;}},{key:"ReportFixture",value:function ReportFixture(fixture){if(fixture.IsSensor()){return true;}var shape=fixture.GetShape();var childCount=shape.GetChildCount();for(var childIndex=0;childIndex<childCount;childIndex++){var aabb=fixture.GetAABB(childIndex);var enumerator=this.m_system.GetInsideBoundsEnumerator(aabb);var index=void 0;while((index=enumerator.GetNext())>=0){this.ReportFixtureAndParticle(fixture,childIndex,index);}}return true;}},{key:"ReportParticle",value:function ReportParticle(system,index){return false;}},{key:"ReportFixtureAndParticle",value:function ReportFixtureAndParticle(fixture,childIndex,index){// DEBUG: b2Assert(false); // pure virtual
      }}]);}(b2QueryCallback);var b2ParticleContact=/*#__PURE__*/function(){function b2ParticleContact(){_classCallCheck(this,b2ParticleContact);this.indexA=0;this.indexB=0;this.weight=0;this.normal=new b2Vec2();this.flags=0;}return _createClass(b2ParticleContact,[{key:"SetIndices",value:function SetIndices(a,b){// DEBUG: b2Assert(a <= b2_maxParticleIndex && b <= b2_maxParticleIndex);
      this.indexA=a;this.indexB=b;}},{key:"SetWeight",value:function SetWeight(w){this.weight=w;}},{key:"SetNormal",value:function SetNormal(n){this.normal.Copy(n);}},{key:"SetFlags",value:function SetFlags(f){this.flags=f;}},{key:"GetIndexA",value:function GetIndexA(){return this.indexA;}},{key:"GetIndexB",value:function GetIndexB(){return this.indexB;}},{key:"GetWeight",value:function GetWeight(){return this.weight;}},{key:"GetNormal",value:function GetNormal(){return this.normal;}},{key:"GetFlags",value:function GetFlags(){return this.flags;}},{key:"IsEqual",value:function IsEqual(rhs){return this.indexA===rhs.indexA&&this.indexB===rhs.indexB&&this.flags===rhs.flags&&this.weight===rhs.weight&&this.normal.x===rhs.normal.x&&this.normal.y===rhs.normal.y;}},{key:"IsNotEqual",value:function IsNotEqual(rhs){return !this.IsEqual(rhs);}},{key:"ApproximatelyEqual",value:function ApproximatelyEqual(rhs){var MAX_WEIGHT_DIFF=0.01;// Weight 0 ~ 1, so about 1%
      var MAX_NORMAL_DIFF_SQ=0.01*0.01;// Normal length = 1, so 1%
      return this.indexA===rhs.indexA&&this.indexB===rhs.indexB&&this.flags===rhs.flags&&b2Abs(this.weight-rhs.weight)<MAX_WEIGHT_DIFF&&b2Vec2.DistanceSquaredVV(this.normal,rhs.normal)<MAX_NORMAL_DIFF_SQ;}}]);}();var b2ParticleBodyContact=/*#__PURE__*/_createClass(function b2ParticleBodyContact(){_classCallCheck(this,b2ParticleBodyContact);this.index=0;// Index of the particle making contact.
      this.weight=0.0;// Weight of the contact. A value between 0.0f and 1.0f.
      this.normal=new b2Vec2();// The normalized direction from the particle to the body.
      this.mass=0.0;// The effective mass used in calculating force.
      });var b2ParticlePair=/*#__PURE__*/_createClass(function b2ParticlePair(){_classCallCheck(this,b2ParticlePair);this.indexA=0;// Indices of the respective particles making pair.
      this.indexB=0;this.flags=0;// The logical sum of the particle flags. See the b2ParticleFlag enum.
      this.strength=0.0;// The strength of cohesion among the particles.
      this.distance=0.0;// The initial distance of the particles.
      });var b2ParticleTriad=/*#__PURE__*/_createClass(function b2ParticleTriad(){_classCallCheck(this,b2ParticleTriad);this.indexA=0;// Indices of the respective particles making triad.
      this.indexB=0;this.indexC=0;this.flags=0;// The logical sum of the particle flags. See the b2ParticleFlag enum.
      this.strength=0.0;// The strength of cohesion among the particles.
      this.pa=new b2Vec2(0.0,0.0);// Values used for calculation.
      this.pb=new b2Vec2(0.0,0.0);this.pc=new b2Vec2(0.0,0.0);this.ka=0.0;this.kb=0.0;this.kc=0.0;this.s=0.0;});var b2ParticleSystemDef=/*#__PURE__*/function(){function b2ParticleSystemDef(){_classCallCheck(this,b2ParticleSystemDef);// Initialize physical coefficients to the maximum values that
      // maintain numerical stability.
      /**
                 * Enable strict Particle/Body contact check.
                 * See SetStrictContactCheck for details.
                 */this.strictContactCheck=false;/**
                 * Set the particle density.
                 * See SetDensity for details.
                 */this.density=1.0;/**
                 * Change the particle gravity scale. Adjusts the effect of the
                 * global gravity vector on particles. Default value is 1.0f.
                 */this.gravityScale=1.0;/**
                 * Particles behave as circles with this radius. In Box2D units.
                 */this.radius=1.0;/**
                 * Set the maximum number of particles.
                 * By default, there is no maximum. The particle buffers can
                 * continue to grow while b2World's block allocator still has
                 * memory.
                 * See SetMaxParticleCount for details.
                 */this.maxCount=0;/**
                 * Increases pressure in response to compression
                 * Smaller values allow more compression
                 */this.pressureStrength=0.005;/**
                 * Reduces velocity along the collision normal
                 * Smaller value reduces less
                 */this.dampingStrength=1.0;/**
                 * Restores shape of elastic particle groups
                 * Larger values increase elastic particle velocity
                 */this.elasticStrength=0.25;/**
                 * Restores length of spring particle groups
                 * Larger values increase spring particle velocity
                 */this.springStrength=0.25;/**
                 * Reduces relative velocity of viscous particles
                 * Larger values slow down viscous particles more
                 */this.viscousStrength=0.25;/**
                 * Produces pressure on tensile particles
                 * 0~0.2. Larger values increase the amount of surface tension.
                 */this.surfaceTensionPressureStrength=0.2;/**
                 * Smoothes outline of tensile particles
                 * 0~0.2. Larger values result in rounder, smoother,
                 * water-drop-like clusters of particles.
                 */this.surfaceTensionNormalStrength=0.2;/**
                 * Produces additional pressure on repulsive particles
                 * Larger values repulse more
                 * Negative values mean attraction. The range where particles
                 * behave stably is about -0.2 to 2.0.
                 */this.repulsiveStrength=1.0;/**
                 * Produces repulsion between powder particles
                 * Larger values repulse more
                 */this.powderStrength=0.5;/**
                 * Pushes particles out of solid particle group
                 * Larger values repulse more
                 */this.ejectionStrength=0.5;/**
                 * Produces static pressure
                 * Larger values increase the pressure on neighboring partilces
                 * For a description of static pressure, see
                 * http://en.wikipedia.org/wiki/Static_pressure#Static_pressure_in_fluid_dynamics
                 */this.staticPressureStrength=0.2;/**
                 * Reduces instability in static pressure calculation
                 * Larger values make stabilize static pressure with fewer
                 * iterations
                 */this.staticPressureRelaxation=0.2;/**
                 * Computes static pressure more precisely
                 * See SetStaticPressureIterations for details
                 */this.staticPressureIterations=8;/**
                 * Determines how fast colors are mixed
                 * 1.0f ==> mixed immediately
                 * 0.5f ==> mixed half way each simulation step (see
                 * b2World::Step())
                 */this.colorMixingStrength=0.5;/**
                 * Whether to destroy particles by age when no more particles
                 * can be created.  See #b2ParticleSystem::SetDestructionByAge()
                 * for more information.
                 */this.destroyByAge=true;/**
                 * Granularity of particle lifetimes in seconds.  By default
                 * this is set to (1.0f / 60.0f) seconds.  b2ParticleSystem uses
                 * a 32-bit signed value to track particle lifetimes so the
                 * maximum lifetime of a particle is (2^32 - 1) / (1.0f /
                 * lifetimeGranularity) seconds. With the value set to 1/60 the
                 * maximum lifetime or age of a particle is 2.27 years.
                 */this.lifetimeGranularity=1.0/60.0;}return _createClass(b2ParticleSystemDef,[{key:"Copy",value:function Copy(def){this.strictContactCheck=def.strictContactCheck;this.density=def.density;this.gravityScale=def.gravityScale;this.radius=def.radius;this.maxCount=def.maxCount;this.pressureStrength=def.pressureStrength;this.dampingStrength=def.dampingStrength;this.elasticStrength=def.elasticStrength;this.springStrength=def.springStrength;this.viscousStrength=def.viscousStrength;this.surfaceTensionPressureStrength=def.surfaceTensionPressureStrength;this.surfaceTensionNormalStrength=def.surfaceTensionNormalStrength;this.repulsiveStrength=def.repulsiveStrength;this.powderStrength=def.powderStrength;this.ejectionStrength=def.ejectionStrength;this.staticPressureStrength=def.staticPressureStrength;this.staticPressureRelaxation=def.staticPressureRelaxation;this.staticPressureIterations=def.staticPressureIterations;this.colorMixingStrength=def.colorMixingStrength;this.destroyByAge=def.destroyByAge;this.lifetimeGranularity=def.lifetimeGranularity;return this;}},{key:"Clone",value:function Clone(){return new b2ParticleSystemDef().Copy(this);}}]);}();var b2ParticleSystem=/*#__PURE__*/function(){function b2ParticleSystem(def,world){_classCallCheck(this,b2ParticleSystem);this.m_paused=false;this.m_timestamp=0;this.m_allParticleFlags=0;this.m_needsUpdateAllParticleFlags=false;this.m_allGroupFlags=0;this.m_needsUpdateAllGroupFlags=false;this.m_hasForce=false;this.m_iterationIndex=0;this.m_inverseDensity=0.0;this.m_particleDiameter=0.0;this.m_inverseDiameter=0.0;this.m_squaredDiameter=0.0;this.m_count=0;this.m_internalAllocatedCapacity=0;/**
                 * Allocator for b2ParticleHandle instances.
                 *////m_handleAllocator: any = null;
      /**
                 * Maps particle indicies to handles.
                 */this.m_handleIndexBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_flagsBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_positionBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_velocityBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_forceBuffer=[];/**
                 * this.m_weightBuffer is populated in ComputeWeight and used in
                 * ComputeDepth(), SolveStaticPressure() and SolvePressure().
                 */this.m_weightBuffer=[];/**
                 * When any particles have the flag b2_staticPressureParticle,
                 * this.m_staticPressureBuffer is first allocated and used in
                 * SolveStaticPressure() and SolvePressure().  It will be
                 * reallocated on subsequent CreateParticle() calls.
                 */this.m_staticPressureBuffer=[];/**
                 * this.m_accumulationBuffer is used in many functions as a temporary
                 * buffer for scalar values.
                 */this.m_accumulationBuffer=[];/**
                 * When any particles have the flag b2_tensileParticle,
                 * this.m_accumulation2Buffer is first allocated and used in
                 * SolveTensile() as a temporary buffer for vector values.  It
                 * will be reallocated on subsequent CreateParticle() calls.
                 */this.m_accumulation2Buffer=[];/**
                 * When any particle groups have the flag b2_solidParticleGroup,
                 * this.m_depthBuffer is first allocated and populated in
                 * ComputeDepth() and used in SolveSolid(). It will be
                 * reallocated on subsequent CreateParticle() calls.
                 */this.m_depthBuffer=[];this.m_colorBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_groupBuffer=[];this.m_userDataBuffer=new b2ParticleSystem_UserOverridableBuffer();/**
                 * Stuck particle detection parameters and record keeping
                 */this.m_stuckThreshold=0;this.m_lastBodyContactStepBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_bodyContactCountBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_consecutiveContactStepsBuffer=new b2ParticleSystem_UserOverridableBuffer();this.m_stuckParticleBuffer=new b2GrowableBuffer(function(){return 0;});this.m_proxyBuffer=new b2GrowableBuffer(function(){return new b2ParticleSystem_Proxy();});this.m_contactBuffer=new b2GrowableBuffer(function(){return new b2ParticleContact();});this.m_bodyContactBuffer=new b2GrowableBuffer(function(){return new b2ParticleBodyContact();});this.m_pairBuffer=new b2GrowableBuffer(function(){return new b2ParticlePair();});this.m_triadBuffer=new b2GrowableBuffer(function(){return new b2ParticleTriad();});/**
                 * Time each particle should be destroyed relative to the last
                 * time this.m_timeElapsed was initialized.  Each unit of time
                 * corresponds to b2ParticleSystemDef::lifetimeGranularity
                 * seconds.
                 */this.m_expirationTimeBuffer=new b2ParticleSystem_UserOverridableBuffer();/**
                 * List of particle indices sorted by expiration time.
                 */this.m_indexByExpirationTimeBuffer=new b2ParticleSystem_UserOverridableBuffer();/**
                 * Time elapsed in 32:32 fixed point.  Each non-fractional unit
                 * of time corresponds to
                 * b2ParticleSystemDef::lifetimeGranularity seconds.
                 */this.m_timeElapsed=0;/**
                 * Whether the expiration time buffer has been modified and
                 * needs to be resorted.
                 */this.m_expirationTimeBufferRequiresSorting=false;this.m_groupCount=0;this.m_groupList=null;this.m_def=new b2ParticleSystemDef();this.m_prev=null;this.m_next=null;this.UpdateBodyContacts_callback=null;this.SolveCollision_callback=null;this.SetStrictContactCheck(def.strictContactCheck);this.SetDensity(def.density);this.SetGravityScale(def.gravityScale);this.SetRadius(def.radius);this.SetMaxParticleCount(def.maxCount);// DEBUG: b2Assert(def.lifetimeGranularity > 0.0);
      this.m_def=def.Clone();this.m_world=world;this.SetDestructionByAge(this.m_def.destroyByAge);}return _createClass(b2ParticleSystem,[{key:"Drop",value:function Drop(){while(this.m_groupList){this.DestroyParticleGroup(this.m_groupList);}this.FreeUserOverridableBuffer(this.m_handleIndexBuffer);this.FreeUserOverridableBuffer(this.m_flagsBuffer);this.FreeUserOverridableBuffer(this.m_lastBodyContactStepBuffer);this.FreeUserOverridableBuffer(this.m_bodyContactCountBuffer);this.FreeUserOverridableBuffer(this.m_consecutiveContactStepsBuffer);this.FreeUserOverridableBuffer(this.m_positionBuffer);this.FreeUserOverridableBuffer(this.m_velocityBuffer);this.FreeUserOverridableBuffer(this.m_colorBuffer);this.FreeUserOverridableBuffer(this.m_userDataBuffer);this.FreeUserOverridableBuffer(this.m_expirationTimeBuffer);this.FreeUserOverridableBuffer(this.m_indexByExpirationTimeBuffer);this.FreeBuffer(this.m_forceBuffer,this.m_internalAllocatedCapacity);this.FreeBuffer(this.m_weightBuffer,this.m_internalAllocatedCapacity);this.FreeBuffer(this.m_staticPressureBuffer,this.m_internalAllocatedCapacity);this.FreeBuffer(this.m_accumulationBuffer,this.m_internalAllocatedCapacity);this.FreeBuffer(this.m_accumulation2Buffer,this.m_internalAllocatedCapacity);this.FreeBuffer(this.m_depthBuffer,this.m_internalAllocatedCapacity);this.FreeBuffer(this.m_groupBuffer,this.m_internalAllocatedCapacity);}/**
             * Create a particle whose properties have been defined.
             *
             * No reference to the definition is retained.
             *
             * A simulation step must occur before it's possible to interact
             * with a newly created particle.  For example,
             * DestroyParticleInShape() will not destroy a particle until
             * b2World::Step() has been called.
             *
             * warning: This function is locked during callbacks.
             */},{key:"CreateParticle",value:function CreateParticle(def){if(this.m_world.IsLocked()){throw new Error();}if(this.m_count>=this.m_internalAllocatedCapacity){// Double the particle capacity.
      var capacity=this.m_count?2*this.m_count:b2_minParticleSystemBufferCapacity;this.ReallocateInternalAllocatedBuffers(capacity);}if(this.m_count>=this.m_internalAllocatedCapacity){// If the oldest particle should be destroyed...
      if(this.m_def.destroyByAge){this.DestroyOldestParticle(0,false);// Need to destroy this particle *now* so that it's possible to
      // create a new particle.
      this.SolveZombie();}else {return b2_invalidParticleIndex;}}var index=this.m_count++;this.m_flagsBuffer.data[index]=0;if(this.m_lastBodyContactStepBuffer.data){this.m_lastBodyContactStepBuffer.data[index]=0;}if(this.m_bodyContactCountBuffer.data){this.m_bodyContactCountBuffer.data[index]=0;}if(this.m_consecutiveContactStepsBuffer.data){this.m_consecutiveContactStepsBuffer.data[index]=0;}this.m_positionBuffer.data[index]=(this.m_positionBuffer.data[index]||new b2Vec2()).Copy(b2Maybe(def.position,b2Vec2.ZERO));this.m_velocityBuffer.data[index]=(this.m_velocityBuffer.data[index]||new b2Vec2()).Copy(b2Maybe(def.velocity,b2Vec2.ZERO));this.m_weightBuffer[index]=0;this.m_forceBuffer[index]=(this.m_forceBuffer[index]||new b2Vec2()).SetZero();if(this.m_staticPressureBuffer){this.m_staticPressureBuffer[index]=0;}if(this.m_depthBuffer){this.m_depthBuffer[index]=0;}var color=new b2Color().Copy(b2Maybe(def.color,b2Color.ZERO));if(this.m_colorBuffer.data||!color.IsZero()){this.m_colorBuffer.data=this.RequestBuffer(this.m_colorBuffer.data);this.m_colorBuffer.data[index]=(this.m_colorBuffer.data[index]||new b2Color()).Copy(color);}if(this.m_userDataBuffer.data||def.userData){this.m_userDataBuffer.data=this.RequestBuffer(this.m_userDataBuffer.data);this.m_userDataBuffer.data[index]=def.userData;}if(this.m_handleIndexBuffer.data){this.m_handleIndexBuffer.data[index]=null;}///Proxy& proxy = m_proxyBuffer.Append();
      var proxy=this.m_proxyBuffer.data[this.m_proxyBuffer.Append()];// If particle lifetimes are enabled or the lifetime is set in the particle
      // definition, initialize the lifetime.
      var lifetime=b2Maybe(def.lifetime,0.0);var finiteLifetime=lifetime>0.0;if(this.m_expirationTimeBuffer.data||finiteLifetime){this.SetParticleLifetime(index,finiteLifetime?lifetime:this.ExpirationTimeToLifetime(-this.GetQuantizedTimeElapsed()));// Add a reference to the newly added particle to the end of the
      // queue.
      this.m_indexByExpirationTimeBuffer.data[index]=index;}proxy.index=index;var group=b2Maybe(def.group,null);this.m_groupBuffer[index]=group;if(group){if(group.m_firstIndex<group.m_lastIndex){// Move particles in the group just before the new particle.
      this.RotateBuffer(group.m_firstIndex,group.m_lastIndex,index);// DEBUG: b2Assert(group.m_lastIndex === index);
      // Update the index range of the group to contain the new particle.
      group.m_lastIndex=index+1;}else {// If the group is empty, reset the index range to contain only the
      // new particle.
      group.m_firstIndex=index;group.m_lastIndex=index+1;}}this.SetParticleFlags(index,b2Maybe(def.flags,0));return index;}/**
             * Retrieve a handle to the particle at the specified index.
             *
             * Please see #b2ParticleHandle for why you might want a handle.
             */},{key:"GetParticleHandleFromIndex",value:function GetParticleHandleFromIndex(index){// DEBUG: b2Assert(index >= 0 && index < this.GetParticleCount() && index !== b2_invalidParticleIndex);
      this.m_handleIndexBuffer.data=this.RequestBuffer(this.m_handleIndexBuffer.data);var handle=this.m_handleIndexBuffer.data[index];if(handle){return handle;}// Create a handle.
      ///handle = m_handleAllocator.Allocate();
      handle=new b2ParticleHandle();// DEBUG: b2Assert(handle !== null);
      handle.SetIndex(index);this.m_handleIndexBuffer.data[index]=handle;return handle;}/**
             * Destroy a particle.
             *
             * The particle is removed after the next simulation step (see
             * b2World::Step()).
             *
             * @param index Index of the particle to destroy.
             * @param callDestructionListener Whether to call the
             *      destruction listener just before the particle is
             *      destroyed.
             */},{key:"DestroyParticle",value:function DestroyParticle(index){var callDestructionListener=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;var flags=exports.b2ParticleFlag.b2_zombieParticle;if(callDestructionListener){flags|=exports.b2ParticleFlag.b2_destructionListenerParticle;}this.SetParticleFlags(index,this.m_flagsBuffer.data[index]|flags);}/**
             * Destroy the Nth oldest particle in the system.
             *
             * The particle is removed after the next b2World::Step().
             *
             * @param index Index of the Nth oldest particle to
             *      destroy, 0 will destroy the oldest particle in the
             *      system, 1 will destroy the next oldest particle etc.
             * @param callDestructionListener Whether to call the
             *      destruction listener just before the particle is
             *      destroyed.
             */},{key:"DestroyOldestParticle",value:function DestroyOldestParticle(index){var callDestructionListener=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;var particleCount=this.GetParticleCount();// DEBUG: b2Assert(index >= 0 && index < particleCount);
      // Make sure particle lifetime tracking is enabled.
      // DEBUG: b2Assert(this.m_indexByExpirationTimeBuffer.data !== null);
      // Destroy the oldest particle (preferring to destroy finite
      // lifetime particles first) to free a slot in the buffer.
      var oldestFiniteLifetimeParticle=this.m_indexByExpirationTimeBuffer.data[particleCount-(index+1)];var oldestInfiniteLifetimeParticle=this.m_indexByExpirationTimeBuffer.data[index];this.DestroyParticle(this.m_expirationTimeBuffer.data[oldestFiniteLifetimeParticle]>0.0?oldestFiniteLifetimeParticle:oldestInfiniteLifetimeParticle,callDestructionListener);}/**
             * Destroy particles inside a shape.
             *
             * warning: This function is locked during callbacks.
             *
             * In addition, this function immediately destroys particles in
             * the shape in constrast to DestroyParticle() which defers the
             * destruction until the next simulation step.
             *
             * @return Number of particles destroyed.
             * @param shape Shape which encloses particles
             *      that should be destroyed.
             * @param xf Transform applied to the shape.
             * @param callDestructionListener Whether to call the
             *      world b2DestructionListener for each particle
             *      destroyed.
             */},{key:"DestroyParticlesInShape",value:function DestroyParticlesInShape(shape,xf){var callDestructionListener=arguments.length>2&&arguments[2]!==undefined?arguments[2]:false;var s_aabb=b2ParticleSystem.DestroyParticlesInShape_s_aabb;if(this.m_world.IsLocked()){throw new Error();}var callback=new b2ParticleSystem_DestroyParticlesInShapeCallback(this,shape,xf,callDestructionListener);var aabb=s_aabb;shape.ComputeAABB(aabb,xf,0);this.m_world.QueryAABB(callback,aabb);return callback.Destroyed();}/**
             * Create a particle group whose properties have been defined.
             *
             * No reference to the definition is retained.
             *
             * warning: This function is locked during callbacks.
             */},{key:"CreateParticleGroup",value:function CreateParticleGroup(groupDef){var s_transform=b2ParticleSystem.CreateParticleGroup_s_transform;if(this.m_world.IsLocked()){throw new Error();}var transform=s_transform;transform.SetPositionAngle(b2Maybe(groupDef.position,b2Vec2.ZERO),b2Maybe(groupDef.angle,0));var firstIndex=this.m_count;if(groupDef.shape){this.CreateParticlesWithShapeForGroup(groupDef.shape,groupDef,transform);}if(groupDef.shapes){this.CreateParticlesWithShapesForGroup(groupDef.shapes,b2Maybe(groupDef.shapeCount,groupDef.shapes.length),groupDef,transform);}if(groupDef.positionData){var count=b2Maybe(groupDef.particleCount,groupDef.positionData.length);for(var i=0;i<count;i++){var p=groupDef.positionData[i];this.CreateParticleForGroup(groupDef,transform,p);}}var lastIndex=this.m_count;var group=new b2ParticleGroup(this);group.m_firstIndex=firstIndex;group.m_lastIndex=lastIndex;group.m_strength=b2Maybe(groupDef.strength,1);group.m_userData=groupDef.userData;group.m_transform.Copy(transform);group.m_prev=null;group.m_next=this.m_groupList;if(this.m_groupList){this.m_groupList.m_prev=group;}this.m_groupList=group;++this.m_groupCount;for(var _i27=firstIndex;_i27<lastIndex;_i27++){this.m_groupBuffer[_i27]=group;}this.SetGroupFlags(group,b2Maybe(groupDef.groupFlags,0));// Create pairs and triads between particles in the group.
      var filter=new b2ParticleSystem_ConnectionFilter();this.UpdateContacts(true);this.UpdatePairsAndTriads(firstIndex,lastIndex,filter);if(groupDef.group){this.JoinParticleGroups(groupDef.group,group);group=groupDef.group;}return group;}/**
             * Join two particle groups.
             *
             * warning: This function is locked during callbacks.
             *
             * @param groupA the first group. Expands to encompass the second group.
             * @param groupB the second group. It is destroyed.
             */},{key:"JoinParticleGroups",value:function JoinParticleGroups(groupA,groupB){if(this.m_world.IsLocked()){throw new Error();}// DEBUG: b2Assert(groupA !== groupB);
      this.RotateBuffer(groupB.m_firstIndex,groupB.m_lastIndex,this.m_count);// DEBUG: b2Assert(groupB.m_lastIndex === this.m_count);
      this.RotateBuffer(groupA.m_firstIndex,groupA.m_lastIndex,groupB.m_firstIndex);// DEBUG: b2Assert(groupA.m_lastIndex === groupB.m_firstIndex);
      // Create pairs and triads connecting groupA and groupB.
      var filter=new b2ParticleSystem_JoinParticleGroupsFilter(groupB.m_firstIndex);this.UpdateContacts(true);this.UpdatePairsAndTriads(groupA.m_firstIndex,groupB.m_lastIndex,filter);for(var i=groupB.m_firstIndex;i<groupB.m_lastIndex;i++){this.m_groupBuffer[i]=groupA;}var groupFlags=groupA.m_groupFlags|groupB.m_groupFlags;this.SetGroupFlags(groupA,groupFlags);groupA.m_lastIndex=groupB.m_lastIndex;groupB.m_firstIndex=groupB.m_lastIndex;this.DestroyParticleGroup(groupB);}/**
             * Split particle group into multiple disconnected groups.
             *
             * warning: This function is locked during callbacks.
             *
             * @param group the group to be split.
             */},{key:"SplitParticleGroup",value:function SplitParticleGroup(group){this.UpdateContacts(true);var particleCount=group.GetParticleCount();// We create several linked lists. Each list represents a set of connected particles.
      var nodeBuffer=b2MakeArray(particleCount,function(index){return new b2ParticleSystem_ParticleListNode();});b2ParticleSystem.InitializeParticleLists(group,nodeBuffer);this.MergeParticleListsInContact(group,nodeBuffer);var survivingList=b2ParticleSystem.FindLongestParticleList(group,nodeBuffer);this.MergeZombieParticleListNodes(group,nodeBuffer,survivingList);this.CreateParticleGroupsFromParticleList(group,nodeBuffer,survivingList);this.UpdatePairsAndTriadsWithParticleList(group,nodeBuffer);}/**
             * Get the world particle group list. With the returned group,
             * use b2ParticleGroup::GetNext to get the next group in the
             * world list.
             *
             * A null group indicates the end of the list.
             *
             * @return the head of the world particle group list.
             */},{key:"GetParticleGroupList",value:function GetParticleGroupList(){return this.m_groupList;}/**
             * Get the number of particle groups.
             */},{key:"GetParticleGroupCount",value:function GetParticleGroupCount(){return this.m_groupCount;}/**
             * Get the number of particles.
             */},{key:"GetParticleCount",value:function GetParticleCount(){return this.m_count;}/**
             * Get the maximum number of particles.
             */},{key:"GetMaxParticleCount",value:function GetMaxParticleCount(){return this.m_def.maxCount;}/**
             * Set the maximum number of particles.
             *
             * A value of 0 means there is no maximum. The particle buffers
             * can continue to grow while b2World's block allocator still
             * has memory.
             *
             * Note: If you try to CreateParticle() with more than this
             * count, b2_invalidParticleIndex is returned unless
             * SetDestructionByAge() is used to enable the destruction of
             * the oldest particles in the system.
             */},{key:"SetMaxParticleCount",value:function SetMaxParticleCount(count){// DEBUG: b2Assert(this.m_count <= count);
      this.m_def.maxCount=count;}/**
             * Get all existing particle flags.
             */},{key:"GetAllParticleFlags",value:function GetAllParticleFlags(){return this.m_allParticleFlags;}/**
             * Get all existing particle group flags.
             */},{key:"GetAllGroupFlags",value:function GetAllGroupFlags(){return this.m_allGroupFlags;}/**
             * Pause or unpause the particle system. When paused,
             * b2World::Step() skips over this particle system. All
             * b2ParticleSystem function calls still work.
             *
             * @param paused paused is true to pause, false to un-pause.
             */},{key:"SetPaused",value:function SetPaused(paused){this.m_paused=paused;}/**
             * Initially, true, then, the last value passed into
             * SetPaused().
             *
             * @return true if the particle system is being updated in b2World::Step().
             */},{key:"GetPaused",value:function GetPaused(){return this.m_paused;}/**
             * Change the particle density.
             *
             * Particle density affects the mass of the particles, which in
             * turn affects how the particles interact with b2Bodies. Note
             * that the density does not affect how the particles interact
             * with each other.
             */},{key:"SetDensity",value:function SetDensity(density){this.m_def.density=density;this.m_inverseDensity=1/this.m_def.density;}/**
             * Get the particle density.
             */},{key:"GetDensity",value:function GetDensity(){return this.m_def.density;}/**
             * Change the particle gravity scale. Adjusts the effect of the
             * global gravity vector on particles.
             */},{key:"SetGravityScale",value:function SetGravityScale(gravityScale){this.m_def.gravityScale=gravityScale;}/**
             * Get the particle gravity scale.
             */},{key:"GetGravityScale",value:function GetGravityScale(){return this.m_def.gravityScale;}/**
             * Damping is used to reduce the velocity of particles. The
             * damping parameter can be larger than 1.0f but the damping
             * effect becomes sensitive to the time step when the damping
             * parameter is large.
             */},{key:"SetDamping",value:function SetDamping(damping){this.m_def.dampingStrength=damping;}/**
             * Get damping for particles
             */},{key:"GetDamping",value:function GetDamping(){return this.m_def.dampingStrength;}/**
             * Change the number of iterations when calculating the static
             * pressure of particles. By default, 8 iterations. You can
             * reduce the number of iterations down to 1 in some situations,
             * but this may cause instabilities when many particles come
             * together. If you see particles popping away from each other
             * like popcorn, you may have to increase the number of
             * iterations.
             *
             * For a description of static pressure, see
             * http://en.wikipedia.org/wiki/Static_pressure#Static_pressure_in_fluid_dynamics
             */},{key:"SetStaticPressureIterations",value:function SetStaticPressureIterations(iterations){this.m_def.staticPressureIterations=iterations;}/**
             * Get the number of iterations for static pressure of
             * particles.
             */},{key:"GetStaticPressureIterations",value:function GetStaticPressureIterations(){return this.m_def.staticPressureIterations;}/**
             * Change the particle radius.
             *
             * You should set this only once, on world start.
             * If you change the radius during execution, existing particles
             * may explode, shrink, or behave unexpectedly.
             */},{key:"SetRadius",value:function SetRadius(radius){this.m_particleDiameter=2*radius;this.m_squaredDiameter=this.m_particleDiameter*this.m_particleDiameter;this.m_inverseDiameter=1/this.m_particleDiameter;}/**
             * Get the particle radius.
             */},{key:"GetRadius",value:function GetRadius(){return this.m_particleDiameter/2;}/**
             * Get the position of each particle
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle positions array.
             */},{key:"GetPositionBuffer",value:function GetPositionBuffer(){return this.m_positionBuffer.data;}/**
             * Get the velocity of each particle
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle velocities array.
             */},{key:"GetVelocityBuffer",value:function GetVelocityBuffer(){return this.m_velocityBuffer.data;}/**
             * Get the color of each particle
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle colors array.
             */},{key:"GetColorBuffer",value:function GetColorBuffer(){this.m_colorBuffer.data=this.RequestBuffer(this.m_colorBuffer.data);return this.m_colorBuffer.data;}/**
             * Get the particle-group of each particle.
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle group array.
             */},{key:"GetGroupBuffer",value:function GetGroupBuffer(){return this.m_groupBuffer;}/**
             * Get the weight of each particle
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle positions array.
             */},{key:"GetWeightBuffer",value:function GetWeightBuffer(){return this.m_weightBuffer;}/**
             * Get the user-specified data of each particle.
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle user-data array.
             */},{key:"GetUserDataBuffer",value:function GetUserDataBuffer(){this.m_userDataBuffer.data=this.RequestBuffer(this.m_userDataBuffer.data);return this.m_userDataBuffer.data;}/**
             * Get the flags for each particle. See the b2ParticleFlag enum.
             *
             * Array is length GetParticleCount()
             *
             * @return the pointer to the head of the particle-flags array.
             */},{key:"GetFlagsBuffer",value:function GetFlagsBuffer(){return this.m_flagsBuffer.data;}/**
             * Set flags for a particle. See the b2ParticleFlag enum.
             */},{key:"SetParticleFlags",value:function SetParticleFlags(index,newFlags){var oldFlags=this.m_flagsBuffer.data[index];if(oldFlags&~newFlags){// If any flags might be removed
      this.m_needsUpdateAllParticleFlags=true;}if(~this.m_allParticleFlags&newFlags){// If any flags were added
      if(newFlags&exports.b2ParticleFlag.b2_tensileParticle){this.m_accumulation2Buffer=this.RequestBuffer(this.m_accumulation2Buffer);}if(newFlags&exports.b2ParticleFlag.b2_colorMixingParticle){this.m_colorBuffer.data=this.RequestBuffer(this.m_colorBuffer.data);}this.m_allParticleFlags|=newFlags;}this.m_flagsBuffer.data[index]=newFlags;}/**
             * Get flags for a particle. See the b2ParticleFlag enum.
             */},{key:"GetParticleFlags",value:function GetParticleFlags(index){return this.m_flagsBuffer.data[index];}/**
             * Set an external buffer for particle data.
             *
             * Normally, the b2World's block allocator is used for particle
             * data. However, sometimes you may have an OpenGL or Java
             * buffer for particle data. To avoid data duplication, you may
             * supply this external buffer.
             *
             * Note that, when b2World's block allocator is used, the
             * particle data buffers can grow as required. However, when
             * external buffers are used, the maximum number of particles is
             * clamped to the size of the smallest external buffer.
             *
             * @param buffer a pointer to a block of memory.
             * @param capacity the number of values in the block.
             */},{key:"SetFlagsBuffer",value:function SetFlagsBuffer(buffer){this.SetUserOverridableBuffer(this.m_flagsBuffer,buffer);}},{key:"SetPositionBuffer",value:function SetPositionBuffer(buffer){if(buffer instanceof Float32Array){if(buffer.length%2!==0){throw new Error();}var count=buffer.length/2;var array=new Array(count);for(var i=0;i<count;++i){array[i]=new b2Vec2(buffer.subarray(i*2,i*2+2));}buffer=array;}this.SetUserOverridableBuffer(this.m_positionBuffer,buffer);}},{key:"SetVelocityBuffer",value:function SetVelocityBuffer(buffer){if(buffer instanceof Float32Array){if(buffer.length%2!==0){throw new Error();}var count=buffer.length/2;var array=new Array(count);for(var i=0;i<count;++i){array[i]=new b2Vec2(buffer.subarray(i*2,i*2+2));}buffer=array;}this.SetUserOverridableBuffer(this.m_velocityBuffer,buffer);}},{key:"SetColorBuffer",value:function SetColorBuffer(buffer){if(buffer instanceof Float32Array){if(buffer.length%4!==0){throw new Error();}var count=buffer.length/4;var array=new Array(count);for(var i=0;i<count;++i){array[i]=new b2Color(buffer.subarray(i*4,i*4+4));}buffer=array;}this.SetUserOverridableBuffer(this.m_colorBuffer,buffer);}},{key:"SetUserDataBuffer",value:function SetUserDataBuffer(buffer){this.SetUserOverridableBuffer(this.m_userDataBuffer,buffer);}/**
             * Get contacts between particles
             * Contact data can be used for many reasons, for example to
             * trigger rendering or audio effects.
             */},{key:"GetContacts",value:function GetContacts(){return this.m_contactBuffer.data;}},{key:"GetContactCount",value:function GetContactCount(){return this.m_contactBuffer.count;}/**
             * Get contacts between particles and bodies
             *
             * Contact data can be used for many reasons, for example to
             * trigger rendering or audio effects.
             */},{key:"GetBodyContacts",value:function GetBodyContacts(){return this.m_bodyContactBuffer.data;}},{key:"GetBodyContactCount",value:function GetBodyContactCount(){return this.m_bodyContactBuffer.count;}/**
             * Get array of particle pairs. The particles in a pair:
             *   (1) are contacting,
             *   (2) are in the same particle group,
             *   (3) are part of a rigid particle group, or are spring, elastic,
             *       or wall particles.
             *   (4) have at least one particle that is a spring or barrier
             *       particle (i.e. one of the types in k_pairFlags),
             *   (5) have at least one particle that returns true for
             *       ConnectionFilter::IsNecessary,
             *   (6) are not zombie particles.
             *
             * Essentially, this is an array of spring or barrier particles
             * that are interacting. The array is sorted by b2ParticlePair's
             * indexA, and then indexB. There are no duplicate entries.
             */},{key:"GetPairs",value:function GetPairs(){return this.m_pairBuffer.data;}},{key:"GetPairCount",value:function GetPairCount(){return this.m_pairBuffer.count;}/**
             * Get array of particle triads. The particles in a triad:
             *   (1) are in the same particle group,
             *   (2) are in a Voronoi triangle together,
             *   (3) are within b2_maxTriadDistance particle diameters of each
             *       other,
             *   (4) return true for ConnectionFilter::ShouldCreateTriad
             *   (5) have at least one particle of type elastic (i.e. one of the
             *       types in k_triadFlags),
             *   (6) are part of a rigid particle group, or are spring, elastic,
             *       or wall particles.
             *   (7) are not zombie particles.
             *
             * Essentially, this is an array of elastic particles that are
             * interacting. The array is sorted by b2ParticleTriad's indexA,
             * then indexB, then indexC. There are no duplicate entries.
             */},{key:"GetTriads",value:function GetTriads(){return this.m_triadBuffer.data;}},{key:"GetTriadCount",value:function GetTriadCount(){return this.m_triadBuffer.count;}/**
             * Set an optional threshold for the maximum number of
             * consecutive particle iterations that a particle may contact
             * multiple bodies before it is considered a candidate for being
             * "stuck". Setting to zero or less disables.
             */},{key:"SetStuckThreshold",value:function SetStuckThreshold(steps){this.m_stuckThreshold=steps;if(steps>0){this.m_lastBodyContactStepBuffer.data=this.RequestBuffer(this.m_lastBodyContactStepBuffer.data);this.m_bodyContactCountBuffer.data=this.RequestBuffer(this.m_bodyContactCountBuffer.data);this.m_consecutiveContactStepsBuffer.data=this.RequestBuffer(this.m_consecutiveContactStepsBuffer.data);}}/**
             * Get potentially stuck particles from the last step; the user
             * must decide if they are stuck or not, and if so, delete or
             * move them
             */},{key:"GetStuckCandidates",value:function GetStuckCandidates(){///return m_stuckParticleBuffer.Data();
      return this.m_stuckParticleBuffer.Data();}/**
             * Get the number of stuck particle candidates from the last
             * step.
             */},{key:"GetStuckCandidateCount",value:function GetStuckCandidateCount(){///return m_stuckParticleBuffer.GetCount();
      return this.m_stuckParticleBuffer.GetCount();}/**
             * Compute the kinetic energy that can be lost by damping force
             */},{key:"ComputeCollisionEnergy",value:function ComputeCollisionEnergy(){var s_v=b2ParticleSystem.ComputeCollisionEnergy_s_v;var vel_data=this.m_velocityBuffer.data;var sum_v2=0;for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];var a=contact.indexA;var b=contact.indexB;var n=contact.normal;///b2Vec2 v = m_velocityBuffer.data[b] - m_velocityBuffer.data[a];
      var v=b2Vec2.SubVV(vel_data[b],vel_data[a],s_v);var vn=b2Vec2.DotVV(v,n);if(vn<0){sum_v2+=vn*vn;}}return 0.5*this.GetParticleMass()*sum_v2;}/**
             * Set strict Particle/Body contact check.
             *
             * This is an option that will help ensure correct behavior if
             * there are corners in the world model where Particle/Body
             * contact is ambiguous. This option scales at n*log(n) of the
             * number of Particle/Body contacts, so it is best to only
             * enable if it is necessary for your geometry. Enable if you
             * see strange particle behavior around b2Body intersections.
             */},{key:"SetStrictContactCheck",value:function SetStrictContactCheck(enabled){this.m_def.strictContactCheck=enabled;}/**
             * Get the status of the strict contact check.
             */},{key:"GetStrictContactCheck",value:function GetStrictContactCheck(){return this.m_def.strictContactCheck;}/**
             * Set the lifetime (in seconds) of a particle relative to the
             * current time.  A lifetime of less than or equal to 0.0f
             * results in the particle living forever until it's manually
             * destroyed by the application.
             */},{key:"SetParticleLifetime",value:function SetParticleLifetime(index,lifetime){// DEBUG: b2Assert(this.ValidateParticleIndex(index));
      var initializeExpirationTimes=this.m_indexByExpirationTimeBuffer.data===null;this.m_expirationTimeBuffer.data=this.RequestBuffer(this.m_expirationTimeBuffer.data);this.m_indexByExpirationTimeBuffer.data=this.RequestBuffer(this.m_indexByExpirationTimeBuffer.data);// Initialize the inverse mapping buffer.
      if(initializeExpirationTimes){var particleCount=this.GetParticleCount();for(var i=0;i<particleCount;++i){this.m_indexByExpirationTimeBuffer.data[i]=i;}}///const int32 quantizedLifetime = (int32)(lifetime / m_def.lifetimeGranularity);
      var quantizedLifetime=lifetime/this.m_def.lifetimeGranularity;// Use a negative lifetime so that it's possible to track which
      // of the infinite lifetime particles are older.
      var newExpirationTime=quantizedLifetime>0.0?this.GetQuantizedTimeElapsed()+quantizedLifetime:quantizedLifetime;if(newExpirationTime!==this.m_expirationTimeBuffer.data[index]){this.m_expirationTimeBuffer.data[index]=newExpirationTime;this.m_expirationTimeBufferRequiresSorting=true;}}/**
             * Get the lifetime (in seconds) of a particle relative to the
             * current time.  A value > 0.0f is returned if the particle is
             * scheduled to be destroyed in the future, values <= 0.0f
             * indicate the particle has an infinite lifetime.
             */},{key:"GetParticleLifetime",value:function GetParticleLifetime(index){// DEBUG: b2Assert(this.ValidateParticleIndex(index));
      return this.ExpirationTimeToLifetime(this.GetExpirationTimeBuffer()[index]);}/**
             * Enable / disable destruction of particles in CreateParticle()
             * when no more particles can be created due to a prior call to
             * SetMaxParticleCount().  When this is enabled, the oldest
             * particle is destroyed in CreateParticle() favoring the
             * destruction of particles with a finite lifetime over
             * particles with infinite lifetimes. This feature is enabled by
             * default when particle lifetimes are tracked.  Explicitly
             * enabling this feature using this function enables particle
             * lifetime tracking.
             */},{key:"SetDestructionByAge",value:function SetDestructionByAge(enable){if(enable){this.GetExpirationTimeBuffer();}this.m_def.destroyByAge=enable;}/**
             * Get whether the oldest particle will be destroyed in
             * CreateParticle() when the maximum number of particles are
             * present in the system.
             */},{key:"GetDestructionByAge",value:function GetDestructionByAge(){return this.m_def.destroyByAge;}/**
             * Get the array of particle expiration times indexed by
             * particle index.
             *
             * GetParticleCount() items are in the returned array.
             */},{key:"GetExpirationTimeBuffer",value:function GetExpirationTimeBuffer(){this.m_expirationTimeBuffer.data=this.RequestBuffer(this.m_expirationTimeBuffer.data);return this.m_expirationTimeBuffer.data;}/**
             * Convert a expiration time value in returned by
             * GetExpirationTimeBuffer() to a time in seconds relative to
             * the current simulation time.
             */},{key:"ExpirationTimeToLifetime",value:function ExpirationTimeToLifetime(expirationTime){return (expirationTime>0?expirationTime-this.GetQuantizedTimeElapsed():expirationTime)*this.m_def.lifetimeGranularity;}/**
             * Get the array of particle indices ordered by reverse
             * lifetime. The oldest particle indexes are at the end of the
             * array with the newest at the start.  Particles with infinite
             * lifetimes (i.e expiration times less than or equal to 0) are
             * placed at the start of the array.
             * ExpirationTimeToLifetime(GetExpirationTimeBuffer()[index]) is
             * equivalent to GetParticleLifetime(index).
             *
             * GetParticleCount() items are in the returned array.
             */},{key:"GetIndexByExpirationTimeBuffer",value:function GetIndexByExpirationTimeBuffer(){// If particles are present, initialize / reinitialize the lifetime buffer.
      if(this.GetParticleCount()){this.SetParticleLifetime(0,this.GetParticleLifetime(0));}else {this.m_indexByExpirationTimeBuffer.data=this.RequestBuffer(this.m_indexByExpirationTimeBuffer.data);}return this.m_indexByExpirationTimeBuffer.data;}/**
             * Apply an impulse to one particle. This immediately modifies
             * the velocity. Similar to b2Body::ApplyLinearImpulse.
             *
             * @param index the particle that will be modified.
             * @param impulse impulse the world impulse vector, usually in N-seconds or kg-m/s.
             */},{key:"ParticleApplyLinearImpulse",value:function ParticleApplyLinearImpulse(index,impulse){this.ApplyLinearImpulse(index,index+1,impulse);}/**
             * Apply an impulse to all particles between 'firstIndex' and
             * 'lastIndex'. This immediately modifies the velocity. Note
             * that the impulse is applied to the total mass of all
             * particles. So, calling ParticleApplyLinearImpulse(0, impulse)
             * and ParticleApplyLinearImpulse(1, impulse) will impart twice
             * as much velocity as calling just ApplyLinearImpulse(0, 1,
             * impulse).
             *
             * @param firstIndex the first particle to be modified.
             * @param lastIndex the last particle to be modified.
             * @param impulse the world impulse vector, usually in N-seconds or kg-m/s.
             */},{key:"ApplyLinearImpulse",value:function ApplyLinearImpulse(firstIndex,lastIndex,impulse){var vel_data=this.m_velocityBuffer.data;var numParticles=lastIndex-firstIndex;var totalMass=numParticles*this.GetParticleMass();///const b2Vec2 velocityDelta = impulse / totalMass;
      var velocityDelta=new b2Vec2().Copy(impulse).SelfMul(1/totalMass);for(var i=firstIndex;i<lastIndex;i++){///m_velocityBuffer.data[i] += velocityDelta;
      vel_data[i].SelfAdd(velocityDelta);}}},{key:"ParticleApplyForce",value:/**
             * Apply a force to the center of a particle.
             *
             * @param index the particle that will be modified.
             * @param force the world force vector, usually in Newtons (N).
             */function ParticleApplyForce(index,force){if(b2ParticleSystem.IsSignificantForce(force)&&this.ForceCanBeApplied(this.m_flagsBuffer.data[index])){this.PrepareForceBuffer();///m_forceBuffer[index] += force;
      this.m_forceBuffer[index].SelfAdd(force);}}/**
             * Distribute a force across several particles. The particles
             * must not be wall particles. Note that the force is
             * distributed across all the particles, so calling this
             * function for indices 0..N is not the same as calling
             * ParticleApplyForce(i, force) for i in 0..N.
             *
             * @param firstIndex the first particle to be modified.
             * @param lastIndex the last particle to be modified.
             * @param force the world force vector, usually in Newtons (N).
             */},{key:"ApplyForce",value:function ApplyForce(firstIndex,lastIndex,force){// Ensure we're not trying to apply force to particles that can't move,
      // such as wall particles.
      // DEBUG: let flags = 0;
      // DEBUG: for (let i = firstIndex; i < lastIndex; i++) {
      // DEBUG:   flags |= this.m_flagsBuffer.data[i];
      // DEBUG: }
      // DEBUG: b2Assert(this.ForceCanBeApplied(flags));
      // Early out if force does nothing (optimization).
      ///const b2Vec2 distributedForce = force / (float32)(lastIndex - firstIndex);
      var distributedForce=new b2Vec2().Copy(force).SelfMul(1/(lastIndex-firstIndex));if(b2ParticleSystem.IsSignificantForce(distributedForce)){this.PrepareForceBuffer();// Distribute the force over all the particles.
      for(var i=firstIndex;i<lastIndex;i++){///m_forceBuffer[i] += distributedForce;
      this.m_forceBuffer[i].SelfAdd(distributedForce);}}}/**
             * Get the next particle-system in the world's particle-system
             * list.
             */},{key:"GetNext",value:function GetNext(){return this.m_next;}/**
             * Query the particle system for all particles that potentially
             * overlap the provided AABB.
             * b2QueryCallback::ShouldQueryParticleSystem is ignored.
             *
             * @param callback a user implemented callback class.
             * @param aabb the query box.
             */},{key:"QueryAABB",value:function QueryAABB(callback,aabb){if(this.m_proxyBuffer.count===0){return;}var beginProxy=0;var endProxy=this.m_proxyBuffer.count;var firstProxy=std_lower_bound(this.m_proxyBuffer.data,beginProxy,endProxy,b2ParticleSystem.computeTag(this.m_inverseDiameter*aabb.lowerBound.x,this.m_inverseDiameter*aabb.lowerBound.y),b2ParticleSystem_Proxy.CompareProxyTag);var lastProxy=std_upper_bound(this.m_proxyBuffer.data,firstProxy,endProxy,b2ParticleSystem.computeTag(this.m_inverseDiameter*aabb.upperBound.x,this.m_inverseDiameter*aabb.upperBound.y),b2ParticleSystem_Proxy.CompareTagProxy);var pos_data=this.m_positionBuffer.data;for(var k=firstProxy;k<lastProxy;++k){var proxy=this.m_proxyBuffer.data[k];var i=proxy.index;var p=pos_data[i];if(aabb.lowerBound.x<p.x&&p.x<aabb.upperBound.x&&aabb.lowerBound.y<p.y&&p.y<aabb.upperBound.y){if(!callback.ReportParticle(this,i)){break;}}}}/**
             * Query the particle system for all particles that potentially
             * overlap the provided shape's AABB. Calls QueryAABB
             * internally. b2QueryCallback::ShouldQueryParticleSystem is
             * ignored.
             *
             * @param callback a user implemented callback class.
             * @param shape the query shape
             * @param xf the transform of the AABB
             * @param childIndex
             */},{key:"QueryShapeAABB",value:function QueryShapeAABB(callback,shape,xf){var childIndex=arguments.length>3&&arguments[3]!==undefined?arguments[3]:0;var s_aabb=b2ParticleSystem.QueryShapeAABB_s_aabb;var aabb=s_aabb;shape.ComputeAABB(aabb,xf,childIndex);this.QueryAABB(callback,aabb);}},{key:"QueryPointAABB",value:function QueryPointAABB(callback,point){var slop=arguments.length>2&&arguments[2]!==undefined?arguments[2]:b2_linearSlop;var s_aabb=b2ParticleSystem.QueryPointAABB_s_aabb;var aabb=s_aabb;aabb.lowerBound.Set(point.x-slop,point.y-slop);aabb.upperBound.Set(point.x+slop,point.y+slop);this.QueryAABB(callback,aabb);}/**
             * Ray-cast the particle system for all particles in the path of
             * the ray. Your callback controls whether you get the closest
             * point, any point, or n-points. The ray-cast ignores particles
             * that contain the starting point.
             * b2RayCastCallback::ShouldQueryParticleSystem is ignored.
             *
             * @param callback a user implemented callback class.
             * @param point1 the ray starting point
             * @param point2 the ray ending point
             */},{key:"RayCast",value:function RayCast(callback,point1,point2){var s_aabb=b2ParticleSystem.RayCast_s_aabb;var s_p=b2ParticleSystem.RayCast_s_p;var s_v=b2ParticleSystem.RayCast_s_v;var s_n=b2ParticleSystem.RayCast_s_n;var s_point=b2ParticleSystem.RayCast_s_point;if(this.m_proxyBuffer.count===0){return;}var pos_data=this.m_positionBuffer.data;var aabb=s_aabb;b2Vec2.MinV(point1,point2,aabb.lowerBound);b2Vec2.MaxV(point1,point2,aabb.upperBound);var fraction=1;// solving the following equation:
      // ((1-t)*point1+t*point2-position)^2=diameter^2
      // where t is a potential fraction
      ///b2Vec2 v = point2 - point1;
      var v=b2Vec2.SubVV(point2,point1,s_v);var v2=b2Vec2.DotVV(v,v);var enumerator=this.GetInsideBoundsEnumerator(aabb);var i;while((i=enumerator.GetNext())>=0){///b2Vec2 p = point1 - m_positionBuffer.data[i];
      var p=b2Vec2.SubVV(point1,pos_data[i],s_p);var pv=b2Vec2.DotVV(p,v);var p2=b2Vec2.DotVV(p,p);var determinant=pv*pv-v2*(p2-this.m_squaredDiameter);if(determinant>=0){var sqrtDeterminant=b2Sqrt(determinant);// find a solution between 0 and fraction
      var t=(-pv-sqrtDeterminant)/v2;if(t>fraction){continue;}if(t<0){t=(-pv+sqrtDeterminant)/v2;if(t<0||t>fraction){continue;}}///b2Vec2 n = p + t * v;
      var n=b2Vec2.AddVMulSV(p,t,v,s_n);n.Normalize();///float32 f = callback.ReportParticle(this, i, point1 + t * v, n, t);
      var f=callback.ReportParticle(this,i,b2Vec2.AddVMulSV(point1,t,v,s_point),n,t);fraction=b2Min(fraction,f);if(fraction<=0){break;}}}}/**
             * Compute the axis-aligned bounding box for all particles
             * contained within this particle system.
             * @param aabb Returns the axis-aligned bounding box of the system.
             */},{key:"ComputeAABB",value:function ComputeAABB(aabb){var particleCount=this.GetParticleCount();// DEBUG: b2Assert(aabb !== null);
      aabb.lowerBound.x=+b2_maxFloat;aabb.lowerBound.y=+b2_maxFloat;aabb.upperBound.x=-b2_maxFloat;aabb.upperBound.y=-b2_maxFloat;var pos_data=this.m_positionBuffer.data;for(var i=0;i<particleCount;i++){var p=pos_data[i];b2Vec2.MinV(aabb.lowerBound,p,aabb.lowerBound);b2Vec2.MaxV(aabb.upperBound,p,aabb.upperBound);}aabb.lowerBound.x-=this.m_particleDiameter;aabb.lowerBound.y-=this.m_particleDiameter;aabb.upperBound.x+=this.m_particleDiameter;aabb.upperBound.y+=this.m_particleDiameter;}},{key:"FreeBuffer",value:function FreeBuffer(b,capacity){if(b===null){return;}b.length=0;}},{key:"FreeUserOverridableBuffer",value:function FreeUserOverridableBuffer(b){if(b.userSuppliedCapacity===0){this.FreeBuffer(b.data,this.m_internalAllocatedCapacity);}}/**
             * Reallocate a buffer
             */},{key:"ReallocateBuffer3",value:function ReallocateBuffer3(oldBuffer,oldCapacity,newCapacity){// b2Assert(newCapacity > oldCapacity);
      if(newCapacity<=oldCapacity){throw new Error();}var newBuffer=oldBuffer?oldBuffer.slice():[];newBuffer.length=newCapacity;return newBuffer;}/**
             * Reallocate a buffer
             */},{key:"ReallocateBuffer5",value:function ReallocateBuffer5(buffer,userSuppliedCapacity,oldCapacity,newCapacity,deferred){// b2Assert(newCapacity > oldCapacity);
      if(newCapacity<=oldCapacity){throw new Error();}// A 'deferred' buffer is reallocated only if it is not NULL.
      // If 'userSuppliedCapacity' is not zero, buffer is user supplied and must
      // be kept.
      // b2Assert(!userSuppliedCapacity || newCapacity <= userSuppliedCapacity);
      if(!(!userSuppliedCapacity||newCapacity<=userSuppliedCapacity)){throw new Error();}if((!deferred||buffer)&&!userSuppliedCapacity){buffer=this.ReallocateBuffer3(buffer,oldCapacity,newCapacity);}return buffer;// TODO: fix this
      }/**
             * Reallocate a buffer
             */},{key:"ReallocateBuffer4",value:function ReallocateBuffer4(buffer,oldCapacity,newCapacity,deferred){// DEBUG: b2Assert(newCapacity > oldCapacity);
      return this.ReallocateBuffer5(buffer.data,buffer.userSuppliedCapacity,oldCapacity,newCapacity,deferred);}},{key:"RequestBuffer",value:function RequestBuffer(buffer){if(!buffer){if(this.m_internalAllocatedCapacity===0){this.ReallocateInternalAllocatedBuffers(b2_minParticleSystemBufferCapacity);}buffer=[];buffer.length=this.m_internalAllocatedCapacity;}return buffer;}/**
             * Reallocate the handle / index map and schedule the allocation
             * of a new pool for handle allocation.
             */},{key:"ReallocateHandleBuffers",value:function ReallocateHandleBuffers(newCapacity){// DEBUG: b2Assert(newCapacity > this.m_internalAllocatedCapacity);
      // Reallocate a new handle / index map buffer, copying old handle pointers
      // is fine since they're kept around.
      this.m_handleIndexBuffer.data=this.ReallocateBuffer4(this.m_handleIndexBuffer,this.m_internalAllocatedCapacity,newCapacity,true);// Set the size of the next handle allocation.
      ///this.m_handleAllocator.SetItemsPerSlab(newCapacity - this.m_internalAllocatedCapacity);
      }},{key:"ReallocateInternalAllocatedBuffers",value:function ReallocateInternalAllocatedBuffers(capacity){function LimitCapacity(capacity,maxCount){return maxCount&&capacity>maxCount?maxCount:capacity;}// Don't increase capacity beyond the smallest user-supplied buffer size.
      capacity=LimitCapacity(capacity,this.m_def.maxCount);capacity=LimitCapacity(capacity,this.m_flagsBuffer.userSuppliedCapacity);capacity=LimitCapacity(capacity,this.m_positionBuffer.userSuppliedCapacity);capacity=LimitCapacity(capacity,this.m_velocityBuffer.userSuppliedCapacity);capacity=LimitCapacity(capacity,this.m_colorBuffer.userSuppliedCapacity);capacity=LimitCapacity(capacity,this.m_userDataBuffer.userSuppliedCapacity);if(this.m_internalAllocatedCapacity<capacity){this.ReallocateHandleBuffers(capacity);this.m_flagsBuffer.data=this.ReallocateBuffer4(this.m_flagsBuffer,this.m_internalAllocatedCapacity,capacity,false);// Conditionally defer these as they are optional if the feature is
      // not enabled.
      var stuck=this.m_stuckThreshold>0;this.m_lastBodyContactStepBuffer.data=this.ReallocateBuffer4(this.m_lastBodyContactStepBuffer,this.m_internalAllocatedCapacity,capacity,stuck);this.m_bodyContactCountBuffer.data=this.ReallocateBuffer4(this.m_bodyContactCountBuffer,this.m_internalAllocatedCapacity,capacity,stuck);this.m_consecutiveContactStepsBuffer.data=this.ReallocateBuffer4(this.m_consecutiveContactStepsBuffer,this.m_internalAllocatedCapacity,capacity,stuck);this.m_positionBuffer.data=this.ReallocateBuffer4(this.m_positionBuffer,this.m_internalAllocatedCapacity,capacity,false);this.m_velocityBuffer.data=this.ReallocateBuffer4(this.m_velocityBuffer,this.m_internalAllocatedCapacity,capacity,false);this.m_forceBuffer=this.ReallocateBuffer5(this.m_forceBuffer,0,this.m_internalAllocatedCapacity,capacity,false);this.m_weightBuffer=this.ReallocateBuffer5(this.m_weightBuffer,0,this.m_internalAllocatedCapacity,capacity,false);this.m_staticPressureBuffer=this.ReallocateBuffer5(this.m_staticPressureBuffer,0,this.m_internalAllocatedCapacity,capacity,true);this.m_accumulationBuffer=this.ReallocateBuffer5(this.m_accumulationBuffer,0,this.m_internalAllocatedCapacity,capacity,false);this.m_accumulation2Buffer=this.ReallocateBuffer5(this.m_accumulation2Buffer,0,this.m_internalAllocatedCapacity,capacity,true);this.m_depthBuffer=this.ReallocateBuffer5(this.m_depthBuffer,0,this.m_internalAllocatedCapacity,capacity,true);this.m_colorBuffer.data=this.ReallocateBuffer4(this.m_colorBuffer,this.m_internalAllocatedCapacity,capacity,true);this.m_groupBuffer=this.ReallocateBuffer5(this.m_groupBuffer,0,this.m_internalAllocatedCapacity,capacity,false);this.m_userDataBuffer.data=this.ReallocateBuffer4(this.m_userDataBuffer,this.m_internalAllocatedCapacity,capacity,true);this.m_expirationTimeBuffer.data=this.ReallocateBuffer4(this.m_expirationTimeBuffer,this.m_internalAllocatedCapacity,capacity,true);this.m_indexByExpirationTimeBuffer.data=this.ReallocateBuffer4(this.m_indexByExpirationTimeBuffer,this.m_internalAllocatedCapacity,capacity,false);this.m_internalAllocatedCapacity=capacity;}}},{key:"CreateParticleForGroup",value:function CreateParticleForGroup(groupDef,xf,p){var particleDef=new b2ParticleDef();particleDef.flags=b2Maybe(groupDef.flags,0);///particleDef.position = b2Mul(xf, p);
      b2Transform.MulXV(xf,p,particleDef.position);///particleDef.velocity =
      ///  groupDef.linearVelocity +
      ///  b2Cross(groupDef.angularVelocity,
      ///      particleDef.position - groupDef.position);
      b2Vec2.AddVV(b2Maybe(groupDef.linearVelocity,b2Vec2.ZERO),b2Vec2.CrossSV(b2Maybe(groupDef.angularVelocity,0),b2Vec2.SubVV(particleDef.position,b2Maybe(groupDef.position,b2Vec2.ZERO),b2Vec2.s_t0),b2Vec2.s_t0),particleDef.velocity);particleDef.color.Copy(b2Maybe(groupDef.color,b2Color.ZERO));particleDef.lifetime=b2Maybe(groupDef.lifetime,0);particleDef.userData=groupDef.userData;this.CreateParticle(particleDef);}},{key:"CreateParticlesStrokeShapeForGroup",value:function CreateParticlesStrokeShapeForGroup(shape,groupDef,xf){var s_edge=b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_edge;var s_d=b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_d;var s_p=b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_p;var stride=b2Maybe(groupDef.stride,0);if(stride===0){stride=this.GetParticleStride();}var positionOnEdge=0;var childCount=shape.GetChildCount();for(var childIndex=0;childIndex<childCount;childIndex++){var edge=null;if(shape.GetType()===exports.b2ShapeType.e_edgeShape){edge=shape;}else {// DEBUG: b2Assert(shape.GetType() === b2ShapeType.e_chainShape);
      edge=s_edge;shape.GetChildEdge(edge,childIndex);}var d=b2Vec2.SubVV(edge.m_vertex2,edge.m_vertex1,s_d);var edgeLength=d.Length();while(positionOnEdge<edgeLength){///b2Vec2 p = edge.m_vertex1 + positionOnEdge / edgeLength * d;
      var p=b2Vec2.AddVMulSV(edge.m_vertex1,positionOnEdge/edgeLength,d,s_p);this.CreateParticleForGroup(groupDef,xf,p);positionOnEdge+=stride;}positionOnEdge-=edgeLength;}}},{key:"CreateParticlesFillShapeForGroup",value:function CreateParticlesFillShapeForGroup(shape,groupDef,xf){var s_aabb=b2ParticleSystem.CreateParticlesFillShapeForGroup_s_aabb;var s_p=b2ParticleSystem.CreateParticlesFillShapeForGroup_s_p;var stride=b2Maybe(groupDef.stride,0);if(stride===0){stride=this.GetParticleStride();}///b2Transform identity;
      /// identity.SetIdentity();
      var identity=b2Transform.IDENTITY;var aabb=s_aabb;// DEBUG: b2Assert(shape.GetChildCount() === 1);
      shape.ComputeAABB(aabb,identity,0);for(var y=Math.floor(aabb.lowerBound.y/stride)*stride;y<aabb.upperBound.y;y+=stride){for(var x=Math.floor(aabb.lowerBound.x/stride)*stride;x<aabb.upperBound.x;x+=stride){var p=s_p.Set(x,y);if(shape.TestPoint(identity,p)){this.CreateParticleForGroup(groupDef,xf,p);}}}}},{key:"CreateParticlesWithShapeForGroup",value:function CreateParticlesWithShapeForGroup(shape,groupDef,xf){switch(shape.GetType()){case exports.b2ShapeType.e_edgeShape:case exports.b2ShapeType.e_chainShape:this.CreateParticlesStrokeShapeForGroup(shape,groupDef,xf);break;case exports.b2ShapeType.e_polygonShape:case exports.b2ShapeType.e_circleShape:this.CreateParticlesFillShapeForGroup(shape,groupDef,xf);break;}}},{key:"CreateParticlesWithShapesForGroup",value:function CreateParticlesWithShapesForGroup(shapes,shapeCount,groupDef,xf){var compositeShape=new b2ParticleSystem_CompositeShape(shapes,shapeCount);this.CreateParticlesFillShapeForGroup(compositeShape,groupDef,xf);}},{key:"CloneParticle",value:function CloneParticle(oldIndex,group){var def=new b2ParticleDef();def.flags=this.m_flagsBuffer.data[oldIndex];def.position.Copy(this.m_positionBuffer.data[oldIndex]);def.velocity.Copy(this.m_velocityBuffer.data[oldIndex]);if(this.m_colorBuffer.data){def.color.Copy(this.m_colorBuffer.data[oldIndex]);}if(this.m_userDataBuffer.data){def.userData=this.m_userDataBuffer.data[oldIndex];}def.group=group;var newIndex=this.CreateParticle(def);if(this.m_handleIndexBuffer.data){var handle=this.m_handleIndexBuffer.data[oldIndex];if(handle){handle.SetIndex(newIndex);}this.m_handleIndexBuffer.data[newIndex]=handle;this.m_handleIndexBuffer.data[oldIndex]=null;}if(this.m_lastBodyContactStepBuffer.data){this.m_lastBodyContactStepBuffer.data[newIndex]=this.m_lastBodyContactStepBuffer.data[oldIndex];}if(this.m_bodyContactCountBuffer.data){this.m_bodyContactCountBuffer.data[newIndex]=this.m_bodyContactCountBuffer.data[oldIndex];}if(this.m_consecutiveContactStepsBuffer.data){this.m_consecutiveContactStepsBuffer.data[newIndex]=this.m_consecutiveContactStepsBuffer.data[oldIndex];}if(this.m_hasForce){this.m_forceBuffer[newIndex].Copy(this.m_forceBuffer[oldIndex]);}if(this.m_staticPressureBuffer){this.m_staticPressureBuffer[newIndex]=this.m_staticPressureBuffer[oldIndex];}if(this.m_depthBuffer){this.m_depthBuffer[newIndex]=this.m_depthBuffer[oldIndex];}if(this.m_expirationTimeBuffer.data){this.m_expirationTimeBuffer.data[newIndex]=this.m_expirationTimeBuffer.data[oldIndex];}return newIndex;}},{key:"DestroyParticlesInGroup",value:function DestroyParticlesInGroup(group){var callDestructionListener=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;for(var i=group.m_firstIndex;i<group.m_lastIndex;i++){this.DestroyParticle(i,callDestructionListener);}}},{key:"DestroyParticleGroup",value:function DestroyParticleGroup(group){// DEBUG: b2Assert(this.m_groupCount > 0);
      // DEBUG: b2Assert(group !== null);
      if(this.m_world.m_destructionListener){this.m_world.m_destructionListener.SayGoodbyeParticleGroup(group);}this.SetGroupFlags(group,0);for(var i=group.m_firstIndex;i<group.m_lastIndex;i++){this.m_groupBuffer[i]=null;}if(group.m_prev){group.m_prev.m_next=group.m_next;}if(group.m_next){group.m_next.m_prev=group.m_prev;}if(group===this.m_groupList){this.m_groupList=group.m_next;}--this.m_groupCount;}},{key:"UpdatePairsAndTriads",value:function UpdatePairsAndTriads(firstIndex,lastIndex,filter){var s_dab=b2ParticleSystem.UpdatePairsAndTriads_s_dab;var s_dbc=b2ParticleSystem.UpdatePairsAndTriads_s_dbc;var s_dca=b2ParticleSystem.UpdatePairsAndTriads_s_dca;var pos_data=this.m_positionBuffer.data;// Create pairs or triads.
      // All particles in each pair/triad should satisfy the following:
      // * firstIndex <= index < lastIndex
      // * don't have b2_zombieParticle
      // * ParticleCanBeConnected returns true
      // * ShouldCreatePair/ShouldCreateTriad returns true
      // Any particles in each pair/triad should satisfy the following:
      // * filter.IsNeeded returns true
      // * have one of k_pairFlags/k_triadsFlags
      // DEBUG: b2Assert(firstIndex <= lastIndex);
      var particleFlags=0;for(var i=firstIndex;i<lastIndex;i++){particleFlags|=this.m_flagsBuffer.data[i];}if(particleFlags&b2ParticleSystem.k_pairFlags){for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];var a=contact.indexA;var b=contact.indexB;var af=this.m_flagsBuffer.data[a];var bf=this.m_flagsBuffer.data[b];var groupA=this.m_groupBuffer[a];var groupB=this.m_groupBuffer[b];if(a>=firstIndex&&a<lastIndex&&b>=firstIndex&&b<lastIndex&&!((af|bf)&exports.b2ParticleFlag.b2_zombieParticle)&&(af|bf)&b2ParticleSystem.k_pairFlags&&(filter.IsNecessary(a)||filter.IsNecessary(b))&&b2ParticleSystem.ParticleCanBeConnected(af,groupA)&&b2ParticleSystem.ParticleCanBeConnected(bf,groupB)&&filter.ShouldCreatePair(a,b)){///b2ParticlePair& pair = m_pairBuffer.Append();
      var pair=this.m_pairBuffer.data[this.m_pairBuffer.Append()];pair.indexA=a;pair.indexB=b;pair.flags=contact.flags;pair.strength=b2Min(groupA?groupA.m_strength:1,groupB?groupB.m_strength:1);///pair.distance = b2Distance(pos_data[a], pos_data[b]); // TODO: this was wrong!
      pair.distance=b2Vec2.DistanceVV(pos_data[a],pos_data[b]);}///std::stable_sort(m_pairBuffer.Begin(), m_pairBuffer.End(), ComparePairIndices);
      std_stable_sort(this.m_pairBuffer.data,0,this.m_pairBuffer.count,b2ParticleSystem.ComparePairIndices);///m_pairBuffer.Unique(MatchPairIndices);
      this.m_pairBuffer.Unique(b2ParticleSystem.MatchPairIndices);}}if(particleFlags&b2ParticleSystem.k_triadFlags){var diagram=new b2VoronoiDiagram(lastIndex-firstIndex);///let necessary_count = 0;
      for(var _i28=firstIndex;_i28<lastIndex;_i28++){var flags=this.m_flagsBuffer.data[_i28];var group=this.m_groupBuffer[_i28];if(!(flags&exports.b2ParticleFlag.b2_zombieParticle)&&b2ParticleSystem.ParticleCanBeConnected(flags,group)){///if (filter.IsNecessary(i)) {
      ///++necessary_count;
      ///}
      diagram.AddGenerator(pos_data[_i28],_i28,filter.IsNecessary(_i28));}}///if (necessary_count === 0) {
      /////debugger;
      ///for (let i = firstIndex; i < lastIndex; i++) {
      ///  filter.IsNecessary(i);
      ///}
      ///}
      var stride=this.GetParticleStride();diagram.Generate(stride/2,stride*2);var system=this;var callback=/*UpdateTriadsCallback*/function callback(a,b,c){var af=system.m_flagsBuffer.data[a];var bf=system.m_flagsBuffer.data[b];var cf=system.m_flagsBuffer.data[c];if((af|bf|cf)&b2ParticleSystem.k_triadFlags&&filter.ShouldCreateTriad(a,b,c)){var pa=pos_data[a];var pb=pos_data[b];var pc=pos_data[c];var dab=b2Vec2.SubVV(pa,pb,s_dab);var dbc=b2Vec2.SubVV(pb,pc,s_dbc);var dca=b2Vec2.SubVV(pc,pa,s_dca);var maxDistanceSquared=b2_maxTriadDistanceSquared*system.m_squaredDiameter;if(b2Vec2.DotVV(dab,dab)>maxDistanceSquared||b2Vec2.DotVV(dbc,dbc)>maxDistanceSquared||b2Vec2.DotVV(dca,dca)>maxDistanceSquared){return;}var _groupA=system.m_groupBuffer[a];var _groupB=system.m_groupBuffer[b];var groupC=system.m_groupBuffer[c];///b2ParticleTriad& triad = m_system.m_triadBuffer.Append();
      var triad=system.m_triadBuffer.data[system.m_triadBuffer.Append()];triad.indexA=a;triad.indexB=b;triad.indexC=c;triad.flags=af|bf|cf;triad.strength=b2Min(b2Min(_groupA?_groupA.m_strength:1,_groupB?_groupB.m_strength:1),groupC?groupC.m_strength:1);///let midPoint = b2Vec2.MulSV(1.0 / 3.0, b2Vec2.AddVV(pa, b2Vec2.AddVV(pb, pc, new b2Vec2()), new b2Vec2()), new b2Vec2());
      var midPoint_x=(pa.x+pb.x+pc.x)/3.0;var midPoint_y=(pa.y+pb.y+pc.y)/3.0;///triad.pa = b2Vec2.SubVV(pa, midPoint, new b2Vec2());
      triad.pa.x=pa.x-midPoint_x;triad.pa.y=pa.y-midPoint_y;///triad.pb = b2Vec2.SubVV(pb, midPoint, new b2Vec2());
      triad.pb.x=pb.x-midPoint_x;triad.pb.y=pb.y-midPoint_y;///triad.pc = b2Vec2.SubVV(pc, midPoint, new b2Vec2());
      triad.pc.x=pc.x-midPoint_x;triad.pc.y=pc.y-midPoint_y;triad.ka=-b2Vec2.DotVV(dca,dab);triad.kb=-b2Vec2.DotVV(dab,dbc);triad.kc=-b2Vec2.DotVV(dbc,dca);triad.s=b2Vec2.CrossVV(pa,pb)+b2Vec2.CrossVV(pb,pc)+b2Vec2.CrossVV(pc,pa);}};diagram.GetNodes(callback);///std::stable_sort(m_triadBuffer.Begin(), m_triadBuffer.End(), CompareTriadIndices);
      std_stable_sort(this.m_triadBuffer.data,0,this.m_triadBuffer.count,b2ParticleSystem.CompareTriadIndices);///m_triadBuffer.Unique(MatchTriadIndices);
      this.m_triadBuffer.Unique(b2ParticleSystem.MatchTriadIndices);}}},{key:"UpdatePairsAndTriadsWithReactiveParticles",value:function UpdatePairsAndTriadsWithReactiveParticles(){var filter=new b2ParticleSystem_ReactiveFilter(this.m_flagsBuffer);this.UpdatePairsAndTriads(0,this.m_count,filter);for(var i=0;i<this.m_count;i++){this.m_flagsBuffer.data[i]&=~exports.b2ParticleFlag.b2_reactiveParticle;}this.m_allParticleFlags&=~exports.b2ParticleFlag.b2_reactiveParticle;}},{key:"MergeParticleListsInContact",value:function MergeParticleListsInContact(group,nodeBuffer){var bufferIndex=group.GetBufferIndex();for(var k=0;k<this.m_contactBuffer.count;k++){/*const b2ParticleContact&*/var contact=this.m_contactBuffer.data[k];var a=contact.indexA;var b=contact.indexB;if(!group.ContainsParticle(a)||!group.ContainsParticle(b)){continue;}var listA=nodeBuffer[a-bufferIndex].list;var listB=nodeBuffer[b-bufferIndex].list;if(listA===listB){continue;}// To minimize the cost of insertion, make sure listA is longer than
      // listB.
      if(listA.count<listB.count){var _tmp=listA;listA=listB;listB=_tmp;///b2Swap(listA, listB);
      }// DEBUG: b2Assert(listA.count >= listB.count);
      b2ParticleSystem.MergeParticleLists(listA,listB);}}},{key:"MergeZombieParticleListNodes",value:function MergeZombieParticleListNodes(group,nodeBuffer,survivingList){var particleCount=group.GetParticleCount();for(var i=0;i<particleCount;i++){var node=nodeBuffer[i];if(node!==survivingList&&this.m_flagsBuffer.data[node.index]&exports.b2ParticleFlag.b2_zombieParticle){b2ParticleSystem.MergeParticleListAndNode(survivingList,node);}}}},{key:"CreateParticleGroupsFromParticleList",value:function CreateParticleGroupsFromParticleList(group,nodeBuffer,survivingList){var particleCount=group.GetParticleCount();var def=new b2ParticleGroupDef();def.groupFlags=group.GetGroupFlags();def.userData=group.GetUserData();for(var i=0;i<particleCount;i++){var list=nodeBuffer[i];if(!list.count||list===survivingList){continue;}// DEBUG: b2Assert(list.list === list);
      var newGroup=this.CreateParticleGroup(def);for(var node=list;node;node=node.next){var oldIndex=node.index;// DEBUG: const flags = this.m_flagsBuffer.data[oldIndex];
      // DEBUG: b2Assert(!(flags & b2ParticleFlag.b2_zombieParticle));
      var newIndex=this.CloneParticle(oldIndex,newGroup);this.m_flagsBuffer.data[oldIndex]|=exports.b2ParticleFlag.b2_zombieParticle;node.index=newIndex;}}}},{key:"UpdatePairsAndTriadsWithParticleList",value:function UpdatePairsAndTriadsWithParticleList(group,nodeBuffer){var bufferIndex=group.GetBufferIndex();// Update indices in pairs and triads. If an index belongs to the group,
      // replace it with the corresponding value in nodeBuffer.
      // Note that nodeBuffer is allocated only for the group and the index should
      // be shifted by bufferIndex.
      for(var k=0;k<this.m_pairBuffer.count;k++){var pair=this.m_pairBuffer.data[k];var a=pair.indexA;var b=pair.indexB;if(group.ContainsParticle(a)){pair.indexA=nodeBuffer[a-bufferIndex].index;}if(group.ContainsParticle(b)){pair.indexB=nodeBuffer[b-bufferIndex].index;}}for(var _k6=0;_k6<this.m_triadBuffer.count;_k6++){var triad=this.m_triadBuffer.data[_k6];var _a4=triad.indexA;var _b5=triad.indexB;var c=triad.indexC;if(group.ContainsParticle(_a4)){triad.indexA=nodeBuffer[_a4-bufferIndex].index;}if(group.ContainsParticle(_b5)){triad.indexB=nodeBuffer[_b5-bufferIndex].index;}if(group.ContainsParticle(c)){triad.indexC=nodeBuffer[c-bufferIndex].index;}}}},{key:"ComputeDepth",value:function ComputeDepth(){var contactGroups=[];// TODO: static
      var contactGroupsCount=0;for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];var a=contact.indexA;var b=contact.indexB;var groupA=this.m_groupBuffer[a];var groupB=this.m_groupBuffer[b];if(groupA&&groupA===groupB&&groupA.m_groupFlags&exports.b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth){contactGroups[contactGroupsCount++]=contact;}}var groupsToUpdate=[];// TODO: static
      var groupsToUpdateCount=0;for(var group=this.m_groupList;group;group=group.GetNext()){if(group.m_groupFlags&exports.b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth){groupsToUpdate[groupsToUpdateCount++]=group;this.SetGroupFlags(group,group.m_groupFlags&~exports.b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth);for(var i=group.m_firstIndex;i<group.m_lastIndex;i++){this.m_accumulationBuffer[i]=0;}}}// Compute sum of weight of contacts except between different groups.
      for(var _k7=0;_k7<contactGroupsCount;_k7++){var _contact=contactGroups[_k7];var _a5=_contact.indexA;var _b6=_contact.indexB;var w=_contact.weight;this.m_accumulationBuffer[_a5]+=w;this.m_accumulationBuffer[_b6]+=w;}// DEBUG: b2Assert(this.m_depthBuffer !== null);
      for(var _i29=0;_i29<groupsToUpdateCount;_i29++){var _group=groupsToUpdate[_i29];for(var _i30=_group.m_firstIndex;_i30<_group.m_lastIndex;_i30++){var _w2=this.m_accumulationBuffer[_i30];this.m_depthBuffer[_i30]=_w2<0.8?0:b2_maxFloat;}}// The number of iterations is equal to particle number from the deepest
      // particle to the nearest surface particle, and in general it is smaller
      // than sqrt of total particle number.
      ///int32 iterationCount = (int32)b2Sqrt((float)m_count);
      var iterationCount=b2Sqrt(this.m_count)>>0;for(var t=0;t<iterationCount;t++){var updated=false;for(var _k8=0;_k8<contactGroupsCount;_k8++){var _contact2=contactGroups[_k8];var _a6=_contact2.indexA;var _b7=_contact2.indexB;var r=1-_contact2.weight;///float32& ap0 = m_depthBuffer[a];
      var ap0=this.m_depthBuffer[_a6];///float32& bp0 = m_depthBuffer[b];
      var bp0=this.m_depthBuffer[_b7];var ap1=bp0+r;var bp1=ap0+r;if(ap0>ap1){///ap0 = ap1;
      this.m_depthBuffer[_a6]=ap1;updated=true;}if(bp0>bp1){///bp0 = bp1;
      this.m_depthBuffer[_b7]=bp1;updated=true;}}if(!updated){break;}}for(var _i31=0;_i31<groupsToUpdateCount;_i31++){var _group2=groupsToUpdate[_i31];for(var _i32=_group2.m_firstIndex;_i32<_group2.m_lastIndex;_i32++){if(this.m_depthBuffer[_i32]<b2_maxFloat){this.m_depthBuffer[_i32]*=this.m_particleDiameter;}else {this.m_depthBuffer[_i32]=0;}}}}},{key:"GetInsideBoundsEnumerator",value:function GetInsideBoundsEnumerator(aabb){var lowerTag=b2ParticleSystem.computeTag(this.m_inverseDiameter*aabb.lowerBound.x-1,this.m_inverseDiameter*aabb.lowerBound.y-1);var upperTag=b2ParticleSystem.computeTag(this.m_inverseDiameter*aabb.upperBound.x+1,this.m_inverseDiameter*aabb.upperBound.y+1);///const Proxy* beginProxy = m_proxyBuffer.Begin();
      var beginProxy=0;///const Proxy* endProxy = m_proxyBuffer.End();
      var endProxy=this.m_proxyBuffer.count;///const Proxy* firstProxy = std::lower_bound(beginProxy, endProxy, lowerTag);
      var firstProxy=std_lower_bound(this.m_proxyBuffer.data,beginProxy,endProxy,lowerTag,b2ParticleSystem_Proxy.CompareProxyTag);///const Proxy* lastProxy = std::upper_bound(firstProxy, endProxy, upperTag);
      var lastProxy=std_upper_bound(this.m_proxyBuffer.data,beginProxy,endProxy,upperTag,b2ParticleSystem_Proxy.CompareTagProxy);// DEBUG: b2Assert(beginProxy <= firstProxy);
      // DEBUG: b2Assert(firstProxy <= lastProxy);
      // DEBUG: b2Assert(lastProxy <= endProxy);
      return new b2ParticleSystem_InsideBoundsEnumerator(this,lowerTag,upperTag,firstProxy,lastProxy);}},{key:"UpdateAllParticleFlags",value:function UpdateAllParticleFlags(){this.m_allParticleFlags=0;for(var i=0;i<this.m_count;i++){this.m_allParticleFlags|=this.m_flagsBuffer.data[i];}this.m_needsUpdateAllParticleFlags=false;}},{key:"UpdateAllGroupFlags",value:function UpdateAllGroupFlags(){this.m_allGroupFlags=0;for(var group=this.m_groupList;group;group=group.GetNext()){this.m_allGroupFlags|=group.m_groupFlags;}this.m_needsUpdateAllGroupFlags=false;}},{key:"AddContact",value:function AddContact(a,b,contacts){// DEBUG: b2Assert(contacts === this.m_contactBuffer);
      var flags_data=this.m_flagsBuffer.data;var pos_data=this.m_positionBuffer.data;///b2Vec2 d = m_positionBuffer.data[b] - m_positionBuffer.data[a];
      var d=b2Vec2.SubVV(pos_data[b],pos_data[a],b2ParticleSystem.AddContact_s_d);var distBtParticlesSq=b2Vec2.DotVV(d,d);if(0<distBtParticlesSq&&distBtParticlesSq<this.m_squaredDiameter){var invD=b2InvSqrt(distBtParticlesSq);///b2ParticleContact& contact = contacts.Append();
      var contact=this.m_contactBuffer.data[this.m_contactBuffer.Append()];contact.indexA=a;contact.indexB=b;contact.flags=flags_data[a]|flags_data[b];contact.weight=1-distBtParticlesSq*invD*this.m_inverseDiameter;contact.normal.x=invD*d.x;contact.normal.y=invD*d.y;}}},{key:"FindContacts_Reference",value:function FindContacts_Reference(contacts){// DEBUG: b2Assert(contacts === this.m_contactBuffer);
      var beginProxy=0;var endProxy=this.m_proxyBuffer.count;this.m_contactBuffer.count=0;for(var a=beginProxy,c=beginProxy;a<endProxy;a++){var rightTag=b2ParticleSystem.computeRelativeTag(this.m_proxyBuffer.data[a].tag,1,0);for(var b=a+1;b<endProxy;b++){if(rightTag<this.m_proxyBuffer.data[b].tag){break;}this.AddContact(this.m_proxyBuffer.data[a].index,this.m_proxyBuffer.data[b].index,this.m_contactBuffer);}var bottomLeftTag=b2ParticleSystem.computeRelativeTag(this.m_proxyBuffer.data[a].tag,-1,1);for(;c<endProxy;c++){if(bottomLeftTag<=this.m_proxyBuffer.data[c].tag){break;}}var bottomRightTag=b2ParticleSystem.computeRelativeTag(this.m_proxyBuffer.data[a].tag,1,1);for(var _b8=c;_b8<endProxy;_b8++){if(bottomRightTag<this.m_proxyBuffer.data[_b8].tag){break;}this.AddContact(this.m_proxyBuffer.data[a].index,this.m_proxyBuffer.data[_b8].index,this.m_contactBuffer);}}}///void ReorderForFindContact(FindContactInput* reordered, int alignedCount) const;
      ///void GatherChecksOneParticle(const uint32 bound, const int startIndex, const int particleIndex, int* nextUncheckedIndex, b2GrowableBuffer<FindContactCheck>& checks) const;
      ///void GatherChecks(b2GrowableBuffer<FindContactCheck>& checks) const;
      ///void FindContacts_Simd(b2GrowableBuffer<b2ParticleContact>& contacts) const;
      },{key:"FindContacts",value:function FindContacts(contacts){this.FindContacts_Reference(contacts);}///static void UpdateProxyTags(const uint32* const tags, b2GrowableBuffer<Proxy>& proxies);
      ///static bool ProxyBufferHasIndex(int32 index, const Proxy* const a, int count);
      ///static int NumProxiesWithSameTag(const Proxy* const a, const Proxy* const b, int count);
      ///static bool AreProxyBuffersTheSame(const b2GrowableBuffer<Proxy>& a, const b2GrowableBuffer<Proxy>& b);
      },{key:"UpdateProxies_Reference",value:function UpdateProxies_Reference(proxies){// DEBUG: b2Assert(proxies === this.m_proxyBuffer);
      var pos_data=this.m_positionBuffer.data;var inv_diam=this.m_inverseDiameter;for(var k=0;k<this.m_proxyBuffer.count;++k){var proxy=this.m_proxyBuffer.data[k];var i=proxy.index;var p=pos_data[i];proxy.tag=b2ParticleSystem.computeTag(inv_diam*p.x,inv_diam*p.y);}}///void UpdateProxies_Simd(b2GrowableBuffer<Proxy>& proxies) const;
      },{key:"UpdateProxies",value:function UpdateProxies(proxies){this.UpdateProxies_Reference(proxies);}},{key:"SortProxies",value:function SortProxies(proxies){// DEBUG: b2Assert(proxies === this.m_proxyBuffer);
      ///std::sort(proxies.Begin(), proxies.End());
      std_sort$1(this.m_proxyBuffer.data,0,this.m_proxyBuffer.count,b2ParticleSystem_Proxy.CompareProxyProxy);}},{key:"FilterContacts",value:function FilterContacts(contacts){// Optionally filter the contact.
      var contactFilter=this.GetParticleContactFilter();if(contactFilter===null){return;}/// contacts.RemoveIf(b2ParticleContactRemovePredicate(this, contactFilter));
      // DEBUG: b2Assert(contacts === this.m_contactBuffer);
      var system=this;var predicate=function predicate(contact){return (contact.flags&exports.b2ParticleFlag.b2_particleContactFilterParticle)!==0&&!contactFilter.ShouldCollideParticleParticle(system,contact.indexA,contact.indexB);};this.m_contactBuffer.RemoveIf(predicate);}},{key:"NotifyContactListenerPreContact",value:function NotifyContactListenerPreContact(particlePairs){var contactListener=this.GetParticleContactListener();if(contactListener===null){return;}///particlePairs.Initialize(m_contactBuffer.Begin(), m_contactBuffer.GetCount(), GetFlagsBuffer());
      particlePairs.Initialize(this.m_contactBuffer,this.m_flagsBuffer);throw new Error();// TODO: notify
      }},{key:"NotifyContactListenerPostContact",value:function NotifyContactListenerPostContact(particlePairs){var contactListener=this.GetParticleContactListener();if(contactListener===null){return;}// Loop through all new contacts, reporting any new ones, and
      // "invalidating" the ones that still exist.
      ///const b2ParticleContact* const endContact = m_contactBuffer.End();
      ///for (b2ParticleContact* contact = m_contactBuffer.Begin(); contact < endContact; ++contact)
      for(var k=0;k<this.m_contactBuffer.count;++k){var contact=this.m_contactBuffer.data[k];{// Just started touching, inform the listener.
      contactListener.BeginContactParticleParticle(this,contact);}}// Report particles that are no longer touching.
      // That is, any pairs that were not invalidated above.
      ///const int32 pairCount = particlePairs.GetCount();
      ///const ParticlePair* const pairs = particlePairs.GetBuffer();
      ///const int8* const valid = particlePairs.GetValidBuffer();
      ///for (int32 i = 0; i < pairCount; ++i)
      ///{
      ///  if (valid[i])
      ///  {
      ///    contactListener.EndContactParticleParticle(this, pairs[i].first, pairs[i].second);
      ///  }
      ///}
      throw new Error();// TODO: notify
      }},{key:"UpdateContacts",value:function UpdateContacts(exceptZombie){this.UpdateProxies(this.m_proxyBuffer);this.SortProxies(this.m_proxyBuffer);var particlePairs=new b2ParticlePairSet();// TODO: static
      this.NotifyContactListenerPreContact(particlePairs);this.FindContacts(this.m_contactBuffer);this.FilterContacts(this.m_contactBuffer);this.NotifyContactListenerPostContact(particlePairs);if(exceptZombie){this.m_contactBuffer.RemoveIf(b2ParticleSystem.b2ParticleContactIsZombie);}}},{key:"NotifyBodyContactListenerPreContact",value:function NotifyBodyContactListenerPreContact(fixtureSet){var contactListener=this.GetFixtureContactListener();if(contactListener===null){return;}///fixtureSet.Initialize(m_bodyContactBuffer.Begin(), m_bodyContactBuffer.GetCount(), GetFlagsBuffer());
      fixtureSet.Initialize(this.m_bodyContactBuffer,this.m_flagsBuffer);throw new Error();// TODO: notify
      }},{key:"NotifyBodyContactListenerPostContact",value:function NotifyBodyContactListenerPostContact(fixtureSet){var contactListener=this.GetFixtureContactListener();if(contactListener===null){return;}// Loop through all new contacts, reporting any new ones, and
      // "invalidating" the ones that still exist.
      ///for (b2ParticleBodyContact* contact = m_bodyContactBuffer.Begin(); contact !== m_bodyContactBuffer.End(); ++contact)
      for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];{// Just started touching, report it!
      contactListener.BeginContactFixtureParticle(this,contact);}}// If the contact listener is enabled, report all fixtures that are no
      // longer in contact with particles.
      ///const FixtureParticle* const fixtureParticles = fixtureSet.GetBuffer();
      ///const int8* const fixtureParticlesValid = fixtureSet.GetValidBuffer();
      ///const int32 fixtureParticleCount = fixtureSet.GetCount();
      ///for (int32 i = 0; i < fixtureParticleCount; ++i)
      ///{
      ///  if (fixtureParticlesValid[i])
      ///  {
      ///    const FixtureParticle* const fixtureParticle = &fixtureParticles[i];
      ///    contactListener.EndContactFixtureParticle(fixtureParticle.first, this, fixtureParticle.second);
      ///  }
      ///}
      throw new Error();// TODO: notify
      }},{key:"UpdateBodyContacts",value:function UpdateBodyContacts(){var s_aabb=b2ParticleSystem.UpdateBodyContacts_s_aabb;// If the particle contact listener is enabled, generate a set of
      // fixture / particle contacts.
      var fixtureSet=new b2ParticleSystem_FixtureParticleSet();// TODO: static
      this.NotifyBodyContactListenerPreContact(fixtureSet);if(this.m_stuckThreshold>0){var particleCount=this.GetParticleCount();for(var i=0;i<particleCount;i++){// Detect stuck particles, see comment in
      // b2ParticleSystem::DetectStuckParticle()
      this.m_bodyContactCountBuffer.data[i]=0;if(this.m_timestamp>this.m_lastBodyContactStepBuffer.data[i]+1){this.m_consecutiveContactStepsBuffer.data[i]=0;}}}this.m_bodyContactBuffer.SetCount(0);this.m_stuckParticleBuffer.SetCount(0);var aabb=s_aabb;this.ComputeAABB(aabb);if(this.UpdateBodyContacts_callback===null){this.UpdateBodyContacts_callback=new b2ParticleSystem_UpdateBodyContactsCallback(this);}var callback=this.UpdateBodyContacts_callback;callback.m_contactFilter=this.GetFixtureContactFilter();this.m_world.QueryAABB(callback,aabb);if(this.m_def.strictContactCheck){this.RemoveSpuriousBodyContacts();}this.NotifyBodyContactListenerPostContact(fixtureSet);}},{key:"Solve",value:function Solve(step){var s_subStep=b2ParticleSystem.Solve_s_subStep;if(this.m_count===0){return;}// If particle lifetimes are enabled, destroy particles that are too old.
      if(this.m_expirationTimeBuffer.data){this.SolveLifetimes(step);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_zombieParticle){this.SolveZombie();}if(this.m_needsUpdateAllParticleFlags){this.UpdateAllParticleFlags();}if(this.m_needsUpdateAllGroupFlags){this.UpdateAllGroupFlags();}if(this.m_paused){return;}for(this.m_iterationIndex=0;this.m_iterationIndex<step.particleIterations;this.m_iterationIndex++){++this.m_timestamp;var subStep=s_subStep.Copy(step);subStep.dt/=step.particleIterations;subStep.inv_dt*=step.particleIterations;this.UpdateContacts(false);this.UpdateBodyContacts();this.ComputeWeight();if(this.m_allGroupFlags&exports.b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth){this.ComputeDepth();}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_reactiveParticle){this.UpdatePairsAndTriadsWithReactiveParticles();}if(this.m_hasForce){this.SolveForce(subStep);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_viscousParticle){this.SolveViscous();}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_repulsiveParticle){this.SolveRepulsive(subStep);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_powderParticle){this.SolvePowder(subStep);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_tensileParticle){this.SolveTensile(subStep);}if(this.m_allGroupFlags&exports.b2ParticleGroupFlag.b2_solidParticleGroup){this.SolveSolid(subStep);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_colorMixingParticle){this.SolveColorMixing();}this.SolveGravity(subStep);if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_staticPressureParticle){this.SolveStaticPressure(subStep);}this.SolvePressure(subStep);this.SolveDamping(subStep);if(this.m_allParticleFlags&b2ParticleSystem.k_extraDampingFlags){this.SolveExtraDamping();}// SolveElastic and SolveSpring refer the current velocities for
      // numerical stability, they should be called as late as possible.
      if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_elasticParticle){this.SolveElastic(subStep);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_springParticle){this.SolveSpring(subStep);}this.LimitVelocity(subStep);if(this.m_allGroupFlags&exports.b2ParticleGroupFlag.b2_rigidParticleGroup){this.SolveRigidDamping();}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_barrierParticle){this.SolveBarrier(subStep);}// SolveCollision, SolveRigid and SolveWall should be called after
      // other force functions because they may require particles to have
      // specific velocities.
      this.SolveCollision(subStep);if(this.m_allGroupFlags&exports.b2ParticleGroupFlag.b2_rigidParticleGroup){this.SolveRigid(subStep);}if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_wallParticle){this.SolveWall();}// The particle positions can be updated only at the end of substep.
      for(var i=0;i<this.m_count;i++){///m_positionBuffer.data[i] += subStep.dt * m_velocityBuffer.data[i];
      this.m_positionBuffer.data[i].SelfMulAdd(subStep.dt,this.m_velocityBuffer.data[i]);}}}},{key:"SolveCollision",value:function SolveCollision(step){var s_aabb=b2ParticleSystem.SolveCollision_s_aabb;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;// This function detects particles which are crossing boundary of bodies
      // and modifies velocities of them so that they will move just in front of
      // boundary. This function function also applies the reaction force to
      // bodies as precisely as the numerical stability is kept.
      var aabb=s_aabb;aabb.lowerBound.x=+b2_maxFloat;aabb.lowerBound.y=+b2_maxFloat;aabb.upperBound.x=-b2_maxFloat;aabb.upperBound.y=-b2_maxFloat;for(var i=0;i<this.m_count;i++){var v=vel_data[i];var p1=pos_data[i];///let p2 = p1 + step.dt * v;
      var p2_x=p1.x+step.dt*v.x;var p2_y=p1.y+step.dt*v.y;///aabb.lowerBound = b2Min(aabb.lowerBound, b2Min(p1, p2));
      aabb.lowerBound.x=b2Min(aabb.lowerBound.x,b2Min(p1.x,p2_x));aabb.lowerBound.y=b2Min(aabb.lowerBound.y,b2Min(p1.y,p2_y));///aabb.upperBound = b2Max(aabb.upperBound, b2Max(p1, p2));
      aabb.upperBound.x=b2Max(aabb.upperBound.x,b2Max(p1.x,p2_x));aabb.upperBound.y=b2Max(aabb.upperBound.y,b2Max(p1.y,p2_y));}if(this.SolveCollision_callback===null){this.SolveCollision_callback=new b2ParticleSystem_SolveCollisionCallback(this,step);}var callback=this.SolveCollision_callback;callback.m_step=step;this.m_world.QueryAABB(callback,aabb);}},{key:"LimitVelocity",value:function LimitVelocity(step){var vel_data=this.m_velocityBuffer.data;var criticalVelocitySquared=this.GetCriticalVelocitySquared(step);for(var i=0;i<this.m_count;i++){var v=vel_data[i];var v2=b2Vec2.DotVV(v,v);if(v2>criticalVelocitySquared){///v *= b2Sqrt(criticalVelocitySquared / v2);
      v.SelfMul(b2Sqrt(criticalVelocitySquared/v2));}}}},{key:"SolveGravity",value:function SolveGravity(step){var s_gravity=b2ParticleSystem.SolveGravity_s_gravity;var vel_data=this.m_velocityBuffer.data;///b2Vec2 gravity = step.dt * m_def.gravityScale * m_world.GetGravity();
      var gravity=b2Vec2.MulSV(step.dt*this.m_def.gravityScale,this.m_world.GetGravity(),s_gravity);for(var i=0;i<this.m_count;i++){vel_data[i].SelfAdd(gravity);}}},{key:"SolveBarrier",value:function SolveBarrier(step){var s_aabb=b2ParticleSystem.SolveBarrier_s_aabb;var s_va=b2ParticleSystem.SolveBarrier_s_va;var s_vb=b2ParticleSystem.SolveBarrier_s_vb;var s_pba=b2ParticleSystem.SolveBarrier_s_pba;var s_vba=b2ParticleSystem.SolveBarrier_s_vba;var s_vc=b2ParticleSystem.SolveBarrier_s_vc;var s_pca=b2ParticleSystem.SolveBarrier_s_pca;var s_vca=b2ParticleSystem.SolveBarrier_s_vca;var s_qba=b2ParticleSystem.SolveBarrier_s_qba;var s_qca=b2ParticleSystem.SolveBarrier_s_qca;var s_dv=b2ParticleSystem.SolveBarrier_s_dv;var s_f=b2ParticleSystem.SolveBarrier_s_f;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;// If a particle is passing between paired barrier particles,
      // its velocity will be decelerated to avoid passing.
      for(var i=0;i<this.m_count;i++){var flags=this.m_flagsBuffer.data[i];///if ((flags & b2ParticleSystem.k_barrierWallFlags) === b2ParticleSystem.k_barrierWallFlags)
      if((flags&b2ParticleSystem.k_barrierWallFlags)!==0){vel_data[i].SetZero();}}var tmax=b2_barrierCollisionTime*step.dt;var mass=this.GetParticleMass();for(var k=0;k<this.m_pairBuffer.count;k++){var pair=this.m_pairBuffer.data[k];if(pair.flags&exports.b2ParticleFlag.b2_barrierParticle){var a=pair.indexA;var b=pair.indexB;var pa=pos_data[a];var pb=pos_data[b];/// b2AABB aabb;
      var aabb=s_aabb;///aabb.lowerBound = b2Min(pa, pb);
      b2Vec2.MinV(pa,pb,aabb.lowerBound);///aabb.upperBound = b2Max(pa, pb);
      b2Vec2.MaxV(pa,pb,aabb.upperBound);var aGroup=this.m_groupBuffer[a];var bGroup=this.m_groupBuffer[b];///b2Vec2 va = GetLinearVelocity(aGroup, a, pa);
      var va=this.GetLinearVelocity(aGroup,a,pa,s_va);///b2Vec2 vb = GetLinearVelocity(bGroup, b, pb);
      var vb=this.GetLinearVelocity(bGroup,b,pb,s_vb);///b2Vec2 pba = pb - pa;
      var pba=b2Vec2.SubVV(pb,pa,s_pba);///b2Vec2 vba = vb - va;
      var vba=b2Vec2.SubVV(vb,va,s_vba);///InsideBoundsEnumerator enumerator = GetInsideBoundsEnumerator(aabb);
      var enumerator=this.GetInsideBoundsEnumerator(aabb);var c=void 0;while((c=enumerator.GetNext())>=0){var pc=pos_data[c];var cGroup=this.m_groupBuffer[c];if(aGroup!==cGroup&&bGroup!==cGroup){///b2Vec2 vc = GetLinearVelocity(cGroup, c, pc);
      var vc=this.GetLinearVelocity(cGroup,c,pc,s_vc);// Solve the equation below:
      //   (1-s)*(pa+t*va)+s*(pb+t*vb) = pc+t*vc
      // which expresses that the particle c will pass a line
      // connecting the particles a and b at the time of t.
      // if s is between 0 and 1, c will pass between a and b.
      ///b2Vec2 pca = pc - pa;
      var pca=b2Vec2.SubVV(pc,pa,s_pca);///b2Vec2 vca = vc - va;
      var vca=b2Vec2.SubVV(vc,va,s_vca);var e2=b2Vec2.CrossVV(vba,vca);var e1=b2Vec2.CrossVV(pba,vca)-b2Vec2.CrossVV(pca,vba);var e0=b2Vec2.CrossVV(pba,pca);var s=void 0,t=void 0;///b2Vec2 qba, qca;
      var qba=s_qba,qca=s_qca;if(e2===0){if(e1===0){continue;}t=-e0/e1;if(!(t>=0&&t<tmax)){continue;}///qba = pba + t * vba;
      b2Vec2.AddVMulSV(pba,t,vba,qba);///qca = pca + t * vca;
      b2Vec2.AddVMulSV(pca,t,vca,qca);s=b2Vec2.DotVV(qba,qca)/b2Vec2.DotVV(qba,qba);if(!(s>=0&&s<=1)){continue;}}else {var det=e1*e1-4*e0*e2;if(det<0){continue;}var sqrtDet=b2Sqrt(det);var t1=(-e1-sqrtDet)/(2*e2);var t2=(-e1+sqrtDet)/(2*e2);///if (t1 > t2) b2Swap(t1, t2);
      if(t1>t2){var tmp=t1;t1=t2;t2=tmp;}t=t1;///qba = pba + t * vba;
      b2Vec2.AddVMulSV(pba,t,vba,qba);///qca = pca + t * vca;
      b2Vec2.AddVMulSV(pca,t,vca,qca);///s = b2Dot(qba, qca) / b2Dot(qba, qba);
      s=b2Vec2.DotVV(qba,qca)/b2Vec2.DotVV(qba,qba);if(!(t>=0&&t<tmax&&s>=0&&s<=1)){t=t2;if(!(t>=0&&t<tmax)){continue;}///qba = pba + t * vba;
      b2Vec2.AddVMulSV(pba,t,vba,qba);///qca = pca + t * vca;
      b2Vec2.AddVMulSV(pca,t,vca,qca);///s = b2Dot(qba, qca) / b2Dot(qba, qba);
      s=b2Vec2.DotVV(qba,qca)/b2Vec2.DotVV(qba,qba);if(!(s>=0&&s<=1)){continue;}}}// Apply a force to particle c so that it will have the
      // interpolated velocity at the collision point on line ab.
      ///b2Vec2 dv = va + s * vba - vc;
      var dv=s_dv;dv.x=va.x+s*vba.x-vc.x;dv.y=va.y+s*vba.y-vc.y;///b2Vec2 f = GetParticleMass() * dv;
      var f=b2Vec2.MulSV(mass,dv,s_f);if(cGroup&&this.IsRigidGroup(cGroup)){// If c belongs to a rigid group, the force will be
      // distributed in the group.
      var _mass=cGroup.GetMass();var inertia=cGroup.GetInertia();if(_mass>0){///cGroup.m_linearVelocity += 1 / mass * f;
      cGroup.m_linearVelocity.SelfMulAdd(1/_mass,f);}if(inertia>0){///cGroup.m_angularVelocity += b2Cross(pc - cGroup.GetCenter(), f) / inertia;
      cGroup.m_angularVelocity+=b2Vec2.CrossVV(b2Vec2.SubVV(pc,cGroup.GetCenter(),b2Vec2.s_t0),f)/inertia;}}else {///m_velocityBuffer.data[c] += dv;
      vel_data[c].SelfAdd(dv);}// Apply a reversed force to particle c after particle
      // movement so that momentum will be preserved.
      ///ParticleApplyForce(c, -step.inv_dt * f);
      this.ParticleApplyForce(c,f.SelfMul(-step.inv_dt));}}}}}},{key:"SolveStaticPressure",value:function SolveStaticPressure(step){this.m_staticPressureBuffer=this.RequestBuffer(this.m_staticPressureBuffer);var criticalPressure=this.GetCriticalPressure(step);var pressurePerWeight=this.m_def.staticPressureStrength*criticalPressure;var maxPressure=b2_maxParticlePressure*criticalPressure;var relaxation=this.m_def.staticPressureRelaxation;/// Compute pressure satisfying the modified Poisson equation:
      ///   Sum_for_j((p_i - p_j) * w_ij) + relaxation * p_i =
      ///   pressurePerWeight * (w_i - b2_minParticleWeight)
      /// by iterating the calculation:
      ///   p_i = (Sum_for_j(p_j * w_ij) + pressurePerWeight *
      ///         (w_i - b2_minParticleWeight)) / (w_i + relaxation)
      /// where
      ///   p_i and p_j are static pressure of particle i and j
      ///   w_ij is contact weight between particle i and j
      ///   w_i is sum of contact weight of particle i
      for(var t=0;t<this.m_def.staticPressureIterations;t++){///memset(m_accumulationBuffer, 0, sizeof(*m_accumulationBuffer) * m_count);
      for(var i=0;i<this.m_count;i++){this.m_accumulationBuffer[i]=0;}for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];if(contact.flags&exports.b2ParticleFlag.b2_staticPressureParticle){var a=contact.indexA;var b=contact.indexB;var w=contact.weight;this.m_accumulationBuffer[a]+=w*this.m_staticPressureBuffer[b];// a <- b
      this.m_accumulationBuffer[b]+=w*this.m_staticPressureBuffer[a];// b <- a
      }}for(var _i33=0;_i33<this.m_count;_i33++){var _w3=this.m_weightBuffer[_i33];if(this.m_flagsBuffer.data[_i33]&exports.b2ParticleFlag.b2_staticPressureParticle){var wh=this.m_accumulationBuffer[_i33];var h=(wh+pressurePerWeight*(_w3-b2_minParticleWeight))/(_w3+relaxation);this.m_staticPressureBuffer[_i33]=b2Clamp(h,0.0,maxPressure);}else {this.m_staticPressureBuffer[_i33]=0;}}}}},{key:"ComputeWeight",value:function ComputeWeight(){// calculates the sum of contact-weights for each particle
      // that means dimensionless density
      ///memset(m_weightBuffer, 0, sizeof(*m_weightBuffer) * m_count);
      for(var k=0;k<this.m_count;k++){this.m_weightBuffer[k]=0;}for(var _k9=0;_k9<this.m_bodyContactBuffer.count;_k9++){var contact=this.m_bodyContactBuffer.data[_k9];var a=contact.index;var w=contact.weight;this.m_weightBuffer[a]+=w;}for(var _k0=0;_k0<this.m_contactBuffer.count;_k0++){var _contact3=this.m_contactBuffer.data[_k0];var _a7=_contact3.indexA;var b=_contact3.indexB;var _w4=_contact3.weight;this.m_weightBuffer[_a7]+=_w4;this.m_weightBuffer[b]+=_w4;}}},{key:"SolvePressure",value:function SolvePressure(step){var s_f=b2ParticleSystem.SolvePressure_s_f;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;// calculates pressure as a linear function of density
      var criticalPressure=this.GetCriticalPressure(step);var pressurePerWeight=this.m_def.pressureStrength*criticalPressure;var maxPressure=b2_maxParticlePressure*criticalPressure;for(var i=0;i<this.m_count;i++){var w=this.m_weightBuffer[i];var h=pressurePerWeight*b2Max(0.0,w-b2_minParticleWeight);this.m_accumulationBuffer[i]=b2Min(h,maxPressure);}// ignores particles which have their own repulsive force
      if(this.m_allParticleFlags&b2ParticleSystem.k_noPressureFlags){for(var _i34=0;_i34<this.m_count;_i34++){if(this.m_flagsBuffer.data[_i34]&b2ParticleSystem.k_noPressureFlags){this.m_accumulationBuffer[_i34]=0;}}}// static pressure
      if(this.m_allParticleFlags&exports.b2ParticleFlag.b2_staticPressureParticle){// DEBUG: b2Assert(this.m_staticPressureBuffer !== null);
      for(var _i35=0;_i35<this.m_count;_i35++){if(this.m_flagsBuffer.data[_i35]&exports.b2ParticleFlag.b2_staticPressureParticle){this.m_accumulationBuffer[_i35]+=this.m_staticPressureBuffer[_i35];}}}// applies pressure between each particles in contact
      var velocityPerPressure=step.dt/(this.m_def.density*this.m_particleDiameter);var inv_mass=this.GetParticleInvMass();for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];var a=contact.index;var b=contact.body;var _w5=contact.weight;var m=contact.mass;var n=contact.normal;var p=pos_data[a];var _h=this.m_accumulationBuffer[a]+pressurePerWeight*_w5;///b2Vec2 f = velocityPerPressure * w * m * h * n;
      var f=b2Vec2.MulSV(velocityPerPressure*_w5*m*_h,n,s_f);///m_velocityBuffer.data[a] -= GetParticleInvMass() * f;
      vel_data[a].SelfMulSub(inv_mass,f);b.ApplyLinearImpulse(f,p,true);}for(var _k1=0;_k1<this.m_contactBuffer.count;_k1++){var _contact4=this.m_contactBuffer.data[_k1];var _a8=_contact4.indexA;var _b9=_contact4.indexB;var _w6=_contact4.weight;var _n=_contact4.normal;var _h2=this.m_accumulationBuffer[_a8]+this.m_accumulationBuffer[_b9];///b2Vec2 f = velocityPerPressure * w * h * n;
      var _f2=b2Vec2.MulSV(velocityPerPressure*_w6*_h2,_n,s_f);///m_velocityBuffer.data[a] -= f;
      vel_data[_a8].SelfSub(_f2);///m_velocityBuffer.data[b] += f;
      vel_data[_b9].SelfAdd(_f2);}}},{key:"SolveDamping",value:function SolveDamping(step){var s_v=b2ParticleSystem.SolveDamping_s_v;var s_f=b2ParticleSystem.SolveDamping_s_f;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;// reduces normal velocity of each contact
      var linearDamping=this.m_def.dampingStrength;var quadraticDamping=1/this.GetCriticalVelocity(step);var inv_mass=this.GetParticleInvMass();for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];var a=contact.index;var b=contact.body;var w=contact.weight;var m=contact.mass;var n=contact.normal;var p=pos_data[a];///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - m_velocityBuffer.data[a];
      var v=b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p,b2Vec2.s_t0),vel_data[a],s_v);var vn=b2Vec2.DotVV(v,n);if(vn<0){var damping=b2Max(linearDamping*w,b2Min(-quadraticDamping*vn,0.5));///b2Vec2 f = damping * m * vn * n;
      var f=b2Vec2.MulSV(damping*m*vn,n,s_f);///m_velocityBuffer.data[a] += GetParticleInvMass() * f;
      vel_data[a].SelfMulAdd(inv_mass,f);///b.ApplyLinearImpulse(-f, p, true);
      b.ApplyLinearImpulse(f.SelfNeg(),p,true);}}for(var _k10=0;_k10<this.m_contactBuffer.count;_k10++){var _contact5=this.m_contactBuffer.data[_k10];var _a9=_contact5.indexA;var _b0=_contact5.indexB;var _w7=_contact5.weight;var _n2=_contact5.normal;///b2Vec2 v = m_velocityBuffer.data[b] - m_velocityBuffer.data[a];
      var _v4=b2Vec2.SubVV(vel_data[_b0],vel_data[_a9],s_v);var _vn=b2Vec2.DotVV(_v4,_n2);if(_vn<0){///float32 damping = b2Max(linearDamping * w, b2Min(- quadraticDamping * vn, 0.5f));
      var _damping=b2Max(linearDamping*_w7,b2Min(-quadraticDamping*_vn,0.5));///b2Vec2 f = damping * vn * n;
      var _f3=b2Vec2.MulSV(_damping*_vn,_n2,s_f);///this.m_velocityBuffer.data[a] += f;
      vel_data[_a9].SelfAdd(_f3);///this.m_velocityBuffer.data[b] -= f;
      vel_data[_b0].SelfSub(_f3);}}}},{key:"SolveRigidDamping",value:function SolveRigidDamping(){var s_t0=b2ParticleSystem.SolveRigidDamping_s_t0;var s_t1=b2ParticleSystem.SolveRigidDamping_s_t1;var s_p=b2ParticleSystem.SolveRigidDamping_s_p;var s_v=b2ParticleSystem.SolveRigidDamping_s_v;var invMassA=[0.0],invInertiaA=[0.0],tangentDistanceA=[0.0];// TODO: static
      var invMassB=[0.0],invInertiaB=[0.0],tangentDistanceB=[0.0];// TODO: static
      // Apply impulse to rigid particle groups colliding with other objects
      // to reduce relative velocity at the colliding point.
      var pos_data=this.m_positionBuffer.data;var damping=this.m_def.dampingStrength;for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];var a=contact.index;var aGroup=this.m_groupBuffer[a];if(aGroup&&this.IsRigidGroup(aGroup)){var b=contact.body;var n=contact.normal;var w=contact.weight;var p=pos_data[a];///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - aGroup.GetLinearVelocityFromWorldPoint(p);
      var v=b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p,s_t0),aGroup.GetLinearVelocityFromWorldPoint(p,s_t1),s_v);var vn=b2Vec2.DotVV(v,n);if(vn<0){// The group's average velocity at particle position 'p' is pushing
      // the particle into the body.
      ///this.InitDampingParameterWithRigidGroupOrParticle(&invMassA, &invInertiaA, &tangentDistanceA, true, aGroup, a, p, n);
      this.InitDampingParameterWithRigidGroupOrParticle(invMassA,invInertiaA,tangentDistanceA,true,aGroup,a,p,n);// Calculate b.m_I from public functions of b2Body.
      ///this.InitDampingParameter(&invMassB, &invInertiaB, &tangentDistanceB, b.GetMass(), b.GetInertia() - b.GetMass() * b.GetLocalCenter().LengthSquared(), b.GetWorldCenter(), p, n);
      this.InitDampingParameter(invMassB,invInertiaB,tangentDistanceB,b.GetMass(),b.GetInertia()-b.GetMass()*b.GetLocalCenter().LengthSquared(),b.GetWorldCenter(),p,n);///float32 f = damping * b2Min(w, 1.0) * this.ComputeDampingImpulse(invMassA, invInertiaA, tangentDistanceA, invMassB, invInertiaB, tangentDistanceB, vn);
      var f=damping*b2Min(w,1.0)*this.ComputeDampingImpulse(invMassA[0],invInertiaA[0],tangentDistanceA[0],invMassB[0],invInertiaB[0],tangentDistanceB[0],vn);///this.ApplyDamping(invMassA, invInertiaA, tangentDistanceA, true, aGroup, a, f, n);
      this.ApplyDamping(invMassA[0],invInertiaA[0],tangentDistanceA[0],true,aGroup,a,f,n);///b.ApplyLinearImpulse(-f * n, p, true);
      b.ApplyLinearImpulse(b2Vec2.MulSV(-f,n,b2Vec2.s_t0),p,true);}}}for(var _k11=0;_k11<this.m_contactBuffer.count;_k11++){var _contact6=this.m_contactBuffer.data[_k11];var _a0=_contact6.indexA;var _b1=_contact6.indexB;var _n3=_contact6.normal;var _w8=_contact6.weight;var _aGroup=this.m_groupBuffer[_a0];var bGroup=this.m_groupBuffer[_b1];var aRigid=this.IsRigidGroup(_aGroup);var bRigid=this.IsRigidGroup(bGroup);if(_aGroup!==bGroup&&(aRigid||bRigid)){///b2Vec2 p = 0.5f * (this.m_positionBuffer.data[a] + this.m_positionBuffer.data[b]);
      var _p=b2Vec2.MidVV(pos_data[_a0],pos_data[_b1],s_p);///b2Vec2 v = GetLinearVelocity(bGroup, b, p) - GetLinearVelocity(aGroup, a, p);
      var _v5=b2Vec2.SubVV(this.GetLinearVelocity(bGroup,_b1,_p,s_t0),this.GetLinearVelocity(_aGroup,_a0,_p,s_t1),s_v);var _vn2=b2Vec2.DotVV(_v5,_n3);if(_vn2<0){///this.InitDampingParameterWithRigidGroupOrParticle(&invMassA, &invInertiaA, &tangentDistanceA, aRigid, aGroup, a, p, n);
      this.InitDampingParameterWithRigidGroupOrParticle(invMassA,invInertiaA,tangentDistanceA,aRigid,_aGroup,_a0,_p,_n3);///this.InitDampingParameterWithRigidGroupOrParticle(&invMassB, &invInertiaB, &tangentDistanceB, bRigid, bGroup, b, p, n);
      this.InitDampingParameterWithRigidGroupOrParticle(invMassB,invInertiaB,tangentDistanceB,bRigid,bGroup,_b1,_p,_n3);///float32 f = damping * w * this.ComputeDampingImpulse(invMassA, invInertiaA, tangentDistanceA, invMassB, invInertiaB, tangentDistanceB, vn);
      var _f4=damping*_w8*this.ComputeDampingImpulse(invMassA[0],invInertiaA[0],tangentDistanceA[0],invMassB[0],invInertiaB[0],tangentDistanceB[0],_vn2);///this.ApplyDamping(invMassA, invInertiaA, tangentDistanceA, aRigid, aGroup, a, f, n);
      this.ApplyDamping(invMassA[0],invInertiaA[0],tangentDistanceA[0],aRigid,_aGroup,_a0,_f4,_n3);///this.ApplyDamping(invMassB, invInertiaB, tangentDistanceB, bRigid, bGroup, b, -f, n);
      this.ApplyDamping(invMassB[0],invInertiaB[0],tangentDistanceB[0],bRigid,bGroup,_b1,-_f4,_n3);}}}}},{key:"SolveExtraDamping",value:function SolveExtraDamping(){var s_v=b2ParticleSystem.SolveExtraDamping_s_v;var s_f=b2ParticleSystem.SolveExtraDamping_s_f;var vel_data=this.m_velocityBuffer.data;// Applies additional damping force between bodies and particles which can
      // produce strong repulsive force. Applying damping force multiple times
      // is effective in suppressing vibration.
      var pos_data=this.m_positionBuffer.data;var inv_mass=this.GetParticleInvMass();for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];var a=contact.index;if(this.m_flagsBuffer.data[a]&b2ParticleSystem.k_extraDampingFlags){var b=contact.body;var m=contact.mass;var n=contact.normal;var p=pos_data[a];///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - m_velocityBuffer.data[a];
      var v=b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p,b2Vec2.s_t0),vel_data[a],s_v);///float32 vn = b2Dot(v, n);
      var vn=b2Vec2.DotVV(v,n);if(vn<0){///b2Vec2 f = 0.5f * m * vn * n;
      var f=b2Vec2.MulSV(0.5*m*vn,n,s_f);///m_velocityBuffer.data[a] += GetParticleInvMass() * f;
      vel_data[a].SelfMulAdd(inv_mass,f);///b.ApplyLinearImpulse(-f, p, true);
      b.ApplyLinearImpulse(f.SelfNeg(),p,true);}}}}},{key:"SolveWall",value:function SolveWall(){var vel_data=this.m_velocityBuffer.data;for(var i=0;i<this.m_count;i++){if(this.m_flagsBuffer.data[i]&exports.b2ParticleFlag.b2_wallParticle){vel_data[i].SetZero();}}}},{key:"SolveRigid",value:function SolveRigid(step){var s_position=b2ParticleSystem.SolveRigid_s_position;var s_rotation=b2ParticleSystem.SolveRigid_s_rotation;var s_transform=b2ParticleSystem.SolveRigid_s_transform;var s_velocityTransform=b2ParticleSystem.SolveRigid_s_velocityTransform;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;for(var group=this.m_groupList;group;group=group.GetNext()){if(group.m_groupFlags&exports.b2ParticleGroupFlag.b2_rigidParticleGroup){group.UpdateStatistics();///b2Rot rotation(step.dt * group.m_angularVelocity);
      var rotation=s_rotation;rotation.SetAngle(step.dt*group.m_angularVelocity);///b2Transform transform(group.m_center + step.dt * group.m_linearVelocity - b2Mul(rotation, group.m_center), rotation);
      var position=b2Vec2.AddVV(group.m_center,b2Vec2.SubVV(b2Vec2.MulSV(step.dt,group.m_linearVelocity,b2Vec2.s_t0),b2Rot.MulRV(rotation,group.m_center,b2Vec2.s_t1),b2Vec2.s_t0),s_position);var transform=s_transform;transform.SetPositionRotation(position,rotation);///group.m_transform = b2Mul(transform, group.m_transform);
      b2Transform.MulXX(transform,group.m_transform,group.m_transform);var velocityTransform=s_velocityTransform;velocityTransform.p.x=step.inv_dt*transform.p.x;velocityTransform.p.y=step.inv_dt*transform.p.y;velocityTransform.q.s=step.inv_dt*transform.q.s;velocityTransform.q.c=step.inv_dt*(transform.q.c-1);for(var i=group.m_firstIndex;i<group.m_lastIndex;i++){///m_velocityBuffer.data[i] = b2Mul(velocityTransform, m_positionBuffer.data[i]);
      b2Transform.MulXV(velocityTransform,pos_data[i],vel_data[i]);}}}}},{key:"SolveElastic",value:function SolveElastic(step){var s_pa=b2ParticleSystem.SolveElastic_s_pa;var s_pb=b2ParticleSystem.SolveElastic_s_pb;var s_pc=b2ParticleSystem.SolveElastic_s_pc;var s_r=b2ParticleSystem.SolveElastic_s_r;var s_t0=b2ParticleSystem.SolveElastic_s_t0;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;var elasticStrength=step.inv_dt*this.m_def.elasticStrength;for(var k=0;k<this.m_triadBuffer.count;k++){var triad=this.m_triadBuffer.data[k];if(triad.flags&exports.b2ParticleFlag.b2_elasticParticle){var a=triad.indexA;var b=triad.indexB;var c=triad.indexC;var oa=triad.pa;var ob=triad.pb;var oc=triad.pc;///b2Vec2 pa = m_positionBuffer.data[a];
      var pa=s_pa.Copy(pos_data[a]);///b2Vec2 pb = m_positionBuffer.data[b];
      var pb=s_pb.Copy(pos_data[b]);///b2Vec2 pc = m_positionBuffer.data[c];
      var pc=s_pc.Copy(pos_data[c]);var va=vel_data[a];var vb=vel_data[b];var vc=vel_data[c];///pa += step.dt * va;
      pa.SelfMulAdd(step.dt,va);///pb += step.dt * vb;
      pb.SelfMulAdd(step.dt,vb);///pc += step.dt * vc;
      pc.SelfMulAdd(step.dt,vc);///b2Vec2 midPoint = (float32) 1 / 3 * (pa + pb + pc);
      var midPoint_x=(pa.x+pb.x+pc.x)/3.0;var midPoint_y=(pa.y+pb.y+pc.y)/3.0;///pa -= midPoint;
      pa.x-=midPoint_x;pa.y-=midPoint_y;///pb -= midPoint;
      pb.x-=midPoint_x;pb.y-=midPoint_y;///pc -= midPoint;
      pc.x-=midPoint_x;pc.y-=midPoint_y;///b2Rot r;
      var r=s_r;r.s=b2Vec2.CrossVV(oa,pa)+b2Vec2.CrossVV(ob,pb)+b2Vec2.CrossVV(oc,pc);r.c=b2Vec2.DotVV(oa,pa)+b2Vec2.DotVV(ob,pb)+b2Vec2.DotVV(oc,pc);var r2=r.s*r.s+r.c*r.c;var invR=b2InvSqrt(r2);if(!isFinite(invR)){invR=1.98177537e+019;}r.s*=invR;r.c*=invR;///r.angle = Math.atan2(r.s, r.c); // TODO: optimize
      var strength=elasticStrength*triad.strength;///va += strength * (b2Mul(r, oa) - pa);
      b2Rot.MulRV(r,oa,s_t0);b2Vec2.SubVV(s_t0,pa,s_t0);b2Vec2.MulSV(strength,s_t0,s_t0);va.SelfAdd(s_t0);///vb += strength * (b2Mul(r, ob) - pb);
      b2Rot.MulRV(r,ob,s_t0);b2Vec2.SubVV(s_t0,pb,s_t0);b2Vec2.MulSV(strength,s_t0,s_t0);vb.SelfAdd(s_t0);///vc += strength * (b2Mul(r, oc) - pc);
      b2Rot.MulRV(r,oc,s_t0);b2Vec2.SubVV(s_t0,pc,s_t0);b2Vec2.MulSV(strength,s_t0,s_t0);vc.SelfAdd(s_t0);}}}},{key:"SolveSpring",value:function SolveSpring(step){var s_pa=b2ParticleSystem.SolveSpring_s_pa;var s_pb=b2ParticleSystem.SolveSpring_s_pb;var s_d=b2ParticleSystem.SolveSpring_s_d;var s_f=b2ParticleSystem.SolveSpring_s_f;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;var springStrength=step.inv_dt*this.m_def.springStrength;for(var k=0;k<this.m_pairBuffer.count;k++){var pair=this.m_pairBuffer.data[k];if(pair.flags&exports.b2ParticleFlag.b2_springParticle){///int32 a = pair.indexA;
      var a=pair.indexA;///int32 b = pair.indexB;
      var b=pair.indexB;///b2Vec2 pa = m_positionBuffer.data[a];
      var pa=s_pa.Copy(pos_data[a]);///b2Vec2 pb = m_positionBuffer.data[b];
      var pb=s_pb.Copy(pos_data[b]);///b2Vec2& va = m_velocityBuffer.data[a];
      var va=vel_data[a];///b2Vec2& vb = m_velocityBuffer.data[b];
      var vb=vel_data[b];///pa += step.dt * va;
      pa.SelfMulAdd(step.dt,va);///pb += step.dt * vb;
      pb.SelfMulAdd(step.dt,vb);///b2Vec2 d = pb - pa;
      var d=b2Vec2.SubVV(pb,pa,s_d);///float32 r0 = pair.distance;
      var r0=pair.distance;///float32 r1 = d.Length();
      var r1=d.Length();///float32 strength = springStrength * pair.strength;
      var strength=springStrength*pair.strength;///b2Vec2 f = strength * (r0 - r1) / r1 * d;
      var f=b2Vec2.MulSV(strength*(r0-r1)/r1,d,s_f);///va -= f;
      va.SelfSub(f);///vb += f;
      vb.SelfAdd(f);}}}},{key:"SolveTensile",value:function SolveTensile(step){var s_weightedNormal=b2ParticleSystem.SolveTensile_s_weightedNormal;var s_s=b2ParticleSystem.SolveTensile_s_s;var s_f=b2ParticleSystem.SolveTensile_s_f;var vel_data=this.m_velocityBuffer.data;// DEBUG: b2Assert(this.m_accumulation2Buffer !== null);
      for(var i=0;i<this.m_count;i++){this.m_accumulation2Buffer[i]=new b2Vec2();this.m_accumulation2Buffer[i].SetZero();}for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];if(contact.flags&exports.b2ParticleFlag.b2_tensileParticle){var a=contact.indexA;var b=contact.indexB;var w=contact.weight;var n=contact.normal;///b2Vec2 weightedNormal = (1 - w) * w * n;
      var weightedNormal=b2Vec2.MulSV((1-w)*w,n,s_weightedNormal);///m_accumulation2Buffer[a] -= weightedNormal;
      this.m_accumulation2Buffer[a].SelfSub(weightedNormal);///m_accumulation2Buffer[b] += weightedNormal;
      this.m_accumulation2Buffer[b].SelfAdd(weightedNormal);}}var criticalVelocity=this.GetCriticalVelocity(step);var pressureStrength=this.m_def.surfaceTensionPressureStrength*criticalVelocity;var normalStrength=this.m_def.surfaceTensionNormalStrength*criticalVelocity;var maxVelocityVariation=b2_maxParticleForce*criticalVelocity;for(var _k12=0;_k12<this.m_contactBuffer.count;_k12++){var _contact7=this.m_contactBuffer.data[_k12];if(_contact7.flags&exports.b2ParticleFlag.b2_tensileParticle){var _a1=_contact7.indexA;var _b10=_contact7.indexB;var _w9=_contact7.weight;var _n4=_contact7.normal;var h=this.m_weightBuffer[_a1]+this.m_weightBuffer[_b10];///b2Vec2 s = m_accumulation2Buffer[b] - m_accumulation2Buffer[a];
      var s=b2Vec2.SubVV(this.m_accumulation2Buffer[_b10],this.m_accumulation2Buffer[_a1],s_s);var fn=b2Min(pressureStrength*(h-2)+normalStrength*b2Vec2.DotVV(s,_n4),maxVelocityVariation)*_w9;///b2Vec2 f = fn * n;
      var f=b2Vec2.MulSV(fn,_n4,s_f);///m_velocityBuffer.data[a] -= f;
      vel_data[_a1].SelfSub(f);///m_velocityBuffer.data[b] += f;
      vel_data[_b10].SelfAdd(f);}}}},{key:"SolveViscous",value:function SolveViscous(){var s_v=b2ParticleSystem.SolveViscous_s_v;var s_f=b2ParticleSystem.SolveViscous_s_f;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;var viscousStrength=this.m_def.viscousStrength;var inv_mass=this.GetParticleInvMass();for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];var a=contact.index;if(this.m_flagsBuffer.data[a]&exports.b2ParticleFlag.b2_viscousParticle){var b=contact.body;var w=contact.weight;var m=contact.mass;var p=pos_data[a];///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - m_velocityBuffer.data[a];
      var v=b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p,b2Vec2.s_t0),vel_data[a],s_v);///b2Vec2 f = viscousStrength * m * w * v;
      var f=b2Vec2.MulSV(viscousStrength*m*w,v,s_f);///m_velocityBuffer.data[a] += GetParticleInvMass() * f;
      vel_data[a].SelfMulAdd(inv_mass,f);///b.ApplyLinearImpulse(-f, p, true);
      b.ApplyLinearImpulse(f.SelfNeg(),p,true);}}for(var _k13=0;_k13<this.m_contactBuffer.count;_k13++){var _contact8=this.m_contactBuffer.data[_k13];if(_contact8.flags&exports.b2ParticleFlag.b2_viscousParticle){var _a10=_contact8.indexA;var _b11=_contact8.indexB;var _w0=_contact8.weight;///b2Vec2 v = m_velocityBuffer.data[b] - m_velocityBuffer.data[a];
      var _v6=b2Vec2.SubVV(vel_data[_b11],vel_data[_a10],s_v);///b2Vec2 f = viscousStrength * w * v;
      var _f5=b2Vec2.MulSV(viscousStrength*_w0,_v6,s_f);///m_velocityBuffer.data[a] += f;
      vel_data[_a10].SelfAdd(_f5);///m_velocityBuffer.data[b] -= f;
      vel_data[_b11].SelfSub(_f5);}}}},{key:"SolveRepulsive",value:function SolveRepulsive(step){var s_f=b2ParticleSystem.SolveRepulsive_s_f;var vel_data=this.m_velocityBuffer.data;var repulsiveStrength=this.m_def.repulsiveStrength*this.GetCriticalVelocity(step);for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];if(contact.flags&exports.b2ParticleFlag.b2_repulsiveParticle){var a=contact.indexA;var b=contact.indexB;if(this.m_groupBuffer[a]!==this.m_groupBuffer[b]){var w=contact.weight;var n=contact.normal;///b2Vec2 f = repulsiveStrength * w * n;
      var f=b2Vec2.MulSV(repulsiveStrength*w,n,s_f);///m_velocityBuffer.data[a] -= f;
      vel_data[a].SelfSub(f);///m_velocityBuffer.data[b] += f;
      vel_data[b].SelfAdd(f);}}}}},{key:"SolvePowder",value:function SolvePowder(step){var s_f=b2ParticleSystem.SolvePowder_s_f;var pos_data=this.m_positionBuffer.data;var vel_data=this.m_velocityBuffer.data;var powderStrength=this.m_def.powderStrength*this.GetCriticalVelocity(step);var minWeight=1.0-b2_particleStride;var inv_mass=this.GetParticleInvMass();for(var k=0;k<this.m_bodyContactBuffer.count;k++){var contact=this.m_bodyContactBuffer.data[k];var a=contact.index;if(this.m_flagsBuffer.data[a]&exports.b2ParticleFlag.b2_powderParticle){var w=contact.weight;if(w>minWeight){var b=contact.body;var m=contact.mass;var p=pos_data[a];var n=contact.normal;var f=b2Vec2.MulSV(powderStrength*m*(w-minWeight),n,s_f);vel_data[a].SelfMulSub(inv_mass,f);b.ApplyLinearImpulse(f,p,true);}}}for(var _k14=0;_k14<this.m_contactBuffer.count;_k14++){var _contact9=this.m_contactBuffer.data[_k14];if(_contact9.flags&exports.b2ParticleFlag.b2_powderParticle){var _w1=_contact9.weight;if(_w1>minWeight){var _a11=_contact9.indexA;var _b12=_contact9.indexB;var _n5=_contact9.normal;var _f6=b2Vec2.MulSV(powderStrength*(_w1-minWeight),_n5,s_f);vel_data[_a11].SelfSub(_f6);vel_data[_b12].SelfAdd(_f6);}}}}},{key:"SolveSolid",value:function SolveSolid(step){var s_f=b2ParticleSystem.SolveSolid_s_f;var vel_data=this.m_velocityBuffer.data;// applies extra repulsive force from solid particle groups
      this.m_depthBuffer=this.RequestBuffer(this.m_depthBuffer);var ejectionStrength=step.inv_dt*this.m_def.ejectionStrength;for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];var a=contact.indexA;var b=contact.indexB;if(this.m_groupBuffer[a]!==this.m_groupBuffer[b]){var w=contact.weight;var n=contact.normal;var h=this.m_depthBuffer[a]+this.m_depthBuffer[b];var f=b2Vec2.MulSV(ejectionStrength*h*w,n,s_f);vel_data[a].SelfSub(f);vel_data[b].SelfAdd(f);}}}},{key:"SolveForce",value:function SolveForce(step){var vel_data=this.m_velocityBuffer.data;var velocityPerForce=step.dt*this.GetParticleInvMass();for(var i=0;i<this.m_count;i++){///m_velocityBuffer.data[i] += velocityPerForce * m_forceBuffer[i];
      vel_data[i].SelfMulAdd(velocityPerForce,this.m_forceBuffer[i]);}this.m_hasForce=false;}},{key:"SolveColorMixing",value:function SolveColorMixing(){// mixes color between contacting particles
      var colorMixing=0.5*this.m_def.colorMixingStrength;if(colorMixing){for(var k=0;k<this.m_contactBuffer.count;k++){var contact=this.m_contactBuffer.data[k];var a=contact.indexA;var b=contact.indexB;if(this.m_flagsBuffer.data[a]&this.m_flagsBuffer.data[b]&exports.b2ParticleFlag.b2_colorMixingParticle){var colorA=this.m_colorBuffer.data[a];var colorB=this.m_colorBuffer.data[b];// Use the static method to ensure certain compilers inline
      // this correctly.
      b2Color.MixColors(colorA,colorB,colorMixing);}}}}},{key:"SolveZombie",value:function SolveZombie(){// removes particles with zombie flag
      var newCount=0;var newIndices=[];// TODO: static
      for(var i=0;i<this.m_count;i++){newIndices[i]=b2_invalidParticleIndex;}// DEBUG: b2Assert(newIndices.length === this.m_count);
      var allParticleFlags=0;for(var _i36=0;_i36<this.m_count;_i36++){var flags=this.m_flagsBuffer.data[_i36];if(flags&exports.b2ParticleFlag.b2_zombieParticle){var destructionListener=this.m_world.m_destructionListener;if(flags&exports.b2ParticleFlag.b2_destructionListenerParticle&&destructionListener){destructionListener.SayGoodbyeParticle(this,_i36);}// Destroy particle handle.
      if(this.m_handleIndexBuffer.data){var handle=this.m_handleIndexBuffer.data[_i36];if(handle){handle.SetIndex(b2_invalidParticleIndex);this.m_handleIndexBuffer.data[_i36]=null;///m_handleAllocator.Free(handle);
      }}newIndices[_i36]=b2_invalidParticleIndex;}else {newIndices[_i36]=newCount;if(_i36!==newCount){// Update handle to reference new particle index.
      if(this.m_handleIndexBuffer.data){var _handle=this.m_handleIndexBuffer.data[_i36];if(_handle){_handle.SetIndex(newCount);}this.m_handleIndexBuffer.data[newCount]=_handle;}this.m_flagsBuffer.data[newCount]=this.m_flagsBuffer.data[_i36];if(this.m_lastBodyContactStepBuffer.data){this.m_lastBodyContactStepBuffer.data[newCount]=this.m_lastBodyContactStepBuffer.data[_i36];}if(this.m_bodyContactCountBuffer.data){this.m_bodyContactCountBuffer.data[newCount]=this.m_bodyContactCountBuffer.data[_i36];}if(this.m_consecutiveContactStepsBuffer.data){this.m_consecutiveContactStepsBuffer.data[newCount]=this.m_consecutiveContactStepsBuffer.data[_i36];}this.m_positionBuffer.data[newCount].Copy(this.m_positionBuffer.data[_i36]);this.m_velocityBuffer.data[newCount].Copy(this.m_velocityBuffer.data[_i36]);this.m_groupBuffer[newCount]=this.m_groupBuffer[_i36];if(this.m_hasForce){this.m_forceBuffer[newCount].Copy(this.m_forceBuffer[_i36]);}if(this.m_staticPressureBuffer){this.m_staticPressureBuffer[newCount]=this.m_staticPressureBuffer[_i36];}if(this.m_depthBuffer){this.m_depthBuffer[newCount]=this.m_depthBuffer[_i36];}if(this.m_colorBuffer.data){this.m_colorBuffer.data[newCount].Copy(this.m_colorBuffer.data[_i36]);}if(this.m_userDataBuffer.data){this.m_userDataBuffer.data[newCount]=this.m_userDataBuffer.data[_i36];}if(this.m_expirationTimeBuffer.data){this.m_expirationTimeBuffer.data[newCount]=this.m_expirationTimeBuffer.data[_i36];}}newCount++;allParticleFlags|=flags;}}// predicate functions
      var Test={///static bool IsProxyInvalid(const Proxy& proxy)
      IsProxyInvalid:function IsProxyInvalid(proxy){return proxy.index<0;},///static bool IsContactInvalid(const b2ParticleContact& contact)
      IsContactInvalid:function IsContactInvalid(contact){return contact.indexA<0||contact.indexB<0;},///static bool IsBodyContactInvalid(const b2ParticleBodyContact& contact)
      IsBodyContactInvalid:function IsBodyContactInvalid(contact){return contact.index<0;},///static bool IsPairInvalid(const b2ParticlePair& pair)
      IsPairInvalid:function IsPairInvalid(pair){return pair.indexA<0||pair.indexB<0;},///static bool IsTriadInvalid(const b2ParticleTriad& triad)
      IsTriadInvalid:function IsTriadInvalid(triad){return triad.indexA<0||triad.indexB<0||triad.indexC<0;}};// update proxies
      for(var k=0;k<this.m_proxyBuffer.count;k++){var proxy=this.m_proxyBuffer.data[k];proxy.index=newIndices[proxy.index];}this.m_proxyBuffer.RemoveIf(Test.IsProxyInvalid);// update contacts
      for(var _k15=0;_k15<this.m_contactBuffer.count;_k15++){var contact=this.m_contactBuffer.data[_k15];contact.indexA=newIndices[contact.indexA];contact.indexB=newIndices[contact.indexB];}this.m_contactBuffer.RemoveIf(Test.IsContactInvalid);// update particle-body contacts
      for(var _k16=0;_k16<this.m_bodyContactBuffer.count;_k16++){var _contact0=this.m_bodyContactBuffer.data[_k16];_contact0.index=newIndices[_contact0.index];}this.m_bodyContactBuffer.RemoveIf(Test.IsBodyContactInvalid);// update pairs
      for(var _k17=0;_k17<this.m_pairBuffer.count;_k17++){var pair=this.m_pairBuffer.data[_k17];pair.indexA=newIndices[pair.indexA];pair.indexB=newIndices[pair.indexB];}this.m_pairBuffer.RemoveIf(Test.IsPairInvalid);// update triads
      for(var _k18=0;_k18<this.m_triadBuffer.count;_k18++){var triad=this.m_triadBuffer.data[_k18];triad.indexA=newIndices[triad.indexA];triad.indexB=newIndices[triad.indexB];triad.indexC=newIndices[triad.indexC];}this.m_triadBuffer.RemoveIf(Test.IsTriadInvalid);// Update lifetime indices.
      if(this.m_indexByExpirationTimeBuffer.data){var writeOffset=0;for(var readOffset=0;readOffset<this.m_count;readOffset++){var newIndex=newIndices[this.m_indexByExpirationTimeBuffer.data[readOffset]];if(newIndex!==b2_invalidParticleIndex){this.m_indexByExpirationTimeBuffer.data[writeOffset++]=newIndex;}}}// update groups
      for(var group=this.m_groupList;group;group=group.GetNext()){var firstIndex=newCount;var lastIndex=0;var modified=false;for(var _i37=group.m_firstIndex;_i37<group.m_lastIndex;_i37++){var j=newIndices[_i37];if(j>=0){firstIndex=b2Min(firstIndex,j);lastIndex=b2Max(lastIndex,j+1);}else {modified=true;}}if(firstIndex<lastIndex){group.m_firstIndex=firstIndex;group.m_lastIndex=lastIndex;if(modified){if(group.m_groupFlags&exports.b2ParticleGroupFlag.b2_solidParticleGroup){this.SetGroupFlags(group,group.m_groupFlags|exports.b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth);}}}else {group.m_firstIndex=0;group.m_lastIndex=0;if(!(group.m_groupFlags&exports.b2ParticleGroupFlag.b2_particleGroupCanBeEmpty)){this.SetGroupFlags(group,group.m_groupFlags|exports.b2ParticleGroupFlag.b2_particleGroupWillBeDestroyed);}}}// update particle count
      this.m_count=newCount;this.m_allParticleFlags=allParticleFlags;this.m_needsUpdateAllParticleFlags=false;// destroy bodies with no particles
      for(var _group3=this.m_groupList;_group3;){var next=_group3.GetNext();if(_group3.m_groupFlags&exports.b2ParticleGroupFlag.b2_particleGroupWillBeDestroyed){this.DestroyParticleGroup(_group3);}_group3=next;}}/**
             * Destroy all particles which have outlived their lifetimes set
             * by SetParticleLifetime().
             */},{key:"SolveLifetimes",value:function SolveLifetimes(step){// Update the time elapsed.
      this.m_timeElapsed=this.LifetimeToExpirationTime(step.dt);// Get the floor (non-fractional component) of the elapsed time.
      var quantizedTimeElapsed=this.GetQuantizedTimeElapsed();var expirationTimes=this.m_expirationTimeBuffer.data;var expirationTimeIndices=this.m_indexByExpirationTimeBuffer.data;var particleCount=this.GetParticleCount();// Sort the lifetime buffer if it's required.
      if(this.m_expirationTimeBufferRequiresSorting){///const ExpirationTimeComparator expirationTimeComparator(expirationTimes);
      ///std::sort(expirationTimeIndices, expirationTimeIndices + particleCount, expirationTimeComparator);
      /**
                     * Compare the lifetime of particleIndexA and particleIndexB
                     * returning true if the lifetime of A is greater than B for
                     * particles that will expire.  If either particle's lifetime is
                     * infinite (<= 0.0f) this function return true if the lifetime
                     * of A is lesser than B. When used with std::sort() this
                     * results in an array of particle indicies sorted in reverse
                     * order by particle lifetime.
                     *
                     * For example, the set of lifetimes
                     * (1.0, 0.7, 0.3, 0.0, -1.0, 2.0)
                     * would be sorted as
                     * (0.0, 1.0, -2.0, 1.0, 0.7, 0.3)
                     */var ExpirationTimeComparator=function ExpirationTimeComparator(particleIndexA,particleIndexB){var expirationTimeA=expirationTimes[particleIndexA];var expirationTimeB=expirationTimes[particleIndexB];var infiniteExpirationTimeA=expirationTimeA<=0.0;var infiniteExpirationTimeB=expirationTimeB<=0.0;return infiniteExpirationTimeA===infiniteExpirationTimeB?expirationTimeA>expirationTimeB:infiniteExpirationTimeA;};std_sort$1(expirationTimeIndices,0,particleCount,ExpirationTimeComparator);this.m_expirationTimeBufferRequiresSorting=false;}// Destroy particles which have expired.
      for(var i=particleCount-1;i>=0;--i){var particleIndex=expirationTimeIndices[i];var expirationTime=expirationTimes[particleIndex];// If no particles need to be destroyed, skip this.
      if(quantizedTimeElapsed<expirationTime||expirationTime<=0){break;}// Destroy this particle.
      this.DestroyParticle(particleIndex);}}},{key:"RotateBuffer",value:function RotateBuffer(start,mid,end){// move the particles assigned to the given group toward the end of array
      if(start===mid||mid===end){return;}// DEBUG: b2Assert(mid >= start && mid <= end);
      function newIndices(i){if(i<start){return i;}else if(i<mid){return i+end-mid;}else if(i<end){return i+start-mid;}else {return i;}}///std::rotate(m_flagsBuffer.data + start, m_flagsBuffer.data + mid, m_flagsBuffer.data + end);
      std_rotate(this.m_flagsBuffer.data,start,mid,end);if(this.m_lastBodyContactStepBuffer.data){///std::rotate(m_lastBodyContactStepBuffer.data + start, m_lastBodyContactStepBuffer.data + mid, m_lastBodyContactStepBuffer.data + end);
      std_rotate(this.m_lastBodyContactStepBuffer.data,start,mid,end);}if(this.m_bodyContactCountBuffer.data){///std::rotate(m_bodyContactCountBuffer.data + start, m_bodyContactCountBuffer.data + mid, m_bodyContactCountBuffer.data + end);
      std_rotate(this.m_bodyContactCountBuffer.data,start,mid,end);}if(this.m_consecutiveContactStepsBuffer.data){///std::rotate(m_consecutiveContactStepsBuffer.data + start, m_consecutiveContactStepsBuffer.data + mid, m_consecutiveContactStepsBuffer.data + end);
      std_rotate(this.m_consecutiveContactStepsBuffer.data,start,mid,end);}///std::rotate(m_positionBuffer.data + start, m_positionBuffer.data + mid, m_positionBuffer.data + end);
      std_rotate(this.m_positionBuffer.data,start,mid,end);///std::rotate(m_velocityBuffer.data + start, m_velocityBuffer.data + mid, m_velocityBuffer.data + end);
      std_rotate(this.m_velocityBuffer.data,start,mid,end);///std::rotate(m_groupBuffer + start, m_groupBuffer + mid, m_groupBuffer + end);
      std_rotate(this.m_groupBuffer,start,mid,end);if(this.m_hasForce){///std::rotate(m_forceBuffer + start, m_forceBuffer + mid, m_forceBuffer + end);
      std_rotate(this.m_forceBuffer,start,mid,end);}if(this.m_staticPressureBuffer){///std::rotate(m_staticPressureBuffer + start, m_staticPressureBuffer + mid, m_staticPressureBuffer + end);
      std_rotate(this.m_staticPressureBuffer,start,mid,end);}if(this.m_depthBuffer){///std::rotate(m_depthBuffer + start, m_depthBuffer + mid, m_depthBuffer + end);
      std_rotate(this.m_depthBuffer,start,mid,end);}if(this.m_colorBuffer.data){///std::rotate(m_colorBuffer.data + start, m_colorBuffer.data + mid, m_colorBuffer.data + end);
      std_rotate(this.m_colorBuffer.data,start,mid,end);}if(this.m_userDataBuffer.data){///std::rotate(m_userDataBuffer.data + start, m_userDataBuffer.data + mid, m_userDataBuffer.data + end);
      std_rotate(this.m_userDataBuffer.data,start,mid,end);}// Update handle indices.
      if(this.m_handleIndexBuffer.data){///std::rotate(m_handleIndexBuffer.data + start, m_handleIndexBuffer.data + mid, m_handleIndexBuffer.data + end);
      std_rotate(this.m_handleIndexBuffer.data,start,mid,end);for(var i=start;i<end;++i){var handle=this.m_handleIndexBuffer.data[i];if(handle){handle.SetIndex(newIndices(handle.GetIndex()));}}}if(this.m_expirationTimeBuffer.data){///std::rotate(m_expirationTimeBuffer.data + start, m_expirationTimeBuffer.data + mid, m_expirationTimeBuffer.data + end);
      std_rotate(this.m_expirationTimeBuffer.data,start,mid,end);// Update expiration time buffer indices.
      var particleCount=this.GetParticleCount();var indexByExpirationTime=this.m_indexByExpirationTimeBuffer.data;for(var _i38=0;_i38<particleCount;++_i38){indexByExpirationTime[_i38]=newIndices(indexByExpirationTime[_i38]);}}// update proxies
      for(var k=0;k<this.m_proxyBuffer.count;k++){var proxy=this.m_proxyBuffer.data[k];proxy.index=newIndices(proxy.index);}// update contacts
      for(var _k19=0;_k19<this.m_contactBuffer.count;_k19++){var contact=this.m_contactBuffer.data[_k19];contact.indexA=newIndices(contact.indexA);contact.indexB=newIndices(contact.indexB);}// update particle-body contacts
      for(var _k20=0;_k20<this.m_bodyContactBuffer.count;_k20++){var _contact1=this.m_bodyContactBuffer.data[_k20];_contact1.index=newIndices(_contact1.index);}// update pairs
      for(var _k21=0;_k21<this.m_pairBuffer.count;_k21++){var pair=this.m_pairBuffer.data[_k21];pair.indexA=newIndices(pair.indexA);pair.indexB=newIndices(pair.indexB);}// update triads
      for(var _k22=0;_k22<this.m_triadBuffer.count;_k22++){var triad=this.m_triadBuffer.data[_k22];triad.indexA=newIndices(triad.indexA);triad.indexB=newIndices(triad.indexB);triad.indexC=newIndices(triad.indexC);}// update groups
      for(var group=this.m_groupList;group;group=group.GetNext()){group.m_firstIndex=newIndices(group.m_firstIndex);group.m_lastIndex=newIndices(group.m_lastIndex-1)+1;}}},{key:"GetCriticalVelocity",value:function GetCriticalVelocity(step){return this.m_particleDiameter*step.inv_dt;}},{key:"GetCriticalVelocitySquared",value:function GetCriticalVelocitySquared(step){var velocity=this.GetCriticalVelocity(step);return velocity*velocity;}},{key:"GetCriticalPressure",value:function GetCriticalPressure(step){return this.m_def.density*this.GetCriticalVelocitySquared(step);}},{key:"GetParticleStride",value:function GetParticleStride(){return b2_particleStride*this.m_particleDiameter;}},{key:"GetParticleMass",value:function GetParticleMass(){var stride=this.GetParticleStride();return this.m_def.density*stride*stride;}},{key:"GetParticleInvMass",value:function GetParticleInvMass(){///return 1.777777 * this.m_inverseDensity * this.m_inverseDiameter * this.m_inverseDiameter;
      // mass = density * stride^2, so we take the inverse of this.
      var inverseStride=this.m_inverseDiameter*(1.0/b2_particleStride);return this.m_inverseDensity*inverseStride*inverseStride;}/**
             * Get the world's contact filter if any particles with the
             * b2_contactFilterParticle flag are present in the system.
             */},{key:"GetFixtureContactFilter",value:function GetFixtureContactFilter(){return this.m_allParticleFlags&exports.b2ParticleFlag.b2_fixtureContactFilterParticle?this.m_world.m_contactManager.m_contactFilter:null;}/**
             * Get the world's contact filter if any particles with the
             * b2_particleContactFilterParticle flag are present in the
             * system.
             */},{key:"GetParticleContactFilter",value:function GetParticleContactFilter(){return this.m_allParticleFlags&exports.b2ParticleFlag.b2_particleContactFilterParticle?this.m_world.m_contactManager.m_contactFilter:null;}/**
             * Get the world's contact listener if any particles with the
             * b2_fixtureContactListenerParticle flag are present in the
             * system.
             */},{key:"GetFixtureContactListener",value:function GetFixtureContactListener(){return this.m_allParticleFlags&exports.b2ParticleFlag.b2_fixtureContactListenerParticle?this.m_world.m_contactManager.m_contactListener:null;}/**
             * Get the world's contact listener if any particles with the
             * b2_particleContactListenerParticle flag are present in the
             * system.
             */},{key:"GetParticleContactListener",value:function GetParticleContactListener(){return this.m_allParticleFlags&exports.b2ParticleFlag.b2_particleContactListenerParticle?this.m_world.m_contactManager.m_contactListener:null;}},{key:"SetUserOverridableBuffer",value:function SetUserOverridableBuffer(buffer,data){buffer.data=data;buffer.userSuppliedCapacity=data.length;}},{key:"SetGroupFlags",value:function SetGroupFlags(group,newFlags){var oldFlags=group.m_groupFlags;if((oldFlags^newFlags)&exports.b2ParticleGroupFlag.b2_solidParticleGroup){// If the b2_solidParticleGroup flag changed schedule depth update.
      newFlags|=exports.b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth;}if(oldFlags&~newFlags){// If any flags might be removed
      this.m_needsUpdateAllGroupFlags=true;}if(~this.m_allGroupFlags&newFlags){// If any flags were added
      if(newFlags&exports.b2ParticleGroupFlag.b2_solidParticleGroup){this.m_depthBuffer=this.RequestBuffer(this.m_depthBuffer);}this.m_allGroupFlags|=newFlags;}group.m_groupFlags=newFlags;}},{key:"RemoveSpuriousBodyContacts",value:function RemoveSpuriousBodyContacts(){// At this point we have a list of contact candidates based on AABB
      // overlap.The AABB query that  generated this returns all collidable
      // fixtures overlapping particle bounding boxes.  This breaks down around
      // vertices where two shapes intersect, such as a "ground" surface made
      // of multiple b2PolygonShapes; it potentially applies a lot of spurious
      // impulses from normals that should not actually contribute.  See the
      // Ramp example in Testbed.
      //
      // To correct for this, we apply this algorithm:
      //   * sort contacts by particle and subsort by weight (nearest to farthest)
      //   * for each contact per particle:
      //      - project a point at the contact distance along the inverse of the
      //        contact normal
      //      - if this intersects the fixture that generated the contact, apply
      //         it, otherwise discard as impossible
      //      - repeat for up to n nearest contacts, currently we get good results
      //        from n=3.
      ///std::sort(m_bodyContactBuffer.Begin(), m_bodyContactBuffer.End(), b2ParticleSystem::BodyContactCompare);
      std_sort$1(this.m_bodyContactBuffer.data,0,this.m_bodyContactBuffer.count,b2ParticleSystem.BodyContactCompare);///int32 discarded = 0;
      ///std::remove_if(m_bodyContactBuffer.Begin(), m_bodyContactBuffer.End(), b2ParticleBodyContactRemovePredicate(this, &discarded));
      ///
      ///m_bodyContactBuffer.SetCount(m_bodyContactBuffer.GetCount() - discarded);
      var s_n=b2ParticleSystem.RemoveSpuriousBodyContacts_s_n;var s_pos=b2ParticleSystem.RemoveSpuriousBodyContacts_s_pos;var s_normal=b2ParticleSystem.RemoveSpuriousBodyContacts_s_normal;// Max number of contacts processed per particle, from nearest to farthest.
      // This must be at least 2 for correctness with concave shapes; 3 was
      // experimentally arrived at as looking reasonable.
      var k_maxContactsPerPoint=3;var system=this;// Index of last particle processed.
      var lastIndex=-1;// Number of contacts processed for the current particle.
      var currentContacts=0;// Output the number of discarded contacts.
      // let discarded = 0;
      var b2ParticleBodyContactRemovePredicate=function b2ParticleBodyContactRemovePredicate(contact){// This implements the selection criteria described in
      // RemoveSpuriousBodyContacts().
      // This functor is iterating through a list of Body contacts per
      // Particle, ordered from near to far.  For up to the maximum number of
      // contacts we allow per point per step, we verify that the contact
      // normal of the Body that genenerated the contact makes physical sense
      // by projecting a point back along that normal and seeing if it
      // intersects the fixture generating the contact.
      if(contact.index!==lastIndex){currentContacts=0;lastIndex=contact.index;}if(currentContacts++>k_maxContactsPerPoint){// ++discarded;
      return true;}// Project along inverse normal (as returned in the contact) to get the
      // point to check.
      ///b2Vec2 n = contact.normal;
      var n=s_n.Copy(contact.normal);// weight is 1-(inv(diameter) * distance)
      ///n *= system.m_particleDiameter * (1 - contact.weight);
      n.SelfMul(system.m_particleDiameter*(1-contact.weight));///b2Vec2 pos = system.m_positionBuffer.data[contact.index] + n;
      var pos=b2Vec2.AddVV(system.m_positionBuffer.data[contact.index],n,s_pos);// pos is now a point projected back along the contact normal to the
      // contact distance. If the surface makes sense for a contact, pos will
      // now lie on or in the fixture generating
      if(!contact.fixture.TestPoint(pos)){var childCount=contact.fixture.GetShape().GetChildCount();for(var childIndex=0;childIndex<childCount;childIndex++){var normal=s_normal;var distance=contact.fixture.ComputeDistance(pos,normal,childIndex);if(distance<b2_linearSlop){return false;}}// ++discarded;
      return true;}return false;};this.m_bodyContactBuffer.count=std_remove_if(this.m_bodyContactBuffer.data,b2ParticleBodyContactRemovePredicate,this.m_bodyContactBuffer.count);}},{key:"DetectStuckParticle",value:function DetectStuckParticle(particle){// Detect stuck particles
      //
      // The basic algorithm is to allow the user to specify an optional
      // threshold where we detect whenever a particle is contacting
      // more than one fixture for more than threshold consecutive
      // steps. This is considered to be "stuck", and these are put
      // in a list the user can query per step, if enabled, to deal with
      // such particles.
      if(this.m_stuckThreshold<=0){return;}// Get the state variables for this particle.
      ///int32 * const consecutiveCount = &m_consecutiveContactStepsBuffer.data[particle];
      ///int32 * const lastStep = &m_lastBodyContactStepBuffer.data[particle];
      ///int32 * const bodyCount = &m_bodyContactCountBuffer.data[particle];
      // This is only called when there is a body contact for this particle.
      ///++(*bodyCount);
      ++this.m_bodyContactCountBuffer.data[particle];// We want to only trigger detection once per step, the first time we
      // contact more than one fixture in a step for a given particle.
      ///if (*bodyCount === 2)
      if(this.m_bodyContactCountBuffer.data[particle]===2){///++(*consecutiveCount);
      ++this.m_consecutiveContactStepsBuffer.data[particle];///if (*consecutiveCount > m_stuckThreshold)
      if(this.m_consecutiveContactStepsBuffer.data[particle]>this.m_stuckThreshold){///int32& newStuckParticle = m_stuckParticleBuffer.Append();
      ///newStuckParticle = particle;
      this.m_stuckParticleBuffer.data[this.m_stuckParticleBuffer.Append()]=particle;}}///*lastStep = m_timestamp;
      this.m_lastBodyContactStepBuffer.data[particle]=this.m_timestamp;}/**
             * Determine whether a particle index is valid.
             */},{key:"ValidateParticleIndex",value:function ValidateParticleIndex(index){return index>=0&&index<this.GetParticleCount()&&index!==b2_invalidParticleIndex;}/**
             * Get the time elapsed in
             * b2ParticleSystemDef::lifetimeGranularity.
             */},{key:"GetQuantizedTimeElapsed",value:function GetQuantizedTimeElapsed(){///return (int32)(m_timeElapsed >> 32);
      return Math.floor(this.m_timeElapsed/0x100000000);}/**
             * Convert a lifetime in seconds to an expiration time.
             */},{key:"LifetimeToExpirationTime",value:function LifetimeToExpirationTime(lifetime){///return m_timeElapsed + (int64)((lifetime / m_def.lifetimeGranularity) * (float32)(1LL << 32));
      return this.m_timeElapsed+Math.floor(lifetime/this.m_def.lifetimeGranularity*0x100000000);}},{key:"ForceCanBeApplied",value:function ForceCanBeApplied(flags){return !(flags&exports.b2ParticleFlag.b2_wallParticle);}},{key:"PrepareForceBuffer",value:function PrepareForceBuffer(){if(!this.m_hasForce){///memset(m_forceBuffer, 0, sizeof(*m_forceBuffer) * m_count);
      for(var i=0;i<this.m_count;i++){this.m_forceBuffer[i].SetZero();}this.m_hasForce=true;}}},{key:"IsRigidGroup",value:function IsRigidGroup(group){return group!==null&&(group.m_groupFlags&exports.b2ParticleGroupFlag.b2_rigidParticleGroup)!==0;}},{key:"GetLinearVelocity",value:function GetLinearVelocity(group,particleIndex,point,out){if(group&&this.IsRigidGroup(group)){return group.GetLinearVelocityFromWorldPoint(point,out);}else {///return m_velocityBuffer.data[particleIndex];
      return out.Copy(this.m_velocityBuffer.data[particleIndex]);}}},{key:"InitDampingParameter",value:function InitDampingParameter(invMass,invInertia,tangentDistance,mass,inertia,center,point,normal){///*invMass = mass > 0 ? 1 / mass : 0;
      invMass[0]=mass>0?1/mass:0;///*invInertia = inertia > 0 ? 1 / inertia : 0;
      invInertia[0]=inertia>0?1/inertia:0;///*tangentDistance = b2Cross(point - center, normal);
      tangentDistance[0]=b2Vec2.CrossVV(b2Vec2.SubVV(point,center,b2Vec2.s_t0),normal);}},{key:"InitDampingParameterWithRigidGroupOrParticle",value:function InitDampingParameterWithRigidGroupOrParticle(invMass,invInertia,tangentDistance,isRigidGroup,group,particleIndex,point,normal){if(group&&isRigidGroup){this.InitDampingParameter(invMass,invInertia,tangentDistance,group.GetMass(),group.GetInertia(),group.GetCenter(),point,normal);}else {var flags=this.m_flagsBuffer.data[particleIndex];this.InitDampingParameter(invMass,invInertia,tangentDistance,flags&exports.b2ParticleFlag.b2_wallParticle?0:this.GetParticleMass(),0,point,point,normal);}}},{key:"ComputeDampingImpulse",value:function ComputeDampingImpulse(invMassA,invInertiaA,tangentDistanceA,invMassB,invInertiaB,tangentDistanceB,normalVelocity){var invMass=invMassA+invInertiaA*tangentDistanceA*tangentDistanceA+invMassB+invInertiaB*tangentDistanceB*tangentDistanceB;return invMass>0?normalVelocity/invMass:0;}},{key:"ApplyDamping",value:function ApplyDamping(invMass,invInertia,tangentDistance,isRigidGroup,group,particleIndex,impulse,normal){if(group&&isRigidGroup){///group.m_linearVelocity += impulse * invMass * normal;
      group.m_linearVelocity.SelfMulAdd(impulse*invMass,normal);///group.m_angularVelocity += impulse * tangentDistance * invInertia;
      group.m_angularVelocity+=impulse*tangentDistance*invInertia;}else {///m_velocityBuffer.data[particleIndex] += impulse * invMass * normal;
      this.m_velocityBuffer.data[particleIndex].SelfMulAdd(impulse*invMass,normal);}}}],[{key:"computeTag",value:function computeTag(x,y){///return ((uint32)(y + yOffset) << yShift) + (uint32)(xScale * x + xOffset);
      return (y+b2ParticleSystem.yOffset>>>0<<b2ParticleSystem.yShift)+(b2ParticleSystem.xScale*x+b2ParticleSystem.xOffset>>>0)>>>0;}},{key:"computeRelativeTag",value:function computeRelativeTag(tag,x,y){///return tag + (y << yShift) + (x << xShift);
      return tag+(y<<b2ParticleSystem.yShift)+(x<<b2ParticleSystem.xShift)>>>0;}},{key:"IsSignificantForce",value:function IsSignificantForce(force){return force.x!==0||force.y!==0;}},{key:"ParticleCanBeConnected",value:function ParticleCanBeConnected(flags,group){return (flags&(exports.b2ParticleFlag.b2_wallParticle|exports.b2ParticleFlag.b2_springParticle|exports.b2ParticleFlag.b2_elasticParticle))!==0||group!==null&&(group.GetGroupFlags()&exports.b2ParticleGroupFlag.b2_rigidParticleGroup)!==0;}},{key:"ComparePairIndices",value:function ComparePairIndices(a,b){var diffA=a.indexA-b.indexA;if(diffA!==0){return diffA<0;}return a.indexB<b.indexB;}},{key:"MatchPairIndices",value:function MatchPairIndices(a,b){return a.indexA===b.indexA&&a.indexB===b.indexB;}},{key:"CompareTriadIndices",value:function CompareTriadIndices(a,b){var diffA=a.indexA-b.indexA;if(diffA!==0){return diffA<0;}var diffB=a.indexB-b.indexB;if(diffB!==0){return diffB<0;}return a.indexC<b.indexC;}},{key:"MatchTriadIndices",value:function MatchTriadIndices(a,b){return a.indexA===b.indexA&&a.indexB===b.indexB&&a.indexC===b.indexC;}},{key:"InitializeParticleLists",value:function InitializeParticleLists(group,nodeBuffer){var bufferIndex=group.GetBufferIndex();var particleCount=group.GetParticleCount();for(var i=0;i<particleCount;i++){var node=nodeBuffer[i];node.list=node;node.next=null;node.count=1;node.index=i+bufferIndex;}}},{key:"MergeParticleLists",value:function MergeParticleLists(listA,listB){// Insert listB between index 0 and 1 of listA
      // Example:
      //     listA => a1 => a2 => a3 => null
      //     listB => b1 => b2 => null
      // to
      //     listA => listB => b1 => b2 => a1 => a2 => a3 => null
      // DEBUG: b2Assert(listA !== listB);
      for(var b=listB;;){b.list=listA;var nextB=b.next;if(nextB){b=nextB;}else {b.next=listA.next;break;}}listA.next=listB;listA.count+=listB.count;listB.count=0;}},{key:"FindLongestParticleList",value:function FindLongestParticleList(group,nodeBuffer){var particleCount=group.GetParticleCount();var result=nodeBuffer[0];for(var i=0;i<particleCount;i++){var node=nodeBuffer[i];if(result.count<node.count){result=node;}}return result;}},{key:"MergeParticleListAndNode",value:function MergeParticleListAndNode(list,node){// Insert node between index 0 and 1 of list
      // Example:
      //     list => a1 => a2 => a3 => null
      //     node => null
      // to
      //     list => node => a1 => a2 => a3 => null
      // DEBUG: b2Assert(node !== list);
      // DEBUG: b2Assert(node.list === node);
      // DEBUG: b2Assert(node.count === 1);
      node.list=list;node.next=list.next;list.next=node;list.count++;node.count=0;}},{key:"b2ParticleContactIsZombie",value:function b2ParticleContactIsZombie(contact){return (contact.flags&exports.b2ParticleFlag.b2_zombieParticle)===exports.b2ParticleFlag.b2_zombieParticle;}},{key:"BodyContactCompare",value:function BodyContactCompare(lhs,rhs){if(lhs.index===rhs.index){// Subsort by weight, decreasing.
      return lhs.weight>rhs.weight;}return lhs.index<rhs.index;}}]);}();b2ParticleSystem.xTruncBits=12;b2ParticleSystem.yTruncBits=12;b2ParticleSystem.tagBits=8*4;// 8u * sizeof(uint32);
      b2ParticleSystem.yOffset=1<<b2ParticleSystem.yTruncBits-1;b2ParticleSystem.yShift=b2ParticleSystem.tagBits-b2ParticleSystem.yTruncBits;b2ParticleSystem.xShift=b2ParticleSystem.tagBits-b2ParticleSystem.yTruncBits-b2ParticleSystem.xTruncBits;b2ParticleSystem.xScale=1<<b2ParticleSystem.xShift;b2ParticleSystem.xOffset=b2ParticleSystem.xScale*(1<<b2ParticleSystem.xTruncBits-1);b2ParticleSystem.yMask=(1<<b2ParticleSystem.yTruncBits)-1<<b2ParticleSystem.yShift;b2ParticleSystem.xMask=~b2ParticleSystem.yMask;b2ParticleSystem.DestroyParticlesInShape_s_aabb=new b2AABB();b2ParticleSystem.CreateParticleGroup_s_transform=new b2Transform();b2ParticleSystem.ComputeCollisionEnergy_s_v=new b2Vec2();b2ParticleSystem.QueryShapeAABB_s_aabb=new b2AABB();b2ParticleSystem.QueryPointAABB_s_aabb=new b2AABB();b2ParticleSystem.RayCast_s_aabb=new b2AABB();b2ParticleSystem.RayCast_s_p=new b2Vec2();b2ParticleSystem.RayCast_s_v=new b2Vec2();b2ParticleSystem.RayCast_s_n=new b2Vec2();b2ParticleSystem.RayCast_s_point=new b2Vec2();/**
         * All particle types that require creating pairs
         */b2ParticleSystem.k_pairFlags=exports.b2ParticleFlag.b2_springParticle;/**
         * All particle types that require creating triads
         */b2ParticleSystem.k_triadFlags=exports.b2ParticleFlag.b2_elasticParticle;/**
         * All particle types that do not produce dynamic pressure
         */b2ParticleSystem.k_noPressureFlags=exports.b2ParticleFlag.b2_powderParticle|exports.b2ParticleFlag.b2_tensileParticle;/**
         * All particle types that apply extra damping force with bodies
         */b2ParticleSystem.k_extraDampingFlags=exports.b2ParticleFlag.b2_staticPressureParticle;b2ParticleSystem.k_barrierWallFlags=exports.b2ParticleFlag.b2_barrierParticle|exports.b2ParticleFlag.b2_wallParticle;b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_edge=new b2EdgeShape();b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_d=new b2Vec2();b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_p=new b2Vec2();b2ParticleSystem.CreateParticlesFillShapeForGroup_s_aabb=new b2AABB();b2ParticleSystem.CreateParticlesFillShapeForGroup_s_p=new b2Vec2();b2ParticleSystem.UpdatePairsAndTriads_s_dab=new b2Vec2();b2ParticleSystem.UpdatePairsAndTriads_s_dbc=new b2Vec2();b2ParticleSystem.UpdatePairsAndTriads_s_dca=new b2Vec2();b2ParticleSystem.AddContact_s_d=new b2Vec2();b2ParticleSystem.UpdateBodyContacts_s_aabb=new b2AABB();b2ParticleSystem.Solve_s_subStep=new b2TimeStep();b2ParticleSystem.SolveCollision_s_aabb=new b2AABB();b2ParticleSystem.SolveGravity_s_gravity=new b2Vec2();b2ParticleSystem.SolveBarrier_s_aabb=new b2AABB();b2ParticleSystem.SolveBarrier_s_va=new b2Vec2();b2ParticleSystem.SolveBarrier_s_vb=new b2Vec2();b2ParticleSystem.SolveBarrier_s_pba=new b2Vec2();b2ParticleSystem.SolveBarrier_s_vba=new b2Vec2();b2ParticleSystem.SolveBarrier_s_vc=new b2Vec2();b2ParticleSystem.SolveBarrier_s_pca=new b2Vec2();b2ParticleSystem.SolveBarrier_s_vca=new b2Vec2();b2ParticleSystem.SolveBarrier_s_qba=new b2Vec2();b2ParticleSystem.SolveBarrier_s_qca=new b2Vec2();b2ParticleSystem.SolveBarrier_s_dv=new b2Vec2();b2ParticleSystem.SolveBarrier_s_f=new b2Vec2();b2ParticleSystem.SolvePressure_s_f=new b2Vec2();b2ParticleSystem.SolveDamping_s_v=new b2Vec2();b2ParticleSystem.SolveDamping_s_f=new b2Vec2();b2ParticleSystem.SolveRigidDamping_s_t0=new b2Vec2();b2ParticleSystem.SolveRigidDamping_s_t1=new b2Vec2();b2ParticleSystem.SolveRigidDamping_s_p=new b2Vec2();b2ParticleSystem.SolveRigidDamping_s_v=new b2Vec2();b2ParticleSystem.SolveExtraDamping_s_v=new b2Vec2();b2ParticleSystem.SolveExtraDamping_s_f=new b2Vec2();b2ParticleSystem.SolveRigid_s_position=new b2Vec2();b2ParticleSystem.SolveRigid_s_rotation=new b2Rot();b2ParticleSystem.SolveRigid_s_transform=new b2Transform();b2ParticleSystem.SolveRigid_s_velocityTransform=new b2Transform();b2ParticleSystem.SolveElastic_s_pa=new b2Vec2();b2ParticleSystem.SolveElastic_s_pb=new b2Vec2();b2ParticleSystem.SolveElastic_s_pc=new b2Vec2();b2ParticleSystem.SolveElastic_s_r=new b2Rot();b2ParticleSystem.SolveElastic_s_t0=new b2Vec2();b2ParticleSystem.SolveSpring_s_pa=new b2Vec2();b2ParticleSystem.SolveSpring_s_pb=new b2Vec2();b2ParticleSystem.SolveSpring_s_d=new b2Vec2();b2ParticleSystem.SolveSpring_s_f=new b2Vec2();b2ParticleSystem.SolveTensile_s_weightedNormal=new b2Vec2();b2ParticleSystem.SolveTensile_s_s=new b2Vec2();b2ParticleSystem.SolveTensile_s_f=new b2Vec2();b2ParticleSystem.SolveViscous_s_v=new b2Vec2();b2ParticleSystem.SolveViscous_s_f=new b2Vec2();b2ParticleSystem.SolveRepulsive_s_f=new b2Vec2();b2ParticleSystem.SolvePowder_s_f=new b2Vec2();b2ParticleSystem.SolveSolid_s_f=new b2Vec2();b2ParticleSystem.RemoveSpuriousBodyContacts_s_n=new b2Vec2();b2ParticleSystem.RemoveSpuriousBodyContacts_s_pos=new b2Vec2();b2ParticleSystem.RemoveSpuriousBodyContacts_s_normal=new b2Vec2();var b2ParticleSystem_UserOverridableBuffer=/*#__PURE__*/function(){function b2ParticleSystem_UserOverridableBuffer(){_classCallCheck(this,b2ParticleSystem_UserOverridableBuffer);this._data=null;this.userSuppliedCapacity=0;}return _createClass(b2ParticleSystem_UserOverridableBuffer,[{key:"data",get:function get(){return this._data;}// HACK: may return null
      ,set:function set(value){this._data=value;}}]);}();var b2ParticleSystem_Proxy=/*#__PURE__*/function(){function b2ParticleSystem_Proxy(){_classCallCheck(this,b2ParticleSystem_Proxy);this.index=b2_invalidParticleIndex;this.tag=0;}return _createClass(b2ParticleSystem_Proxy,null,[{key:"CompareProxyProxy",value:function CompareProxyProxy(a,b){return a.tag<b.tag;}},{key:"CompareTagProxy",value:function CompareTagProxy(a,b){return a<b.tag;}},{key:"CompareProxyTag",value:function CompareProxyTag(a,b){return a.tag<b;}}]);}();var b2ParticleSystem_InsideBoundsEnumerator=/*#__PURE__*/function(){/**
             * InsideBoundsEnumerator enumerates all particles inside the
             * given bounds.
             *
             * Construct an enumerator with bounds of tags and a range of
             * proxies.
             */function b2ParticleSystem_InsideBoundsEnumerator(system,lower,upper,first,last){_classCallCheck(this,b2ParticleSystem_InsideBoundsEnumerator);this.m_system=system;this.m_xLower=(lower&b2ParticleSystem.xMask)>>>0;this.m_xUpper=(upper&b2ParticleSystem.xMask)>>>0;this.m_yLower=(lower&b2ParticleSystem.yMask)>>>0;this.m_yUpper=(upper&b2ParticleSystem.yMask)>>>0;this.m_first=first;this.m_last=last;// DEBUG: b2Assert(this.m_first <= this.m_last);
      }/**
             * Get index of the next particle. Returns
             * b2_invalidParticleIndex if there are no more particles.
             */return _createClass(b2ParticleSystem_InsideBoundsEnumerator,[{key:"GetNext",value:function GetNext(){while(this.m_first<this.m_last){var xTag=(this.m_system.m_proxyBuffer.data[this.m_first].tag&b2ParticleSystem.xMask)>>>0;// #if B2_ASSERT_ENABLED
      // DEBUG: const yTag = (this.m_system.m_proxyBuffer.data[this.m_first].tag & b2ParticleSystem_yMask) >>> 0;
      // DEBUG: b2Assert(yTag >= this.m_yLower);
      // DEBUG: b2Assert(yTag <= this.m_yUpper);
      // #endif
      if(xTag>=this.m_xLower&&xTag<=this.m_xUpper){return this.m_system.m_proxyBuffer.data[this.m_first++].index;}this.m_first++;}return b2_invalidParticleIndex;}}]);}();var b2ParticleSystem_ParticleListNode=/*#__PURE__*/_createClass(function b2ParticleSystem_ParticleListNode(){_classCallCheck(this,b2ParticleSystem_ParticleListNode);/**
                 * The next node in the list.
                 */this.next=null;/**
                 * Number of entries in the list. Valid only for the node at the
                 * head of the list.
                 */this.count=0;/**
                 * Particle index.
                 */this.index=0;});/**
         * @constructor
         */var b2ParticleSystem_FixedSetAllocator=/*#__PURE__*/function(){function b2ParticleSystem_FixedSetAllocator(){_classCallCheck(this,b2ParticleSystem_FixedSetAllocator);}return _createClass(b2ParticleSystem_FixedSetAllocator,[{key:"Allocate",value:function Allocate(itemSize,count){// TODO
      return count;}},{key:"Clear",value:function Clear(){// TODO
      }},{key:"GetCount",value:function GetCount(){// TODO
      return 0;}},{key:"Invalidate",value:function Invalidate(itemIndex){// TODO
      }},{key:"GetValidBuffer",value:function GetValidBuffer(){// TODO
      return [];}},{key:"GetBuffer",value:function GetBuffer(){// TODO
      return [];}},{key:"SetCount",value:function SetCount(count){// TODO
      }}]);}();var b2ParticleSystem_FixtureParticle=/*#__PURE__*/_createClass(function b2ParticleSystem_FixtureParticle(fixture,particle){_classCallCheck(this,b2ParticleSystem_FixtureParticle);this.second=b2_invalidParticleIndex;this.first=fixture;this.second=particle;});var b2ParticleSystem_FixtureParticleSet=/*#__PURE__*/function(_b2ParticleSystem_Fix){function b2ParticleSystem_FixtureParticleSet(){_classCallCheck(this,b2ParticleSystem_FixtureParticleSet);return _callSuper(this,b2ParticleSystem_FixtureParticleSet,arguments);}_inherits(b2ParticleSystem_FixtureParticleSet,_b2ParticleSystem_Fix);return _createClass(b2ParticleSystem_FixtureParticleSet,[{key:"Initialize",value:function Initialize(bodyContactBuffer,flagsBuffer){// TODO
      }},{key:"Find",value:function Find(pair){// TODO
      return b2_invalidParticleIndex;}}]);}(b2ParticleSystem_FixedSetAllocator);var b2ParticleSystem_ParticlePair=/*#__PURE__*/_createClass(function b2ParticleSystem_ParticlePair(particleA,particleB){_classCallCheck(this,b2ParticleSystem_ParticlePair);this.first=b2_invalidParticleIndex;this.second=b2_invalidParticleIndex;this.first=particleA;this.second=particleB;});var b2ParticlePairSet=/*#__PURE__*/function(_b2ParticleSystem_Fix2){function b2ParticlePairSet(){_classCallCheck(this,b2ParticlePairSet);return _callSuper(this,b2ParticlePairSet,arguments);}_inherits(b2ParticlePairSet,_b2ParticleSystem_Fix2);return _createClass(b2ParticlePairSet,[{key:"Initialize",value:function Initialize(contactBuffer,flagsBuffer){// TODO
      }},{key:"Find",value:function Find(pair){// TODO
      return b2_invalidParticleIndex;}}]);}(b2ParticleSystem_FixedSetAllocator);var b2ParticleSystem_ConnectionFilter=/*#__PURE__*/function(){function b2ParticleSystem_ConnectionFilter(){_classCallCheck(this,b2ParticleSystem_ConnectionFilter);}return _createClass(b2ParticleSystem_ConnectionFilter,[{key:"IsNecessary",value:/**
             * Is the particle necessary for connection?
             * A pair or a triad should contain at least one 'necessary'
             * particle.
             */function IsNecessary(index){return true;}/**
             * An additional condition for creating a pair.
             */},{key:"ShouldCreatePair",value:function ShouldCreatePair(a,b){return true;}/**
             * An additional condition for creating a triad.
             */},{key:"ShouldCreateTriad",value:function ShouldCreateTriad(a,b,c){return true;}}]);}();var b2ParticleSystem_DestroyParticlesInShapeCallback=/*#__PURE__*/function(_b2QueryCallback2){function b2ParticleSystem_DestroyParticlesInShapeCallback(system,shape,xf,callDestructionListener){var _this30;_classCallCheck(this,b2ParticleSystem_DestroyParticlesInShapeCallback);_this30=_callSuper(this,b2ParticleSystem_DestroyParticlesInShapeCallback);_this30.m_callDestructionListener=false;_this30.m_destroyed=0;_this30.m_system=system;_this30.m_shape=shape;_this30.m_xf=xf;_this30.m_callDestructionListener=callDestructionListener;_this30.m_destroyed=0;return _this30;}_inherits(b2ParticleSystem_DestroyParticlesInShapeCallback,_b2QueryCallback2);return _createClass(b2ParticleSystem_DestroyParticlesInShapeCallback,[{key:"ReportFixture",value:function ReportFixture(fixture){return false;}},{key:"ReportParticle",value:function ReportParticle(particleSystem,index){if(particleSystem!==this.m_system){return false;}// DEBUG: b2Assert(index >= 0 && index < this.m_system.m_count);
      if(this.m_shape.TestPoint(this.m_xf,this.m_system.m_positionBuffer.data[index])){this.m_system.DestroyParticle(index,this.m_callDestructionListener);this.m_destroyed++;}return true;}},{key:"Destroyed",value:function Destroyed(){return this.m_destroyed;}}]);}(b2QueryCallback);var b2ParticleSystem_JoinParticleGroupsFilter=/*#__PURE__*/function(_b2ParticleSystem_Con){function b2ParticleSystem_JoinParticleGroupsFilter(threshold){var _this31;_classCallCheck(this,b2ParticleSystem_JoinParticleGroupsFilter);_this31=_callSuper(this,b2ParticleSystem_JoinParticleGroupsFilter);_this31.m_threshold=0;_this31.m_threshold=threshold;return _this31;}/**
             * An additional condition for creating a pair.
             */_inherits(b2ParticleSystem_JoinParticleGroupsFilter,_b2ParticleSystem_Con);return _createClass(b2ParticleSystem_JoinParticleGroupsFilter,[{key:"ShouldCreatePair",value:function ShouldCreatePair(a,b){return a<this.m_threshold&&this.m_threshold<=b||b<this.m_threshold&&this.m_threshold<=a;}/**
             * An additional condition for creating a triad.
             */},{key:"ShouldCreateTriad",value:function ShouldCreateTriad(a,b,c){return (a<this.m_threshold||b<this.m_threshold||c<this.m_threshold)&&(this.m_threshold<=a||this.m_threshold<=b||this.m_threshold<=c);}}]);}(b2ParticleSystem_ConnectionFilter);var b2ParticleSystem_CompositeShape=/*#__PURE__*/function(_b2Shape5){function b2ParticleSystem_CompositeShape(shapes){var _this32;var shapeCount=arguments.length>1&&arguments[1]!==undefined?arguments[1]:shapes.length;_classCallCheck(this,b2ParticleSystem_CompositeShape);_this32=_callSuper(this,b2ParticleSystem_CompositeShape,[exports.b2ShapeType.e_unknown,0]);_this32.m_shapeCount=0;_this32.m_shapes=shapes;_this32.m_shapeCount=shapeCount;return _this32;}_inherits(b2ParticleSystem_CompositeShape,_b2Shape5);return _createClass(b2ParticleSystem_CompositeShape,[{key:"Clone",value:function Clone(){// DEBUG: b2Assert(false);
      throw new Error();}},{key:"GetChildCount",value:function GetChildCount(){return 1;}/**
             * @see b2Shape::TestPoint
             */},{key:"TestPoint",value:function TestPoint(xf,p){for(var i=0;i<this.m_shapeCount;i++){if(this.m_shapes[i].TestPoint(xf,p)){return true;}}return false;}/**
             * @see b2Shape::ComputeDistance
             */},{key:"ComputeDistance",value:function ComputeDistance(xf,p,normal,childIndex){// DEBUG: b2Assert(false);
      return 0;}/**
             * Implement b2Shape.
             */},{key:"RayCast",value:function RayCast(output,input,xf,childIndex){// DEBUG: b2Assert(false);
      return false;}/**
             * @see b2Shape::ComputeAABB
             */},{key:"ComputeAABB",value:function ComputeAABB(aabb,xf,childIndex){var s_subaabb=new b2AABB();aabb.lowerBound.x=+b2_maxFloat;aabb.lowerBound.y=+b2_maxFloat;aabb.upperBound.x=-b2_maxFloat;aabb.upperBound.y=-b2_maxFloat;// DEBUG: b2Assert(childIndex === 0);
      for(var i=0;i<this.m_shapeCount;i++){var childCount=this.m_shapes[i].GetChildCount();for(var j=0;j<childCount;j++){var subaabb=s_subaabb;this.m_shapes[i].ComputeAABB(subaabb,xf,j);aabb.Combine1(subaabb);}}}/**
             * @see b2Shape::ComputeMass
             */},{key:"ComputeMass",value:function ComputeMass(massData,density){// DEBUG: b2Assert(false);
      }},{key:"SetupDistanceProxy",value:function SetupDistanceProxy(proxy,index){// DEBUG: b2Assert(false);
      }},{key:"ComputeSubmergedArea",value:function ComputeSubmergedArea(normal,offset,xf,c){// DEBUG: b2Assert(false);
      return 0;}},{key:"Dump",value:function Dump(log){// DEBUG: b2Assert(false);
      }}]);}(b2Shape);var b2ParticleSystem_ReactiveFilter=/*#__PURE__*/function(_b2ParticleSystem_Con2){function b2ParticleSystem_ReactiveFilter(flagsBuffer){var _this33;_classCallCheck(this,b2ParticleSystem_ReactiveFilter);_this33=_callSuper(this,b2ParticleSystem_ReactiveFilter);_this33.m_flagsBuffer=flagsBuffer;return _this33;}_inherits(b2ParticleSystem_ReactiveFilter,_b2ParticleSystem_Con2);return _createClass(b2ParticleSystem_ReactiveFilter,[{key:"IsNecessary",value:function IsNecessary(index){return (this.m_flagsBuffer.data[index]&exports.b2ParticleFlag.b2_reactiveParticle)!==0;}}]);}(b2ParticleSystem_ConnectionFilter);var b2ParticleSystem_UpdateBodyContactsCallback=/*#__PURE__*/function(_b2FixtureParticleQue){function b2ParticleSystem_UpdateBodyContactsCallback(system){var _this34;var contactFilter=arguments.length>1&&arguments[1]!==undefined?arguments[1]:null;_classCallCheck(this,b2ParticleSystem_UpdateBodyContactsCallback);_this34=_callSuper(this,b2ParticleSystem_UpdateBodyContactsCallback,[system]);// base class constructor
      _this34.m_contactFilter=null;_this34.m_contactFilter=contactFilter;return _this34;}_inherits(b2ParticleSystem_UpdateBodyContactsCallback,_b2FixtureParticleQue);return _createClass(b2ParticleSystem_UpdateBodyContactsCallback,[{key:"ShouldCollideFixtureParticle",value:function ShouldCollideFixtureParticle(fixture,particleSystem,particleIndex){// Call the contact filter if it's set, to determine whether to
      // filter this contact.  Returns true if contact calculations should
      // be performed, false otherwise.
      if(this.m_contactFilter){var flags=this.m_system.GetFlagsBuffer();if(flags[particleIndex]&exports.b2ParticleFlag.b2_fixtureContactFilterParticle){return this.m_contactFilter.ShouldCollideFixtureParticle(fixture,this.m_system,particleIndex);}}return true;}},{key:"ReportFixtureAndParticle",value:function ReportFixtureAndParticle(fixture,childIndex,a){var s_n=b2ParticleSystem_UpdateBodyContactsCallback.ReportFixtureAndParticle_s_n;var s_rp=b2ParticleSystem_UpdateBodyContactsCallback.ReportFixtureAndParticle_s_rp;var ap=this.m_system.m_positionBuffer.data[a];var n=s_n;var d=fixture.ComputeDistance(ap,n,childIndex);if(d<this.m_system.m_particleDiameter&&this.ShouldCollideFixtureParticle(fixture,this.m_system,a)){var b=fixture.GetBody();var bp=b.GetWorldCenter();var bm=b.GetMass();var bI=b.GetInertia()-bm*b.GetLocalCenter().LengthSquared();var invBm=bm>0?1/bm:0;var invBI=bI>0?1/bI:0;var invAm=this.m_system.m_flagsBuffer.data[a]&exports.b2ParticleFlag.b2_wallParticle?0:this.m_system.GetParticleInvMass();///b2Vec2 rp = ap - bp;
      var rp=b2Vec2.SubVV(ap,bp,s_rp);var rpn=b2Vec2.CrossVV(rp,n);var invM=invAm+invBm+invBI*rpn*rpn;///b2ParticleBodyContact& contact = m_system.m_bodyContactBuffer.Append();
      var contact=this.m_system.m_bodyContactBuffer.data[this.m_system.m_bodyContactBuffer.Append()];contact.index=a;contact.body=b;contact.fixture=fixture;contact.weight=1-d*this.m_system.m_inverseDiameter;///contact.normal = -n;
      contact.normal.Copy(n.SelfNeg());contact.mass=invM>0?1/invM:0;this.m_system.DetectStuckParticle(a);}}}]);}(b2FixtureParticleQueryCallback);b2ParticleSystem_UpdateBodyContactsCallback.ReportFixtureAndParticle_s_n=new b2Vec2();b2ParticleSystem_UpdateBodyContactsCallback.ReportFixtureAndParticle_s_rp=new b2Vec2();var b2ParticleSystem_SolveCollisionCallback=/*#__PURE__*/function(_b2FixtureParticleQue2){function b2ParticleSystem_SolveCollisionCallback(system,step){var _this35;_classCallCheck(this,b2ParticleSystem_SolveCollisionCallback);_this35=_callSuper(this,b2ParticleSystem_SolveCollisionCallback,[system]);// base class constructor
      _this35.m_step=step;return _this35;}_inherits(b2ParticleSystem_SolveCollisionCallback,_b2FixtureParticleQue2);return _createClass(b2ParticleSystem_SolveCollisionCallback,[{key:"ReportFixtureAndParticle",value:function ReportFixtureAndParticle(fixture,childIndex,a){var s_p1=b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_p1;var s_output=b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_output;var s_input=b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_input;var s_p=b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_p;var s_v=b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_v;var s_f=b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_f;var body=fixture.GetBody();var ap=this.m_system.m_positionBuffer.data[a];var av=this.m_system.m_velocityBuffer.data[a];var output=s_output;var input=s_input;if(this.m_system.m_iterationIndex===0){// Put 'ap' in the local space of the previous frame
      ///b2Vec2 p1 = b2MulT(body.m_xf0, ap);
      var p1=b2Transform.MulTXV(body.m_xf0,ap,s_p1);if(fixture.GetShape().GetType()===exports.b2ShapeType.e_circleShape){// Make relative to the center of the circle
      ///p1 -= body.GetLocalCenter();
      p1.SelfSub(body.GetLocalCenter());// Re-apply rotation about the center of the circle
      ///p1 = b2Mul(body.m_xf0.q, p1);
      b2Rot.MulRV(body.m_xf0.q,p1,p1);// Subtract rotation of the current frame
      ///p1 = b2MulT(body.m_xf.q, p1);
      b2Rot.MulTRV(body.m_xf.q,p1,p1);// Return to local space
      ///p1 += body.GetLocalCenter();
      p1.SelfAdd(body.GetLocalCenter());}// Return to global space and apply rotation of current frame
      ///input.p1 = b2Mul(body.m_xf, p1);
      b2Transform.MulXV(body.m_xf,p1,input.p1);}else {///input.p1 = ap;
      input.p1.Copy(ap);}///input.p2 = ap + m_step.dt * av;
      b2Vec2.AddVMulSV(ap,this.m_step.dt,av,input.p2);input.maxFraction=1;if(fixture.RayCast(output,input,childIndex)){var n=output.normal;///b2Vec2 p = (1 - output.fraction) * input.p1 + output.fraction * input.p2 + b2_linearSlop * n;
      var p=s_p;p.x=(1-output.fraction)*input.p1.x+output.fraction*input.p2.x+b2_linearSlop*n.x;p.y=(1-output.fraction)*input.p1.y+output.fraction*input.p2.y+b2_linearSlop*n.y;///b2Vec2 v = m_step.inv_dt * (p - ap);
      var v=s_v;v.x=this.m_step.inv_dt*(p.x-ap.x);v.y=this.m_step.inv_dt*(p.y-ap.y);///m_system.m_velocityBuffer.data[a] = v;
      this.m_system.m_velocityBuffer.data[a].Copy(v);///b2Vec2 f = m_step.inv_dt * m_system.GetParticleMass() * (av - v);
      var f=s_f;f.x=this.m_step.inv_dt*this.m_system.GetParticleMass()*(av.x-v.x);f.y=this.m_step.inv_dt*this.m_system.GetParticleMass()*(av.y-v.y);this.m_system.ParticleApplyForce(a,f);}}},{key:"ReportParticle",value:function ReportParticle(system,index){return false;}}]);}(b2FixtureParticleQueryCallback);b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_p1=new b2Vec2();b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_output=new b2RayCastOutput();b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_input=new b2RayCastInput();b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_p=new b2Vec2();b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_v=new b2Vec2();b2ParticleSystem_SolveCollisionCallback.ReportFixtureAndParticle_s_f=new b2Vec2();// #endif
      /*
        * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        */// #endif
      /// The world class manages all physics entities, dynamic simulation,
      /// and asynchronous queries. The world also contains efficient memory
      /// management facilities.
      var b2World=/*#__PURE__*/function(){// #endif
      /// Construct a world object.
      /// @param gravity the world gravity vector.
      function b2World(gravity){_classCallCheck(this,b2World);this.m_newFixture=false;this.m_locked=false;this.m_clearForces=true;this.m_contactManager=new b2ContactManager();this.m_bodyList=null;this.m_jointList=null;// #if B2_ENABLE_PARTICLE
      this.m_particleSystemList=null;// #endif
      this.m_bodyCount=0;this.m_jointCount=0;this.m_gravity=new b2Vec2();this.m_allowSleep=true;this.m_destructionListener=null;this.m_debugDraw=null;// This is used to compute the time step ratio to
      // support a variable time step.
      this.m_inv_dt0=0;// These are for debugging the solver.
      this.m_warmStarting=true;this.m_continuousPhysics=true;this.m_subStepping=false;this.m_stepComplete=true;this.m_profile=new b2Profile();this.m_island=new b2Island();this.s_stack=[];// #if B2_ENABLE_CONTROLLER
      this.m_controllerList=null;this.m_controllerCount=0;this.m_gravity.Copy(gravity);}/// Register a destruction listener. The listener is owned by you and must
      /// remain in scope.
      return _createClass(b2World,[{key:"SetDestructionListener",value:function SetDestructionListener(listener){this.m_destructionListener=listener;}/// Register a contact filter to provide specific control over collision.
      /// Otherwise the default filter is used (b2_defaultFilter). The listener is
      /// owned by you and must remain in scope.
      },{key:"SetContactFilter",value:function SetContactFilter(filter){this.m_contactManager.m_contactFilter=filter;}/// Register a contact event listener. The listener is owned by you and must
      /// remain in scope.
      },{key:"SetContactListener",value:function SetContactListener(listener){this.m_contactManager.m_contactListener=listener;}/// Register a routine for debug drawing. The debug draw functions are called
      /// inside with b2World::DrawDebugData method. The debug draw object is owned
      /// by you and must remain in scope.
      },{key:"SetDebugDraw",value:function SetDebugDraw(debugDraw){this.m_debugDraw=debugDraw;}/// Create a rigid body given a definition. No reference to the definition
      /// is retained.
      /// @warning This function is locked during callbacks.
      },{key:"CreateBody",value:function CreateBody(){var def=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};if(this.IsLocked()){throw new Error();}var b=new b2Body(def,this);// Add to world doubly linked list.
      b.m_prev=null;b.m_next=this.m_bodyList;if(this.m_bodyList){this.m_bodyList.m_prev=b;}this.m_bodyList=b;++this.m_bodyCount;return b;}/// Destroy a rigid body given a definition. No reference to the definition
      /// is retained. This function is locked during callbacks.
      /// @warning This automatically deletes all associated shapes and joints.
      /// @warning This function is locked during callbacks.
      },{key:"DestroyBody",value:function DestroyBody(b){// DEBUG: b2Assert(this.m_bodyCount > 0);
      if(this.IsLocked()){throw new Error();}// Delete the attached joints.
      var je=b.m_jointList;while(je){var je0=je;je=je.next;if(this.m_destructionListener){this.m_destructionListener.SayGoodbyeJoint(je0.joint);}this.DestroyJoint(je0.joint);b.m_jointList=je;}b.m_jointList=null;// #if B2_ENABLE_CONTROLLER
      // @see b2Controller list
      var coe=b.m_controllerList;while(coe){var coe0=coe;coe=coe.nextController;coe0.controller.RemoveBody(b);}// #endif
      // Delete the attached contacts.
      var ce=b.m_contactList;while(ce){var ce0=ce;ce=ce.next;this.m_contactManager.Destroy(ce0.contact);}b.m_contactList=null;// Delete the attached fixtures. This destroys broad-phase proxies.
      var f=b.m_fixtureList;while(f){var f0=f;f=f.m_next;if(this.m_destructionListener){this.m_destructionListener.SayGoodbyeFixture(f0);}f0.DestroyProxies();f0.Reset();b.m_fixtureList=f;b.m_fixtureCount-=1;}b.m_fixtureList=null;b.m_fixtureCount=0;// Remove world body list.
      if(b.m_prev){b.m_prev.m_next=b.m_next;}if(b.m_next){b.m_next.m_prev=b.m_prev;}if(b===this.m_bodyList){this.m_bodyList=b.m_next;}--this.m_bodyCount;}},{key:"CreateJoint",value:function CreateJoint(def){if(this.IsLocked()){throw new Error();}var j=b2World._Joint_Create(def);// Connect to the world list.
      j.m_prev=null;j.m_next=this.m_jointList;if(this.m_jointList){this.m_jointList.m_prev=j;}this.m_jointList=j;++this.m_jointCount;// Connect to the bodies' doubly linked lists.
      // j.m_edgeA.other = j.m_bodyB; // done in b2Joint constructor
      j.m_edgeA.prev=null;j.m_edgeA.next=j.m_bodyA.m_jointList;if(j.m_bodyA.m_jointList){j.m_bodyA.m_jointList.prev=j.m_edgeA;}j.m_bodyA.m_jointList=j.m_edgeA;// j.m_edgeB.other = j.m_bodyA; // done in b2Joint constructor
      j.m_edgeB.prev=null;j.m_edgeB.next=j.m_bodyB.m_jointList;if(j.m_bodyB.m_jointList){j.m_bodyB.m_jointList.prev=j.m_edgeB;}j.m_bodyB.m_jointList=j.m_edgeB;var bodyA=j.m_bodyA;var bodyB=j.m_bodyB;var collideConnected=j.m_collideConnected;// If the joint prevents collisions, then flag any contacts for filtering.
      if(!collideConnected){var edge=bodyB.GetContactList();while(edge){if(edge.other===bodyA){// Flag the contact for filtering at the next time step (where either
      // body is awake).
      edge.contact.FlagForFiltering();}edge=edge.next;}}// Note: creating a joint doesn't wake the bodies.
      return j;}/// Destroy a joint. This may cause the connected bodies to begin colliding.
      /// @warning This function is locked during callbacks.
      },{key:"DestroyJoint",value:function DestroyJoint(j){if(this.IsLocked()){throw new Error();}// Remove from the doubly linked list.
      if(j.m_prev){j.m_prev.m_next=j.m_next;}if(j.m_next){j.m_next.m_prev=j.m_prev;}if(j===this.m_jointList){this.m_jointList=j.m_next;}// Disconnect from island graph.
      var bodyA=j.m_bodyA;var bodyB=j.m_bodyB;var collideConnected=j.m_collideConnected;// Wake up connected bodies.
      bodyA.SetAwake(true);bodyB.SetAwake(true);// Remove from body 1.
      if(j.m_edgeA.prev){j.m_edgeA.prev.next=j.m_edgeA.next;}if(j.m_edgeA.next){j.m_edgeA.next.prev=j.m_edgeA.prev;}if(j.m_edgeA===bodyA.m_jointList){bodyA.m_jointList=j.m_edgeA.next;}j.m_edgeA.Reset();// Remove from body 2
      if(j.m_edgeB.prev){j.m_edgeB.prev.next=j.m_edgeB.next;}if(j.m_edgeB.next){j.m_edgeB.next.prev=j.m_edgeB.prev;}if(j.m_edgeB===bodyB.m_jointList){bodyB.m_jointList=j.m_edgeB.next;}j.m_edgeB.Reset();b2World._Joint_Destroy(j);// DEBUG: b2Assert(this.m_jointCount > 0);
      --this.m_jointCount;// If the joint prevents collisions, then flag any contacts for filtering.
      if(!collideConnected){var edge=bodyB.GetContactList();while(edge){if(edge.other===bodyA){// Flag the contact for filtering at the next time step (where either
      // body is awake).
      edge.contact.FlagForFiltering();}edge=edge.next;}}}// #if B2_ENABLE_PARTICLE
      },{key:"CreateParticleSystem",value:function CreateParticleSystem(def){if(this.IsLocked()){throw new Error();}var p=new b2ParticleSystem(def,this);// Add to world doubly linked list.
      p.m_prev=null;p.m_next=this.m_particleSystemList;if(this.m_particleSystemList){this.m_particleSystemList.m_prev=p;}this.m_particleSystemList=p;return p;}},{key:"DestroyParticleSystem",value:function DestroyParticleSystem(p){if(this.IsLocked()){throw new Error();}// Remove world particleSystem list.
      if(p.m_prev){p.m_prev.m_next=p.m_next;}if(p.m_next){p.m_next.m_prev=p.m_prev;}if(p===this.m_particleSystemList){this.m_particleSystemList=p.m_next;}}},{key:"CalculateReasonableParticleIterations",value:function CalculateReasonableParticleIterations(timeStep){if(this.m_particleSystemList===null){return 1;}function GetSmallestRadius(world){var smallestRadius=b2_maxFloat;for(var system=world.GetParticleSystemList();system!==null;system=system.m_next){smallestRadius=b2Min(smallestRadius,system.GetRadius());}return smallestRadius;}// Use the smallest radius, since that represents the worst-case.
      return b2CalculateParticleIterations(this.m_gravity.Length(),GetSmallestRadius(this),timeStep);}// #if B2_ENABLE_PARTICLE
      },{key:"Step",value:function Step(dt,velocityIterations,positionIterations){var particleIterations=arguments.length>3&&arguments[3]!==undefined?arguments[3]:this.CalculateReasonableParticleIterations(dt);// #else
      // public Step(dt: number, velocityIterations: number, positionIterations: number): void {
      // #endif
      var stepTimer=b2World.Step_s_stepTimer.Reset();// If new fixtures were added, we need to find the new contacts.
      if(this.m_newFixture){this.m_contactManager.FindNewContacts();this.m_newFixture=false;}this.m_locked=true;var step=b2World.Step_s_step;step.dt=dt;step.velocityIterations=velocityIterations;step.positionIterations=positionIterations;// #if B2_ENABLE_PARTICLE
      step.particleIterations=particleIterations;// #endif
      if(dt>0){step.inv_dt=1/dt;}else {step.inv_dt=0;}step.dtRatio=this.m_inv_dt0*dt;step.warmStarting=this.m_warmStarting;// Update contacts. This is where some contacts are destroyed.
      var timer=b2World.Step_s_timer.Reset();this.m_contactManager.Collide();this.m_profile.collide=timer.GetMilliseconds();// Integrate velocities, solve velocity constraints, and integrate positions.
      if(this.m_stepComplete&&step.dt>0){var _timer=b2World.Step_s_timer.Reset();// #if B2_ENABLE_PARTICLE
      for(var p=this.m_particleSystemList;p;p=p.m_next){p.Solve(step);// Particle Simulation
      }// #endif
      this.Solve(step);this.m_profile.solve=_timer.GetMilliseconds();}// Handle TOI events.
      if(this.m_continuousPhysics&&step.dt>0){var _timer2=b2World.Step_s_timer.Reset();this.SolveTOI(step);this.m_profile.solveTOI=_timer2.GetMilliseconds();}if(step.dt>0){this.m_inv_dt0=step.inv_dt;}if(this.m_clearForces){this.ClearForces();}this.m_locked=false;this.m_profile.step=stepTimer.GetMilliseconds();}/// Manually clear the force buffer on all bodies. By default, forces are cleared automatically
      /// after each call to Step. The default behavior is modified by calling SetAutoClearForces.
      /// The purpose of this function is to support sub-stepping. Sub-stepping is often used to maintain
      /// a fixed sized time step under a variable frame-rate.
      /// When you perform sub-stepping you will disable auto clearing of forces and instead call
      /// ClearForces after all sub-steps are complete in one pass of your game loop.
      /// @see SetAutoClearForces
      },{key:"ClearForces",value:function ClearForces(){for(var body=this.m_bodyList;body;body=body.m_next){body.m_force.SetZero();body.m_torque=0;}}// #if B2_ENABLE_PARTICLE
      },{key:"DrawParticleSystem",value:function DrawParticleSystem(system){if(this.m_debugDraw===null){return;}var particleCount=system.GetParticleCount();if(particleCount){var radius=system.GetRadius();var positionBuffer=system.GetPositionBuffer();if(system.m_colorBuffer.data){var colorBuffer=system.GetColorBuffer();this.m_debugDraw.DrawParticles(positionBuffer,radius,colorBuffer,particleCount);}else {this.m_debugDraw.DrawParticles(positionBuffer,radius,null,particleCount);}}}},{key:"DrawDebugData",value:function DrawDebugData(){if(this.m_debugDraw===null){return;}var flags=this.m_debugDraw.GetFlags();var color=b2World.DrawDebugData_s_color.SetRGB(0,0,0);if(flags&exports.b2DrawFlags.e_shapeBit){for(var b=this.m_bodyList;b;b=b.m_next){var xf=b.m_xf;this.m_debugDraw.PushTransform(xf);for(var f=b.GetFixtureList();f;f=f.m_next){if(!b.IsActive()){color.SetRGB(0.5,0.5,0.3);this.DrawShape(f,color);}else if(b.GetType()===exports.b2BodyType.b2_staticBody){color.SetRGB(0.5,0.9,0.5);this.DrawShape(f,color);}else if(b.GetType()===exports.b2BodyType.b2_kinematicBody){color.SetRGB(0.5,0.5,0.9);this.DrawShape(f,color);}else if(!b.IsAwake()){color.SetRGB(0.6,0.6,0.6);this.DrawShape(f,color);}else {color.SetRGB(0.9,0.7,0.7);this.DrawShape(f,color);}}this.m_debugDraw.PopTransform(xf);}}// #if B2_ENABLE_PARTICLE
      if(flags&exports.b2DrawFlags.e_particleBit){for(var p=this.m_particleSystemList;p;p=p.m_next){this.DrawParticleSystem(p);}}// #endif
      if(flags&exports.b2DrawFlags.e_jointBit){for(var j=this.m_jointList;j;j=j.m_next){this.DrawJoint(j);}}/*
                if (flags & b2DrawFlags.e_pairBit) {
                  color.SetRGB(0.3, 0.9, 0.9);
                  for (let contact = this.m_contactManager.m_contactList; contact; contact = contact.m_next) {
                    const fixtureA = contact.GetFixtureA();
                    const fixtureB = contact.GetFixtureB();
            
                    const cA = fixtureA.GetAABB().GetCenter();
                    const cB = fixtureB.GetAABB().GetCenter();
            
                    this.m_debugDraw.DrawSegment(cA, cB, color);
                  }
                }
                */if(flags&exports.b2DrawFlags.e_aabbBit){color.SetRGB(0.9,0.3,0.9);var vs=b2World.DrawDebugData_s_vs;for(var _b13=this.m_bodyList;_b13;_b13=_b13.m_next){if(!_b13.IsActive()){continue;}for(var _f7=_b13.GetFixtureList();_f7;_f7=_f7.m_next){for(var i=0;i<_f7.m_proxyCount;++i){var proxy=_f7.m_proxies[i];var aabb=proxy.treeNode.aabb;vs[0].Set(aabb.lowerBound.x,aabb.lowerBound.y);vs[1].Set(aabb.upperBound.x,aabb.lowerBound.y);vs[2].Set(aabb.upperBound.x,aabb.upperBound.y);vs[3].Set(aabb.lowerBound.x,aabb.upperBound.y);this.m_debugDraw.DrawPolygon(vs,4,color);}}}}if(flags&exports.b2DrawFlags.e_centerOfMassBit){for(var _b14=this.m_bodyList;_b14;_b14=_b14.m_next){var _xf=b2World.DrawDebugData_s_xf;_xf.q.Copy(_b14.m_xf.q);_xf.p.Copy(_b14.GetWorldCenter());this.m_debugDraw.DrawTransform(_xf);}}// #if B2_ENABLE_CONTROLLER
      // @see b2Controller list
      if(flags&exports.b2DrawFlags.e_controllerBit){for(var c=this.m_controllerList;c;c=c.m_next){c.Draw(this.m_debugDraw);}}// #endif
      }},{key:"QueryAABB",value:function QueryAABB(){if((arguments.length<=0?undefined:arguments[0])instanceof b2QueryCallback){this._QueryAABB(arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1]);}else {this._QueryAABB(null,arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1]);}}},{key:"_QueryAABB",value:function _QueryAABB(callback,aabb,fn){this.m_contactManager.m_broadPhase.Query(aabb,function(proxy){var fixture_proxy=proxy.userData;// DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
      var fixture=fixture_proxy.fixture;if(callback){return callback.ReportFixture(fixture);}else if(fn){return fn(fixture);}return true;});// #if B2_ENABLE_PARTICLE
      if(callback instanceof b2QueryCallback){for(var p=this.m_particleSystemList;p;p=p.m_next){if(callback.ShouldQueryParticleSystem(p)){p.QueryAABB(callback,aabb);}}}// #endif
      }},{key:"QueryAllAABB",value:function QueryAllAABB(aabb){var out=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];this.QueryAABB(aabb,function(fixture){out.push(fixture);return true;});return out;}},{key:"QueryPointAABB",value:function QueryPointAABB(){if((arguments.length<=0?undefined:arguments[0])instanceof b2QueryCallback){this._QueryPointAABB(arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1]);}else {this._QueryPointAABB(null,arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1]);}}},{key:"_QueryPointAABB",value:function _QueryPointAABB(callback,point,fn){this.m_contactManager.m_broadPhase.QueryPoint(point,function(proxy){var fixture_proxy=proxy.userData;// DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
      var fixture=fixture_proxy.fixture;if(callback){return callback.ReportFixture(fixture);}else if(fn){return fn(fixture);}return true;});// #if B2_ENABLE_PARTICLE
      if(callback instanceof b2QueryCallback){for(var p=this.m_particleSystemList;p;p=p.m_next){if(callback.ShouldQueryParticleSystem(p)){p.QueryPointAABB(callback,point);}}}// #endif
      }},{key:"QueryAllPointAABB",value:function QueryAllPointAABB(point){var out=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];this.QueryPointAABB(point,function(fixture){out.push(fixture);return true;});return out;}},{key:"QueryFixtureShape",value:function QueryFixtureShape(){if((arguments.length<=0?undefined:arguments[0])instanceof b2QueryCallback){this._QueryFixtureShape(arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1],arguments.length<=2?undefined:arguments[2],arguments.length<=3?undefined:arguments[3]);}else {this._QueryFixtureShape(null,arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1],arguments.length<=2?undefined:arguments[2],arguments.length<=3?undefined:arguments[3]);}}},{key:"_QueryFixtureShape",value:function _QueryFixtureShape(callback,shape,index,transform,fn){var aabb=b2World.QueryFixtureShape_s_aabb;shape.ComputeAABB(aabb,transform,index);this.m_contactManager.m_broadPhase.Query(aabb,function(proxy){var fixture_proxy=proxy.userData;// DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
      var fixture=fixture_proxy.fixture;if(b2TestOverlapShape(shape,index,fixture.GetShape(),fixture_proxy.childIndex,transform,fixture.GetBody().GetTransform())){if(callback){return callback.ReportFixture(fixture);}else if(fn){return fn(fixture);}}return true;});// #if B2_ENABLE_PARTICLE
      if(callback instanceof b2QueryCallback){for(var p=this.m_particleSystemList;p;p=p.m_next){if(callback.ShouldQueryParticleSystem(p)){p.QueryAABB(callback,aabb);}}}// #endif
      }},{key:"QueryAllFixtureShape",value:function QueryAllFixtureShape(shape,index,transform){var out=arguments.length>3&&arguments[3]!==undefined?arguments[3]:[];this.QueryFixtureShape(shape,index,transform,function(fixture){out.push(fixture);return true;});return out;}},{key:"QueryFixturePoint",value:function QueryFixturePoint(){if((arguments.length<=0?undefined:arguments[0])instanceof b2QueryCallback){this._QueryFixturePoint(arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1]);}else {this._QueryFixturePoint(null,arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1]);}}},{key:"_QueryFixturePoint",value:function _QueryFixturePoint(callback,point,fn){this.m_contactManager.m_broadPhase.QueryPoint(point,function(proxy){var fixture_proxy=proxy.userData;// DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
      var fixture=fixture_proxy.fixture;if(fixture.TestPoint(point)){if(callback){return callback.ReportFixture(fixture);}else if(fn){return fn(fixture);}}return true;});// #if B2_ENABLE_PARTICLE
      if(callback){for(var p=this.m_particleSystemList;p;p=p.m_next){if(callback.ShouldQueryParticleSystem(p)){p.QueryPointAABB(callback,point);}}}// #endif
      }},{key:"QueryAllFixturePoint",value:function QueryAllFixturePoint(point){var out=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];this.QueryFixturePoint(point,function(fixture){out.push(fixture);return true;});return out;}},{key:"RayCast",value:function RayCast(){if((arguments.length<=0?undefined:arguments[0])instanceof b2RayCastCallback){this._RayCast(arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1],arguments.length<=2?undefined:arguments[2]);}else {this._RayCast(null,arguments.length<=0?undefined:arguments[0],arguments.length<=1?undefined:arguments[1],arguments.length<=2?undefined:arguments[2]);}}},{key:"_RayCast",value:function _RayCast(callback,point1,point2,fn){var input=b2World.RayCast_s_input;input.maxFraction=1;input.p1.Copy(point1);input.p2.Copy(point2);this.m_contactManager.m_broadPhase.RayCast(input,function(input,proxy){var fixture_proxy=proxy.userData;// DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
      var fixture=fixture_proxy.fixture;var index=fixture_proxy.childIndex;var output=b2World.RayCast_s_output;var hit=fixture.RayCast(output,input,index);if(hit){var fraction=output.fraction;var point=b2World.RayCast_s_point;point.Set((1-fraction)*point1.x+fraction*point2.x,(1-fraction)*point1.y+fraction*point2.y);if(callback){return callback.ReportFixture(fixture,point,output.normal,fraction);}else if(fn){return fn(fixture,point,output.normal,fraction);}}return input.maxFraction;});// #if B2_ENABLE_PARTICLE
      if(callback){for(var p=this.m_particleSystemList;p;p=p.m_next){if(callback.ShouldQueryParticleSystem(p)){p.RayCast(callback,point1,point2);}}}// #endif
      }},{key:"RayCastOne",value:function RayCastOne(point1,point2){var result=null;var min_fraction=1;this.RayCast(point1,point2,function(fixture,point,normal,fraction){if(fraction<min_fraction){min_fraction=fraction;result=fixture;}return min_fraction;});return result;}},{key:"RayCastAll",value:function RayCastAll(point1,point2){var out=arguments.length>2&&arguments[2]!==undefined?arguments[2]:[];this.RayCast(point1,point2,function(fixture,point,normal,fraction){out.push(fixture);return 1;});return out;}/// Get the world body list. With the returned body, use b2Body::GetNext to get
      /// the next body in the world list. A NULL body indicates the end of the list.
      /// @return the head of the world body list.
      },{key:"GetBodyList",value:function GetBodyList(){return this.m_bodyList;}/// Get the world joint list. With the returned joint, use b2Joint::GetNext to get
      /// the next joint in the world list. A NULL joint indicates the end of the list.
      /// @return the head of the world joint list.
      },{key:"GetJointList",value:function GetJointList(){return this.m_jointList;}// #if B2_ENABLE_PARTICLE
      },{key:"GetParticleSystemList",value:function GetParticleSystemList(){return this.m_particleSystemList;}// #endif
      /// Get the world contact list. With the returned contact, use b2Contact::GetNext to get
      /// the next contact in the world list. A NULL contact indicates the end of the list.
      /// @return the head of the world contact list.
      /// @warning contacts are created and destroyed in the middle of a time step.
      /// Use b2ContactListener to avoid missing contacts.
      },{key:"GetContactList",value:function GetContactList(){return this.m_contactManager.m_contactList;}/// Enable/disable sleep.
      },{key:"SetAllowSleeping",value:function SetAllowSleeping(flag){if(flag===this.m_allowSleep){return;}this.m_allowSleep=flag;if(!this.m_allowSleep){for(var b=this.m_bodyList;b;b=b.m_next){b.SetAwake(true);}}}},{key:"GetAllowSleeping",value:function GetAllowSleeping(){return this.m_allowSleep;}/// Enable/disable warm starting. For testing.
      },{key:"SetWarmStarting",value:function SetWarmStarting(flag){this.m_warmStarting=flag;}},{key:"GetWarmStarting",value:function GetWarmStarting(){return this.m_warmStarting;}/// Enable/disable continuous physics. For testing.
      },{key:"SetContinuousPhysics",value:function SetContinuousPhysics(flag){this.m_continuousPhysics=flag;}},{key:"GetContinuousPhysics",value:function GetContinuousPhysics(){return this.m_continuousPhysics;}/// Enable/disable single stepped continuous physics. For testing.
      },{key:"SetSubStepping",value:function SetSubStepping(flag){this.m_subStepping=flag;}},{key:"GetSubStepping",value:function GetSubStepping(){return this.m_subStepping;}/// Get the number of broad-phase proxies.
      },{key:"GetProxyCount",value:function GetProxyCount(){return this.m_contactManager.m_broadPhase.GetProxyCount();}/// Get the number of bodies.
      },{key:"GetBodyCount",value:function GetBodyCount(){return this.m_bodyCount;}/// Get the number of joints.
      },{key:"GetJointCount",value:function GetJointCount(){return this.m_jointCount;}/// Get the number of contacts (each may have 0 or more contact points).
      },{key:"GetContactCount",value:function GetContactCount(){return this.m_contactManager.m_contactCount;}/// Get the height of the dynamic tree.
      },{key:"GetTreeHeight",value:function GetTreeHeight(){return this.m_contactManager.m_broadPhase.GetTreeHeight();}/// Get the balance of the dynamic tree.
      },{key:"GetTreeBalance",value:function GetTreeBalance(){return this.m_contactManager.m_broadPhase.GetTreeBalance();}/// Get the quality metric of the dynamic tree. The smaller the better.
      /// The minimum is 1.
      },{key:"GetTreeQuality",value:function GetTreeQuality(){return this.m_contactManager.m_broadPhase.GetTreeQuality();}/// Change the global gravity vector.
      },{key:"SetGravity",value:function SetGravity(gravity){var wake=arguments.length>1&&arguments[1]!==undefined?arguments[1]:true;if(!b2Vec2.IsEqualToV(this.m_gravity,gravity)){this.m_gravity.Copy(gravity);if(wake){for(var b=this.m_bodyList;b;b=b.m_next){b.SetAwake(true);}}}}/// Get the global gravity vector.
      },{key:"GetGravity",value:function GetGravity(){return this.m_gravity;}/// Is the world locked (in the middle of a time step).
      },{key:"IsLocked",value:function IsLocked(){return this.m_locked;}/// Set flag to control automatic clearing of forces after each time step.
      },{key:"SetAutoClearForces",value:function SetAutoClearForces(flag){this.m_clearForces=flag;}/// Get the flag that controls automatic clearing of forces after each time step.
      },{key:"GetAutoClearForces",value:function GetAutoClearForces(){return this.m_clearForces;}/// Shift the world origin. Useful for large worlds.
      /// The body shift formula is: position -= newOrigin
      /// @param newOrigin the new origin with respect to the old origin
      },{key:"ShiftOrigin",value:function ShiftOrigin(newOrigin){if(this.IsLocked()){throw new Error();}for(var b=this.m_bodyList;b;b=b.m_next){b.m_xf.p.SelfSub(newOrigin);b.m_sweep.c0.SelfSub(newOrigin);b.m_sweep.c.SelfSub(newOrigin);}for(var j=this.m_jointList;j;j=j.m_next){j.ShiftOrigin(newOrigin);}this.m_contactManager.m_broadPhase.ShiftOrigin(newOrigin);}/// Get the contact manager for testing.
      },{key:"GetContactManager",value:function GetContactManager(){return this.m_contactManager;}/// Get the current profile.
      },{key:"GetProfile",value:function GetProfile(){return this.m_profile;}/// Dump the world into the log file.
      /// @warning this should be called outside of a time step.
      },{key:"Dump",value:function Dump(log){if(this.m_locked){return;}log("const g: b2Vec2 = new b2Vec2(%.15f, %.15f);\n",this.m_gravity.x,this.m_gravity.y);log("this.m_world.SetGravity(g);\n");log("const bodies: b2Body[] = [];\n");log("const joints: b2Joint[] = [];\n");var i=0;for(var b=this.m_bodyList;b;b=b.m_next){b.m_islandIndex=i;b.Dump(log);++i;}i=0;for(var j=this.m_jointList;j;j=j.m_next){j.m_index=i;++i;}// First pass on joints, skip gear joints.
      for(var _j5=this.m_jointList;_j5;_j5=_j5.m_next){if(_j5.m_type===exports.b2JointType.e_gearJoint){continue;}log("{\n");_j5.Dump(log);log("}\n");}// Second pass on joints, only gear joints.
      for(var _j6=this.m_jointList;_j6;_j6=_j6.m_next){if(_j6.m_type!==exports.b2JointType.e_gearJoint){continue;}log("{\n");_j6.Dump(log);log("}\n");}}},{key:"DrawJoint",value:function DrawJoint(joint){if(this.m_debugDraw===null){return;}var bodyA=joint.GetBodyA();var bodyB=joint.GetBodyB();var xf1=bodyA.m_xf;var xf2=bodyB.m_xf;var x1=xf1.p;var x2=xf2.p;var p1=joint.GetAnchorA(b2World.DrawJoint_s_p1);var p2=joint.GetAnchorB(b2World.DrawJoint_s_p2);var color=b2World.DrawJoint_s_color.SetRGB(0.5,0.8,0.8);switch(joint.m_type){case exports.b2JointType.e_distanceJoint:this.m_debugDraw.DrawSegment(p1,p2,color);break;case exports.b2JointType.e_pulleyJoint:{var pulley=joint;var s1=pulley.GetGroundAnchorA();var s2=pulley.GetGroundAnchorB();this.m_debugDraw.DrawSegment(s1,p1,color);this.m_debugDraw.DrawSegment(s2,p2,color);this.m_debugDraw.DrawSegment(s1,s2,color);break;}case exports.b2JointType.e_mouseJoint:{var c=b2World.DrawJoint_s_c;c.Set(0.0,1.0,0.0);this.m_debugDraw.DrawPoint(p1,4.0,c);this.m_debugDraw.DrawPoint(p2,4.0,c);c.Set(0.8,0.8,0.8);this.m_debugDraw.DrawSegment(p1,p2,c);break;}default:this.m_debugDraw.DrawSegment(x1,p1,color);this.m_debugDraw.DrawSegment(p1,p2,color);this.m_debugDraw.DrawSegment(x2,p2,color);}}},{key:"DrawShape",value:function DrawShape(fixture,color){if(this.m_debugDraw===null){return;}var shape=fixture.GetShape();switch(shape.m_type){case exports.b2ShapeType.e_circleShape:{var circle=shape;var center=circle.m_p;var radius=circle.m_radius;var axis=b2Vec2.UNITX;this.m_debugDraw.DrawSolidCircle(center,radius,axis,color);break;}case exports.b2ShapeType.e_edgeShape:{var edge=shape;var v1=edge.m_vertex1;var v2=edge.m_vertex2;this.m_debugDraw.DrawSegment(v1,v2,color);break;}case exports.b2ShapeType.e_chainShape:{var chain=shape;var count=chain.m_count;var vertices=chain.m_vertices;var ghostColor=b2World.DrawShape_s_ghostColor.SetRGBA(0.75*color.r,0.75*color.g,0.75*color.b,color.a);var _v7=vertices[0];this.m_debugDraw.DrawPoint(_v7,4.0,color);if(chain.m_hasPrevVertex){var vp=chain.m_prevVertex;this.m_debugDraw.DrawSegment(vp,_v7,ghostColor);this.m_debugDraw.DrawCircle(vp,0.1,ghostColor);}for(var i=1;i<count;++i){var _v8=vertices[i];this.m_debugDraw.DrawSegment(_v7,_v8,color);this.m_debugDraw.DrawPoint(_v8,4.0,color);_v7=_v8;}if(chain.m_hasNextVertex){var vn=chain.m_nextVertex;this.m_debugDraw.DrawSegment(vn,_v7,ghostColor);this.m_debugDraw.DrawCircle(vn,0.1,ghostColor);}break;}case exports.b2ShapeType.e_polygonShape:{var poly=shape;var vertexCount=poly.m_count;var _vertices4=poly.m_vertices;this.m_debugDraw.DrawSolidPolygon(_vertices4,vertexCount,color);break;}}}},{key:"Solve",value:function Solve(step){// #if B2_ENABLE_PARTICLE
      // update previous transforms
      for(var b=this.m_bodyList;b;b=b.m_next){b.m_xf0.Copy(b.m_xf);}// #endif
      // #if B2_ENABLE_CONTROLLER
      // @see b2Controller list
      for(var controller=this.m_controllerList;controller;controller=controller.m_next){controller.Step(step);}// #endif
      this.m_profile.solveInit=0;this.m_profile.solveVelocity=0;this.m_profile.solvePosition=0;// Size the island for the worst case.
      var island=this.m_island;island.Initialize(this.m_bodyCount,this.m_contactManager.m_contactCount,this.m_jointCount,this.m_contactManager.m_contactListener);// Clear all the island flags.
      for(var _b15=this.m_bodyList;_b15;_b15=_b15.m_next){_b15.m_islandFlag=false;}for(var c=this.m_contactManager.m_contactList;c;c=c.m_next){c.m_islandFlag=false;}for(var j=this.m_jointList;j;j=j.m_next){j.m_islandFlag=false;}// Build and simulate all awake islands.
      // DEBUG: const stackSize: number = this.m_bodyCount;
      var stack=this.s_stack;for(var seed=this.m_bodyList;seed;seed=seed.m_next){if(seed.m_islandFlag){continue;}if(!seed.IsAwake()||!seed.IsActive()){continue;}// The seed can be dynamic or kinematic.
      if(seed.GetType()===exports.b2BodyType.b2_staticBody){continue;}// Reset island and stack.
      island.Clear();var stackCount=0;stack[stackCount++]=seed;seed.m_islandFlag=true;// Perform a depth first search (DFS) on the constraint graph.
      while(stackCount>0){// Grab the next body off the stack and add it to the island.
      var _b16=stack[--stackCount];if(!_b16){throw new Error();}// DEBUG: b2Assert(b.IsActive());
      island.AddBody(_b16);// Make sure the body is awake. (without resetting sleep timer).
      _b16.m_awakeFlag=true;// To keep islands as small as possible, we don't
      // propagate islands across static bodies.
      if(_b16.GetType()===exports.b2BodyType.b2_staticBody){continue;}// Search all contacts connected to this body.
      for(var ce=_b16.m_contactList;ce;ce=ce.next){var contact=ce.contact;// Has this contact already been added to an island?
      if(contact.m_islandFlag){continue;}// Is this contact solid and touching?
      if(!contact.IsEnabled()||!contact.IsTouching()){continue;}// Skip sensors.
      var sensorA=contact.m_fixtureA.m_isSensor;var sensorB=contact.m_fixtureB.m_isSensor;if(sensorA||sensorB){continue;}island.AddContact(contact);contact.m_islandFlag=true;var other=ce.other;// Was the other body already added to this island?
      if(other.m_islandFlag){continue;}// DEBUG: b2Assert(stackCount < stackSize);
      stack[stackCount++]=other;other.m_islandFlag=true;}// Search all joints connect to this body.
      for(var je=_b16.m_jointList;je;je=je.next){if(je.joint.m_islandFlag){continue;}var _other=je.other;// Don't simulate joints connected to inactive bodies.
      if(!_other.IsActive()){continue;}island.AddJoint(je.joint);je.joint.m_islandFlag=true;if(_other.m_islandFlag){continue;}// DEBUG: b2Assert(stackCount < stackSize);
      stack[stackCount++]=_other;_other.m_islandFlag=true;}}var profile=new b2Profile();island.Solve(profile,step,this.m_gravity,this.m_allowSleep);this.m_profile.solveInit+=profile.solveInit;this.m_profile.solveVelocity+=profile.solveVelocity;this.m_profile.solvePosition+=profile.solvePosition;// Post solve cleanup.
      for(var i=0;i<island.m_bodyCount;++i){// Allow static bodies to participate in other islands.
      var _b17=island.m_bodies[i];if(_b17.GetType()===exports.b2BodyType.b2_staticBody){_b17.m_islandFlag=false;}}}for(var _i39=0;_i39<stack.length;++_i39){if(!stack[_i39]){break;}stack[_i39]=null;}var timer=new b2Timer();// Synchronize fixtures, check for out of range bodies.
      for(var _b18=this.m_bodyList;_b18;_b18=_b18.m_next){// If a body was not in an island then it did not move.
      if(!_b18.m_islandFlag){continue;}if(_b18.GetType()===exports.b2BodyType.b2_staticBody){continue;}// Update fixtures (for broad-phase).
      _b18.SynchronizeFixtures();}// Look for new contacts.
      this.m_contactManager.FindNewContacts();this.m_profile.broadphase=timer.GetMilliseconds();}},{key:"SolveTOI",value:function SolveTOI(step){var island=this.m_island;island.Initialize(2*b2_maxTOIContacts,b2_maxTOIContacts,0,this.m_contactManager.m_contactListener);if(this.m_stepComplete){for(var b=this.m_bodyList;b;b=b.m_next){b.m_islandFlag=false;b.m_sweep.alpha0=0;}for(var c=this.m_contactManager.m_contactList;c;c=c.m_next){// Invalidate TOI
      c.m_toiFlag=false;c.m_islandFlag=false;c.m_toiCount=0;c.m_toi=1;}}// Find TOI events and solve them.
      for(;;){// Find the first TOI.
      var minContact=null;var minAlpha=1;for(var _c=this.m_contactManager.m_contactList;_c;_c=_c.m_next){// Is this contact disabled?
      if(!_c.IsEnabled()){continue;}// Prevent excessive sub-stepping.
      if(_c.m_toiCount>b2_maxSubSteps){continue;}var alpha=1;if(_c.m_toiFlag){// This contact has a valid cached TOI.
      alpha=_c.m_toi;}else {var _fA=_c.GetFixtureA();var _fB=_c.GetFixtureB();// Is there a sensor?
      if(_fA.IsSensor()||_fB.IsSensor()){continue;}var _bA=_fA.GetBody();var _bB=_fB.GetBody();var typeA=_bA.m_type;var typeB=_bB.m_type;// DEBUG: b2Assert(typeA !== b2BodyType.b2_staticBody || typeB !== b2BodyType.b2_staticBody);
      var activeA=_bA.IsAwake()&&typeA!==exports.b2BodyType.b2_staticBody;var activeB=_bB.IsAwake()&&typeB!==exports.b2BodyType.b2_staticBody;// Is at least one body active (awake and dynamic or kinematic)?
      if(!activeA&&!activeB){continue;}var collideA=_bA.IsBullet()||typeA!==exports.b2BodyType.b2_dynamicBody;var collideB=_bB.IsBullet()||typeB!==exports.b2BodyType.b2_dynamicBody;// Are these two non-bullet dynamic bodies?
      if(!collideA&&!collideB){continue;}// Compute the TOI for this contact.
      // Put the sweeps onto the same time interval.
      var alpha0=_bA.m_sweep.alpha0;if(_bA.m_sweep.alpha0<_bB.m_sweep.alpha0){alpha0=_bB.m_sweep.alpha0;_bA.m_sweep.Advance(alpha0);}else if(_bB.m_sweep.alpha0<_bA.m_sweep.alpha0){alpha0=_bA.m_sweep.alpha0;_bB.m_sweep.Advance(alpha0);}// DEBUG: b2Assert(alpha0 < 1);
      var indexA=_c.GetChildIndexA();var indexB=_c.GetChildIndexB();// Compute the time of impact in interval [0, minTOI]
      var input=b2World.SolveTOI_s_toi_input;input.proxyA.SetShape(_fA.GetShape(),indexA);input.proxyB.SetShape(_fB.GetShape(),indexB);input.sweepA.Copy(_bA.m_sweep);input.sweepB.Copy(_bB.m_sweep);input.tMax=1;var output=b2World.SolveTOI_s_toi_output;b2TimeOfImpact(output,input);// Beta is the fraction of the remaining portion of the .
      var beta=output.t;if(output.state===exports.b2TOIOutputState.e_touching){alpha=b2Min(alpha0+(1-alpha0)*beta,1);}else {alpha=1;}_c.m_toi=alpha;_c.m_toiFlag=true;}if(alpha<minAlpha){// This is the minimum TOI found so far.
      minContact=_c;minAlpha=alpha;}}if(minContact===null||1-10*b2_epsilon<minAlpha){// No more TOI events. Done!
      this.m_stepComplete=true;break;}// Advance the bodies to the TOI.
      var fA=minContact.GetFixtureA();var fB=minContact.GetFixtureB();var bA=fA.GetBody();var bB=fB.GetBody();var backup1=b2World.SolveTOI_s_backup1.Copy(bA.m_sweep);var backup2=b2World.SolveTOI_s_backup2.Copy(bB.m_sweep);bA.Advance(minAlpha);bB.Advance(minAlpha);// The TOI contact likely has some new contact points.
      minContact.Update(this.m_contactManager.m_contactListener);minContact.m_toiFlag=false;++minContact.m_toiCount;// Is the contact solid?
      if(!minContact.IsEnabled()||!minContact.IsTouching()){// Restore the sweeps.
      minContact.SetEnabled(false);bA.m_sweep.Copy(backup1);bB.m_sweep.Copy(backup2);bA.SynchronizeTransform();bB.SynchronizeTransform();continue;}bA.SetAwake(true);bB.SetAwake(true);// Build the island
      island.Clear();island.AddBody(bA);island.AddBody(bB);island.AddContact(minContact);bA.m_islandFlag=true;bB.m_islandFlag=true;minContact.m_islandFlag=true;// Get contacts on bodyA and bodyB.
      // const bodies: b2Body[] = [bA, bB];
      for(var i=0;i<2;++i){var body=i===0?bA:bB;// bodies[i];
      if(body.m_type===exports.b2BodyType.b2_dynamicBody){for(var ce=body.m_contactList;ce;ce=ce.next){if(island.m_bodyCount===island.m_bodyCapacity){break;}if(island.m_contactCount===island.m_contactCapacity){break;}var contact=ce.contact;// Has this contact already been added to the island?
      if(contact.m_islandFlag){continue;}// Only add static, kinematic, or bullet bodies.
      var other=ce.other;if(other.m_type===exports.b2BodyType.b2_dynamicBody&&!body.IsBullet()&&!other.IsBullet()){continue;}// Skip sensors.
      var sensorA=contact.m_fixtureA.m_isSensor;var sensorB=contact.m_fixtureB.m_isSensor;if(sensorA||sensorB){continue;}// Tentatively advance the body to the TOI.
      var backup=b2World.SolveTOI_s_backup.Copy(other.m_sweep);if(!other.m_islandFlag){other.Advance(minAlpha);}// Update the contact points
      contact.Update(this.m_contactManager.m_contactListener);// Was the contact disabled by the user?
      if(!contact.IsEnabled()){other.m_sweep.Copy(backup);other.SynchronizeTransform();continue;}// Are there contact points?
      if(!contact.IsTouching()){other.m_sweep.Copy(backup);other.SynchronizeTransform();continue;}// Add the contact to the island
      contact.m_islandFlag=true;island.AddContact(contact);// Has the other body already been added to the island?
      if(other.m_islandFlag){continue;}// Add the other body to the island.
      other.m_islandFlag=true;if(other.m_type!==exports.b2BodyType.b2_staticBody){other.SetAwake(true);}island.AddBody(other);}}}var subStep=b2World.SolveTOI_s_subStep;subStep.dt=(1-minAlpha)*step.dt;subStep.inv_dt=1/subStep.dt;subStep.dtRatio=1;subStep.positionIterations=20;subStep.velocityIterations=step.velocityIterations;// #if B2_ENABLE_PARTICLE
      subStep.particleIterations=step.particleIterations;// #endif
      subStep.warmStarting=false;island.SolveTOI(subStep,bA.m_islandIndex,bB.m_islandIndex);// Reset island flags and synchronize broad-phase proxies.
      for(var _i40=0;_i40<island.m_bodyCount;++_i40){var _body3=island.m_bodies[_i40];_body3.m_islandFlag=false;if(_body3.m_type!==exports.b2BodyType.b2_dynamicBody){continue;}_body3.SynchronizeFixtures();// Invalidate all contact TOIs on this displaced body.
      for(var _ce=_body3.m_contactList;_ce;_ce=_ce.next){_ce.contact.m_toiFlag=false;_ce.contact.m_islandFlag=false;}}// Commit fixture proxy movements to the broad-phase so that new contacts are created.
      // Also, some contacts can be destroyed.
      this.m_contactManager.FindNewContacts();if(this.m_subStepping){this.m_stepComplete=false;break;}}}// #if B2_ENABLE_CONTROLLER
      },{key:"AddController",value:function AddController(controller){// b2Assert(controller.m_world === null, "Controller can only be a member of one world");
      // controller.m_world = this;
      controller.m_next=this.m_controllerList;controller.m_prev=null;if(this.m_controllerList){this.m_controllerList.m_prev=controller;}this.m_controllerList=controller;++this.m_controllerCount;return controller;}},{key:"RemoveController",value:function RemoveController(controller){// b2Assert(controller.m_world === this, "Controller is not a member of this world");
      if(controller.m_prev){controller.m_prev.m_next=controller.m_next;}if(controller.m_next){controller.m_next.m_prev=controller.m_prev;}if(this.m_controllerList===controller){this.m_controllerList=controller.m_next;}--this.m_controllerCount;controller.m_prev=null;controller.m_next=null;// delete controller.m_world; // = null;
      return controller;}}],[{key:"_Joint_Create",value:function _Joint_Create(def){switch(def.type){case exports.b2JointType.e_distanceJoint:return new b2DistanceJoint(def);case exports.b2JointType.e_mouseJoint:return new b2MouseJoint(def);case exports.b2JointType.e_prismaticJoint:return new b2PrismaticJoint(def);case exports.b2JointType.e_revoluteJoint:return new b2RevoluteJoint(def);case exports.b2JointType.e_pulleyJoint:return new b2PulleyJoint(def);case exports.b2JointType.e_gearJoint:return new b2GearJoint(def);case exports.b2JointType.e_wheelJoint:return new b2WheelJoint(def);case exports.b2JointType.e_weldJoint:return new b2WeldJoint(def);case exports.b2JointType.e_frictionJoint:return new b2FrictionJoint(def);case exports.b2JointType.e_ropeJoint:return new b2RopeJoint(def);case exports.b2JointType.e_motorJoint:return new b2MotorJoint(def);case exports.b2JointType.e_areaJoint:return new b2AreaJoint(def);}throw new Error();}},{key:"_Joint_Destroy",value:function _Joint_Destroy(joint){}}]);}();// #endif
      /// Take a time step. This performs collision detection, integration,
      /// and constraint solution.
      /// @param timeStep the amount of time to simulate, this should not vary.
      /// @param velocityIterations for the velocity constraint solver.
      /// @param positionIterations for the position constraint solver.
      b2World.Step_s_step=new b2TimeStep();b2World.Step_s_stepTimer=new b2Timer();b2World.Step_s_timer=new b2Timer();// #endif
      /// Call this to draw shapes and other debug draw data.
      b2World.DrawDebugData_s_color=new b2Color(0,0,0);b2World.DrawDebugData_s_vs=b2Vec2.MakeArray(4);b2World.DrawDebugData_s_xf=new b2Transform();b2World.QueryFixtureShape_s_aabb=new b2AABB();b2World.RayCast_s_input=new b2RayCastInput();b2World.RayCast_s_output=new b2RayCastOutput();b2World.RayCast_s_point=new b2Vec2();b2World.DrawJoint_s_p1=new b2Vec2();b2World.DrawJoint_s_p2=new b2Vec2();b2World.DrawJoint_s_color=new b2Color(0.5,0.8,0.8);b2World.DrawJoint_s_c=new b2Color();b2World.DrawShape_s_ghostColor=new b2Color();b2World.SolveTOI_s_subStep=new b2TimeStep();b2World.SolveTOI_s_backup=new b2Sweep();b2World.SolveTOI_s_backup1=new b2Sweep();b2World.SolveTOI_s_backup2=new b2Sweep();b2World.SolveTOI_s_toi_input=new b2TOIInput();b2World.SolveTOI_s_toi_output=new b2TOIOutput();/*
         * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * A controller edge is used to connect bodies and controllers
         * together in a bipartite graph.
         */var b2ControllerEdge=/*#__PURE__*/_createClass(function b2ControllerEdge(controller,body){_classCallCheck(this,b2ControllerEdge);this.prevBody=null;///< the previous controller edge in the controllers's joint list
      this.nextBody=null;///< the next controller edge in the controllers's joint list
      this.prevController=null;///< the previous controller edge in the body's joint list
      this.nextController=null;///< the next controller edge in the body's joint list
      this.controller=controller;this.body=body;});/**
         * Base class for controllers. Controllers are a convience for
         * encapsulating common per-step functionality.
         */var b2Controller=/*#__PURE__*/function(){function b2Controller(){_classCallCheck(this,b2Controller);// m_world: b2World;
      this.m_bodyList=null;this.m_bodyCount=0;this.m_prev=null;this.m_next=null;}/**
             * Get the next controller in the world's body list.
             */return _createClass(b2Controller,[{key:"GetNext",value:function GetNext(){return this.m_next;}/**
             * Get the previous controller in the world's body list.
             */},{key:"GetPrev",value:function GetPrev(){return this.m_prev;}/**
             * Get the parent world of this body.
             */// GetWorld() {
      //   return this.m_world;
      // }
      /**
             * Get the attached body list
             */},{key:"GetBodyList",value:function GetBodyList(){return this.m_bodyList;}/**
             * Adds a body to the controller list.
             */},{key:"AddBody",value:function AddBody(body){var edge=new b2ControllerEdge(this,body);//Add edge to controller list
      edge.nextBody=this.m_bodyList;edge.prevBody=null;if(this.m_bodyList){this.m_bodyList.prevBody=edge;}this.m_bodyList=edge;++this.m_bodyCount;//Add edge to body list
      edge.nextController=body.m_controllerList;edge.prevController=null;if(body.m_controllerList){body.m_controllerList.prevController=edge;}body.m_controllerList=edge;++body.m_controllerCount;}/**
             * Removes a body from the controller list.
             */},{key:"RemoveBody",value:function RemoveBody(body){//Assert that the controller is not empty
      if(this.m_bodyCount<=0){throw new Error();}//Find the corresponding edge
      /*b2ControllerEdge*/var edge=this.m_bodyList;while(edge&&edge.body!==body){edge=edge.nextBody;}//Assert that we are removing a body that is currently attached to the controller
      if(edge===null){throw new Error();}//Remove edge from controller list
      if(edge.prevBody){edge.prevBody.nextBody=edge.nextBody;}if(edge.nextBody){edge.nextBody.prevBody=edge.prevBody;}if(this.m_bodyList===edge){this.m_bodyList=edge.nextBody;}--this.m_bodyCount;//Remove edge from body list
      if(edge.nextController){edge.nextController.prevController=edge.prevController;}if(edge.prevController){edge.prevController.nextController=edge.nextController;}if(body.m_controllerList===edge){body.m_controllerList=edge.nextController;}--body.m_controllerCount;}/**
             * Removes all bodies from the controller list.
             */},{key:"Clear",value:function Clear(){while(this.m_bodyList){this.RemoveBody(this.m_bodyList.body);}this.m_bodyCount=0;}}]);}();// #endif
      /*
         * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * Calculates buoyancy forces for fluids in the form of a half
         * plane.
         */var b2BuoyancyController=/*#__PURE__*/function(_b2Controller){function b2BuoyancyController(){var _this36;_classCallCheck(this,b2BuoyancyController);_this36=_callSuper(this,b2BuoyancyController,arguments);/**
                 * The outer surface normal
                 */_this36.normal=new b2Vec2(0,1);/**
                 * The height of the fluid surface along the normal
                 */_this36.offset=0;/**
                 * The fluid density
                 */_this36.density=0;/**
                 * Fluid velocity, for drag calculations
                 */_this36.velocity=new b2Vec2(0,0);/**
                 * Linear drag co-efficient
                 */_this36.linearDrag=0;/**
                 * Angular drag co-efficient
                 */_this36.angularDrag=0;/**
                 * If false, bodies are assumed to be uniformly dense, otherwise
                 * use the shapes densities
                 */_this36.useDensity=false;//False by default to prevent a gotcha
      /**
                 * If true, gravity is taken from the world instead of the
                 */_this36.useWorldGravity=true;/**
                 * Gravity vector, if the world's gravity is not used
                 */_this36.gravity=new b2Vec2(0,0);return _this36;}_inherits(b2BuoyancyController,_b2Controller);return _createClass(b2BuoyancyController,[{key:"Step",value:function Step(step){if(!this.m_bodyList){return;}if(this.useWorldGravity){this.gravity.Copy(this.m_bodyList.body.GetWorld().GetGravity());}for(var i=this.m_bodyList;i;i=i.nextBody){var body=i.body;if(!body.IsAwake()){//Buoyancy force is just a function of position,
      //so unlike most forces, it is safe to ignore sleeping bodes
      continue;}var areac=new b2Vec2();var massc=new b2Vec2();var area=0;var mass=0;for(var fixture=body.GetFixtureList();fixture;fixture=fixture.m_next){var sc=new b2Vec2();var sarea=fixture.GetShape().ComputeSubmergedArea(this.normal,this.offset,body.GetTransform(),sc);area+=sarea;areac.x+=sarea*sc.x;areac.y+=sarea*sc.y;var shapeDensity=0;if(this.useDensity){//TODO: Expose density publicly
      shapeDensity=fixture.GetDensity();}else {shapeDensity=1;}mass+=sarea*shapeDensity;massc.x+=sarea*sc.x*shapeDensity;massc.y+=sarea*sc.y*shapeDensity;}areac.x/=area;areac.y/=area;//    b2Vec2 localCentroid = b2MulT(body->GetXForm(),areac);
      massc.x/=mass;massc.y/=mass;if(area<b2_epsilon){continue;}//Buoyancy
      var buoyancyForce=this.gravity.Clone().SelfNeg();buoyancyForce.SelfMul(this.density*area);body.ApplyForce(buoyancyForce,massc);//Linear drag
      var dragForce=body.GetLinearVelocityFromWorldPoint(areac,new b2Vec2());dragForce.SelfSub(this.velocity);dragForce.SelfMul(-this.linearDrag*area);body.ApplyForce(dragForce,areac);//Angular drag
      //TODO: Something that makes more physical sense?
      body.ApplyTorque(-body.GetInertia()/body.GetMass()*area*body.GetAngularVelocity()*this.angularDrag);}}},{key:"Draw",value:function Draw(debugDraw){var r=100;var p1=new b2Vec2();var p2=new b2Vec2();p1.x=this.normal.x*this.offset+this.normal.y*r;p1.y=this.normal.y*this.offset-this.normal.x*r;p2.x=this.normal.x*this.offset-this.normal.y*r;p2.y=this.normal.y*this.offset+this.normal.x*r;var color=new b2Color(0,0,0.8);debugDraw.DrawSegment(p1,p2,color);}}]);}(b2Controller);// #endif
      /*
         * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * Applies a force every frame
         */var b2ConstantAccelController=/*#__PURE__*/function(_b2Controller2){function b2ConstantAccelController(){var _this37;_classCallCheck(this,b2ConstantAccelController);_this37=_callSuper(this,b2ConstantAccelController,arguments);/**
                 * The acceleration to apply
                 */_this37.A=new b2Vec2(0,0);return _this37;}_inherits(b2ConstantAccelController,_b2Controller2);return _createClass(b2ConstantAccelController,[{key:"Step",value:function Step(step){var dtA=b2Vec2.MulSV(step.dt,this.A,b2ConstantAccelController.Step_s_dtA);for(var i=this.m_bodyList;i;i=i.nextBody){var body=i.body;if(!body.IsAwake()){continue;}body.SetLinearVelocity(b2Vec2.AddVV(body.GetLinearVelocity(),dtA,b2Vec2.s_t0));}}},{key:"Draw",value:function Draw(draw){}}]);}(b2Controller);b2ConstantAccelController.Step_s_dtA=new b2Vec2();// #endif
      /*
         * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * Applies a force every frame
         */var b2ConstantForceController=/*#__PURE__*/function(_b2Controller3){function b2ConstantForceController(){var _this38;_classCallCheck(this,b2ConstantForceController);_this38=_callSuper(this,b2ConstantForceController,arguments);/**
                 * The force to apply
                 */_this38.F=new b2Vec2(0,0);return _this38;}_inherits(b2ConstantForceController,_b2Controller3);return _createClass(b2ConstantForceController,[{key:"Step",value:function Step(step){for(var i=this.m_bodyList;i;i=i.nextBody){var body=i.body;if(!body.IsAwake()){continue;}body.ApplyForce(this.F,body.GetWorldCenter());}}},{key:"Draw",value:function Draw(draw){}}]);}(b2Controller);// #endif
      /*
         * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * Applies simplified gravity between every pair of bodies
         */var b2GravityController=/*#__PURE__*/function(_b2Controller4){function b2GravityController(){var _this39;_classCallCheck(this,b2GravityController);_this39=_callSuper(this,b2GravityController,arguments);/**
                 * Specifies the strength of the gravitiation force
                 */_this39.G=1;/**
                 * If true, gravity is proportional to r^-2, otherwise r^-1
                 */_this39.invSqr=true;return _this39;}/**
             * @see b2Controller::Step
             */_inherits(b2GravityController,_b2Controller4);return _createClass(b2GravityController,[{key:"Step",value:function Step(step){if(this.invSqr){for(var i=this.m_bodyList;i;i=i.nextBody){var body1=i.body;var p1=body1.GetWorldCenter();var mass1=body1.GetMass();for(var j=this.m_bodyList;j&&j!==i;j=j.nextBody){var body2=j.body;var p2=body2.GetWorldCenter();var mass2=body2.GetMass();var dx=p2.x-p1.x;var dy=p2.y-p1.y;var r2=dx*dx+dy*dy;if(r2<b2_epsilon){continue;}var f=b2GravityController.Step_s_f.Set(dx,dy);f.SelfMul(this.G/r2/b2Sqrt(r2)*mass1*mass2);if(body1.IsAwake()){body1.ApplyForce(f,p1);}if(body2.IsAwake()){body2.ApplyForce(f.SelfMul(-1),p2);}}}}else {for(var _i41=this.m_bodyList;_i41;_i41=_i41.nextBody){var _body4=_i41.body;var _p2=_body4.GetWorldCenter();var _mass2=_body4.GetMass();for(var _j7=this.m_bodyList;_j7&&_j7!==_i41;_j7=_j7.nextBody){var _body5=_j7.body;var _p3=_body5.GetWorldCenter();var _mass3=_body5.GetMass();var _dx=_p3.x-_p2.x;var _dy=_p3.y-_p2.y;var _r=_dx*_dx+_dy*_dy;if(_r<b2_epsilon){continue;}var _f8=b2GravityController.Step_s_f.Set(_dx,_dy);_f8.SelfMul(this.G/_r*_mass2*_mass3);if(_body4.IsAwake()){_body4.ApplyForce(_f8,_p2);}if(_body5.IsAwake()){_body5.ApplyForce(_f8.SelfMul(-1),_p3);}}}}}},{key:"Draw",value:function Draw(draw){}}]);}(b2Controller);b2GravityController.Step_s_f=new b2Vec2();// #endif
      /*
         * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
         *
         * This software is provided 'as-is', without any express or implied
         * warranty.  In no event will the authors be held liable for any damages
         * arising from the use of this software.
         * Permission is granted to anyone to use this software for any purpose,
         * including commercial applications, and to alter it and redistribute it
         * freely, subject to the following restrictions:
         * 1. The origin of this software must not be misrepresented; you must not
         * claim that you wrote the original software. If you use this software
         * in a product, an acknowledgment in the product documentation would be
         * appreciated but is not required.
         * 2. Altered source versions must be plainly marked as such, and must not be
         * misrepresented as being the original software.
         * 3. This notice may not be removed or altered from any source distribution.
         *//**
         * Applies top down linear damping to the controlled bodies
         * The damping is calculated by multiplying velocity by a matrix
         * in local co-ordinates.
         */var b2TensorDampingController=/*#__PURE__*/function(_b2Controller5){function b2TensorDampingController(){var _this40;_classCallCheck(this,b2TensorDampingController);_this40=_callSuper(this,b2TensorDampingController,arguments);/// Tensor to use in damping model
      _this40.T=new b2Mat22();/*Some examples (matrixes in format (row1; row2))
                (-a 0; 0 -a)    Standard isotropic damping with strength a
                ( 0 a; -a 0)    Electron in fixed field - a force at right angles to velocity with proportional magnitude
                (-a 0; 0 -b)    Differing x and y damping. Useful e.g. for top-down wheels.
                *///By the way, tensor in this case just means matrix, don't let the terminology get you down.
      /// Set this to a positive number to clamp the maximum amount of damping done.
      _this40.maxTimestep=0;return _this40;}// Typically one wants maxTimestep to be 1/(max eigenvalue of T), so that damping will never cause something to reverse direction
      /**
             * @see b2Controller::Step
             */_inherits(b2TensorDampingController,_b2Controller5);return _createClass(b2TensorDampingController,[{key:"Step",value:function Step(step){var timestep=step.dt;if(timestep<=b2_epsilon){return;}if(timestep>this.maxTimestep&&this.maxTimestep>0){timestep=this.maxTimestep;}for(var i=this.m_bodyList;i;i=i.nextBody){var body=i.body;if(!body.IsAwake()){continue;}var damping=body.GetWorldVector(b2Mat22.MulMV(this.T,body.GetLocalVector(body.GetLinearVelocity(),b2Vec2.s_t0),b2Vec2.s_t1),b2TensorDampingController.Step_s_damping);//    body->SetLinearVelocity(body->GetLinearVelocity() + timestep * damping);
      body.SetLinearVelocity(b2Vec2.AddVV(body.GetLinearVelocity(),b2Vec2.MulSV(timestep,damping,b2Vec2.s_t0),b2Vec2.s_t1));}}},{key:"Draw",value:function Draw(draw){}/**
             * Sets damping independantly along the x and y axes
             */},{key:"SetAxisAligned",value:function SetAxisAligned(xDamping,yDamping){this.T.ex.x=-xDamping;this.T.ex.y=0;this.T.ey.x=0;this.T.ey.y=-yDamping;if(xDamping>0||yDamping>0){this.maxTimestep=1/b2Max(xDamping,yDamping);}else {this.maxTimestep=0;}}}]);}(b2Controller);b2TensorDampingController.Step_s_damping=new b2Vec2();// #endif
      /*
        * Copyright (c) 2011 Erin Catto http://www.box2d.org
        *
        * This software is provided 'as-is', without any express or implied
        * warranty.  In no event will the authors be held liable for any damages
        * arising from the use of this software.
        * Permission is granted to anyone to use this software for any purpose,
        * including commercial applications, and to alter it and redistribute it
        * freely, subject to the following restrictions:
        * 1. The origin of this software must not be misrepresented; you must not
        * claim that you wrote the original software. If you use this software
        * in a product, an acknowledgment in the product documentation would be
        * appreciated but is not required.
        * 2. Altered source versions must be plainly marked as such, and must not be
        * misrepresented as being the original software.
        * 3. This notice may not be removed or altered from any source distribution.
        *////
      var b2RopeDef=/*#__PURE__*/_createClass(function b2RopeDef(){_classCallCheck(this,b2RopeDef);///
      this.vertices=[];///
      this.count=0;///
      this.masses=[];///
      this.gravity=new b2Vec2(0,0);///
      this.damping=0.1;/// Stretching stiffness
      this.k2=0.9;/// Bending stiffness. Values above 0.5 can make the simulation blow up.
      this.k3=0.1;});///
      var b2Rope=/*#__PURE__*/function(){function b2Rope(){_classCallCheck(this,b2Rope);this.m_count=0;this.m_ps=[];this.m_p0s=[];this.m_vs=[];this.m_ims=[];this.m_Ls=[];this.m_as=[];this.m_gravity=new b2Vec2();this.m_damping=0;this.m_k2=1;this.m_k3=0.1;}return _createClass(b2Rope,[{key:"GetVertexCount",value:function GetVertexCount(){return this.m_count;}},{key:"GetVertices",value:function GetVertices(){return this.m_ps;}///
      },{key:"Initialize",value:function Initialize(def){// DEBUG: b2Assert(def.count >= 3);
      this.m_count=def.count;// this.m_ps = (b2Vec2*)b2Alloc(this.m_count * sizeof(b2Vec2));
      this.m_ps=b2Vec2.MakeArray(this.m_count);// this.m_p0s = (b2Vec2*)b2Alloc(this.m_count * sizeof(b2Vec2));
      this.m_p0s=b2Vec2.MakeArray(this.m_count);// this.m_vs = (b2Vec2*)b2Alloc(this.m_count * sizeof(b2Vec2));
      this.m_vs=b2Vec2.MakeArray(this.m_count);// this.m_ims = (float32*)b2Alloc(this.m_count * sizeof(float32));
      this.m_ims=b2MakeNumberArray(this.m_count);for(var i=0;i<this.m_count;++i){this.m_ps[i].Copy(def.vertices[i]);this.m_p0s[i].Copy(def.vertices[i]);this.m_vs[i].SetZero();var m=def.masses[i];if(m>0){this.m_ims[i]=1/m;}else {this.m_ims[i]=0;}}var count2=this.m_count-1;var count3=this.m_count-2;// this.m_Ls = (float32*)be2Alloc(count2 * sizeof(float32));
      this.m_Ls=b2MakeNumberArray(count2);// this.m_as = (float32*)b2Alloc(count3 * sizeof(float32));
      this.m_as=b2MakeNumberArray(count3);for(var _i42=0;_i42<count2;++_i42){var p1=this.m_ps[_i42];var p2=this.m_ps[_i42+1];this.m_Ls[_i42]=b2Vec2.DistanceVV(p1,p2);}for(var _i43=0;_i43<count3;++_i43){var _p4=this.m_ps[_i43];var _p5=this.m_ps[_i43+1];var p3=this.m_ps[_i43+2];var d1=b2Vec2.SubVV(_p5,_p4,b2Vec2.s_t0);var d2=b2Vec2.SubVV(p3,_p5,b2Vec2.s_t1);var a=b2Vec2.CrossVV(d1,d2);var b=b2Vec2.DotVV(d1,d2);this.m_as[_i43]=b2Atan2(a,b);}this.m_gravity.Copy(def.gravity);this.m_damping=def.damping;this.m_k2=def.k2;this.m_k3=def.k3;}///
      },{key:"Step",value:function Step(h,iterations){if(h===0){return;}var d=Math.exp(-h*this.m_damping);for(var i=0;i<this.m_count;++i){this.m_p0s[i].Copy(this.m_ps[i]);if(this.m_ims[i]>0){this.m_vs[i].SelfMulAdd(h,this.m_gravity);}this.m_vs[i].SelfMul(d);this.m_ps[i].SelfMulAdd(h,this.m_vs[i]);}for(var _i44=0;_i44<iterations;++_i44){this.SolveC2();this.SolveC3();this.SolveC2();}var inv_h=1/h;for(var _i45=0;_i45<this.m_count;++_i45){b2Vec2.MulSV(inv_h,b2Vec2.SubVV(this.m_ps[_i45],this.m_p0s[_i45],b2Vec2.s_t0),this.m_vs[_i45]);}}},{key:"SolveC2",value:function SolveC2(){var count2=this.m_count-1;for(var i=0;i<count2;++i){var p1=this.m_ps[i];var p2=this.m_ps[i+1];var d=b2Vec2.SubVV(p2,p1,b2Rope.s_d);var L=d.Normalize();var im1=this.m_ims[i];var im2=this.m_ims[i+1];if(im1+im2===0){continue;}var s1=im1/(im1+im2);var s2=im2/(im1+im2);p1.SelfMulSub(this.m_k2*s1*(this.m_Ls[i]-L),d);p2.SelfMulAdd(this.m_k2*s2*(this.m_Ls[i]-L),d);// this.m_ps[i] = p1;
      // this.m_ps[i + 1] = p2;
      }}},{key:"SetAngle",value:function SetAngle(angle){var count3=this.m_count-2;for(var i=0;i<count3;++i){this.m_as[i]=angle;}}},{key:"SolveC3",value:function SolveC3(){var count3=this.m_count-2;for(var i=0;i<count3;++i){var p1=this.m_ps[i];var p2=this.m_ps[i+1];var p3=this.m_ps[i+2];var m1=this.m_ims[i];var m2=this.m_ims[i+1];var m3=this.m_ims[i+2];var d1=b2Vec2.SubVV(p2,p1,b2Rope.s_d1);var d2=b2Vec2.SubVV(p3,p2,b2Rope.s_d2);var L1sqr=d1.LengthSquared();var L2sqr=d2.LengthSquared();if(L1sqr*L2sqr===0){continue;}var a=b2Vec2.CrossVV(d1,d2);var b=b2Vec2.DotVV(d1,d2);var angle=b2Atan2(a,b);var Jd1=b2Vec2.MulSV(-1/L1sqr,d1.SelfSkew(),b2Rope.s_Jd1);var Jd2=b2Vec2.MulSV(1/L2sqr,d2.SelfSkew(),b2Rope.s_Jd2);var J1=b2Vec2.NegV(Jd1,b2Rope.s_J1);var J2=b2Vec2.SubVV(Jd1,Jd2,b2Rope.s_J2);var J3=Jd2;var mass=m1*b2Vec2.DotVV(J1,J1)+m2*b2Vec2.DotVV(J2,J2)+m3*b2Vec2.DotVV(J3,J3);if(mass===0){continue;}mass=1/mass;var C=angle-this.m_as[i];while(C>b2_pi){angle-=2*b2_pi;C=angle-this.m_as[i];}while(C<-b2_pi){angle+=2*b2_pi;C=angle-this.m_as[i];}var impulse=-this.m_k3*mass*C;p1.SelfMulAdd(m1*impulse,J1);p2.SelfMulAdd(m2*impulse,J2);p3.SelfMulAdd(m3*impulse,J3);// this.m_ps[i] = p1;
      // this.m_ps[i + 1] = p2;
      // this.m_ps[i + 2] = p3;
      }}},{key:"Draw",value:function Draw(draw){var c=new b2Color(0.4,0.5,0.7);for(var i=0;i<this.m_count-1;++i){draw.DrawSegment(this.m_ps[i],this.m_ps[i+1],c);}}}]);}();///
      b2Rope.s_d=new b2Vec2();b2Rope.s_d1=new b2Vec2();b2Rope.s_d2=new b2Vec2();b2Rope.s_Jd1=new b2Vec2();b2Rope.s_Jd2=new b2Vec2();b2Rope.s_J1=new b2Vec2();b2Rope.s_J2=new b2Vec2();exports.b2AABB=b2AABB;exports.b2Abs=b2Abs;exports.b2Acos=b2Acos;exports.b2Alloc=b2Alloc;exports.b2AreaJoint=b2AreaJoint;exports.b2AreaJointDef=b2AreaJointDef;exports.b2Asin=b2Asin;exports.b2Assert=b2Assert;exports.b2Atan2=b2Atan2;exports.b2BlockAllocator=b2BlockAllocator;exports.b2Body=b2Body;exports.b2BodyDef=b2BodyDef;exports.b2BroadPhase=b2BroadPhase;exports.b2BuoyancyController=b2BuoyancyController;exports.b2CalculateParticleIterations=b2CalculateParticleIterations;exports.b2ChainAndCircleContact=b2ChainAndCircleContact;exports.b2ChainAndPolygonContact=b2ChainAndPolygonContact;exports.b2ChainShape=b2ChainShape;exports.b2CircleContact=b2CircleContact;exports.b2CircleShape=b2CircleShape;exports.b2Clamp=b2Clamp;exports.b2ClipSegmentToLine=b2ClipSegmentToLine;exports.b2ClipVertex=b2ClipVertex;exports.b2CollideCircles=b2CollideCircles;exports.b2CollideEdgeAndCircle=b2CollideEdgeAndCircle;exports.b2CollideEdgeAndPolygon=b2CollideEdgeAndPolygon;exports.b2CollidePolygonAndCircle=b2CollidePolygonAndCircle;exports.b2CollidePolygons=b2CollidePolygons;exports.b2Color=b2Color;exports.b2ConstantAccelController=b2ConstantAccelController;exports.b2ConstantForceController=b2ConstantForceController;exports.b2Contact=b2Contact;exports.b2ContactEdge=b2ContactEdge;exports.b2ContactFactory=b2ContactFactory;exports.b2ContactFeature=b2ContactFeature;exports.b2ContactFilter=b2ContactFilter;exports.b2ContactID=b2ContactID;exports.b2ContactImpulse=b2ContactImpulse;exports.b2ContactListener=b2ContactListener;exports.b2ContactManager=b2ContactManager;exports.b2ContactPositionConstraint=b2ContactPositionConstraint;exports.b2ContactRegister=b2ContactRegister;exports.b2ContactSolver=b2ContactSolver;exports.b2ContactSolverDef=b2ContactSolverDef;exports.b2ContactVelocityConstraint=b2ContactVelocityConstraint;exports.b2Controller=b2Controller;exports.b2ControllerEdge=b2ControllerEdge;exports.b2Cos=b2Cos;exports.b2Counter=b2Counter;exports.b2DegToRad=b2DegToRad;exports.b2DestructionListener=b2DestructionListener;exports.b2Distance=b2Distance;exports.b2DistanceInput=b2DistanceInput;exports.b2DistanceJoint=b2DistanceJoint;exports.b2DistanceJointDef=b2DistanceJointDef;exports.b2DistanceOutput=b2DistanceOutput;exports.b2DistanceProxy=b2DistanceProxy;exports.b2Draw=b2Draw;exports.b2DynamicTree=b2DynamicTree;exports.b2EdgeAndCircleContact=b2EdgeAndCircleContact;exports.b2EdgeAndPolygonContact=b2EdgeAndPolygonContact;exports.b2EdgeShape=b2EdgeShape;exports.b2Filter=b2Filter;exports.b2Fixture=b2Fixture;exports.b2FixtureDef=b2FixtureDef;exports.b2FixtureParticleQueryCallback=b2FixtureParticleQueryCallback;exports.b2FixtureProxy=b2FixtureProxy;exports.b2Free=b2Free;exports.b2FrictionJoint=b2FrictionJoint;exports.b2FrictionJointDef=b2FrictionJointDef;exports.b2GearJoint=b2GearJoint;exports.b2GearJointDef=b2GearJointDef;exports.b2GetPointStates=b2GetPointStates;exports.b2GravityController=b2GravityController;exports.b2GrowableBuffer=b2GrowableBuffer;exports.b2GrowableStack=b2GrowableStack;exports.b2InvSqrt=b2InvSqrt;exports.b2IsPowerOfTwo=b2IsPowerOfTwo;exports.b2IsValid=b2IsValid;exports.b2Island=b2Island;exports.b2Jacobian=b2Jacobian;exports.b2Joint=b2Joint;exports.b2JointDef=b2JointDef;exports.b2JointEdge=b2JointEdge;exports.b2Log=b2Log;exports.b2MakeArray=b2MakeArray;exports.b2MakeNullArray=b2MakeNullArray;exports.b2MakeNumberArray=b2MakeNumberArray;exports.b2Manifold=b2Manifold;exports.b2ManifoldPoint=b2ManifoldPoint;exports.b2MassData=b2MassData;exports.b2Mat22=b2Mat22;exports.b2Mat33=b2Mat33;exports.b2Max=b2Max;exports.b2Maybe=b2Maybe;exports.b2Min=b2Min;exports.b2MixFriction=b2MixFriction;exports.b2MixRestitution=b2MixRestitution;exports.b2MotorJoint=b2MotorJoint;exports.b2MotorJointDef=b2MotorJointDef;exports.b2MouseJoint=b2MouseJoint;exports.b2MouseJointDef=b2MouseJointDef;exports.b2NextPowerOfTwo=b2NextPowerOfTwo;exports.b2Pair=b2Pair;exports.b2PairLessThan=b2PairLessThan;exports.b2ParseInt=b2ParseInt;exports.b2ParseUInt=b2ParseUInt;exports.b2ParticleBodyContact=b2ParticleBodyContact;exports.b2ParticleContact=b2ParticleContact;exports.b2ParticleDef=b2ParticleDef;exports.b2ParticleGroup=b2ParticleGroup;exports.b2ParticleGroupDef=b2ParticleGroupDef;exports.b2ParticleHandle=b2ParticleHandle;exports.b2ParticlePair=b2ParticlePair;exports.b2ParticlePairSet=b2ParticlePairSet;exports.b2ParticleSystem=b2ParticleSystem;exports.b2ParticleSystemDef=b2ParticleSystemDef;exports.b2ParticleSystem_CompositeShape=b2ParticleSystem_CompositeShape;exports.b2ParticleSystem_ConnectionFilter=b2ParticleSystem_ConnectionFilter;exports.b2ParticleSystem_DestroyParticlesInShapeCallback=b2ParticleSystem_DestroyParticlesInShapeCallback;exports.b2ParticleSystem_FixedSetAllocator=b2ParticleSystem_FixedSetAllocator;exports.b2ParticleSystem_FixtureParticle=b2ParticleSystem_FixtureParticle;exports.b2ParticleSystem_FixtureParticleSet=b2ParticleSystem_FixtureParticleSet;exports.b2ParticleSystem_InsideBoundsEnumerator=b2ParticleSystem_InsideBoundsEnumerator;exports.b2ParticleSystem_JoinParticleGroupsFilter=b2ParticleSystem_JoinParticleGroupsFilter;exports.b2ParticleSystem_ParticleListNode=b2ParticleSystem_ParticleListNode;exports.b2ParticleSystem_ParticlePair=b2ParticleSystem_ParticlePair;exports.b2ParticleSystem_Proxy=b2ParticleSystem_Proxy;exports.b2ParticleSystem_ReactiveFilter=b2ParticleSystem_ReactiveFilter;exports.b2ParticleSystem_SolveCollisionCallback=b2ParticleSystem_SolveCollisionCallback;exports.b2ParticleSystem_UpdateBodyContactsCallback=b2ParticleSystem_UpdateBodyContactsCallback;exports.b2ParticleSystem_UserOverridableBuffer=b2ParticleSystem_UserOverridableBuffer;exports.b2ParticleTriad=b2ParticleTriad;exports.b2PolygonAndCircleContact=b2PolygonAndCircleContact;exports.b2PolygonContact=b2PolygonContact;exports.b2PolygonShape=b2PolygonShape;exports.b2Position=b2Position;exports.b2PositionSolverManifold=b2PositionSolverManifold;exports.b2Pow=b2Pow;exports.b2PrismaticJoint=b2PrismaticJoint;exports.b2PrismaticJointDef=b2PrismaticJointDef;exports.b2Profile=b2Profile;exports.b2PulleyJoint=b2PulleyJoint;exports.b2PulleyJointDef=b2PulleyJointDef;exports.b2QueryCallback=b2QueryCallback;exports.b2RadToDeg=b2RadToDeg;exports.b2Random=b2Random;exports.b2RandomRange=b2RandomRange;exports.b2RayCastCallback=b2RayCastCallback;exports.b2RayCastInput=b2RayCastInput;exports.b2RayCastOutput=b2RayCastOutput;exports.b2RevoluteJoint=b2RevoluteJoint;exports.b2RevoluteJointDef=b2RevoluteJointDef;exports.b2Rope=b2Rope;exports.b2RopeDef=b2RopeDef;exports.b2RopeJoint=b2RopeJoint;exports.b2RopeJointDef=b2RopeJointDef;exports.b2Rot=b2Rot;exports.b2SeparationFunction=b2SeparationFunction;exports.b2Shape=b2Shape;exports.b2ShapeCast=b2ShapeCast;exports.b2ShapeCastInput=b2ShapeCastInput;exports.b2ShapeCastOutput=b2ShapeCastOutput;exports.b2Simplex=b2Simplex;exports.b2SimplexCache=b2SimplexCache;exports.b2SimplexVertex=b2SimplexVertex;exports.b2Sin=b2Sin;exports.b2SolverData=b2SolverData;exports.b2Sq=b2Sq;exports.b2Sqrt=b2Sqrt;exports.b2StackAllocator=b2StackAllocator;exports.b2Swap=b2Swap;exports.b2Sweep=b2Sweep;exports.b2TOIInput=b2TOIInput;exports.b2TOIOutput=b2TOIOutput;exports.b2TensorDampingController=b2TensorDampingController;exports.b2TestOverlapAABB=b2TestOverlapAABB;exports.b2TestOverlapShape=b2TestOverlapShape;exports.b2TimeOfImpact=b2TimeOfImpact;exports.b2TimeStep=b2TimeStep;exports.b2Timer=b2Timer;exports.b2Transform=b2Transform;exports.b2TreeNode=b2TreeNode;exports.b2Vec2=b2Vec2;exports.b2Vec2_zero=b2Vec2_zero;exports.b2Vec3=b2Vec3;exports.b2Velocity=b2Velocity;exports.b2VelocityConstraintPoint=b2VelocityConstraintPoint;exports.b2Version=b2Version;exports.b2WeldJoint=b2WeldJoint;exports.b2WeldJointDef=b2WeldJointDef;exports.b2WheelJoint=b2WheelJoint;exports.b2WheelJointDef=b2WheelJointDef;exports.b2World=b2World;exports.b2WorldManifold=b2WorldManifold;exports.b2_180_over_pi=b2_180_over_pi;exports.b2_aabbExtension=b2_aabbExtension;exports.b2_aabbMultiplier=b2_aabbMultiplier;exports.b2_angularSleepTolerance=b2_angularSleepTolerance;exports.b2_angularSlop=b2_angularSlop;exports.b2_barrierCollisionTime=b2_barrierCollisionTime;exports.b2_baumgarte=b2_baumgarte;exports.b2_branch=b2_branch;exports.b2_commit=b2_commit;exports.b2_epsilon=b2_epsilon;exports.b2_epsilon_sq=b2_epsilon_sq;exports.b2_gjk_reset=b2_gjk_reset;exports.b2_invalidParticleIndex=b2_invalidParticleIndex;exports.b2_linearSleepTolerance=b2_linearSleepTolerance;exports.b2_linearSlop=b2_linearSlop;exports.b2_maxAngularCorrection=b2_maxAngularCorrection;exports.b2_maxFloat=b2_maxFloat;exports.b2_maxLinearCorrection=b2_maxLinearCorrection;exports.b2_maxManifoldPoints=b2_maxManifoldPoints;exports.b2_maxParticleForce=b2_maxParticleForce;exports.b2_maxParticleIndex=b2_maxParticleIndex;exports.b2_maxParticlePressure=b2_maxParticlePressure;exports.b2_maxPolygonVertices=b2_maxPolygonVertices;exports.b2_maxRotation=b2_maxRotation;exports.b2_maxRotationSquared=b2_maxRotationSquared;exports.b2_maxSubSteps=b2_maxSubSteps;exports.b2_maxTOIContacts=b2_maxTOIContacts;exports.b2_maxTranslation=b2_maxTranslation;exports.b2_maxTranslationSquared=b2_maxTranslationSquared;exports.b2_maxTriadDistance=b2_maxTriadDistance;exports.b2_maxTriadDistanceSquared=b2_maxTriadDistanceSquared;exports.b2_minParticleSystemBufferCapacity=b2_minParticleSystemBufferCapacity;exports.b2_minParticleWeight=b2_minParticleWeight;exports.b2_minPulleyLength=b2_minPulleyLength;exports.b2_particleStride=b2_particleStride;exports.b2_pi=b2_pi;exports.b2_pi_over_180=b2_pi_over_180;exports.b2_polygonRadius=b2_polygonRadius;exports.b2_timeToSleep=b2_timeToSleep;exports.b2_toiBaumgarte=b2_toiBaumgarte;exports.b2_toi_reset=b2_toi_reset;exports.b2_two_pi=b2_two_pi;exports.b2_velocityThreshold=b2_velocityThreshold;exports.b2_version=b2_version;exports.g_blockSolve=g_blockSolve;Object.defineProperty(exports,'__esModule',{value:true});});});

      var b2={};var keepList_b2_=['b2_maxPolygonVertices','b2_maxAngularCorrection'];for(var key in box2d_umd){if(keepList_b2_.indexOf(key)!==-1){b2[key.slice('b2_'.length)]=box2d_umd[key];continue;}if(key.indexOf('b2_')!==-1){continue;}var newKey=key.replace('b2','');b2[newKey]=box2d_umd[key];}var box2d_1=exports('default', b2);

    })
  };
}));
//# sourceMappingURL=box2d.js.map
