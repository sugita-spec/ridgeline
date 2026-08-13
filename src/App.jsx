import { useEffect, useMemo, useState } from "react";
import {
  ArrowSquareOut,
  BookmarkSimple,
  Buildings,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChatCircleText,
  Check,
  Clock,
  Heart,
  ListBullets,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Train,
  X,
} from "@phosphor-icons/react";
import { filters, hospitals } from "./data.js";
import { CareerSupport } from "./CareerSupport.jsx";
import { HelloWorkJobs } from "./HelloWorkJobs.jsx";

function Header({ favoriteCount, saved, onSave, menuOpen, onMenu, view, onNavigate }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" aria-label="Ridgeline ホーム" onClick={() => onNavigate("directory")}>
        Ridgeline
      </button>
      <nav className="header-actions" aria-label="ユーティリティ">
        <button
          className={`header-action support-link ${view === "career" ? "is-active" : ""}`}
          type="button"
          aria-label={view === "career" ? "病院を探す" : "転職サポート"}
          onClick={() => onNavigate(view === "career" ? "directory" : "career")}
        >
          {view === "career" ? <Buildings size={23} weight="duotone" /> : <ChatCircleText size={23} weight="duotone" />}
          <span>{view === "career" ? "病院を探す" : "転職サポート"}</span>
        </button>
        {view === "directory" ? (
          <>
            <button className="header-action" type="button" aria-label="気になる病院">
              <Heart size={23} weight={favoriteCount ? "fill" : "regular"} />
              <span>気になる</span>
              {favoriteCount > 0 ? <b>{favoriteCount}</b> : null}
            </button>
            <button className="header-action" type="button" aria-label={saved ? "保存済みの検索条件" : "検索条件を保存"} onClick={onSave}>
              <BookmarkSimple size={22} weight={saved ? "fill" : "regular"} />
              <span>{saved ? "保存済み" : "検索条件を保存"}</span>
            </button>
          </>
        ) : null}
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={onMenu}
        >
          {menuOpen ? <X size={24} /> : <ListBullets size={25} />}
          <span>メニュー</span>
        </button>
      </nav>
      {menuOpen ? (
        <div className="menu-popover">
          <button type="button" onClick={() => onNavigate("directory")}>病院を探す</button>
          <button type="button" onClick={() => onNavigate("career")}>転職サポート</button>
          {view === "directory" ? <button type="button" onClick={onSave}>検索条件を保存</button> : null}
          <a href="#guide">転職ガイド</a>
        </div>
      ) : null}
    </header>
  );
}

function FilterBar({ values, openFilter, onToggle, onSelect, onSearch, view, onViewChange }) {
  return (
    <section className="filter-bar" aria-label="求人検索条件">
      <div className="filter-fields">
        {filters.map((filter) => (
          <div className="filter-wrap" key={filter.key}>
            <button
              className="filter-control"
              type="button"
              aria-expanded={openFilter === filter.key}
              onClick={() => onToggle(filter.key)}
            >
              <span className="filter-label">{filter.label}</span>
              <span className="filter-value">
                {filter.key === "area" ? <MapPin size={19} weight="fill" /> : null}
                {values[filter.key]}
              </span>
              <CaretDown size={16} />
            </button>
            {openFilter === filter.key ? (
              <div className="filter-menu" role="menu">
                {filter.options.map((option) => (
                  <button
                    type="button"
                    role="menuitem"
                    key={option}
                    onClick={() => onSelect(filter.key, option)}
                  >
                    <span>{option}</span>
                    {values[filter.key] === option ? <Check size={17} weight="bold" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button className="search-button" type="button" onClick={onSearch}>
        <MagnifyingGlass size={22} weight="bold" />
        <span>検索する</span>
      </button>
      <ViewToggle view={view} onChange={onViewChange} />
    </section>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle" aria-label="表示切り替え">
      <button
        type="button"
        className={view === "list" ? "active" : ""}
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
      >
        <ListBullets size={18} />
        リスト
      </button>
      <button
        type="button"
        className={view === "map" ? "active" : ""}
        aria-pressed={view === "map"}
        onClick={() => onChange("map")}
      >
        <MapTrifold size={18} />
        地図
      </button>
    </div>
  );
}

function HospitalCard({ hospital, active, favorite, onActivate, onFavorite, onDetail }) {
  return (
    <article
      className={`hospital-card ${active ? "is-active" : ""}`}
      onMouseEnter={onActivate}
      onFocusCapture={onActivate}
    >
      <button
        className="card-select"
        type="button"
        aria-label={`${hospital.name}を地図で表示`}
        onClick={onActivate}
      >
        {hospital.id}
      </button>
      <figure className="hospital-visual">
        {hospital.image ? (
          <img className="hospital-photo" src={hospital.image} alt={`${hospital.name}をイメージした外観`} />
        ) : (
          <div className="hospital-placeholder" role="img" aria-label={`${hospital.name}の外観画像は確認中`}>
            <Buildings size={38} weight="duotone" />
            <span>外観画像<br />確認中</span>
          </div>
        )}
        <figcaption>{hospital.imageNote}</figcaption>
      </figure>
      <div className="hospital-copy">
        <div className="hospital-title-line">
          <h2>{hospital.name}</h2>
          <button
            className={`favorite-button ${favorite ? "is-favorite" : ""}`}
            type="button"
            aria-pressed={favorite}
            onClick={() => onFavorite(hospital.id)}
          >
            <BookmarkSimple size={19} weight={favorite ? "fill" : "regular"} />
            <span>{favorite ? "気になる済み" : "気になる"}</span>
          </button>
        </div>
        <p className="location">
          <span><MapPin size={16} weight="fill" />{hospital.area}</span>
          <span><Train size={17} weight="fill" />{hospital.station}</span>
        </p>
        <div className="tags" aria-label="施設の特徴">
          <span>{hospital.type}</span>
          {hospital.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <p className="role">{hospital.role}</p>
        <div className="job-facts">
          <span><b>{hospital.salary}</b></span>
          <span><Clock size={18} />{hospital.shift}</span>
          <span><CalendarBlank size={18} />{hospital.holidays}</span>
        </div>
        <div className="resource-links" aria-label={`${hospital.name}の関連リンク`}>
          <a href={hospital.officialUrl} target="_blank" rel="noreferrer">公式サイト <ArrowSquareOut size={15} /></a>
          <a href={hospital.recruitUrl} target="_blank" rel="noreferrer">採用情報 <ArrowSquareOut size={15} /></a>
          <a href={hospital.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={15} weight="fill" />Googleマップ</a>
          <button type="button" onClick={() => onDetail(hospital)}>
            詳細 <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ResultsPanel({
  hospitals: hospitalData,
  activeId,
  favorites,
  appliedFilters,
  sort,
  onSort,
  onActivate,
  onFavorite,
  onDetail,
}) {
  const visibleHospitals = useMemo(() => {
    const filteredHospitals = hospitalData.filter((hospital) => {
      if (appliedFilters.area !== "神奈川県" && hospital.region !== appliedFilters.area) return false;
      if (appliedFilters.facility !== "すべて" && hospital.type !== appliedFilters.facility) return false;
      return true;
    });

    if (sort === "施設名順") {
      return filteredHospitals.toSorted((a, b) => a.name.localeCompare(b.name, "ja"));
    }
    if (sort === "地域順") {
      return filteredHospitals.toSorted((a, b) => a.area.localeCompare(b.area, "ja"));
    }
    return filteredHospitals;
  }, [appliedFilters, hospitalData, sort]);

  return (
    <section className="results-panel" id="results">
      <div className="results-heading">
        <div>
          <h1>神奈川県の病院・看護師採用情報</h1>
          <p><strong>{hospitalData.length}</strong> 施設を登録済み</p>
        </div>
      </div>
      <div className="sort-row">
        <label>
          <span className="sr-only">表示順</span>
          <select value={sort} onChange={(event) => onSort(event.target.value)}>
            <option>登録順</option>
            <option>施設名順</option>
            <option>地域順</option>
          </select>
        </label>
        <span>{visibleHospitals.length}件 / 全{hospitalData.length}施設</span>
      </div>
      <div className="hospital-list">
        {visibleHospitals.map((hospital) => (
          <HospitalCard
            key={hospital.id}
            hospital={hospital}
            active={hospital.id === activeId}
            favorite={favorites.has(hospital.id)}
            onActivate={() => onActivate(hospital.id)}
            onFavorite={onFavorite}
            onDetail={onDetail}
          />
        ))}
        {visibleHospitals.length === 0 ? (
          <div className="empty-results">
            <Buildings size={34} weight="duotone" />
            <p>この条件に一致する施設はありません。</p>
          </div>
        ) : null}
      </div>
      <p className="data-note">所在地・交通・公式リンクはGoogleマップと各病院公式サイトで照合しています。</p>
    </section>
  );
}

function MapPanel({ hospitals: hospitalData, activeId, focused }) {
  const activeHospital = hospitalData.find((hospital) => hospital.id === activeId);
  if (!activeHospital) return null;

  const mapQuery = encodeURIComponent(`${activeHospital.name} ${activeHospital.area}`);
  const embedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <section className={`map-panel google-map-panel ${focused ? "is-focused" : ""}`} aria-label="Googleマップで病院の場所を確認">
      <div className="google-map-toolbar">
        <div>
          <span>選択中の病院</span>
          <strong>{activeHospital.name}</strong>
        </div>
        <a href={activeHospital.mapsUrl} target="_blank" rel="noreferrer">
          Googleマップで開く <ArrowSquareOut size={16} />
        </a>
      </div>
      <iframe
        key={activeHospital.id}
        className="google-map-frame"
        src={embedUrl}
        title={`${activeHospital.name}のGoogleマップ`}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="google-map-note">病院リストを選択すると、地図の表示先が切り替わります。</p>
    </section>
  );
}

function DetailDialog({ hospital, onClose, onFavorite, favorite }) {
  if (!hospital) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" type="button" aria-label="閉じる" onClick={onClose}><X size={23} /></button>
        {hospital.image ? (
          <img src={hospital.image} alt={`${hospital.name}をイメージした外観`} />
        ) : (
          <div className="dialog-placeholder" role="img" aria-label={`${hospital.name}の外観画像は確認中`}>
            <Buildings size={54} weight="duotone" />
            <strong>外観画像を確認中</strong>
          </div>
        )}
        <div className="dialog-body">
          <p className="dialog-type">{hospital.type}</p>
          <h2 id="detail-title">{hospital.name}</h2>
          <p className="dialog-location"><MapPin size={17} weight="fill" />{hospital.area}・{hospital.station}</p>
          <div className="dialog-job">
            <div>
              <span>採用情報</span>
              <strong>{hospital.role}</strong>
            </div>
            <div>
              <span>給与・待遇</span>
              <strong>{hospital.salary}</strong>
            </div>
            <div>
              <span>勤務</span>
              <strong>{hospital.shift}</strong>
            </div>
          </div>
          <HelloWorkJobs hospitalName={hospital.name} />
          <p className="dialog-image-note">{hospital.imageNote}。実景写真ではありません。</p>
          <div className="dialog-links">
            <a href={hospital.officialUrl} target="_blank" rel="noreferrer">公式サイト <ArrowSquareOut size={17} /></a>
            <a href={hospital.recruitUrl} target="_blank" rel="noreferrer">看護師採用情報 <ArrowSquareOut size={17} /></a>
            <a href={hospital.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={17} weight="fill" />Googleマップ</a>
          </div>
          <button className="entry-button" type="button" onClick={() => onFavorite(hospital.id)}>
            <BookmarkSimple size={20} weight={favorite ? "fill" : "regular"} />
            {favorite ? "気になるリストに追加済み" : "気になるリストに追加"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [hospitalData, setHospitalData] = useState(hospitals);
  const [view, setView] = useState("directory");
  const [filtersValue, setFiltersValue] = useState({
    area: "神奈川県",
    facility: "すべて",
  });
  const [appliedFilters, setAppliedFilters] = useState(filtersValue);
  const [openFilter, setOpenFilter] = useState(null);
  const [activeId, setActiveId] = useState(1);
  const [favorites, setFavorites] = useState(() => new Set());
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sort, setSort] = useState("登録順");
  const [mobileView, setMobileView] = useState("list");
  const [desktopView, setDesktopView] = useState("list");
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/hospitals")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (active && data.configured && Array.isArray(data.hospitals) && data.hospitals.length) {
          setHospitalData(data.hospitals);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const handleFavorite = (id) => {
    setFavorites((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFilterSelect = (key, value) => {
    setFiltersValue((current) => ({ ...current, [key]: value }));
    setOpenFilter(null);
  };

  const handleNavigate = (nextView) => {
    setView(nextView);
    setMenuOpen(false);
    setDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell" id="top">
      <Header
        favoriteCount={favorites.size}
        saved={saved}
        onSave={() => {
          setSaved((value) => !value);
          flash(saved ? "保存を解除しました" : "検索条件を保存しました");
        }}
        menuOpen={menuOpen}
        onMenu={() => setMenuOpen((value) => !value)}
        view={view}
        onNavigate={handleNavigate}
      />
      {view === "career" ? <CareerSupport /> : (
      <>
      <FilterBar
        values={filtersValue}
        openFilter={openFilter}
        onToggle={(key) => setOpenFilter((current) => current === key ? null : key)}
        onSelect={handleFilterSelect}
        onSearch={() => {
          setAppliedFilters(filtersValue);
          flash("検索条件を反映しました");
        }}
        view={desktopView}
        onViewChange={(view) => {
          setDesktopView(view);
          flash(view === "map" ? "地図を選択しました" : "リストを選択しました");
        }}
      />
      <div className="mobile-results-head">
        <div>
          <h1>神奈川県の病院・看護師採用情報</h1>
          <p><strong>{hospitalData.length}</strong> 施設を登録済み</p>
        </div>
        <ViewToggle view={mobileView} onChange={setMobileView} />
      </div>
      <main className={`content-grid mobile-${mobileView}`}>
        <ResultsPanel
          hospitals={hospitalData}
          activeId={activeId}
          favorites={favorites}
          appliedFilters={appliedFilters}
          sort={sort}
          onSort={setSort}
          onActivate={setActiveId}
          onFavorite={handleFavorite}
          onDetail={setDetail}
        />
        <MapPanel
          hospitals={hospitalData}
          activeId={activeId}
          focused={desktopView === "map"}
        />
      </main>
      </>
      )}
      {message ? <div className="toast" role="status">{message}</div> : null}
      <DetailDialog
        hospital={detail}
        onClose={() => setDetail(null)}
        onFavorite={handleFavorite}
        favorite={detail ? favorites.has(detail.id) : false}
      />
    </div>
  );
}
