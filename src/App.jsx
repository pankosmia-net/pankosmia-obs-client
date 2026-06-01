import React, { useState, useContext, useEffect, useCallback } from "react";
import "./index.css";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { SpaContainer } from "pankosmia-rcl";
import { getAndSetJson, postEmptyJson } from "pithekos-lib";
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
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import AuthWidget from "./components/AuthWidget";
import ProjectList, { DEMO_PROJECT } from "./components/ProjectList";
import CreateOBS from "./components/CreateOBS";
import StoryView from "./editor/StoryView";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppInner />
    </BrowserRouter>
  );
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
            <Routes>
              <Route path="/:lang/OBS/:story" element={<OBSApp />} />
              <Route path="/:lang/OBS" element={<OBSApp />} />
              <Route path="/:lang" element={<OBSApp />} />
              <Route path="/" element={<OBSApp />} />
            </Routes>
          </AuthProvider>
        </SpaContainer>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function OBSApp() {
  const { lang, story } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isOnline, signIn } = useContext(AuthContext);

  const storyNum = story ? parseInt(story, 10) : 1;
  const scrollToSection = location.hash ? parseInt(location.hash.slice(1), 10) : null;

  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  const currentLang = lang || "en";
  const isDemo = !lang || currentLang === "en";

  const navigateToStory = useCallback(
    (num) => {
      const l = lang || "en";
      navigate(`/${l}/OBS/${pad2(num)}`);
    },
    [navigate, lang],
  );

  useEffect(() => {
    const loadProjects = async () => {
      const { getJson } = await import("pithekos-lib");
      const response = await getJson("/burrito/metadata/summaries");
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
    loadProjects();
  }, [refreshKey]);

  useEffect(() => {
    if (isDemo) {
      setSelectedProject(DEMO_PROJECT);
      return;
    }
    const match = projects.find((p) => p.language_code === currentLang);
    if (match) {
      setSelectedProject(match);
    } else {
      setSelectedProject({ ...DEMO_PROJECT, language_code: currentLang, isDemo: true });
    }
  }, [currentLang, projects, isDemo]);

  useEffect(() => {
    if (selectedProject && !selectedProject.isDemo) {
      postEmptyJson(`/app-state/current-project/${selectedProject.path}`);
      if (selectedProject.language_code) {
        postEmptyJson(`/user-languages/current-language/${selectedProject.language_code}`);
      }
    }
  }, [selectedProject?.path]);

  const handleSelectProject = (project) => {
    setDrawerOpen(false);
    if (project.isDemo) {
      navigate("/");
    } else {
      navigate(`/${project.language_code}/OBS/${pad2(storyNum)}`);
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
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {!isMobile && (
        <Box sx={{ borderRight: "1px solid", borderColor: "divider" }}>
          {sidebarContent}
        </Box>
      )}

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {sidebarContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
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

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {selectedProject && (
            <StoryView
              storyNum={storyNum}
              scrollToSection={scrollToSection}
              metadata={selectedProject}
              isDemo={selectedProject.isDemo}
              navigateToStory={navigateToStory}
              readOnly={!user || selectedProject.isDemo}
            />
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
    </Box>
  );
}
