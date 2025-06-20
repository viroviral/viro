import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { loginWithGoogle, logout } from "../lib/auth";

export default function AuthButtons() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  if (user) {
    return (
      <div>
        <p>Hola, {user.displayName}</p>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    );
  }

  return <button onClick={loginWithGoogle}>Iniciar sesión con Google</button>;
}
