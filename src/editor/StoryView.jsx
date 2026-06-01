import { useState, useEffect, useRef, useCallback } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { IconButton, Typography } from "@mui/material";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import ReferencePanel from "./ReferencePanel";
import TranslationHelps from "./TranslationHelps";
import useTranslationHelps from "./useTranslationHelps";
import esConfig from "../../config/resources/es-419.json";

import { debugContext as DebugContext } from "pankosmia-rcl";
import { getText, postText } from "pithekos-lib";
import { useContext } from "react";
import md5 from "md5";

import "./OBSMuncher.css";

const GITEA_HOST = "https://git.door43.org";
const esObs = esConfig.resources.find((r) => r.flavor === "textStories");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function giteaContentUrl(resource) {
  return `${GITEA_HOST}/${resource.org}/${resource.repo}/raw/branch/master/${resource.contentPath}`;
}

export default function StoryView({
  storyNum,
  scrollToSection,
  metadata,
  isDemo,
  navigateToStory,
  readOnly,
}) {
  const { debugRef } = useContext(DebugContext);
  const helps = useTranslationHelps();
  const [paragraphs, setParagraphs] = useState([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [originalChecksums, setOriginalChecksums] = useState([]);
  const sectionRefs = useRef({});

  const loadChapter = useCallback(async () => {
    setParagraphs([]);
    setStoryTitle("");
    setOriginalChecksums([]);
    setActiveSection(null);

    if (isDemo) {
      const base = giteaContentUrl(esObs);
      try {
        const res = await fetch(`${base}/${pad2(storyNum)}.md`);
        if (!res.ok) return;
        const text = await res.text();
        const parts = text.split(/\n\r?\n\r?/);
        const content = parts.filter((_, i) => i % 2 === 0);
        setStoryTitle((content[0] || "").replace(/^#+\s*/, "").trim());
        setParagraphs(content.map(() => ""));
      } catch {
        // offline
      }
    } else {
      const fileName = pad2(storyNum);
      const url = `/burrito/ingredient/raw/${metadata.local_path}?ipath=content/${fileName}.md`;
      const response = await getText(url, debugRef.current);
      if (response.ok) {
        const content = response.text
          .split(/\n\r?\n\r?/)
          .filter((_, i) => i % 2 === 0);
        setStoryTitle((content[0] || "").replace(/^#+\s*/, "").trim());
        setParagraphs(content);
        setOriginalChecksums(content.map((c) => md5(c)));
      }
    }
  }, [storyNum, isDemo, metadata?.local_path]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    if (scrollToSection != null && sectionRefs.current[scrollToSection]) {
      sectionRefs.current[scrollToSection].scrollIntoView({ behavior: "smooth" });
    }
  }, [scrollToSection, paragraphs]);

  const handleChange = (paraIndex, event) => {
    setParagraphs((prev) => {
      const next = [...prev];
      next[paraIndex] = event.target.value.replaceAll(/\s/g, " ");
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    if (isDemo || readOnly || paragraphs.length === 0) return;
    const modified = paragraphs.some(
      (p, i) => originalChecksums[i] && md5(p) !== originalChecksums[i],
    );
    if (!modified) return;

    const fileName = pad2(storyNum);
    const rawUrl = `/burrito/ingredient/raw/${metadata.local_path}?ipath=content/${fileName}.md`;
    const rawResponse = await getText(rawUrl, debugRef);
    if (!rawResponse.ok) return;

    const lines = rawResponse.text.split(/\n\r?\n\r?/);
    const merged = lines.map((line, i) =>
      i % 2 === 0 ? paragraphs[i / 2] ?? line : line.replaceAll(/\n/g, " "),
    );
    const sep = navigator.userAgent.includes("Windows") ? "\r\n\r\n" : "\n\n";
    const payload = JSON.stringify({ payload: merged.join(sep) });

    const response = await postText(rawUrl, payload, debugRef, "application/json");
    if (response.ok) {
      setOriginalChecksums(paragraphs.map((c) => md5(c)));
    }
  }, [paragraphs, originalChecksums, storyNum, isDemo, readOnly, metadata?.local_path]);

  useEffect(() => {
    return () => {
      handleSave();
    };
  }, [storyNum]);

  const title = storyTitle;

  return (
    <Stack sx={{ p: 2, pb: 8 }}>
      {/* Story navigator */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          gap: 1,
        }}
      >
        <IconButton
          disabled={storyNum <= 1}
          onClick={() => { handleSave(); navigateToStory(storyNum - 1); }}
        >
          <KeyboardDoubleArrowLeftIcon />
        </IconButton>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            px: 2,
            py: 0.5,
            minWidth: 180,
            textAlign: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {storyNum}. {title || "..."}
          </Typography>
        </Box>
        <IconButton
          disabled={storyNum >= 50}
          onClick={() => { handleSave(); navigateToStory(storyNum + 1); }}
        >
          <KeyboardDoubleArrowRightIcon />
        </IconButton>
      </Box>

      {isDemo && (
        <Box
          sx={{
            p: 1,
            mb: 2,
            backgroundColor: "info.light",
            borderRadius: 1,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="info.contrastText">
            Demo mode — tap the pen on any paragraph to try editing. Changes are not saved.
          </Typography>
        </Box>
      )}

      {/* All paragraphs */}
      <Stack spacing={3}>
        {paragraphs.slice(1).map((para, idx) => {
          const paraIndex = idx + 1;
          const isEditing = activeSection === paraIndex;
          const wordLinks = helps.getWordLinksForPara(storyNum, paraIndex);
          const notes = helps.getNotesForPara(storyNum, paraIndex);
          const questions = helps.getQuestionsForPara(storyNum, paraIndex);
          const canEdit = !readOnly || isDemo;

          return (
            <Box
              key={`${storyNum}-${paraIndex}`}
              id={`section-${pad2(paraIndex)}`}
              ref={(el) => { sectionRefs.current[paraIndex] = el; }}
              sx={{
                borderLeft: isEditing ? "3px solid" : "3px solid transparent",
                borderColor: isEditing ? "primary.main" : "transparent",
                pl: 1.5,
                transition: "border-color 0.2s",
              }}
            >
              <ReferencePanel
                obs={[storyNum, paraIndex]}
                referenceConfig={esObs}
                wordLinks={wordLinks}
                fetchTwTitle={helps.fetchTwTitle}
                fetchTwArticle={helps.fetchTwArticle}
                canEdit={canEdit}
                isEditing={isEditing}
                onStartEdit={() => setActiveSection(paraIndex)}
                onStopEdit={() => setActiveSection(null)}
                editValue={para}
                onEditChange={(e) => handleChange(paraIndex, e)}
              />

              {isEditing && !helps.loading && (notes.length > 0 || questions.length > 0) && (
                <Box sx={{ mt: 1 }}>
                  <TranslationHelps notes={notes} questions={questions} />
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
