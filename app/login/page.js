"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Completează emailul și parola.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setMessage("Conexiunea cu Supabase nu este configurată.");
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setMessage("Email sau parolă incorectă.");
        return;
      }

      localStorage.setItem(
        "masago_access_token",
        data.access_token
      );

      localStorage.setItem(
        "masago_refresh_token",
        data.refresh_token
      );

      localStorage.setItem(
        "masago_user_email",
        data.user?.email || email
      );

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare la autentificare.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f6f7f9",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        color: "#222",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#666",
            fontSize: "14px",
          }}
        >
          ← Înapoi la Masago
        </a>

        <h1
          style={{
            marginTop: "25px",
            marginBottom: "8px",
            fontSize: "30px",
          }}
        >
          Login restaurant
        </h1>

        <p
          style={{
            color: "#777",
            marginTop: 0,
            marginBottom: "30px",
          }}
        >
          Intră în cont pentru a gestiona rezervările.
        </p>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            placeholder="restaurant@masago.ro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Parolă
          </label>

          <input
            type="password"
            placeholder="Parola"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
              marginBottom: "20px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: "#ff5a3c",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Se conectează..." : "Intră în cont"}
          </button>

          {message && (
            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontWeight: "bold",
                color: "#b42318",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
