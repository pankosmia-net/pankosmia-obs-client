import React, { useState, useEffect } from "react";
import "./index.css";
import { SpaContainer } from "pankosmia-rcl";
import { getAndSetJson } from "pithekos-lib";
import { createTheme, ThemeProvider } from "@mui/material";
import { SnackbarProvider, MaterialDesignContent } from "notistack";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { postEmptyJson } from "pithekos-lib";
import { AuthProvider } from "./context/AuthContext";
import OBSContext from "./context/OBSContext";
import AuthWidget from "./components/AuthWidget";
import ProjectList from "./components/ProjectList";
import CreateOBS from "./components/CreateOBS";
import OBSEditor from "./editor/OBSEditor";

export default function App() {
  return <AppInner />;
}

function AppInner() {
  const [themeSpec, setThemeSpec] = useState({
    palette: {
      primary: { main: "#666" },
      secondary: { main: "#888" },
    },
  });

  useEffect(() => {
    if (themeSpec.palette?.primary?.main === "#666") {
      getAndSetJson({
        url: "/app-resources/themes/default.json",
        setter: setThemeSpec,
      });
    }
  }, []);

  const theme = createTheme(themeSpec);

  const CustomSnackbarContent = styled(MaterialDesignContent)(() => ({
    "&.notistack-MuiContent-error": {
      backgroundColor: "#FDEDED",
      color: "#D32F2F",
    },
    "&.notistack-MuiContent-info": {
      backgroundColor: "#E5F6FD",
      color: "#0288D1",
    },
    "&.notistack-MuiContent-warning": {
      backgroundColor: "#FFF4E5",
      color: "#EF6C00",
    },
    "&.notistack-MuiContent-success": {
      backgroundColor: "#EDF7ED",
      color: "#2E7D32",
    },
  }));

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        Components={{
          error: CustomSnackbarContent,
          info: CustomSnackbarContent,
          warning: CustomSnackbarContent,
          success: CustomSnackbarContent,
        }}
        maxSnack={6}
      >
        <SpaContainer>
          <AuthProvider>
            <OBSApp />
          </AuthProvider>
        </SpaContainer>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function OBSApp() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [obs, setObs] = useState([1, 0]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setObs([1, 0]);
    await postEmptyJson(`/app-state/current-project/${project.path}`);
    if (project.language_code) {
      const res = await postEmptyJson(`/user-languages/current-language/${project.language_code}`);
      if (!res.ok && res.status === 403) {
        await postEmptyJson(`/user-languages/claim-language/${project.language_code}`);
        await postEmptyJson(`/user-languages/current-language/${project.language_code}`);
      }
    }
  };

  const handleCreated = () => {
    setCreateDialogOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <OBSContext.Provider value={{ obs, setObs }}>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Left panel - project list */}
        <Box
          sx={{
            width: 280,
            minWidth: 280,
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <AuthWidget />
          </Box>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <ProjectList
              key={refreshKey}
              selectedProject={selectedProject}
              onSelectProject={handleSelectProject}
              onCreateNew={() => setCreateDialogOpen(true)}
            />
          </Box>
        </Box>

        {/* Main panel - editor */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {selectedProject ? (
            <OBSEditor metadata={selectedProject} />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
              }}
            >
              <Typography variant="h6">
                Select an OBS project to begin editing
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {createDialogOpen && (
        <CreateOBS
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </OBSContext.Provider>
  );
}
