"use client";

import { useEffect, useState } from "react";

export default function RezervarileMelePage() {
  const [reservations, setReservations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  function formatDate(date) {
    if (!date) return "-";

    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatTime(time) {
    if (!time) return "-";

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

  async function loadReservations() {
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

    let savedCodes = [];

    try {
      savedCodes = JSON.parse(
        localStorage.getItem(
          "masago_reservation_codes"
        ) || "[]"
      );
    } catch {
      savedCodes = [];
    }

    const lastReservationCode =
      localStorage.getItem(
        "masago_last_reservation_code"
      );

    if (
      lastReservationCode &&
      !savedCodes.includes(
        lastReservationCode
      )
    ) {
      savedCodes.unshift(
        lastReservationCode
      );
    }

    if (savedCodes.length === 0) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      const reservationRequests =
        savedCodes.map(
          async (reservationCode) => {
            try {
              const response =
                await fetch(
                  `${supabaseUrl}/rest/v1/rpc/get_reservation_by_code`,
                  {
                    method: "POST",

                    headers: {
                      apikey:
                        supabaseKey,

                      "Content-Type":
                        "application/json",
                    },

                    body:
                      JSON.stringify({
                        p_code:
                          reservationCode,
                      }),
                  }
                );

              const data =
                await response.json();

              if (
                !response.ok ||
                !data ||
                data.length === 0
              ) {
                return null;
              }

              return data[0];
            } catch (error) {
              console.error(
                "Reservation load error:",
                error
              );

              return null;
            }
          }
        );

      const results =
        await Promise.all(
          reservationRequests
        );

      const validReservations =
        results.filter(Boolean);

      setReservations(
        validReservations
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Nu am putut încărca rezervările."
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

  return (
    <main
      style={{
        minHeight:
          "100vh",

        background:
          "#FAFAF8",

        fontFamily:
          "Arial, sans-serif",

        color:
          "#172033",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          background:
            "white",

          borderBottom:
            "1px solid #ececec",

          padding:
            "18px 6%",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            "20px",

          flexWrap:
            "wrap",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration:
              "none",

            color:
              "#172033",

            fontSize:
              "29px",

            fontWeight:
              "900",

            letterSpacing:
              "-1px",
          }}
        >
          Masago

          <span
            style={{
              color:
                "#FF5A3C",
            }}
          >
            .
          </span>
        </a>

        <a
          href="/"
          style={{
            textDecoration:
              "none",

            color:
              "#485267",

            fontWeight:
              "700",
          }}
        >
          ← Înapoi la restaurante
        </a>
      </header>

      {/* CONTENT */}

      <section
        style={{
          maxWidth:
            "950px",

          margin:
            "0 auto",

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
              margin:
                0,

              color:
                "#FF5A3C",

              fontSize:
                "13px",

              fontWeight:
                "900",

              textTransform:
                "uppercase",

              letterSpacing:
                "1px",
            }}
          >
            Masago
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
              color:
                "#737C8D",

              fontSize:
                "17px",

              lineHeight:
                1.6,

              margin:
                0,
            }}
          >
            Aici găsești rezervările
            făcute de pe acest
            dispozitiv.
          </p>
        </div>

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

        {!loading &&
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
                Nu ai rezervări încă
              </h2>

              <p
                style={{
                  color:
                    "#737C8D",

                  lineHeight:
                    1.6,
                }}
              >
                După ce faci o
                rezervare prin Masago,
                aceasta va apărea aici.
              </p>

              <a
                href="/"
                style={{
                  display:
                    "inline-block",

                  marginTop:
                    "10px",

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

        {!loading &&
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

                          {reservation.discount_percent && (
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
                              % ofertă
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
