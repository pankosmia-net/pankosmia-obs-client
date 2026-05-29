import { useContext } from "react";
import { Avatar, Chip, Stack } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AuthContext from "../context/AuthContext";

export default function AuthWidget() {
  const { user, loading, isOnline, signIn, signOut } = useContext(AuthContext);

  if (!isOnline || loading) return null;

  if (!user) {
    return <Chip label="Sign in" variant="outlined" onClick={signIn} />;
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        avatar={<Avatar src={user.avatar_url} alt={user.name || user.login} />}
        label={user.name || user.login}
        variant="outlined"
      />
      <Chip
        icon={<LogoutIcon />}
        label="Sign out"
        size="small"
        variant="outlined"
        onClick={signOut}
      />
    </Stack>
  );
}
