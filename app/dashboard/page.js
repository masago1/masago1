"use client";

import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [offers, setOffers] = useState([]);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsMessage, setReviewsMessage] = useState("");

  const [restaurantName, setRestaurantName] =
    useState("Restaurant");

  const [restaurantId, setRestaurantId] =
    useState(null);

  const [userEmail, setUserEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [authChecking, setAuthChecking] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [message, setMessage] =
    useState("");

  /*
    =========================
    FOTOGRAFII RESTAURANT
    =========================
  */

  const [restaurantImages, setRestaurantImages] =
    useState([]);

  const [imagesLoading, setImagesLoading] =
    useState(false);

  const [uploadingImages, setUploadingImages] =
    useState(false);

  const [deletingImageId, setDeletingImageId] =
    useState(null);

  const [coverImageId, setCoverImageId] =
    useState(null);

  const [imageMessage, setImageMessage] =
    useState("");

  /*
    =========================
    VALIDARE COD MASAGO
    =========================
  */

  const [validationCode, setValidationCode] =
    useState("");

  const [validatingCode, setValidatingCode] =
    useState(false);

  const [
    validationMessage,
    setValidationMessage,
  ] = useState("");

  const [
    validatedReservation,
    setValidatedReservation,
  ] = useState(null);

  /*
    =========================
    CREATE OFFER
    =========================
  */

  const [offerDate, setOfferDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("18:00");

  const [endTime, setEndTime] =
    useState("20:00");

  const [
    discountPercent,
    setDiscountPercent,
  ] = useState("30");

  const [capacity, setCapacity] =
    useState("10");

  const [
    creatingOffer,
    setCreatingOffer,
  ] = useState(false);

  const [
    offerMessage,
    setOfferMessage,
  ] = useState("");

  /*
    =========================
    EDIT OFFER
    =========================
  */

  const [
    editingOfferId,
    setEditingOfferId,
  ] = useState(null);

  const [
    editOfferDate,
    setEditOfferDate,
  ] = useState("");

  const [
    editStartTime,
    setEditStartTime,
  ] = useState("18:00");

  const [
    editEndTime,
    setEditEndTime,
  ] = useState("20:00");

  const [
    editDiscountPercent,
    setEditDiscountPercent,
  ] = useState("30");

  const [
    editCapacity,
    setEditCapacity,
  ] = useState("10");

  const [
    savingOfferId,
    setSavingOfferId,
  ] = useState(null);

  const [
    deactivatingOfferId,
    setDeactivatingOfferId,
  ] = useState(null);

  /*
    =========================
    PROGRAM RESTAURANT
    =========================
  */

  const dayNames = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
  ];

  const createDefaultHours = () =>
    dayNames.map((day, index) => ({
      day_of_week: index,
      day_name: day,
      opening_time: "10:00",
      closing_time: "22:00",
      is_closed: false,
    }));

  const [restaurantHours, setRestaurantHours] =
    useState(createDefaultHours);

  const [hoursLoading, setHoursLoading] =
    useState(false);

  const [savingHours, setSavingHours] =
    useState(false);

  const [hoursMessage, setHoursMessage] =
    useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  /*
    =========================
    AUTH
    =========================
  */

  async function checkAuth() {
    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    const email =
      localStorage.getItem(
        "masago_user_email"
      );

    if (!accessToken) {
      window.location.href =
        "/login";

      return;
    }

    setUserEmail(email || "");

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
      setAuthChecking(false);

      return;
    }

    try {
      const restaurant =
        await loadRestaurant(
          accessToken,
          supabaseUrl,
          supabaseKey
        );

      await Promise.all([
        loadReservations(
          accessToken,
          supabaseUrl,
          supabaseKey
        ),

        restaurant?.id
          ? loadOffers(
              accessToken,
              supabaseUrl,
              supabaseKey,
              restaurant.id,
              restaurant.name
            )
          : Promise.resolve(),

        restaurant?.id
          ? loadRestaurantImages(
              accessToken,
              supabaseUrl,
              supabaseKey,
              restaurant.id
            )
          : Promise.resolve(),

        restaurant?.id
          ? loadReviews(
              accessToken,
              supabaseUrl,
              supabaseKey,
              restaurant.id
            )
          : Promise.resolve(),

        restaurant?.id
          ? loadRestaurantHours(
              accessToken,
              supabaseUrl,
              supabaseKey,
              restaurant.id
            )
          : Promise.resolve(),
      ]);
    } finally {
      setAuthChecking(false);
    }
  }

  async function loadRestaurant(
    accessToken,
    supabaseUrl,
    supabaseKey
  ) {
    try {
      const email = (
        localStorage.getItem(
          "masago_user_email"
        ) || ""
      )
        .trim()
        .toLowerCase();

      let currentRestaurantName =
        null;

      if (
        email ===
        "costindavid719@gmail.com"
      ) {
        currentRestaurantName =
          "Casa Bunicii";
      } else if (
        email ===
        "vrenst24@gmail.com"
      ) {
        currentRestaurantName =
          "Boom Pub";
      }

      if (!currentRestaurantName) {
        setMessage(
          "Acest cont nu este asociat unui restaurant."
        );

        return null;
      }

      const encodedName =
        encodeURIComponent(
          currentRestaurantName
        );

      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurants?name=eq.${encodedName}&select=id,name&limit=1`,
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
        handleLogout();
        return null;
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Restaurant error:",
          data
        );

        setMessage(
          "Nu am putut identifica restaurantul."
        );

        return null;
      }

      if (data?.[0]) {
        setRestaurantId(
          data[0].id
        );

        setRestaurantName(
          data[0].name
        );

        return data[0];
      }

      setMessage(
        `Restaurantul "${currentRestaurantName}" nu a fost găsit.`
      );

      return null;
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la identificarea restaurantului."
      );

      return null;
    }
  }

  /*
    =========================
    PROGRAM RESTAURANT
    =========================
  */

  async function loadRestaurantHours(
    accessToken,
    supabaseUrl,
    supabaseKey,
    currentRestaurantId = restaurantId
  ) {
    if (!currentRestaurantId) {
      return;
    }

    setHoursLoading(true);
    setHoursMessage("");

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_hours?restaurant_id=eq.${currentRestaurantId}&select=id,restaurant_id,day_of_week,opening_time,closing_time,is_closed,created_at,updated_at&order=day_of_week.asc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Restaurant hours error:",
          data
        );

        setHoursMessage(
          "Nu am putut încărca programul restaurantului."
        );

        return;
      }

      const rowsByDay = new Map(
        (data || []).map((row) => [
          Number(row.day_of_week),
          row,
        ])
      );

      setRestaurantHours(
        dayNames.map((day, index) => {
          const row = rowsByDay.get(index);

          return {
            id: row?.id || null,
            day_of_week: index,
            day_name: day,

            opening_time: row?.opening_time
              ? formatTime(row.opening_time)
              : "10:00",

            closing_time: row?.closing_time
              ? formatTime(row.closing_time)
              : "22:00",

            is_closed:
              Boolean(row?.is_closed),
          };
        })
      );
    } catch (error) {
      console.error(
        "Load restaurant hours error:",
        error
      );

      setHoursMessage(
        "A apărut o eroare la încărcarea programului."
      );
    } finally {
      setHoursLoading(false);
    }
  }

  function updateRestaurantHour(
    dayOfWeek,
    field,
    value
  ) {
    setHoursMessage("");

    setRestaurantHours((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek
          ? {
              ...day,
              [field]: value,
            }
          : day
      )
    );
  }

  async function saveRestaurantHours() {
    if (!restaurantId) {
      setHoursMessage(
        "Restaurantul nu este identificat."
      );
      return;
    }

    for (const day of restaurantHours) {
      if (day.is_closed) {
        continue;
      }

      if (
        !day.opening_time ||
        !day.closing_time
      ) {
        setHoursMessage(
          `Completează orele pentru ${day.day_name}.`
        );
        return;
      }

      if (
        day.closing_time <=
        day.opening_time
      ) {
        setHoursMessage(
          `Ora de închidere trebuie să fie după ora de deschidere pentru ${day.day_name}.`
        );
        return;
      }
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setHoursMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );
      return;
    }

    setSavingHours(true);
    setHoursMessage("");

    try {
      const payload =
        restaurantHours.map(
          (day) => ({
            restaurant_id:
              restaurantId,

            day_of_week:
              day.day_of_week,

            opening_time:
              day.is_closed
                ? null
                : day.opening_time,

            closing_time:
              day.is_closed
                ? null
                : day.closing_time,

            is_closed:
              day.is_closed,

            updated_at:
              new Date().toISOString(),
          })
        );

      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_hours?on_conflict=restaurant_id,day_of_week`,
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
              "resolution=merge-duplicates,return=representation",
          },

          body:
            JSON.stringify(payload),
        }
      );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        console.error(
          "Save restaurant hours error:",
          data
        );

        setHoursMessage(
          data?.message ||
            "Nu am putut salva programul."
        );

        return;
      }

      setHoursMessage(
        "✓ Programul restaurantului a fost salvat."
      );

      await loadRestaurantHours(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId
      );
    } catch (error) {
      console.error(
        "Save restaurant hours error:",
        error
      );

      setHoursMessage(
        "A apărut o eroare la salvarea programului."
      );
    } finally {
      setSavingHours(false);
    }
  }

  /*
    =========================
    FOTOGRAFII
    =========================
  */

  async function loadRestaurantImages(
    accessToken,
    supabaseUrl,
    supabaseKey,
    currentRestaurantId =
      restaurantId
  ) {
    if (!currentRestaurantId) {
      return;
    }

    setImagesLoading(true);

    try {
      const response =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurant_images?restaurant_id=eq.${currentRestaurantId}&select=id,restaurant_id,image_url,storage_path,position,is_cover,created_at&order=position.asc`,
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
        handleLogout();
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Images error:",
          data
        );

        setImageMessage(
          "Nu am putut încărca fotografiile."
        );

        return;
      }

      setRestaurantImages(
        data || []
      );
    } catch (error) {
      console.error(error);

      setImageMessage(
        "A apărut o eroare la încărcarea fotografiilor."
      );
    } finally {
      setImagesLoading(false);
    }
  }

  function getNextImagePositions(
    count
  ) {
    const used =
      new Set(
        restaurantImages.map(
          (image) =>
            Number(
              image.position
            )
        )
      );

    const positions = [];

    for (
      let i = 1;
      i <= 6;
      i += 1
    ) {
      if (!used.has(i)) {
        positions.push(i);
      }

      if (
        positions.length ===
        count
      ) {
        break;
      }
    }

    return positions;
  }

  function sanitizeFileName(
    fileName
  ) {
    const dot =
      fileName.lastIndexOf(".");

    const extension =
      dot >= 0
        ? fileName
            .slice(dot + 1)
            .toLowerCase()
        : "jpg";

    const originalName =
      dot >= 0
        ? fileName.slice(
            0,
            dot
          )
        : fileName;

    const safeName =
      originalName
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        )
        .toLowerCase() ||
      "restaurant";

    return `${safeName}.${extension}`;
  }

  async function uploadRestaurantImages(
    event
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    event.target.value = "";

    setImageMessage("");

    if (!files.length) {
      return;
    }

    if (!restaurantId) {
      setImageMessage(
        "Restaurantul nu este identificat."
      );

      return;
    }

    const remaining =
      6 -
      restaurantImages.length;

    if (remaining <= 0) {
      setImageMessage(
        "Ai deja maximum 6 fotografii."
      );

      return;
    }

    if (
      files.length >
      remaining
    ) {
      setImageMessage(
        `Mai poți încărca doar ${remaining} ${
          remaining === 1
            ? "fotografie"
            : "fotografii"
        }.`
      );

      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const maxSize =
      5 *
      1024 *
      1024;

    for (const file of files) {
      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setImageMessage(
          "Sunt permise doar JPG, PNG și WebP."
        );

        return;
      }

      if (
        file.size >
        maxSize
      ) {
        setImageMessage(
          `"${file.name}" depășește 5 MB.`
        );

        return;
      }
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setImageMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );

      return;
    }

    const positions =
      getNextImagePositions(
        files.length
      );

    setUploadingImages(true);

    try {
      let imagesNow =
        [...restaurantImages];

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const file =
          files[index];

        const position =
          positions[index];

        const safeName =
          sanitizeFileName(
            file.name
          );

        const unique =
          `${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        const storagePath =
          `${restaurantId}/${position}-${unique}-${safeName}`;

        const uploadResponse =
          await fetch(
            `${supabaseUrl}/storage/v1/object/restaurant-images/${storagePath}`,
            {
              method:
                "POST",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  file.type,

                "x-upsert":
                  "false",
              },

              body:
                file,
            }
          );

        if (
          !uploadResponse.ok
        ) {
          const errorText =
            await uploadResponse.text();

          console.error(
            "Storage upload:",
            errorText
          );

          throw new Error(
            "Fotografia nu a putut fi încărcată."
          );
        }

        const imageUrl =
          `${supabaseUrl}/storage/v1/object/public/restaurant-images/${storagePath}`;

        const isCover =
          imagesNow.length === 0;

        const insertResponse =
          await fetch(
            `${supabaseUrl}/rest/v1/restaurant_images`,
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
                  "return=representation",
              },

              body:
                JSON.stringify({
                  restaurant_id:
                    restaurantId,

                  image_url:
                    imageUrl,

                  storage_path:
                    storagePath,

                  position,

                  is_cover:
                    isCover,
                }),
            }
          );

        const inserted =
          await insertResponse.json();

        if (
          !insertResponse.ok
        ) {
          await fetch(
            `${supabaseUrl}/storage/v1/object/restaurant-images/${storagePath}`,
            {
              method:
                "DELETE",

              headers: {
                apikey:
                  supabaseKey,

                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );

          throw new Error(
            inserted?.message ||
              "Fotografia nu a putut fi salvată."
          );
        }

        if (inserted?.[0]) {
          imagesNow.push(
            inserted[0]
          );
        }
      }

      setImageMessage(
        files.length === 1
          ? "✓ Fotografia a fost încărcată."
          : `✓ ${files.length} fotografii au fost încărcate.`
      );

      await loadRestaurantImages(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId
      );
    } catch (error) {
      console.error(error);

      setImageMessage(
        error instanceof Error
          ? error.message
          : "A apărut o eroare la upload."
      );
    } finally {
      setUploadingImages(false);
    }
  }

  async function setCoverImage(
    image
  ) {
    if (
      !image?.id ||
      image.is_cover
    ) {
      return;
    }

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !accessToken ||
      !restaurantId
    ) {
      return;
    }

    setCoverImageId(
      image.id
    );

    setImageMessage("");

    try {
      const clearResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurant_images?restaurant_id=eq.${restaurantId}&is_cover=eq.true`,
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
                is_cover:
                  false,
              }),
          }
        );

      if (
        !clearResponse.ok
      ) {
        throw new Error();
      }

      const coverResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/restaurant_images?id=eq.${image.id}&restaurant_id=eq.${restaurantId}`,
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
                is_cover:
                  true,
              }),
          }
        );

      if (
        !coverResponse.ok
      ) {
        throw new Error();
      }

      setRestaurantImages(
        (current) =>
          current.map(
            (item) => ({
              ...item,

              is_cover:
                String(
                  item.id
                ) ===
                String(
                  image.id
                ),
            })
          )
      );

      setImageMessage(
        "✓ Fotografia principală a fost schimbată."
      );
    } catch (error) {
      console.error(error);

      setImageMessage(
        "Nu am putut schimba fotografia principală."
      );

      await loadRestaurantImages(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId
      );
    } finally {
      setCoverImageId(null);
    }
  }
    async function deleteRestaurantImage(image) {
    if (!image?.id) {
      return;
    }

    const confirmed = window.confirm(
      image.is_cover
        ? "Aceasta este fotografia principală. Vrei să o ștergi?"
        : "Vrei să ștergi această fotografie?"
    );

    if (!confirmed) {
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken ||
      !restaurantId
    ) {
      setImageMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );

      return;
    }

    setDeletingImageId(image.id);
    setImageMessage("");

    try {
      if (image.storage_path) {
        const storageResponse = await fetch(
          `${supabaseUrl}/storage/v1/object/restaurant-images/${image.storage_path}`,
          {
            method: "DELETE",

            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (
          !storageResponse.ok &&
          storageResponse.status !== 404
        ) {
          const errorText =
            await storageResponse.text();

          console.error(
            "Storage delete:",
            errorText
          );
        }
      }

      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_images?id=eq.${image.id}&restaurant_id=eq.${restaurantId}`,
        {
          method: "DELETE",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            Prefer: "return=minimal",
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorText =
          await deleteResponse.text();

        console.error(
          "Image row delete:",
          errorText
        );

        throw new Error(
          "Fotografia nu a putut fi ștearsă."
        );
      }

      const remainingImages =
        restaurantImages
          .filter(
            (item) =>
              String(item.id) !==
              String(image.id)
          )
          .sort(
            (a, b) =>
              Number(a.position) -
              Number(b.position)
          );

      setRestaurantImages(
        remainingImages
      );

      if (
        image.is_cover &&
        remainingImages.length
      ) {
        const nextCover =
          remainingImages[0];

        const coverResponse =
          await fetch(
            `${supabaseUrl}/rest/v1/restaurant_images?id=eq.${nextCover.id}&restaurant_id=eq.${restaurantId}`,
            {
              method: "PATCH",

              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${accessToken}`,
                "Content-Type":
                  "application/json",
                Prefer:
                  "return=minimal",
              },

              body: JSON.stringify({
                is_cover: true,
              }),
            }
          );

        if (coverResponse.ok) {
          setRestaurantImages(
            remainingImages.map(
              (item) => ({
                ...item,

                is_cover:
                  String(item.id) ===
                  String(nextCover.id),
              })
            )
          );
        }
      }

      setImageMessage(
        "✓ Fotografia a fost ștearsă."
      );

      await loadRestaurantImages(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId
      );
    } catch (error) {
      console.error(error);

      setImageMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut șterge fotografia."
      );
    } finally {
      setDeletingImageId(null);
    }
  }

  /*
    =========================
    REVIEWS
    =========================
  */

  async function loadReviews(
    accessToken,
    supabaseUrl,
    supabaseKey,
    currentRestaurantId = restaurantId
  ) {
    if (!currentRestaurantId) {
      return;
    }

    setReviewsLoading(true);
    setReviewsMessage("");

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reviews?restaurant_id=eq.${currentRestaurantId}&select=id,reservation_id,restaurant_id,user_id,rating,comment,created_at&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Reviews error:",
          data
        );

        setReviewsMessage(
          data?.message ||
            "Nu am putut încărca recenziile."
        );

        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error(error);

      setReviewsMessage(
        "A apărut o eroare la încărcarea recenziilor."
      );
    } finally {
      setReviewsLoading(false);
    }
  }

  /*
    =========================
    RESERVATIONS
    =========================
  */

  async function loadReservations(
    accessToken,
    supabaseUrl,
    supabaseKey
  ) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_my_restaurant_reservations`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({}),
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(data);

        setMessage(
          data?.message ||
            "Nu am putut încărca rezervările."
        );

        return;
      }

      setReservations(data || []);
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la încărcarea rezervărilor."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    =========================
    OFFERS
    =========================
  */

  async function loadOffers(
    accessToken,
    supabaseUrl,
    supabaseKey,
    currentRestaurantId = restaurantId,
    currentRestaurantName = restaurantName
  ) {
    if (
      !currentRestaurantId ||
      !currentRestaurantName ||
      currentRestaurantName ===
        "Restaurant"
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_offer_availability`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            p_restaurant_name:
              currentRestaurantName,

            p_from_date:
              getTodayISO(),

            p_to_date:
              "2099-12-31",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Offers error:",
          data
        );

        setOfferMessage(
          data?.message ||
            "Nu am putut încărca ofertele."
        );

        return;
      }

      setOffers(
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
        )
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "Nu am putut încărca ofertele."
      );
    }
  }

  async function createOffer(event) {
    event.preventDefault();

    setOfferMessage("");

    const discount =
      Number(discountPercent);

    const offerCapacity =
      Number(capacity);

    if (!restaurantId) {
      setOfferMessage(
        "Restaurantul nu este identificat."
      );

      return;
    }

    if (!offerDate) {
      setOfferMessage(
        "Alege data ofertei."
      );

      return;
    }

    if (
      !startTime ||
      !endTime ||
      endTime <= startTime
    ) {
      setOfferMessage(
        "Intervalul orar nu este valid."
      );

      return;
    }

    if (
      Number.isNaN(discount) ||
      discount < 1 ||
      discount > 100
    ) {
      setOfferMessage(
        "Reducerea trebuie să fie între 1% și 100%."
      );

      return;
    }

    if (
      Number.isNaN(
        offerCapacity
      ) ||
      offerCapacity < 1
    ) {
      setOfferMessage(
        "Capacitatea trebuie să fie cel puțin 1."
      );

      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setOfferMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );

      return;
    }

    setCreatingOffer(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/offers`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
            Prefer:
              "return=minimal",
          },

          body: JSON.stringify({
            restaurant_id:
              restaurantId,

            offer_date:
              offerDate,

            start_time:
              startTime,

            end_time:
              endTime,

            discount_percent:
              discount,

            capacity:
              offerCapacity,

            active:
              true,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Create offer:",
          errorText
        );

        setOfferMessage(
          `Eroare la crearea ofertei: ${errorText}`
        );

        return;
      }

      setOfferMessage(
        "✓ Oferta a fost creată cu succes!"
      );

      setOfferDate("");
      setStartTime("18:00");
      setEndTime("20:00");
      setDiscountPercent("30");
      setCapacity("10");

      await loadOffers(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId,
        restaurantName
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la crearea ofertei."
      );
    } finally {
      setCreatingOffer(false);
    }
  }

  function startEditingOffer(
    offer
  ) {
    setEditingOfferId(
      offer.id
    );

    setEditOfferDate(
      offer.offer_date || ""
    );

    setEditStartTime(
      formatTime(
        offer.start_time
      )
    );

    setEditEndTime(
      formatTime(
        offer.end_time
      )
    );

    setEditDiscountPercent(
      String(
        offer.discount_percent ??
          ""
      )
    );

    setEditCapacity(
      String(
        offer.capacity ??
          ""
      )
    );

    setOfferMessage("");
  }

  function cancelEditingOffer() {
    setEditingOfferId(null);
    setOfferMessage("");
  }

  async function saveOffer(
    offer
  ) {
    const discount =
      Number(
        editDiscountPercent
      );

    const newCapacity =
      Number(
        editCapacity
      );

    const alreadyReserved =
      Number(
        offer.reserved_places
      ) || 0;

    if (!editOfferDate) {
      setOfferMessage(
        "Alege data ofertei."
      );

      return;
    }

    if (
      !editStartTime ||
      !editEndTime ||
      editEndTime <=
        editStartTime
    ) {
      setOfferMessage(
        "Intervalul orar nu este valid."
      );

      return;
    }

    if (
      Number.isNaN(discount) ||
      discount < 1 ||
      discount > 100
    ) {
      setOfferMessage(
        "Reducerea trebuie să fie între 1% și 100%."
      );

      return;
    }

    if (
      Number.isNaN(
        newCapacity
      ) ||
      newCapacity < 1
    ) {
      setOfferMessage(
        "Capacitatea trebuie să fie cel puțin 1."
      );

      return;
    }

    if (
      newCapacity <
      alreadyReserved
    ) {
      setOfferMessage(
        `Capacitatea nu poate fi mai mică de ${alreadyReserved}, deoarece există deja ${alreadyReserved} locuri rezervate.`
      );

      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setOfferMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );

      return;
    }

    setSavingOfferId(
      offer.id
    );

    setOfferMessage("");

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/offers?id=eq.${offer.id}&restaurant_id=eq.${restaurantId}`,
        {
          method: "PATCH",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
            Prefer:
              "return=minimal",
          },

          body: JSON.stringify({
            offer_date:
              editOfferDate,

            start_time:
              editStartTime,

            end_time:
              editEndTime,

            discount_percent:
              discount,

            capacity:
              newCapacity,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Save offer:",
          errorText
        );

        setOfferMessage(
          `Nu am putut salva oferta: ${errorText}`
        );

        return;
      }

      setOfferMessage(
        "✓ Oferta a fost actualizată."
      );

      setEditingOfferId(null);

      await loadOffers(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId,
        restaurantName
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la actualizarea ofertei."
      );
    } finally {
      setSavingOfferId(null);
    }
  }

  async function deactivateOffer(
    offer
  ) {
    const confirmed =
      window.confirm(
        "Oferta nu va mai putea fi rezervată. Continui?"
      );

    if (!confirmed) {
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      return;
    }

    setDeactivatingOfferId(
      offer.id
    );

    setOfferMessage("");

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/offers?id=eq.${offer.id}&restaurant_id=eq.${restaurantId}`,
        {
          method: "PATCH",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
            Prefer:
              "return=minimal",
          },

          body: JSON.stringify({
            active: false,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Deactivate offer:",
          errorText
        );

        setOfferMessage(
          "Nu am putut dezactiva oferta."
        );

        return;
      }

      setOfferMessage(
        "✓ Oferta a fost dezactivată."
      );

      if (
        String(
          editingOfferId
        ) ===
        String(offer.id)
      ) {
        setEditingOfferId(
          null
        );
      }

      await loadOffers(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId,
        restaurantName
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la dezactivarea ofertei."
      );
    } finally {
      setDeactivatingOfferId(
        null
      );
    }
  }

  /*
    =========================
    EMAIL REZERVARE
    =========================
  */

  async function sendReservationEmail(
    reservationId,
    accessToken,
    supabaseUrl,
    supabaseKey
  ) {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-reservation-email`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            reservation_id:
              reservationId,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Email reservation:",
          errorText
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Email reservation:",
        error
      );

      return false;
    }
  }

  /*
    =========================
    ACCEPT / REJECT
    =========================
  */

  async function updateReservation(
    id,
    newStatus
  ) {
    setUpdatingId(id);
    setMessage("");

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );

      setUpdatingId(null);
      return;
    }

    try {
      if (
        newStatus ===
        "accepted"
      ) {
        const response =
          await fetch(
            `${supabaseUrl}/rest/v1/rpc/accept_reservation_with_capacity`,
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
              },

              body:
                JSON.stringify({
                  p_reservation_id:
                    id,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            "Accept reservation:",
            data
          );

          setMessage(
            data?.message ||
              data?.error ||
              "Nu am putut accepta rezervarea."
          );

          return;
        }

        setReservations(
          (current) =>
            current.map(
              (reservation) =>
                String(
                  reservation.id
                ) ===
                String(id)
                  ? {
                      ...reservation,

                      status:
                        "accepted",
                    }
                  : reservation
            )
        );

        const emailSent =
          await sendReservationEmail(
            id,
            accessToken,
            supabaseUrl,
            supabaseKey
          );

        setMessage(
          data?.offer === true &&
            typeof data?.remaining_places !==
              "undefined"
            ? `✓ Rezervarea a fost acceptată. Au rămas ${data.remaining_places} locuri.${
                emailSent
                  ? " Clientul a fost notificat."
                  : ""
              }`
            : `✓ Rezervarea a fost acceptată.${
                emailSent
                  ? " Clientul a fost notificat."
                  : ""
              }`
        );

        await loadOffers(
          accessToken,
          supabaseUrl,
          supabaseKey,
          restaurantId,
          restaurantName
        );

        return;
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${id}`,
        {
          method: "PATCH",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
            Prefer:
              "return=minimal",
          },

          body: JSON.stringify({
            status:
              newStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Update reservation:",
          errorText
        );

        setMessage(
          "Nu am putut actualiza rezervarea."
        );

        return;
      }

      setReservations(
        (current) =>
          current.map(
            (reservation) =>
              String(
                reservation.id
              ) ===
              String(id)
                ? {
                    ...reservation,

                    status:
                      newStatus,
                  }
                : reservation
          )
      );

      let emailSent = false;

      if (
        newStatus ===
        "rejected"
      ) {
        emailSent =
          await sendReservationEmail(
            id,
            accessToken,
            supabaseUrl,
            supabaseKey
          );
      }

      setMessage(
        newStatus ===
          "rejected"
          ? `Rezervarea a fost respinsă.${
              emailSent
                ? " Clientul a fost notificat."
                : ""
            }`
          : "Rezervarea a fost actualizată."
      );

      await loadOffers(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId,
        restaurantName
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la actualizarea rezervării."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
    =========================
    VALIDARE COD MASAGO
    =========================
  */

  async function validateReservationCode(
    event
  ) {
    event.preventDefault();

    setValidationMessage("");
    setValidatedReservation(null);

    const code =
      validationCode
        .trim()
        .toUpperCase();

    if (!code) {
      setValidationMessage(
        "Introdu codul rezervării."
      );

      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem(
        "masago_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !accessToken
    ) {
      setValidationMessage(
        "Conexiunea cu Supabase nu este disponibilă."
      );

      return;
    }

    setValidatingCode(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/use_reservation_code`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            p_reservation_code:
              code,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Validate code:",
          data
        );

        setValidationMessage(
          data?.message ||
            data?.error ||
            "Codul nu a putut fi validat."
        );

        return;
      }

      setValidatedReservation(
        data
      );

      setValidationMessage(
        "✓ Rezervarea a fost validată cu succes."
      );

      setValidationCode("");

      await Promise.all([
        loadReservations(
          accessToken,
          supabaseUrl,
          supabaseKey
        ),

        loadOffers(
          accessToken,
          supabaseUrl,
          supabaseKey,
          restaurantId,
          restaurantName
        ),
      ]);
    } catch (error) {
      console.error(error);

      setValidationMessage(
        "A apărut o eroare la validarea codului."
      );
    } finally {
      setValidatingCode(false);
    }
  }

  /*
    =========================
    HELPERS
    =========================
  */

  function handleLogout() {
    localStorage.removeItem(
      "masago_access_token"
    );

    localStorage.removeItem(
      "masago_refresh_token"
    );

    localStorage.removeItem(
      "masago_user_email"
    );

    window.location.href =
      "/login";
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const [
      year,
      month,
      day,
    ] = String(date)
      .slice(0, 10)
      .split("-");

    if (
      !year ||
      !month ||
      !day
    ) {
      return date;
    }

    return `${day}/${month}/${year}`;
  }

  function formatTime(time) {
    if (!time) {
      return "-";
    }

    return String(time).slice(
      0,
      5
    );
  }

  function getTodayISO() {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  }

  function getStatusLabel(
    status
  ) {
    if (
      status === "accepted"
    ) {
      return "Confirmată";
    }

    if (
      status === "rejected"
    ) {
      return "Respinsă";
    }

    if (
      status === "cancelled"
    ) {
      return "Anulată";
    }

    if (
      status === "used"
    ) {
      return "Folosită";
    }

    return "În așteptare";
  }

  function getStatusStyle(
    status
  ) {
    if (
      status === "accepted"
    ) {
      return {
        background:
          "#E9F8EF",

        color:
          "#177245",
      };
    }

    if (
      status === "rejected"
    ) {
      return {
        background:
          "#FDECEC",

        color:
          "#B42318",
      };
    }

    if (
      status === "used"
    ) {
      return {
        background:
          "#EEF2FF",

        color:
          "#3448A5",
      };
    }

    if (
      status ===
      "cancelled"
    ) {
      return {
        background:
          "#F2F4F7",

        color:
          "#667085",
      };
    }

    return {
      background:
        "#FFF4DD",

      color:
        "#946200",
    };
  }

  function getOfferForReservation(
    reservation
  ) {
    if (
      !reservation?.offer_id
    ) {
      return null;
    }

    return (
      offers.find(
        (offer) =>
          String(offer.id) ===
          String(
            reservation.offer_id
          )
      ) || null
    );
  }

  /*
    =========================
    REVIEW STATS
    =========================
  */

  const reviewStats =
    useMemo(() => {
      if (!reviews.length) {
        return {
          average: 0,
          total: 0,
        };
      }

      const totalRating =
        reviews.reduce(
          (sum, review) =>
            sum +
            Number(
              review.rating ||
                0
            ),
          0
        );

      return {
        average:
          totalRating /
          reviews.length,

        total:
          reviews.length,
      };
    }, [reviews]);

  /*
    =========================
    RESERVATION STATS
    =========================
  */

  const stats =
    useMemo(() => {
      const today =
        getTodayISO();

      return {
        today:
          reservations.filter(
            (reservation) =>
              String(
                reservation.reservation_date
              ).slice(0, 10) ===
              today
          ).length,

        pending:
          reservations.filter(
            (reservation) =>
              reservation.status ===
              "pending"
          ).length,

        accepted:
          reservations.filter(
            (reservation) =>
              reservation.status ===
              "accepted"
          ).length,

        rejected:
          reservations.filter(
            (reservation) =>
              reservation.status ===
              "rejected"
          ).length,

        used:
          reservations.filter(
            (reservation) =>
              reservation.status ===
              "used"
          ).length,
      };
    }, [reservations]);

  /*
    =========================
    LOADING SCREEN
    =========================
  */

  if (authChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F7F9",
          color: "#172033",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "34px",
              fontWeight: "900",
              marginBottom: "12px",
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
          </div>

          <p
            style={{
              color: "#737C8D",
            }}
          >
            Se verifică autentificarea...
          </p>
        </div>
      </main>
    );
  }

  /*
    =========================
    PAGE
    =========================
  */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F6F7F9",
        fontFamily:
          "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "#172033",
          color: "white",
          padding: "18px 5%",
          boxShadow:
            "0 8px 25px rgba(23,32,51,0.15)",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "0 auto",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
          }}
        >
          <a
            href="/"
            style={{
              color: "white",
              textDecoration:
                "none",
              fontSize: "28px",
              fontWeight: "900",
              letterSpacing:
                "-1px",
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
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            {userEmail && (
              <span
                style={{
                  color: "#BCC5D3",
                  fontSize: "14px",
                }}
              >
                {userEmail}
              </span>
            )}

            <button
              onClick={
                handleLogout
              }
              style={{
                border:
                  "1px solid rgba(255,255,255,0.25)",
                background:
                  "rgba(255,255,255,0.08)",
                color: "white",
                borderRadius:
                  "10px",
                padding:
                  "10px 16px",
                cursor:
                  "pointer",
                fontWeight:
                  "800",
              }}
            >
              Deconectare
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding:
            "42px 5% 70px",
        }}
      >
        <section
          style={{
            marginBottom:
              "30px",
          }}
        >
          <p
            style={{
              color: "#FF5A3C",
              fontWeight: "900",
              margin: 0,
              fontSize: "13px",
              letterSpacing:
                "1.2px",
            }}
          >
            DASHBOARD RESTAURANT
          </p>

          <h1
            style={{
              fontSize:
                "clamp(32px, 5vw, 46px)",
              margin:
                "8px 0 10px",
              letterSpacing:
                "-1.5px",
            }}
          >
            Bun venit,{" "}
            {restaurantName}
          </h1>

          <p
            style={{
              color: "#737C8D",
              margin: 0,
              maxWidth:
                "700px",
              lineHeight: 1.6,
            }}
          >
            Gestionează rezervările,
            ofertele, programul,
            fotografiile și recenziile
            restaurantului tău.
          </p>
        </section>

        {/* STATISTICI */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "16px",
            marginBottom:
              "34px",
          }}
        >
          {[
            [
              "Rezervări azi",
              stats.today,
              "📅",
            ],
            [
              "În așteptare",
              stats.pending,
              "⏳",
            ],
            [
              "Confirmate",
              stats.accepted,
              "✅",
            ],
            [
              "Respinse",
              stats.rejected,
              "❌",
            ],
            [
              "Folosite",
              stats.used,
              "🎟️",
            ],
          ].map(
            ([
              label,
              value,
              icon,
            ]) => (
              <div
                key={label}
                style={{
                  background:
                    "white",
                  borderRadius:
                    "18px",
                  padding:
                    "20px",
                  boxShadow:
                    "0 10px 30px rgba(23,32,51,0.07)",
                  border:
                    "1px solid #ECEEF2",
                }}
              >
                <div
                  style={{
                    color:
                      "#737C8D",
                    fontSize:
                      "14px",
                    fontWeight:
                      "700",
                    marginBottom:
                      "10px",
                  }}
                >
                  {icon}{" "}
                  {label}
                </div>

                <strong
                  style={{
                    fontSize:
                      "34px",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </strong>
              </div>
            )
          )}
        </section>

        {/* PROGRAM RESTAURANT */}

        <section
          style={{
            background: "white",
            borderRadius: "22px",
            padding: "26px",
            boxShadow:
              "0 12px 35px rgba(23,32,51,0.07)",
            border:
              "1px solid #ECEEF2",
            marginBottom:
              "34px",
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
              <p
                style={{
                  color:
                    "#FF5A3C",
                  fontWeight:
                    "900",
                  fontSize:
                    "12px",
                  letterSpacing:
                    "1px",
                  margin:
                    "0 0 7px",
                }}
              >
                DISPONIBILITATE
              </p>

              <h2
                style={{
                  margin:
                    "0 0 7px",
                  fontSize:
                    "25px",
                }}
              >
                🕐 Program restaurant
              </h2>

              <p
                style={{
                  color:
                    "#737C8D",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Setează programul
                Luni–Duminică. Acesta
                va fi folosit ulterior
                pentru a bloca
                rezervările în afara
                orelor de funcționare.
              </p>
            </div>
          </div>

          {hoursLoading ? (
            <p
              style={{
                marginTop:
                  "22px",
                color:
                  "#737C8D",
              }}
            >
              Se încarcă programul...
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "11px",
                marginTop:
                  "24px",
              }}
            >
              {restaurantHours.map(
                (day) => (
                  <div
                    key={
                      day.day_of_week
                    }
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "minmax(105px, 1fr) minmax(105px, 130px) minmax(125px, 160px) minmax(125px, 160px)",

                      alignItems:
                        "center",

                      gap: "12px",

                      border:
                        "1px solid #E7E9ED",

                      borderRadius:
                        "14px",

                      padding:
                        "13px 14px",

                      background:
                        day.is_closed
                          ? "#F8F9FB"
                          : "#FFFFFF",
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          "15px",
                      }}
                    >
                      {day.day_name}
                    </strong>

                    <label
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                        cursor:
                          "pointer",
                        fontSize:
                          "14px",
                        fontWeight:
                          "800",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          !day.is_closed
                        }
                        onChange={(
                          event
                        ) =>
                          updateRestaurantHour(
                            day.day_of_week,
                            "is_closed",
                            !event
                              .target
                              .checked
                          )
                        }
                      />

                      {day.is_closed
                        ? "Închis"
                        : "Deschis"}
                    </label>

                    <input
                      type="time"
                      value={
                        day.opening_time ||
                        ""
                      }
                      disabled={
                        day.is_closed
                      }
                      onChange={(
                        event
                      ) =>
                        updateRestaurantHour(
                          day.day_of_week,
                          "opening_time",
                          event
                            .target
                            .value
                        )
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 12px",
                        border:
                          "1px solid #DDE1E7",
                        borderRadius:
                          "10px",
                        background:
                          day.is_closed
                            ? "#F1F3F5"
                            : "white",
                        color:
                          "#172033",
                        opacity:
                          day.is_closed
                            ? 0.55
                            : 1,
                      }}
                    />

                    <input
                      type="time"
                      value={
                        day.closing_time ||
                        ""
                      }
                      disabled={
                        day.is_closed
                      }
                      onChange={(
                        event
                      ) =>
                        updateRestaurantHour(
                          day.day_of_week,
                          "closing_time",
                          event
                            .target
                            .value
                        )
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 12px",
                        border:
                          "1px solid #DDE1E7",
                        borderRadius:
                          "10px",
                        background:
                          day.is_closed
                            ? "#F1F3F5"
                            : "white",
                        color:
                          "#172033",
                        opacity:
                          day.is_closed
                            ? 0.55
                            : 1,
                      }}
                    />
                  </div>
                )
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "14px",
              flexWrap: "wrap",
              marginTop:
                "20px",
            }}
          >
            <button
              type="button"
              onClick={
                saveRestaurantHours
              }
              disabled={
                savingHours ||
                hoursLoading
              }
              style={{
                border: "none",
                borderRadius:
                  "11px",
                padding:
                  "12px 18px",
                background:
                  savingHours ||
                  hoursLoading
                    ? "#A9B0BA"
                    : "#177245",
                color: "white",
                fontWeight:
                  "900",
                cursor:
                  savingHours ||
                  hoursLoading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {savingHours
                ? "Se salvează..."
                : "✓ Salvează programul"}
            </button>

            {hoursMessage && (
              <span
                style={{
                  color:
                    hoursMessage.startsWith(
                      "✓"
                    )
                      ? "#177245"
                      : "#B42318",

                  fontWeight:
                    "800",
                  fontSize:
                    "14px",
                }}
              >
                {hoursMessage}
              </span>
            )}
          </div>
        </section>

        {/* PARTEA 3 CONTINUĂ DE AICI */}
        {/* FOTOGRAFII */}

        <section
          style={sectionCard}
        >
          <div
            style={sectionHeader}
          >
            <div>
              <p
                style={orangeLabel}
              >
                PROFIL RESTAURANT
              </p>

              <h2>
                📸 Fotografii restaurant
              </h2>

              <p
                style={description}
              >
                Încarcă până la 6 fotografii. Prima fotografie devine automat principală.
              </p>
            </div>

            <strong>
              {restaurantImages.length} / 6
            </strong>
          </div>

          <div
            style={{
              margin:
                "20px 0",
            }}
          >
            <label
              style={{
                ...primaryDarkButton,

                opacity:
                  uploadingImages ||
                  restaurantImages.length >=
                    6
                    ? 0.6
                    : 1,

                cursor:
                  uploadingImages ||
                  restaurantImages.length >=
                    6
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {uploadingImages
                ? "Se încarcă..."
                : "+ Adaugă fotografii"}

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  uploadRestaurantImages
                }
                disabled={
                  uploadingImages ||
                  restaurantImages.length >=
                    6
                }
                style={{
                  display:
                    "none",
                }}
              />
            </label>

            <span
              style={{
                marginLeft: "12px",
                color: "#818997",
                fontSize: "13px",
              }}
            >
              JPG / PNG / WebP • max. 5 MB
            </span>
          </div>

          {imageMessage && (
            <MessageBox
              text={imageMessage}
            />
          )}

          {imagesLoading ? (
            <p>
              Se încarcă fotografiile...
            </p>
          ) : restaurantImages.length ===
            0 ? (
            <div
              style={emptyBox}
            >
              🖼️ Nu ai încă fotografii.
            </div>
          ) : (
            <div
              style={imageGrid}
            >
              {restaurantImages.map(
                (image) => (
                  <div
                    key={image.id}
                    style={{
                      border:
                        image.is_cover
                          ? "2px solid #FF5A3C"
                          : "1px solid #E7E9ED",

                      borderRadius:
                        "15px",

                      overflow:
                        "hidden",

                      background:
                        "white",
                    }}
                  >
                    <div
                      style={{
                        height:
                          "180px",

                        position:
                          "relative",
                      }}
                    >
                      <img
                        src={
                          image.image_url
                        }
                        alt={
                          restaurantName
                        }
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",

                          objectFit:
                            "cover",
                        }}
                      />

                      <span
                        style={imageBadge}
                      >
                        {image.is_cover
                          ? "★ PRINCIPALĂ"
                          : `POZA ${image.position}`}
                      </span>
                    </div>

                    <div
                      style={{
                        padding:
                          "12px",

                        display:
                          "grid",

                        gap:
                          "8px",
                      }}
                    >
                      {!image.is_cover && (
                        <button
                          onClick={() =>
                            setCoverImage(
                              image
                            )
                          }
                          disabled={
                            coverImageId ===
                            image.id
                          }
                          style={
                            whiteButton
                          }
                        >
                          ★ Setează principală
                        </button>
                      )}

                      <button
                        onClick={() =>
                          deleteRestaurantImage(
                            image
                          )
                        }
                        disabled={
                          deletingImageId ===
                          image.id
                        }
                        style={
                          deleteButton
                        }
                      >
                        {deletingImageId ===
                        image.id
                          ? "Se șterge..."
                          : "Șterge fotografia"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* VALIDARE MASAGO */}

        <section
          style={sectionCard}
        >
          <p style={orangeLabel}>
            CHECK-IN CLIENT
          </p>

          <h2>
            Validează cod MASAGO
          </h2>

          <form
            onSubmit={
              validateReservationCode
            }
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              value={
                validationCode
              }
              onChange={(e) =>
                setValidationCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="MASAGO-XXXXXXX"
              style={{
                ...formInput,
                flex: "1 1 260px",
              }}
            />

            <button
              style={
                primaryDarkButton
              }
              disabled={
                validatingCode
              }
            >
              {validatingCode
                ? "Se validează..."
                : "✓ Validează rezervarea"}
            </button>
          </form>

          {validationMessage && (
            <MessageBox
              text={
                validationMessage
              }
            />
          )}

          {validatedReservation && (
            <div
              style={{
                marginTop:
                  "15px",

                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(140px,1fr))",

                gap:
                  "15px",
              }}
            >
              <Info
                label="Client"
                value={
                  validatedReservation.customer_name ||
                  "-"
                }
              />

              <Info
                label="Persoane"
                value={
                  validatedReservation.guests ??
                  "-"
                }
              />

              <Info
                label="Reducere"
                value={
                  validatedReservation.discount_percent !=
                  null
                    ? `-${validatedReservation.discount_percent}%`
                    : "-"
                }
              />
            </div>
          )}
        </section>

        {/* OFERTE */}

        <section
          style={{
            marginBottom:
              "40px",
          }}
        >
          <h2>Oferte</h2>

          <div
            style={sectionCard}
          >
            <form
              onSubmit={
                createOffer
              }
            >
              <div
                style={formGrid}
              >
                <Field
                  label="Data"
                >
                  <input
                    type="date"
                    min={
                      getTodayISO()
                    }
                    value={
                      offerDate
                    }
                    onChange={(e) =>
                      setOfferDate(
                        e.target.value
                      )
                    }
                    style={
                      formInput
                    }
                  />
                </Field>

                <Field
                  label="De la"
                >
                  <input
                    type="time"
                    value={
                      startTime
                    }
                    onChange={(e) =>
                      setStartTime(
                        e.target.value
                      )
                    }
                    style={
                      formInput
                    }
                  />
                </Field>

                <Field
                  label="Până la"
                >
                  <input
                    type="time"
                    value={
                      endTime
                    }
                    onChange={(e) =>
                      setEndTime(
                        e.target.value
                      )
                    }
                    style={
                      formInput
                    }
                  />
                </Field>

                <Field
                  label="Reducere %"
                >
                  <input
                    type="number"
                    value={
                      discountPercent
                    }
                    onChange={(e) =>
                      setDiscountPercent(
                        e.target.value
                      )
                    }
                    style={
                      formInput
                    }
                  />
                </Field>

                <Field
                  label="Capacitate"
                >
                  <input
                    type="number"
                    value={
                      capacity
                    }
                    onChange={(e) =>
                      setCapacity(
                        e.target.value
                      )
                    }
                    style={
                      formInput
                    }
                  />
                </Field>
              </div>

              <button
                style={{
                  ...orangeButton,
                  marginTop:
                    "18px",
                }}
                disabled={
                  creatingOffer
                }
              >
                {creatingOffer
                  ? "Se creează..."
                  : "+ Creează oferta"}
              </button>
            </form>

            {offerMessage && (
              <MessageBox
                text={
                  offerMessage
                }
              />
            )}
          </div>

          <div
            style={{
              display:
                "grid",

              gap:
                "12px",

              marginTop:
                "16px",
            }}
          >
            {offers.map(
              (offer) => {
                const editing =
                  editingOfferId ===
                  offer.id;

                const soldOut =
                  offer.remaining_places <=
                  0;

                return (
                  <div
                    key={
                      offer.id
                    }
                    style={
                      sectionCard
                    }
                  >
                    {!editing ? (
                      <>
                        <div
                          style={
                            sectionHeader
                          }
                        >
                          <div>
                            <strong>
                              {formatDate(
                                offer.offer_date
                              )}
                            </strong>

                            <div>
                              {formatTime(
                                offer.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                offer.end_time
                              )}
                            </div>
                          </div>

                          <div>
                            <strong>
                              -
                              {
                                offer.discount_percent
                              }
                              %
                            </strong>

                            {" • "}

                            {soldOut
                              ? "SOLD OUT"
                              : `${offer.remaining_places}/${offer.capacity} locuri`}
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop:
                              "15px",

                            display:
                              "flex",

                            gap:
                              "10px",
                          }}
                        >
                          <button
                            onClick={() =>
                              startEditingOffer(
                                offer
                              )
                            }
                            style={
                              whiteButton
                            }
                          >
                            ✏️ Editează
                          </button>

                          <button
                            onClick={() =>
                              deactivateOffer(
                                offer
                              )
                            }
                            style={
                              deleteButton
                            }
                            disabled={
                              deactivatingOfferId ===
                              offer.id
                            }
                          >
                            Dezactivează
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={
                            formGrid
                          }
                        >
                          <input
                            type="date"
                            value={
                              editOfferDate
                            }
                            onChange={(e) =>
                              setEditOfferDate(
                                e.target.value
                              )
                            }
                            style={
                              formInput
                            }
                          />

                          <input
                            type="time"
                            value={
                              editStartTime
                            }
                            onChange={(e) =>
                              setEditStartTime(
                                e.target.value
                              )
                            }
                            style={
                              formInput
                            }
                          />

                          <input
                            type="time"
                            value={
                              editEndTime
                            }
                            onChange={(e) =>
                              setEditEndTime(
                                e.target.value
                              )
                            }
                            style={
                              formInput
                            }
                          />

                          <input
                            type="number"
                            value={
                              editDiscountPercent
                            }
                            onChange={(e) =>
                              setEditDiscountPercent(
                                e.target.value
                              )
                            }
                            style={
                              formInput
                            }
                          />

                          <input
                            type="number"
                            value={
                              editCapacity
                            }
                            onChange={(e) =>
                              setEditCapacity(
                                e.target.value
                              )
                            }
                            style={
                              formInput
                            }
                          />
                        </div>

                        <div
                          style={{
                            marginTop:
                              "15px",

                            display:
                              "flex",

                            gap:
                              "10px",
                          }}
                        >
                          <button
                            onClick={() =>
                              saveOffer(
                                offer
                              )
                            }
                            style={
                              greenButton
                            }
                            disabled={
                              savingOfferId ===
                              offer.id
                            }
                          >
                            ✓ Salvează
                          </button>

                          <button
                            onClick={
                              cancelEditingOffer
                            }
                            style={
                              whiteButton
                            }
                          >
                            Anulează
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* RECENZII */}

        <section
          style={{
            ...sectionCard,
            marginBottom: "40px",
          }}
        >
          <div style={sectionHeader}>
            <div>
              <p style={orangeLabel}>FEEDBACK CLIENȚI</p>

              <h2 style={{ marginBottom: "6px" }}>
                ⭐ Recenzii
              </h2>

              <p style={description}>
                Vezi părerile clienților care au folosit o rezervare la restaurant.
              </p>
            </div>

            <div
              style={{
                textAlign: "right",
                minWidth: "130px",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#172033",
                }}
              >
                {reviewStats.total > 0
                  ? reviewStats.average.toFixed(1)
                  : "—"}

                <span
                  style={{
                    fontSize: "17px",
                    color: "#737C8D",
                  }}
                >
                  {" "}/ 5
                </span>
              </div>

              <div
                style={{
                  color: "#FFB020",
                  fontSize: "20px",
                  letterSpacing: "2px",
                  marginTop: "3px",
                }}
              >
                {reviewStats.total > 0
                  ? "★".repeat(
                      Math.round(
                        reviewStats.average
                      )
                    ) +
                    "☆".repeat(
                      5 -
                        Math.round(
                          reviewStats.average
                        )
                    )
                  : "☆☆☆☆☆"}
              </div>

              <div
                style={{
                  color: "#737C8D",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                {reviewStats.total}{" "}
                {reviewStats.total === 1
                  ? "recenzie"
                  : "recenzii"}
              </div>
            </div>
          </div>

          {reviewsMessage && (
            <MessageBox
              text={reviewsMessage}
            />
          )}

          {reviewsLoading ? (
            <p>
              Se încarcă recenziile...
            </p>
          ) : reviews.length === 0 ? (
            <div style={emptyBox}>
              ⭐ Restaurantul nu are încă recenzii.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "14px",
                marginTop: "22px",
              }}
            >
              {reviews.map(
                (review) => (
                  <article
                    key={review.id}
                    style={{
                      background:
                        "#FFFFFF",

                      border:
                        "1px solid #E7E9ED",

                      borderRadius:
                        "16px",

                      padding:
                        "20px",
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

                        gap:
                          "20px",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color:
                              "#FFB020",

                            fontSize:
                              "21px",

                            letterSpacing:
                              "2px",
                          }}
                        >
                          {"★".repeat(
                            Number(
                              review.rating
                            ) || 0
                          )}

                          {"☆".repeat(
                            5 -
                              (Number(
                                review.rating
                              ) || 0)
                          )}
                        </div>

                        <strong
                          style={{
                            display:
                              "block",

                            marginTop:
                              "5px",

                            fontSize:
                              "15px",
                          }}
                        >
                          {review.rating} / 5
                        </strong>
                      </div>

                      <span
                        style={{
                          color:
                            "#818997",

                          fontSize:
                            "13px",
                        }}
                      >
                        {review.created_at
                          ? new Date(
                              review.created_at
                            ).toLocaleDateString(
                              "ro-RO"
                            )
                          : ""}
                      </span>
                    </div>

                    <p
                      style={{
                        margin:
                          "16px 0 0 0",

                        color:
                          "#4B5565",

                        lineHeight:
                          "1.6",

                        fontSize:
                          "15px",
                      }}
                    >
                      {review.comment?.trim()
                        ? review.comment
                        : "Clientul nu a lăsat un comentariu."}
                    </p>

                    <div
                      style={{
                        marginTop:
                          "15px",

                        paddingTop:
                          "12px",

                        borderTop:
                          "1px solid #F0F1F3",

                        color:
                          "#98A0AD",

                        fontSize:
                          "12px",

                        fontWeight:
                          "700",
                      }}
                    >
                      ✓ RECENZIE DE LA O REZERVARE MASAGO
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* REZERVĂRI */}

        <section>
          <h2>
            Rezervări
          </h2>

          {message && (
            <MessageBox
              text={message}
            />
          )}

          {loading ? (
            <p>
              Se încarcă rezervările...
            </p>
          ) : reservations.length ===
            0 ? (
            <div
              style={emptyBox}
            >
              Nu există rezervări momentan.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                                gap:
                  "18px",
              }}
            >
              {reservations.map(
                (
                  reservation
                ) => {
                  const linkedOffer =
                    getOfferForReservation(
                      reservation
                    );

                  const remaining =
                    linkedOffer?.remaining_places;

                  const notEnough =
                    reservation.status ===
                      "pending" &&
                    linkedOffer &&
                    Number(
                      reservation.guests
                    ) >
                      remaining;

                  return (
                    <article
                      key={
                        reservation.id
                      }
                      style={
                        sectionCard
                      }
                    >
                      <div
                        style={
                          sectionHeader
                        }
                      >
                        <div>
                          <small>
                            COD REZERVARE
                          </small>

                          <div
                            style={
                              codeBadge
                            }
                          >
                            {reservation.reservation_code ||
                              "FĂRĂ COD"}
                          </div>
                        </div>

                        <span
                          style={{
                            ...getStatusStyle(
                              reservation.status
                            ),

                            padding:
                              "8px 12px",

                            borderRadius:
                              "999px",

                            fontWeight:
                              "900",
                          }}
                        >
                          {getStatusLabel(
                            reservation.status
                          )}
                        </span>
                      </div>

                      <div
                        style={{
                          ...formGrid,

                          marginTop:
                            "20px",
                        }}
                      >
                        <Info
                          label="Client"
                          value={
                            reservation.customer_name ||
                            "-"
                          }
                        />

                        <Info
                          label="Telefon"
                          value={
                            reservation.customer_phone ||
                            "-"
                          }
                        />

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
                          label="Reducere"
                          value={
                            reservation.discount_percent !=
                            null
                              ? `-${reservation.discount_percent}%`
                              : "-"
                          }
                        />
                      </div>

                      {linkedOffer && (
                        <div
                          style={{
                            marginTop:
                              "18px",

                            padding:
                              "13px",

                            borderRadius:
                              "10px",

                            background:
                              notEnough ||
                              remaining <=
                                0
                                ? "#FFF0EC"
                                : "#E9F8EF",
                          }}
                        >
                          {remaining <=
                          0
                            ? "SOLD OUT"
                            : `${remaining} locuri disponibile`}
                        </div>
                      )}

                      {reservation.status ===
                        "used" && (
                        <div
                          style={{
                            marginTop:
                              "18px",

                            color:
                              "#3448A5",

                            fontWeight:
                              "900",
                          }}
                        >
                          🎟️ Rezervare folosită
                        </div>
                      )}

                      {reservation.status ===
                        "pending" && (
                        <div
                          style={{
                            marginTop:
                              "20px",

                            display:
                              "flex",

                            gap:
                              "10px",

                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            onClick={() =>
                              updateReservation(
                                reservation.id,
                                "accepted"
                              )
                            }
                            disabled={
                              updatingId ===
                                reservation.id ||
                              notEnough ||
                              (linkedOffer &&
                                remaining <=
                                  0)
                            }
                            style={
                              greenButton
                            }
                          >
                            ✓ Acceptă rezervarea
                          </button>

                          <button
                            onClick={() =>
                              updateReservation(
                                reservation.id,
                                "rejected"
                              )
                            }
                            disabled={
                              updatingId ===
                              reservation.id
                            }
                            style={
                              deleteButton
                            }
                          >
                            Respinge
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/*
  =========================
  COMPONENTE
  =========================
*/

function Info({
  label,
  value,
}) {
  return (
    <div>
      <div
        style={{
          color: "#8A92A0",
          fontSize: "11px",
          fontWeight: "800",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "800",
          fontSize: "12px",
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function MessageBox({
  text,
}) {
  const success =
    text?.startsWith("✓");

  return (
    <div
      style={{
        marginTop: "15px",
        padding: "13px",
        borderRadius: "10px",
        background: success
          ? "#E9F8EF"
          : "#FFF0EC",
        color: success
          ? "#177245"
          : "#A33A29",
        fontWeight: "800",
      }}
    >
      {text}
    </div>
  );
}

/*
  =========================
  STILURI
  =========================
*/

const sectionCard = {
  background: "white",
  border: "1px solid #E7E9ED",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "25px",
  boxShadow:
    "0 8px 25px rgba(23,32,51,0.045)",
};

const sectionHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap: "15px",
  flexWrap: "wrap",
};

const statCard = {
  background: "white",
  border: "1px solid #E7E9ED",
  borderRadius: "18px",
  padding: "20px",
  display: "grid",
  gap: "10px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "14px",
};

const formInput = {
  width: "100%",
  boxSizing:
    "border-box",
  padding: "13px",
  borderRadius: "10px",
  border:
    "1px solid #DDE1E6",
  background: "#FAFBFC",
  fontSize: "15px",
  outline: "none",
};

const primaryDarkButton = {
  display:
    "inline-block",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  background: "#172033",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const secondaryDarkButton = {
  border:
    "1px solid #3A465D",
  background: "#202C43",
  color: "white",
  borderRadius: "10px",
  padding: "10px 15px",
  fontWeight: "800",
  cursor: "pointer",
};

const orangeButton = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  background: "#FF5A3C",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const greenButton = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  background: "#16865C",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};

const whiteButton = {
  border:
    "1px solid #DDE1E6",
  borderRadius: "10px",
  padding: "10px 13px",
  background: "white",
  color: "#172033",
  fontWeight: "900",
  cursor: "pointer",
};

const deleteButton = {
  border:
    "1px solid #FFD1CA",
  borderRadius: "10px",
  padding: "10px 13px",
  background: "#FFF5F2",
  color: "#B42318",
  fontWeight: "900",
  cursor: "pointer",
};

const orangeLabel = {
  margin: "0 0 5px",
  color: "#FF5A3C",
  fontWeight: "900",
  fontSize: "12px",
};

const description = {
  color: "#737C8D",
};

const emptyBox = {
  padding: "30px",
  background: "#F8FAFC",
  border:
    "1px dashed #D6DAE1",
  borderRadius: "14px",
  textAlign: "center",
  color: "#667085",
};

const imageGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const imageBadge = {
  position: "absolute",
  top: "10px",
  left: "10px",
  padding: "7px 10px",
  borderRadius: "999px",
  background:
    "rgba(23,32,51,0.85)",
  color: "white",
  fontSize: "11px",
  fontWeight: "900",
};

const codeBadge = {
  marginTop: "5px",
  display:
    "inline-block",
  background: "#172033",
  color: "white",
  borderRadius: "9px",
  padding: "9px 12px",
  fontWeight: "900",
  letterSpacing: "1px",
};
