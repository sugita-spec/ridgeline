import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Buildings,
  CheckCircle,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  NotePencil,
  Plus,
  SignOut,
  Trash,
  X,
} from "@phosphor-icons/react";
import { FACILITY_TYPES } from "./facilityTypes.js";

const ADMIN_EMAIL = "sugita@kameya-hldgs.com";
const REGIONS = ["横浜市", "川崎市", "相模原市", "横須賀・三浦", "湘南エリア", "県央・県西"];

const emptyHospital = {
  name: "",
  area: "",
  region: "横浜市",
  station: "",
  type: "総合病院",
  tags: "",
  role: "看護師採用情報",
  salary: "公式サイトで確認",
  shift: "採用条件は公式サイトへ",
  holidays: "",
  officialUrl: "",
  recruitUrl: "",
  mapsUrl: "",
  image: "",
  imageNote: "管理画面から登録した外観画像",
  published: true,
};

async function api(path, init) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "処理に失敗しました。");
  return data;
}

function LoginPanel({ onAuthenticated }) {
  const [step, setStep] = useState("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/request-code", { method: "POST", body: JSON.stringify({ email: ADMIN_EMAIL }) });
      setStep("code");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/verify-code", { method: "POST", body: JSON.stringify({ code }) });
      onAuthenticated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-shell">
      <a className="admin-back-link" href="/"><ArrowLeft size={17} />ユーザーサイトへ戻る</a>
      <section className="admin-login-card">
        <div className="admin-login-mark"><Buildings size={28} weight="duotone" /></div>
        <p>RIDGELINE ADMIN</p>
        <h1>施設情報を管理</h1>
        {step === "email" ? (
          <>
            <div className="admin-email-box">
              <span>管理者メール</span>
              <strong>{ADMIN_EMAIL}</strong>
            </div>
            <p className="admin-login-help">登録済みメールアドレスへ、10分間有効なログインコードを送信します。</p>
            <button className="admin-primary-button" type="button" disabled={busy} onClick={sendCode}>
              {busy ? "送信中…" : "ログインコードを送る"}
            </button>
          </>
        ) : (
          <form onSubmit={verify}>
            <label className="admin-code-field">
              <span>6桁のログインコード</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                required
              />
            </label>
            <button className="admin-primary-button" type="submit" disabled={busy || code.length !== 6}>
              {busy ? "確認中…" : "管理画面にログイン"}
            </button>
            <button className="admin-text-button" type="button" onClick={() => { setStep("email"); setCode(""); }}>
              メール送信からやり直す
            </button>
          </form>
        )}
        {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}

function HospitalForm({ hospital, onClose, onSaved }) {
  const [form, setForm] = useState(() => hospital ? { ...hospital, tags: hospital.tags.join("、") } : emptyHospital);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const path = hospital ? `/api/admin/hospitals/${hospital.id}` : "/api/admin/hospitals";
      const data = await api(path, { method: hospital ? "PUT" : "POST", body: JSON.stringify(form) });
      onSaved(data.hospital, Boolean(hospital));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p>{hospital ? `FACILITY ID ${hospital.id}` : "NEW FACILITY"}</p>
            <h2 id="admin-form-title">{hospital ? "施設情報を編集" : "新しい施設を登録"}</h2>
          </div>
          <button type="button" aria-label="閉じる" onClick={onClose}><X size={22} /></button>
        </header>
        <form className="admin-facility-form" onSubmit={submit}>
          <div className="admin-form-section">
            <h3>基本情報</h3>
            <label className="admin-field admin-field-wide"><span>施設名 <b>必須</b></span><input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
            <label className="admin-field admin-field-wide"><span>所在地 <b>必須</b></span><input value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="横浜市〇〇区…" required /></label>
            <label className="admin-field"><span>エリア <b>必須</b></span><select value={form.region} onChange={(event) => update("region", event.target.value)}>{REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
            <label className="admin-field"><span>施設形態</span><select value={form.type} onChange={(event) => update("type", event.target.value)}>{FACILITY_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="admin-field admin-field-wide"><span>交通アクセス</span><input value={form.station} onChange={(event) => update("station", event.target.value)} placeholder="〇〇駅から徒歩5分" /></label>
            <label className="admin-field admin-field-wide"><span>特徴タグ</span><input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="災害拠点病院、公式情報確認済み" /></label>
          </div>
          <div className="admin-form-section">
            <h3>採用情報</h3>
            <label className="admin-field admin-field-wide"><span>募集職種</span><input value={form.role} onChange={(event) => update("role", event.target.value)} /></label>
            <label className="admin-field"><span>給与・待遇</span><input value={form.salary} onChange={(event) => update("salary", event.target.value)} /></label>
            <label className="admin-field"><span>勤務形態</span><input value={form.shift} onChange={(event) => update("shift", event.target.value)} /></label>
            <label className="admin-field admin-field-wide"><span>休日・確認日</span><input value={form.holidays} onChange={(event) => update("holidays", event.target.value)} /></label>
          </div>
          <div className="admin-form-section">
            <h3>リンク・画像</h3>
            <label className="admin-field admin-field-wide"><span>公式サイトURL <b>必須</b></span><input type="url" value={form.officialUrl} onChange={(event) => update("officialUrl", event.target.value)} placeholder="https://" required /></label>
            <label className="admin-field admin-field-wide"><span>採用ページURL</span><input type="url" value={form.recruitUrl} onChange={(event) => update("recruitUrl", event.target.value)} placeholder="https://" /></label>
            <label className="admin-field admin-field-wide"><span>GoogleマップURL</span><input type="url" value={form.mapsUrl} onChange={(event) => update("mapsUrl", event.target.value)} placeholder="未入力なら施設名から自動生成" /></label>
            <label className="admin-field admin-field-wide"><span>外観画像URL</span><input value={form.image || ""} onChange={(event) => update("image", event.target.value)} placeholder="https:// または /assets/…" /></label>
            <label className="admin-field admin-field-wide"><span>画像の注記</span><input value={form.imageNote} onChange={(event) => update("imageNote", event.target.value)} /></label>
          </div>
          <label className="admin-publish-toggle">
            <input type="checkbox" checked={form.published} onChange={(event) => update("published", event.target.checked)} />
            <span><b>ユーザーサイトに公開する</b><small>オフの場合は下書きとして保存されます</small></span>
          </label>
          {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
          <footer>
            <button className="admin-secondary-button" type="button" onClick={onClose}>キャンセル</button>
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "保存中…" : hospital ? "変更を保存" : "施設を登録"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function AdminDashboard() {
  const [authState, setAuthState] = useState("checking");
  const [hospitals, setHospitals] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("すべて");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadHospitals = async () => {
    try {
      const data = await api("/api/admin/hospitals");
      setHospitals(data.hospitals);
      setError("");
    } catch (requestError) {
      if (/ログイン/.test(requestError.message)) setAuthState("signed-out");
      else setError(requestError.message);
    }
  };

  useEffect(() => {
    api("/api/admin/session")
      .then(() => { setAuthState("authenticated"); return loadHospitals(); })
      .catch(() => setAuthState("signed-out"));
  }, []);

  const filtered = useMemo(() => hospitals.filter((hospital) => {
    const matchesQuery = !query || `${hospital.name} ${hospital.area} ${hospital.region}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "すべて" || (status === "公開中" ? hospital.published : !hospital.published);
    return matchesQuery && matchesStatus;
  }), [hospitals, query, status]);

  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const removeHospital = async (hospital) => {
    if (!window.confirm(`「${hospital.name}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      await api(`/api/admin/hospitals/${hospital.id}`, { method: "DELETE" });
      setHospitals((current) => current.filter((item) => item.id !== hospital.id));
      flash("施設を削除しました");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (authState === "checking") return <div className="admin-loading">Ridgeline Admin を読み込んでいます…</div>;
  if (authState !== "authenticated") return <LoginPanel onAuthenticated={() => { setAuthState("authenticated"); loadHospitals(); }} />;

  const publishedCount = hospitals.filter((hospital) => hospital.published).length;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">Ridgeline <span>ADMIN</span></a>
        <nav>
          <a className="active" href="/admin"><Buildings size={20} weight="duotone" />施設管理</a>
          <a href="/" target="_blank"><Eye size={20} />ユーザーサイト</a>
        </nav>
        <div className="admin-account"><span>管理者</span><strong>{ADMIN_EMAIL}</strong></div>
        <button type="button" onClick={async () => { await api("/api/admin/session", { method: "DELETE" }); setAuthState("signed-out"); }}><SignOut size={19} />ログアウト</button>
      </aside>
      <main className="admin-main">
        <header className="admin-page-header">
          <div><p>FACILITY MANAGEMENT</p><h1>施設管理</h1><span>病院・施設情報の登録、編集、公開状態を管理します。</span></div>
          <button className="admin-primary-button" type="button" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={19} weight="bold" />新しい施設を登録</button>
        </header>
        <section className="admin-stats" aria-label="施設登録状況">
          <article><span>登録施設</span><strong>{hospitals.length}</strong><small>件</small></article>
          <article><span>公開中</span><strong>{publishedCount}</strong><small>件</small></article>
          <article><span>下書き</span><strong>{hospitals.length - publishedCount}</strong><small>件</small></article>
        </section>
        <section className="admin-table-card">
          <div className="admin-table-tools">
            <label><MagnifyingGlass size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="施設名・所在地で検索" /></label>
            <div>{["すべて", "公開中", "下書き"].map((item) => <button type="button" className={status === item ? "active" : ""} onClick={() => setStatus(item)} key={item}>{item}</button>)}</div>
          </div>
          {error ? <p className="admin-form-error admin-list-error" role="alert">{error}</p> : null}
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>施設</th><th>エリア</th><th>施設形態</th><th>公開状態</th><th>更新日</th><th><span className="sr-only">操作</span></th></tr></thead>
              <tbody>
                {filtered.map((hospital) => (
                  <tr key={hospital.id}>
                    <td><div className="admin-facility-cell">{hospital.image ? <img src={hospital.image} alt="" /> : <span><Buildings size={22} weight="duotone" /></span>}<div><strong>{hospital.name}</strong><small>{hospital.area}</small></div></div></td>
                    <td>{hospital.region}</td><td>{hospital.type}</td>
                    <td><span className={`admin-status ${hospital.published ? "published" : "draft"}`}>{hospital.published ? <Eye size={15} /> : <EyeSlash size={15} />}{hospital.published ? "公開中" : "下書き"}</span></td>
                    <td>{hospital.updatedAt ? new Date(`${hospital.updatedAt.replace(" ", "T")}Z`).toLocaleDateString("ja-JP") : "—"}</td>
                    <td><div className="admin-row-actions"><button type="button" aria-label={`${hospital.name}を編集`} onClick={() => { setEditing(hospital); setShowForm(true); }}><NotePencil size={19} /></button><button className="danger" type="button" aria-label={`${hospital.name}を削除`} onClick={() => removeHospital(hospital)}><Trash size={19} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? <div className="admin-empty"><Buildings size={34} weight="duotone" /><p>条件に一致する施設はありません。</p></div> : null}
          <footer className="admin-table-footer">{filtered.length}件を表示</footer>
        </section>
      </main>
      {showForm ? <HospitalForm hospital={editing} onClose={() => setShowForm(false)} onSaved={(savedHospital, wasEditing) => { setHospitals((current) => wasEditing ? current.map((item) => item.id === savedHospital.id ? savedHospital : item) : [savedHospital, ...current]); setShowForm(false); flash(wasEditing ? "施設情報を更新しました" : "施設を登録しました"); }} /> : null}
      {message ? <div className="admin-toast" role="status"><CheckCircle size={19} weight="fill" />{message}</div> : null}
    </div>
  );
}
