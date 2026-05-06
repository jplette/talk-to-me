// app/(public)/page.tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export default function LandingPage() {
  const { t } = useT();
  const headline = t('landing.headline');

  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-col items-start gap-6 px-6 py-16 md:py-[25vh]">
      <h1
        className="text-[36px] font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground md:text-5xl lg:text-[56px] whitespace-pre-line"
      >
        {headline}
      </h1>
      <p className="text-lg leading-snug text-muted-foreground max-w-[40ch]">
        {t('landing.lede')}
      </p>
      <Button asChild size="lg" className="w-full md:w-auto">
        <Link href="/login">
          {t('landing.login_cta')}
          <ArrowRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
        </Link>
      </Button>
    </section>
  );
}
