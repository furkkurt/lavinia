"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  backHref: string;
  submitLabel: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
};

export function ProductFormLayout({
  title,
  backHref,
  submitLabel,
  loading,
  onSubmit,
  children,
}: Props) {
  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-min-w-0 tw-max-w-4xl tw-flex-col tw--mx-2 tw-px-2 sm:tw--mx-3 sm:tw-px-3 lg:tw-max-w-6xl xl:tw-max-w-7xl">
      <header className="tw-sticky tw-top-0 tw-z-30 tw-mb-4 tw-flex tw-flex-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-border tw-border-stone-200/90 tw-bg-white tw-py-3 tw-pl-4 tw-pr-3 tw-shadow-sm">
        <h1 className="tw-min-w-0 tw-truncate tw-text-lg tw-font-semibold tw-tracking-tight tw-text-stone-900 sm:tw-text-xl">
          {title}
        </h1>
        <Link
          href={backHref}
          className="tw-inline-flex tw-min-h-[44px] tw-min-w-[44px] tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-stone-300 tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-stone-800 tw-shadow-sm tw-transition hover:tw-bg-stone-50 sm:tw-px-4"
        >
          Geri Dön
        </Link>
      </header>

      <form onSubmit={onSubmit} className="tw-flex tw-flex-1 tw-flex-col tw-pb-[5.5rem] md:tw-pb-6">
        <div className="tw-flex-1 tw-w-full tw-min-w-0 tw-space-y-3">{children}</div>

        <footer className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-z-[200] tw-border-t tw-border-stone-200 tw-bg-white tw-py-3 tw-px-3 tw-shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:tw-sticky md:tw-bottom-0 md:tw-mt-6 md:tw-rounded-md md:tw-border md:tw-px-4">
          <div className="tw-mx-auto tw-flex tw-w-full tw-min-w-0 tw-max-w-4xl tw-items-center tw-justify-end tw-gap-2 lg:tw-max-w-6xl xl:tw-max-w-7xl">
            <Link
              href={backHref}
              className="admin-btn-secondary tw-inline-flex tw-min-h-[44px] tw-items-center tw-justify-center tw-rounded-md tw-px-4 tw-text-sm tw-font-medium"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary tw-inline-flex tw-min-h-[48px] tw-min-w-[min(100%,12rem)] tw-flex-1 tw-items-center tw-justify-center tw-rounded-md tw-px-6 tw-text-sm tw-font-semibold disabled:tw-opacity-60 sm:tw-flex-initial md:tw-min-w-[200px]"
            >
              {loading ? "Kaydediliyor…" : submitLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
