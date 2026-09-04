"use client";

import { useEffect, useMemo, useState } from "react";

export default function RezervarileMelePage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(true);

  const [reviewReservationId, setReviewReservationId] =
    useState(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [
    reviewedReservationIds,
    setReviewedReservationIds,
  ] = useState([]);

  useEffect(() => {
    loadReservations();
  }, []);

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const [year, month, day] = date.split("-");

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

    if (status === "used") {
      return {
        label: "Folosită",
        background: "#EEF2FF",
        color: "#3448A5",
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

  function getReservationDateTime(reservation) {
    if (!reservation?.reservation_date) {
      return null;
    }

    const time = reservation.reservation_time
      ? String(reservation.reservation_time).slice(0, 5)
      : "23:59";

    const value = new Date(
      `${reservation.reservation_date}T${time}:00`
    );

    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value;
  }

  function isReservationPast(reservation) {
    const reservationDateTime =
      getReservationDateTime(reservation);

    if (!reservationDateTime) {
      return false;
    }

    return reservationDateTime.getTime() < Date.now();
  }

  async function refreshSession(
    supabaseUrl,
    supabaseKey
  ) {
    const refreshToken = localStorage.getItem(
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
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.access_token) {
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
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({}),
      }
    );
  }

  async function loadReservations() {
    setLoading(true);
    setMessage("");

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      setLoading(false);
      return;
    }

    let accessToken = localStorage.getItem(
      "masago_client_access_token"
    );

    if (!accessToken) {
      setLoggedIn(false);
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      let response = await requestReservations(
        supabaseUrl,
        supabaseKey,
        accessToken
      );

      if (response.status === 401) {
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

        accessToken = newAccessToken;

        response = await requestReservations(
          supabaseUrl,
          supabaseKey,
          accessToken
        );
      }

      const data = await response.json();

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

      const visibleReservations = (
        data || []
      ).filter(
        (reservation) =>
          !hiddenCodes.includes(
            reservation.reservation_code
          )
      );

      setReservations(visibleReservations);
      setLoggedIn(true);

      /*
        Încărcăm review-urile deja trimise
        de utilizator.
      */

      try {
        const clientUser = JSON.parse(
          localStorage.getItem(
            "masago_client_user"
          ) || "{}"
        );

        if (clientUser?.id) {
          const reviewsResponse = await fetch(
            `${supabaseUrl}/rest/v1/reviews?user_id=eq.${encodeURIComponent(
              clientUser.id
            )}&select=reservation_id`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );

          if (reviewsResponse.ok) {
            const reviewsData =
              await reviewsResponse.json();

            setReviewedReservationIds(
              (reviewsData || []).map(
                (review) =>
                  review.reservation_id
              )
            );
          }
        }
      } catch (reviewLoadError) {
        console.error(
          "Load reviews error:",
          reviewLoadError
        );
      }
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
    const confirmed = window.confirm(
      "Vrei să elimini această rezervare din lista ta?"
    );

    if (!confirmed) {
      return;
    }

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
      JSON.stringify(hiddenCodes)
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

    window.location.href = "/";
  }

  function openReviewForm(
    reservation
  ) {
    setMessage("");
    setReviewReservationId(
      reservation.id
    );
    setReviewRating(5);
    setReviewComment("");
  }

  function closeReviewForm() {
    setReviewReservationId(null);
    setReviewRating(5);
    setReviewComment("");
  }

  async function submitReview(
    reservation
  ) {
    if (!reservation?.id) {
      setMessage(
        "Rezervarea nu a putut fi identificată."
      );
      return;
    }

    if (!reservation?.restaurant_id) {
      setMessage(
        "Restaurantul nu a putut fi identificat."
      );
      return;
    }

    if (!reservation?.used_at) {
      setMessage(
        "Poți lăsa un review doar după ce rezervarea a fost folosită la restaurant."
      );
      return;
    }

    if (
      reviewedReservationIds.includes(
        reservation.id
      )
    ) {
      setMessage(
        "Ai trimis deja un review pentru această rezervare."
      );
      return;
    }

    if (
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      setMessage(
        "Alege un rating între 1 și 5 stele."
      );
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setMessage(
        "Trebuie să fii autentificat pentru a lăsa un review."
      );
      return;
    }

    let clientUser = {};

    try {
      clientUser = JSON.parse(
        localStorage.getItem(
          "masago_client_user"
        ) || "{}"
      );
    } catch {
      clientUser = {};
    }

    if (!clientUser?.id) {
      setMessage(
        "Nu am putut identifica utilizatorul autentificat."
      );
      return;
    }

    setReviewLoading(true);
    setMessage("");

    try {
      let response = await fetch(
        `${supabaseUrl}/rest/v1/reviews`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
            Prefer:
              "return=representation",
          },

          body: JSON.stringify({
            reservation_id:
              reservation.id,

            restaurant_id:
              reservation.restaurant_id,

            user_id:
              clientUser.id,

            rating:
              reviewRating,

            comment:
              reviewComment.trim() ||
              null,
          }),
        }
      );

      /*
        Dacă tokenul a expirat,
        încercăm refresh automat.
      */

      if (response.status === 401) {
        const newAccessToken =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!newAccessToken) {
          clearClientSession();
          setLoggedIn(false);

          setMessage(
            "Sesiunea a expirat. Intră din nou în cont."
          );

          return;
        }

        accessToken = newAccessToken;

        response = await fetch(
          `${supabaseUrl}/rest/v1/reviews`,
          {
            method: "POST",

            headers: {
              apikey: supabaseKey,
              Authorization:
                `Bearer ${accessToken}`,
              "Content-Type":
                "application/json",
              Prefer:
                "return=representation",
            },

            body: JSON.stringify({
              reservation_id:
                reservation.id,

              restaurant_id:
                reservation.restaurant_id,

              user_id:
                clientUser.id,

              rating:
                reviewRating,

              comment:
                reviewComment.trim() ||
                null,
            }),
          }
        );
      }

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        console.error(
          "Create review error:",
          data
        );

        if (
          response.status === 409 ||
          data?.code === "23505"
        ) {
          setReviewedReservationIds(
            (current) => [
              ...new Set([
                ...current,
                reservation.id,
              ]),
            ]
          );

          setReviewReservationId(null);

          setMessage(
            "Ai trimis deja un review pentru această rezervare."
          );

          return;
        }

        setMessage(
          data?.message ||
            data?.error ||
            "Nu am putut trimite review-ul."
        );

        return;
      }

      setReviewedReservationIds(
        (current) => [
          ...new Set([
            ...current,
            reservation.id,
          ]),
        ]
      );

      setReviewReservationId(null);
      setReviewRating(5);
      setReviewComment("");

      setMessage(
        "Review-ul a fost trimis cu succes."
      );
    } catch (error) {
      console.error(
        "Submit review error:",
        error
      );

      setMessage(
        "A apărut o eroare la trimiterea review-ului."
      );
    } finally {
      setReviewLoading(false);
    }
  }

  const activeReservations =
    useMemo(() => {
      return reservations
        .filter((reservation) => {
          const status =
            reservation.status;

          if (
            status === "cancelled" ||
            status === "rejected" ||
            status === "used"
          ) {
            return false;
          }

          return !isReservationPast(
            reservation
          );
        })
        .sort((a, b) => {
          const aDate =
            getReservationDateTime(a);

          const bDate =
            getReservationDateTime(b);

          if (!aDate && !bDate) {
            return 0;
          }

          if (!aDate) {
            return 1;
          }

          if (!bDate) {
            return -1;
          }

          return (
            aDate.getTime() -
            bDate.getTime()
          );
        });
    }, [reservations]);

  const historyReservations =
    useMemo(() => {
      return reservations
        .filter((reservation) => {
          const status =
            reservation.status;

          return (
            status === "used" ||
            status === "cancelled" ||
            status === "rejected" ||
            isReservationPast(
              reservation
            )
          );
        })
        .sort((a, b) => {
          const aDate =
            getReservationDateTime(a);

          const bDate =
            getReservationDateTime(b);

          if (!aDate && !bDate) {
            return 0;
          }

          if (!aDate) {
            return 1;
          }

          if (!bDate) {
            return -1;
          }

          return (
            bDate.getTime() -
            aDate.getTime()
          );
        });
    }, [reservations]);

  function renderReservationCard(
    reservation
  ) {
    const status = getStatusData(
      reservation.status
    );

    const reviewAlreadySent =
      reviewedReservationIds.includes(
        reservation.id
      );

    const canReview =
      Boolean(reservation.used_at) &&
      !reviewAlreadySent;

    const reviewFormOpen =
      reviewReservationId ===
      reservation.id;

    return (
      <article
        key={reservation.id}
        style={{
          background: "white",
          border:
            "1px solid #E7E9ED",
          borderRadius: "20px",
          padding: "24px",
          boxShadow:
            "0 8px 25px rgba(23,32,51,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
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
              }}
            >
              Restaurant
            </div>

            <h2
              style={{
                margin:
                  "6px 0 5px",
                fontSize: "24px",
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
            {status.label}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "16px",
            marginTop: "22px",
            paddingTop: "20px",
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

        {reviewAlreadySent && (
          <div
            style={{
              marginTop: "20px",
              padding:
                "14px 16px",
              borderRadius:
                "12px",
              background:
                "#E9F8EF",
              color:
                "#16865C",
              fontWeight:
                "900",
            }}
          >
            ✓ Ai trimis deja un review
            pentru această rezervare.
          </div>
        )}

        {canReview &&
          !reviewFormOpen && (
            <button
              type="button"
              onClick={() =>
                openReviewForm(
                  reservation
                )
              }
              style={{
                width: "100%",
                marginTop:
                  "20px",
                border:
                  "1px solid #FFD0C6",
                borderRadius:
                  "11px",
                padding:
                  "14px",
                background:
                  "#FFF4F1",
                color:
                  "#FF5A3C",
                fontWeight:
                  "900",
                fontSize:
                  "15px",
                cursor:
                  "pointer",
              }}
            >
              ⭐ Lasă un review
            </button>
          )}

        {canReview &&
          reviewFormOpen && (
            <div
              style={{
                marginTop:
                  "20px",
                padding:
                  "20px",
                background:
                  "#FAFAF8",
                border:
                  "1px solid #E7E9ED",
                borderRadius:
                  "16px",
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 6px",
                  fontSize:
                    "20px",
                }}
              >
                Cum a fost experiența?
              </h3>

              <p
                style={{
                  margin:
                    "0 0 16px",
                  color:
                    "#737C8D",
                  lineHeight:
                    1.5,
                }}
              >
                Acordă un rating
                restaurantului și,
                opțional, scrie câteva
                cuvinte despre experiență.
              </p>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "6px",
                  marginBottom:
                    "16px",
                  flexWrap:
                    "wrap",
                }}
              >
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewRating(
                          star
                        )
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "transparent",
                        padding: "2px",
                        cursor:
                          "pointer",
                        fontSize:
                          "30px",
                        lineHeight: 1,
                        opacity:
                          star <=
                          reviewRating
                            ? 1
                            : 0.3,
                      }}
                      aria-label={`${star} stele`}
                    >
                      ⭐
                    </button>
                  )
                )}
              </div>

              <div
                style={{
                  marginBottom:
                    "8px",
                  fontWeight:
                    "900",
                }}
              >
                {reviewRating} din 5
                stele
              </div>

              <textarea
                value={
                  reviewComment
                }
                onChange={(event) =>
                  setReviewComment(
                    event.target.value
                  )
                }
                placeholder="Scrie experiența ta..."
                maxLength={1000}
                style={{
                  width: "100%",
                  minHeight:
                    "110px",
                  resize:
                    "vertical",
                  boxSizing:
                    "border-box",
                  border:
                    "1px solid #D8DDE5",
                  borderRadius:
                    "11px",
                  padding:
                    "13px",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "15px",
                  outline:
                    "none",
                }}
              />

              <div
                style={{
                  marginTop:
                    "6px",
                  color:
                    "#8A92A0",
                  fontSize:
                    "12px",
                  textAlign:
                    "right",
                }}
              >
                {
                  reviewComment.length
                }
                /1000
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "10px",
                  marginTop:
                    "14px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  disabled={
                    reviewLoading
                  }
                  onClick={() =>
                    submitReview(
                      reservation
                    )
                  }
                  style={{
                    flex: "1 1 220px",
                    border:
                      "none",
                    borderRadius:
                      "11px",
                    padding:
                      "14px",
                    background:
                      "#FF5A3C",
                    color:
                      "white",
                    fontWeight:
                      "900",
                    cursor:
                      reviewLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      reviewLoading
                        ? 0.65
                        : 1,
                  }}
                >
                  {reviewLoading
                    ? "Se trimite..."
                    : "Trimite review-ul"}
                </button>

                <button
                  type="button"
                  disabled={
                    reviewLoading
                  }
                  onClick={
                    closeReviewForm
                  }
                  style={{
                    flex: "0 1 150px",
                    border:
                      "1px solid #E4E7EC",
                    borderRadius:
                      "11px",
                    padding:
                      "14px",
                    background:
                      "white",
                    color:
                      "#667085",
                    fontWeight:
                      "900",
                    cursor:
                      reviewLoading
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Renunță
                </button>
              </div>
            </div>
          )}

        <button
          type="button"
          onClick={() =>
            openReservation(
              reservation.reservation_code
            )
          }
          style={{
            width: "100%",
            marginTop: "20px",
            border: "none",
            borderRadius:
              "11px",
            padding: "14px",
            background:
              "#172033",
            color: "white",
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
            width: "100%",
            marginTop: "10px",
            border:
              "1px solid #E4E7EC",
            borderRadius:
              "11px",
            padding: "13px",
            background: "white",
            color: "#667085",
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
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #ECEEF1",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "#FF5A3C",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "18px",
              }}
            >
              M
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: "900",
                color: "#172033",
              }}
            >
              Masago
            </div>
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                border: "1px solid #E4E7EC",
                background: "white",
                color: "#172033",
                borderRadius: "10px",
                padding: "11px 16px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Restaurante
            </button>

            {loggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  border: "none",
                  background: "#172033",
                  color: "white",
                  borderRadius: "10px",
                  padding: "11px 16px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Ieși din cont
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "48px 20px 80px",
        }}
      >
        <div
          style={{
            marginBottom: "34px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFF0EC",
              color: "#FF5A3C",
              padding: "8px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}
          >
            Contul meu
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px, 5vw, 48px)",
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
            }}
          >
            Rezervările mele
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              color: "#737C8D",
              fontSize: "16px",
              lineHeight: 1.7,
              maxWidth: "650px",
            }}
          >
            Vezi rezervările tale active, istoricul
            vizitelor și lasă un review după ce ai
            folosit o rezervare.
          </p>
        </div>

        {/* MESAJ GENERAL */}
        {message && (
          <div
            style={{
              marginBottom: "24px",
              padding: "15px 17px",
              background: "#FFF4DD",
              border: "1px solid #F5D99B",
              borderRadius: "12px",
              color: "#7A5A00",
              fontWeight: "800",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div
            style={{
              background: "white",
              border: "1px solid #E7E9ED",
              borderRadius: "20px",
              padding: "40px 24px",
              textAlign: "center",
              color: "#737C8D",
              fontWeight: "800",
            }}
          >
            Se încarcă rezervările...
          </div>
        )}

        {/* NU ESTE LOGAT */}
        {!loading && !loggedIn && (
          <div
            style={{
              background: "white",
              border: "1px solid #E7E9ED",
              borderRadius: "22px",
              padding: "40px 28px",
              textAlign: "center",
              boxShadow:
                "0 10px 30px rgba(23,32,51,0.04)",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                margin: "0 auto 18px",
                borderRadius: "18px",
                background: "#FFF0EC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
              }}
            >
              👤
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "25px",
              }}
            >
              Intră în cont
            </h2>

            <p
              style={{
                margin: "0 auto",
                maxWidth: "500px",
                color: "#737C8D",
                lineHeight: 1.7,
              }}
            >
              Trebuie să fii autentificat pentru a
              vedea rezervările tale.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/login";
              }}
              style={{
                marginTop: "22px",
                border: "none",
                borderRadius: "11px",
                padding: "14px 22px",
                background: "#FF5A3C",
                color: "white",
                fontWeight: "900",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Intră în cont
            </button>
          </div>
        )}

        {/* UTILIZATOR LOGAT */}
        {!loading && loggedIn && (
          <>
            {/* REZERVĂRI ACTIVE */}
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "25px",
                    }}
                  >
                    Rezervări active
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#8A92A0",
                      fontSize: "14px",
                    }}
                  >
                    Rezervările care urmează.
                  </p>
                </div>

                <div
                  style={{
                    minWidth: "38px",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "999px",
                    background: "#172033",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "900",
                  }}
                >
                  {activeReservations.length}
                </div>
              </div>

              {activeReservations.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E7E9ED",
                    borderRadius: "20px",
                    padding: "30px 24px",
                    color: "#737C8D",
                    lineHeight: 1.6,
                  }}
                >
                  Nu ai nicio rezervare activă în
                  acest moment.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "18px",
                  }}
                >
                  {activeReservations.map(
                    renderReservationCard
                  )}
                </div>
              )}
            </section>

            {/* ISTORIC */}
            <section
              style={{
                marginTop: "50px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "25px",
                    }}
                  >
                    Istoric
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#8A92A0",
                      fontSize: "14px",
                    }}
                  >
                    Rezervările trecute, folosite,
                    anulate sau respinse.
                  </p>
                </div>

                <div
                  style={{
                    minWidth: "38px",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "999px",
                    background: "#EEF0F3",
                    color: "#667085",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "900",
                  }}
                >
                  {historyReservations.length}
                </div>
              </div>

              {historyReservations.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E7E9ED",
                    borderRadius: "20px",
                    padding: "30px 24px",
                    color: "#737C8D",
                    lineHeight: 1.6,
                  }}
                >
                  Istoricul tău este momentan gol.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "18px",
                  }}
                >
                  {historyReservations.map(
                    renderReservationCard
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div
        style={{
          color: "#8A92A0",
          fontSize: "11px",
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#172033",
          fontSize: "15px",
          fontWeight: "900",
        }}
      >
        {value}
      </div>
    </div>
  );
}
