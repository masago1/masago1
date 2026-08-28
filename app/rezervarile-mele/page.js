"use client";

import { useEffect, useState } from "react";

export default function RezervarileMelePage() {
  const [reservations, setReservations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [loggedIn, setLoggedIn] =
    useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const [
      year,
      month,
      day,
    ] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatTime(time) {
    if (!time) {
      return "-";
    }

    return String(time).slice(0, 5);
  }

  function getStatusData(status) {
    if (status === "accepted") {
      return {
        label: "Confirmată",
        background: "#E9F8EF",
        color: "#16865C",
      };
    }

    if (status === "rejected") {
      return {
        label: "Respinsă",
        background: "#FDECEC",
        color: "#B42318",
      };
    }

    if (status === "cancelled") {
      return {
        label: "Anulată",
        background: "#F2F4F7",
        color: "#667085",
      };
    }

    return {
      label: "În așteptare",
      background: "#FFF4DD",
      color: "#8A6500",
    };
  }

  function getHiddenReservationCodes() {
    try {
      return JSON.parse(
        localStorage.getItem(
          "masago_hidden_reservation_codes"
        ) || "[]"
      );
    } catch {
      return [];
    }
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

      return data.access_token;
    } catch (error) {
      console.error(
        "Refresh session error:",
        error
      );

      return null;
    }
  }

  async function requestReservations(
    supabaseUrl,
    supabaseKey,
    accessToken
  ) {
    return fetch(
      `${supabaseUrl}/rest/v1/rpc/get_my_client_reservations`,
      {
        method: "POST",

        headers: {
          apikey: supabaseKey,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({}),
      }
    );
  }

  async function loadReservations() {
    setLoading(true);
    setMessage("");

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

    if (!accessToken) {
      setLoggedIn(false);
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      let response =
        await requestReservations(
          supabaseUrl,
          supabaseKey,
          accessToken
        );

      /*
        Dacă tokenul a expirat,
        încercăm automat să reînnoim
        sesiunea folosind refresh token.
      */

      if (
        response.status === 401
      ) {
        const newAccessToken =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!newAccessToken) {
          clearClientSession();

          setLoggedIn(false);
          setReservations([]);
          setLoading(false);

          return;
        }

        accessToken =
          newAccessToken;

        response =
          await requestReservations(
            supabaseUrl,
            supabaseKey,
            accessToken
          );
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Reservations error:",
          data
        );

        setMessage(
          data?.message ||
            data?.error ||
            "Nu am putut încărca rezervările."
        );

        return;
      }

      const hiddenCodes =
        getHiddenReservationCodes();

      const visibleReservations =
        (data || []).filter(
          (reservation) =>
            !hiddenCodes.includes(
              reservation.reservation_code
            )
        );

      setReservations(
        visibleReservations
      );

      setLoggedIn(true);
    } catch (error) {
      console.error(
        "Load reservations error:",
        error
      );

      setMessage(
        "A apărut o eroare la încărcarea rezervărilor."
      );
    } finally {
      setLoading(false);
    }
  }

  function openReservation(
    reservationCode
  ) {
    localStorage.setItem(
      "masago_last_reservation_code",
      reservationCode
    );

    window.location.href =
      "/verifica-rezervare";
  }

  function removeReservationFromList(
    reservationCode
  ) {
    const confirmed =
      window.confirm(
        "Vrei să elimini această rezervare din lista ta?"
      );

    if (!confirmed) {
      return;
    }

    /*
      IMPORTANT:
      Nu ștergem rezervarea din Supabase.

      Doar o ascundem din lista acestui
      dispozitiv.
    */

    let hiddenCodes =
      getHiddenReservationCodes();

    if (
      !hiddenCodes.includes(
        reservationCode
      )
    ) {
      hiddenCodes = [
        reservationCode,
        ...hiddenCodes,
      ];
    }

    localStorage.setItem(
      "masago_hidden_reservation_codes",
      JSON.stringify(
        hiddenCodes
      )
    );

    const lastReservationCode =
      localStorage.getItem(
        "masago_last_reservation_code"
      );

    if (
      lastReservationCode ===
      reservationCode
    ) {
      localStorage.removeItem(
        "masago_last_reservation_code"
      );
    }

    setReservations(
      (currentReservations) =>
        currentReservations.filter(
          (reservation) =>
            reservation.reservation_code !==
            reservationCode
        )
    );
  }

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
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            style={{
              textDecoration:
                "none",
              color: "#485267",
              fontWeight: "700",
              padding:
                "10px 12px",
            }}
          >
            ← Restaurante
          </a>

          {loggedIn && (
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
                color:
                  "#667085",
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
          )}
        </div>
      </header>

      {/* CONTENT */}

      <section
        style={{
          maxWidth: "950px",
          margin: "0 auto",
          padding:
            "65px 6% 90px",
        }}
      >
        <div
          style={{
            marginBottom:
              "32px",
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
            Contul meu Masago
          </p>

          <h1
            style={{
              fontSize:
                "42px",
              margin:
                "8px 0",
            }}
          >
            Rezervările mele
          </h1>

          <p
            style={{
              color: "#737C8D",
              fontSize: "17px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Vezi rezervările asociate
            contului tău Masago.
          </p>
        </div>

        {/* NECONECTAT */}

        {!loading &&
          !loggedIn && (
            <div
              style={{
                background:
                  "white",
                border:
                  "1px solid #E7E9ED",
                borderRadius:
                  "22px",
                padding:
                  "50px 30px",
                textAlign:
                  "center",
                boxShadow:
                  "0 10px 30px rgba(23,32,51,0.05)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "48px",
                  marginBottom:
                    "15px",
                }}
              >
                👤
              </div>

              <h2
                style={{
                  margin:
                    "0 0 10px",
                  fontSize:
                    "27px",
                }}
              >
                Intră în cont
              </h2>

              <p
                style={{
                  color:
                    "#737C8D",
                  lineHeight:
                    1.6,
                  maxWidth:
                    "480px",
                  margin:
                    "0 auto",
                }}
              >
                Autentifică-te pentru
                a vedea rezervările
                asociate contului tău.
              </p>

              <a
                href="/cont"
                style={{
                  display:
                    "inline-block",
                  marginTop:
                    "22px",
                  textDecoration:
                    "none",
                  background:
                    "#FF5A3C",
                  color:
                    "white",
                  padding:
                    "14px 22px",
                  borderRadius:
                    "11px",
                  fontWeight:
                    "900",
                }}
              >
                Intră în cont
              </a>

              <div
                style={{
                  marginTop:
                    "18px",
                  color:
                    "#667085",
                }}
              >
                Nu ai cont?{" "}

                <a
                  href="/cont/inregistrare"
                  style={{
                    color:
                      "#FF5A3C",
                    textDecoration:
                      "none",
                    fontWeight:
                      "900",
                  }}
                >
                  Creează cont
                </a>
              </div>
            </div>
          )}

        {/* LOADING */}

        {loading && (
          <div
            style={{
              background:
                "white",
              border:
                "1px solid #E7E9ED",
              borderRadius:
                "18px",
              padding:
                "30px",
              fontWeight:
                "800",
            }}
          >
            Se încarcă rezervările...
          </div>
        )}

        {/* EROARE */}

        {message && (
          <div
            style={{
              background:
                "#FFF0EC",
              color:
                "#A33A29",
              border:
                "1px solid #FFD8CF",
              borderRadius:
                "14px",
              padding:
                "16px",
              fontWeight:
                "800",
              marginBottom:
                "20px",
            }}
          >
            {message}
          </div>
        )}

        {/* CONT LOGAT DAR FĂRĂ REZERVĂRI */}

        {!loading &&
          loggedIn &&
          !message &&
          reservations.length ===
            0 && (
            <div
              style={{
                background:
                  "white",
                border:
                  "1px solid #E7E9ED",
                borderRadius:
                  "20px",
                padding:
                  "50px 30px",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "45px",
                  marginBottom:
                    "15px",
                }}
              >
                🍽️
              </div>

              <h2
                style={{
                  margin:
                    "0 0 10px",
                }}
              >
                Nu ai rezervări
              </h2>

              <p
                style={{
                  color:
                    "#737C8D",
                  lineHeight:
                    1.6,
                  maxWidth:
                    "500px",
                  margin:
                    "0 auto",
                }}
              >
                Rezervările făcute
                în timp ce ești
                autentificat în contul
                Masago vor apărea aici.
              </p>

              <a
                href="/"
                style={{
                  display:
                    "inline-block",
                  marginTop:
                    "20px",
                  textDecoration:
                    "none",
                  background:
                    "#FF5A3C",
                  color:
                    "white",
                  padding:
                    "13px 18px",
                  borderRadius:
                    "11px",
                  fontWeight:
                    "900",
                }}
              >
                Vezi restaurantele
              </a>
            </div>
          )}

        {/* LISTA REZERVĂRI */}

        {!loading &&
          loggedIn &&
          reservations.length >
            0 && (
            <div
              style={{
                display:
                  "grid",
                gap:
                  "16px",
              }}
            >
              {reservations.map(
                (reservation) => {
                  const status =
                    getStatusData(
                      reservation.status
                    );

                  return (
                    <article
                      key={
                        reservation.id
                      }
                      style={{
                        background:
                          "white",
                        border:
                          "1px solid #E7E9ED",
                        borderRadius:
                          "20px",
                        padding:
                          "24px",
                        boxShadow:
                          "0 8px 25px rgba(23,32,51,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap:
                            "20px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                "#8A92A0",
                              fontSize:
                                "11px",
                              fontWeight:
                                "900",
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.6px",
                            }}
                          >
                            Restaurant
                          </div>

                          <h2
                            style={{
                              margin:
                                "6px 0 5px",
                              fontSize:
                                "24px",
                            }}
                          >
                            {reservation.restaurant_name ||
                              "-"}
                          </h2>

                          {reservation.discount_percent !=
                            null && (
                            <div
                              style={{
                                color:
                                  "#FF5A3C",
                                fontWeight:
                                  "900",
                              }}
                            >
                              -
                              {
                                reservation.discount_percent
                              }
                              % reducere
                            </div>
                          )}
                        </div>

                        <span
                          style={{
                            background:
                              status.background,
                            color:
                              status.color,
                            padding:
                              "9px 13px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "13px",
                            fontWeight:
                              "900",
                          }}
                        >
                          {
                            status.label
                          }
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(130px, 1fr))",
                          gap:
                            "16px",
                          marginTop:
                            "22px",
                          paddingTop:
                            "20px",
                          borderTop:
                            "1px solid #EEF0F2",
                        }}
                      >
                        <Info
                          label="Data"
                          value={formatDate(
                            reservation.reservation_date
                          )}
                        />

                        <Info
                          label="Ora"
                          value={formatTime(
                            reservation.reservation_time
                          )}
                        />

                        <Info
                          label="Persoane"
                          value={
                            reservation.guests ??
                            "-"
                          }
                        />

                        <Info
                          label="Cod"
                          value={
                            reservation.reservation_code ||
                            "-"
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openReservation(
                            reservation.reservation_code
                          )
                        }
                        style={{
                          width:
                            "100%",
                          marginTop:
                            "20px",
                          border:
                            "none",
                          borderRadius:
                            "11px",
                          padding:
                            "14px",
                          background:
                            "#172033",
                          color:
                            "white",
                          fontWeight:
                            "900",
                          fontSize:
                            "15px",
                          cursor:
                            "pointer",
                        }}
                      >
                        Vezi rezervarea
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeReservationFromList(
                            reservation.reservation_code
                          )
                        }
                        style={{
                          width:
                            "100%",
                          marginTop:
                            "10px",
                          border:
                            "1px solid #E4E7EC",
                          borderRadius:
                            "11px",
                          padding:
                            "13px",
                          background:
                            "white",
                          color:
                            "#667085",
                          fontWeight:
                            "800",
                          fontSize:
                            "14px",
                          cursor:
                            "pointer",
                        }}
                      >
                        Șterge din lista mea
                      </button>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>
    </main>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div>
      <div
        style={{
          color: "#8A92A0",
          fontSize: "11px",
          fontWeight: "900",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.6px",
          marginBottom:
            "6px",
        }}
      >
        {label}
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}
