import { useState, useRef, useEffect } from "react";
import { Box, IconButton, TextField, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import Markdown from "react-markdown";

export default function InlineEditor({ value, onChange, readOnly, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const fieldRef = useRef(null);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  useEffect(() => {
    if (editing && fieldRef.current) {
      fieldRef.current.focus();
    }
  }, [editing]);

  const handleStartEdit = () => {
    if (readOnly) return;
    setDraft(value);
    setEditing(true);
  };

  const handleConfirm = () => {
    if (onChange && draft !== value) {
      onChange({ target: { value: draft } });
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Box sx={{ position: "relative" }}>
        <TextField
          inputRef={fieldRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline
          minRows={3}
          maxRows={12}
          fullWidth
          size="small"
          variant="outlined"
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
    );
  }

  const hasContent = value && value.trim();

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 1,
        border: "1px solid",
        borderColor: readOnly ? "transparent" : "divider",
        p: 1.5,
        minHeight: 48,
        cursor: readOnly ? "default" : "pointer",
        transition: "border-color 0.2s, background-color 0.2s",
        "&:hover": readOnly
          ? {}
          : {
              borderColor: "primary.light",
              backgroundColor: "action.hover",
            },
      }}
      onClick={handleStartEdit}
    >
      {hasContent ? (
        <Box sx={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
          <Markdown>{value}</Markdown>
        </Box>
      ) : (
        <Box sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.9rem" }}>
          {placeholder || "Tap to add translation..."}
        </Box>
      )}
      {!readOnly && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            opacity: 0.4,
            transition: "opacity 0.2s",
            "*:hover > &": { opacity: 1 },
          }}
        >
          <EditIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </Box>
      )}
    </Box>
  );
}
