"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [offersCountByRestaurant, setOffersCountByRestaurant] =
    useState({});

  const [restaurantImageByName, setRestaurantImageByName] =
    useState({});

  const [restaurants, setRestaurants] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const [clientLoggedIn, setClientLoggedIn] = useState(false);
  const [restaurantLoggedIn, setRestaurantLoggedIn] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [favoriteRestaurantIds, setFavoriteRestaurantIds] =
    useState([]);

  const [
    favoriteSavingByRestaurant,
    setFavoriteSavingByRestaurant,
  ] = useState({});

  /*
    =========================
    CĂUTARE + FILTRE
    =========================
  */

  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [discountFilter, setDiscountFilter] = useState("all");
  const [todayOnly, setTodayOnly] = useState(false);

  const [offersByRestaurantId, setOffersByRestaurantId] =
    useState({});

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
          const clientResponse = await fetch(
            `${supabaseUrl}/auth/v1/user`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${clientAccessToken}`,
              },
            }
          );

          if (clientResponse.ok) {
            const clientUser =
              await clientResponse.json();

            setClientLoggedIn(true);

            await loadFavorites(
              clientUser.id,
              clientAccessToken
            );
          } else {
            setClientLoggedIn(false);
            setFavoriteRestaurantIds([]);
          }
        } catch (error) {
          console.error(
            "Client session check error:",
            error
          );

          setClientLoggedIn(false);
          setFavoriteRestaurantIds([]);
        }
      } else {
        setClientLoggedIn(false);
        setFavoriteRestaurantIds([]);
      }

      /*
        RESTAURANT
      */

      if (restaurantAccessToken) {
        try {
          const restaurantResponse = await fetch(
            `${supabaseUrl}/rest/v1/rpc/is_restaurant_user`,
            {
              method: "POST",

              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${restaurantAccessToken}`,
                "Content-Type": "application/json",
              },

              body: JSON.stringify({}),
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
    FAVORITE
    =========================
  */

  async function loadFavorites(
    userId,
    accessToken
  ) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !userId ||
      !accessToken
    ) {
      setFavoriteRestaurantIds([]);
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/favorites?select=restaurant_id&user_id=eq.${userId}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Favorites load error:",
          data
        );

        setFavoriteRestaurantIds([]);
        return;
      }

      setFavoriteRestaurantIds(
        (data || []).map(
          (favorite) =>
            favorite.restaurant_id
        )
      );
    } catch (error) {
      console.error(
        "Favorites load error:",
        error
      );

      setFavoriteRestaurantIds([]);
    }
  }

  async function toggleFavorite(
    restaurantId
  ) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const clientAccessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (!clientAccessToken) {
      window.location.href = "/cont";
      return;
    }

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !restaurantId ||
      favoriteSavingByRestaurant[
        restaurantId
      ]
    ) {
      return;
    }

    const isFavorite =
      favoriteRestaurantIds.includes(
        restaurantId
      );

    setFavoriteSavingByRestaurant(
      (current) => ({
        ...current,
        [restaurantId]: true,
      })
    );

    try {
      const userResponse = await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${clientAccessToken}`,
          },
        }
      );

      if (!userResponse.ok) {
        setClientLoggedIn(false);
        setFavoriteRestaurantIds([]);

        window.location.href = "/cont";
        return;
      }

      const user =
        await userResponse.json();

      if (isFavorite) {
        const deleteResponse = await fetch(
          `${supabaseUrl}/rest/v1/favorites?user_id=eq.${user.id}&restaurant_id=eq.${restaurantId}`,
          {
            method: "DELETE",

            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${clientAccessToken}`,
            },
          }
        );

        if (!deleteResponse.ok) {
          const deleteData =
            await deleteResponse.json();

          console.error(
            "Favorite delete error:",
            deleteData
          );

          return;
        }

        setFavoriteRestaurantIds(
          (current) =>
            current.filter(
              (id) =>
                id !== restaurantId
            )
        );
      } else {
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/favorites`,
          {
            method: "POST",

            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${clientAccessToken}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },

            body: JSON.stringify({
              user_id: user.id,
              restaurant_id: restaurantId,
            }),
          }
        );

        if (!insertResponse.ok) {
          const insertData =
            await insertResponse.json();

          console.error(
            "Favorite insert error:",
            insertData
          );

          return;
        }

        setFavoriteRestaurantIds(
          (current) =>
            current.includes(
              restaurantId
            )
              ? current
              : [
                  ...current,
                  restaurantId,
                ]
        );
      }
    } catch (error) {
      console.error(
        "Favorite toggle error:",
        error
      );
    } finally {
      setFavoriteSavingByRestaurant(
        (current) => ({
          ...current,
          [restaurantId]: false,
        })
      );
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
      ).padStart(2, "0");

    const day =
      String(
        currentDate.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /*
    =========================
    HOMEPAGE DATA
    =========================
  */

  async function loadHomepageData() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase nu este configurat."
      );

      setOffersLoading(false);
      return;
    }

    try {
      /*
        RESTAURANTE
      */

      const restaurantsResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=id,name,slug,cuisine_type`,
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

      const homepageRestaurants =
        (restaurantRows || []).map(
          (dbRestaurant) => {
            if (
              dbRestaurant.name ===
              "Casa Bunicii"
            ) {
              return {
                id: dbRestaurant.id,
                name: dbRestaurant.name,
                slug: dbRestaurant.slug,

                type:
                  dbRestaurant.cuisine_type ||
                  "Românesc",

                rating: "9.2",
                location: "Timișoara",
                image: "/image.png",
                emoji: "🍲",

                description:
                  "Bucătărie românească și preparate tradiționale.",
              };
            }

            if (
              dbRestaurant.name ===
              "Boom Pub"
            ) {
              return {
                id: dbRestaurant.id,
                name: dbRestaurant.name,
                slug: dbRestaurant.slug,

                type:
                  dbRestaurant.cuisine_type ||
                  "Pub",

                rating: "9.1",
                location: "Timișoara",
                image: null,
                emoji: "🍻",

                description:
                  "Atmosferă relaxată, băuturi și preparate de pub.",
              };
            }

            return {
              id: dbRestaurant.id,
              name: dbRestaurant.name,
              slug: dbRestaurant.slug,

              type:
                dbRestaurant.cuisine_type ||
                "Restaurant",

              rating: null,
              location: "Timișoara",
              image: null,
              emoji: "🍽️",

              description:
                "Descoperă restaurantul și ofertele disponibile.",
            };
          }
        );

      setRestaurants(
        homepageRestaurants
      );

      /*
        POZE COVER
      */

      const imagesResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_images?select=restaurant_id,image_url,is_cover&is_cover=eq.true`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const imagesData =
        await imagesResponse.json();

      if (!imagesResponse.ok) {
        console.error(
          "Restaurant images error:",
          imagesData
        );
      } else {
        const imageByRestaurantId =
          {};

        (imagesData || []).forEach(
          (image) => {
            if (
              image.restaurant_id &&
              image.image_url
            ) {
              imageByRestaurantId[
                image.restaurant_id
              ] = image.image_url;
            }
          }
        );

        const mappedImages = {};

        (restaurantRows || []).forEach(
          (dbRestaurant) => {
            const imageUrl =
              imageByRestaurantId[
                dbRestaurant.id
              ];

            if (imageUrl) {
              mappedImages[
                dbRestaurant.name
              ] = imageUrl;
            }
          }
        );

        setRestaurantImageByName(
          mappedImages
        );
      }

      /*
        OFERTE
        azi + următoarele 3 zile
      */

      const today =
        getLocalDate(0);

      const maxDate =
        getLocalDate(3);

      const offersResponse = await fetch(
        `${supabaseUrl}/rest/v1/offers?select=id,restaurant_id,offer_date,discount_percent,active&active=eq.true&offer_date=gte.${today}&offer_date=lte.${maxDate}&order=id.desc`,
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

      const mappedCounts = {};
      const mappedOffers = {};

      (restaurantRows || []).forEach(
        (dbRestaurant) => {
          const restaurantOffers =
            (offersData || []).filter(
              (offer) =>
                offer.restaurant_id ===
                dbRestaurant.id
            );

          mappedCounts[
            dbRestaurant.name
          ] =
            restaurantOffers.length;

          mappedOffers[
            dbRestaurant.id
          ] =
            restaurantOffers;
        }
      );

      setOffersCountByRestaurant(
        mappedCounts
      );

      setOffersByRestaurantId(
        mappedOffers
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

  /*
    =========================
    HELPERS FILTRE
    =========================
  */

  function offerCountText(count) {
    if (count === 1) {
      return "1 ofertă disponibilă";
    }

    if (count > 1) {
      return `${count} oferte disponibile`;
    }

    return "Momentan fără oferte";
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }

  const cuisineOptions =
    Array.from(
      new Set(
        restaurants
          .map(
            (restaurant) =>
              restaurant.type
          )
          .filter(Boolean)
      )
    ).sort(
      (a, b) =>
        String(a).localeCompare(
          String(b),
          "ro"
        )
    );

  const today =
    getLocalDate(0);

  const filteredRestaurants =
    restaurants.filter(
      (restaurant) => {
        const normalizedSearch =
          normalizeText(
            searchQuery
          );

        const normalizedName =
          normalizeText(
            restaurant.name
          );

        const normalizedType =
          normalizeText(
            restaurant.type
          );

        const normalizedDescription =
          normalizeText(
            restaurant.description
          );

        const matchesSearch =
          !normalizedSearch ||
          normalizedName.includes(
            normalizedSearch
          ) ||
          normalizedType.includes(
            normalizedSearch
          ) ||
          normalizedDescription.includes(
            normalizedSearch
          );

        const matchesCuisine =
          cuisineFilter === "all" ||
          restaurant.type ===
            cuisineFilter;

        const numericRating =
          Number(
            restaurant.rating || 0
          );

        const matchesRating =
          ratingFilter === "all" ||
          numericRating >=
            Number(ratingFilter);

        const restaurantOffers =
          offersByRestaurantId[
            restaurant.id
          ] || [];

        const maxDiscount =
          restaurantOffers.reduce(
            (max, offer) =>
              Math.max(
                max,
                Number(
                  offer.discount_percent ||
                    0
                )
              ),
            0
          );

        const matchesDiscount =
          discountFilter === "all" ||
          maxDiscount >=
            Number(
              discountFilter
            );

        const hasOfferToday =
          restaurantOffers.some(
            (offer) =>
              offer.offer_date ===
              today
          );

        const matchesToday =
          !todayOnly ||
          hasOfferToday;

        return (
          matchesSearch &&
          matchesCuisine &&
          matchesRating &&
          matchesDiscount &&
          matchesToday
        );
      }
    );

  const filtersActive =
    searchQuery.trim() !== "" ||
    cuisineFilter !== "all" ||
    ratingFilter !== "all" ||
    discountFilter !== "all" ||
    todayOnly;

  function resetFilters() {
    setSearchQuery("");
    setCuisineFilter("all");
    setRatingFilter("all");
    setDiscountFilter("all");
    setTodayOnly(false);
  }

  function goToRestaurants() {
    document
      .getElementById(
        "restaurante"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  /*
    =========================
    UI
    =========================
  */

  return (
    <main
      style={{
        background: "#FAFAF8",
        minHeight: "100vh",
        color: "#172033",
      }}
    >
      {/* NAVBAR */}

      <header
        style={{
          background:
            "rgba(255,255,255,0.96)",

          borderBottom:
            "1px solid #ececec",

          padding: "18px 6%",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          position: "sticky",

          top: 0,

          zIndex: 50,

          backdropFilter:
            "blur(10px)",
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
            href={
              restaurantLoggedIn
                ? "/dashboard"
                : "/login"
            }
            style={{
              textDecoration: "none",
              color: "#172033",
              border:
                "1px solid #dcdfe5",

              background:
                restaurantLoggedIn
                  ? "#E9F8EF"
                  : "white",

              padding:
                "11px 17px",

              borderRadius: "10px",
              fontWeight: "800",
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
              textDecoration: "none",
              color: "#172033",
              border:
                "1px solid #dcdfe5",
              background: "white",
              padding:
                "11px 17px",
              borderRadius: "10px",
              fontWeight: "800",
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
              textDecoration: "none",
              color: "white",
              background: "#172033",
              padding:
                "12px 18px",
              borderRadius: "10px",
              fontWeight: "700",
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

      {/* HERO */}

      <section
        style={{
          padding:
            "90px 6% 80px",

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
              display:
                "inline-block",

              background:
                "rgba(255,90,60,0.16)",

              border:
                "1px solid rgba(255,90,60,0.35)",

              color: "#FF8A73",

              padding:
                "8px 13px",

              borderRadius:
                "999px",

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
            Rezervă la restaurante din Timișoara și
            profită de reduceri disponibile în anumite
            intervale.
          </p>

          {/* SEARCH PRINCIPAL */}

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
              placeholder="Caută restaurant sau bucătărie..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  goToRestaurants();
                }
              }}
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
              type="button"
              onClick={
                goToRestaurants
              }
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
          borderBottom:
            "1px solid #ececec",
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
            ([icon, text]) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems:
                    "center",
                  fontWeight:
                    "700",
                  color: "#485267",
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
          RESTAURANTE + FILTRE
      ========================= */}

      <section
        id="restaurante"
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "70px 6%",
          scrollMarginTop: "95px",
        }}
      >
        {/* TITLU */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "end",
            gap: "20px",
            marginBottom: "26px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#FF5A3C",
                fontWeight: "800",
                fontSize: "14px",
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
                fontSize: "38px",
                letterSpacing:
                  "-1px",
              }}
            >
              Restaurante în Timișoara
            </h2>

            <p
              style={{
                margin: 0,
                color: "#727b8d",
                fontSize: "17px",
              }}
            >
              Caută restaurantul potrivit și filtrează
              ofertele disponibile.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#667085",
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              {filteredRestaurants.length} din{" "}
              {restaurants.length}
            </span>

            {filtersActive && (
              <button
                type="button"
                onClick={
                  resetFilters
                }
                style={{
                  border:
                    "1px solid #DDE1E6",

                  background:
                    "white",

                  color:
                    "#172033",

                  borderRadius:
                    "10px",

                  padding:
                    "9px 12px",

                  fontWeight:
                    "900",

                  cursor:
                    "pointer",
                }}
              >
                Resetează filtrele
              </button>
            )}
          </div>
        </div>

        {/* FILTER BAR */}

        <div
          style={{
            background: "white",

            border:
              "1px solid #E7E9ED",

            borderRadius:
              "18px",

            padding: "16px",

            marginBottom:
              "26px",

            boxShadow:
              "0 10px 30px rgba(23,32,51,0.05)",
          }}
        >
          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",

              gap: "10px",
            }}
          >
            {/* SEARCH */}

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",

                gap: "9px",

                border:
                  "1px solid #DDE1E6",

                borderRadius:
                  "11px",

                padding:
                  "0 12px",

                background:
                  "#FAFBFC",
              }}
            >
              <span
                style={{
                  fontSize:
                    "17px",
                }}
              >
                🔍
              </span>

              <input
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Caută restaurant..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background:
                    "transparent",

                  padding:
                    "13px 0",

                  color:
                    "#172033",

                  fontSize:
                    "14px",
                }}
              />
            </div>

            {/* BUCĂTĂRIE */}

            <select
              value={
                cuisineFilter
              }
              onChange={(event) =>
                setCuisineFilter(
                  event.target.value
                )
              }
              style={{
                width: "100%",

                border:
                  "1px solid #DDE1E6",

                borderRadius:
                  "11px",

                padding:
                  "13px 12px",

                background:
                  "#FAFBFC",

                color:
                  "#172033",

                fontWeight:
                  "800",

                outline: "none",
              }}
            >
              <option value="all">
                🍽️ Toate bucătăriile
              </option>

              {cuisineOptions.map(
                (cuisine) => (
                  <option
                    key={cuisine}
                    value={cuisine}
                  >
                    {cuisine}
                  </option>
                )
              )}
            </select>

            {/* RATING */}

            <select
              value={
                ratingFilter
              }
              onChange={(event) =>
                setRatingFilter(
                  event.target.value
                )
              }
              style={{
                width: "100%",

                border:
                  "1px solid #DDE1E6",

                borderRadius:
                  "11px",

                padding:
                  "13px 12px",

                background:
                  "#FAFBFC",

                color:
                  "#172033",

                fontWeight:
                  "800",

                outline: "none",
              }}
            >
              <option value="all">
                ⭐ Orice rating
              </option>

              <option value="9">
                ⭐ 9.0+
              </option>

              <option value="8">
                ⭐ 8.0+
              </option>

              <option value="7">
                ⭐ 7.0+
              </option>
            </select>

            {/* REDUCERE */}

            <select
              value={
                discountFilter
              }
              onChange={(event) =>
                setDiscountFilter(
                  event.target.value
                )
              }
              style={{
                width: "100%",

                border:
                  "1px solid #DDE1E6",

                borderRadius:
                  "11px",

                padding:
                  "13px 12px",

                background:
                  "#FAFBFC",

                color:
                  "#172033",

                fontWeight:
                  "800",

                outline: "none",
              }}
            >
              <option value="all">
                💸 Orice reducere
              </option>

              <option value="10">
                10%+
              </option>

              <option value="20">
                20%+
              </option>

              <option value="30">
                30%+
              </option>

              <option value="40">
                40%+
              </option>
            </select>
          </div>

          {/* OFERTE AZI */}

          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap: "12px",

              marginTop:
                "12px",

              flexWrap:
                "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setTodayOnly(
                  (current) =>
                    !current
                )
              }
              style={{
                border:
                  todayOnly
                    ? "1px solid #FF5A3C"
                    : "1px solid #DDE1E6",

                background:
                  todayOnly
                    ? "#FFF0EC"
                    : "white",

                color:
                  todayOnly
                    ? "#B42318"
                    : "#475467",

                borderRadius:
                  "999px",

                padding:
                  "9px 13px",

                fontWeight:
                  "900",

                cursor:
                  "pointer",
              }}
            >
              🔥{" "}
              {todayOnly
                ? "Doar oferte azi ✓"
                : "Oferte disponibile azi"}
            </button>

            {filtersActive && (
              <button
                type="button"
                onClick={
                  resetFilters
                }
                style={{
                  border: "none",
                  background:
                    "transparent",
                  color: "#667085",
                  fontWeight:
                    "900",
                  cursor:
                    "pointer",
                  padding: "8px",
                }}
              >
                Șterge filtrele ×
              </button>
            )}
          </div>
        </div>

        {/* CARDURI */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(290px, 1fr))",

            gap: "26px",
          }}
        >
          {filteredRestaurants.map(
            (restaurant) => {
              const offersCount =
                offersCountByRestaurant[
                  restaurant.name
                ] || 0;

              const restaurantOffers =
                offersByRestaurantId[
                  restaurant.id
                ] || [];

              const maximumDiscount =
                restaurantOffers.reduce(
                  (
                    max,
                    offer
                  ) =>
                    Math.max(
                      max,
                      Number(
                        offer.discount_percent ||
                          0
                      )
                    ),
                  0
                );

              const hasOfferToday =
                restaurantOffers.some(
                  (offer) =>
                    offer.offer_date ===
                    today
                );

              const isFavorite =
                favoriteRestaurantIds.includes(
                  restaurant.id
                );

              const favoriteSaving =
                favoriteSavingByRestaurant[
                  restaurant.id
                ] === true;

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
                    background:
                      "rgba(255,255,255,0.96)",

                    borderRadius:
                      "24px",

                    overflow:
                      "hidden",

                    border:
                      "1px solid rgba(23,32,51,0.08)",

                    boxShadow:
                      "0 18px 50px rgba(23,32,51,0.08)",

                    transition:
                      "transform 0.22s ease, box-shadow 0.22s ease",
                  }}
                >
                  {/* IMAGINE */}

                  <div
                    style={{
                      height: "240px",

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

                    {/* OFERTE */}

                    <div
                      style={{
                        position:
                          "absolute",

                        top: "16px",
                        left: "16px",

                        background:
                          offersCount >
                          0
                            ? "#FF5A3C"
                            : "#98A2B3",

                        color: "white",

                        fontWeight:
                          "900",

                        fontSize:
                          "13px",

                        padding:
                          "8px 12px",

                        borderRadius:
                          "999px",

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

                          top: "16px",

                          background:
                            "rgba(255,255,255,0.92)",

                          padding:
                            "8px 10px",

                          borderRadius:
                            "10px",

                          fontWeight:
                            "800",

                          boxShadow:
                            "0 6px 20px rgba(0,0,0,0.10)",
                        }}
                      >
                        ⭐{" "}
                        {
                          restaurant.rating
                        }
                      </div>
                    )}

                    {/* FAVORIT */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite(
                          restaurant.id
                        )
                      }
                      disabled={
                        favoriteSaving
                      }
                      aria-label={
                        isFavorite
                          ? "Șterge din favorite"
                          : "Adaugă la favorite"
                      }
                      title={
                        isFavorite
                          ? "Șterge din favorite"
                          : "Adaugă la favorite"
                      }
                      style={{
                        position:
                          "absolute",

                        right:
                          "16px",

                        bottom:
                          "16px",

                        width: "46px",
                        height: "46px",

                        borderRadius:
                          "50%",

                        border:
                          "1px solid rgba(255,255,255,0.78)",

                        background:
                          "rgba(255,255,255,0.94)",

                        color:
                          isFavorite
                            ? "#FF5A3C"
                            : "#172033",

                        display: "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        fontSize:
                          "27px",

                        cursor:
                          favoriteSaving
                            ? "wait"
                            : "pointer",

                        opacity:
                          favoriteSaving
                            ? 0.65
                            : 1,

                        boxShadow:
                          "0 6px 20px rgba(0,0,0,0.12)",

                        zIndex: 3,
                      }}
                    >
                      {isFavorite
                        ? "♥"
                        : "♡"}
                    </button>
                  </div>

                  {/* INFO */}

                  <div
                    style={{
                      padding:
                        "24px",
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

                        gap: "15px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color:
                              "#FF5A3C",

                            fontSize:
                              "13px",

                            fontWeight:
                              "900",

                            textTransform:
                              "uppercase",

                            letterSpacing:
                              "0.8px",

                            marginBottom:
                              "7px",
                          }}
                        >
                          {
                            restaurant.type
                          }
                        </div>

                        <h3
                          style={{
                            margin: 0,

                            fontSize:
                              "25px",

                            letterSpacing:
                              "-0.5px",
                          }}
                        >
                          {
                            restaurant.name
                          }
                        </h3>
                      </div>

                      <span
                        style={{
                          background:
                            "#F2F4F7",

                          color:
                            "#475467",

                          padding:
                            "7px 10px",

                          borderRadius:
                            "999px",

                          fontSize:
                            "12px",

                          fontWeight:
                            "800",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        📍{" "}
                        {
                          restaurant.location
                        }
                      </span>
                    </div>

                    <p
                      style={{
                        color:
                          "#667085",

                        lineHeight: 1.6,

                        margin:
                          "15px 0 14px",

                        minHeight:
                          "50px",
                      }}
                    >
                      {
                        restaurant.description
                      }
                    </p>

                    {/* INFO OFERTĂ */}

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap: "8px",

                        flexWrap:
                          "wrap",

                        marginBottom:
                          "14px",
                      }}
                    >
                      {maximumDiscount >
                        0 && (
                        <span
                          style={{
                            background:
                              "#FFF0EC",

                            color:
                              "#B42318",

                            border:
                              "1px solid #FFD8CF",

                            borderRadius:
                              "999px",

                            padding:
                              "6px 9px",

                            fontSize:
                              "12px",

                            fontWeight:
                              "900",
                          }}
                        >
                          până la -
                          {
                            maximumDiscount
                          }
                          %
                        </span>
                      )}

                      {hasOfferToday && (
                        <span
                          style={{
                            background:
                              "#FFF8E8",

                            color:
                              "#946200",

                            border:
                              "1px solid #FBE6A2",

                            borderRadius:
                              "999px",

                            padding:
                              "6px 9px",

                            fontSize:
                              "12px",

                            fontWeight:
                              "900",
                          }}
                        >
                          🔥 Ofertă azi
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        background:
                          offersCount >
                          0
                            ? "#FFF5F2"
                            : "#F5F6F7",

                        border:
                          offersCount >
                          0
                            ? "1px solid #FFD8CF"
                            : "1px solid #E4E7EC",

                        borderRadius:
                          "13px",

                        padding:
                          "13px 14px",

                        marginBottom:
                          "18px",

                        color:
                          offersCount >
                          0
                            ? "#A33A29"
                            : "#667085",

                        fontWeight:
                          "800",

                        fontSize:
                          "14px",
                      }}
                    >
                      {offersLoading
                        ? "Se verifică ofertele..."
                        : offerCountText(
                            offersCount
                          )}
                    </div>

                    <a
                      href={`/restaurant/${restaurant.slug}`}
                      style={{
                        display:
                          "block",

                        width: "100%",

                        boxSizing:
                          "border-box",

                        textAlign:
                          "center",

                        textDecoration:
                          "none",

                        background:
                          "#172033",

                        color: "white",

                        borderRadius:
                          "12px",

                        padding:
                          "14px 16px",

                        fontWeight:
                          "900",
                      }}
                    >
                      Vezi restaurantul →
                    </a>
                  </div>
                </article>
              );
            }
          )}
        </div>

        {/* FĂRĂ REZULTATE */}

        {filteredRestaurants.length ===
          0 &&
          !offersLoading && (
            <div
              style={{
                background:
                  "white",

                border:
                  "1px solid #E4E7EC",

                borderRadius:
                  "18px",

                padding: "40px",

                textAlign:
                  "center",

                color:
                  "#667085",

                marginTop:
                  "20px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "42px",

                  marginBottom:
                    "12px",
                }}
              >
                🔍
              </div>

              <strong
                style={{
                  display:
                    "block",

                  color:
                    "#172033",

                  fontSize:
                    "19px",

                  marginBottom:
                    "7px",
                }}
              >
                {filtersActive
                  ? "Niciun restaurant nu corespunde filtrelor"
                  : "Momentan nu există restaurante"}
              </strong>

              <div>
                {filtersActive
                  ? "Încearcă alte filtre sau resetează căutarea."
                  : "Restaurantele vor apărea aici automat după ce sunt adăugate."}
              </div>

              {filtersActive && (
                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  style={{
                    marginTop:
                      "18px",

                    border:
                      "none",

                    background:
                      "#172033",

                    color:
                      "white",

                    borderRadius:
                      "10px",

                    padding:
                      "11px 15px",

                    fontWeight:
                      "900",

                    cursor:
                      "pointer",
                  }}
                >
                  Resetează filtrele
                </button>
              )}
            </div>
          )}
      </section>

      {/* =========================
          CUM FUNCȚIONEAZĂ
      ========================= */}

      <section
        style={{
          padding:
            "75px 6%",

          background:
            "white",

          borderTop:
            "1px solid #ececec",

          borderBottom:
            "1px solid #ececec",
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
              maxWidth:
                "650px",

              marginBottom:
                "40px",
            }}
          >
            <p
              style={{
                margin: 0,

                color:
                  "#FF5A3C",

                fontWeight:
                  "900",

                textTransform:
                  "uppercase",

                fontSize:
                  "13px",

                letterSpacing:
                  "1px",
              }}
            >
              Simplu și rapid
            </p>

            <h2
              style={{
                fontSize:
                  "38px",

                margin:
                  "8px 0 12px",

                letterSpacing:
                  "-1px",
              }}
            >
              Cum funcționează Masago?
            </h2>

            <p
              style={{
                color:
                  "#667085",

                lineHeight:
                  1.6,

                fontSize:
                  "17px",
              }}
            >
              Alegi restaurantul, găsești oferta
              potrivită și trimiți rezervarea direct
              către restaurant.
            </p>
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",

              gap: "20px",
            }}
          >
            {[
              {
                number: "01",
                icon: "🍽️",
                title:
                  "Alege restaurantul",
                text:
                  "Descoperă restaurantele disponibile în Timișoara.",
              },

              {
                number: "02",
                icon: "💸",
                title:
                  "Alege oferta",
                text:
                  "Vezi reducerile disponibile pentru ziua și intervalul dorit.",
              },

              {
                number: "03",
                icon: "📅",
                title:
                  "Rezervă masa",
                text:
                  "Completează rapid data, ora și numărul de persoane.",
              },

              {
                number: "04",
                icon: "✅",
                title:
                  "Primești confirmarea",
                text:
                  "Restaurantul acceptă rezervarea și masa ta este confirmată.",
              },
            ].map((step) => (
              <div
                key={
                  step.number
                }
                style={{
                  border:
                    "1px solid #E7E9ED",

                  borderRadius:
                    "18px",

                  padding:
                    "25px",

                  background:
                    "#FAFAF8",
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

                    marginBottom:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      width:
                        "48px",

                      height:
                        "48px",

                      background:
                        "white",

                      border:
                        "1px solid #E4E7EC",

                      borderRadius:
                        "13px",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "23px",
                    }}
                  >
                    {
                      step.icon
                    }
                  </div>

                  <span
                    style={{
                      color:
                        "#D0D5DD",

                      fontSize:
                        "24px",

                      fontWeight:
                        "900",
                    }}
                  >
                    {
                      step.number
                    }
                  </span>
                </div>

                <h3
                  style={{
                    margin:
                      "0 0 9px",

                    fontSize:
                      "19px",
                  }}
                >
                  {
                    step.title
                  }
                </h3>

                <p
                  style={{
                    margin: 0,

                    color:
                      "#667085",

                    lineHeight:
                      1.6,

                    fontSize:
                      "14px",
                  }}
                >
                  {
                    step.text
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          CTA RESTAURANTE
      ========================= */}

      <section
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
              "0 auto",

            background:
              "linear-gradient(135deg, #172033 0%, #202C43 100%)",

            borderRadius:
              "26px",

            padding: "55px",

            color: "white",

            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",

            gap: "30px",

            alignItems:
              "center",

            overflow:
              "hidden",

            position:
              "relative",
          }}
        >
          <div
            style={{
              position:
                "relative",

              zIndex: 2,
            }}
          >
            <p
              style={{
                margin: 0,

                color:
                  "#FF8A73",

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
              Pentru restaurante
            </p>

            <h2
              style={{
                margin:
                  "9px 0 15px",

                fontSize:
                  "clamp(32px, 5vw, 48px)",

                letterSpacing:
                  "-1.5px",

                lineHeight:
                  1.05,
              }}
            >
              Transformă mesele libere în clienți noi.
            </h2>

            <p
              style={{
                color:
                  "#CBD2DD",

                fontSize:
                  "17px",

                lineHeight:
                  1.65,

                maxWidth:
                  "600px",

                marginBottom:
                  0,
              }}
            >
              Creează oferte în perioadele mai puțin
              aglomerate și atrage clienți prin Masago.
            </p>
          </div>

          <div
            style={{
              display: "flex",

              justifyContent:
                "flex-end",

              alignItems:
                "center",

              position:
                "relative",

              zIndex: 2,
            }}
          >
            <a
              href={
                restaurantLoggedIn
                  ? "/dashboard"
                  : "/login"
              }
              style={{
                display:
                  "inline-block",

                background:
                  "#FF5A3C",

                color: "white",

                textDecoration:
                  "none",

                padding:
                  "15px 22px",

                borderRadius:
                  "12px",

                fontWeight:
                  "900",

                boxShadow:
                  "0 10px 30px rgba(255,90,60,0.25)",
              }}
            >
              {restaurantLoggedIn
                ? "Intră în dashboard →"
                : "Adaugă restaurantul →"}
            </a>
          </div>

          <div
            style={{
              position:
                "absolute",

              width:
                "300px",

              height:
                "300px",

              borderRadius:
                "50%",

              background:
                "rgba(255,90,60,0.08)",

              right:
                "-80px",

              top:
                "-120px",
            }}
          />
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer
        style={{
          background:
            "#172033",

          color: "white",

          padding:
            "45px 6%",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "0 auto",

            display: "flex",

            justifyContent:
              "space-between",

            gap: "25px",

            flexWrap:
              "wrap",

            alignItems:
              "center",
          }}
        >
          <div>
            <a
              href="/"
              style={{
                textDecoration:
                  "none",

                color: "white",

                fontSize:
                  "27px",

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
                color:
                  "#98A2B3",

                marginTop:
                  "8px",

                fontSize:
                  "14px",
              }}
            >
              Restaurante bune. Oferte mai bune.
            </div>
          </div>

          <div
            style={{
              display: "flex",

              gap: "20px",

              flexWrap:
                "wrap",

              alignItems:
                "center",
            }}
          >
            <a
              href="/rezervarile-mele"
              style={{
                color:
                  "#CBD2DD",

                textDecoration:
                  "none",

                fontWeight:
                  "700",

                fontSize:
                  "14px",
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
                color:
                  "#CBD2DD",

                textDecoration:
                  "none",

                fontWeight:
                  "700",

                fontSize:
                  "14px",
              }}
            >
              {clientLoggedIn
                ? "Profilul meu"
                : "Cont client"}
            </a>

            <a
              href={
                restaurantLoggedIn
                  ? "/dashboard"
                  : "/login"
              }
              style={{
                color:
                  "#CBD2DD",

                textDecoration:
                  "none",

                fontWeight:
                  "700",

                fontSize:
                  "14px",
              }}
            >
              Pentru restaurante
            </a>
          </div>
        </div>

        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "30px auto 0",

            paddingTop:
              "22px",

            borderTop:
              "1px solid rgba(255,255,255,0.08)",

            color:
              "#667085",

            fontSize:
              "13px",
          }}
        >
          © {new Date().getFullYear()} Masago. Toate
          drepturile rezervate.
        </div>
      </footer>
    </main>
  );
}
