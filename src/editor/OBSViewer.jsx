import { useState, useContext, useEffect } from "react";
import { Box, Stack } from "@mui/material";
import OBSContext from "../context/OBSContext";
import Markdown from "react-markdown";

import "./OBSMuncher.css";

import { getText } from "pithekos-lib";
import { debugContext as DebugContext } from "pankosmia-rcl";

export default function OBSViewer({ metadata }) {
  const { obs } = useContext(OBSContext);
  const { debugRef } = useContext(DebugContext);
  const [ingredient, setIngredient] = useState("");

  const getAllData = async () => {
    let fileName = obs[0] <= 9 ? `0${obs[0]}` : obs[0];
    const ingredientLink = `/burrito/ingredient/raw/${metadata.local_path}?ipath=content/${fileName}.md`;
    let response = await getText(ingredientLink, debugRef.current);
    if (response.ok) {
      let lines = response.text.split(/\n\r?\n\r?/);
      const index = obs[1] * 2 - 1 < 0 ? 0 : obs[1] * 2 - 1;
      const index2 = index === 0 ? undefined : index + 1;
      let content = lines[index];
      if (index2 && index2 < lines.length) {
        content += "\n\n" + lines[index2];
      }

      let imageName = `${obs[0] <= 9 ? `0${obs[0]}` : obs[0]}-${obs[1] <= 9 ? `0${obs[1]}` : obs[1]}`;
      const obsImageLink = `/burrito/ingredient/bytes/git.door43.org/uW/obs_images_360?ipath=360px/obs-en-${imageName}.jpg`;
      content = content.replace(
        /!\[OBS Image\]\([^)]+\)/g,
        `![OBS Image not found](${obsImageLink})`,
      );

      setIngredient(content);
    }
  };

  useEffect(() => {
    getAllData();
  }, [obs]);

  return (
    <Stack sx={{ p: 1 }}>
      <div>
        <Markdown className="markdown-content">{ingredient}</Markdown>
      </div>
    </Stack>
  );
}
