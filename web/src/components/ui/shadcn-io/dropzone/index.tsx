"use client";

import { UploadIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useId } from "react";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropzoneContextType = {
  src?: File[];
  accept?: DropzoneOptions["accept"];
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  maxFiles?: DropzoneOptions["maxFiles"];
};

const renderBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)}${units[unitIndex]}`;
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined,
);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
  src?: File[];
  className?: string;
  /**
   * Accessible label for the drop target. Defaults to a description
   * that mentions whether single or multiple files are allowed.
   */
  ariaLabel?: string;
  /**
   * Additional description read by screen readers to explain limits.
   */
  ariaDescription?: string;
  onDrop?: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void;
  children?: ReactNode;
};

export const Dropzone = ({
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  ariaLabel,
  ariaDescription,
  children,
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    minSize,
    onError,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        const message = fileRejections.at(0)?.errors.at(0)?.message;
        onError?.(new Error(message));
        return;
      }

      onDrop?.(acceptedFiles, fileRejections, event);
    },
    ...props,
  });
  const descriptionId = useId();
  const defaultLabel =
    ariaLabel ?? `Upload ${maxFiles === 1 ? "a file" : "files"}`;
  const computedDescription =
    ariaDescription ??
    `Press enter or click to upload ${maxFiles === 1 ? "a file" : "files"}. ` +
      "You can also drag and drop files here" +
      (accept ? `; accepted types: ${Object.keys(accept).join(", ")}` : "") +
      (maxSize ? `; maximum size ${renderBytes(maxSize)}` : "") +
      (minSize ? `; minimum size ${renderBytes(minSize)}` : "") +
      (disabled ? "; uploads are currently disabled" : "");

  return (
    <DropzoneContext.Provider
      key={JSON.stringify(src)}
      value={{ src, accept, maxSize, minSize, maxFiles }}
    >
      <Button
        className={cn(
          "group relative h-auto w-full flex-col overflow-hidden p-8 hover:bg-gray-200 hover:text-primary",
          isDragActive && "outline-none ring-1 ring-ring",
          className,
        )}
        disabled={disabled}
        type="button"
        variant="outline"
        aria-label={defaultLabel}
        aria-describedby={descriptionId}
        {...getRootProps()}
      >
        <span id={descriptionId} className="sr-only">
          {computedDescription}
        </span>
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </Button>
    </DropzoneContext.Provider>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export type DropzoneContentProps = {
  children?: ReactNode;
  className?: string;
};

const maxLabelItems = 3;
const truncateFileName = (name: string, maxLength = 30) =>
  name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;

export const DropzoneContent = ({
  children,
  className,
}: DropzoneContentProps) => {
  const { src } = useDropzoneContext();

  if (!src) {
    return null;
  }

  if (children) {
    return children;
  }

  const displayNames =
    src.length > maxLabelItems
      ? `${new Intl.ListFormat("en").format(
          src
            .slice(0, maxLabelItems)
            .map((file) => truncateFileName(file.name)),
        )} and ${src.length - maxLabelItems} more`
      : new Intl.ListFormat("en").format(
          src.map((file) => truncateFileName(file.name)),
        );

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium text-sm">
        {displayNames}
      </p>
      <p className="w-full text-center text-muted-foreground text-xs">
        Drag and drop or click to replace
      </p>
    </div>
  );
};

export type DropzoneEmptyStateProps = {
  children?: ReactNode;
  className?: string;
};

export const DropzoneEmptyState = ({
  children,
  className,
}: DropzoneEmptyStateProps) => {
  const { src, accept, maxSize, minSize, maxFiles } = useDropzoneContext();

  if (src) {
    return null;
  }

  if (children) {
    return children;
  }

  let caption = "";

  if (accept) {
    caption += "Accepts ";
    caption += new Intl.ListFormat("en").format(Object.keys(accept));
  }

  if (minSize && maxSize) {
    caption += ` between ${renderBytes(minSize)} and ${renderBytes(maxSize)}`;
  } else if (minSize) {
    caption += ` at least ${renderBytes(minSize)}`;
  } else if (maxSize) {
    caption += ` less than ${renderBytes(maxSize)}`;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium text-sm">
        Upload {maxFiles === 1 ? "a file" : "files"}
      </p>
      <p className="w-full text-center text-muted-foreground text-xs">
        Drag and drop or click to upload
      </p>
      {caption && (
        <p className="text-center text-muted-foreground text-xs">{caption}.</p>
      )}
    </div>
  );
};
