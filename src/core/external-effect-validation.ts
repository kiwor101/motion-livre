import type {
  ExternalEffectInstance,
  ExternalEffectProperty,
} from './project-model';

export function validateAttributes(value: unknown, label: string): void {
  if (value === undefined) return;

  const invalid =
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.entries(value).some(
      ([key, item]) =>
        !key ||
        key.length > 200 ||
        typeof item !== 'string' ||
        item.length > 2048,
    );

  if (invalid) throw new Error(`${label} inválidos`);
}

function validateExternalProperty(property: ExternalEffectProperty): void {
  const invalid =
    !property ||
    typeof property !== 'object' ||
    typeof property.name !== 'string' ||
    !property.name ||
    property.name.length > 200 ||
    typeof property.type !== 'string' ||
    !property.type ||
    property.type.length > 80 ||
    (property.value !== null && typeof property.value !== 'string') ||
    (typeof property.value === 'string' && property.value.length > 2048) ||
    !Array.isArray(property.keyframes) ||
    property.keyframes.length > 10_000;

  if (invalid) throw new Error('Propriedade externa inválida');

  validateAttributes(property.attributes, 'Atributos da propriedade');

  for (const keyframe of property.keyframes) {
    const invalidKeyframe =
      !keyframe ||
      typeof keyframe !== 'object' ||
      typeof keyframe.time !== 'number' ||
      !Number.isFinite(keyframe.time) ||
      Math.abs(keyframe.time) > 1000 ||
      typeof keyframe.value !== 'string' ||
      keyframe.value.length > 2048 ||
      (keyframe.easing !== undefined &&
        (typeof keyframe.easing !== 'string' || keyframe.easing.length > 2048));

    if (invalidKeyframe) throw new Error('Keyframe de efeito externo inválido');
    validateAttributes(keyframe.attributes, 'Atributos do keyframe');
  }
}

export function validateExternalEffects(
  effects: ExternalEffectInstance[] | undefined,
): void {
  if (effects === undefined) return;
  if (!Array.isArray(effects) || effects.length > 500) {
    throw new Error('Pilha de efeitos externos inválida');
  }

  for (const effect of effects) {
    const invalid =
      !effect ||
      typeof effect !== 'object' ||
      typeof effect.id !== 'string' ||
      !effect.id ||
      effect.id.length > 300 ||
      typeof effect.sourceId !== 'string' ||
      !effect.sourceId ||
      effect.sourceId.length > 300 ||
      typeof effect.locallyApplied !== 'boolean' ||
      typeof effect.hidden !== 'boolean' ||
      !Array.isArray(effect.properties) ||
      effect.properties.length > 500;

    if (invalid) throw new Error('Efeito externo inválido');

    validateAttributes(effect.attributes, 'Atributos do efeito');

    const invalidExtras =
      effect.extras !== undefined &&
      (!Array.isArray(effect.extras) ||
        effect.extras.length > 100 ||
        effect.extras.some((raw) => typeof raw !== 'string' || raw.length > 200_000));
    if (invalidExtras) throw new Error('Dados adicionais do efeito inválidos');

    effect.properties.forEach(validateExternalProperty);
  }
}
