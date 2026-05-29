import { IconButton } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

export default function SaveButton({ obs, isModified, handleSave }) {
  return (
    <IconButton
      onClick={handleSave}
      disabled={!isModified(obs[0])}
      sx={{ color: "primary.main", transition: "color 0.3s ease" }}
    >
      <SaveIcon />
    </IconButton>
  );
}
