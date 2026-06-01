import { useState, useRef, useEffect } from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CloseIcon from "@mui/icons-material/Close";
import Markdown from "react-markdown";

export default function TranslationHelps({ notes, questions }) {
  const [open, setOpen] = useState(false);
  const helpsRef = useRef(null);

  const hasNotes = notes.length > 0;
  const hasQuestions = questions.length > 0;
  const hasContent = hasNotes || hasQuestions;
  const count = notes.length + questions.length;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (helpsRef.current && !helpsRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [notes, questions]);

  if (!open) {
    return (
      <Box
        onClick={hasContent ? () => setOpen(true) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          cursor: hasContent ? "pointer" : "default",
          backgroundColor: "grey.50",
          opacity: hasContent ? 1 : 0.5,
          "&:hover": hasContent ? { backgroundColor: "grey.100" } : {},
        }}
      >
        <MenuBookIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          Translation Helps {hasContent ? `(${count})` : ""}
        </Typography>
      </Box>
    );
  }

  return (
    <Box ref={helpsRef}>
      {/* Fixed close chip — always visible at top-right of viewport */}
      <Chip
        label="Close Helps"
        icon={<CloseIcon sx={{ fontSize: 16 }} />}
        size="small"
        onClick={() => setOpen(false)}
        sx={{
          position: "fixed",
          top: 8,
          right: 8,
          zIndex: 1200,
          backgroundColor: "grey.800",
          color: "white",
          "&:hover": { backgroundColor: "grey.900" },
          "& .MuiChip-icon": { color: "white" },
          boxShadow: 2,
        }}
      />

      <Box
        sx={{
          border: "1px solid",
          borderColor: "primary.light",
          borderRadius: 1,
          backgroundColor: "grey.50",
          p: 1.5,
        }}
      >
        {/* Translation Notes */}
        {hasNotes && (
          <Box sx={{ mb: hasQuestions ? 2 : 0 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{
                mb: 1,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Notes ({notes.length})
            </Typography>
            {notes.map((note, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                {note.Quote && (
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="primary.main"
                  >
                    {note.Quote}
                  </Typography>
                )}
                <Box sx={{ typography: "body2" }}>
                  <Markdown>{note.Note}</Markdown>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Translation Questions */}
        {hasQuestions && (
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{
                mb: 1,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Questions ({questions.length})
            </Typography>
            {questions.map((q, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {q.Question}
                </Typography>
                {q.Response && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {q.Response}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {!hasContent && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 1 }}
          >
            No translation helps for this section
          </Typography>
        )}
      </Box>
    </Box>
  );
}
