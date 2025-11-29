export const buildText = (
  value: string | string[] | undefined,
  defaultValue: string = "",
): string => {
  if (Array.isArray(value)) return value.join(" ");
  return value || defaultValue;
};
