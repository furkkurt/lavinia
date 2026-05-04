"use client";

import { FaChevronDown, FaChevronUp, FaCheck } from "react-icons/fa";
import type { ReactNode } from "react";

type Props = {
  title: string;
  open: boolean;
  onToggle: () => void;
  complete: boolean;
  children: ReactNode;
};

export function AccordionSection({
  title,
  open,
  onToggle,
  complete,
  children,
}: Props) {
  return (
    <section className="tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-md tw-border tw-border-stone-200 tw-bg-white tw-shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="tw-flex tw-min-h-[52px] tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-text-left tw-transition hover:tw-bg-stone-50/80"
        aria-expanded={open}
      >
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
          {complete ? (
            <span
              className="tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-lavinia-sage/15 tw-text-lavinia-sage"
              aria-hidden
            >
              <FaCheck className="tw-text-xs" />
            </span>
          ) : (
            <span className="tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-stone-200 tw-bg-stone-50" />
          )}
          <span className="tw-truncate tw-text-base tw-font-semibold tw-text-stone-900">
            {title}
          </span>
        </span>
        <span className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-text-stone-500">
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>
      {open ? (
        <div className="tw-w-full tw-min-w-0 tw-border-t tw-border-stone-100 tw-px-3 tw-pb-5 tw-pt-2 sm:tw-px-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
