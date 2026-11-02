/**
 * Canonical `game/rendering.ts`: Agent and Studio edit only these literals.
 * ProjectRendering keeps the standard official Three graph and its disposal
 * inside the Engine while preserving a project-owned on/off seam.
 * `enabled: false` disables Rendering-owned effects including Bloom, motion blur,
 * god rays, lens flare, afterimage, and contact shadows. Visual
 * Style grading and shading may still use the standard graph when required.
 */
import type { WebGPURenderer } from 'three/webgpu';
import {
  ProjectRendering,
  type ProjectRenderSettings,
  type RenderPipelineFactory,
  type RenderSession,
} from 'wanaka-studio-engine/render-session';

export const renderSettings: ProjectRenderSettings = {
  enabled: true,
  ambientOcclusion: true,
  ssgi: false,
  ssr: false,
  bloom: false,
  bloomStrength: 0.1,
  depthOfField: false,
  depthOfFieldBokehScale: 1.25,
  motionBlur: false,
  motionBlurAmount: 1,
  godRays: false,
  godRaysDensity: 0.7,
  lensFlare: false,
  lensFlareAmount: 1,
  afterimage: false,
  afterimageDamp: 0.96,
  contactShadows: false,
  contactShadowsIntensity: 1,
  shadowMap: 'pcf-soft',
};

const projectRendering = new ProjectRendering(renderSettings);

export function configureProjectRenderer(renderer: WebGPURenderer): void {
  projectRendering.configureRenderer(renderer);
}

export function setDepthOfFieldAmount(amount: number): void {
  projectRendering.setDepthOfFieldAmount(amount);
}

export function setBloomStrength(strength: number): void {
  projectRendering.setBloomStrength(strength);
}

export function setMotionBlurAmount(amount: number): void {
  projectRendering.setMotionBlurAmount(amount);
}

export function setGodRaysDensity(density: number): void {
  projectRendering.setGodRaysDensity(density);
}

export function setLensFlareAmount(amount: number): void {
  projectRendering.setLensFlareAmount(amount);
}

export function setAfterimageDamp(damp: number): void {
  projectRendering.setAfterimageDamp(damp);
}

export function setContactShadowsIntensity(intensity: number): void {
  projectRendering.setContactShadowsIntensity(intensity);
}

export let createProjectRenderPipeline: RenderPipelineFactory | undefined =
  projectRendering.createPipeline;

export function applyProjectRenderSettings(rendering: RenderSession, settings: unknown): void {
  projectRendering.applySettings(rendering, settings);
  createProjectRenderPipeline = projectRendering.createPipeline;
}
