import React, { useState, useContext, useEffect } from "react";
import "./index.css";
import { SpaContainer } from "pankosmia-rcl";
import { getAndSetJson } from "pithekos-lib";
import { createTheme, ThemeProvider } from "@mui/material";
import { SnackbarProvider, MaterialDesignContent } from "notistack";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Avatar from "@mui/material/Avatar";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import useMediaQuery from "@mui/material/useMediaQuery";
import { postEmptyJson } from "pithekos-lib";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import OBSContext from "./context/OBSContext";
import AuthWidget from "./components/AuthWidget";
import ProjectList from "./components/ProjectList";
import CreateOBS from "./components/CreateOBS";
import OBSEditor from "./editor/OBSEditor";
import DemoEditor from "./editor/DemoEditor";
import { DEMO_PROJECT } from "./components/ProjectList";

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
  const { user, loading, isOnline, signIn } = useContext(AuthContext);
  const [selectedProject, setSelectedProject] = useState(DEMO_PROJECT);
  const [obs, setObs] = useState([1, 0]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setObs([1, 0]);
    setDrawerOpen(false);
    if (!project.isDemo) {
      await postEmptyJson(`/app-state/current-project/${project.path}`);
      if (project.language_code) {
        await postEmptyJson(`/user-languages/current-language/${project.language_code}`);
      }
    }
  };

  const handleCreated = () => {
    setCreateDialogOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const sidebarContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
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
  );

  return (
    <OBSContext.Provider value={{ obs, setObs }}>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Desktop: permanent sidebar */}
        {!isMobile && (
          <Box
            sx={{
              borderRight: "1px solid",
              borderColor: "divider",
            }}
          >
            {sidebarContent}
          </Box>
        )}

        {/* Mobile: drawer */}
        {isMobile && (
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            {sidebarContent}
          </Drawer>
        )}

        {/* Main area */}
        <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {/* Mobile top bar */}
          {isMobile && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                p: 0.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                gap: 1,
              }}
            >
              {!loading && isOnline && !user ? (
                <IconButton onClick={signIn} color="primary" size="small">
                  <LoginIcon />
                </IconButton>
              ) : user ? (
                <IconButton onClick={() => setDrawerOpen(true)} size="small">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.name || user.login}
                    sx={{ width: 28, height: 28 }}
                  />
                </IconButton>
              ) : (
                <IconButton onClick={() => setDrawerOpen(true)} size="small">
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                {selectedProject ? selectedProject.name : "OBS Editor"}
              </Typography>
              {!user && isOnline && !loading && (
                <Typography
                  variant="caption"
                  sx={{ color: "primary.main", cursor: "pointer", mr: 1 }}
                  onClick={signIn}
                >
                  Sign in
                </Typography>
              )}
            </Box>
          )}

          {/* Editor content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {selectedProject?.isDemo ? (
              <DemoEditor />
            ) : selectedProject ? (
              <OBSEditor metadata={selectedProject} />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "text.secondary",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h6">
                  {isMobile
                    ? "Tap the menu to select a project"
                    : "Select an OBS project to begin editing"}
                </Typography>
              </Box>
            )}
          </Box>
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
