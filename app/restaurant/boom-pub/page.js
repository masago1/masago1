"use client";

import { useEffect, useMemo, useState } from "react";

export default function RestaurantPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const [selectedOfferId, setSelectedOfferId] = useState(null);

  useEffect(() => {
    loadOffers();
  }, []);

  function getLocalDate(offset = 0) {
    const currentDate = new Date();

    currentDate.setDate(
      currentDate.getDate() + offset
    );

    const year =
      currentDate.getFullYear();

    const month = String(
      currentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      currentDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today = getLocalDate(0);
  const maxReservationDate =
    getLocalDate(3);

  async function loadOffers(
    preferredOfferId = null
  ) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Conexiunea cu Supabase nu este configurată."
      );

      setOffersLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_offer_availability`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            p_restaurant_name:
              "Boom Pub",

            p_from_date:
              today,

            p_to_date:
              maxReservationDate,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Availability error:",
          data
        );

        setOffers([]);
        return;
      }

      const normalized =
        (data || []).map(
          (offer) => ({
            ...offer,

            capacity:
              Number(
                offer.capacity
              ) || 0,

            reserved_places:
              Number(
                offer.reserved_places
              ) || 0,

            remaining_places:
              Number(
                offer.remaining_places
              ) || 0,
          })
        );

      setOffers(normalized);

      if (!date) {
        setDate(today);
      }

      const currentDate =
        date || today;

      const offersForDay =
        normalized.filter(
          (offer) =>
            offer.offer_date ===
            currentDate
        );

      let offerToSelect = null;

      if (preferredOfferId) {
        offerToSelect =
          offersForDay.find(
            (offer) =>
              offer.id ===
              preferredOfferId
          );
      }

      if (!offerToSelect) {
        offerToSelect =
          offersForDay.find(
            (offer) =>
              offer.remaining_places >
              0
          ) || null;
      }

      if (offerToSelect) {
        setSelectedOfferId(
          offerToSelect.id
        );

        setTime(
          String(
            offerToSelect.start_time
          ).slice(0, 5)
        );
      } else {
        setSelectedOfferId(null);

        if (!time) {
          setTime("19:00");
        }
      }
    } catch (error) {
      console.error(
        "Eroare încărcare oferte:",
        error
      );

      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  }

  const selectedDayOffers =
    useMemo(() => {
      if (!date) return [];

      return offers
        .filter(
          (offer) =>
            offer.offer_date ===
            date
        )
        .sort((a, b) =>
          String(
            a.start_time
          ).localeCompare(
            String(
              b.start_time
            )
          )
        );
    }, [offers, date]);

  const selectedOffer =
    useMemo(() => {
      if (!selectedOfferId) {
        return null;
      }

      return (
        offers.find(
          (offer) =>
            offer.id ===
            selectedOfferId
        ) || null
      );
    }, [
      offers,
      selectedOfferId,
    ]);

  const upcomingDays =
    useMemo(() => {
      return [0, 1, 2, 3].map(
        (offset) => {
          const currentDate =
            getLocalDate(offset);

          const dayOffers =
            offers.filter(
              (offer) =>
                offer.offer_date ===
                currentDate
            );

          const availableOffers =
            dayOffers.filter(
              (offer) =>
                offer.remaining_places >
                0
            );

          return {
            date:
              currentDate,

            offers:
              dayOffers,

            availableOffers,
          };
        }
      );
    }, [offers]);

  function handleDateChange(
    newDate
  ) {
    setDate(newDate);
    setMessage("");

    const offersForDay =
      offers
        .filter(
          (offer) =>
            offer.offer_date ===
            newDate
        )
        .sort((a, b) =>
          String(
            a.start_time
          ).localeCompare(
            String(
              b.start_time
            )
          )
        );

    const firstAvailable =
      offersForDay.find(
        (offer) =>
          offer.remaining_places >
          0
      );

    if (firstAvailable) {
      setSelectedOfferId(
        firstAvailable.id
      );

      setTime(
        String(
          firstAvailable.start_time
        ).slice(0, 5)
      );
    } else {
      setSelectedOfferId(null);
      setTime("19:00");
    }
  }

  function selectOffer(offer) {
    if (
      offer.remaining_places <=
      0
    ) {
      setMessage(
        "Această ofertă este SOLD OUT."
      );

      return;
    }

    setSelectedOfferId(
      offer.id
    );

    setTime(
      String(
        offer.start_time
      ).slice(0, 5)
    );

    setMessage("");
  }

  function generateReservationCode() {
    const randomPart = crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase();

    return `MASAGO-${randomPart}`;
  }

  function formatDateRomanian(
    value
  ) {
    if (!value) return "";

    const [year, month, day] =
      value.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatShortDate(value) {
    if (!value) return "";

    const [, month, day] =
      value.split("-");

    return `${day}/${month}`;
  }

  function formatTime(value) {
    if (!value) return "";

    return String(value).slice(0, 5);
  }

  function getDayLabel(
    value,
    index
  ) {
    if (index === 0) {
      return "Azi";
    }

    if (index === 1) {
      return "Mâine";
    }

    return formatShortDate(value);
  }

  function timeIsInsideOffer() {
    if (!selectedOffer) {
      return true;
    }

    const selectedTime =
      String(time).slice(0, 5);

    const start =
      formatTime(
        selectedOffer.start_time
      );

    const end =
      formatTime(
        selectedOffer.end_time
      );

    return (
      selectedTime >= start &&
      selectedTime <= end
    );
  }

  async function handleReservation() {
    setMessage("");

    if (!date) {
      setMessage(
        "Alege data rezervării."
      );

      return;
    }

    if (!time) {
      setMessage(
        "Alege ora rezervării."
      );

      return;
    }

    if (
      selectedOffer &&
      selectedOffer.remaining_places <=
        0
    ) {
      setMessage(
        "Oferta este SOLD OUT."
      );

      return;
    }

    const guestNumber =
      Number(guests);

    if (
      selectedOffer &&
      guestNumber >
        selectedOffer.remaining_places
    ) {
      setMessage(
        `Oferta mai are doar ${selectedOffer.remaining_places} locuri disponibile.`
      );

      return;
    }

    if (
      selectedOffer &&
      !timeIsInsideOffer()
    ) {
      setMessage(
        `Pentru oferta de -${selectedOffer.discount_percent}%, ora trebuie să fie între ${formatTime(
          selectedOffer.start_time
        )} și ${formatTime(
          selectedOffer.end_time
        )}.`
      );

      return;
    }

    if (!name.trim()) {
      setMessage(
        "Introdu numele."
      );

      return;
    }

    if (!phone.trim()) {
      setMessage(
        "Introdu numărul de telefon."
      );

      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    const reservationCode =
      generateReservationCode();

    setLoading(true);

    try {
      /*
        DACĂ CLIENTUL A ALES OFERTĂ:
        folosim funcția atomică din Supabase.
      */
      if (selectedOffer) {
        const response =
          await fetch(
            `${supabaseUrl}/rest/v1/rpc/create_offer_reservation`,
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
                  p_offer_id:
                    selectedOffer.id,

                  p_restaurant_name:
                    "Boom Pub",

                  p_reservation_date:
                    date,

                  p_reservation_time:
                    time,

                  p_guests:
                    guestNumber,

                  p_customer_name:
                    name.trim(),

                  p_customer_phone:
                    phone.trim(),

                  p_reservation_code:
                    reservationCode,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          console.error(
            "Reservation error:",
            result
          );

          const errorMessage =
            result?.message ||
            result?.error ||
            "Rezervarea nu a putut fi creată.";

          setMessage(
            errorMessage
          );

          /*
            Reîncărcăm capacitatea,
            pentru cazul în care alt client
            a luat ultimele locuri.
          */
          await loadOffers(
            selectedOffer.id
          );

          return;
        }
      } else {
        /*
          FĂRĂ OFERTĂ:
          rezervarea normală rămâne posibilă.
        */

        const response =
          await fetch(
            `${supabaseUrl}/rest/v1/reservations`,
            {
              method: "POST",

              headers: {
                apikey:
                  supabaseKey,

                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal",
              },

              body:
                JSON.stringify({
                  restaurant_name:
                    "Boom Pub",

                  reservation_date:
                    date,

                  reservation_time:
                    time,

                  guests:
                    guestNumber,

                  customer_name:
                    name.trim(),

                  customer_phone:
                    phone.trim(),

                  status:
                    "pending",

                  reservation_code:
                    reservationCode,

                  offer_id:
                    null,

                  discount_percent:
                    null,
                }),
            }
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          setMessage(
            `Eroare Supabase: ${errorText}`
          );

          return;
        }
      }

      const reservationSummary =
        {
          code:
            reservationCode,

          date:
            formatDateRomanian(
              date
            ),

          time,

          guests,

          name:
            name.trim(),

          discount:
            selectedOffer
              ?.discount_percent ||
            null,

          offerId:
            selectedOffer?.id ||
            null,
        };

      localStorage.setItem(
        "masago_last_reservation_code",
        reservationCode
      );

      setConfirmation(
        reservationSummary
      );

      /*
        Reîncărcăm ofertele imediat,
        ca numărul locurilor să scadă
        pe ecran.
      */
      await loadOffers(
        selectedOffer?.id ||
          null
      );

      setGuests("2");
      setName("");
      setPhone("");
    } catch (error) {
      console.error(error);

      setMessage(
        `Eroare: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function makeAnotherReservation() {
    setConfirmation(null);
    setMessage("");
  }

  const fieldStyle = {
    marginBottom: "18px",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "800",
    marginBottom: "8px",
    color: "#172033",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    border:
      "1px solid #dfe3e8",
    borderRadius: "12px",
    fontSize: "16px",
    background: "white",
    color: "#172033",
    outline: "none",
  };

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

          position:
            "sticky",

          top: 0,

          zIndex: 20,
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

      {/* HERO */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #172033 0%, #202C43 100%)",

          color:
            "white",

          padding:
            "55px 6%",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "0 auto",

            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",

            gap:
              "35px",

            alignItems:
              "center",
          }}
        >
          <div>
            <div
              style={{
                display:
                  "inline-block",

                background:
                  "rgba(255,90,60,0.16)",

                color:
                  "#FF8A73",

                border:
                  "1px solid rgba(255,90,60,0.35)",

                borderRadius:
                  "999px",

                padding:
                  "8px 12px",

                fontSize:
                  "14px",

                fontWeight:
                  "800",

                marginBottom:
                  "18px",
              }}
            >
              Pub • Timișoara
            </div>

            <h1
              style={{
                fontSize:
                  "clamp(44px, 6vw, 66px)",

                margin: 0,

                letterSpacing:
                  "-2px",
              }}
            >
              Boom Pub
            </h1>

            <p
              style={{
                fontSize:
                  "18px",

                color:
                  "#cbd2dd",

                lineHeight:
                  1.6,

                maxWidth:
                  "600px",
              }}
            >
              Atmosferă relaxată,
              băuturi și preparate de
              pub, cu oferte în mai
              multe intervale orare.
            </p>

            <div
              style={{
                display:
                  "flex",

                gap:
                  "12px",

                flexWrap:
                  "wrap",

                marginTop:
                  "22px",
              }}
            >
              <span
                style={{
                  background:
                    "white",

                  color:
                    "#172033",

                  padding:
                    "10px 13px",

                  borderRadius:
                    "10px",

                  fontWeight:
                    "800",
                }}
              >
                ⭐ 9.1
              </span>

              {selectedOffer &&
                selectedOffer.remaining_places >
                  0 && (
                  <span
                    style={{
                      background:
                        "#FF5A3C",

                      color:
                        "white",

                      padding:
                        "10px 13px",

                      borderRadius:
                        "10px",

                      fontWeight:
                        "900",
                    }}
                  >
                    -
                    {
                      selectedOffer.discount_percent
                    }
                    %
                  </span>
                )}
            </div>
          </div>

          <div
            style={{
              height:
                "320px",

              borderRadius:
                "22px",

              background:
                "linear-gradient(135deg, #2b3448, #151c2b)",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontSize:
                "110px",

              border:
                "1px solid #334057",

              boxShadow:
                "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            🍻
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <section
        style={{
          maxWidth:
            "1180px",

          margin:
            "0 auto",

          padding:
            "55px 6% 80px",

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",

          gap:
            "30px",

          alignItems:
            "start",
        }}
      >
        {/* OFERTE */}

        <div>
          <div
            style={{
              background:
                "white",

              border:
                "1px solid #ebedf0",

              borderRadius:
                "20px",

              padding:
                "28px",

              marginBottom:
                "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Alege ziua
            </h2>

            {offersLoading ? (
              <div>
                Se încarcă ofertele...
              </div>
            ) : (
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",

                  gap:
                    "10px",
                }}
              >
                {upcomingDays.map(
                  (
                    day,
                    index
                  ) => (
                    <button
                      key={
                        day.date
                      }
                      type="button"
                      onClick={() =>
                        handleDateChange(
                          day.date
                        )
                      }
                      style={{
                        border:
                          date ===
                          day.date
                            ? "2px solid #FF5A3C"
                            : "1px solid #E2E5E9",

                        background:
                          date ===
                          day.date
                            ? "#FFF5F2"
                            : "white",

                        borderRadius:
                          "14px",

                        padding:
                          "15px",

                        textAlign:
                          "left",

                        cursor:
                          "pointer",
                      }}
                    >
                      <strong>
                        {getDayLabel(
                          day.date,
                          index
                        )}
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "5px",
                        }}
                      >
                        {formatDateRomanian(
                          day.date
                        )}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "8px",

                          color:
                            day.availableOffers
                              .length >
                            0
                              ? "#FF5A3C"
                              : "#98A2B3",

                          fontWeight:
                            "900",
                        }}
                      >
                        {day.offers
                          .length ===
                        0
                          ? "Fără ofertă"
                          : day.availableOffers
                              .length ===
                            0
                          ? "SOLD OUT"
                          : `${day.availableOffers.length} ${
                              day
                                .availableOffers
                                .length ===
                              1
                                ? "ofertă"
                                : "oferte"
                            }`}
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div
            style={{
              background:
                "white",

              border:
                "1px solid #E7E9ED",

              borderRadius:
                "20px",

              padding:
                "25px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 20px",
              }}
            >
              Oferte pentru{" "}
              {formatDateRomanian(
                date
              )}
            </h2>

            {selectedDayOffers.length >
            0 ? (
              <div
                style={{
                  display:
                    "grid",

                  gap:
                    "12px",
                }}
              >
                {selectedDayOffers.map(
                  (offer) => {
                    const soldOut =
                      offer.remaining_places <=
                      0;

                    const active =
                      selectedOfferId ===
                      offer.id;

                    return (
                      <div
                        key={
                          offer.id
                        }
                        style={{
                          border:
                            active
                              ? "2px solid #FF5A3C"
                              : "1px solid #E4E7EC",

                          background:
                            soldOut
                              ? "#F4F4F5"
                              : active
                              ? "#FFF5F2"
                              : "white",

                          borderRadius:
                            "16px",

                          padding:
                            "18px",

                          opacity:
                            soldOut
                              ? 0.75
                              : 1,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap:
                              "15px",

                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color:
                                  soldOut
                                    ? "#667085"
                                    : "#FF5A3C",

                                fontSize:
                                  "28px",

                                fontWeight:
                                  "900",
                              }}
                            >
                              -
                              {
                                offer.discount_percent
                              }
                              %
                            </div>

                            <strong>
                              {formatTime(
                                offer.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                offer.end_time
                              )}
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "8px",

                                color:
                                  soldOut
                                    ? "#B42318"
                                    : "#16865C",

                                fontWeight:
                                  "900",
                              }}
                            >
                              {soldOut
                                ? "SOLD OUT"
                                : `${offer.remaining_places} ${
                                    offer.remaining_places ===
                                    1
                                      ? "loc rămas"
                                      : "locuri rămase"
                                  }`}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "5px",

                                color:
                                  "#8A92A0",

                                fontSize:
                                  "13px",
                              }}
                            >
                              Capacitate
                              inițială:{" "}
                              {
                                offer.capacity
                              }
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={
                              soldOut
                            }
                            onClick={() =>
                              selectOffer(
                                offer
                              )
                            }
                            style={{
                              border:
                                "none",

                              background:
                                soldOut
                                  ? "#AEB5C0"
                                  : active
                                  ? "#16865C"
                                  : "#172033",

                              color:
                                "white",

                              borderRadius:
                                "10px",

                              padding:
                                "11px 14px",

                              fontWeight:
                                "900",

                              cursor:
                                soldOut
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {soldOut
                              ? "Indisponibil"
                              : active
                              ? "✓ Selectată"
                              : "Alege oferta"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div
                style={{
                  background:
                    "#F2F4F7",

                  padding:
                    "20px",

                  borderRadius:
                    "14px",

                  color:
                    "#667085",
                }}
              >
                Boom Pub nu a setat
                încă o ofertă pentru
                această zi.
              </div>
            )}
          </div>
        </div>

        {/* REZERVARE */}

        <div
          style={{
            background:
              "white",

            border:
              "1px solid #ebedf0",

            borderRadius:
              "22px",

            padding:
              "30px",

            boxShadow:
              "0 18px 45px rgba(23,32,51,0.08)",
          }}
        >
          {confirmation ? (
            <>
              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "50px",
                  }}
                >
                  ✅
                </div>

                <h2>
                  Rezervare trimisă
                </h2>

                <p>
                  Mulțumim,{" "}
                  {
                    confirmation.name
                  }
                  !
                </p>

                {confirmation.discount && (
                  <div
                    style={{
                      background:
                        "#FFF0EC",

                      color:
                        "#FF5A3C",

                      padding:
                        "14px",

                      borderRadius:
                        "12px",

                      fontWeight:
                        "900",
                    }}
                  >
                    Oferta rezervată:
                    -
                    {
                      confirmation.discount
                    }
                    %
                  </div>
                )}
              </div>

              <div
                style={{
                  margin:
                    "25px 0",

                  padding:
                    "22px",

                  background:
                    "#172033",

                  color:
                    "white",

                  borderRadius:
                    "16px",

                  textAlign:
                    "center",
                }}
              >
                <div>
                  COD REZERVARE
                </div>

                <div
                  style={{
                    fontSize:
                      "27px",

                    fontWeight:
                      "900",

                    marginTop:
                      "8px",
                  }}
                >
                  {
                    confirmation.code
                  }
                </div>
              </div>

              <a
                href="/verifica-rezervare"
                style={{
                  display:
                    "block",

                  background:
                    "#FF5A3C",

                  color:
                    "white",

                  textDecoration:
                    "none",

                  textAlign:
                    "center",

                  padding:
                    "15px",

                  borderRadius:
                    "12px",

                  fontWeight:
                    "900",

                  marginBottom:
                    "12px",
                }}
              >
                Vezi statusul rezervării
              </a>

              <button
                type="button"
                onClick={
                  makeAnotherReservation
                }
                style={{
                  width:
                    "100%",

                  padding:
                    "14px",

                  background:
                    "white",

                  border:
                    "1px solid #DDE1E6",

                  borderRadius:
                    "12px",

                  fontWeight:
                    "900",

                  cursor:
                    "pointer",
                }}
              >
                Fă altă rezervare
              </button>
            </>
          ) : (
            <>
              <p
                style={{
                  color:
                    "#FF5A3C",

                  fontWeight:
                    "900",

                  margin:
                    0,
                }}
              >
                REZERVARE
              </p>

              <h2>
                Rezervă o masă
              </h2>

              {selectedOffer ? (
                <div
                  style={{
                    background:
                      "#FFF0EC",

                    padding:
                      "15px",

                    borderRadius:
                      "12px",

                    marginBottom:
                      "20px",

                    fontWeight:
                      "800",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#FF5A3C",

                      fontSize:
                        "21px",
                    }}
                  >
                    -
                    {
                      selectedOffer.discount_percent
                    }
                    %
                  </strong>

                  <br />

                  {formatTime(
                    selectedOffer.start_time
                  )}{" "}
                  -{" "}
                  {formatTime(
                    selectedOffer.end_time
                  )}

                  <br />

                  <span
                    style={{
                      color:
                        "#16865C",
                    }}
                  >
                    {
                      selectedOffer.remaining_places
                    }{" "}
                    locuri rămase
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background:
                      "#F2F4F7",

                    padding:
                      "15px",

                    borderRadius:
                      "12px",

                    marginBottom:
                      "20px",

                    color:
                      "#667085",
                  }}
                >
                  Restaurantul nu a
                  setat încă o ofertă
                  pentru ziua
                  selectată.
                </div>
              )}

              <div
                style={
                  fieldStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Data
                </label>

                <input
                  type="date"
                  value={date}
                  min={today}
                  max={
                    maxReservationDate
                  }
                  onChange={(e) =>
                    handleDateChange(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div
                style={
                  fieldStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Ora
                </label>

                <input
                  type="time"
                  value={time}
                  onChange={(e) =>
                    setTime(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />
              </div>

              <div
                style={
                  fieldStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Persoane
                </label>

                <select
                  value={
                    guests
                  }
                  onChange={(e) =>
                    setGuests(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  {[
                    1, 2, 3, 4,
                    5, 6, 7, 8,
                  ].map(
                    (number) => (
                      <option
                        key={
                          number
                        }
                        value={
                          number
                        }
                      >
                        {number}{" "}
                        {number ===
                        1
                          ? "persoană"
                          : "persoane"}
                      </option>
                    )
                  )}
                </select>

                {selectedOffer &&
                  Number(
                    guests
                  ) >
                    selectedOffer.remaining_places && (
                    <div
                      style={{
                        color:
                          "#B42318",

                        marginTop:
                          "8px",

                        fontWeight:
                          "800",

                        fontSize:
                          "13px",
                      }}
                    >
                      Nu mai sunt
                      suficiente locuri
                      pentru acest
                      număr de persoane.
                    </div>
                  )}
              </div>

              <div
                style={
                  fieldStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Nume
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Numele tău"
                  style={
                    inputStyle
                  }
                />
              </div>

              <div
                style={
                  fieldStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Telefon
                </label>

                <input
                  value={
                    phone
                  }
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="07xxxxxxxx"
                  style={
                    inputStyle
                  }
                />
              </div>

              <button
                type="button"
                onClick={
                  handleReservation
                }
                disabled={
                  loading ||
                  (selectedOffer &&
                    (selectedOffer.remaining_places <=
                      0 ||
                      Number(
                        guests
                      ) >
                        selectedOffer.remaining_places))
                }
                style={{
                  width:
                    "100%",

                  border:
                    "none",

                  borderRadius:
                    "12px",

                  padding:
                    "16px",

                  background:
                    loading ||
                    (selectedOffer &&
                      (selectedOffer.remaining_places <=
                        0 ||
                        Number(
                          guests
                        ) >
                          selectedOffer.remaining_places))
                      ? "#AEB5C0"
                      : "#FF5A3C",

                  color:
                    "white",

                  fontSize:
                    "17px",

                  fontWeight:
                    "900",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading
                  ? "Se trimite..."
                  : selectedOffer
                  ? `Rezervă cu -${selectedOffer.discount_percent}%`
                  : "Rezervă fără reducere"}
              </button>

              {message && (
                <div
                  style={{
                    marginTop:
                      "18px",

                    padding:
                      "14px",

                    background:
                      "#FFF0EC",

                    color:
                      "#A33A29",

                    borderRadius:
                      "11px",

                    fontWeight:
                      "800",
                  }}
                >
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
