"use client";

import { useEffect, useState } from "react";

export default function ProfilClientPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  function clearClientSession() {
    localStorage.removeItem(
      "masago_client_access_token"
    );

    localStorage.removeItem(
      "masago_client_refresh_token"
    );

    localStorage.removeItem(
      "masago_client_user"
    );
  }

  async function refreshSession(
    supabaseUrl,
    supabaseKey
  ) {
    const refreshToken =
      localStorage.getItem(
        "masago_client_refresh_token"
      );

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            refresh_token:
              refreshToken,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.access_token
      ) {
        return null;
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

      if (data.user) {
        localStorage.setItem(
          "masago_client_user",
          JSON.stringify(data.user)
        );
      }

      return {
        accessToken:
          data.access_token,

        user:
          data.user || null,
      };
    } catch (error) {
      console.error(
        "Refresh session error:",
        error
      );

      return null;
    }
  }

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      setLoading(false);
      return;
    }

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    let savedUser = null;

    try {
      savedUser = JSON.parse(
        localStorage.getItem(
          "masago_client_user"
        ) || "null"
      );
    } catch {
      savedUser = null;
    }

    if (!accessToken) {
      window.location.href =
        "/cont";

      return;
    }

    if (savedUser?.email) {
      setEmail(
        savedUser.email
      );
    }

    try {
      let response =
        await fetch(
          `${supabaseUrl}/rest/v1/client_profiles?select=user_id,full_name,phone&limit=1`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      if (
        response.status === 401
      ) {
        const refreshed =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!refreshed) {
          clearClientSession();

          window.location.href =
            "/cont";

          return;
        }

        accessToken =
          refreshed.accessToken;

        if (
          refreshed.user?.email
        ) {
          setEmail(
            refreshed.user.email
          );
        }

        response =
          await fetch(
            `${supabaseUrl}/rest/v1/client_profiles?select=user_id,full_name,phone&limit=1`,
            {
              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Profile load error:",
          data
        );

        setMessage(
          data?.message ||
            data?.error ||
            "Nu am putut încărca profilul."
        );

        return;
      }

      const profile =
        data?.[0];

      if (profile) {
        setFullName(
          profile.full_name || ""
        );

        setPhone(
          profile.phone || ""
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la încărcarea profilului."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanName =
      fullName.trim();

    const cleanPhone =
      phone.trim();

    if (!cleanName) {
      setMessage(
        "Introdu numele."
      );

      return;
    }

    if (!cleanPhone) {
      setMessage(
        "Introdu numărul de telefon."
      );

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

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    let user = null;

    try {
      user = JSON.parse(
        localStorage.getItem(
          "masago_client_user"
        ) || "null"
      );
    } catch {
      user = null;
    }

    if (
      !accessToken ||
      !user?.id
    ) {
      window.location.href =
        "/cont";

      return;
    }

    setSaving(true);

    try {
      let response =
        await fetch(
          `${supabaseUrl}/rest/v1/client_profiles?on_conflict=user_id`,
          {
            method: "POST",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",

              Prefer:
                "resolution=merge-duplicates,return=minimal",
            },

            body: JSON.stringify({
              user_id:
                user.id,

              full_name:
                cleanName,

              phone:
                cleanPhone,

              updated_at:
                new Date().toISOString(),
            }),
          }
        );

      if (
        response.status === 401
      ) {
        const refreshed =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!refreshed) {
          clearClientSession();

          window.location.href =
            "/cont";

          return;
        }

        accessToken =
          refreshed.accessToken;

        user =
          refreshed.user ||
          user;

        response =
          await fetch(
            `${supabaseUrl}/rest/v1/client_profiles?on_conflict=user_id`,
            {
              method: "POST",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",

                Prefer:
                  "resolution=merge-duplicates,return=minimal",
              },

              body:
                JSON.stringify({
                  user_id:
                    user.id,

                  full_name:
                    cleanName,

                  phone:
                    cleanPhone,

                  updated_at:
                    new Date().toISOString(),
                }),
            }
          );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Profile save error:",
          errorText
        );

        setMessage(
          `Nu am putut salva profilul: ${errorText}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Profilul a fost salvat."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la salvarea profilului."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearClientSession();

    window.location.href =
      "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        fontFamily:
          "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom:
            "1px solid #ececec",
          padding: "18px 6%",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration:
              "none",
            color: "#172033",
            fontSize: "29px",
            fontWeight: "900",
            letterSpacing:
              "-1px",
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

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/rezervarile-mele"
            style={{
              textDecoration:
                "none",
              color: "#485267",
              fontWeight: "800",
              padding: "10px",
            }}
          >
            Rezervările mele
          </a>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              border:
                "1px solid #E4E7EC",
              background:
                "white",
              color: "#667085",
              borderRadius:
                "10px",
              padding:
                "10px 14px",
              fontWeight:
                "800",
              cursor:
                "pointer",
            }}
          >
            Ieși din cont
          </button>
        </div>
      </header>

      <section
        style={{
          maxWidth: "620px",
          margin: "0 auto",
          padding:
            "65px 6% 90px",
        }}
      >
        <div
          style={{
            marginBottom:
              "28px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#FF5A3C",
              fontSize: "13px",
              fontWeight: "900",
              textTransform:
                "uppercase",
              letterSpacing:
                "1px",
            }}
          >
            Contul meu
          </p>

          <h1
            style={{
              fontSize: "40px",
              margin:
                "8px 0 8px",
            }}
          >
            Profil
          </h1>

          <p
            style={{
              margin: 0,
              color: "#737C8D",
              lineHeight: 1.6,
            }}
          >
            Salvează-ți datele pentru
            rezervări mai rapide.
          </p>
        </div>

        <div
          style={{
            background: "white",
            border:
              "1px solid #E7E9ED",
            borderRadius:
              "22px",
            padding: "30px",
            boxShadow:
              "0 12px 35px rgba(23,32,51,0.07)",
          }}
        >
          {loading ? (
            <div
              style={{
                fontWeight: "800",
              }}
            >
              Se încarcă profilul...
            </div>
          ) : (
            <form
              onSubmit={
                handleSave
              }
            >
              <div
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom:
                      "8px",
                    fontWeight:
                      "800",
                  }}
                >
                  Email
                </label>

                <input
                  value={email}
                  readOnly
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "14px 15px",
                    border:
                      "1px solid #DDE1E6",
                    borderRadius:
                      "11px",
                    background:
                      "#F2F4F7",
                    color:
                      "#667085",
                    fontSize:
                      "16px",
                  }}
                />

                <div
                  style={{
                    marginTop:
                      "6px",
                    color:
                      "#98A2B3",
                    fontSize:
                      "12px",
                  }}
                >
                  Emailul este asociat
                  contului tău Masago.
                </div>
              </div>

              <div
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom:
                      "8px",
                    fontWeight:
                      "800",
                  }}
                >
                  Nume
                </label>

                <input
                  type="text"
                  value={
                    fullName
                  }
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Numele tău"
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "14px 15px",
                    border:
                      "1px solid #DDE1E6",
                    borderRadius:
                      "11px",
                    background:
                      "#FAFBFC",
                    color:
                      "#172033",
                    fontSize:
                      "16px",
                    outline:
                      "none",
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom:
                    "22px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom:
                      "8px",
                    fontWeight:
                      "800",
                  }}
                >
                  Telefon
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="07xxxxxxxx"
                  style={{
                    width: "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "14px 15px",
                    border:
                      "1px solid #DDE1E6",
                    borderRadius:
                      "11px",
                    background:
                      "#FAFBFC",
                    color:
                      "#172033",
                    fontSize:
                      "16px",
                    outline:
                      "none",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving
                }
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius:
                    "11px",
                  padding:
                    "15px",
                  background:
                    saving
                      ? "#AEB5C0"
                      : "#FF5A3C",
                  color: "white",
                  fontWeight:
                    "900",
                  fontSize:
                    "16px",
                  cursor:
                    saving
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {saving
                  ? "Se salvează..."
                  : "Salvează profilul"}
              </button>
            </form>
          )}

          {message && (
            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "14px",
                borderRadius:
                  "11px",
                background:
                  success
                    ? "#E9F8EF"
                    : "#FFF0EC",
                color:
                  success
                    ? "#177245"
                    : "#A33A29",
                fontWeight:
                  "800",
                lineHeight:
                  1.5,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
