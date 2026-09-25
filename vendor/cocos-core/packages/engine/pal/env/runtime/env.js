import { VIVO } from 'internal:constants';

function findCanvas(){const container=document.createElement("div");const frame=container.parentNode===document.body?document.documentElement:container.parentNode;let canvas;if(VIVO){canvas=window.mainCanvas;window.mainCanvas=undefined;}else {canvas=ral.createCanvas();}return {frame,canvas,container}}function loadJsFile(path){return require(`${path}`)}

export { findCanvas, loadJsFile };
