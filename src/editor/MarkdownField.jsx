import { useState } from "react";
import Markdown from "react-markdown";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import CreateIcon from "@mui/icons-material/Create";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  TextField,
} from "@mui/material";

export default function MarkdownField({ columnNames, onChangeNote, value, mode }) {
  const [displayMode, setDisplayMode] = useState("write");

  return (
    <Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={displayMode}
        onChange={(event, newDisplayMode) => {
          if (newDisplayMode !== null) {
            setDisplayMode(newDisplayMode);
          }
        }}
      >
        <ToggleButton value="write">
          <CreateIcon />
        </ToggleButton>
        <ToggleButton value="preview">
          <RemoveRedEyeIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      {displayMode === "write" ? (
        <FormControl fullWidth margin="normal">
          <TextField
            value={value}
            onChange={onChangeNote}
            minRows={5}
            maxRows={5}
            fullWidth
            multiline
            size="small"
            variant="outlined"
          />
        </FormControl>
      ) : (
        <Box sx={{ border: "1px solid", marginTop: 2 }}>
          <Markdown>{value}</Markdown>
        </Box>
      )}
    </Box>
  );
}
