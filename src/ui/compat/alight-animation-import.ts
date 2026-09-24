import type { Layer, ProjectKeyframe } from '../../core/project-model';
import {
  clamp,
  directAll,
  MAX_KEYFRAMES,
  normalizeEasing,
  round,
} from './alight-xml-utils';

type AnimatedValues = Record<string, number>;

function upsertKeyframe(layer: Layer, time: number): ProjectKeyframe {
  let keyframe = layer.keyframes.find((item) => Math.abs(item.time - time) < 0.0005);
  if (!keyframe) {
    keyframe = { time: round(time), values: {}, easings: {} };
    layer.keyframes.push(keyframe);
  }
  return keyframe;
}

export function importAnimated(
  layer: Layer,
  node: Element | null,
  properties: string[],
  mapper: (raw: string | null) => AnimatedValues,
): void {
  if (!node) return;

  const assign = (target: Record<string, unknown>, raw: string | null): void => {
    const values = mapper(raw);
    for (const property of properties) {
      if (Number.isFinite(values[property])) target[property] = values[property];
    }
  };

  if (node.hasAttribute('value')) {
    assign(layer, node.getAttribute('value'));
    return;
  }

  const keyframes = directAll(node, 'kf').slice(0, MAX_KEYFRAMES);
  keyframes.forEach((keyframeNode, index) => {
    const time =
      layer.start +
      clamp(keyframeNode.getAttribute('t'), 0, 1) *
        Math.max(0.001, layer.end - layer.start);
    const motionKeyframe = upsertKeyframe(layer, time);
    assign(motionKeyframe.values, keyframeNode.getAttribute('v'));

    if (index > 0) {
      const easing = normalizeEasing(keyframes[index - 1].getAttribute('e'));
      motionKeyframe.easings ??= {};
      for (const property of properties) {
        motionKeyframe.easings[property] = easing;
      }
      motionKeyframe.easing = easing;
    }
  });

  if (keyframes.length) assign(layer, keyframes[0].getAttribute('v'));
}
