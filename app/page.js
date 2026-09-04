"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [offersCountByRestaurant, setOffersCountByRestaurant] =
    useState({});

  const [restaurantImageByName, setRestaurantImageByName] =
    useState({});

  const [restaurants, setRestaurants] =
    useState([]);

  const [offersLoading, setOffersLoading] =
    useState(true);

  const [clientLoggedIn, setClientLoggedIn] =
    useState(false);

  const [restaurantLoggedIn, setRestaurantLoggedIn] =
    useState(false);

  const [sessionLoading, setSessionLoading] =
    useState(true);

  useEffect(() => {
    loadHomepageData();
    checkSessions();
  }, []);

  /*
    =========================
    SESIUNI
    =========================
  */

  async function checkSessions() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setSessionLoading(false);
      return;
    }

    const clientAccessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    const restaurantAccessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    try {
      /*
        CLIENT
      */

      if (clientAccessToken) {
        try {
          const clientResponse =
            await fetch(
              `${supabaseUrl}/auth/v1/user`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization:
                    `Bearer ${clientAccessToken}`,
                },
              }
            );

          setClientLoggedIn(
            clientResponse.ok
          );
        } catch (error) {
          console.error(
            "Client session check error:",
            error
          );

          setClientLoggedIn(false);
        }
      } else {
        setClientLoggedIn(false);
      }

      /*
        RESTAURANT
      */

      if (restaurantAccessToken) {
        try {
          const restaurantResponse =
            await fetch(
              `${supabaseUrl}/rest/v1/rpc/is_restaurant_user`,
              {
                method: "POST",

                headers: {
                  apikey:
                    supabaseKey,

                  Authorization:
                    `Bearer ${restaurantAccessToken}`,

                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({}),
              }
            );

          const restaurantData =
            await restaurantResponse.json();

          setRestaurantLoggedIn(
            restaurantResponse.ok &&
              restaurantData === true
          );
        } catch (error) {
          console.error(
            "Restaurant session check error:",
            error
          );

          setRestaurantLoggedIn(false);
        }
      } else {
        setRestaurantLoggedIn(false);
      }
    } finally {
      setSessionLoading(false);
    }
  }

  /*
    =========================
    DATA
    =========================
  */

  function getLocalDate(
    offset = 0
  ) {
    const currentDate =
      new Date();

    currentDate.setDate(
      currentDate.getDate() +
        offset
    );

    const year =
      currentDate.getFullYear();

    const month =
      String(
        currentDate.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        currentDate.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  }

  /*
    =========================
    HOMEPAGE DATA
    RESTAURANTE + POZE + OFERTE
    =========================
  */

  async function loadHomepageData() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      console.error(
        "Supabase nu este configurat."
      );

      setOffersLoading(false);

      return;
    }

    try {
      /*
        1. RESTAURANTE

        IMPORTANT:
        Restaurantele NU mai sunt scrise manual
        în cod.

        Vin automat din Supabase.

        slug este folosit automat pentru:
        /restaurant/casabunicii
        /restaurant/boompub
        etc.
      */

      const restaurantsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurants?select=id,name,slug`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const restaurantRows =
        await restaurantsResponse.json();

      if (
        !restaurantsResponse.ok
      ) {
        console.error(
          "Restaurants error:",
          restaurantRows
        );

        return;
      }

      /*
        Construim restaurantele pentru homepage.

        Momentan informațiile care nu există
        încă în tabel (type, rating etc.)
        primesc valori implicite.

        Mai târziu le putem muta și pe acestea
        în Supabase.
      */

      const homepageRestaurants =
        (
          restaurantRows || []
        ).map(
          (dbRestaurant) => {
            /*
              Păstrăm momentan informațiile
              cunoscute pentru restaurantele
              existente.

              IMPORTANT:
              URL-ul NU mai este hardcodat.
            */

            if (
              dbRestaurant.name ===
              "Casa Bunicii"
            ) {
              return {
                id:
                  dbRestaurant.id,

                name:
                  dbRestaurant.name,

                slug:
                  dbRestaurant.slug,

                type:
                  "Românesc",

                rating:
                  "9.2",

                location:
                  "Timișoara",

                image:
                  "/image.png",

                emoji:
                  "🍲",

                description:
                  "Bucătărie românească și preparate tradiționale.",
              };
            }

            if (
              dbRestaurant.name ===
              "Boom Pub"
            ) {
              return {
                id:
                  dbRestaurant.id,

                name:
                  dbRestaurant.name,

                slug:
                  dbRestaurant.slug,

                type:
                  "Pub",

                rating:
                  "9.1",

                location:
                  "Timișoara",

                image:
                  null,

                emoji:
                  "🍻",

                description:
                  "Atmosferă relaxată, băuturi și preparate de pub.",
              };
            }

            /*
              ORICE RESTAURANT NOU

              Apare automat fără să mai
              modificăm app/page.js.
            */

            return {
              id:
                dbRestaurant.id,

              name:
                dbRestaurant.name,

              slug:
                dbRestaurant.slug,

              type:
                "Restaurant",

              rating:
                null,

              location:
                "Timișoara",

              image:
                null,

              emoji:
                "🍽️",

              description:
                "Descoperă restaurantul și ofertele disponibile.",
            };
          }
        );

      setRestaurants(
        homepageRestaurants
      );

      /*
        2. POZELE PRINCIPALE

        Luăm doar imaginile unde:
        is_cover = true

        Restaurantul controlează singur
        poza care apare pe homepage.
      */

      const imagesResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurant_images?select=restaurant_id,image_url,is_cover&is_cover=eq.true`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const imagesData =
        await imagesResponse.json();

      if (
        !imagesResponse.ok
      ) {
        console.error(
          "Restaurant images error:",
          imagesData
        );
      } else {
        /*
          restaurant UUID
          ->
          URL fotografie
        */

        const imageByRestaurantId =
          {};

        (
          imagesData || []
        ).forEach(
          (image) => {
            if (
              image.restaurant_id &&
              image.image_url
            ) {
              imageByRestaurantId[
                image.restaurant_id
              ] =
                image.image_url;
            }
          }
        );

        /*
          Transformăm apoi:

          nume restaurant
          ->
          URL fotografie
        */

        const mappedImages =
          {};

        (
          restaurantRows || []
        ).forEach(
          (dbRestaurant) => {
            const imageUrl =
              imageByRestaurantId[
                dbRestaurant.id
              ];

            if (imageUrl) {
              mappedImages[
                dbRestaurant.name
              ] =
                imageUrl;
            }
          }
        );

        setRestaurantImageByName(
          mappedImages
        );
      }

      /*
        3. OFERTE DISPONIBILE

        Azi + următoarele 3 zile.
      */

      const today =
        getLocalDate(0);

      const maxDate =
        getLocalDate(3);

      const offersResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/offers?select=id,restaurant_id,offer_date,active&active=eq.true&offer_date=gte.${today}&offer_date=lte.${maxDate}&order=id.desc`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const offersData =
        await offersResponse.json();

      if (
        !offersResponse.ok
      ) {
        console.error(
          "Offers error:",
          offersData
        );

        return;
      }

      /*
        Numărăm ofertele
        pentru fiecare restaurant.
      */

      const mappedCounts =
        {};

      (
        restaurantRows || []
      ).forEach(
        (dbRestaurant) => {
          const count =
            (
              offersData || []
            ).filter(
              (offer) =>
                offer.restaurant_id ===
                dbRestaurant.id
            ).length;

          mappedCounts[
            dbRestaurant.name
          ] = count;
        }
      );

      setOffersCountByRestaurant(
        mappedCounts
      );
    } catch (error) {
      console.error(
        "Homepage data error:",
        error
      );
    } finally {
      setOffersLoading(false);
    }
  }

  function offerCountText(
    count
  ) {
    if (count === 1) {
      return "1 ofertă disponibilă";
    }

    if (count > 1) {
      return `${count} oferte disponibile`;
    }

    return "Momentan fără oferte";
  }

  return (
    <main
      style={{
        
        background:
          "#FAFAF8",

        minHeight:
          "100vh",

        color:
          "#172033",
      }}
    >
      {/* =========================
          NAVBAR
      ========================= */}

      <header
        style={{
          background:
            "rgba(255,255,255,0.96)",

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

          top:
            0,

          zIndex:
            50,

          backdropFilter:
            "blur(10px)",
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
              "30px",

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

        <div
          style={{
            display:
              "flex",

            gap:
              "10px",

            alignItems:
              "center",

            flexWrap:
              "wrap",
          }}
        >
          <a
            href={
              restaurantLoggedIn
                ? "/dashboard"
                : "/login"
            }
            style={{
              textDecoration:
                "none",

              color:
                "#172033",

              border:
                "1px solid #dcdfe5",

              background:
                restaurantLoggedIn
                  ? "#E9F8EF"
                  : "white",

              padding:
                "11px 17px",

              borderRadius:
                "10px",

              fontWeight:
                "800",
            }}
          >
            {sessionLoading
              ? "Pentru restaurante"
              : restaurantLoggedIn
              ? "Dashboard restaurant"
              : "Pentru restaurante"}
          </a>

          <a
            href="/rezervarile-mele"
            style={{
              textDecoration:
                "none",

              color:
                "#172033",

              border:
                "1px solid #dcdfe5",

              background:
                "#white",

              padding:
                "11px 17px",

              borderRadius:
                "10px",

              fontWeight:
                "800",
            }}
          >
            Rezervările mele
          </a>

          <a
            href={
              clientLoggedIn
                ? "/cont/profil"
                : "/cont"
            }
            style={{
              textDecoration:
                "none",

              color:
                "white",

              background:
                "#172033",

              padding:
                "12px 18px",

              borderRadius:
                "10px",

              fontWeight:
                "700",
            }}
          >
            {sessionLoading
              ? "Intră în cont"
              : clientLoggedIn
              ? "Profilul meu"
              : "Intră în cont"}
          </a>
        </div>
      </header>

      {/* =========================
          HERO
      ========================= */}

      <section
        style={{
          padding:
            "90px 6% 80px",

          background:
            "linear-gradient(135deg, #172033 0%, #202c43 65%, #2a3751 100%)",

          color:
            "white",

          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "0 auto",
          }}
        >
          <div
            style={{
              display:
                "inline-block",

              background:
                "rgba(255,90,60,0.16)",

              border:
                "1px solid rgba(255,90,60,0.35)",

              color:
                "#FF8A73",

              padding:
                "8px 13px",

              borderRadius:
                "999px",

              fontWeight:
                "700",

              fontSize:
                "14px",

              marginBottom:
                "22px",
            }}
          >
            Restaurante bune. Oferte mai bune.
          </div>

          <h1
            style={{
              fontSize:
                "clamp(44px, 7vw, 74px)",

              lineHeight:
                "0.98",

              letterSpacing:
                "-3px",

              margin:
                0,

              maxWidth:
                "850px",
            }}
          >
            Descoperă mese bune,
            <br />

            <span
              style={{
                color:
                  "#FF5A3C",
              }}
            >
              la momentul potrivit.
            </span>
          </h1>

          <p
            style={{
              marginTop:
                "25px",

              fontSize:
                "20px",

              color:
                "#d7dce6",

              maxWidth:
                "700px",

              lineHeight:
                1.6,
            }}
          >
            Rezervă la restaurante din Timișoara și
            profită de reduceri disponibile în anumite
            intervale.
          </p>

          <div
            style={{
              marginTop:
                "38px",

              maxWidth:
                "850px",

              background:
                "white",

              padding:
                "9px",

              borderRadius:
                "16px",

              display:
                "flex",

              gap:
                "8px",

              boxShadow:
                "0 18px 60px rgba(0,0,0,0.22)",
            }}
          >
            <input
              placeholder="Ce vrei să mănânci?"
              style={{
                flex:
                  1,

                border:
                  "none",

                outline:
                  "none",

                padding:
                  "16px",

                fontSize:
                  "16px",

                color:
                  "#172033",

                minWidth:
                  0,
              }}
            />

            <div
              style={{
                width:
                  "1px",

                background:
                  "#ececec",
              }}
            />

            <input
              value="Timișoara"
              readOnly
              style={{
                width:
                  "170px",

                border:
                  "none",

                outline:
                  "none",

                padding:
                  "16px",

                fontSize:
                  "16px",

                color:
                  "#667085",

                background:
                  "white",
              }}
            />

            <button
              style={{
                background:
                  "#FF5A3C",

                color:
                  "white",

                border:
                  "none",

                borderRadius:
                  "11px",

                padding:
                  "0 26px",

                fontWeight:
                  "800",

                fontSize:
                  "16px",

                cursor:
                  "pointer",
              }}
            >
              Caută
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          TRUST BAR
      ========================= */}

      <section
        style={{
          background:
            "white",

          borderBottom:
            "1px solid #ececec",

          padding:
            "22px 6%",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "auto",

            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap:
              "18px",
          }}
        >
          {[
            [
              "⚡",
              "Rezervare rapidă",
            ],

            [
              "💸",
              "Reduceri la nota de plată",
            ],

            [
              "📍",
              "Restaurante locale",
            ],

            [
              "✅",
              "Confirmare de la restaurant",
            ],
          ].map(
            ([
              icon,
              text,
            ]) => (
              <div
                key={
                  text
                }
                style={{
                  display:
                    "flex",

                  gap:
                    "10px",

                  alignItems:
                    "center",

                  fontWeight:
                    "700",

                  color:
                    "#485267",
                }}
              >
                <span
                  style={{
                    fontSize:
                      "21px",
                  }}
                >
                  {icon}
                </span>

                <span>
                  {text}
                </span>
              </div>
            )
          )}
        </div>
      </section>

      {/* =========================
          RESTAURANTE
      ========================= */}

      <section
        style={{
          maxWidth:
            "1180px",

          margin:
            "0 auto",

          padding:
            "70px 6%",
        }}
      >
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "end",

            gap:
              "20px",

            marginBottom:
              "30px",

            flexWrap:
              "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin:
                  0,

                color:
                  "#FF5A3C",

                fontWeight:
                  "800",

                fontSize:
                  "14px",

                textTransform:
                  "uppercase",

                letterSpacing:
                  "1px",
              }}
            >
              Descoperă
            </p>

            <h2
              style={{
                margin:
                  "8px 0 8px",

                fontSize:
                  "38px",

                letterSpacing:
                  "-1px",
              }}
            >
              Restaurante în Timișoara
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  "#727b8d",

                fontSize:
                  "17px",
              }}
            >
              Vezi restaurantele și ofertele disponibile
              în următoarele zile.
            </p>
          </div>

          <span
            style={{
              color:
                "#172033",

              fontWeight:
                "800",
            }}
          >
            Vezi toate →
          </span>
        </div>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(290px, 1fr))",

            gap:
              "26px",
          }}
        >
          {restaurants.map(
            (
              restaurant
            ) => {
              const offersCount =
                offersCountByRestaurant[
                  restaurant.name
                ] || 0;

              /*
                ORDINE POZĂ:

                1. Cover din Supabase
                2. fallback manual
                3. emoji
              */

              const restaurantImage =
                restaurantImageByName[
                  restaurant.name
                ] ||
                restaurant.image ||
                null;

              return (
                <article
                  key={
                    restaurant.id ||
                    restaurant.name
                  }
                  style={{
  background: "rgba(255,255,255,0.96)",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid rgba(23,32,51,0.08)",
  boxShadow:
    "0 18px 50px rgba(23,32,51,0.08)",
  transition:
    "transform 0.22s ease, box-shadow 0.22s ease",
                  }}
                >
                  {/* IMAGINE */}

                  <div
                    style={{
                      height:
                        "240px",

                      background:
                        "linear-gradient(135deg, #f1f2f4, #e8eaed)",

                      position:
                        "relative",

                      overflow:
                        "hidden",
                    }}
                  >
                    {restaurantImage ? (
                      <img
                        src={
                          restaurantImage
                        }
                        alt={
                          restaurant.name
                        }
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",

                          objectFit:
                            "cover",

                          display:
                            "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "90px",
                          }}
                        >
                          {
                            restaurant.emoji
                          }
                        </span>
                      </div>
                    )}

                    {/* BADGE OFERTE */}

                    <div
                      style={{
                        position:
                          "absolute",

                        top:
                          "16px",

                        left:
                          "16px",

                        background:
                          offersCount >
                          0
                            ? "#FF5A3C"
                            : "#98A2B3",

                        color:
                          "white",

                        fontWeight:
                          "900",

                        fontSize:
                          "13px",

                        padding:
                          "9px 12px",

                        borderRadius:
                          "10px",

                        boxShadow:
                          offersCount >
                          0
                            ? "0 8px 20px rgba(255,90,60,0.28)"
                            : "none",
                      }}
                    >
                      {offersLoading
                        ? "..."
                        : offersCount >
                          0
                        ? `${offersCount} ${
                            offersCount ===
                            1
                              ? "ofertă"
                              : "oferte"
                          }`
                        : "Fără oferte"}
                    </div>

                    {/* RATING */}

                    {restaurant.rating && (
                      <div
                        style={{
                          position:
                            "absolute",

                          right:
                            "16px",

                          top:
                            "16px",

                          background:
                            "rgba(255,255,255,0.94)",

                          padding:
                            "8px 10px",

                          borderRadius:
                            "10px",

                          fontWeight:
                            "800",
                        }}
                      >
                        ⭐{" "}
                        {
                          restaurant.rating
                        }
                      </div>
                    )}
                  </div>

                  {/* INFO */}

                  <div
                    style={{
                      padding:
                        "22px",
                    }}
                  >
                    <h3
                      style={{
                        margin:
                          0,

                        fontSize:
                          "24px",

                        letterSpacing:
                          "-0.5px",
                      }}
                    >
                      {
                        restaurant.name
                      }
                    </h3>

                    <p
                      style={{
                        color:
                          "#7a8393",

                        margin:
                          "8px 0 12px",
                      }}
                    >
                      {
                        restaurant.type
                      }{" "}
                      •{" "}
                      {
                        restaurant.location
                      }
                    </p>

                    <p
                      style={{
                        color:
                          "#485267",

                        lineHeight:
                          1.5,

                        minHeight:
                          "48px",
                      }}
                    >
                      {
                        restaurant.description
                      }
                    </p>

                    {/* NUMĂR OFERTE */}

                    <div
                      style={{
                        margin:
                          "18px 0",

                        paddingTop:
                          "16px",

                        borderTop:
                          "1px solid #eeeeee",
                      }}
                    >
                      {offersLoading ? (
                        <span
                          style={{
                            color:
                              "#667085",

                            fontSize:
                              "14px",

                            fontWeight:
                              "700",
                          }}
                        >
                          Se verifică ofertele...
                        </span>
                      ) : (
                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              "9px",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "20px",
                            }}
                          >
                            {offersCount >
                            0
                              ? "🎁"
                              : "📅"}
                          </span>

                          <strong
                            style={{
                              color:
                                offersCount >
                                0
                                  ? "#172033"
                                  : "#7A8393",

                              fontSize:
                                "16px",
                            }}
                          >
                            {offerCountText(
                              offersCount
                            )}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* BUTON DINAMIC */}

                    <a
                      href={`/restaurant/${restaurant.slug}`}
                      style={{
                        display:
                          "block",

                        background:
                          "#172033",

                        color:
                          "white",

                        textDecoration:
                          "none",

                        textAlign:
                          "center",

                        padding:
                          "14px",

                        borderRadius:
                          "11px",

                        fontWeight:
                          "800",
                      }}
                    >
                      {offersCount >
                      0
                        ? "Vezi ofertele"
                        : "Vezi restaurantul"}
                    </a>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section
        style={{
          background:
            "#172033",

          color:
            "white",

          padding:
            "80px 6%",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "auto",
          }}
        >
          <div
            style={{
              textAlign:
                "center",

              maxWidth:
                "650px",

              margin:
                "auto",
            }}
          >
            <p
              style={{
                color:
                  "#FF8A73",

                textTransform:
                  "uppercase",

                letterSpacing:
                  "1px",

                fontWeight:
                  "800",

                fontSize:
                  "14px",
              }}
            >
              Simplu și rapid
            </p>

            <h2
              style={{
                fontSize:
                  "38px",

                margin:
                  "8px 0 15px",
              }}
            >
              Cum funcționează Masago?
            </h2>

            <p
              style={{
                color:
                  "#b8c0ce",

                lineHeight:
                  1.6,

                fontSize:
                  "17px",
              }}
            >
              De la descoperirea restaurantului până la
              masă rezervată, în doar câțiva pași.
            </p>
          </div>

          <div
            style={{
              marginTop:
                "50px",

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                "20px",
            }}
          >
            {[
              {
                number:
                  "01",

                icon:
                  "🔎",

                title:
                  "Alege restaurantul",

                text:
                  "Descoperă restaurante și vezi câte oferte sunt disponibile.",
              },

              {
                number:
                  "02",

                icon:
                  "📅",

                title:
                  "Alege ziua și oferta",

                text:
                  "Vezi ofertele pe zile și selectează intervalul potrivit.",
              },

              {
                number:
                  "03",

                icon:
                  "✅",

                title:
                  "Primește confirmarea",

                text:
                  "Restaurantul vede rezervarea și o poate confirma.",
              },

              {
                number:
                  "04",

                icon:
                  "💸",

                title:
                  "Primește reducerea",

                text:
                  "Oferta aleasă rămâne legată de rezervarea ta.",
              },
            ].map(
              (
                item
              ) => (
                <div
                  key={
                    item.number
                  }
                  style={{
                    background:
                      "#202c43",

                    padding:
                      "26px",

                    borderRadius:
                      "18px",

                    border:
                      "1px solid #2c3952",
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
                    }}
                  >
                    {
                      item.number
                    }
                  </div>

                  <div
                    style={{
                      fontSize:
                        "34px",

                      margin:
                        "18px 0",
                    }}
                  >
                    {
                      item.icon
                    }
                  </div>

                  <h3
                    style={{
                      margin:
                        "0 0 10px",
                    }}
                  >
                    {
                      item.title
                    }
                  </h3>

                  <p
                    style={{
                      color:
                        "#b8c0ce",

                      lineHeight:
                        1.6,

                      margin:
                        0,
                    }}
                  >
                    {
                      item.text
                    }
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =========================
          CONTACT
      ========================= */}

      <section
        id="contact"
        style={{
          padding:
            "75px 6%",

          background:
            "#FAFAF8",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "auto",

            background:
              "linear-gradient(135deg, #FF5A3C 0%, #FF684F 100%)",

            color:
              "white",

            padding:
              "55px",

            borderRadius:
              "25px",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              "30px",

            flexWrap:
              "wrap",

            boxShadow:
              "0 18px 45px rgba(255,90,60,0.16)",
          }}
        >
          <div
            style={{
              maxWidth:
                "650px",
            }}
          >
            <div
              style={{
                width:
                  "52px",

                height:
                  "52px",

                borderRadius:
                  "50%",

                background:
                  "white",

                color:
                  "#FF5A3C",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                fontSize:
                  "23px",

                marginBottom:
                  "20px",
              }}
            >
              ☎
            </div>

            <h2
              style={{
                fontSize:
                  "36px",

                margin:
                  "0 0 12px",

                letterSpacing:
                  "-1px",
              }}
            >
              Ai un restaurant?
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  "#FFF1ED",

                fontSize:
                  "18px",

                lineHeight:
                  1.6,
              }}
            >
              Contactează-ne pentru a afla mai multe
              despre Masago și posibilitatea unei colaborări.
            </p>
          </div>

          <a
            href="mailto:contact@masago.ro"
            style={{
              background:
                "white",

              color:
                "#172033",

              textDecoration:
                "none",

              padding:
                "16px 24px",

              borderRadius:
                "11px",

              fontWeight:
                "900",

              fontSize:
                "16px",

              boxShadow:
                "0 8px 20px rgba(0,0,0,0.10)",
            }}
          >
            Contactează-ne →
          </a>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer
        style={{
          padding:
            "30px 6% 45px",

          color:
            "#7a8393",

          textAlign:
            "center",
        }}
      >
        <strong
          style={{
            color:
              "#172033",
          }}
        >
          Masago.
        </strong>{" "}
        © 2026
      </footer>
    </main>
  );
}
