System.register("q-bundled:///fs/cocos/gi/light-probe/sh.js", ["../../core/index.js"], function (_export, _context) {
  "use strict";

  var Vec4, Vec3, cclegacy, assertIsTrue, LightProbeSampler, SH, SH_BASIS_COUNT;
  _export({
    LightProbeSampler: void 0,
    SH: void 0
  });
  return {
    setters: [function (_coreIndexJs) {
      Vec4 = _coreIndexJs.Vec4;
      Vec3 = _coreIndexJs.Vec3;
      cclegacy = _coreIndexJs.cclegacy;
      assertIsTrue = _coreIndexJs.assertIsTrue;
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
      SH_BASIS_COUNT = 9;
      _export("LightProbeSampler", LightProbeSampler = class LightProbeSampler {
        /**
         *  generate one sample from sphere uniformly
         */
        static uniformSampleSphere(u1, u2) {
          const z = 1.0 - 2.0 * u1;
          const r = Math.sqrt(Math.max(0.0, 1.0 - z * z));
          const phi = 2.0 * Math.PI * u2;
          const x = r * Math.cos(phi);
          const y = r * Math.sin(phi);
          return new Vec3(x, y, z);
        }

        /**
         *  generate ucount1 * ucount2 samples from sphere uniformly
         */
        static uniformSampleSphereAll(sampleCount) {
          assertIsTrue(sampleCount > 0);
          const uCount1 = Math.floor(Math.sqrt(sampleCount));
          const uCount2 = uCount1;
          const samples = [];
          const uDelta1 = 1.0 / uCount1;
          const uDelta2 = 1.0 / uCount2;
          for (let i = 0; i < uCount1; i++) {
            const u1 = (i + 0.5) * uDelta1;
            for (let j = 0; j < uCount2; j++) {
              const u2 = (j + 0.5) * uDelta2;
              const sample = this.uniformSampleSphere(u1, u2);
              samples.push(sample);
            }
          }
          return samples;
        }

        /**
         *  probability density function of uniform distribution on spherical surface
         */
        static uniformSpherePdf() {
          return 1.0 / (4.0 * Math.PI);
        }
      });
      /**
       * Spherical Harmonics utility class
       */
      _export("SH", SH = class SH {
        /**
         * update ubo data by coefficients
         */
        static updateUBOData(data, offset, coefficients) {
          // cc_sh_linear_const_r
          data[offset++] = coefficients[3].x * this.basisOverPI[3];
          data[offset++] = coefficients[1].x * this.basisOverPI[1];
          data[offset++] = coefficients[2].x * this.basisOverPI[2];
          data[offset++] = coefficients[0].x * this.basisOverPI[0] - coefficients[6].x * this.basisOverPI[6] / 3.0;

          // cc_sh_linear_const_g
          data[offset++] = coefficients[3].y * this.basisOverPI[3];
          data[offset++] = coefficients[1].y * this.basisOverPI[1];
          data[offset++] = coefficients[2].y * this.basisOverPI[2];
          data[offset++] = coefficients[0].y * this.basisOverPI[0] - coefficients[6].y * this.basisOverPI[6] / 3.0;

          // cc_sh_linear_const_b
          data[offset++] = coefficients[3].z * this.basisOverPI[3];
          data[offset++] = coefficients[1].z * this.basisOverPI[1];
          data[offset++] = coefficients[2].z * this.basisOverPI[2];
          data[offset++] = coefficients[0].z * this.basisOverPI[0] - coefficients[6].z * this.basisOverPI[6] / 3.0;

          // cc_sh_quadratic_r
          data[offset++] = coefficients[4].x * this.basisOverPI[4];
          data[offset++] = coefficients[5].x * this.basisOverPI[5];
          data[offset++] = coefficients[6].x * this.basisOverPI[6];
          data[offset++] = coefficients[7].x * this.basisOverPI[7];

          // cc_sh_quadratic_g
          data[offset++] = coefficients[4].y * this.basisOverPI[4];
          data[offset++] = coefficients[5].y * this.basisOverPI[5];
          data[offset++] = coefficients[6].y * this.basisOverPI[6];
          data[offset++] = coefficients[7].y * this.basisOverPI[7];

          // cc_sh_quadratic_b
          data[offset++] = coefficients[4].z * this.basisOverPI[4];
          data[offset++] = coefficients[5].z * this.basisOverPI[5];
          data[offset++] = coefficients[6].z * this.basisOverPI[6];
          data[offset++] = coefficients[7].z * this.basisOverPI[7];

          // cc_sh_quadratic_a
          data[offset++] = coefficients[8].x * this.basisOverPI[8];
          data[offset++] = coefficients[8].y * this.basisOverPI[8];
          data[offset++] = coefficients[8].z * this.basisOverPI[8];
          data[offset++] = 0.0;
        }

        /**
         * recreate a function from sh coefficients, which is same as SHEvaluate in shader
         */
        static shaderEvaluate(normal, coefficients) {
          const linearConstR = new Vec4(coefficients[3].x * this.basisOverPI[3], coefficients[1].x * this.basisOverPI[1], coefficients[2].x * this.basisOverPI[2], coefficients[0].x * this.basisOverPI[0] - coefficients[6].x * this.basisOverPI[6] / 3.0);
          const linearConstG = new Vec4(coefficients[3].y * this.basisOverPI[3], coefficients[1].y * this.basisOverPI[1], coefficients[2].y * this.basisOverPI[2], coefficients[0].y * this.basisOverPI[0] - coefficients[6].y * this.basisOverPI[6] / 3.0);
          const linearConstB = new Vec4(coefficients[3].z * this.basisOverPI[3], coefficients[1].z * this.basisOverPI[1], coefficients[2].z * this.basisOverPI[2], coefficients[0].z * this.basisOverPI[0] - coefficients[6].z * this.basisOverPI[6] / 3.0);
          const quadraticR = new Vec4(coefficients[4].x * this.basisOverPI[4], coefficients[5].x * this.basisOverPI[5], coefficients[6].x * this.basisOverPI[6], coefficients[7].x * this.basisOverPI[7]);
          const quadraticG = new Vec4(coefficients[4].y * this.basisOverPI[4], coefficients[5].y * this.basisOverPI[5], coefficients[6].y * this.basisOverPI[6], coefficients[7].y * this.basisOverPI[7]);
          const quadraticB = new Vec4(coefficients[4].z * this.basisOverPI[4], coefficients[5].z * this.basisOverPI[5], coefficients[6].z * this.basisOverPI[6], coefficients[7].z * this.basisOverPI[7]);
          const quadraticA = new Vec3(coefficients[8].x * this.basisOverPI[8], coefficients[8].y * this.basisOverPI[8], coefficients[8].z * this.basisOverPI[8]);
          const result = new Vec3(0.0, 0.0, 0.0);
          const normal4 = new Vec4(normal.x, normal.y, normal.z, 1.0);

          // calculate linear and const terms
          result.x = Vec4.dot(linearConstR, normal4);
          result.y = Vec4.dot(linearConstG, normal4);
          result.z = Vec4.dot(linearConstB, normal4);

          // calculate quadratic terms
          const n14 = new Vec4(normal.x * normal.y, normal.y * normal.z, normal.z * normal.z, normal.z * normal.x);
          const n5 = normal.x * normal.x - normal.y * normal.y;
          result.x += Vec4.dot(quadraticR, n14);
          result.y += Vec4.dot(quadraticG, n14);
          result.z += Vec4.dot(quadraticB, n14);
          Vec3.scaleAndAdd(result, result, quadraticA, n5);
          return result;
        }

        /**
         * recreate a function from sh coefficients
         */
        static evaluate(sample, coefficients) {
          const result = new Vec3(0.0, 0.0, 0.0);
          const size = coefficients.length;
          for (let i = 0; i < size; i++) {
            const c = coefficients[i];
            Vec3.scaleAndAdd(result, result, c, this.evaluateBasis(i, sample));
          }
          return result;
        }

        /**
         * project a function to sh coefficients
         */
        static project(samples, values) {
          assertIsTrue(samples.length > 0 && samples.length === values.length);

          // integral using Monte Carlo method
          const basisCount = this.getBasisCount();
          const sampleCount = samples.length;
          const scale = 1.0 / (LightProbeSampler.uniformSpherePdf() * sampleCount);
          const coefficients = [];
          for (let i = 0; i < basisCount; i++) {
            const coefficient = new Vec3(0.0, 0.0, 0.0);
            for (let k = 0; k < sampleCount; k++) {
              Vec3.scaleAndAdd(coefficient, coefficient, values[k], this.evaluateBasis(i, samples[k]));
            }
            Vec3.multiplyScalar(coefficient, coefficient, scale);
            coefficients.push(coefficient);
          }
          return coefficients;
        }

        /**
         * calculate irradiance's sh coefficients from radiance's sh coefficients directly
         */
        static convolveCosine(radianceCoefficients) {
          const cosTheta = [0.8862268925, 1.0233267546, 0.4954159260];
          const irradianceCoefficients = [];
          for (let l = 0; l <= this.LMAX; l++) {
            for (let m = -l; m <= l; m++) {
              const i = this.toIndex(l, m);
              const coefficient = new Vec3(0.0, 0.0, 0.0);
              Vec3.multiplyScalar(coefficient, radianceCoefficients[i], this.lambda(l) * cosTheta[l]);
              irradianceCoefficients.push(coefficient);
            }
          }
          return irradianceCoefficients;
        }

        /**
         * return basis function count
         */
        static getBasisCount() {
          return SH_BASIS_COUNT;
        }

        /**
         * evaluate from a basis function
         */
        static evaluateBasis(index, sample) {
          assertIsTrue(index < this.getBasisCount());
          const func = this.basisFunctions[index];
          return func(sample);
        }
        static reduceRinging(coefficients, lambda) {
          if (lambda === 0.0) {
            return;
          }
          for (let l = 0; l <= this.LMAX; ++l) {
            const scale = 1.0 / (1.0 + lambda * l * l * (l + 1) * (l + 1));
            for (let m = -l; m <= l; ++m) {
              const i = this.toIndex(l, m);
              Vec3.multiplyScalar(coefficients[i], coefficients[i], scale);
            }
          }
        }
        static lambda(l) {
          return Math.sqrt(4.0 * Math.PI / (2.0 * l + 1.0));
        }
        static toIndex(l, m) {
          return l * l + l + m;
        }
      });
      SH.LMAX = 2;
      SH.basisFunctions = [v => 0.282095,
      // 0.5 * Math.sqrt(1.0 / Math.PI)
      v => 0.488603 * v.y,
      // 0.5 * Math.sqrt(3.0 / Math.PI) * v.y
      v => 0.488603 * v.z,
      // 0.5 * Math.sqrt(3.0 / Math.PI) * v.z
      v => 0.488603 * v.x,
      // 0.5 * Math.sqrt(3.0 / Math.PI) * v.x
      v => 1.09255 * v.y * v.x,
      // 0.5 * Math.sqrt(15.0 / Math.PI) * v.y * v.x
      v => 1.09255 * v.y * v.z,
      // 0.5 * Math.sqrt(15.0 / Math.PI) * v.y * v.z
      v => 0.946175 * (v.z * v.z - 1.0 / 3.0),
      // 0.75 * Math.sqrt(5.0 / Math.PI) * (v.z * v.z - 1.0 / 3.0)
      v => 1.09255 * v.z * v.x,
      // 0.5 * Math.sqrt(15.0 / Math.PI) * v.z * v.x
      v => 0.546274 * (v.x * v.x - v.y * v.y) // 0.25 * Math.sqrt(15.0 / Math.PI) * (v.x * v.x - v.y * v.y)
      ];
      SH.basisOverPI = [0.0897936,
      // 0.282095 / Math.PI
      0.155527,
      // 0.488603 / Math.PI
      0.155527,
      // 0.488603 / Math.PI
      0.155527,
      // 0.488603 / Math.PI
      0.347769,
      // 1.09255 / Math.PI
      0.347769,
      // 1.09255 / Math.PI
      0.301177,
      // 0.946175 / Math.PI
      0.347769,
      // 1.09255 / Math.PI
      0.173884 // 0.546274 / Math.PI
      ];
      cclegacy.internal.SH = SH;
    }
  };
});