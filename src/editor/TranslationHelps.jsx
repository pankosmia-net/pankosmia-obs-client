import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  IconButton,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CloseIcon from "@mui/icons-material/Close";
import Markdown from "react-markdown";

function HelpsContent({ notes, questions }) {
  const [tnOpen, setTnOpen] = useState(
    () => sessionStorage.getItem("tn_open") === "true",
  );
  const [tqOpen, setTqOpen] = useState(
    () => sessionStorage.getItem("tq_open") === "true",
  );

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

  const hasNotes = notes.length > 0;
  const hasQuestions = questions.length > 0;

  if (!hasNotes && !hasQuestions) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
        No translation helps for this section
      </Typography>
    );
  }

  return (
    <Box>
      {hasNotes && (
        <Accordion
          expanded={tnOpen}
          onChange={toggleTn}
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={600}>
              Translation Notes ({notes.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
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
          </AccordionDetails>
        </Accordion>
      )}

      {hasQuestions && (
        <Accordion
          expanded={tqOpen}
          onChange={toggleTq}
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            mt: hasNotes ? -0.125 : 0,
            "&:before": { display: "none" },
          }}
        >
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
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

export default function TranslationHelps({ notes, questions }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasContent = notes.length > 0 || questions.length > 0;
  const count = notes.length + questions.length;

  if (isMobile) {
    return (
      <>
        <Box
          onClick={() => setSheetOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            p: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            cursor: "pointer",
            backgroundColor: "grey.50",
            "&:hover": { backgroundColor: "grey.100" },
          }}
        >
          <MenuBookIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Translation Helps {hasContent ? `(${count})` : ""}
          </Typography>
        </Box>

        <SwipeableDrawer
          anchor="bottom"
          open={sheetOpen}
          onOpen={() => setSheetOpen(true)}
          onClose={() => setSheetOpen(false)}
          swipeAreaWidth={0}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              maxHeight: "70vh",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Translation Helps
            </Typography>
            <IconButton size="small" onClick={() => setSheetOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ overflow: "auto", p: 1 }}>
            <HelpsContent notes={notes} questions={questions} />
          </Box>
        </SwipeableDrawer>
      </>
    );
  }

  return <HelpsContent notes={notes} questions={questions} />;
}
