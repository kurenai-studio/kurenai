// Allow overriding the native .node binding via env var (used when the host electron ABI differs from the default node ABI)
const nativeWebglPath = process.env.COCOS_CLI_GL_NODE;
if (nativeWebglPath) {
  console.log(`[cocos-cli] gl: loading native binding from COCOS_CLI_GL_NODE=${nativeWebglPath}`);
}
const NativeWebGL = nativeWebglPath ? require(nativeWebglPath) : require('bindings')('webgl')
const { WebGLRenderingContext: NativeWebGLRenderingContext } = NativeWebGL
process.on('exit', NativeWebGL.cleanup)

const gl = NativeWebGLRenderingContext.prototype

// from binding.gyp
delete gl['1.0.0']

// from binding.gyp
delete NativeWebGLRenderingContext['1.0.0']

module.exports = { gl, NativeWebGL, NativeWebGLRenderingContext }
