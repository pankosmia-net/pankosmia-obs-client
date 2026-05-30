import { useState, useEffect } from "react";
import resourceIndex from "../../config/resources/index.json";

const GITEA_HOST = "git.door43.org";

function repoPath(resource) {
  return `${GITEA_HOST}/${resource.org}/${resource.repo}`;
}

export default function useReferenceResources() {
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      const result = {};
      for (const entry of resourceIndex) {
        const mod = await import(`../../config/resources/${entry.file}`);
        const config = mod.default;
        result[entry.code] = {
          label: config.label,
          resources: config.resources.map((r) => ({
            ...r,
            path: repoPath(r),
          })),
        };
      }
      setResources(result);
      setLoading(false);
    };
    loadAll();
  }, []);

  return { resources, loading };
}
