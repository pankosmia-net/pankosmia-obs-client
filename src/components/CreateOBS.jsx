import { useState, useContext, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  TextField,
  Tooltip,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { postJson, getAndSetJson } from "pithekos-lib";
import { debugContext } from "pankosmia-rcl";

export default function CreateOBS({ open, onClose, onCreated }) {
  const { debugRef } = useContext(debugContext);
  const [contentName, setContentName] = useState("");
  const [contentAbbr, setContentAbbr] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [localRepos, setLocalRepos] = useState([]);
  const [repoExists, setRepoExists] = useState(false);
  const [errorAbbreviation, setErrorAbbreviation] = useState(false);
  const regexAbbreviation = /^[A-Za-z0-9][A-Za-z0-9_]{0,6}[A-Za-z0-9]$/;
  const regexLanguage = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;

  useEffect(() => {
    if (open) {
      getAndSetJson({
        url: "/git/list-local-repos",
        setter: setLocalRepos,
      });
      setContentName("");
      setContentAbbr("");
      setLanguageCode("");
    }
  }, [open]);

  const handleCreate = async () => {
    const payload = {
      content_name: contentName,
      content_abbr: contentAbbr,
      content_language_code: languageCode,
    };
    const response = await postJson(
      "/git/new-obs-resource",
      JSON.stringify(payload),
      debugRef.current,
    );
    if (response.ok) {
      enqueueSnackbar("OBS project created", { variant: "success" });
      onCreated();
    } else {
      enqueueSnackbar(`Creation failed: ${response.status}`, {
        variant: "error",
      });
    }
  };

  const languageError =
    languageCode.length > 0 && !regexLanguage.test(languageCode);

  const isDisabled =
    !(
      contentName.trim().length > 0 &&
      contentAbbr.trim().length > 0 &&
      !errorAbbreviation &&
      languageCode.trim().length > 0 &&
      !languageError
    ) || repoExists;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create OBS Project</DialogTitle>
      <DialogContent>
        <Grid2
          container
          spacing={2}
          justifyItems="flex-end"
          alignItems="stretch"
          flexDirection="column"
          sx={{ mt: 1 }}
        >
          <TextField
            id="name"
            required
            label="Name"
            value={contentName}
            onChange={(e) => setContentName(e.target.value)}
          />
          <Tooltip
            open={repoExists}
            slotProps={{
              popper: {
                modifiers: [{ name: "offset", options: { offset: [0, -7] } }],
              },
            }}
            title="This abbreviation is already in use"
            placement="top-start"
          >
            <TextField
              id="abbr"
              error={errorAbbreviation}
              helperText="2-8 alphanumeric characters"
              required
              label="Abbreviation"
              value={contentAbbr}
              onChange={(e) => {
                const value = e.target.value;
                setRepoExists(
                  localRepos.map((l) => l.split("/")[2]).includes(value),
                );
                setContentAbbr(value);
                setErrorAbbreviation(
                  value.length > 0 && !regexAbbreviation.test(value),
                );
              }}
            />
          </Tooltip>
          <TextField
            id="language"
            required
            label="Language code"
            helperText="BCP 47 code, e.g. en, fr, swh"
            error={languageError}
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value.toLowerCase())}
          />
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={isDisabled}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
