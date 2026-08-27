"use client";

import { useEffect, useState } from "react";

export default function RestaurantPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const [offer, setOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(true);

  useEffect(() => {
    loadOffer();
  }, []);

  async function loadOffer() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Conexiunea cu Supabase nu este configurată."
      );
      setOfferLoading(false);
      return;
    }

    try {
      const restaurantResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?name=eq.${encodeURIComponent(
          "Casa Bunicii"
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
          "Nu am găsit Casa Bunicii:",
          restaurantData
        );

        setOffer(null);
        return;
      }

      const restaurantId =
        restaurantData[0].id;

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      /*
        IMPORTANT:
        id.desc = ultima ofertă creată.
      */
      const offerResponse = await fetch(
        `${supabaseUrl}/rest/v1/offers?restaurant_id=eq.${restaurantId}&active=eq.true&offer_date=gte.${today}&select=*&order=id.desc&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const offerData =
        await offerResponse.json();

      if (!offerResponse.ok) {
        console.error(
          "Offers error:",
          offerData
        );

        setOffer(null);
        return;
      }

      if (offerData?.[0]) {
        const currentOffer =
          offerData[0];

        setOffer(currentOffer);

        setDate(
          currentOffer.offer_date || ""
        );

        setTime(
          String(
            currentOffer.start_time ||
              "19:00"
          ).slice(0, 5)
        );
      } else {
        setOffer(null);
      }
    } catch (error) {
      console.error(
        "Eroare la încărcarea ofertei:",
        error
      );

      setOffer(null);
    } finally {
      setOfferLoading(false);
    }
  }

  function generateReservationCode() {
    const randomPart = crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase();

    return `MASAGO-${randomPart}`;
  }

  function formatDateRomanian(value) {
    if (!value) return "";

    const [year, month, day] =
      value.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatTime(value) {
    if (!value) return "";

    return String(value).slice(0, 5);
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

    if (!name.trim()) {
      setMessage("Introdu numele.");
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
        offer?.discount_percent ||
        null,
    };

    setLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            "Content-Type":
              "application/json",
            Prefer: "return=minimal",
          },

          body: JSON.stringify({
            restaurant_name:
              "Casa Bunicii",

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

            status: "pending",

            reservation_code:
              reservationCode,
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

    if (offer) {
      setDate(
        offer.offer_date || ""
      );

      setTime(
        formatTime(
          offer.start_time
        )
      );
    }
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
          ← Înapoi la restaurante
        </a>
      </header>

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
                padding: "8px 12px",
                fontSize: "14px",
                fontWeight: "800",
                marginBottom:
                  "18px",
              }}
            >
              Românesc • Timișoara
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
              Casa Bunicii
            </h1>

            <p
              style={{
                fontSize: "18px",
                color: "#cbd2dd",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Bucătărie românească și
              preparate tradiționale,
              cu oferte disponibile în
              anumite intervale.
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
                ⭐ 9.2
              </span>

              {!offerLoading &&
                offer && (
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
                      offer.discount_percent
                    }
                    % reducere
                  </span>
                )}

              {!offerLoading &&
                !offer && (
                  <span
                    style={{
                      background:
                        "#667085",
                      color: "white",
                      padding:
                        "10px 13px",
                      borderRadius:
                        "10px",
                      fontWeight:
                        "900",
                    }}
                  >
                    Fără ofertă activă
                  </span>
                )}
            </div>
          </div>

          <div
            style={{
              height: "320px",
              borderRadius: "22px",
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
            🍲
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "55px 6% 80px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "30px",
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              background: "white",
              border:
                "1px solid #ebedf0",
              borderRadius: "20px",
              padding: "28px",
              boxShadow:
                "0 10px 30px rgba(23,32,51,0.05)",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "26px",
              }}
            >
              Despre Casa Bunicii
            </h2>

            <p
              style={{
                color: "#667085",
                lineHeight: 1.7,
              }}
            >
              Casa Bunicii este listat
              în Masago pentru rezervări
              cu reducere în intervalele
              disponibile.
            </p>

            <div
              style={{
                display: "grid",
                gap: "14px",
                marginTop: "22px",
              }}
            >
              <div>
                <strong>
                  📍 Locație
                </strong>

                <div
                  style={{
                    color: "#667085",
                    marginTop: "4px",
                  }}
                >
                  Timișoara
                </div>
              </div>

              <div>
                <strong>
                  🍽️ Tip
                </strong>

                <div
                  style={{
                    color: "#667085",
                    marginTop: "4px",
                  }}
                >
                  Bucătărie românească
                </div>
              </div>

              <div>
                <strong>
                  ⭐ Evaluare
                </strong>

                <div
                  style={{
                    color: "#667085",
                    marginTop: "4px",
                  }}
                >
                  9.2
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: offer
                ? "#FFF0EC"
                : "#F2F4F7",

              border: offer
                ? "1px solid #FFD8CF"
                : "1px solid #E4E7EC",

              borderRadius: "20px",
              padding: "28px",
            }}
          >
            {offerLoading ? (
              <div
                style={{
                  color: "#667085",
                  fontWeight: "800",
                }}
              >
                Se încarcă oferta...
              </div>
            ) : offer ? (
              <>
                <div
                  style={{
                    color: "#FF5A3C",
                    fontWeight: "900",
                    fontSize: "34px",
                    marginBottom:
                      "8px",
                  }}
                >
                  -
                  {
                    offer.discount_percent
                  }
                  %
                </div>

                <h3
                  style={{
                    margin:
                      "0 0 10px",
                    fontSize: "22px",
                  }}
                >
                  Oferta Masago
                </h3>

                <p
                  style={{
                    margin:
                      "0 0 16px",
                    color: "#5f6777",
                    lineHeight: 1.6,
                  }}
                >
                  Reducerea se aplică
                  la nota de plată
                  conform condițiilor
                  restaurantului și
                  intervalului
                  rezervat.
                </p>

                <div
                  style={{
                    background:
                      "white",
                    borderRadius:
                      "12px",
                    padding:
                      "14px",
                    color: "#172033",
                    fontWeight: "800",
                  }}
                >
                  📅{" "}
                  {formatDateRomanian(
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
                  <br />

                  👥{" "}
                  {offer.capacity}{" "}
                  locuri
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    color: "#667085",
                    fontWeight: "900",
                    fontSize: "25px",
                    marginBottom:
                      "8px",
                  }}
                >
                  Fără ofertă
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#667085",
                    lineHeight: 1.6,
                  }}
                >
                  Restaurantul nu are
                  momentan o ofertă
                  Masago activă.
                </p>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            background: "white",
            border:
              "1px solid #ebedf0",
            borderRadius: "22px",
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
                  borderRadius: "50%",
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
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#16865C",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "1px",
                    fontSize: "13px",
                    fontWeight: "900",
                  }}
                >
                  Rezervare trimisă
                </p>

                <h2
                  style={{
                    fontSize: "30px",
                    margin:
                      "8px 0",
                  }}
                >
                  Mulțumim,{" "}
                  {confirmation.name}!
                </h2>

                <p
                  style={{
                    color: "#737C8D",
                    lineHeight: 1.6,
                  }}
                >
                  Solicitarea a fost
                  trimisă către Casa
                  Bunicii și așteaptă
                  confirmarea
                  restaurantului.
                </p>

                {confirmation.discount && (
                  <p
                    style={{
                      color:
                        "#FF5A3C",
                      fontWeight:
                        "900",
                      fontSize:
                        "18px",
                    }}
                  >
                    Oferta rezervată: -
                    {
                      confirmation.discount
                    }
                    %
                  </p>
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
                    color: "#AEB7C6",
                    fontSize: "12px",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "1px",
                    fontWeight: "800",
                  }}
                >
                  Cod rezervare
                </div>

                <div
                  style={{
                    fontSize: "27px",
                    fontWeight: "900",
                    letterSpacing:
                      "2px",
                    marginTop: "8px",
                  }}
                >
                  {confirmation.code}
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
                  textAlign: "center",
                  background:
                    "#FF5A3C",
                  color: "white",
                  borderRadius:
                    "12px",
                  padding: "15px",
                  fontWeight: "900",
                  marginBottom:
                    "12px",
                }}
              >
                Vezi statusul rezervării
              </a>

              <button
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
                  color: "#172033",
                  fontWeight: "900",
                  cursor: "pointer",
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
                  color: "#FF5A3C",
                  fontWeight: "900",
                  fontSize: "13px",
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
                  color: "#737c8d",
                  marginTop: 0,
                  marginBottom:
                    "28px",
                }}
              >
                Completează detaliile
                și trimitem rezervarea
                către restaurant.
              </p>

              {offer && (
                <div
                  style={{
                    background:
                      "#FFF0EC",
                    border:
                      "1px solid #FFD8CF",
                    borderRadius:
                      "12px",
                    padding:
                      "14px 16px",
                    marginBottom:
                      "22px",
                    color: "#A33A29",
                    fontWeight: "800",
                  }}
                >
                  🎁 Rezervare cu -
                  {offer.discount_percent}
                  % •{" "}
                  {formatDateRomanian(
                    offer.offer_date
                  )}{" "}
                  •{" "}
                  {formatTime(
                    offer.start_time
                  )}{" "}
                  -{" "}
                  {formatTime(
                    offer.end_time
                  )}
                </div>
              )}

              <div style={fieldStyle}>
                <label
                  style={labelStyle}
                >
                  Data rezervării
                </label>

                <input
                  type="date"
                  value={date}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) =>
                    setDate(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

                {date && (
                  <div
                    style={{
                      marginTop: "7px",
                      color: "#7a8393",
                      fontSize: "14px",
                    }}
                  >
                    Data selectată:{" "}
                    <strong>
                      {formatDateRomanian(
                        date
                      )}
                    </strong>
                  </div>
                )}
              </div>

              <div style={fieldStyle}>
                <label
                  style={labelStyle}
                >
                  Ora
                </label>

                <select
                  value={time}
                  onChange={(e) =>
                    setTime(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="18:00">
                    18:00
                  </option>
                  <option value="18:30">
                    18:30
                  </option>
                  <option value="19:00">
                    19:00
                  </option>
                  <option value="19:30">
                    19:30
                  </option>
                  <option value="20:00">
                    20:00
                  </option>
                  <option value="20:30">
                    20:30
                  </option>
                  <option value="21:00">
                    21:00
                  </option>
                  <option value="21:30">
                    21:30
                  </option>
                </select>
              </div>

              <div style={fieldStyle}>
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

              <div style={fieldStyle}>
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

              <div style={fieldStyle}>
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
                  background: loading
                    ? "#aeb4bf"
                    : "#FF5A3C",
                  color: "white",
                  fontSize: "17px",
                  fontWeight: "900",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Se trimite..."
                  : offer
                  ? `Rezervă cu -${offer.discount_percent}%`
                  : "Rezervă masa"}
              </button>

              {message && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px",
                    borderRadius:
                      "11px",
                    background:
                      "#FFF0EC",
                    color: "#A33A29",
                    fontWeight: "800",
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
