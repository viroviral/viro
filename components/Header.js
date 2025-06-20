// components/Header.js
import React from "react";

export default function Header() {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", backgroundColor: "#0b74de", color: "white" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "0.15em", fontFamily: "'Montserrat', sans-serif", margin: 0 }}>
        VIRO
      </h1>
      <button
        style={{
          backgroundColor: "white",
          color: "#0b74de",
          border: "none",
          borderRadius: "6px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "1rem",
        }}
        onClick={() => alert("Aquí irá el inicio de sesión")}
      >
        Iniciar sesión
      </button>
    </header>
  );
}
