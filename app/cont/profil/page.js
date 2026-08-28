"use client";

import { useEffect, useState } from "react";

export default function ProfilClientPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");
  const [passwordSuccess, setPasswordSuccess] =
    useState(false);

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

  async function handleChangePassword(
    event
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordSuccess(false);

    if (!newPassword) {
      setPasswordMessage(
        "Introdu parola nouă."
      );

      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        "Parola trebuie să aibă minimum 6 caractere."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordMessage(
        "Parolele nu coincid."
      );

      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setPasswordMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (!accessToken) {
      window.location.href =
        "/cont";

      return;
    }

    setChangingPassword(true);

    try {
      let response =
        await fetch(
          `${supabaseUrl}/auth/v1/user`,
          {
            method: "PUT",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              password:
                newPassword,
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

        response =
          await fetch(
            `${supabaseUrl}/auth/v1/user`,
            {
              method: "PUT",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  password:
                    newPassword,
                }),
            }
          );
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Password update error:",
          data
        );

        setPasswordMessage(
          data?.message ||
            data?.msg ||
            "Nu am putut schimba parola."
        );

        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(true);

      setPasswordMessage(
        "Parola a fost schimbată cu succes."
      );
    } catch (error) {
      console.error(error);

      setPasswordMessage(
        "A apărut o eroare la schimbarea parolei."
      );
    } finally {
      setChangingPassword(false);
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
      {/* HEADER */}

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

          <a
            href="/"
            style={{
              textDecoration:
                "none",
              color: "#485267",
              fontWeight: "800",
              padding: "10px",
            }}
          >
            Restaurante
          </a>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              border:
                "1px solid #FFD4CC",
              background:
                "#FFF5F2",
              color:
                "#B42318",
              borderRadius:
                "10px",
              padding:
                "10px 14px",
              fontWeight:
                "900",
              cursor:
                "pointer",
            }}
          >
            Ieși din cont
          </button>
        </div>
      </header>

      {/* CONTENT */}

      <section
        style={{
          maxWidth: "650px",
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
            Profilul meu
          </h1>

          <p
            style={{
              margin: 0,
              color: "#737C8D",
              lineHeight: 1.6,
            }}
          >
            Gestionează datele contului
            tău Masago.
          </p>
        </div>

        {/* DATE PROFIL */}

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
          <h2
            style={{
              margin:
                "0 0 8px",
            }}
          >
            Date personale
          </h2>

          <p
            style={{
              margin:
                "0 0 25px",
              color:
                "#737C8D",
              lineHeight:
                1.5,
            }}
          >
            Aceste date sunt folosite
            pentru rezervările tale.
          </p>

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

        {/* PAROLA */}

        <div
          style={{
            marginTop:
              "22px",
            background:
              "white",
            border:
              "1px solid #E7E9ED",
            borderRadius:
              "22px",
            padding:
              "30px",
            boxShadow:
              "0 12px 35px rgba(23,32,51,0.05)",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 8px",
            }}
          >
            Schimbă parola
          </h2>

          <p
            style={{
              margin:
                "0 0 25px",
              color:
                "#737C8D",
              lineHeight:
                1.5,
            }}
          >
            Alege o parolă nouă pentru
            contul tău.
          </p>

          <form
            onSubmit={
              handleChangePassword
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
                  display:
                    "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    "800",
                }}
              >
                Parolă nouă
              </label>

              <input
                type="password"
                value={
                  newPassword
                }
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Minimum 6 caractere"
                autoComplete="new-password"
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
                  display:
                    "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    "800",
                }}
              >
                Confirmă parola nouă
              </label>

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Scrie parola din nou"
                autoComplete="new-password"
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
                changingPassword
              }
              style={{
                width:
                  "100%",
                border:
                  "1px solid #DDE1E6",
                borderRadius:
                  "11px",
                padding:
                  "15px",
                background:
                  changingPassword
                    ? "#E4E7EC"
                    : "#172033",
                color:
                  changingPassword
                    ? "#667085"
                    : "white",
                fontWeight:
                  "900",
                fontSize:
                  "16px",
                cursor:
                  changingPassword
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {changingPassword
                ? "Se schimbă parola..."
                : "Schimbă parola"}
            </button>
          </form>

          {passwordMessage && (
            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "14px",
                borderRadius:
                  "11px",
                background:
                  passwordSuccess
                    ? "#E9F8EF"
                    : "#FFF0EC",
                color:
                  passwordSuccess
                    ? "#177245"
                    : "#A33A29",
                fontWeight:
                  "800",
                lineHeight:
                  1.5,
              }}
            >
              {passwordMessage}
            </div>
          )}
        </div>

        {/* LOGOUT */}

        <div
          style={{
            marginTop:
              "22px",
            background:
              "#FFF5F2",
            border:
              "1px solid #FFD8CF",
            borderRadius:
              "22px",
            padding:
              "25px",
          }}
        >
          <h3
            style={{
              margin:
                "0 0 8px",
            }}
          >
            Sesiunea ta
          </h3>

          <p
            style={{
              margin:
                "0 0 18px",
              color:
                "#667085",
              lineHeight:
                1.5,
            }}
          >
            Poți ieși din cont de pe
            acest dispozitiv.
          </p>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              width:
                "100%",
              border:
                "1px solid #FFB7A8",
              borderRadius:
                "11px",
              padding:
                "14px",
              background:
                "white",
              color:
                "#B42318",
              fontWeight:
                "900",
              fontSize:
                "15px",
              cursor:
                "pointer",
            }}
          >
            Ieși din cont
          </button>
        </div>
      </section>
    </main>
  );
}
