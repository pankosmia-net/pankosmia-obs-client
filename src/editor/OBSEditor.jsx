import { useState, useContext, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import OBSContext from "../context/OBSContext";
import AuthContext from "../context/AuthContext";
import OBSNavigator from "./OBSNavigator";
import SaveButton from "./SaveButton";
import AudioRecorder from "./AudioRecorder";
import MarkdownField from "./MarkdownField";
import { Switch, Typography } from "@mui/material";
import ReferencePanel from "./ReferencePanel";

import "./OBSMuncher.css";

import { debugContext as DebugContext } from "pankosmia-rcl";
import { getText, postText } from "pithekos-lib";
import md5 from "md5";

export default function OBSEditor({ metadata }) {
  const { obs, setObs } = useContext(OBSContext);
  const { debugRef } = useContext(DebugContext);
  const { user } = useContext(AuthContext);
  const [ingredient, setIngredient] = useState([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [checksums, setChecksums] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [chapterChecksums, setChapterChecksums] = useState([]);

  const initIngredient = async () => {
    if (obs[0] < 0) obs[0] = 0;
    if (obs[0] > 50) obs[0] = 50;
    if (ingredient[obs[0]]) return;

    let fileName = obs[0] <= 9 ? `0${obs[0]}` : obs[0];
    const ingredientLink = `/burrito/ingredient/raw/${metadata.local_path}?ipath=content/${fileName}.md`;
    let response = await getText(ingredientLink, debugRef.current);
    if (response.ok) {
      const chapterContent = response.text
        .split(/\n\r?\n\r?/)
        .filter((_, index) => index % 2 === 0);
      setIngredient((prev) => {
        const newIngredient = [...prev];
        newIngredient[obs[0]] = chapterContent;
        return newIngredient;
      });
      for (let i = 0; i < chapterContent.length; i++) {
        initChecksums(obs[0], i, chapterContent[i]);
      }
      const newChapterChecksums = [...chapterChecksums];
      newChapterChecksums[obs[0]] = calculateChapterChecksum(chapterContent);
      setChapterChecksums(newChapterChecksums);
    }
  };

  const handleChange = (event) => {
    setIngredient((prev) => {
      const newIngredient = [...prev];
      if (!newIngredient[obs[0]]) {
        newIngredient[obs[0]] = [];
      }
      newIngredient[obs[0]] = [...newIngredient[obs[0]]];
      newIngredient[obs[0]][obs[1]] = event.target.value.replaceAll(/\s/g, " ");
      return newIngredient;
    });
  };

  const calculateChapterChecksum = (chapter) => {
    if (!chapter) return 0;
    let checksum = 0;
    for (let i = 0; i < chapter.length; i++) {
      checksum += md5(chapter[i]);
    }
    return checksum;
  };

  const initChecksums = (chapterIndex, paragraphIndex, content) => {
    const key = `${chapterIndex}-${paragraphIndex}`;
    const checksum = md5(content);
    setChecksums((prev) => ({ ...prev, [key]: checksum }));
  };

  const isModified = () => {
    const chapterIndex = obs[0];
    const originalChecksum = chapterChecksums[chapterIndex];
    if (!originalChecksum) return false;
    const currentChecksum = calculateChapterChecksum(ingredient[chapterIndex]);
    return originalChecksum !== currentChecksum;
  };

  const updateChecksums = (chapterIndex) => {
    const chapter = ingredient[chapterIndex];
    if (!chapter) return;
    setChecksums((prev) => {
      const newChecksums = { ...prev };
      chapter.forEach((content, paragraphIndex) => {
        const key = `${chapterIndex}-${paragraphIndex}`;
        newChecksums[key] = md5(content);
      });
      return newChecksums;
    });
    setChapterChecksums((prev) => {
      const newChapterChecksums = [...prev];
      newChapterChecksums[chapterIndex] = calculateChapterChecksum(chapter);
      return newChapterChecksums;
    });
  };

  const isChapterModified = (chapterIndex) => {
    const originalChecksum = chapterChecksums[chapterIndex];
    if (!originalChecksum) return false;
    return originalChecksum !== calculateChapterChecksum(ingredient[chapterIndex]);
  };

  const handleSaveOBS = async () => {
    if (!ingredient || ingredient.length === 0) return;
    for (let i = 0; i < ingredient.length; i++) {
      if (!ingredient[i] || ingredient[i].length === 0) continue;
      if (!isChapterModified(i)) continue;
      await uploadOBSIngredient(ingredient[i], i);
    }
  };

  const uploadOBSIngredient = async (ingredientItem, i) => {
    let fileName = i <= 9 ? `0${i}` : i;
    const obsString = await getStringifyIngredient(ingredientItem, fileName);
    const payload = JSON.stringify({ payload: obsString });
    const response = await postText(
      `/burrito/ingredient/raw/${metadata.local_path}?ipath=content/${fileName}.md`,
      payload,
      debugRef,
      "application/json",
    );
    if (response.ok) {
      updateChecksums(i);
    } else {
      console.error(`Failed to save file ${fileName}`);
    }
  };

  const getOs = () => {
    const os = ["Windows", "Linux", "Mac"];
    return os.find((v) => navigator.userAgent.indexOf(v) >= 0);
  };

  const getStringifyIngredient = async (ingredientItem, fileName) => {
    const response = await getText(
      `/burrito/ingredient/raw/${metadata.local_path}?ipath=content/${fileName}.md`,
      debugRef,
    );
    if (response.ok) {
      const returnedText = response.text
        .split(/\n\r?\n\r?/)
        .map((line, index) => {
          if (index % 2 === 1) {
            return line.replaceAll(/\n/g, " ");
          } else {
            return ingredientItem[index / 2];
          }
        });
      if (getOs() === "Windows") {
        return returnedText.join("\r\n\r\n");
      } else {
        return returnedText.join("\n\n");
      }
    }
  };

  const currentChapter = ingredient[obs[0]] || [];

  useEffect(() => {
    handleSaveOBS();
    initIngredient();
  }, [obs[0]]);

  const chapterTitle = (currentChapter[0] || "").replace(/^#+\s*/, "").trim();
  const readOnly = !user;

  return (
    <Stack sx={{ p: 2 }}>
      {readOnly && (
        <Box
          sx={{
            p: 1,
            mb: 1,
            backgroundColor: "warning.light",
            borderRadius: 1,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="warning.contrastText">
            Sign in to edit
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          mb: 1,
        }}
      >
        {!readOnly && (
          <Box>
            <SaveButton
              obs={obs}
              isModified={isModified}
              handleSave={handleSaveOBS}
            />
          </Box>
        )}
        <Box sx={{ ml: 2 }}>
          Audio
          <Switch
            checked={audioEnabled}
            onChange={() => setAudioEnabled(!audioEnabled)}
          />
        </Box>
      </Box>
      <OBSNavigator max={currentChapter.length - 1} title={chapterTitle} />
      <Stack spacing={2} sx={{ mt: 1 }}>
        <ReferencePanel obs={obs} />
        <MarkdownField
          currentRow={obs[1]}
          columnNames={currentChapter}
          onChangeNote={readOnly ? undefined : handleChange}
          value={currentChapter[obs[1]] || ""}
          mode={readOnly ? "preview" : "write"}
        />
        {audioEnabled && (
          <AudioRecorder
            audioUrl={audioUrl}
            setAudioUrl={setAudioUrl}
            metadata={metadata}
            obs={obs}
          />
        )}
      </Stack>
    </Stack>
  );
}
