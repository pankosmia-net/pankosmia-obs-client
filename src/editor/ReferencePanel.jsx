import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import Markdown from "react-markdown";
import esConfig from "../../config/resources/es-419.json";
import "./OBSMuncher.css";

const GITEA_HOST = "https://git.door43.org";

const defaultRefConfig = esConfig.resources.find((r) => r.flavor === "textStories");

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function imageUrl(chapter, paragraph) {
  return `https://cdn.door43.org/obs/jpg/360px/obs-en-${pad2(chapter)}-${pad2(paragraph)}.jpg`;
}

function giteaContentUrl(resource) {
  return `${GITEA_HOST}/${resource.org}/${resource.repo}/raw/branch/master/${resource.contentPath}`;
}

export default function ReferencePanel({ obs, referenceConfig }) {
  const config = referenceConfig || defaultRefConfig;
  const [chapter, paragraph] = obs;
  const [refChapters, setRefChapters] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!config) return;
    if (refChapters[chapter]) return;
    const fetchChapter = async () => {
      try {
        const base = giteaContentUrl(config);
        const res = await fetch(`${base}/${pad2(chapter)}.md`);
        if (!res.ok) {
          setError(`Failed to load chapter ${chapter}`);
          return;
        }
        const text = await res.text();
        const parts = text.split(/\n\r?\n\r?/);
        const paragraphs = parts.filter((_, i) => i % 2 === 0);
        setRefChapters((prev) => ({ ...prev, [chapter]: paragraphs }));
      } catch {
        setError("Could not reach reference content");
      }
    };
    fetchChapter();
  }, [chapter, config]);

  const refParagraphs = refChapters[chapter] || [];
  const refText = refParagraphs[paragraph] || "";
  const imageParaIndex = paragraph > 0 ? paragraph : 1;
  const showImage = chapter > 0;

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
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <Box
            component="img"
            src={imageUrl(chapter, imageParaIndex)}
            alt={`OBS ${chapter}:${imageParaIndex}`}
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
      {refText ? (
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, display: "block" }}
          >
            {config.label}
          </Typography>
          <Box sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
            <Markdown className="markdown-content">{refText}</Markdown>
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
