import { useState, useEffect, useContext } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getJson } from "pithekos-lib";
import { debugContext } from "pankosmia-rcl";
import AuthContext from "../context/AuthContext";

export const DEMO_PROJECT = {
  path: "__demo__/en_obs",
  name: "OBS (Demo)",
  abbreviation: "en_obs",
  language_code: "en",
  local_path: "__demo__/en_obs",
  isDemo: true,
};

export default function ProjectList({ selectedProject, onSelectProject, onCreateNew }) {
  const { debugRef } = useContext(debugContext);
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);

  const loadProjects = async () => {
    const response = await getJson("/burrito/metadata/summaries", debugRef.current);
    if (response.ok) {
      const filtered = Object.entries(response.json)
        .filter(([, meta]) => meta.flavor === "textStories")
        .map(([path, meta]) => ({
          path,
          name: meta.name?.trim() || meta.abbreviation,
          abbreviation: meta.abbreviation,
          language_code: meta.language_code,
          local_path: path,
        }));
      setProjects(filtered);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          OBS Projects
        </Typography>
        {user && (
          <Tooltip title="Create new OBS project">
            <IconButton size="small" onClick={onCreateNew} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {projects.map((project) => (
          <ListItemButton
            key={project.path}
            selected={selectedProject?.path === project.path}
            onClick={() => onSelectProject(project)}
            sx={{ borderBottom: "1px solid", borderColor: "divider" }}
          >
            <ListItemText
              primary={project.name}
              secondary={
                <span>
                  {project.abbreviation}
                  {" · "}
                  {project.language_code}
                </span>
              }
            />
          </ListItemButton>
        ))}
        {projects.length === 0 && !user && (
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">Sign in to see your projects</Typography>
          </Box>
        )}
        <Divider />
        <ListItemButton
          selected={selectedProject?.path === DEMO_PROJECT.path}
          onClick={() => onSelectProject(DEMO_PROJECT)}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <VisibilityIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />
          <ListItemText
            primary={DEMO_PROJECT.name}
            secondary="Read-only preview"
          />
        </ListItemButton>
      </List>
    </Box>
  );
}
