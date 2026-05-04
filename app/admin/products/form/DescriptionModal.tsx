"use client";

type Props = {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
};

export function DescriptionModal({ open, value, onChange, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="tw-fixed tw-inset-0 tw-z-[500] tw-flex tw-flex-col tw-bg-stone-900/40 tw-p-0 tw-backdrop-blur-sm sm:tw-p-4 sm:tw-items-center sm:tw-justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desc-modal-title"
    >
      <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-none tw-bg-white tw-shadow-2xl sm:tw-h-[min(90vh,720px)] sm:tw-max-h-[90vh] sm:tw-max-w-3xl sm:tw-rounded-2xl">
        <div className="tw-flex tw-min-h-[52px] tw-items-center tw-justify-between tw-border-b tw-border-stone-100 tw-px-4 tw-py-3">
          <h2 id="desc-modal-title" className="tw-text-lg tw-font-semibold tw-text-stone-900">
            Açıklama (ACIKLAMA)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tw-inline-flex tw-min-h-[44px] tw-min-w-[44px] tw-items-center tw-justify-center tw-rounded-xl tw-text-sm tw-font-semibold tw-text-lavinia-sage hover:tw-bg-lavinia-sage/10"
          >
            Bitti
          </button>
        </div>
        <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-p-4">
          <textarea
            className="tw-min-h-0 tw-w-full tw-flex-1 tw-resize-none tw-rounded-2xl tw-border tw-border-stone-200 tw-bg-stone-50/50 tw-p-4 tw-text-base tw-leading-relaxed tw-text-stone-800 tw-outline-none focus:tw-ring-2 focus:tw-ring-lavinia-sage/30"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ürün açıklamasını buraya yazın…"
            autoFocus
          />
        </div>
        <div className="tw-border-t tw-border-stone-100 tw-p-4 sm:tw-hidden">
          <button
            type="button"
            onClick={onClose}
            className="tw-w-full tw-rounded-2xl tw-bg-lavinia-sage tw-py-3.5 tw-text-base tw-font-semibold tw-text-white"
          >
            Bitti
          </button>
        </div>
      </div>
    </div>
  );
}
