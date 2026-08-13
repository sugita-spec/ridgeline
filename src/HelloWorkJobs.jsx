import { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  Briefcase,
  CalendarBlank,
  CheckCircle,
  Clock,
  CurrencyJpy,
  IdentificationCard,
  MapPin,
  ShieldCheck,
} from "@phosphor-icons/react";

const OFFICIAL_SERVICE_URL = "https://www.hellowork.mhlw.go.jp/provide/online02.html";

const initialState = { status: "loading", jobs: [], message: "" };

function DetailItem({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="hellowork-detail-item">
      <span className="hellowork-detail-icon" aria-hidden="true">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <article className="hellowork-job-card">
      <div className="hellowork-job-title">
        <div>
          <p>{job.employer || "事業所名非公開"}</p>
          <h4>{job.occupation || "看護職"}</h4>
        </div>
        {job.employmentType ? <span>{job.employmentType}</span> : null}
      </div>

      {job.description ? <p className="hellowork-description">{job.description}</p> : null}

      <div className="hellowork-detail-grid">
        <DetailItem icon={<IdentificationCard size={18} />} label="求人番号" value={job.jobNumber} />
        <DetailItem icon={<CurrencyJpy size={18} />} label="賃金" value={job.salary} />
        <DetailItem icon={<MapPin size={18} />} label="就業場所" value={job.workplace} />
        <DetailItem icon={<Clock size={18} />} label="勤務時間" value={job.workingHours} />
        <DetailItem icon={<CalendarBlank size={18} />} label="休日・年間休日" value={job.holidays} />
        <DetailItem icon={<ShieldCheck size={18} />} label="必要な資格" value={job.qualifications} />
        <DetailItem icon={<CheckCircle size={18} />} label="加入保険" value={job.insurance} />
        <DetailItem icon={<Briefcase size={18} />} label="受付日・有効期限" value={job.period} />
      </div>
    </article>
  );
}

export function HelloWorkJobs({ hospitalName }) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const controller = new AbortController();
    setState(initialState);

    async function loadJobs() {
      try {
        const response = await fetch(`/api/hellowork/jobs?hospital=${encodeURIComponent(hospitalName)}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          setState({ status: "pending", jobs: [], message: "連携用の接続情報を設定すると求人を表示できます。" });
          return;
        }

        const data = await response.json();
        if (!response.ok || !data.configured) {
          setState({ status: "pending", jobs: [], message: data.message || "連携用の接続情報を設定すると求人を表示できます。" });
          return;
        }

        setState({
          status: data.jobs?.length ? "ready" : "empty",
          jobs: data.jobs || [],
          message: data.partial ? "直近の求人データから表示しています。" : "",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setState({ status: "error", jobs: [], message: "現在、求人情報を取得できません。時間をおいて再度お試しください。" });
        }
      }
    }

    loadJobs();
    return () => controller.abort();
  }, [hospitalName]);

  return (
    <section className="hellowork-section" aria-labelledby="hellowork-title">
      <div className="hellowork-heading">
        <div>
          <p>厚生労働省 ハローワーク</p>
          <h3 id="hellowork-title">求人情報提供API</h3>
        </div>
        <span className={`hellowork-status is-${state.status}`}>
          {state.status === "ready" ? `${state.jobs.length}件掲載` : state.status === "loading" ? "確認中" : state.status === "empty" ? "募集中なし" : "連携準備中"}
        </span>
      </div>

      {state.status === "loading" ? (
        <div className="hellowork-loading" role="status" aria-label="ハローワーク求人を確認中">
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {state.status === "pending" ? (
        <div className="hellowork-pending">
          <strong>公式求人データとの接続準備ができています</strong>
          <p>{state.message}</p>
          <p>接続後は、求人番号・仕事内容・賃金・勤務時間・休日・資格・加入保険・有効期限を自動で表示します。</p>
          <small>連携対象：神奈川県の一般求人（M114）から看護職を抽出</small>
        </div>
      ) : null}

      {state.status === "empty" ? (
        <div className="hellowork-empty">
          <strong>現在、この病院に一致する看護職求人は確認できませんでした</strong>
          <p>募集状況は更新されるため、病院の採用ページもあわせてご確認ください。</p>
        </div>
      ) : null}

      {state.status === "error" ? <p className="hellowork-error" role="alert">{state.message}</p> : null}

      {state.status === "ready" ? (
        <div className="hellowork-job-list">
          {state.jobs.map((job) => <JobCard key={job.jobNumber} job={job} />)}
          {state.message ? <p className="hellowork-partial-note">{state.message}</p> : null}
        </div>
      ) : null}

      <div className="hellowork-source-note">
        <span>出典：ハローワーク求人情報提供サービス</span>
        <a href={OFFICIAL_SERVICE_URL} target="_blank" rel="noreferrer">
          公式案内 <ArrowSquareOut size={15} />
        </a>
      </div>
    </section>
  );
}
