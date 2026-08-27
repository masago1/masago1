"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [offersByRestaurant, setOffersByRestaurant] = useState({});

  const restaurants = [
    {
      name: "Casa Bunicii",
      type: "Românesc",
      rating: "9.2",
      location: "Timișoara",
      emoji: "🍲",
      href: "/restaurant",
      description: "Bucătărie românească și preparate tradiționale.",
    },
    {
      name: "Boom Pub",
      type: "Pub",
      rating: "9.1",
      location: "Timișoara",
      emoji: "🍻",
      href: "/restaurant/boom-pub",
      description: "Atmosferă relaxată, băuturi și preparate de pub.",
    },
  ];

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase nu este configurat.");
      return;
    }

    try {
      const restaurantsResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=id,name`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const restaurantRows =
        await restaurantsResponse.json();

      if (!restaurantsResponse.ok) {
        console.error(
          "Restaurants error:",
          restaurantRows
        );
        return;
      }

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const offersResponse = await fetch(
        `${supabaseUrl}/rest/v1/offers?select=*&active=eq.true&offer_date=gte.${today}&order=offer_date.asc,start_time.asc`,
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
        return;
      }

      const mappedOffers = {};

      restaurantRows.forEach((dbRestaurant) => {
        const restaurantOffers =
          offersData.filter(
            (offer) =>
              offer.restaurant_id ===
              dbRestaurant.id
          );

        if (restaurantOffers.length > 0) {
          mappedOffers[dbRestaurant.name] =
            restaurantOffers[0];
        }
      });

      setOffersByRestaurant(mappedOffers);
    } catch (error) {
      console.error(
        "Eroare încărcare oferte:",
        error
      );
    }
  }

  function formatOfferDate(date) {
    if (!date) return "";

    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatOfferTime(time) {
    if (!time) return "";

    return String(time).slice(0, 5);
  }

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#FAFAF8",
        minHeight: "100vh",
        color: "#172033",
      }}
    >
      {/* NAVBAR */}
      <header
        style={{
          background: "rgba(255,255,255,0.96)",
          borderBottom: "1px solid #ececec",
          padding: "18px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#172033",
            fontSize: "30px",
            fontWeight: "900",
            letterSpacing: "-1px",
          }}
        >
          Masago
          <span style={{ color: "#FF5A3C" }}>
            .
          </span>
        </a>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <a
            href="#contact"
            style={{
              textDecoration: "none",
              color: "#172033",
              border: "1px solid #dcdfe5",
              background: "white",
              padding: "11px 17px",
              borderRadius: "10px",
              fontWeight: "700",
            }}
          >
            Pentru restaurante
          </a>

          <a
            href="/login"
            style={{
              textDecoration: "none",
              color: "white",
              background: "#172033",
              padding: "12px 18px",
              borderRadius: "10px",
              fontWeight: "700",
            }}
          >
            Intră în cont
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          padding: "90px 6% 80px",
          background:
            "linear-gradient(135deg, #172033 0%, #202c43 65%, #2a3751 100%)",
          color: "white",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background:
                "rgba(255,90,60,0.16)",
              border:
                "1px solid rgba(255,90,60,0.35)",
              color: "#FF8A73",
              padding: "8px 13px",
              borderRadius: "999px",
              fontWeight: "700",
              fontSize: "14px",
              marginBottom: "22px",
            }}
          >
            Restaurante bune. Oferte mai bune.
          </div>

          <h1
            style={{
              fontSize:
                "clamp(44px, 7vw, 74px)",
              lineHeight: "0.98",
              letterSpacing: "-3px",
              margin: 0,
              maxWidth: "850px",
            }}
          >
            Descoperă mese bune,
            <br />

            <span
              style={{
                color: "#FF5A3C",
              }}
            >
              la momentul potrivit.
            </span>
          </h1>

          <p
            style={{
              marginTop: "25px",
              fontSize: "20px",
              color: "#d7dce6",
              maxWidth: "700px",
              lineHeight: 1.6,
            }}
          >
            Rezervă la restaurante din Timișoara
            și profită de reduceri disponibile în
            anumite intervale.
          </p>

          <div
            style={{
              marginTop: "38px",
              maxWidth: "850px",
              background: "white",
              padding: "9px",
              borderRadius: "16px",
              display: "flex",
              gap: "8px",
              boxShadow:
                "0 18px 60px rgba(0,0,0,0.22)",
            }}
          >
            <input
              placeholder="Ce vrei să mănânci?"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "16px",
                fontSize: "16px",
                color: "#172033",
                minWidth: 0,
              }}
            />

            <div
              style={{
                width: "1px",
                background: "#ececec",
              }}
            />

            <input
              value="Timișoara"
              readOnly
              style={{
                width: "170px",
                border: "none",
                outline: "none",
                padding: "16px",
                fontSize: "16px",
                color: "#667085",
                background: "white",
              }}
            />

            <button
              style={{
                background: "#FF5A3C",
                color: "white",
                border: "none",
                borderRadius: "11px",
                padding: "0 26px",
                fontWeight: "800",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Caută
            </button>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section
        style={{
          background: "white",
          borderBottom: "1px solid #ececec",
          padding: "22px 6%",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "auto",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "18px",
          }}
        >
          {[
            ["⚡", "Rezervare rapidă"],
            ["💸", "Reduceri la nota de plată"],
            ["📍", "Restaurante locale"],
            [
              "✅",
              "Confirmare de la restaurant",
            ],
          ].map(([icon, text]) => (
            <div
              key={text}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                fontWeight: "700",
                color: "#485267",
              }}
            >
              <span
                style={{
                  fontSize: "21px",
                }}
              >
                {icon}
              </span>

              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* RESTAURANTS */}
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "70px 6%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#FF5A3C",
                fontWeight: "800",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Descoperă
            </p>

            <h2
              style={{
                margin: "8px 0 8px",
                fontSize: "38px",
                letterSpacing: "-1px",
              }}
            >
              Oferte în Timișoara
            </h2>

            <p
              style={{
                margin: 0,
                color: "#727b8d",
                fontSize: "17px",
              }}
            >
              Alege restaurantul, intervalul și
              rezervă în câteva secunde.
            </p>
          </div>

          <span
            style={{
              color: "#172033",
              fontWeight: "800",
            }}
          >
            Vezi toate →
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "26px",
          }}
        >
          {restaurants.map((restaurant) => {
            const offer =
              offersByRestaurant[
                restaurant.name
              ];

            return (
              <article
                key={restaurant.name}
                style={{
                  background: "white",
                  borderRadius: "22px",
                  overflow: "hidden",
                  border:
                    "1px solid #ebedf0",
                  boxShadow:
                    "0 12px 35px rgba(23,32,51,0.07)",
                }}
              >
                <div
                  style={{
                    height: "220px",
                    background:
                      "linear-gradient(135deg, #f1f2f4, #e8eaed)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "90px",
                    }}
                  >
                    {restaurant.emoji}
                  </span>

                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "16px",
                      background: offer
                        ? "#FF5A3C"
                        : "#98A2B3",
                      color: "white",
                      fontWeight: "900",
                      fontSize: offer
                        ? "20px"
                        : "13px",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      boxShadow: offer
                        ? "0 8px 20px rgba(255,90,60,0.28)"
                        : "none",
                    }}
                  >
                    {offer
                      ? `-${offer.discount_percent}%`
                      : "Fără ofertă"}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "16px",
                      background:
                        "rgba(255,255,255,0.94)",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      fontWeight: "800",
                    }}
                  >
                    ⭐ {restaurant.rating}
                  </div>
                </div>

                <div
                  style={{
                    padding: "22px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {restaurant.name}
                  </h3>

                  <p
                    style={{
                      color: "#7a8393",
                      margin: "8px 0 12px",
                    }}
                  >
                    {restaurant.type} •{" "}
                    {restaurant.location}
                  </p>

                  <p
                    style={{
                      color: "#485267",
                      lineHeight: 1.5,
                      minHeight: "48px",
                    }}
                  >
                    {restaurant.description}
                  </p>

                  <div
                    style={{
                      margin: "18px 0",
                      paddingTop: "16px",
                      borderTop:
                        "1px solid #eeeeee",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {offer ? (
                      <>
                        <span
                          style={{
                            color: "#667085",
                            fontSize: "14px",
                            lineHeight: 1.5,
                          }}
                        >
                          {formatOfferDate(
                            offer.offer_date
                          )}
                          <br />

                          {formatOfferTime(
                            offer.start_time
                          )}{" "}
                          -{" "}
                          {formatOfferTime(
                            offer.end_time
                          )}
                        </span>

                        <strong
                          style={{
                            color: "#FF5A3C",
                            fontSize: "18px",
                          }}
                        >
                          -
                          {
                            offer.discount_percent
                          }
                          %
                        </strong>
                      </>
                    ) : (
                      <>
                        <span
                          style={{
                            color: "#667085",
                            fontSize: "14px",
                          }}
                        >
                          Momentan
                        </span>

                        <strong
                          style={{
                            color: "#98A2B3",
                          }}
                        >
                          Fără ofertă
                        </strong>
                      </>
                    )}
                  </div>

                  <a
                    href={restaurant.href}
                    style={{
                      display: "block",
                      background: "#172033",
                      color: "white",
                      textDecoration: "none",
                      textAlign: "center",
                      padding: "14px",
                      borderRadius: "11px",
                      fontWeight: "800",
                    }}
                  >
                    {offer
                      ? `Vezi oferta -${offer.discount_percent}%`
                      : "Vezi disponibilitatea"}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          background: "#172033",
          color: "white",
          padding: "80px 6%",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "650px",
              margin: "auto",
            }}
          >
            <p
              style={{
                color: "#FF8A73",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              Simplu și rapid
            </p>

            <h2
              style={{
                fontSize: "38px",
                margin: "8px 0 15px",
              }}
            >
              Cum funcționează Masago?
            </h2>

            <p
              style={{
                color: "#b8c0ce",
                lineHeight: 1.6,
                fontSize: "17px",
              }}
            >
              De la descoperirea restaurantului
              până la masă rezervată, în doar
              câțiva pași.
            </p>
          </div>

          <div
            style={{
              marginTop: "50px",
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                number: "01",
                icon: "🔎",
                title: "Alege restaurantul",
                text: "Descoperă restaurante și ofertele disponibile.",
              },
              {
                number: "02",
                icon: "📅",
                title: "Alege intervalul",
                text: "Selectează data, ora și numărul de persoane.",
              },
              {
                number: "03",
                icon: "✅",
                title: "Primește confirmarea",
                text: "Restaurantul vede rezervarea și o poate confirma.",
              },
              {
                number: "04",
                icon: "💸",
                title: "Primește reducerea",
                text: "Oferta este aplicată conform condițiilor rezervării.",
              },
            ].map((item) => (
              <div
                key={item.number}
                style={{
                  background: "#202c43",
                  padding: "26px",
                  borderRadius: "18px",
                  border:
                    "1px solid #2c3952",
                }}
              >
                <div
                  style={{
                    color: "#FF5A3C",
                    fontWeight: "900",
                    fontSize: "13px",
                  }}
                >
                  {item.number}
                </div>

                <div
                  style={{
                    fontSize: "34px",
                    margin: "18px 0",
                  }}
                >
                  {item.icon}
                </div>

                <h3
                  style={{
                    margin: "0 0 10px",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: "#b8c0ce",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANT CONTACT */}
      <section
        id="contact"
        style={{
          padding: "75px 6%",
          background: "#FAFAF8",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "auto",
            background:
              "linear-gradient(135deg, #FF5A3C 0%, #FF684F 100%)",
            color: "white",
            padding: "55px",
            borderRadius: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "30px",
            flexWrap: "wrap",
            boxShadow:
              "0 18px 45px rgba(255,90,60,0.16)",
          }}
        >
          <div
            style={{
              maxWidth: "650px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "white",
                color: "#FF5A3C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "23px",
                marginBottom: "20px",
              }}
            >
              ☎
            </div>

            <h2
              style={{
                fontSize: "36px",
                margin: "0 0 12px",
                letterSpacing: "-1px",
              }}
            >
              Ai un restaurant?
            </h2>

            <p
              style={{
                margin: 0,
                color: "#FFF1ED",
                fontSize: "18px",
                lineHeight: 1.6,
              }}
            >
              Contactează-ne pentru a afla mai
              multe despre Masago și posibilitatea
              unei colaborări.
            </p>
          </div>

          <a
            href="mailto:contact@masago.ro"
            style={{
              background: "white",
              color: "#172033",
              textDecoration: "none",
              padding: "16px 24px",
              borderRadius: "11px",
              fontWeight: "900",
              fontSize: "16px",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.10)",
            }}
          >
            Contactează-ne →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: "30px 6% 45px",
          color: "#7a8393",
          textAlign: "center",
        }}
      >
        <strong
          style={{
            color: "#172033",
          }}
        >
          Masago.
        </strong>{" "}
        © 2026
      </footer>
    </main>
  );
}
