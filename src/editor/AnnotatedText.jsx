import { useState, useEffect, Fragment } from "react";
import { Box, Popover, Typography } from "@mui/material";
import Markdown from "react-markdown";

export default function AnnotatedText({ text, wordLinks, fetchTwTitle, fetchTwArticle }) {
  const [termMap, setTermMap] = useState([]);
  const [popoverPos, setPopoverPos] = useState(null);
  const [popoverContent, setPopoverContent] = useState("");
  const [popoverLoading, setPopoverLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadTerms = async () => {
      const unique = wordLinks.filter(
        (w, i, arr) => arr.findIndex((x) => x.twPath === w.twPath) === i,
      );
      const results = [];
      for (const wl of unique) {
        const titles = await fetchTwTitle(wl.twPath);
        if (titles && !cancelled) {
          results.push({ terms: titles, twPath: wl.twPath, tag: wl.tag });
        }
      }
      if (!cancelled) setTermMap(results);
    };
    if (wordLinks.length > 0) {
      loadTerms();
    } else {
      setTermMap([]);
    }
    return () => { cancelled = true; };
  }, [wordLinks, fetchTwTitle]);

  const handleTermClick = async (event, twPath) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPos({ top: rect.bottom + 4, left: window.innerWidth / 2 });
    setPopoverLoading(true);
    setPopoverContent("");
    const article = await fetchTwArticle(twPath);
    setPopoverContent(article || "Article not found");
    setPopoverLoading(false);
  };

  const plain = text.replace(/^#+\s*/, "").replace(/!\[.*?\]\(.*?\)/g, "").trim();
  if (!plain) return null;

  const segments = buildSegments(plain, termMap);

  return (
    <Box sx={{ fontSize: "0.9rem", color: "text.secondary", lineHeight: 1.8 }}>
      {segments.map((seg, i) =>
        seg.twPath ? (
          <Box
            key={i}
            component="span"
            onClick={(e) => handleTermClick(e, seg.twPath)}
            sx={{
              backgroundColor: seg.tag === "keyterm" ? "primary.light" : "action.hover",
              color: seg.tag === "keyterm" ? "primary.contrastText" : "text.primary",
              borderRadius: "3px",
              px: 0.4,
              mx: 0.1,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          >
            {seg.text}
          </Box>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}

      <Popover
        open={Boolean(popoverPos)}
        onClose={() => setPopoverPos(null)}
        anchorReference="anchorPosition"
        anchorPosition={popoverPos || { top: 0, left: 0 }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: "min(400px, 90vw)",
              maxHeight: 350,
              overflow: "auto",
              p: 2,
            },
          },
        }}
      >
        {popoverLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : (
          <Markdown>{popoverContent}</Markdown>
        )}
      </Popover>
    </Box>
  );
}

function buildSegments(text, termMap) {
  if (!termMap.length) return [{ text }];

  const matches = [];
  for (const entry of termMap) {
    for (const term of entry.terms) {
      if (term.length < 2) continue;
      const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
      let m;
      while ((m = regex.exec(text)) !== null) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          matched: m[0],
          twPath: entry.twPath,
          tag: entry.tag,
        });
        break;
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);
  const deduped = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      deduped.push(m);
      lastEnd = m.end;
    }
  }

  const segments = [];
  let pos = 0;
  for (const m of deduped) {
    if (m.start > pos) {
      segments.push({ text: text.slice(pos, m.start) });
    }
    segments.push({ text: m.matched, twPath: m.twPath, tag: m.tag });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos) });
  }
  return segments;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
