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

  /*
    =========================
    NOTIFICĂRI
    =========================
  */

  const [notifications, setNotifications] = useState([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    markingNotificationId,
    setMarkingNotificationId,
  ] = useState(null);

  const [
    markingAllNotifications,
    setMarkingAllNotifications,
  ] = useState(false);

  useEffect(() => {
    loadHomepageData();
    checkSessions();
  }, []);

  /*
    Reîncarcă notificările automat la 30 secunde
    cât timp clientul este autentificat.
  */

  useEffect(() => {
    if (!clientLoggedIn) {
      return;
    }

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () =>
      clearInterval(interval);
  }, [clientLoggedIn]);

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
                  apikey:
                    supabaseKey,

                  Authorization:
                    `Bearer ${clientAccessToken}`,
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

            /*
              NOU:
              încărcăm notificările clientului.
            */

            await loadNotifications(
              clientUser.id,
              clientAccessToken
            );
          } else {
            setClientLoggedIn(false);

            setFavoriteRestaurantIds(
              []
            );

            setNotifications([]);

            setNotificationsOpen(
              false
            );
          }
        } catch (error) {
          console.error(
            "Client session check error:",
            error
          );

          setClientLoggedIn(false);

          setFavoriteRestaurantIds(
            []
          );

          setNotifications([]);

          setNotificationsOpen(
            false
          );
        }
      } else {
        setClientLoggedIn(false);

        setFavoriteRestaurantIds(
          []
        );

        setNotifications([]);

        setNotificationsOpen(
          false
        );
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
                method:
                  "POST",

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
              restaurantData ===
                true
          );
        } catch (error) {
          console.error(
            "Restaurant session check error:",
            error
          );

          setRestaurantLoggedIn(
            false
          );
        }
      } else {
        setRestaurantLoggedIn(
          false
        );
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
      setFavoriteRestaurantIds(
        []
      );

      return;
    }

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/favorites?select=restaurant_id&user_id=eq.${userId}`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Favorites load error:",
          data
        );

        setFavoriteRestaurantIds(
          []
        );

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

      setFavoriteRestaurantIds(
        []
      );
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
      window.location.href =
        "/cont";

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

        [restaurantId]:
          true,
      })
    );

    try {
      const userResponse =
        await fetch(
          `${supabaseUrl}/auth/v1/user`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${clientAccessToken}`,
            },
          }
        );

      if (!userResponse.ok) {
        setClientLoggedIn(
          false
        );

        setFavoriteRestaurantIds(
          []
        );

        window.location.href =
          "/cont";

        return;
      }

      const user =
        await userResponse.json();

      if (isFavorite) {
        const deleteResponse =
          await fetch(
            `${supabaseUrl}/rest/v1/favorites?user_id=eq.${user.id}&restaurant_id=eq.${restaurantId}`,
            {
              method:
                "DELETE",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${clientAccessToken}`,
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
                id !==
                restaurantId
            )
        );
      } else {
        const insertResponse =
          await fetch(
            `${supabaseUrl}/rest/v1/favorites`,
            {
              method:
                "POST",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${clientAccessToken}`,

                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal",
              },

              body:
                JSON.stringify({
                  user_id:
                    user.id,

                  restaurant_id:
                    restaurantId,
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

          [restaurantId]:
            false,
        })
      );
    }
  }

  /*
    =========================
    NOTIFICĂRI
    =========================
  */

  async function loadNotifications(
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
      setNotifications([]);

      return;
    }

    setNotificationsLoading(
      true
    );

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/notifications?select=id,user_id,reservation_id,type,title,message,read,created_at&user_id=eq.${userId}&order=created_at.desc&limit=20`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Notifications load error:",
          data
        );

        return;
      }

      setNotifications(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Notifications load error:",
        error
      );
    } finally {
      setNotificationsLoading(
        false
      );
    }
  }

  /*
    Reîncarcă notificările fără să afecteze
    restul sesiunii.
  */

  async function refreshNotifications() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      return;
    }

    try {
      const userResponse =
        await fetch(
          `${supabaseUrl}/auth/v1/user`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      if (!userResponse.ok) {
        return;
      }

      const user =
        await userResponse.json();

      if (!user?.id) {
        return;
      }

      await loadNotifications(
        user.id,
        accessToken
      );
    } catch (error) {
      console.error(
        "Notifications refresh error:",
        error
      );
    }
  }

  /*
    Marchează o singură notificare
    ca citită.
  */

  async function markNotificationRead(
    notificationId
  ) {
    if (!notificationId) {
      return false;
    }

    const notification =
      notifications.find(
        (item) =>
          item.id ===
          notificationId
      );

    if (notification?.read) {
      return true;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      return false;
    }

    setMarkingNotificationId(
      notificationId
    );

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/notifications?id=eq.${notificationId}`,
          {
            method:
              "PATCH",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal",
            },

            body:
              JSON.stringify({
                read:
                  true,
              }),
          }
        );

      if (!response.ok) {
        const data =
          await response.text();

        console.error(
          "Notification read error:",
          data
        );

        return false;
      }

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,

                    read:
                      true,
                  }
                : item
          )
      );

      return true;
    } catch (error) {
      console.error(
        "Notification read error:",
        error
      );

      return false;
    } finally {
      setMarkingNotificationId(
        null
      );
    }
  }

  /*
    Marchează toate notificările
    ca citite.
  */

  async function markAllNotificationsRead() {
    const unreadIds =
      notifications
        .filter(
          (notification) =>
            !notification.read
        )
        .map(
          (notification) =>
            notification.id
        );

    if (
      unreadIds.length ===
        0 ||
      markingAllNotifications
    ) {
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      return;
    }

    setMarkingAllNotifications(
      true
    );

    try {
      const idsFilter =
        unreadIds.join(",");

      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/notifications?id=in.(${idsFilter})`,
          {
            method:
              "PATCH",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal",
            },

            body:
              JSON.stringify({
                read:
                  true,
              }),
          }
        );

      if (!response.ok) {
        const data =
          await response.text();

        console.error(
          "Mark all notifications error:",
          data
        );

        return;
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,

              read:
                true,
            })
          )
      );
    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error
      );
    } finally {
      setMarkingAllNotifications(
        false
      );
    }
  }

  /*
    La click pe notificare:

    1. dacă e necitită -> read = true
    2. închidem dropdown-ul
    3. mergem la Rezervările mele
  */

  async function handleNotificationClick(
    notification
  ) {
    if (!notification) {
      return;
    }

    if (!notification.read) {
      await markNotificationRead(
        notification.id
      );
    }

    setNotificationsOpen(
      false
    );

    window.location.href =
      "/rezervarile-mele";
  }

  /*
    Text mic:
    Acum / 5 min / 2 h / dată
  */

  function formatNotificationTime(
    value
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const now =
      new Date();

    const diffMs =
      now.getTime() -
      date.getTime();

    const diffMinutes =
      Math.floor(
        diffMs / 60000
      );

    if (diffMinutes < 1) {
      return "Acum";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    }

    const diffHours =
      Math.floor(
        diffMinutes / 60
      );

    if (diffHours < 24) {
      return `${diffHours} h`;
    }

    return date.toLocaleDateString(
      "ro-RO",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",
      }
    );
  }

  function notificationIcon(
    type
  ) {
    if (
      type ===
      "reservation_accepted"
    ) {
      return "✅";
    }

    if (
      type ===
      "reservation_rejected"
    ) {
      return "❌";
    }

    return "🔔";
  }

  const unreadNotificationsCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

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

      setOffersLoading(
        false
      );

      return;
    }

    try {
      /*
        RESTAURANTE
      */

      const restaurantsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurants?select=id,name,slug,cuisine_type`,
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

      const homepageRestaurants =
        (
          restaurantRows || []
        ).map(
          (dbRestaurant) => {
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
                  dbRestaurant.cuisine_type ||
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
                  dbRestaurant.cuisine_type ||
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

            return {
              id:
                dbRestaurant.id,

              name:
                dbRestaurant.name,

              slug:
                dbRestaurant.slug,

              type:
                dbRestaurant.cuisine_type ||
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
        POZE COVER
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
        OFERTE
        azi + următoarele 3 zile
      */

      const today =
        getLocalDate(0);

      const maxDate =
        getLocalDate(3);

      const offersResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/offers?select=id,restaurant_id,offer_date,discount_percent,active&active=eq.true&offer_date=gte.${today}&offer_date=lte.${maxDate}&order=id.desc`,
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

      const mappedCounts =
        {};

      const mappedOffers =
        {};

      (
        restaurantRows || []
      ).forEach(
        (dbRestaurant) => {
          const restaurantOffers =
            (
              offersData || []
            ).filter(
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
      setOffersLoading(
        false
      );
    }
  }

  /*
    =========================
    HELPERS FILTRE
    =========================
  */

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

  function normalizeText(
    value
  ) {
    return String(
      value || ""
    )
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
          cuisineFilter ===
            "all" ||
          restaurant.type ===
            cuisineFilter;

        const numericRating =
          Number(
            restaurant.rating ||
              0
          );

        const matchesRating =
          ratingFilter ===
            "all" ||
          numericRating >=
            Number(
              ratingFilter
            );

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
          discountFilter ===
            "all" ||
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
    searchQuery.trim() !==
      "" ||
    cuisineFilter !==
      "all" ||
    ratingFilter !==
      "all" ||
    discountFilter !==
      "all" ||
    todayOnly;

  function resetFilters() {
    setSearchQuery("");

    setCuisineFilter(
      "all"
    );

    setRatingFilter(
      "all"
    );

    setDiscountFilter(
      "all"
    );

    setTodayOnly(false);
  }

  function goToRestaurants() {
    document
      .getElementById(
        "restaurante"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start",
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
        background:
          "#FAFAF8",

        minHeight:
          "100vh",

        color:
          "#172033",
      }}
    >
      {/* NAVBAR */}

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
                "white",

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

          {/* =========================
              CLOPOȚEL NOTIFICĂRI
          ========================= */}

          {clientLoggedIn && (
            <div
              style={{
                position:
                  "relative",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(
                    (current) =>
                      !current
                  )
                }
                aria-label="Notificări"
                title="Notificări"
                style={{
                  width:
                    "45px",

                  height:
                    "45px",

                  border:
                    "1px solid #dcdfe5",

                  borderRadius:
                    "11px",

                  background:
                    notificationsOpen
                      ? "#FFF5F2"
                      : "white",

                  color:
                    "#172033",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  cursor:
                    "pointer",

                  fontSize:
                    "20px",

                  position:
                    "relative",
                }}
              >
                🔔

                {unreadNotificationsCount >
                  0 && (
                  <span
                    style={{
                      position:
                        "absolute",

                      right:
                        "-6px",

                      top:
                        "-6px",

                      minWidth:
                        "20px",

                      height:
                        "20px",

                      padding:
                        "0 5px",

                      borderRadius:
                        "999px",

                      background:
                        "#E5484D",

                      color:
                        "white",

                      border:
                        "2px solid white",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "10px",

                      lineHeight:
                        1,

                      fontWeight:
                        "900",
                    }}
                  >
                    {unreadNotificationsCount >
                    99
                      ? "99+"
                      : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  style={{
                    position:
                      "absolute",

                    right:
                      0,

                    top:
                      "55px",

                    width:
                      "min(390px, calc(100vw - 30px))",

                    background:
                      "white",

                    border:
                      "1px solid #E4E7EC",

                    borderRadius:
                      "17px",

                    boxShadow:
                      "0 20px 60px rgba(23,32,51,0.18)",

                    overflow:
                      "hidden",

                    zIndex:
                      100,
                  }}
                >
                  {/* HEADER DROPDOWN */}

                  <div
                    style={{
                      padding:
                        "16px 17px",

                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      gap:
                        "12px",

                      borderBottom:
                        "1px solid #EEF0F3",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            "#172033",

                          fontWeight:
                            "900",

                          fontSize:
                            "15px",
                        }}
                      >
                        Notificări
                      </div>

                      <div
                        style={{
                          color:
                            "#98A2B3",

                          fontSize:
                            "11px",

                          marginTop:
                            "2px",
                        }}
                      >
                        {unreadNotificationsCount >
                        0
                          ? `${unreadNotificationsCount} necitite`
                          : "Ești la zi"}
                      </div>
                    </div>

                    {unreadNotificationsCount >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          markAllNotificationsRead
                        }
                        disabled={
                          markingAllNotifications
                        }
                        style={{
                          border:
                            "none",

                          background:
                            "transparent",

                          color:
                            "#FF5A3C",

                          fontSize:
                            "11px",

                          fontWeight:
                            "900",

                          cursor:
                            markingAllNotifications
                              ? "wait"
                              : "pointer",

                          padding:
                            "4px",
                        }}
                      >
                        {markingAllNotifications
                          ? "Se marchează..."
                          : "Marchează toate"}
                      </button>
                    )}
                  </div>

                  {/* LISTĂ */}

                  <div
                    style={{
                      maxHeight:
                        "390px",

                      overflowY:
                        "auto",
                    }}
                  >
                    {notificationsLoading ? (
                      <div
                        style={{
                          padding:
                            "30px 18px",

                          textAlign:
                            "center",

                          color:
                            "#667085",

                          fontSize:
                            "13px",
                        }}
                      >
                        Se încarcă notificările...
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      <div
                        style={{
                          padding:
                            "34px 18px",

                          textAlign:
                            "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              "30px",

                            marginBottom:
                              "9px",
                          }}
                        >
                          🔔
                        </div>

                        <strong
                          style={{
                            display:
                              "block",

                            color:
                              "#172033",

                            fontSize:
                              "14px",

                            marginBottom:
                              "5px",
                          }}
                        >
                          Nicio notificare
                        </strong>

                        <div
                          style={{
                            color:
                              "#98A2B3",

                            fontSize:
                              "12px",

                            lineHeight:
                              1.5,
                          }}
                        >
                          Aici vei vedea când un restaurant îți confirmă sau respinge rezervarea.
                        </div>
                      </div>
                    ) : (
                      notifications.map(
                        (
                          notification
                        ) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            disabled={
                              markingNotificationId ===
                              notification.id
                            }
                            style={{
                              width:
                                "100%",

                              border:
                                "none",

                              borderBottom:
                                "1px solid #EEF0F3",

                              background:
                                notification.read
                                  ? "white"
                                  : "#FFF8F6",

                              padding:
                                "15px 17px",

                              textAlign:
                                "left",

                              cursor:
                                markingNotificationId ===
                                notification.id
                                  ? "wait"
                                  : "pointer",

                              display:
                                "flex",

                              gap:
                                "11px",

                              alignItems:
                                "flex-start",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  "38px",

                                height:
                                  "38px",

                                flexShrink:
                                  0,

                                borderRadius:
                                  "11px",

                                background:
                                  notification.type ===
                                  "reservation_rejected"
                                    ? "#FFF0F0"
                                    : "#ECFDF3",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                fontSize:
                                  "17px",
                              }}
                            >
                              {notificationIcon(
                                notification.type
                              )}
                            </div>

                            <div
                              style={{
                                flex:
                                  1,

                                minWidth:
                                  0,
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",

                                  justifyContent:
                                    "space-between",

                                  gap:
                                    "10px",

                                  alignItems:
                                    "flex-start",
                                }}
                              >
                                <strong
                                  style={{
                                    color:
                                      "#172033",

                                    fontSize:
                                      "13px",

                                    lineHeight:
                                      1.35,
                                  }}
                                >
                                  {
                                    notification.title
                                  }
                                </strong>

                                <span
                                  style={{
                                    color:
                                      "#98A2B3",

                                    fontSize:
                                      "10px",

                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {formatNotificationTime(
                                    notification.created_at
                                  )}
                                </span>
                              </div>

                              <div
                                style={{
                                  color:
                                    "#667085",

                                  fontSize:
                                    "12px",

                                  lineHeight:
                                    1.45,

                                  marginTop:
                                    "5px",
                                }}
                              >
                                {
                                  notification.message
                                }
                              </div>

                              {!notification.read && (
                                <div
                                  style={{
                                    marginTop:
                                      "8px",

                                    color:
                                      "#FF5A3C",

                                    fontSize:
                                      "10px",

                                    fontWeight:
                                      "900",
                                  }}
                                >
                                  ● Nou
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      )
                    )}
                  </div>

                  <a
                    href="/rezervarile-mele"
                    onClick={() =>
                      setNotificationsOpen(
                        false
                      )
                    }
                    style={{
                      display:
                        "block",

                      padding:
                        "13px 16px",

                      textAlign:
                        "center",

                      textDecoration:
                        "none",

                      color:
                        "#172033",

                      background:
                        "#FAFBFC",

                      borderTop:
                        "1px solid #EEF0F3",

                      fontSize:
                        "12px",

                      fontWeight:
                        "900",
                    }}
                  >
                    Vezi rezervările mele →
                  </a>
                </div>
              )}
            </div>
          )}

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
              background: "rgba(255,90,60,0.16)",
              border: "1px solid rgba(255,90,60,0.35)",
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
              fontSize: "clamp(44px, 7vw, 74px)",
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

          {/* CĂUTARE HERO */}

          <div
            style={{
              marginTop: "38px",
              maxWidth: "850px",
              background: "white",
              padding: "9px",
              borderRadius: "16px",
              display: "flex",
              gap: "8px",
              boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
              flexWrap: "wrap",
            }}
          >
            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  goToRestaurants();
                }
              }}
              placeholder="Caută restaurant..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "16px",
                fontSize: "16px",
                color: "#172033",
                minWidth: "210px",
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
              onClick={goToRestaurants}
              style={{
                background: "#FF5A3C",
                color: "white",
                border: "none",
                borderRadius: "11px",
                padding: "0 26px",
                minHeight: "52px",
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

      {/* =========================
          TRUST BAR
      ========================= */}

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
            ["✅", "Confirmare de la restaurant"],
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

      {/* =========================
          RESTAURANTE + FILTRE
      ========================= */}

      <section
        id="restaurante"
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "70px 6%",
          scrollMarginTop: "100px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: "20px",
            marginBottom: "25px",
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
              Restaurante în Timișoara
            </h2>

            <p
              style={{
                margin: 0,
                color: "#727b8d",
                fontSize: "17px",
              }}
            >
              Găsește restaurantul potrivit și filtrează
              rapid ofertele disponibile.
            </p>
          </div>

          <span
            style={{
              background: "#F2F4F7",
              color: "#475467",
              borderRadius: "999px",
              padding: "9px 13px",
              fontWeight: "800",
              fontSize: "12px",
            }}
          >
            {filteredRestaurants.length} restaurante
          </span>
        </div>

        {/* FILTRE */}

        <div
          style={{
            background: "white",
            border: "1px solid #E4E7EC",
            borderRadius: "18px",
            padding: "15px",
            marginBottom: "28px",
            boxShadow: "0 8px 25px rgba(23,32,51,0.04)",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: "1 1 240px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "15px",
              }}
            >
              🔍
            </span>

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Caută restaurant..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #DDE1E7",
                background: "#FAFBFC",
                borderRadius: "11px",
                padding: "12px 12px 12px 40px",
                color: "#172033",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          <select
            value={cuisineFilter}
            onChange={(event) =>
              setCuisineFilter(event.target.value)
            }
            style={{
              border: "1px solid #DDE1E7",
              background: "#FAFBFC",
              borderRadius: "11px",
              padding: "12px 14px",
              color: "#172033",
              fontWeight: "700",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">
              Toate bucătăriile
            </option>

            {cuisineOptions.map((cuisine) => (
              <option
                key={cuisine}
                value={cuisine}
              >
                {cuisine}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(event.target.value)
            }
            style={{
              border: "1px solid #DDE1E7",
              background: "#FAFBFC",
              borderRadius: "11px",
              padding: "12px 14px",
              color: "#172033",
              fontWeight: "700",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">
              Orice rating
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

          <select
            value={discountFilter}
            onChange={(event) =>
              setDiscountFilter(event.target.value)
            }
            style={{
              border: "1px solid #DDE1E7",
              background: "#FAFBFC",
              borderRadius: "11px",
              padding: "12px 14px",
              color: "#172033",
              fontWeight: "700",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">
              Orice reducere
            </option>

            <option value="10">
              -10%+
            </option>

            <option value="20">
              -20%+
            </option>

            <option value="30">
              -30%+
            </option>

            <option value="40">
              -40%+
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              setTodayOnly((current) => !current)
            }
            style={{
              border: todayOnly
                ? "1px solid #FF5A3C"
                : "1px solid #DDE1E7",
              background: todayOnly
                ? "#FFF1ED"
                : "#FAFBFC",
              color: todayOnly
                ? "#E5482B"
                : "#172033",
              borderRadius: "11px",
              padding: "12px 14px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            {todayOnly ? "✓ " : ""}
            Oferte azi
          </button>

          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                border: "none",
                background: "transparent",
                color: "#FF5A3C",
                padding: "12px",
                fontWeight: "900",
                cursor: "pointer",
              }}
            >
              Resetează
            </button>
          )}
        </div>

        {/* CARDURI RESTAURANTE */}

        {filteredRestaurants.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid #E4E7EC",
              borderRadius: "20px",
              padding: "55px 25px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "12px",
              }}
            >
              🔍
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "21px",
              }}
            >
              Nu am găsit restaurante
            </h3>

            <p
              style={{
                color: "#667085",
                margin: "0 0 18px",
              }}
            >
              Încearcă să modifici căutarea sau filtrele.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              style={{
                background: "#172033",
                color: "white",
                border: "none",
                borderRadius: "11px",
                padding: "12px 18px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Resetează filtrele
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "26px",
            }}
          >
            {filteredRestaurants.map((restaurant) => {
              const offersCount =
                offersCountByRestaurant[
                  restaurant.name
                ] || 0;

              const restaurantImage =
                restaurantImageByName[
                  restaurant.name
                ] ||
                restaurant.image ||
                null;

              const isFavorite =
                favoriteRestaurantIds.includes(
                  restaurant.id
                );

              const favoriteSaving =
                favoriteSavingByRestaurant[
                  restaurant.id
                ];

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
                        offer.discount_percent || 0
                      )
                    ),
                  0
                );

              return (
                <article
                  key={
                    restaurant.id ||
                    restaurant.name
                  }
                  style={{
                    background: "white",
                    borderRadius: "22px",
                    overflow: "hidden",
                    border: "1px solid #ebedf0",
                    boxShadow:
                      "0 12px 35px rgba(23,32,51,0.07)",
                  }}
                >
                  {/* IMAGINE */}

                  <div
                    style={{
                      height: "220px",
                      background:
                        "linear-gradient(135deg, #f1f2f4, #e8eaed)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {restaurantImage ? (
                      <img
                        src={restaurantImage}
                        alt={restaurant.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
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
                      </div>
                    )}

                    {/* BADGE OFERTE */}

                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        left: "16px",
                        background:
                          offersCount > 0
                            ? "#FF5A3C"
                            : "#98A2B3",
                        color: "white",
                        fontWeight: "900",
                        fontSize: "13px",
                        padding: "9px 12px",
                        borderRadius: "10px",
                        boxShadow:
                          offersCount > 0
                            ? "0 8px 20px rgba(255,90,60,0.28)"
                            : "none",
                      }}
                    >
                      {offersLoading
                        ? "..."
                        : offersCount > 0
                        ? `${offersCount} ${
                            offersCount === 1
                              ? "ofertă"
                              : "oferte"
                          }`
                        : "Fără oferte"}
                    </div>

                    {/* FAVORIT */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite(
                          restaurant.id
                        )
                      }
                      disabled={favoriteSaving}
                      title={
                        isFavorite
                          ? "Scoate din favorite"
                          : "Adaugă la favorite"
                      }
                      style={{
                        position: "absolute",
                        right: "16px",
                        bottom: "16px",
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        border: "none",
                        background: "white",
                        boxShadow:
                          "0 6px 18px rgba(23,32,51,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: favoriteSaving
                          ? "wait"
                          : "pointer",
                        fontSize: "20px",
                      }}
                    >
                      {favoriteSaving
                        ? "..."
                        : isFavorite
                        ? "❤️"
                        : "🤍"}
                    </button>

                    {/* RATING */}

                    {restaurant.rating && (
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
                    )}
                  </div>

                  {/* INFO */}

                  <div
                    style={{
                      padding: "22px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px",
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

                      {maxDiscount > 0 && (
                        <span
                          style={{
                            background: "#FFF1ED",
                            color: "#E5482B",
                            borderRadius: "999px",
                            padding: "6px 9px",
                            fontWeight: "900",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          până la -{maxDiscount}%
                        </span>
                      )}
                    </div>

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

                    {/* OFERTE */}

                    <div
                      style={{
                        margin: "18px 0",
                        paddingTop: "16px",
                        borderTop:
                          "1px solid #eeeeee",
                      }}
                    >
                      {offersLoading ? (
                        <span
                          style={{
                            color: "#667085",
                            fontSize: "14px",
                            fontWeight: "700",
                          }}
                        >
                          Se verifică ofertele...
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "20px",
                            }}
                          >
                            {offersCount > 0
                              ? "🎁"
                              : "📅"}
                          </span>

                          <strong
                            style={{
                              color:
                                offersCount > 0
                                  ? "#172033"
                                  : "#7A8393",
                              fontSize: "16px",
                            }}
                          >
                            {offerCountText(
                              offersCount
                            )}
                          </strong>
                        </div>
                      )}
                    </div>

                    <a
                      href={`/restaurant/${restaurant.slug}`}
                      style={{
                        display: "block",
                        background: "#172033",
                        color: "white",
                        textDecoration: "none",
                        textAlign: "center",
                        padding: "15px 18px",
                        borderRadius: "14px",
                        fontWeight: "800",
                        fontSize: "15px",
                        boxShadow:
                          "0 8px 20px rgba(23,32,51,0.16)",
                      }}
                    >
                      {offersCount > 0
                        ? "Vezi ofertele"
                        : "Vezi restaurantul"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}

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
              De la descoperirea restaurantului până la
              masă rezervată, în doar câțiva pași.
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
                text:
                  "Descoperă restaurante și vezi câte oferte sunt disponibile.",
              },
              {
                number: "02",
                icon: "📅",
                title: "Alege ziua și oferta",
                text:
                  "Vezi ofertele pe zile și selectează intervalul potrivit.",
              },
              {
                number: "03",
                icon: "✅",
                title: "Primește confirmarea",
                text:
                  "Restaurantul vede rezervarea și o poate confirma.",
              },
              {
                number: "04",
                icon: "💸",
                title: "Primește reducerea",
                text:
                  "Oferta aleasă rămâne legată de rezervarea ta.",
              },
            ].map((item) => (
              <div
                key={item.number}
                style={{
                  background: "#202c43",
                  padding: "26px",
                  borderRadius: "18px",
                  border: "1px solid #2c3952",
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

      {/* =========================
          CONTACT
      ========================= */}

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
              Contactează-ne pentru a afla mai multe
              despre Masago și posibilitatea unei colaborări.
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

      {/* =========================
          FOOTER
      ========================= */}

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
