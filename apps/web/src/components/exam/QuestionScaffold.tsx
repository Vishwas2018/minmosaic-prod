import type { ReactNode } from 'react';

interface QuestionScaffoldProps {
  questionNumber: number;
  itemCode: string;
  questionType: string;
  promptText: string;
  stimulusText?: string;
  children: ReactNode;
}

export function QuestionScaffold({
  questionNumber,
  itemCode,
  questionType,
  promptText,
  stimulusText,
  children,
}: QuestionScaffoldProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 rounded-[28px] border border-brand-100 bg-white p-6 shadow-[0_18px_60px_rgba(21,32,87,0.08)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">
              Question {questionNumber}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Item reference</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {itemCode}
              </h2>
            </div>
          </div>

          <div className="inline-flex items-center self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
            {questionType.replace('_', ' ')}
          </div>
        </div>

        {stimulusText ? (
          <section className="overflow-hidden rounded-[24px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
            <div className="border-b border-brand-100 px-5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700">
                Stimulus
              </div>
            </div>
            <div className="px-5 py-5 md:px-6">
              <p className="text-base leading-8 text-slate-700">{stimulusText}</p>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/80">
          <div className="border-b border-slate-200 px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Prompt
            </div>
          </div>
          <div className="px-5 py-6 md:px-6">
            <p className="text-xl leading-9 text-slate-950">{promptText}</p>
          </div>
        </section>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] md:p-6">
        {children}
      </div>
    </div>
  );
}
