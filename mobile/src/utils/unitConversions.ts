import type { UnitSystem } from '../types';

export const toKg       = (lbs: number)    => parseFloat((lbs * 0.453592).toFixed(2));
export const toLbs      = (kg: number)     => parseFloat((kg / 0.453592).toFixed(1));
export const toCm       = (inches: number) => parseFloat((inches * 2.54).toFixed(1));
export const toInches   = (cm: number)     => parseFloat((cm / 2.54).toFixed(1));

export function displayWeight(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') return `${toLbs(kg)} lbs`;
  return `${kg.toFixed(1)} kg`;
}

export function displayHeight(cm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    const totalInches = toInches(cm);
    const feet  = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${cm.toFixed(0)} cm`;
}

export function displayMeasurement(cm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') return `${toInches(cm)} in`;
  return `${cm.toFixed(1)} cm`;
}

export function inputToMetric(value: number, field: 'weight' | 'height' | 'measurement', unitSystem: UnitSystem): number {
  if (unitSystem === 'metric') return value;
  if (field === 'weight') return toKg(value);
  return toCm(value);
}

export function metricToInput(value: number, field: 'weight' | 'height' | 'measurement', unitSystem: UnitSystem): number {
  if (unitSystem === 'metric') return value;
  if (field === 'weight') return toLbs(value);
  return toInches(value);
}

export function weightUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'lbs' : 'kg';
}

export function lengthUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'in' : 'cm';
}
