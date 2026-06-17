import React, { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Globe2 } from "lucide-react";

/**
 * Address textarea with **Photon** (OpenStreetMap, by Komoot) autocomplete.
 *
 *   - Free, no API key required.
 *   - Better fuzzy matching than Nominatim — Nominatim returns the most
 *     populous match when a query is ambiguous (Lahore wins everything),
 *     Photon weights tokens individually and surfaces e.g. "Bahawalpur"
 *     when the query contains it.
 *   - We filter the response client-side to country == "Pakistan" so
 *     stray foreign matches don't appear.
 *   - Debounced 500 ms per keystroke; in-flight requests are aborted
 *     by the next keystroke.
 *
 * Endpoint: https://photon.komoot.io/api/?q=...&lang=en&limit=8
 * Docs:     https://photon.komoot.io
 *
 * Props:
 *   value           — current text (controlled)
 *   onChange(text)  — set the text
 *   error / hasError — pass-through to the textarea border
 *   disabled
 *   placeholder
 *   helper
 *   minLength       — only fire suggestions after this many chars (default 3)
 *   biasLat / biasLon — optional proximity hint (e.g. selected city centre)
 */
const BRAND_RED = "#C90606";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const PHOTON_URL = "https://photon.komoot.io/api/";

/**
 * Build a human-readable single-line label from a Photon feature.
 * Photon's `properties` carries scattered fields; we glue together the
 * most useful ones in order of specificity.
 */
const labelFromFeature = (p = {}) => {
  const parts = [
    p.name,
    p.housenumber ? `${p.housenumber}` : null,
    p.street,
    p.district,
    p.city || p.town || p.village,
    p.state,
    p.country,
  ].filter(Boolean);
  // De-dupe consecutive matches ("Lahore, Lahore, Punjab").
  return parts.filter((v, i, a) => i === 0 || v !== a[i - 1]).join(", ");
};

const AddressAutocomplete = ({
  value = "",
  onChange,
  error = "",
  hasError = false,
  disabled = false,
  placeholder = "Start typing — suggestions from OpenStreetMap / Photon",
  helper = "",
  minLength = 3,
  biasLat,
  biasLon,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef(null);
  const abortRef = useRef(null);
  const lastQueryRef = useRef("");

  /* Debounced query */
  useEffect(() => {
    if (!value || value.length < minLength) {
      setResults([]); setOpen(false); setLoading(false);
      return;
    }
    const q = value.trim();
    if (q === lastQueryRef.current) return;

    const t = setTimeout(async () => {
      lastQueryRef.current = q;
      setLoading(true);
      try { abortRef.current?.abort(); } catch {}
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const url = new URL(PHOTON_URL);
        url.searchParams.set("q", q);
        url.searchParams.set("lang", "en");
        url.searchParams.set("limit", "12");
        // Photon takes a single bias point — we don't have an explicit
        // bounding-box param like Nominatim's `viewbox`. If the caller
        // supplied a city centre as a hint, lean on that.
        if (typeof biasLat === "number" && typeof biasLon === "number") {
          url.searchParams.set("lat", String(biasLat));
          url.searchParams.set("lon", String(biasLon));
        }
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Photon error " + res.status);
        const data = await res.json();

        // Photon returns GeoJSON; filter to Pakistan only and keep up to 8.
        const filtered = (data?.features || [])
          .filter((f) => f?.properties?.country === "Pakistan")
          .slice(0, 8)
          .map((f) => ({
            id:    f.properties?.osm_id || `${f.geometry?.coordinates?.join(",")}`,
            label: labelFromFeature(f.properties),
            short: [
              f.properties?.name,
              f.properties?.city || f.properties?.town || f.properties?.village,
              f.properties?.state,
            ].filter(Boolean).join(", "),
            raw:   f.properties,
          }))
          .filter((r) => r.label);

        setResults(filtered);
        setOpen(filtered.length > 0);
        setHighlight(-1);
      } catch (e) {
        if (e.name !== "AbortError") {
          setResults([]); setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => { clearTimeout(t); };
  }, [value, minLength, biasLat, biasLon]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const pick = (r) => {
    onChange?.(r.label);
    setOpen(false);
    setResults([]);
    lastQueryRef.current = r.label;
  };

  const handleKey = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (highlight >= 0) { e.preventDefault(); pick(results[highlight]); }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          background: SURFACE_HOVER,
          border: `1px solid ${hasError ? "#FCA5A5" : BORDER}`,
          color: TEXT_PRIMARY,
          width: "100%",
          padding: 12,
          borderRadius: 8,
          fontSize: 13,
          outline: "none",
          resize: "vertical",
          fontFamily: "'Montserrat', sans-serif",
        }}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[11px]" style={{ color: error ? BRAND_RED : TEXT_MUTED, fontWeight: error ? 500 : 400 }}>
          {error || helper || (
            <span className="inline-flex items-center gap-1">
              <Globe2 size={10} strokeWidth={2.2} />
              Powered by Photon (OpenStreetMap) — free, no key
            </span>
          )}
        </p>
        {loading && <Loader2 size={12} className="animate-spin" style={{ color: TEXT_MUTED }} />}
      </div>

      {/* Suggestions */}
      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden bg-white shadow-xl rounded-lg"
          style={{ border: `1px solid ${BORDER}`, boxShadow: "0 12px 32px -10px rgba(15,23,42,0.18)" }}
        >
          {results.map((r, i) => {
            const isH = i === highlight;
            return (
              <button
                key={r.id || i}
                type="button"
                onClick={() => pick(r)}
                onMouseEnter={() => setHighlight(i)}
                className="flex items-start w-full gap-2 px-3 py-2 text-left transition"
                style={{ background: isH ? "#F1F5F9" : "transparent" }}
              >
                <MapPin size={13} strokeWidth={2.2} style={{ color: TEXT_MUTED, marginTop: 2, flexShrink: 0 }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] truncate" style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>
                    {r.short || r.label}
                  </span>
                  <span className="block text-[11px] truncate mt-0.5" style={{ color: TEXT_MUTED }}>
                    {r.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
