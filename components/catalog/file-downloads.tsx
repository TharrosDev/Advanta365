import { Button } from "@/components/ui/button";
import type { TemplateFile } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { extensionOf, type FileExtension } from "@/lib/files/types";
import { formatBytes } from "@/lib/format";
import styles from "./file-downloads.module.css";

/** What a buyer calls each kind of file. */
const KIND: Record<FileExtension, string> = {
  docx: "Word",
  dotx: "Word template",
  pptx: "PowerPoint",
  potx: "PowerPoint template",
  xlsx: "Excel",
  xltx: "Excel template",
  pdf: "PDF",
  zip: "ZIP archive",
};

/**
 * A template's files as a list of download links, one outline button each: the file name, then its
 * kind and size ("Excel, 24 KB"). The links are plain anchors with `download`, so the router never
 * tries to open a file as a page. `hrefFor` says where each file is served from: the free route or
 * the licensed one.
 */
export function FileDownloads({
  files,
  hrefFor,
  className,
}: {
  files: TemplateFile[];
  hrefFor: (file: TemplateFile) => string;
  className?: string;
}) {
  return (
    <ul className={cx(styles.root, className)}>
      {files.map((file) => {
        const extension = extensionOf(file.name);
        return (
          <li key={file.id}>
            <Button variant="outline" href={hrefFor(file)} download className={styles.button}>
              <span className={styles.name}>{file.name}</span>
              <span className={cx("type-note", styles.facts)}>
                {extension ? `${KIND[extension]}, ` : ""}
                {formatBytes(file.bytes)}
              </span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
