import { useState, useEffect } from "react";
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
      {/* Sidebar Historial */}
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
            boxShadow: "0 0 15px rgba(0,0,0,0.8)",
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
                    style={{
                      background: "#111",
                      padding: "0.5rem",
                      marginTop: "0.5rem",
                      borderRadius: "6px",
                    }}
                  >
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{item.resultado}</pre>
                    <small style={{ color: "#ccc" }}>
                      {new Date(item.fecha).toLocaleString()}
                    </small>
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

      {/* Login/Logout */}
      <div style={{ position: "fixed", top: "1rem", right: mostrarHistorial ? "320px" : "1rem", zIndex: 1001, textAlign: "right" }}>
        {!user ? (
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
        ) : (
          <div>
            <p style={{ margin: 0, color: "#fff", fontWeight: "bold" }}>Hola, {user.displayName}</p>
            <button
              onClick={logout}
              style={{
                marginTop: "0.3rem",
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                backgroundColor: "#666",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
            <button
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.95rem",
                backgroundColor: "#0b74de",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "block",
              }}
            >
              {mostrarHistorial ? "Ocultar historial" : "Mostrar historial"}
            </button>
          </div>
        )}
      </div>

      {/* Logo */}
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <Image src="/logo.png" alt="Viro Logo" width={120} height={120} />
      </div>

      {/* Título */}
      <h1 style={{ fontSize: "4rem", fontWeight: "900", color: "#0b74de", letterSpacing: "0.15em", textAlign: "center" }}>
        VIRO
      </h1>
      <p style={{ fontSize: "1.25rem", color: "#555", textAlign: "center" }}>
        Generador de ideas virales con IA
      </p>

      {/* Formulario */}
      <form onSubmit={generarIdeas} style={{ marginTop: "2rem", textAlign: "center" }}>
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Escribe un tema para tus videos"
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "0.6rem",
            fontSize: "1.1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
          }}
          required
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

      {/* Mensajes */}
      {error && <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
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
    </div>
  );
}
