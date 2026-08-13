import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ShieldCheck,
} from "@phosphor-icons/react";

const questions = [
  {
    title: "どの資格をお持ちですか？",
    tone: "violet",
    options: [
      ["看護師", "/assets/career-support/q1-nurse.png"],
      ["准看護師", "/assets/career-support/q1-assistant-nurse.png"],
      ["保健師", "/assets/career-support/q1-public-health-nurse.png"],
      ["ケアマネージャー", "/assets/career-support/q1-care-manager.png"],
      ["その他", "/assets/career-support/q1-other.png"],
      ["無資格", "/assets/career-support/q1-no-license.png"],
    ],
  },
  {
    title: "ご希望の働き方を選択してください",
    tone: "coral",
    options: [
      ["常勤（夜勤含む）", "/assets/career-support/q2-fulltime-night.png"],
      ["常勤（日勤のみ）", "/assets/career-support/q2-fulltime-day.png"],
      ["非常勤（扶養内）", "/assets/career-support/q2-parttime-dependent.png"],
      ["非常勤（扶養外）", "/assets/career-support/q2-parttime-independent.png"],
      ["こだわらない", "/assets/career-support/q2-flexible.png"],
    ],
  },
  {
    title: "いつ頃の転職をご希望ですか？",
    tone: "lilac",
    options: [
      ["1ヶ月以内", "/assets/career-support/q3-one-month.png"],
      ["3ヶ月以内", "/assets/career-support/q3-three-months.png"],
      ["6ヶ月以内", "/assets/career-support/q3-six-months.png"],
      ["6ヶ月より先", "/assets/career-support/q3-later.png"],
      ["良い求人があればいつでも", "/assets/career-support/q3-anytime.png"],
    ],
  },
];

function ChoiceStep({ step, answer, onAnswer, onBack, onNext }) {
  const question = questions[step];

  return (
    <section className={`career-question tone-${question.tone}`} aria-labelledby="career-question-title">
      <div className="career-question-head">
        <div>
          <span className="service-eyebrow">CAREER QUESTION FLOW</span>
          <h2 id="career-question-title">{question.title}</h2>
        </div>
        <span className="career-step-count" aria-label={`${step + 1}問目、全3問`}>
          {step + 1} <small>/ 3</small>
        </span>
      </div>

      <div className="career-progress" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <span key={item} className={item <= step ? "is-current" : ""} />
        ))}
      </div>

      <div className="career-options">
        {question.options.map(([label, image]) => {
          const selected = answer === label;
          return (
            <button
              key={label}
              className={`career-option ${selected ? "is-selected" : ""}`}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => onAnswer(label)}
            >
              <img src={image} alt="" />
              {selected ? <Check className="career-option-check" size={20} weight="bold" /> : null}
            </button>
          );
        })}
      </div>

      <div className="career-step-actions">
        {step > 0 ? (
          <button className="career-back" type="button" onClick={onBack}>
            <ArrowLeft size={18} weight="bold" />
            戻る
          </button>
        ) : <span />}
        <button className="career-next" type="button" onClick={onNext} disabled={!answer}>
          次へ
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </section>
  );
}

function RegistrationForm({ answers, onRestart }) {
  const [submitted, setSubmitted] = useState(false);
  const summary = useMemo(() => [
    ["保有資格", answers[0]],
    ["希望の働き方", answers[1]],
    ["転職希望時期", answers[2]],
  ], [answers]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <section className="career-complete" aria-live="polite">
        <CheckCircle size={58} weight="fill" />
        <p className="service-eyebrow">REGISTRATION COMPLETE</p>
        <h2>登録内容を受け付けました</h2>
        <p>ご入力ありがとうございました。担当者からの連絡をお待ちください。</p>
        <p className="demo-notice">現在は表示確認用のため、入力内容は外部へ送信していません。</p>
        <button type="button" onClick={onRestart}>はじめから入力する</button>
      </section>
    );
  }

  return (
    <section className="career-form-wrap" aria-labelledby="career-form-title">
      <div className="career-form-intro">
        <div>
          <span className="service-eyebrow">CAREER ENTRY FORM</span>
          <h2 id="career-form-title">入力が完了しました！</h2>
          <p>以下のフォームに、入力してください。</p>
        </div>
        <ShieldCheck size={44} weight="duotone" />
      </div>

      <dl className="career-answer-summary" aria-label="選択内容">
        {summary.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <form className="career-form" aria-label="コンタクトフォーム" onSubmit={handleSubmit}>
        <label>
          <span>氏名</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>メールアドレス</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>題名</span>
          <input name="subject" required />
        </label>
        <label>
          <span>メッセージ本文 (任意)</span>
          <textarea name="message" rows="8" />
        </label>
        <button type="submit">登録</button>
      </form>
    </section>
  );
}

export function CareerSupport() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);

  const handleAnswer = (value) => {
    setAnswers((current) => current.map((answer, index) => index === step ? value : answer));
  };

  const restart = () => {
    setAnswers(["", "", ""]);
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="career-page" id="career-support">
      <section className="career-hero">
        <div className="career-hero-copy">
          <p className="career-kicker">RIDGELINE CAREER SUPPORT</p>
          <h1>次の職場を、<br /><span>もっと私らしく。</span></h1>
          <p className="career-hero-lead">神奈川で働く看護師のための転職サポート。<br />3つの質問から、ご希望に合う働き方を一緒に探します。</p>
          <a className="career-hero-action" href="#career-question-title">
            3つの質問から始める
            <ArrowRight size={18} weight="bold" />
          </a>
        </div>
        <div className="career-model" aria-label="Ridgelineの看護師イメージモデル">
          <span>あなたらしい働き方を<br />一緒に見つけましょう</span>
          <img src="/assets/brand-model/ridgeline-nurse-bust.png" alt="笑顔で案内するRidgelineの看護師イメージモデル" />
        </div>
      </section>

      <div className="career-content">
        {step < questions.length ? (
          <ChoiceStep
            step={step}
            answer={answers[step]}
            onAnswer={handleAnswer}
            onBack={() => setStep((current) => Math.max(0, current - 1))}
            onNext={() => {
              if (answers[step]) {
                setStep((current) => current + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
        ) : (
          <RegistrationForm answers={answers} onRestart={restart} />
        )}
      </div>

      <footer className="career-footer">
        <p>Copyright © 2026 Ridgeline</p>
      </footer>
    </main>
  );
}
