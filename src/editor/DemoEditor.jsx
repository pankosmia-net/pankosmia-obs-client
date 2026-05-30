import { useState, useContext, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import OBSContext from "../context/OBSContext";
import OBSNavigator from "./OBSNavigator";
import MarkdownField from "./MarkdownField";
import ReferencePanel from "./ReferencePanel";
import TranslationHelps from "./TranslationHelps";
import useTranslationHelps from "./useTranslationHelps";
import enConfig from "../../config/resources/en.json";
import esConfig from "../../config/resources/es-419.json";

import "./OBSMuncher.css";

const GITEA_HOST = "https://git.door43.org";

const enObs = enConfig.resources.find((r) => r.flavor === "textStories");
const esObs = esConfig.resources.find((r) => r.flavor === "textStories");

function giteaContentUrl(resource) {
  return `${GITEA_HOST}/${resource.org}/${resource.repo}/raw/branch/master/${resource.contentPath}`;
}

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function DemoEditor() {
  const { obs } = useContext(OBSContext);
  const [chapters, setChapters] = useState({});
  const helps = useTranslationHelps();

  useEffect(() => {
    if (chapters[obs[0]]) return;
    const fetchChapter = async () => {
      try {
        const base = giteaContentUrl(enObs);
        const res = await fetch(`${base}/${pad2(obs[0])}.md`);
        if (!res.ok) return;
        const text = await res.text();
        const parts = text.split(/\n\r?\n\r?/);
        const paragraphs = parts.filter((_, i) => i % 2 === 0);
        setChapters((prev) => ({ ...prev, [obs[0]]: paragraphs }));
      } catch {
        // gitea unreachable
      }
    };
    fetchChapter();
  }, [obs[0]]);

  const currentChapter = chapters[obs[0]] || [];
  const chapterTitle = (currentChapter[0] || "").replace(/^#+\s*/, "").trim();
  const [chapter, paragraph] = obs;

  return (
    <Stack sx={{ p: 2 }}>
      <Box
        sx={{
          p: 1,
          mb: 1,
          backgroundColor: "info.light",
          borderRadius: 1,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="info.contrastText">
          Demo mode — read-only English OBS. Sign in to edit your own projects.
        </Typography>
      </Box>
      <OBSNavigator max={currentChapter.length - 1} title={chapterTitle} />
      <Stack spacing={2} sx={{ mt: 1 }}>
        <ReferencePanel obs={obs} referenceConfig={esObs} />
        <Box>
          <Typography variant="caption" color="text.secondary">
            Try editing below — changes are not saved in demo mode
          </Typography>
          <MarkdownField
            currentRow={obs[1]}
            columnNames={currentChapter}
            onChangeNote={() => {}}
            value={currentChapter[obs[1]] || ""}
            mode="write"
          />
        </Box>
        {!helps.loading && (
          <TranslationHelps
            notes={helps.getNotesForPara(chapter, paragraph)}
            questions={helps.getQuestionsForPara(chapter, paragraph)}
            wordLinks={helps.getWordLinksForPara(chapter, paragraph)}
            fetchTwArticle={helps.fetchTwArticle}
          />
        )}
      </Stack>
    </Stack>
  );
}
