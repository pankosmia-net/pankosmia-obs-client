import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import Markdown from "react-markdown";
import "./OBSMuncher.css";

const SPANISH_OBS_BASE =
  "https://git.door43.org/es-419_gl/es-419_obs/raw/branch/master/content";

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function imageUrl(chapter, paragraph) {
  return `https://cdn.door43.org/obs/jpg/360px/obs-en-${pad2(chapter)}-${pad2(paragraph)}.jpg`;
}

export default function ReferencePanel({ obs }) {
  const [chapter, paragraph] = obs;
  const [spanishChapters, setSpanishChapters] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (spanishChapters[chapter]) return;
    const fetchChapter = async () => {
      try {
        const res = await fetch(`${SPANISH_OBS_BASE}/${pad2(chapter)}.md`);
        if (!res.ok) {
          setError(`Failed to load Spanish chapter ${chapter}`);
          return;
        }
        const text = await res.text();
        const parts = text.split(/\n\r?\n\r?/);
        const paragraphs = parts.filter((_, i) => i % 2 === 0);
        setSpanishChapters((prev) => ({ ...prev, [chapter]: paragraphs }));
      } catch {
        setError("Could not reach reference content");
      }
    };
    fetchChapter();
  }, [chapter]);

  const spanishParagraphs = spanishChapters[chapter] || [];
  const spanishText = spanishParagraphs[paragraph] || "";
  const showImage = paragraph > 0;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1.5,
        backgroundColor: "grey.50",
      }}
    >
      {showImage && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <Box
            component="img"
            src={imageUrl(chapter, paragraph)}
            alt={`OBS ${chapter}:${paragraph}`}
            sx={{
              maxWidth: "100%",
              maxHeight: 200,
              borderRadius: 1,
              objectFit: "contain",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </Box>
      )}
      {spanishText ? (
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, display: "block" }}
          >
            Español (es-419)
          </Typography>
          <Box sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
            <Markdown className="markdown-content">{spanishText}</Markdown>
          </Box>
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
