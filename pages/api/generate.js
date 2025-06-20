// pages/api/generate.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { tema } = req.body;

  if (!tema) {
    return res.status(400).json({ error: "Falta el tema" });
  }

  try {
    const response = await cohere.chat({
      model: "command-r-plus",
      message: `Dame 5 ideas virales y creativas para un video corto sobre el tema: "${tema}"`,
    });

    res.status(200).json({ result: response.text });
  } catch (error) {
    console.error("Error en Cohere:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
}
