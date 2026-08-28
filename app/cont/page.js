"use client";

import { useState } from "react";

export default function ContClientPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Introdu adresa de email.");
      return;
    }

    if (!password) {
      setMessage("Introdu parola.");
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Login error:", data);

        if (
          data?.msg === "Email not confirmed" ||
          data?.message === "Email not confirmed"
        ) {
          setMessage(
            "Trebuie să confirmi adresa de email înainte să intri în cont."
          );
          return;
        }

        setMessage(
          "Email sau parolă incorectă."
        );
        return;
      }

      if (!data?.access_token || !data?.user) {
        setMessage(
          "Autentificarea nu a putut fi finalizată."
        );
        return;
      }

      localStorage.setItem(
        "masago_client_access_token",
        data.access_token
      );

      if (data.refresh_token) {
        localStorage.setItem(
          "masago_client_refresh_token",
          data.refresh_token
        );
      }

      localStorage.setItem(
        "masago_client_user",
        JSON.stringify(data.user)
      );

      window.location.href =
        "/rezervarile-mele";
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la autentificare."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #ececec",
          padding: "18px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#172033",
            fontSize: "29px",
            fontWeight: "900",
            letterSpacing: "-1px",
          }}
        >
          Masago
          <span
            style={{
              color: "#FF5A3C",
            }}
          >
            .
          </span>
        </a>

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#485267",
            fontWeight: "700",
          }}
        >
          ← Înapoi
        </a>
      </header>

      <section
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          padding: "70px 6% 90px",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #E7E9ED",
            borderRadius: "22px",
            padding: "30px",
            boxShadow:
              "0 12px 35px rgba(23,32,51,0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#FF5A3C",
              fontSize: "13px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Cont client
          </p>

          <h1
            style={{
              margin: "8px 0 10px",
              fontSize: "34px",
            }}
          >
            Intră în cont
          </h1>

          <p
            style={{
              margin: "0 0 28px",
              color: "#737C8D",
              lineHeight: 1.6,
            }}
          >
            Autentifică-te pentru a-ți
            accesa contul Masago și
            rezervările.
          </p>

          <form onSubmit={handleLogin}>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "800",
                }}
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="email@exemplu.ro"
                autoComplete="email"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
                  border:
                    "1px solid #DDE1E6",
                  borderRadius: "11px",
                  background: "#FAFBFC",
                  color: "#172033",
                  fontSize: "16px",
                  outline: "none",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "800",
                }}
              >
                Parolă
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Parola ta"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
                  border:
                    "1px solid #DDE1E6",
                  borderRadius: "11px",
                  background: "#FAFBFC",
                  color: "#172033",
                  fontSize: "16px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "11px",
                padding: "15px",
                background: loading
                  ? "#AEB5C0"
                  : "#FF5A3C",
                color: "white",
                fontWeight: "900",
                fontSize: "16px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Se autentifică..."
                : "Intră în cont"}
            </button>
          </form>

          {message && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "11px",
                background: "#FFF0EC",
                color: "#A33A29",
                fontWeight: "800",
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop:
                "1px solid #EEF0F2",
              textAlign: "center",
              color: "#667085",
            }}
          >
            Nu ai cont?{" "}

            <a
              href="/cont/inregistrare"
              style={{
                color: "#FF5A3C",
                fontWeight: "900",
                textDecoration: "none",
              }}
            >
              Creează cont
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
