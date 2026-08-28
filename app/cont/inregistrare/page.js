"use client";

import { useState } from "react";

export default function InregistrarePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Introdu adresa de email.");
      return;
    }

    if (!password) {
      setMessage("Introdu parola.");
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Parola trebuie să aibă cel puțin 6 caractere."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Parolele nu coincid.");
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
        `${supabaseUrl}/auth/v1/signup`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
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
        console.error("Register error:", data);

        setMessage(
          data?.msg ||
            data?.message ||
            data?.error_description ||
            data?.error ||
            "Nu am putut crea contul."
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Contul a fost creat. Verifică emailul și confirmă adresa înainte să te autentifici."
      );

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la crearea contului."
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
            Creează cont
          </h1>

          <p
            style={{
              margin: "0 0 28px",
              color: "#737C8D",
              lineHeight: 1.6,
            }}
          >
            Creează-ți contul Masago pentru
            a-ți putea vedea rezervările de pe
            orice dispozitiv.
          </p>

          <form onSubmit={handleRegister}>
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
                  border: "1px solid #DDE1E6",
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
                Parolă
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 6 caractere"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
                  border: "1px solid #DDE1E6",
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
                Confirmă parola
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Repetă parola"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
                  border: "1px solid #DDE1E6",
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
                ? "Se creează contul..."
                : "Creează cont"}
            </button>
          </form>

          {message && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "11px",
                background: success
                  ? "#E9F8EF"
                  : "#FFF0EC",
                color: success
                  ? "#177245"
                  : "#A33A29",
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
              borderTop: "1px solid #EEF0F2",
              textAlign: "center",
              color: "#667085",
            }}
          >
            Ai deja cont?{" "}

            <a
              href="/cont"
              style={{
                color: "#FF5A3C",
                fontWeight: "900",
                textDecoration: "none",
              }}
            >
              Intră în cont
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
