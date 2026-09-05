"use client";

import {
  useEffect,
  useState,
} from "react";

export default function ProfilClientPage() {
  /*
    =========================
    PROFIL
    =========================
  */

  const [email, setEmail] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  /*
    =========================
    PAROLA
    =========================
  */

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordOpen,
    setPasswordOpen,
  ] = useState(false);

  /*
    =========================
    LOADING / MESAJE
    =========================
  */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState(false);

  /*
    =========================
    FAVORITE
    =========================
  */

  const [
    favoriteRestaurants,
    setFavoriteRestaurants,
  ] = useState([]);

  const [
    favoritesLoading,
    setFavoritesLoading,
  ] = useState(true);

  const [
    favoriteMessage,
    setFavoriteMessage,
  ] = useState("");

  const [
    removingFavoriteId,
    setRemovingFavoriteId,
  ] = useState(null);

  /*
    =========================
    START
    =========================
  */

  useEffect(() => {
    loadProfile();
    loadFavorites();
  }, []);

  /*
    =========================
    SESIUNE
    =========================
  */

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

  async function refreshSession(
    supabaseUrl,
    supabaseKey
  ) {
    const refreshToken =
      localStorage.getItem(
        "masago_client_refresh_token"
      );

    if (!refreshToken) {
      return null;
    }

    try {
      const response =
        await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
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
                refresh_token:
                  refreshToken,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.access_token
      ) {
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
          JSON.stringify(
            data.user
          )
        );
      }

      return {
        accessToken:
          data.access_token,

        user:
          data.user || null,
      };
    } catch (error) {
      console.error(
        "Refresh session error:",
        error
      );

      return null;
    }
  }

  /*
    =========================
    USER CURENT
    =========================
  */

  async function getCurrentUser(
    supabaseUrl,
    supabaseKey,
    originalAccessToken
  ) {
    let accessToken =
      originalAccessToken;

    let response =
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

    if (
      response.status === 401
    ) {
      const refreshed =
        await refreshSession(
          supabaseUrl,
          supabaseKey
        );

      if (!refreshed) {
        return null;
      }

      accessToken =
        refreshed.accessToken;

      response =
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
    }

    if (!response.ok) {
      return null;
    }

    const user =
      await response.json();

    return {
      user,
      accessToken,
    };
  }

  /*
    =========================
    PROFIL
    =========================
  */

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setSuccess(false);

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

      setLoading(false);

      return;
    }

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    let savedUser = null;

    try {
      savedUser =
        JSON.parse(
          localStorage.getItem(
            "masago_client_user"
          ) || "null"
        );
    } catch {
      savedUser = null;
    }

    if (!accessToken) {
      window.location.href =
        "/cont";

      return;
    }

    if (savedUser?.email) {
      setEmail(
        savedUser.email
      );
    }

    try {
      let response =
        await fetch(
          `${supabaseUrl}/rest/v1/client_profiles?select=user_id,full_name,phone&limit=1`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      if (
        response.status === 401
      ) {
        const refreshed =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!refreshed) {
          clearClientSession();

          window.location.href =
            "/cont";

          return;
        }

        accessToken =
          refreshed.accessToken;

        if (
          refreshed.user?.email
        ) {
          setEmail(
            refreshed.user.email
          );
        }

        response =
          await fetch(
            `${supabaseUrl}/rest/v1/client_profiles?select=user_id,full_name,phone&limit=1`,
            {
              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Profile load error:",
          data
        );

        setMessage(
          data?.message ||
            data?.error ||
            "Nu am putut încărca profilul."
        );

        return;
      }

      const profile =
        data?.[0];

      if (profile) {
        setFullName(
          profile.full_name ||
            ""
        );

        setPhone(
          profile.phone || ""
        );
      }

      /*
        Dacă nu aveam emailul
        salvat local, îl cerem
        direct din sesiunea Supabase.
      */

      if (!savedUser?.email) {
        const session =
          await getCurrentUser(
            supabaseUrl,
            supabaseKey,
            accessToken
          );

        if (
          session?.user?.email
        ) {
          setEmail(
            session.user.email
          );

          localStorage.setItem(
            "masago_client_user",
            JSON.stringify(
              session.user
            )
          );
        }
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la încărcarea profilului."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    =========================
    SALVEAZĂ PROFIL
    =========================
  */

  async function handleSave(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanName =
      fullName.trim();

    const cleanPhone =
      phone.trim();

    if (!cleanName) {
      setMessage(
        "Introdu numele."
      );

      return;
    }

    if (!cleanPhone) {
      setMessage(
        "Introdu numărul de telefon."
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

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    let user = null;

    try {
      user =
        JSON.parse(
          localStorage.getItem(
            "masago_client_user"
          ) || "null"
        );
    } catch {
      user = null;
    }

    /*
      Dacă user-ul nu este
      disponibil în localStorage,
      îl luăm direct din Supabase.
    */

    if (
      accessToken &&
      !user?.id
    ) {
      const session =
        await getCurrentUser(
          supabaseUrl,
          supabaseKey,
          accessToken
        );

      if (session) {
        user =
          session.user;

        accessToken =
          session.accessToken;

        localStorage.setItem(
          "masago_client_user",
          JSON.stringify(
            user
          )
        );
      }
    }

    if (
      !accessToken ||
      !user?.id
    ) {
      window.location.href =
        "/cont";

      return;
    }

    setSaving(true);

    try {
      let response =
        await fetch(
          `${supabaseUrl}/rest/v1/client_profiles?on_conflict=user_id`,
          {
            method: "POST",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",

              Prefer:
                "resolution=merge-duplicates,return=minimal",
            },

            body:
              JSON.stringify({
                user_id:
                  user.id,

                full_name:
                  cleanName,

                phone:
                  cleanPhone,

                updated_at:
                  new Date().toISOString(),
              }),
          }
        );

      if (
        response.status === 401
      ) {
        const refreshed =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!refreshed) {
          clearClientSession();

          window.location.href =
            "/cont";

          return;
        }

        accessToken =
          refreshed.accessToken;

        user =
          refreshed.user ||
          user;

        response =
          await fetch(
            `${supabaseUrl}/rest/v1/client_profiles?on_conflict=user_id`,
            {
              method:
                "POST",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",

                Prefer:
                  "resolution=merge-duplicates,return=minimal",
              },

              body:
                JSON.stringify({
                  user_id:
                    user.id,

                  full_name:
                    cleanName,

                  phone:
                    cleanPhone,

                  updated_at:
                    new Date().toISOString(),
                }),
            }
          );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Profile save error:",
          errorText
        );

        setMessage(
          `Nu am putut salva profilul: ${errorText}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Profilul a fost salvat."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la salvarea profilului."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
    =========================
    FAVORITE
    =========================
  */

  async function loadFavorites() {
    setFavoritesLoading(true);
    setFavoriteMessage("");

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
      setFavoritesLoading(
        false
      );

      return;
    }

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (!accessToken) {
      setFavoritesLoading(
        false
      );

      return;
    }

    try {
      /*
        1. Identificăm user-ul.
      */

      const session =
        await getCurrentUser(
          supabaseUrl,
          supabaseKey,
          accessToken
        );

      if (!session?.user?.id) {
        clearClientSession();

        window.location.href =
          "/cont";

        return;
      }

      const user =
        session.user;

      accessToken =
        session.accessToken;

      /*
        2. Favoritele user-ului.
      */

      const favoritesResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/favorites?select=restaurant_id,created_at&user_id=eq.${user.id}&order=created_at.desc`,
          {
            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      const favoritesData =
        await favoritesResponse.json();

      if (
        !favoritesResponse.ok
      ) {
        console.error(
          "Favorites load error:",
          favoritesData
        );

        setFavoriteMessage(
          favoritesData?.message ||
            favoritesData?.error ||
            "Nu am putut încărca favoritele."
        );

        return;
      }

      const restaurantIds =
        (
          favoritesData || []
        )
          .map(
            (favorite) =>
              favorite.restaurant_id
          )
          .filter(Boolean);

      if (
        restaurantIds.length ===
        0
      ) {
        setFavoriteRestaurants(
          []
        );

        return;
      }

      const inFilter =
        restaurantIds.join(",");

      /*
        3. Restaurantele.
      */

      const restaurantsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurants?select=id,name,slug&id=in.(${inFilter})`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const restaurantsData =
        await restaurantsResponse.json();

      if (
        !restaurantsResponse.ok
      ) {
        console.error(
          "Favorite restaurants error:",
          restaurantsData
        );

        setFavoriteMessage(
          "Nu am putut încărca restaurantele favorite."
        );

        return;
      }

      /*
        4. Cover-uri restaurante.
      */

      const imagesResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurant_images?select=restaurant_id,image_url,is_cover&restaurant_id=in.(${inFilter})&is_cover=eq.true`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const imagesData =
        imagesResponse.ok
          ? await imagesResponse.json()
          : [];

      /*
        5. Ratingurile reale.
      */

      const reviewsResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/reviews?select=restaurant_id,rating&restaurant_id=in.(${inFilter})`,
          {
            headers: {
              apikey:
                supabaseKey,
            },
          }
        );

      const reviewsData =
        reviewsResponse.ok
          ? await reviewsResponse.json()
          : [];

      /*
        Cover map.
      */

      const imageByRestaurant =
        {};

      (
        imagesData || []
      ).forEach(
        (image) => {
          if (
            image.restaurant_id &&
            image.image_url
          ) {
            imageByRestaurant[
              image.restaurant_id
            ] =
              image.image_url;
          }
        }
      );

      /*
        Rating map.
      */

      const ratingDataByRestaurant =
        {};

      (
        reviewsData || []
      ).forEach(
        (review) => {
          const restaurantId =
            review.restaurant_id;

          if (!restaurantId) {
            return;
          }

          if (
            !ratingDataByRestaurant[
              restaurantId
            ]
          ) {
            ratingDataByRestaurant[
              restaurantId
            ] = {
              total: 0,
              count: 0,
            };
          }

          ratingDataByRestaurant[
            restaurantId
          ].total +=
            Number(
              review.rating || 0
            );

          ratingDataByRestaurant[
            restaurantId
          ].count += 1;
        }
      );

      /*
        Ordinea rămâne după momentul
        în care user-ul le-a adăugat
        la favorite.
      */

      const favoriteOrder =
        new Map(
          (
            favoritesData || []
          ).map(
            (
              favorite,
              index
            ) => [
              favorite.restaurant_id,
              index,
            ]
          )
        );

      const finalRestaurants =
        (
          restaurantsData || []
        )
          .map(
            (restaurant) => {
              const ratingData =
                ratingDataByRestaurant[
                  restaurant.id
                ];

              return {
                ...restaurant,

                image:
                  imageByRestaurant[
                    restaurant.id
                  ] || null,

                rating:
                  ratingData?.count
                    ? ratingData.total /
                      ratingData.count
                    : null,

                reviewsCount:
                  ratingData?.count ||
                  0,
              };
            }
          )
          .sort(
            (a, b) =>
              (
                favoriteOrder.get(
                  a.id
                ) ?? 9999
              ) -
              (
                favoriteOrder.get(
                  b.id
                ) ?? 9999
              )
          );

      setFavoriteRestaurants(
        finalRestaurants
      );
    } catch (error) {
      console.error(
        "Favorites error:",
        error
      );

      setFavoriteMessage(
        "A apărut o eroare la încărcarea favoritelor."
      );
    } finally {
      setFavoritesLoading(
        false
      );
    }
  }

  /*
    =========================
    ȘTERGE FAVORIT
    =========================
  */

  async function removeFavorite(
    restaurantId
  ) {
    if (
      !restaurantId ||
      removingFavoriteId
    ) {
      return;
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

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
      return;
    }

    setRemovingFavoriteId(
      restaurantId
    );

    setFavoriteMessage("");

    try {
      const session =
        await getCurrentUser(
          supabaseUrl,
          supabaseKey,
          accessToken
        );

      if (!session?.user?.id) {
        clearClientSession();

        window.location.href =
          "/cont";

        return;
      }

      accessToken =
        session.accessToken;

      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/favorites?user_id=eq.${session.user.id}&restaurant_id=eq.${restaurantId}`,
          {
            method:
              "DELETE",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              Prefer:
                "return=minimal",
            },
          }
        );

      if (!response.ok) {
        const data =
          await response.text();

        console.error(
          "Favorite remove error:",
          data
        );

        setFavoriteMessage(
          "Nu am putut elimina restaurantul din favorite."
        );

        return;
      }

      setFavoriteRestaurants(
        (current) =>
          current.filter(
            (restaurant) =>
              restaurant.id !==
              restaurantId
          )
      );
    } catch (error) {
      console.error(
        "Favorite remove error:",
        error
      );

      setFavoriteMessage(
        "Nu am putut elimina restaurantul din favorite."
      );
    } finally {
      setRemovingFavoriteId(
        null
      );
    }
  }

  /*
    =========================
    SCHIMBĂ PAROLA
    =========================
  */

  async function handleChangePassword(
    event
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordSuccess(false);

    if (!newPassword) {
      setPasswordMessage(
        "Introdu parola nouă."
      );

      return;
    }

    if (
      newPassword.length < 6
    ) {
      setPasswordMessage(
        "Parola trebuie să aibă minimum 6 caractere."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordMessage(
        "Parolele nu coincid."
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
      setPasswordMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    let accessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (!accessToken) {
      window.location.href =
        "/cont";

      return;
    }

    setChangingPassword(
      true
    );

    try {
      let response =
        await fetch(
          `${supabaseUrl}/auth/v1/user`,
          {
            method:
              "PUT",

            headers: {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                password:
                  newPassword,
              }),
          }
        );

      if (
        response.status === 401
      ) {
        const refreshed =
          await refreshSession(
            supabaseUrl,
            supabaseKey
          );

        if (!refreshed) {
          clearClientSession();

          window.location.href =
            "/cont";

          return;
        }

        accessToken =
          refreshed.accessToken;

        response =
          await fetch(
            `${supabaseUrl}/auth/v1/user`,
            {
              method:
                "PUT",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  password:
                    newPassword,
                }),
            }
          );
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Password update error:",
          data
        );

        setPasswordMessage(
          data?.message ||
            data?.msg ||
            "Nu am putut schimba parola."
        );

        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(
        true
      );

      setPasswordMessage(
        "Parola a fost schimbată cu succes."
      );

      /*
        După succes lăsăm mesajul vizibil,
        dar închidem formularul puțin mai
        târziu.
      */

      setTimeout(() => {
        setPasswordOpen(
          false
        );
      }, 1300);
    } catch (error) {
      console.error(error);

      setPasswordMessage(
        "A apărut o eroare la schimbarea parolei."
      );
    } finally {
      setChangingPassword(
        false
      );
    }
  }

  /*
    =========================
    LOGOUT
    =========================
  */

  function handleLogout() {
    clearClientSession();

    window.location.href =
      "/";
  }

  /*
    =========================
    STILURI
    =========================
  */

  const cardStyle = {
    background:
      "white",

    border:
      "1px solid #E7E9ED",

    borderRadius:
      "22px",

    boxShadow:
      "0 12px 35px rgba(23,32,51,0.06)",
  };

  const inputStyle = {
    width:
      "100%",

    boxSizing:
      "border-box",

    padding:
      "13px 14px",

    border:
      "1px solid #DDE1E6",

    borderRadius:
      "11px",

    background:
      "#FAFBFC",

    color:
      "#172033",

    fontSize:
      "15px",

    outline:
      "none",
  };

  const labelStyle = {
    display:
      "block",

    marginBottom:
      "7px",

    fontWeight:
      "800",

    fontSize:
      "14px",
  };

  /*
    =========================
    UI
    =========================
  */

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
            "rgba(255,255,255,0.96)",

          borderBottom:
            "1px solid #ececec",

          padding:
            "16px 6%",

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

          position:
            "sticky",

          top:
            0,

          zIndex:
            30,

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

        <div
          style={{
            display:
              "flex",

            gap:
              "8px",

            alignItems:
              "center",

            flexWrap:
              "wrap",
          }}
        >
          <a
            href="/rezervarile-mele"
            style={{
              textDecoration:
                "none",

              color:
                "#485267",

              fontWeight:
                "800",

              padding:
                "9px 11px",

              borderRadius:
                "9px",
            }}
          >
            Rezervările mele
          </a>

          <a
            href="/"
            style={{
              textDecoration:
                "none",

              color:
                "#485267",

              fontWeight:
                "800",

              padding:
                "9px 11px",

              borderRadius:
                "9px",
            }}
          >
            Restaurante
          </a>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              border:
                "1px solid #FFD4CC",

              background:
                "#FFF5F2",

              color:
                "#B42318",

              borderRadius:
                "10px",

              padding:
                "9px 13px",

              fontWeight:
                "900",

              cursor:
                "pointer",
            }}
          >
            Ieși din cont
          </button>
        </div>
      </header>

      {/* CONTENT */}

      <section
        style={{
          maxWidth:
            "1180px",

          margin:
            "0 auto",

          padding:
            "42px 6% 70px",
        }}
      >
        {/* TITLU */}

        <div
          style={{
            marginBottom:
              "24px",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-end",

            gap:
              "20px",

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

                fontSize:
                  "12px",

                fontWeight:
                  "900",

                textTransform:
                  "uppercase",

                letterSpacing:
                  "1px",
              }}
            >
              Contul meu
            </p>

            <h1
              style={{
                fontSize:
                  "38px",

                margin:
                  "6px 0 6px",

                letterSpacing:
                  "-1px",
              }}
            >
              Profilul meu
            </h1>

            <p
              style={{
                margin:
                  0,

                color:
                  "#737C8D",

                lineHeight:
                  1.5,
              }}
            >
              Datele tale, restaurantele favorite și
              securitatea contului într-un singur loc.
            </p>
          </div>

          {favoriteRestaurants.length >
            0 && (
            <div
              style={{
                background:
                  "#FFF0EC",

                color:
                  "#FF5A3C",

                border:
                  "1px solid #FFD8CF",

                borderRadius:
                  "999px",

                padding:
                  "9px 13px",

                fontSize:
                  "13px",

                fontWeight:
                  "900",
              }}
            >
              ♥{" "}
              {
                favoriteRestaurants.length
              }{" "}
              {favoriteRestaurants.length ===
              1
                ? "favorit"
                : "favorite"}
            </div>
          )}
        </div>

        {/* GRID PRINCIPAL */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(340px, 1fr))",

            gap:
              "22px",

            alignItems:
              "start",
          }}
        >
          {/* DATE PERSONALE */}

          <div
            style={{
              ...cardStyle,

              padding:
                "26px",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                gap:
                  "12px",

                alignItems:
                  "center",

                marginBottom:
                  "22px",
              }}
            >
              <div
                style={{
                  width:
                    "44px",

                  height:
                    "44px",

                  borderRadius:
                    "13px",

                  background:
                    "#FFF0EC",

                  color:
                    "#FF5A3C",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  fontSize:
                    "20px",
                }}
              >
                👤
              </div>

              <div>
                <h2
                  style={{
                    margin:
                      0,

                    fontSize:
                      "21px",
                  }}
                >
                  Date personale
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",

                    color:
                      "#737C8D",

                    fontSize:
                      "13px",
                  }}
                >
                  Folosite pentru rezervările tale.
                </p>
              </div>
            </div>

            {loading ? (
              <div
                style={{
                  padding:
                    "25px",

                  textAlign:
                    "center",

                  color:
                    "#667085",

                  fontWeight:
                    "800",
                }}
              >
                Se încarcă profilul...
              </div>
            ) : (
              <form
                onSubmit={
                  handleSave
                }
              >
                <div
                  style={{
                    marginBottom:
                      "14px",
                  }}
                >
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Email
                  </label>

                  <input
                    value={
                      email
                    }
                    readOnly
                    style={{
                      ...inputStyle,

                      background:
                        "#F2F4F7",

                      color:
                        "#667085",
                    }}
                  />
                </div>

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",

                    gap:
                      "12px",

                    marginBottom:
                      "16px",
                  }}
                >
                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Nume
                    </label>

                    <input
                      type="text"
                      value={
                        fullName
                      }
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                      placeholder="Numele tău"
                      style={
                        inputStyle
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Telefon
                    </label>

                    <input
                      type="tel"
                      value={
                        phone
                      }
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="07xxxxxxxx"
                      style={
                        inputStyle
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={{
                    width:
                      "100%",

                    border:
                      "none",

                    borderRadius:
                      "11px",

                    padding:
                      "13px",

                    background:
                      saving
                        ? "#AEB5C0"
                        : "#FF5A3C",

                    color:
                      "white",

                    fontWeight:
                      "900",

                    fontSize:
                      "15px",

                    cursor:
                      saving
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {saving
                    ? "Se salvează..."
                    : "Salvează profilul"}
                </button>
              </form>
            )}

            {message && (
              <div
                style={{
                  marginTop:
                    "14px",

                  padding:
                    "12px",

                  borderRadius:
                    "10px",

                  background:
                    success
                      ? "#E9F8EF"
                      : "#FFF0EC",

                  color:
                    success
                      ? "#177245"
                      : "#A33A29",

                  fontWeight:
                    "800",

                  fontSize:
                    "13px",

                  lineHeight:
                    1.5,
                }}
              >
                {message}
              </div>
            )}
          </div>
          {/* FAVORITE */}

          <div
            style={{
              ...cardStyle,
              padding: "26px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "13px",
                    background: "#FFF0EC",
                    color: "#FF5A3C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  ♥
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "21px",
                    }}
                  >
                    Restaurante favorite
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#737C8D",
                      fontSize: "13px",
                    }}
                  >
                    Restaurantele pe care le-ai salvat.
                  </p>
                </div>
              </div>

              {!favoritesLoading && (
                <div
                  style={{
                    minWidth: "32px",
                    height: "32px",
                    padding: "0 9px",
                    borderRadius: "999px",
                    background: "#F2F4F7",
                    color: "#475467",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "900",
                  }}
                >
                  {favoriteRestaurants.length}
                </div>
              )}
            </div>

            {favoritesLoading ? (
              <div
                style={{
                  minHeight: "230px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "#667085",
                  fontWeight: "800",
                }}
              >
                Se încarcă favoritele...
              </div>
            ) : favoriteRestaurants.length === 0 ? (
              <div
                style={{
                  minHeight: "230px",
                  border: "1px dashed #D9DDE3",
                  background: "#FAFBFC",
                  borderRadius: "16px",
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "58px",
                    height: "58px",
                    borderRadius: "50%",
                    background: "#FFF0EC",
                    color: "#FF5A3C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    marginBottom: "14px",
                  }}
                >
                  ♡
                </div>

                <strong
                  style={{
                    fontSize: "17px",
                    marginBottom: "7px",
                  }}
                >
                  Nu ai restaurante favorite
                </strong>

                <p
                  style={{
                    margin: "0 0 17px",
                    color: "#737C8D",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    maxWidth: "300px",
                  }}
                >
                  Apasă pe inimioara unui restaurant și îl
                  vei găsi aici.
                </p>

                <a
                  href="/"
                  style={{
                    textDecoration: "none",
                    background: "#172033",
                    color: "white",
                    padding: "11px 15px",
                    borderRadius: "10px",
                    fontWeight: "900",
                    fontSize: "13px",
                  }}
                >
                  Descoperă restaurante →
                </a>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  maxHeight: "420px",
                  overflowY: "auto",
                  paddingRight: "3px",
                }}
              >
                {favoriteRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    style={{
                      border: "1px solid #E7E9ED",
                      borderRadius: "15px",
                      overflow: "hidden",
                      background: "#FAFBFC",
                      display: "grid",
                      gridTemplateColumns: "92px 1fr",
                      minHeight: "104px",
                    }}
                  >
                    {/* POZĂ */}

                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #F0F1F3, #E7E9ED)",
                        position: "relative",
                        minHeight: "104px",
                      }}
                    >
                      {restaurant.image ? (
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            inset: 0,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            minHeight: "104px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "38px",
                          }}
                        >
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* INFO */}

                    <div
                      style={{
                        padding: "13px 13px 12px",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "900",
                              fontSize: "16px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {restaurant.name}
                          </div>

                          <div
                            style={{
                              marginTop: "5px",
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              flexWrap: "wrap",
                              color: "#667085",
                              fontSize: "12px",
                              fontWeight: "800",
                            }}
                          >
                            {restaurant.rating ? (
                              <>
                                <span>
                                  ⭐{" "}
                                  {Number(
                                    restaurant.rating
                                  ).toFixed(1)}
                                </span>

                                <span
                                  style={{
                                    color: "#D0D5DD",
                                  }}
                                >
                                  •
                                </span>

                                <span>
                                  {restaurant.reviewsCount}{" "}
                                  {restaurant.reviewsCount === 1
                                    ? "recenzie"
                                    : "recenzii"}
                                </span>
                              </>
                            ) : (
                              <span>Fără recenzii încă</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFavorite(restaurant.id)
                          }
                          disabled={
                            removingFavoriteId === restaurant.id
                          }
                          title="Elimină din favorite"
                          aria-label="Elimină din favorite"
                          style={{
                            flexShrink: 0,
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            border: "1px solid #FFD8CF",
                            background: "#FFF0EC",
                            color: "#FF5A3C",
                            fontSize: "19px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor:
                              removingFavoriteId === restaurant.id
                                ? "wait"
                                : "pointer",
                            opacity:
                              removingFavoriteId === restaurant.id
                                ? 0.55
                                : 1,
                          }}
                        >
                          ♥
                        </button>
                      </div>

                      <a
                        href={`/restaurant/${restaurant.slug}`}
                        style={{
                          display: "inline-block",
                          marginTop: "11px",
                          textDecoration: "none",
                          color: "#FF5A3C",
                          fontSize: "12px",
                          fontWeight: "900",
                        }}
                      >
                        Vezi restaurantul →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {favoriteMessage && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "11px 12px",
                  borderRadius: "10px",
                  background: "#FFF0EC",
                  color: "#A33A29",
                  fontSize: "13px",
                  fontWeight: "800",
                  lineHeight: 1.5,
                }}
              >
                {favoriteMessage}
              </div>
            )}
          </div>
        </div>

        {/* =========================
            SECURITATE
        ========================= */}

        <div
          style={{
            ...cardStyle,
            marginTop: "22px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#F2F4F7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "19px",
                }}
              >
                🔐
              </div>

              <div>
                <div
                  style={{
                    fontWeight: "900",
                    fontSize: "16px",
                  }}
                >
                  Securitatea contului
                </div>

                <div
                  style={{
                    color: "#737C8D",
                    fontSize: "13px",
                    marginTop: "3px",
                  }}
                >
                  Modifică parola contului tău Masago.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPasswordOpen((current) => !current);
                setPasswordMessage("");
                setPasswordSuccess(false);
              }}
              style={{
                border: "1px solid #DDE1E6",
                background: "white",
                color: "#172033",
                borderRadius: "10px",
                padding: "10px 14px",
                fontWeight: "900",
                cursor: "pointer",
              }}
            >
              {passwordOpen
                ? "Închide"
                : "Schimbă parola →"}
            </button>
          </div>

          {passwordOpen && (
            <div
              style={{
                borderTop: "1px solid #ECEEF1",
                background: "#FAFBFC",
                padding: "22px 24px",
              }}
            >
              <form
                onSubmit={handleChangePassword}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Parola nouă
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    placeholder="Minimum 6 caractere"
                    autoComplete="new-password"
                    style={{
                      ...inputStyle,
                      background: "white",
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Confirmă parola
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Repetă parola"
                    autoComplete="new-password"
                    style={{
                      ...inputStyle,
                      background: "white",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  style={{
                    border: "none",
                    borderRadius: "11px",
                    padding: "13px 17px",
                    background: changingPassword
                      ? "#AEB5C0"
                      : "#172033",
                    color: "white",
                    fontWeight: "900",
                    fontSize: "14px",
                    cursor: changingPassword
                      ? "not-allowed"
                      : "pointer",
                    minHeight: "45px",
                  }}
                >
                  {changingPassword
                    ? "Se schimbă..."
                    : "Salvează parola"}
                </button>
              </form>

              {passwordMessage && (
                <div
                  style={{
                    marginTop: "13px",
                    padding: "11px 12px",
                    borderRadius: "10px",
                    background: passwordSuccess
                      ? "#E9F8EF"
                      : "#FFF0EC",
                    color: passwordSuccess
                      ? "#177245"
                      : "#A33A29",
                    fontSize: "13px",
                    fontWeight: "800",
                  }}
                >
                  {passwordMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================
            SESIUNE
        ========================= */}

        <div
          style={{
            marginTop: "14px",
            background: "#FFF5F2",
            border: "1px solid #FFD8CF",
            borderRadius: "17px",
            padding: "17px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
              }}
            >
              🚪
            </div>

            <div>
              <div
                style={{
                  color: "#7A271A",
                  fontWeight: "900",
                  fontSize: "14px",
                }}
              >
                Sesiunea ta
              </div>

              <div
                style={{
                  color: "#A34A3A",
                  fontSize: "12px",
                  marginTop: "2px",
                }}
              >
                Ieși în siguranță din cont pe acest dispozitiv.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid #FFB4A6",
              background: "white",
              color: "#B42318",
              borderRadius: "10px",
              padding: "10px 14px",
              fontWeight: "900",
              cursor: "pointer",
            }}
          >
            Ieși din cont
          </button>
        </div>
      </section>

      {/* FOOTER */}

      <footer
        style={{
          borderTop: "1px solid #ECECEC",
          background: "white",
          padding: "22px 6%",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              color: "#98A2B3",
              fontSize: "12px",
            }}
          >
            © {new Date().getFullYear()} Masago
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/"
              style={{
                color: "#667085",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              Restaurante
            </a>

            <a
              href="/rezervarile-mele"
              style={{
                color: "#667085",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              Rezervările mele
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
