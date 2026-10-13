/**
 * The kinds of file the toolkit is delivered as: each extension a file record may end in, and the
 * content type it is served with. A name with any other extension fails catalog validation.
 */
export const FILE_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  potx: "application/vnd.openxmlformats-officedocument.presentationml.template",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  pdf: "application/pdf",
  zip: "application/zip",
} as const;

export type FileExtension = keyof typeof FILE_TYPES;

/** The allowed extension a file name ends in, or `undefined` when it ends in none of them. */
export function extensionOf(name: string): FileExtension | undefined {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const extension = name.slice(dot + 1).toLowerCase();
  return Object.hasOwn(FILE_TYPES, extension) ? (extension as FileExtension) : undefined;
}
