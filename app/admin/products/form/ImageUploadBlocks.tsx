"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";

type ThumbProps = {
  file: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
  label: string;
};

export function ThumbnailDropZone({ file, onPick, onClear, label }: ThumbProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-stone-600">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="tw-sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="tw-flex tw-min-h-[120px] tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-2xl tw-border-2 tw-border-dashed tw-border-stone-300 tw-bg-stone-50/80 tw-px-4 tw-py-6 tw-text-center tw-transition hover:tw-border-lavinia-sage hover:tw-bg-lavinia-sage/5"
      >
        <span className="tw-text-base tw-font-medium tw-text-stone-700">
          Galeriden seç veya fotoğraf yükle
        </span>
        <span className="tw-text-xs tw-text-stone-500">Kapak görseli (tek dosya)</span>
      </button>
      {file && preview ? (
        <div className="tw-relative tw-mt-3 tw-inline-block">
          <div className="tw-relative tw-h-28 tw-w-28 tw-overflow-hidden tw-rounded-2xl tw-border tw-border-stone-200 tw-shadow-md">
            <Image src={preview} alt="" fill className="tw-object-cover" unoptimized />
          </div>
          <button
            type="button"
            onClick={onClear}
            className="tw-absolute tw--right-2 tw--top-2 tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-stone-900 tw-text-white tw-shadow-md tw-transition hover:tw-bg-red-600"
            aria-label="Kaldır"
          >
            <FaTimes className="tw-text-sm" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

type GalleryProps = {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
};

function GalleryThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!url) return null;

  return (
    <div className="tw-relative tw-h-24 tw-w-24 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-2xl tw-border tw-border-stone-200 tw-shadow-md">
      <Image src={url} alt="" fill className="tw-object-cover" unoptimized />
      <button
        type="button"
        onClick={onRemove}
        className="tw-absolute tw-right-1 tw-top-1 tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-stone-900/90 tw-text-white tw-shadow-md tw-transition hover:tw-bg-red-600"
        aria-label="Sil"
      >
        <FaTimes className="tw-text-xs" />
      </button>
    </div>
  );
}

export function GalleryDropZone({ files, onAdd, onRemoveAt }: GalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="tw-mb-2 tw-text-sm tw-font-medium tw-text-stone-600">Galeri görselleri</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="tw-sr-only"
        onChange={(e) => {
          const list = e.target.files;
          if (list?.length) onAdd(Array.from(list));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="tw-flex tw-min-h-[120px] tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-2xl tw-border-2 tw-border-dashed tw-border-stone-300 tw-bg-stone-50/80 tw-px-4 tw-py-6 tw-text-center tw-transition hover:tw-border-lavinia-sage hover:tw-bg-lavinia-sage/5"
      >
        <span className="tw-text-base tw-font-medium tw-text-stone-700">
          Galeriden seç veya görseller yükle
        </span>
        <span className="tw-text-xs tw-text-stone-500">Birden fazla seçebilirsiniz</span>
      </button>

      {files.length > 0 ? (
        <div className="tw-mt-4 tw-flex tw-gap-3 tw-overflow-x-auto tw-pb-2 tw-pt-1">
          {files.map((file, i) => (
            <GalleryThumb
              key={`${file.name}-${i}-${file.lastModified}`}
              file={file}
              onRemove={() => onRemoveAt(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
