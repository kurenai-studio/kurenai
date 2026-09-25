function findCanvas(){const frame=document.querySelector("#GameDiv");const container=document.querySelector("#Cocos3dGameContainer");const canvas=document.querySelector("#GameCanvas");return {frame,container,canvas}}function loadJsFile(path){return globalThis.nodeEnv.require(`${path}`)}

export { findCanvas, loadJsFile };
