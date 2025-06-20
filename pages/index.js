import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { auth, provider } from "../lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [tema, setTema] = useState("");
  const [ideas, setIdeas] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const datos = localStorage.getItem(`historial_${user.uid}`);
        setHistorial(datos ? JSON.parse(datos) : []);
      } else {
        setHistorial([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cerrar menú si clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuVisible(false);
      }
    }
    if (menuVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuVisible]);

  const agruparPorTema = (historial) => {
    const agrupado = {};
    historial.forEach((item) => {
      if (!agrupado[item.tema]) agrupado[item.tema] = [];
      agrupado[item.tema].push(item);
    });
    return agrupado;
  };

  const eliminarEntrada = (tema, index) => {
    const nuevoHistorial = historial.filter(
      (item, i) => !(item.tema === tema && index === i)
    );
    setHistorial(nuevoHistorial);
    localStorage.setItem(`historial_${user.uid}`, JSON.stringify(nuevoHistorial));
  };

  const borrarTodoHistorial = () => {
    if (confirm("¿Seguro que deseas borrar todo el historial?")) {
      setHistorial([]);
      localStorage.removeItem(`historial_${user.uid}`);
    }
  };

  async function login() {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Error al iniciar sesión: " + err.message);
    }
  }

  async function logout() {
    await signOut(auth);
    setIdeas("");
    setTema("");
    setMostrarHistorial(false);
    setMenuVisible(false);
  }

  async function generarIdeas(e) {
    e.preventDefault();
    setCargando(true);
    setError("");
    setIdeas("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando ideas");

      setIdeas(data.result);

      if (user) {
        const nuevoItem = {
          tema,
          resultado: data.result,
          fecha: new Date().toISOString(),
        };
        const nuevoHistorial = [nuevoItem, ...historial];
        setHistorial(nuevoHistorial);
        localStorage.setItem(`historial_${user.uid}`, JSON.stringify(nuevoHistorial));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // Obtener inicial del nombre
  const inicialUsuario = user?.displayName ? user.displayName.charAt(0).toUpperCase() : "";

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "2rem auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* Sidebar de historial */}
      {mostrarHistorial && user && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "300px",
            height: "100vh",
            backgroundColor: "#000",
            color: "#fff",
            padding: "1rem",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          <h3 style={{ borderBottom: "1px solid #444", paddingBottom: "0.5rem" }}>Historial</h3>
          <button
            onClick={borrarTodoHistorial}
            style={{
              background: "#b00020",
              color: "#fff",
              border: "none",
              padding: "0.4rem 0.8rem",
              borderRadius: "5px",
              marginBottom: "1rem",
              cursor: "pointer",
            }}
          >
            Borrar todo
          </button>
          {Object.entries(agruparPorTema(historial)).map(([tema, items], idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => setExpandido(expandido === tema ? null : tema)}
                style={{
                  background: "#222",
                  color: "#fff",
                  padding: "0.5rem",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {tema}
              </button>
              {expandido === tema &&
                items.map((item, i) => (
                  <div
                    key={i}
                    style={{ background: "#111", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "6px" }}
                  >
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{item.resultado}</pre>
                    <small style={{ color: "#ccc" }}>{new Date(item.fecha).toLocaleString()}</small>
                    <br />
                    <button
                      onClick={() => eliminarEntrada(tema, historial.indexOf(item))}
                      style={{
                        background: "red",
                        color: "#fff",
                        border: "none",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        marginTop: "0.3rem",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Botón redondo con inicial y menú desplegable */}
      {user && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 1100,
            userSelect: "none",
          }}
        >
          <button
            onClick={() => setMenuVisible(!menuVisible)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#0b74de",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.2rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
            aria-label="Menú usuario"
          >
            {inicialUsuario}
          </button>
          {menuVisible && (
            <div
              style={{
                marginTop: "0.5rem",
                backgroundColor: "#222",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                width: "150px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => {
                  setMostrarHistorial(!mostrarHistorial);
                  setMenuVisible(false);
                }}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  padding: "0.8rem 1rem",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  fontSize: "1rem",
                }}
              >
                {mostrarHistorial ? "Ocultar historial" : "Historial"}
              </button>
              <button
                onClick={logout}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  padding: "0.8rem 1rem",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "1rem",
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}

      {/* Login / Crear cuenta */}
      {!user && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: mostrarHistorial ? "320px" : "1rem",
            zIndex: 1001,
            textAlign: "right",
          }}
        >
          <button
            onClick={login}
            style={{
              padding: "0.7rem 1.4rem",
              fontSize: "1.1rem",
              backgroundColor: "#db4437",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Crear cuenta
          </button>
        </div>
      )}

      {/* Logo y título */}
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <Image src="/logo.png" alt="Viro Logo" width={120} height={120} />
      </div>
      <h1
        style={{
          fontSize: "4rem",
          fontWeight: "900",
          color: "#0b74de",
          letterSpacing: "0.15em",
          textAlign: "center",
        }}
      >
        VIRO
      </h1>
      <p style={{ fontSize: "1.25rem", color: "#555", textAlign: "center" }}>
        Generador de ideas virales con IA
      </p>

      {/* Formulario */}
      <form
        onSubmit={generarIdeas}
        style={{ marginTop: "2rem", textAlign: "center" }}
      >
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Escribe un tema para tus videos"
          required
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "0.6rem",
            fontSize: "1.1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
        <br />
        <button
          type="submit"
          disabled={cargando}
          style={{
            marginTop: "1rem",
            padding: "0.7rem 1.4rem",
            fontSize: "1.1rem",
            backgroundColor: cargando ? "#4a90e2aa" : "#0b74de",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: cargando ? "not-allowed" : "pointer",
          }}
        >
          {cargando ? "Generando..." : "Generar ideas"}
        </button>
      </form>

      {/* Resultado */}
      {error && (
        <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>
          {error}
        </p>
      )}
      {ideas && (
        <div
          style={{
            whiteSpace: "pre-wrap",
            background: "#121212",
            color: "#ffffff",
            padding: "1rem",
            borderRadius: "8px",
            marginTop: "1.5rem",
            textAlign: "left",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {ideas}
        </div>
      )}

      {/* Botones fijos con íconos */}
      <div
        style={{
          position: "fixed",
          bottom: "1rem",
          left: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 1000,
        }}
      >
        <a
          href="https://www.tiktok.com/@viroweb"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 256 256"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M208 80.8c-18.8 0-34.1-13.9-36.6-32h-25.2v115.2c0 29.4-23.8 53.2-53.2 53.2s-53.2-23.8-53.2-53.2 23.8-53.2 53.2-53.2c4.6 0 9.1 0.6 13.4 1.8v29.6c-4-2.3-8.6-3.5-13.4-3.5-15.2 0-27.6 12.4-27.6 27.6s12.4 27.6 27.6 27.6 27.6-12.4 27.6-27.6V24h51.4c3.3 27.6 26.8 49.2 55.4 49.2V80.8z" />
          </svg>
          TikTok
        </a>
        <a
          href="https://www.youtube.com/channel/UCJ5yp7FJ1yCuXojeIlzfKkA"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: "#c4302b",
            color: "#fff",
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 576 512"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M549.7 124.1c-6.3-23.7-24.9-42.4-48.6-48.6C456.2 64 288 64 288 64S119.8 64 74.9 75.5C51.2 81.7 32.5 100.4 26.3 124.1 16 168.4 16 256 16 256s0 87.6 10.3 131.9c6.3 23.7 24.9 42.4 48.6 48.6C119.8 448 288 448 288 448s168.2 0 213.1-11.5c23.7-6.3 42.4-24.9 48.6-48.6C560 343.6 560 256 560 256s0-87.6-10.3-131.9zM232 336V176l142 80-142 80z" />
          </svg>
          YouTube
        </a>
      </div>
    </div>
  );
}
