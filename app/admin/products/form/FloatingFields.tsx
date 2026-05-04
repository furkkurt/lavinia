"use client";

const labelClass =
  "tw-mb-1.5 tw-block tw-text-xs tw-font-medium tw-text-stone-600";

const inputClass =
  "tw-block tw-w-full tw-appearance-none tw-min-h-[48px] tw-rounded-md tw-border tw-border-stone-200 tw-bg-white tw-py-2.5 tw-px-3 tw-text-base tw-text-stone-900 tw-outline-none tw-transition focus:tw-border-lavinia-sage focus:tw-ring-2 focus:tw-ring-lavinia-sage/25";

type InputProps = {
  id: string;
  name: string;
  label: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  autoComplete?: string;
};

export function TwFloatingInput({
  id,
  name,
  label,
  value,
  onChange,
  required,
  type = "text",
  step,
  min,
  inputMode,
  pattern,
  autoComplete,
}: InputProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        step={step}
        min={min}
        inputMode={inputMode}
        pattern={pattern}
        autoComplete={autoComplete}
        className={inputClass}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

type TextareaProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  rows?: number;
};

export function TwFloatingTextarea({
  id,
  name,
  label,
  value,
  onChange,
  rows = 3,
}: TextareaProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className={`${inputClass} tw-resize-y tw-min-h-[6rem]`}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

type SelectProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
};

export function TwFloatingSelect({
  id,
  name,
  label,
  value,
  onChange,
  children,
}: SelectProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        className={`${inputClass} tw-cursor-pointer tw-pr-8`}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
}
