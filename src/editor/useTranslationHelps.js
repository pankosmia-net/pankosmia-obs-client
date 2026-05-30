import { useState, useEffect } from "react";

const GITEA_HOST = "https://git.door43.org";

const TSV_URLS = {
  tn: `${GITEA_HOST}/es-419_gl/es-419_obs-tn/raw/branch/master/tn_OBS.tsv`,
  tq: `${GITEA_HOST}/es-419_gl/es-419_obs-tq/raw/branch/master/tq_OBS.tsv`,
  twl: `${GITEA_HOST}/es-419_gl/es-419_obs-twl/raw/branch/master/twl_OBS.tsv`,
};

const TW_BASE = `${GITEA_HOST}/es-419_gl/es-419_tw/raw/branch/master/bible`;

function parseTsv(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || "").trim();
    });
    return row;
  });
}

function refKey(chapter, paragraph) {
  return `${chapter}:${paragraph}`;
}

function groupByRef(rows) {
  const map = {};
  for (const row of rows) {
    const ref = row.Reference;
    if (!ref) continue;
    if (!map[ref]) map[ref] = [];
    map[ref].push(row);
  }
  return map;
}

function twLinkToPath(link) {
  const match = link.match(/rc:\/\/\*\/tw\/dict\/bible\/(.+)/);
  return match ? match[1] : null;
}

export default function useTranslationHelps() {
  const [tn, setTn] = useState(null);
  const [tq, setTq] = useState(null);
  const [twl, setTwl] = useState(null);
  const [twCache, setTwCache] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tnRes, tqRes, twlRes] = await Promise.all([
          fetch(TSV_URLS.tn),
          fetch(TSV_URLS.tq),
          fetch(TSV_URLS.twl),
        ]);
        if (tnRes.ok) setTn(groupByRef(parseTsv(await tnRes.text())));
        if (tqRes.ok) setTq(groupByRef(parseTsv(await tqRes.text())));
        if (twlRes.ok) setTwl(groupByRef(parseTsv(await twlRes.text())));
      } catch {
        // offline
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const getNotesForPara = (chapter, paragraph) => {
    if (!tn) return [];
    return tn[refKey(chapter, paragraph)] || [];
  };

  const getQuestionsForPara = (chapter, paragraph) => {
    if (!tq) return [];
    return tq[refKey(chapter, paragraph)] || [];
  };

  const getWordLinksForPara = (chapter, paragraph) => {
    if (!twl) return [];
    const rows = twl[refKey(chapter, paragraph)] || [];
    return rows.map((r) => ({
      word: r.OrigWords,
      tag: r.Tags,
      twPath: twLinkToPath(r.TWLink),
    })).filter((r) => r.twPath);
  };

  const fetchTwArticle = async (twPath) => {
    if (twCache[twPath]) return twCache[twPath];
    try {
      const res = await fetch(`${TW_BASE}/${twPath}.md`);
      if (!res.ok) return null;
      const text = await res.text();
      setTwCache((prev) => ({ ...prev, [twPath]: text }));
      return text;
    } catch {
      return null;
    }
  };

  return {
    loading,
    getNotesForPara,
    getQuestionsForPara,
    getWordLinksForPara,
    fetchTwArticle,
  };
}
