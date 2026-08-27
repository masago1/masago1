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

    const year = currentDate.getFullYear();

    const month = String(
      currentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      currentDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today = getLocalDate(0);

  // Clientul poate rezerva azi + următoarele 3 zile
  const maxReservationDate = getLocalDate(3);

  async function loadOffers() {
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
      // 1. Găsim Boom Pub în tabela restaurants
      const restaurantResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?name=eq.${encodeURIComponent(
          "Boom Pub"
        )}&select=id,name&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const restaurantData =
        await restaurantResponse.json();

      if (
        !restaurantResponse.ok ||
        !restaurantData?.[0]
      ) {
        console.error(
          "Nu am găsit Boom Pub:",
          restaurantData
        );

        setOffers([]);
        return;
      }

      const restaurantId =
        restaurantData[0].id;

      // 2. Luăm TOATE ofertele active din următoarele 4 zile
      const offersResponse = await fetch(
        `${supabaseUrl}/rest/v1/offers?restaurant_id=eq.${restaurantId}&active=eq.true&offer_date=gte.${today}&offer_date=lte.${maxReservationDate}&select=*&order=offer_date.asc,start_time.asc,id.desc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const offersData =
        await offersResponse.json();

      if (!offersResponse.ok) {
        console.error(
          "Offers error:",
          offersData
        );

        setOffers([]);
        return;
      }

      setOffers(offersData || []);

      // 3. Selectăm azi automat
      setDate(today);

      const todayOffers = (
        offersData || []
      ).filter(
        (offer) =>
          offer.offer_date === today
      );

      // Dacă azi există ofertă,
      // selectăm automat prima ofertă ca interval
      if (todayOffers.length > 0) {
        const firstOffer =
          todayOffers[0];

        setSelectedOfferId(
          firstOffer.id
        );

        setTime(
          String(
            firstOffer.start_time
          ).slice(0, 5)
        );
      } else {
        setSelectedOfferId(null);
        setTime("19:00");
      }
    } catch (error) {
      console.error(
        "Eroare la încărcarea ofertelor:",
        error
      );

      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  }

  // Toate ofertele pentru ziua selectată
  const selectedDayOffers =
    useMemo(() => {
      if (!date) return [];

      return offers
        .filter(
          (offer) =>
            offer.offer_date === date
        )
        .sort((a, b) =>
          String(a.start_time).localeCompare(
            String(b.start_time)
          )
        );
    }, [offers, date]);

  // Oferta exactă aleasă de client
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

  // Cardurile pentru cele 4 zile
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

          return {
            date: currentDate,
            offers: dayOffers,
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
            String(b.start_time)
          )
        );

    if (offersForDay.length > 0) {
      const firstOffer =
        offersForDay[0];

      setSelectedOfferId(
        firstOffer.id
      );

      setTime(
        String(
          firstOffer.start_time
        ).slice(0, 5)
      );
    } else {
      setSelectedOfferId(null);
      setTime("19:00");
    }
  }

  function selectOffer(offer) {
    setSelectedOfferId(offer.id);

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

  function formatShortDate(
    value
  ) {
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

    if (!supabaseUrl || !supabaseKey) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    const reservationCode =
      generateReservationCode();

    const reservationSummary = {
      code: reservationCode,
      date:
        formatDateRomanian(date),
      time,
      guests,
      name: name.trim(),

      discount:
        selectedOffer
          ?.discount_percent ||
        null,

      offerId:
        selectedOffer?.id ||
        null,
    };

    setLoading(true);

    try {
      const response = await fetch(
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

          body: JSON.stringify({
            restaurant_name:
              "Boom Pub",

            reservation_date:
              date,

            reservation_time:
              time,

            guests:
              Number(guests),

            customer_name:
              name.trim(),

            customer_phone:
              phone.trim(),

            status:
              "pending",

            reservation_code:
              reservationCode,

            // Oferta exactă aleasă
            offer_id:
              selectedOffer?.id ||
              null,

            // Reducerea rămâne fixă
            discount_percent:
              selectedOffer
                ?.discount_percent ||
              null,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Supabase error:",
          errorText
        );

        setMessage(
          `Eroare Supabase: ${errorText}`
        );

        return;
      }

      localStorage.setItem(
        "masago_last_reservation_code",
        reservationCode
      );

      setConfirmation(
        reservationSummary
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
          position: "sticky",
          top: 0,
          zIndex: 20,
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
            textDecoration:
              "none",
            color: "#485267",
            fontWeight: "700",
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
          color: "white",
          padding: "55px 6%",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "35px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display:
                  "inline-block",
                background:
                  "rgba(255,90,60,0.16)",
                color: "#FF8A73",
                border:
                  "1px solid rgba(255,90,60,0.35)",
                borderRadius:
                  "999px",
                padding:
                  "8px 12px",
                fontSize: "14px",
                fontWeight: "800",
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
                fontSize: "18px",
                color: "#cbd2dd",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Atmosferă relaxată,
              băuturi și preparate de
              pub, cu oferte
              disponibile în mai multe
              intervale orare.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "22px",
              }}
            >
              <span
                style={{
                  background:
                    "white",
                  color: "#172033",
                  padding:
                    "10px 13px",
                  borderRadius:
                    "10px",
                  fontWeight: "800",
                }}
              >
                ⭐ 9.1
              </span>

              {selectedOffer && (
                <span
                  style={{
                    background:
                      "#FF5A3C",
                    color: "white",
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
                  % reducere
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              height: "320px",
              borderRadius:
                "22px",
              background:
                "linear-gradient(135deg, #2b3448, #151c2b)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              fontSize: "110px",
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

      {/* MAIN */}

      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding:
            "55px 6% 80px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "30px",
          alignItems: "start",
        }}
      >
        {/* STANGA */}

        <div>
          <div
            style={{
              background: "white",
              border:
                "1px solid #ebedf0",
              borderRadius:
                "20px",
              padding: "28px",
              boxShadow:
                "0 10px 30px rgba(23,32,51,0.05)",
              marginBottom:
                "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "26px",
              }}
            >
              Alege ziua
            </h2>

            <p
              style={{
                color: "#667085",
                lineHeight: 1.6,
              }}
            >
              Vezi ofertele Boom Pub
              pentru următoarele zile.
            </p>

            {offersLoading ? (
              <div
                style={{
                  color: "#667085",
                  fontWeight: "800",
                }}
              >
                Se încarcă ofertele...
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                {upcomingDays.map(
                  (
                    day,
                    index
                  ) => {
                    const active =
                      date ===
                      day.date;

                    return (
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
                            active
                              ? "2px solid #FF5A3C"
                              : "1px solid #E2E5E9",

                          background:
                            active
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
                        <div
                          style={{
                            color:
                              "#667085",
                            fontSize:
                              "12px",
                            fontWeight:
                              "800",
                            marginBottom:
                              "6px",
                          }}
                        >
                          {getDayLabel(
                            day.date,
                            index
                          )}
                        </div>

                        <div
                          style={{
                            fontWeight:
                              "900",
                            fontSize:
                              "16px",
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
                              day.offers
                                .length >
                              0
                                ? "#FF5A3C"
                                : "#98A2B3",
                            fontWeight:
                              "900",
                            fontSize:
                              "13px",
                          }}
                        >
                          {day.offers
                            .length >
                          0
                            ? `${day.offers.length} ${
                                day
                                  .offers
                                  .length ===
                                1
                                  ? "ofertă"
                                  : "oferte"
                              }`
                            : "Fără ofertă"}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* OFERTELE ZILEI */}

          <div
            style={{
              background:
                "white",
              border:
                "1px solid #E7E9ED",
              borderRadius:
                "20px",
              padding: "25px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 5px",
                fontSize: "24px",
              }}
            >
              Oferte pentru{" "}
              {formatDateRomanian(
                date
              )}
            </h2>

            <p
              style={{
                margin:
                  "0 0 20px",
                color: "#667085",
                lineHeight: 1.5,
              }}
            >
              Alege intervalul care
              ți se potrivește.
            </p>

            {selectedDayOffers.length >
            0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {selectedDayOffers.map(
                  (offer) => {
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
                            active
                              ? "#FFF5F2"
                              : "white",

                          borderRadius:
                            "16px",

                          padding:
                            "18px",
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
                            gap: "12px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color:
                                  "#FF5A3C",
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

                            <div
                              style={{
                                marginTop:
                                  "5px",
                                fontWeight:
                                  "900",
                              }}
                            >
                              {formatTime(
                                offer.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                offer.end_time
                              )}
                            </div>

                            <div
                              style={{
                                color:
                                  "#667085",
                                marginTop:
                                  "5px",
                                fontSize:
                                  "14px",
                              }}
                            >
                              👥{" "}
                              {
                                offer.capacity
                              }{" "}
                              locuri
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              selectOffer(
                                offer
                              )
                            }
                            style={{
                              border:
                                "none",
                              background:
                                active
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
                                "pointer",
                            }}
                          >
                            {active
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
                  border:
                    "1px solid #E4E7EC",
                  borderRadius:
                    "14px",
                  padding: "20px",
                }}
              >
                <strong
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                  }}
                >
                  Nicio ofertă setată
                </strong>

                <div
                  style={{
                    color: "#667085",
                    lineHeight: 1.6,
                  }}
                >
                  Boom Pub nu a setat
                  încă o ofertă pentru
                  această zi.
                </div>

                <div
                  style={{
                    color: "#667085",
                    lineHeight: 1.6,
                    marginTop:
                      "6px",
                  }}
                >
                  Poți face în
                  continuare o
                  rezervare normală,
                  fără reducere.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DREAPTA - REZERVARE */}

        <div
          style={{
            background: "white",
            border:
              "1px solid #ebedf0",
            borderRadius:
              "22px",
            padding: "30px",
            boxShadow:
              "0 18px 45px rgba(23,32,51,0.08)",
          }}
        >
          {confirmation ? (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin:
                    "0 auto 20px",
                  borderRadius:
                    "50%",
                  background:
                    "#E9F8EF",
                  color: "#16865C",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "30px",
                }}
              >
                ✓
              </div>

              <div
                style={{
                  textAlign:
                    "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color:
                      "#16865C",
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
                  Rezervare trimisă
                </p>

                <h2>
                  Mulțumim,{" "}
                  {confirmation.name}!
                </h2>

                <p
                  style={{
                    color:
                      "#737C8D",
                    lineHeight: 1.6,
                  }}
                >
                  Solicitarea a fost
                  trimisă către Boom
                  Pub și așteaptă
                  confirmarea
                  restaurantului.
                </p>

                {confirmation.discount ? (
                  <div
                    style={{
                      marginTop:
                        "15px",
                      background:
                        "#FFF0EC",
                      padding:
                        "14px",
                      borderRadius:
                        "12px",
                      color:
                        "#FF5A3C",
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
                ) : (
                  <div
                    style={{
                      marginTop:
                        "15px",
                      background:
                        "#F2F4F7",
                      padding:
                        "14px",
                      borderRadius:
                        "12px",
                      color:
                        "#667085",
                      fontWeight:
                        "800",
                    }}
                  >
                    Rezervare fără
                    ofertă Masago.
                  </div>
                )}
              </div>

              <div
                style={{
                  margin:
                    "25px 0",
                  padding: "22px",
                  background:
                    "#172033",
                  color: "white",
                  borderRadius:
                    "16px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    color:
                      "#AEB7C6",
                    fontSize:
                      "12px",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "1px",
                    fontWeight:
                      "800",
                  }}
                >
                  Cod rezervare
                </div>

                <div
                  style={{
                    fontSize:
                      "27px",
                    fontWeight:
                      "900",
                    letterSpacing:
                      "2px",
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
                  display: "block",
                  width: "100%",
                  boxSizing:
                    "border-box",
                  textDecoration:
                    "none",
                  textAlign:
                    "center",
                  background:
                    "#FF5A3C",
                  color: "white",
                  borderRadius:
                    "12px",
                  padding: "15px",
                  fontWeight:
                    "900",
                  marginBottom:
                    "12px",
                }}
              >
                Vezi statusul
                rezervării
              </a>

              <button
                type="button"
                onClick={
                  makeAnotherReservation
                }
                style={{
                  width: "100%",
                  border:
                    "1px solid #DDE1E6",
                  borderRadius:
                    "12px",
                  padding: "14px",
                  background:
                    "white",
                  color:
                    "#172033",
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
                  margin: 0,
                  color:
                    "#FF5A3C",
                  fontWeight:
                    "900",
                  fontSize:
                    "13px",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "1px",
                }}
              >
                Rezervare
              </p>

              <h2
                style={{
                  fontSize: "30px",
                  margin:
                    "7px 0 8px",
                }}
              >
                Rezervă o masă
              </h2>

              <p
                style={{
                  color:
                    "#737C8D",
                  marginTop: 0,
                  marginBottom:
                    "25px",
                  lineHeight: 1.5,
                }}
              >
                Selectează ziua,
                oferta și ora
                rezervării.
              </p>

              {selectedOffer ? (
                <div
                  style={{
                    background:
                      "#FFF0EC",
                    border:
                      "1px solid #FFD8CF",
                    borderRadius:
                      "12px",
                    padding:
                      "15px",
                    marginBottom:
                      "22px",
                    color:
                      "#A33A29",
                    fontWeight:
                      "800",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#FF5A3C",
                      fontSize:
                        "21px",
                      fontWeight:
                        "900",
                      marginBottom:
                        "5px",
                    }}
                  >
                    -
                    {
                      selectedOffer.discount_percent
                    }
                    %
                  </div>

                  📅{" "}
                  {formatDateRomanian(
                    selectedOffer.offer_date
                  )}
                  <br />

                  🕐{" "}
                  {formatTime(
                    selectedOffer.start_time
                  )}{" "}
                  -{" "}
                  {formatTime(
                    selectedOffer.end_time
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background:
                      "#F2F4F7",
                    border:
                      "1px solid #E4E7EC",
                    borderRadius:
                      "12px",
                    padding:
                      "15px",
                    marginBottom:
                      "22px",
                    color:
                      "#667085",
                    fontWeight:
                      "800",
                  }}
                >
                  ℹ️ Restaurantul nu
                  a setat încă o
                  ofertă pentru ziua
                  selectată.
                </div>
              )}

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Data rezervării
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
                  style={inputStyle}
                />
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Ora rezervării
                </label>

                <input
                  type="time"
                  value={time}
                  min={
                    selectedOffer
                      ? formatTime(
                          selectedOffer.start_time
                        )
                      : undefined
                  }
                  max={
                    selectedOffer
                      ? formatTime(
                          selectedOffer.end_time
                        )
                      : undefined
                  }
                  onChange={(e) =>
                    setTime(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

                {selectedOffer && (
                  <div
                    style={{
                      marginTop:
                        "8px",
                      color:
                        "#667085",
                      fontSize:
                        "13px",
                    }}
                  >
                    Pentru reducerea
                    de{" "}
                    <strong>
                      -
                      {
                        selectedOffer.discount_percent
                      }
                      %
                    </strong>
                    , rezervarea
                    trebuie făcută
                    între{" "}
                    <strong>
                      {formatTime(
                        selectedOffer.start_time
                      )}{" "}
                      și{" "}
                      {formatTime(
                        selectedOffer.end_time
                      )}
                    </strong>
                    .
                  </div>
                )}
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Număr de persoane
                </label>

                <select
                  value={guests}
                  onChange={(e) =>
                    setGuests(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="1">
                    1 persoană
                  </option>
                  <option value="2">
                    2 persoane
                  </option>
                  <option value="3">
                    3 persoane
                  </option>
                  <option value="4">
                    4 persoane
                  </option>
                  <option value="5">
                    5 persoane
                  </option>
                  <option value="6">
                    6 persoane
                  </option>
                  <option value="7">
                    7 persoane
                  </option>
                  <option value="8">
                    8 persoane
                  </option>
                </select>
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Nume
                </label>

                <input
                  type="text"
                  placeholder="Numele tău"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Număr de telefon
                </label>

                <input
                  type="tel"
                  placeholder="07xxxxxxxx"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <button
                type="button"
                onClick={
                  handleReservation
                }
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "5px",
                  border: "none",
                  borderRadius:
                    "12px",
                  padding: "16px",

                  background:
                    loading
                      ? "#aeb4bf"
                      : "#FF5A3C",

                  color: "white",
                  fontSize: "17px",
                  fontWeight: "900",

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
                      "20px",
                    padding: "14px",
                    borderRadius:
                      "11px",
                    background:
                      "#FFF0EC",
                    color:
                      "#A33A29",
                    fontWeight:
                      "800",
                    textAlign:
                      "center",
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
