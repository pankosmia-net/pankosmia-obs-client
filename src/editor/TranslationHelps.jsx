import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Popover,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Markdown from "react-markdown";

export default function TranslationHelps({
  notes,
  questions,
  wordLinks,
  fetchTwArticle,
}) {
  const [tnOpen, setTnOpen] = useState(() => sessionStorage.getItem("tn_open") === "true");
  const [tqOpen, setTqOpen] = useState(() => sessionStorage.getItem("tq_open") === "true");
  const [twPopover, setTwPopover] = useState(null);
  const [twContent, setTwContent] = useState("");
  const [twLoading, setTwLoading] = useState(false);

  const toggleTn = () => {
    const next = !tnOpen;
    setTnOpen(next);
    sessionStorage.setItem("tn_open", String(next));
  };

  const toggleTq = () => {
    const next = !tqOpen;
    setTqOpen(next);
    sessionStorage.setItem("tq_open", String(next));
  };

  const handleWordClick = async (event, wordLink) => {
    setTwPopover(event.currentTarget);
    setTwLoading(true);
    setTwContent("");
    const article = await fetchTwArticle(wordLink.twPath);
    setTwContent(article || "Article not found");
    setTwLoading(false);
  };

  const uniqueWords = wordLinks.filter(
    (w, i, arr) => arr.findIndex((x) => x.twPath === w.twPath) === i,
  );

  const hasNotes = notes.length > 0;
  const hasQuestions = questions.length > 0;
  const hasWords = uniqueWords.length > 0;

  if (!hasNotes && !hasQuestions && !hasWords) return null;

  return (
    <Box sx={{ mt: 1 }}>
      {hasWords && (
        <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {uniqueWords.map((wl) => (
            <Chip
              key={wl.twPath}
              label={wl.word}
              size="small"
              variant={wl.tag === "keyterm" ? "filled" : "outlined"}
              color="primary"
              onClick={(e) => handleWordClick(e, wl)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
      )}

      <Popover
        open={Boolean(twPopover)}
        anchorEl={twPopover}
        onClose={() => setTwPopover(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { maxWidth: 400, maxHeight: 350, overflow: "auto", p: 2 },
          },
        }}
      >
        {twLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        ) : (
          <Markdown>{twContent}</Markdown>
        )}
      </Popover>

      {hasNotes && (
        <Accordion expanded={tnOpen} onChange={toggleTn} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={600}>
              Translation Notes ({notes.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            {notes.map((note, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                {note.Quote && (
                  <Typography variant="caption" fontWeight={600} color="primary.main">
                    {note.Quote}
                  </Typography>
                )}
                <Box sx={{ typography: "body2" }}>
                  <Markdown>{note.Note}</Markdown>
                </Box>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {hasQuestions && (
        <Accordion expanded={tqOpen} onChange={toggleTq} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", mt: hasNotes ? -0.125 : 0, "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={600}>
              Translation Questions ({questions.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            {questions.map((q, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {q.Question}
                </Typography>
                {q.Response && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {q.Response}
                  </Typography>
                )}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
