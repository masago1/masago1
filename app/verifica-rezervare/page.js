"use client";

import { useEffect, useState } from "react";

export default function VerificaRezervarePage() {
  const [code, setCode] = useState("");
  const [reservation, setReservation] = useState(null);
  const [offer, setOffer] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const savedCode =
      localStorage.getItem(
        "masago_last_reservation_code"
      );

    if (savedCode) {
      setCode(savedCode);

      checkReservationByCode(
        savedCode
      );
    }
  }, []);

  function formatDate(date) {
    if (!date) return "";

    const [
      year,
      month,
      day,
    ] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatTime(time) {
    if (!time) return "";

    return String(time).slice(0, 5);
  }

  function getStatusData(status) {
    if (status === "accepted") {
      return {
        title:
          "Rezervare confirmată",

        text:
          "Restaurantul a confirmat rezervarea ta.",

        icon:
          "✓",

        background:
          "#E9F8EF",

        color:
          "#16865C",
      };
    }

    if (status === "rejected") {
      return {
        title:
          "Rezervare respinsă",

        text:
          "Restaurantul nu a putut confirma această rezervare.",

        icon:
          "✕",

        background:
          "#FDECEC",

        color:
          "#B42318",
      };
    }

    if (status === "cancelled") {
      return {
        title:
          "Rezervare anulată",

        text:
          "Această rezervare a fost anulată.",

        icon:
          "✕",

        background:
          "#F2F4F7",

        color:
          "#667085",
      };
    }

    return {
      title:
        "În așteptare",

      text:
        "Restaurantul nu a răspuns încă solicitării tale.",

      icon:
        "⏳",

      background:
        "#FFF4DD",

      color:
        "#8A6500",
    };
  }

  async function loadOfferDetails(
    offerId,
    supabaseUrl,
    supabaseKey
  ) {
    if (!offerId) {
      setOffer(null);
      return;
    }

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/offers?id=eq.${offerId}&select=id,offer_date,start_time,end_time,discount_percent,capacity&limit=1`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Offer details error:",
          data
        );

        setOffer(null);
        return;
      }

      if (
        data &&
        data.length > 0
      ) {
        setOffer(
          data[0]
        );
      } else {
        setOffer(null);
      }
    } catch (error) {
      console.error(
        "Offer details error:",
        error
      );

      setOffer(null);
    }
  }

  async function checkReservationByCode(
    reservationCode
  ) {
    const cleanCode =
      reservationCode
        .trim()
        .toUpperCase();

    if (!cleanCode) {
      setMessage(
        "Introdu codul rezervării."
      );

      return;
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    setLoading(true);
    setMessage("");
    setReservation(null);
    setOffer(null);

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/rpc/get_reservation_by_code`,
          {
            method:
              "POST",

            headers: {
              apikey:
                supabaseKey,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                p_code:
                  cleanCode,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          data
        );

        setMessage(
          "Nu am putut verifica rezervarea."
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setMessage(
          "Nu am găsit nicio rezervare cu acest cod."
        );

        return;
      }

      const foundReservation =
        data[0];

      setReservation(
        foundReservation
      );

      if (
        foundReservation.offer_id
      ) {
        await loadOfferDetails(
          foundReservation.offer_id,
          supabaseUrl,
          supabaseKey
        );
      }
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "A apărut o eroare la verificare."
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkReservation(
    e
  ) {
    e.preventDefault();

    await checkReservationByCode(
      code
    );
  }

  async function cancelReservation() {
    if (!reservation) {
      return;
    }

    const confirmed =
      window.confirm(
        reservation.status ===
          "accepted"
          ? "Rezervarea este deja confirmată. Dacă o anulezi, locurile vor deveni din nou disponibile. Vrei să continui?"
          : "Sigur vrei să anulezi această rezervare?"
      );

    if (!confirmed) {
      return;
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    setCancelling(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/rpc/cancel_reservation_by_code`,
          {
            method:
              "POST",

            headers: {
              apikey:
                supabaseKey,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                p_code:
                  reservation.reservation_code,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Cancel reservation error:",
          data
        );

        setMessage(
          data?.message ||
            data?.error ||
            "Rezervarea nu a putut fi anulată."
        );

        return;
      }

      setReservation(
        (current) => ({
          ...current,
          status:
            "cancelled",
        })
      );

      setMessage(
        "✓ Rezervarea a fost anulată."
      );
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "A apărut o eroare la anularea rezervării."
      );
    } finally {
      setCancelling(false);
    }
  }

  const statusData =
    reservation
      ? getStatusData(
          reservation.status
        )
      : null;

  const discount =
    reservation
      ?.discount_percent ||
    offer
      ?.discount_percent ||
    null;

  const canCancel =
    reservation &&
    (
      reservation.status ===
        "pending" ||
      reservation.status ===
        "accepted"
    );

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
          ← Înapoi
        </a>
      </header>

      {/* CONTENT */}

      <section
        style={{
          padding:
            "75px 6%",
        }}
      >
        <div
          style={{
            maxWidth:
              "650px",

            margin:
              "0 auto",
          }}
        >
          <div
            style={{
              textAlign:
                "center",

              marginBottom:
                "30px",
            }}
          >
            <p
              style={{
                color:
                  "#FF5A3C",

                fontWeight:
                  "900",

                textTransform:
                  "uppercase",

                letterSpacing:
                  "1px",

                fontSize:
                  "13px",
              }}
            >
              Rezervarea mea
            </p>

            <h1
              style={{
                fontSize:
                  "42px",

                margin:
                  "8px 0",
              }}
            >
              Statusul rezervării
            </h1>

            <p
              style={{
                color:
                  "#737C8D",

                lineHeight:
                  1.6,
              }}
            >
              Verifică statusul și
              detaliile rezervării
              tale Masago.
            </p>
          </div>

          <div
            style={{
              background:
                "white",

              border:
                "1px solid #E7E9ED",

              borderRadius:
                "22px",

              padding:
                "30px",

              boxShadow:
                "0 12px 35px rgba(23,32,51,0.06)",
            }}
          >
            {/* SEARCH */}

            <form
              onSubmit={
                checkReservation
              }
            >
              <label
                style={{
                  display:
                    "block",

                  fontWeight:
                    "800",

                  marginBottom:
                    "8px",
                }}
              >
                Cod rezervare
              </label>

              <input
                type="text"

                value={
                  code
                }

                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase()
                  )
                }

                placeholder="MASAGO-ABC12345"

                style={{
                  width:
                    "100%",

                  boxSizing:
                    "border-box",

                  padding:
                    "16px",

                  borderRadius:
                    "12px",

                  border:
                    "1px solid #DDE1E6",

                  fontSize:
                    "17px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "1px",

                  outline:
                    "none",
                }}
              />

              <button
                type="submit"

                disabled={
                  loading
                }

                style={{
                  width:
                    "100%",

                  marginTop:
                    "14px",

                  padding:
                    "16px",

                  borderRadius:
                    "12px",

                  border:
                    "none",

                  background:
                    loading
                      ? "#aaa"
                      : "#FF5A3C",

                  color:
                    "white",

                  fontWeight:
                    "900",

                  fontSize:
                    "16px",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading
                  ? "Se verifică..."
                  : reservation
                  ? "Actualizează statusul"
                  : "Verifică rezervarea"}
              </button>
            </form>

            {/* MESSAGE */}

            {message && (
              <div
                style={{
                  marginTop:
                    "20px",

                  padding:
                    "14px",

                  borderRadius:
                    "11px",

                  background:
                    message.startsWith(
                      "✓"
                    )
                      ? "#E9F8EF"
                      : "#FFF0EC",

                  color:
                    message.startsWith(
                      "✓"
                    )
                      ? "#16865C"
                      : "#A33A29",

                  fontWeight:
                    "800",

                  textAlign:
                    "center",
                }}
              >
                {
                  message
                }
              </div>
            )}

            {/* RESERVATION */}

            {reservation &&
              statusData && (
                <div
                  style={{
                    marginTop:
                      "28px",
                  }}
                >
                  {/* STATUS */}

                  <div
                    style={{
                      background:
                        statusData.background,

                      color:
                        statusData.color,

                      borderRadius:
                        "16px",

                      padding:
                        "22px",

                      textAlign:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "56px",

                        height:
                          "56px",

                        borderRadius:
                          "50%",

                        margin:
                          "0 auto 10px",

                        background:
                          "rgba(255,255,255,0.7)",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        fontSize:
                          "30px",

                        fontWeight:
                          "900",
                      }}
                    >
                      {
                        statusData.icon
                      }
                    </div>

                    <h2
                      style={{
                        margin:
                          "8px 0",
                      }}
                    >
                      {
                        statusData.title
                      }
                    </h2>

                    <p
                      style={{
                        margin:
                          0,

                        lineHeight:
                          1.6,
                      }}
                    >
                      {
                        statusData.text
                      }
                    </p>
                  </div>

                  {/* OFFER */}

                  {discount && (
                    <div
                      style={{
                        marginTop:
                          "18px",

                        background:
                          "#FFF0EC",

                        border:
                          "1px solid #FFD8CF",

                        borderRadius:
                          "16px",

                        padding:
                          "20px",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "#FF5A3C",

                          fontWeight:
                            "900",

                          fontSize:
                            "13px",

                          textTransform:
                            "uppercase",

                          letterSpacing:
                            "0.7px",

                          marginBottom:
                            "6px",
                        }}
                      >
                        Oferta rezervată
                      </div>

                      <div
                        style={{
                          color:
                            "#FF5A3C",

                          fontSize:
                            "32px",

                          fontWeight:
                            "900",
                        }}
                      >
                        -
                        {
                          discount
                        }
                        %
                      </div>

                      {offer && (
                        <div
                          style={{
                            marginTop:
                              "12px",

                            color:
                              "#667085",

                            lineHeight:
                              1.7,

                            fontWeight:
                              "700",
                          }}
                        >
                          📅{" "}
                          {formatDate(
                            offer.offer_date
                          )}

                          <br />

                          🕐{" "}
                          {formatTime(
                            offer.start_time
                          )}{" "}
                          -{" "}
                          {formatTime(
                            offer.end_time
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!discount && (
                    <div
                      style={{
                        marginTop:
                          "18px",

                        background:
                          "#F2F4F7",

                        border:
                          "1px solid #E4E7EC",

                        borderRadius:
                          "16px",

                        padding:
                          "17px",

                        color:
                          "#667085",

                        fontWeight:
                          "800",
                      }}
                    >
                      ℹ️ Această rezervare
                      nu este asociată
                      unei oferte Masago.
                    </div>
                  )}

                  {/* DETAILS */}

                  <div
                    style={{
                      marginTop:
                        "20px",

                      border:
                        "1px solid #E7E9ED",

                      borderRadius:
                        "16px",

                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={
                        rowStyle
                      }
                    >
                      <span
                        style={
                          rowLabel
                        }
                      >
                        Restaurant
                      </span>

                      <strong>
                        {reservation.restaurant_name ||
                          "-"}
                      </strong>
                    </div>

                    <div
                      style={
                        rowStyle
                      }
                    >
                      <span
                        style={
                          rowLabel
                        }
                      >
                        Data
                      </span>

                      <strong>
                        {formatDate(
                          reservation.reservation_date
                        )}
                      </strong>
                    </div>

                    <div
                      style={
                        rowStyle
                      }
                    >
                      <span
                        style={
                          rowLabel
                        }
                      >
                        Ora
                      </span>

                      <strong>
                        {formatTime(
                          reservation.reservation_time
                        )}
                      </strong>
                    </div>

                    <div
                      style={
                        rowStyle
                      }
                    >
                      <span
                        style={
                          rowLabel
                        }
                      >
                        Persoane
                      </span>

                      <strong>
                        {
                          reservation.guests
                        }
                      </strong>
                    </div>

                    {discount && (
                      <div
                        style={
                          rowStyle
                        }
                      >
                        <span
                          style={
                            rowLabel
                          }
                        >
                          Reducere
                        </span>

                        <strong
                          style={{
                            color:
                              "#FF5A3C",
                          }}
                        >
                          -
                          {
                            discount
                          }
                          %
                        </strong>
                      </div>
                    )}

                    {offer && (
                      <div
                        style={
                          rowStyle
                        }
                      >
                        <span
                          style={
                            rowLabel
                          }
                        >
                          Interval ofertă
                        </span>

                        <strong>
                          {formatTime(
                            offer.start_time
                          )}{" "}
                          -{" "}
                          {formatTime(
                            offer.end_time
                          )}
                        </strong>
                      </div>
                    )}

                    <div
                      style={{
                        ...rowStyle,

                        borderBottom:
                          "none",
                      }}
                    >
                      <span
                        style={
                          rowLabel
                        }
                      >
                        Cod
                      </span>

                      <strong>
                        {
                          reservation.reservation_code
                        }
                      </strong>
                    </div>
                  </div>

                  {/* PENDING */}

                  {reservation.status ===
                    "pending" && (
                    <div
                      style={{
                        marginTop:
                          "18px",

                        padding:
                          "16px",

                        background:
                          "#F8F9FB",

                        border:
                          "1px solid #E7E9ED",

                        borderRadius:
                          "13px",

                        color:
                          "#667085",

                        fontSize:
                          "14px",

                        lineHeight:
                          1.6,
                      }}
                    >
                      ⏳ Poți reveni și
                      apăsa{" "}
                      <strong>
                        „Actualizează statusul”
                      </strong>{" "}
                      pentru a vedea
                      răspunsul
                      restaurantului.
                    </div>
                  )}

                  {/* ACCEPTED */}

                  {reservation.status ===
                    "accepted" && (
                    <div
                      style={{
                        marginTop:
                          "18px",

                        padding:
                          "16px",

                        background:
                          "#E9F8EF",

                        border:
                          "1px solid #CDEEDB",

                        borderRadius:
                          "13px",

                        color:
                          "#16865C",

                        fontWeight:
                          "800",

                        lineHeight:
                          1.6,
                      }}
                    >
                      ✓ Rezervarea ta este
                      confirmată. Prezintă
                      codul{" "}
                      <strong>
                        {
                          reservation.reservation_code
                        }
                      </strong>{" "}
                      la restaurant.
                    </div>
                  )}

                  {/* CANCELLED */}

                  {reservation.status ===
                    "cancelled" && (
                    <div
                      style={{
                        marginTop:
                          "18px",

                        padding:
                          "16px",

                        background:
                          "#F2F4F7",

                        border:
                          "1px solid #E4E7EC",

                        borderRadius:
                          "13px",

                        color:
                          "#667085",

                        fontWeight:
                          "800",

                        lineHeight:
                          1.6,
                      }}
                    >
                      Rezervarea a fost
                      anulată. Dacă era
                      confirmată, locurile
                      au devenit din nou
                      disponibile.
                    </div>
                  )}

                  {/* REJECTED */}

                  {reservation.status ===
                    "rejected" && (
                    <div
                      style={{
                        marginTop:
                          "18px",

                        padding:
                          "16px",

                        background:
                          "#FDECEC",

                        border:
                          "1px solid #F8CACA",

                        borderRadius:
                          "13px",

                        color:
                          "#B42318",

                        fontWeight:
                          "800",

                        lineHeight:
                          1.6,
                      }}
                    >
                      Rezervarea nu a
                      putut fi confirmată
                      de restaurant.
                    </div>
                  )}

                  {/* CANCEL BUTTON */}

                  {canCancel && (
                    <button
                      type="button"

                      onClick={
                        cancelReservation
                      }

                      disabled={
                        cancelling
                      }

                      style={{
                        width:
                          "100%",

                        marginTop:
                          "20px",

                        padding:
                          "14px 16px",

                        borderRadius:
                          "12px",

                        border:
                          "1px solid #F1C6C0",

                        background:
                          cancelling
                            ? "#F2F4F7"
                            : "#FFF5F2",

                        color:
                          "#B42318",

                        fontWeight:
                          "900",

                        fontSize:
                          "15px",

                        cursor:
                          cancelling
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {cancelling
                        ? "Se anulează..."
                        : "Anulează rezervarea"}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </section>
    </main>
  );
}

const rowStyle = {
  padding:
    "15px 17px",

  display:
    "flex",

  justifyContent:
    "space-between",

  alignItems:
    "center",

  gap:
    "20px",

  borderBottom:
    "1px solid #EEF0F2",
};

const rowLabel = {
  color:
    "#7A8393",

  fontWeight:
    "700",
};
