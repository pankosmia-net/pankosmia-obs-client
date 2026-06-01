import { useState, useEffect } from "react";
import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import esConfig from "../../config/resources/es-419.json";
import AnnotatedText from "./AnnotatedText";
import "./OBSMuncher.css";

const GITEA_HOST = "https://git.door43.org";

const defaultRefConfig = esConfig.resources.find(
  (r) => r.flavor === "textStories",
);

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function imageUrl(chapter, paragraph) {
  return `https://cdn.door43.org/obs/jpg/360px/obs-en-${pad2(chapter)}-${pad2(paragraph)}.jpg`;
}

function giteaContentUrl(resource) {
  return `${GITEA_HOST}/${resource.org}/${resource.repo}/raw/branch/master/${resource.contentPath}`;
}

export default function ReferencePanel({
  obs,
  referenceConfig,
  wordLinks,
  fetchTwTitle,
  fetchTwArticle,
  canEdit,
  isEditing,
  onStartEdit,
  onStopEdit,
  editValue,
  onEditChange,
}) {
  const config = referenceConfig || defaultRefConfig;
  const [chapter, paragraph] = obs;
  const [refChapters, setRefChapters] = useState({});
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(editValue || "");

  useEffect(() => {
    setDraft(editValue || "");
  }, [editValue]);

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
  const showImage = chapter > 0;

  const handleConfirm = () => {
    if (onEditChange && draft !== editValue) {
      onEditChange({ target: { value: draft } });
    }
    onStopEdit();
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: isEditing ? "primary.light" : "divider",
        borderRadius: 1,
        p: 1.5,
        backgroundColor: "grey.50",
        position: "relative",
        transition: "border-color 0.2s",
      }}
    >
      {showImage && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
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

      {refText ? (
        <Box>
          <AnnotatedText
            text={refText}
            wordLinks={wordLinks || []}
            fetchTwTitle={fetchTwTitle}
            fetchTwArticle={fetchTwArticle}
          />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      {/* Edit area */}
      {isEditing && (
        <Box sx={{ mt: 1.5, position: "relative" }}>
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onStopEdit();
            }}
            multiline
            minRows={3}
            maxRows={12}
            fullWidth
            size="small"
            variant="outlined"
            autoFocus
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "background.paper",
              },
            }}
          />
          <Tooltip title="Done editing">
            <IconButton
              size="small"
              onClick={handleConfirm}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { backgroundColor: "primary.dark" },
                width: 28,
                height: 28,
              }}
            >
              <CheckIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Pen icon */}
      {canEdit && !isEditing && (
        <Tooltip title="Edit translation">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              opacity: 0.3,
              transition: "opacity 0.2s",
              "&:hover": { opacity: 1 },
              width: 28,
              height: 28,
            }}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
