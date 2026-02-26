import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HowToStep {
  title: string;
  desc: string;
}

interface FaqItem {
  q: string;
  a: string;
}

export default function SeoLanding() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const problems = t('seoLanding.problems', { returnObjects: true }) as string[];
  const howToSteps = t('seoLanding.howToSteps', { returnObjects: true }) as HowToStep[];
  const faqs = t('seoLanding.faqs', { returnObjects: true }) as FaqItem[];
  const notes = t('seoLanding.notes', { returnObjects: true }) as string[];

  return (
    <section className="seo-landing" aria-label={t('seoLanding.heading')}>
      <div className="seo-landing-inner">
        <h2 className="seo-heading">{t('seoLanding.heading')}</h2>
        <p className="seo-intro">{t('seoLanding.intro')}</p>

        <div className="seo-section">
          <h3>{t('seoLanding.problemHeading')}</h3>
          <ul className="seo-problem-list">
            {problems.map((problem, i) => (
              <li key={i}>{problem}</li>
            ))}
          </ul>
        </div>

        <div className="seo-section">
          <h3>{t('seoLanding.howToHeading')}</h3>
          <ol className="seo-howto-list">
            {howToSteps.map((step, i) => (
              <li key={i}>
                <strong>{step.title}</strong>
                <span>{step.desc}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="seo-section">
          <h3>{t('seoLanding.faqHeading')}</h3>
          <dl className="seo-faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`seo-faq-item ${openFaq === i ? 'open' : ''}`}
              >
                <dt
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpenFaq(openFaq === i ? null : i);
                    }
                  }}
                  aria-expanded={openFaq === i}
                >
                  <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                  {faq.q}
                </dt>
                <dd style={{ display: openFaq === i ? 'block' : 'none' }}>
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="seo-section">
          <h3>{t('seoLanding.notesHeading')}</h3>
          <ul className="seo-notes-list">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>

        <div className="seo-footer-credit">
          {t('seoLanding.poweredBy')}
        </div>
      </div>
    </section>
  );
}
