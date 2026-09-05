"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

export default function RestaurantPage() {
  const params = useParams();

  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : params?.slug;

  /*
    =========================
    RESTAURANT
    =========================
  */

  const [restaurant, setRestaurant] = useState(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState("");

  /*
    =========================
    REZERVARE
    =========================
  */

  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  /*
    =========================
    OFERTE
    =========================
  */

  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  /*
    =========================
    POZE
    =========================
  */

  const [restaurantImages, setRestaurantImages] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [imagesLoading, setImagesLoading] = useState(true);

  /*
    =========================
    RECENZII
    =========================
  */

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  /*
    =========================
    PROGRAM RESTAURANT
    =========================
  */

  const [restaurantHours, setRestaurantHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(true);

  const dayNames = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
  ];

  /*
    =========================
    START
    =========================
  */

  useEffect(() => {
    loadClientProfile();
  }, []);

  useEffect(() => {
    if (!slug) return;

    loadRestaurant();
  }, [slug]);

  useEffect(() => {
    if (!restaurant?.id) return;

    loadRestaurantImages();
    loadOffers();
    loadReviews();
    loadRestaurantHours();
  }, [restaurant?.id]);

  /*
    =========================
    RESTAURANT DIN SLUG
    =========================
  */

  async function loadRestaurant() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setRestaurantError(
        "Conexiunea cu Supabase nu este configurată."
      );
      setRestaurantLoading(false);
      return;
    }

    setRestaurantLoading(true);
    setRestaurantError("");

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(
          slug
        )}&select=id,name,slug&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Restaurant load error:", data);

        setRestaurantError(
          "Restaurantul nu a putut fi încărcat."
        );

        return;
      }

      if (!data?.[0]) {
        setRestaurantError("Restaurantul nu există.");
        return;
      }

      setRestaurant(data[0]);
    } catch (error) {
      console.error("Restaurant error:", error);

      setRestaurantError(
        "A apărut o eroare la încărcarea restaurantului."
      );
    } finally {
      setRestaurantLoading(false);
    }
  }

  /*
    =========================
    POZE RESTAURANT
    =========================
  */

  async function loadRestaurantImages() {
    if (!restaurant?.id) return;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setImagesLoading(false);
      return;
    }

    setImagesLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_images?restaurant_id=eq.${restaurant.id}&select=id,image_url,position,is_cover,created_at&order=position.asc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Restaurant images error:", data);
        setRestaurantImages([]);
        return;
      }

      const sortedImages = [...(data || [])].sort((a, b) => {
        if (a.is_cover && !b.is_cover) return -1;
        if (!a.is_cover && b.is_cover) return 1;

        return Number(a.position || 0) - Number(b.position || 0);
      });

      setRestaurantImages(sortedImages);

      const coverImage =
        sortedImages.find((image) => image.is_cover) ||
        sortedImages[0] ||
        null;

      setSelectedImageUrl(coverImage?.image_url || "");
    } catch (error) {
      console.error("Eroare poze:", error);
      setRestaurantImages([]);
    } finally {
      setImagesLoading(false);
    }
  }

  /*
    =========================
    PROGRAM RESTAURANT
    =========================
  */

  async function loadRestaurantHours() {
    if (!restaurant?.id) return;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setHoursLoading(false);
      return;
    }

    setHoursLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_hours?restaurant_id=eq.${restaurant.id}&select=day_of_week,opening_time,closing_time,is_closed&order=day_of_week.asc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Restaurant hours error:", data);
        setRestaurantHours([]);
        return;
      }

      setRestaurantHours(
        (data || []).map((row) => ({
          ...row,

          day_of_week: Number(row.day_of_week),

          opening_time: row.opening_time
            ? String(row.opening_time).slice(0, 5)
            : null,

          closing_time: row.closing_time
            ? String(row.closing_time).slice(0, 5)
            : null,

          is_closed: Boolean(row.is_closed),
        }))
      );
    } catch (error) {
      console.error("Eroare program restaurant:", error);
      setRestaurantHours([]);
    } finally {
      setHoursLoading(false);
    }
  }

  /*
    =========================
    RECENZII
    =========================
  */

  async function loadReviews() {
    if (!restaurant?.id) return;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setReviewsLoading(false);
      return;
    }

    setReviewsLoading(true);
    setReviewsError("");

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reviews?restaurant_id=eq.${restaurant.id}&select=id,rating,comment,created_at&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Reviews load error:", data);

        setReviews([]);

        setReviewsError(
          "Recenziile nu au putut fi încărcate."
        );

        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error("Reviews error:", error);

      setReviews([]);

      setReviewsError(
        "Recenziile nu au putut fi încărcate."
      );
    } finally {
      setReviewsLoading(false);
    }
  }

  const reviewStats = useMemo(() => {
    if (!reviews.length) {
      return {
        average: 0,
        total: 0,
      };
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return {
      average: totalRating / reviews.length,
      total: reviews.length,
    };
  }, [reviews]);

  function scrollToReviews() {
    document
      .getElementById("recenzii")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  /*
    =========================
    PROFIL CLIENT
    =========================
  */

  async function loadClientProfile() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const clientAccessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !clientAccessToken
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/client_profiles?select=full_name,phone&limit=1`,
        {
          headers: {
            apikey: supabaseKey,

            Authorization:
              `Bearer ${clientAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Profile load error:",
          await response.text()
        );

        return;
      }

      const data = await response.json();

      const profile = data?.[0];

      if (!profile) return;

      if (profile.full_name) {
        setName(profile.full_name);
      }

      if (profile.phone) {
        setPhone(profile.phone);
      }
    } catch (error) {
      console.error("Eroare profil:", error);
    }
  }

  /*
    =========================
    DATE
    =========================
  */

  function getLocalDate(offset = 0) {
    const currentDate = new Date();

    currentDate.setDate(
      currentDate.getDate() + offset
    );

    const year =
      currentDate.getFullYear();

    const month =
      String(
        currentDate.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        currentDate.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today = getLocalDate(0);

  const maxReservationDate =
    getLocalDate(3);

  /*
    =========================
    OFERTE
    =========================
  */

  async function loadOffers(
    preferredOfferId = null
  ) {
    if (!restaurant?.name) return;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setOffersLoading(false);
      return;
    }

    setOffersLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_offer_availability`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            p_restaurant_name:
              restaurant.name,

            p_from_date:
              today,

            p_to_date:
              maxReservationDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Offers error:", data);
        setOffers([]);
        return;
      }

      const normalizedOffers =
        (data || []).map((offer) => ({
          ...offer,

          capacity:
            Number(offer.capacity) || 0,

          reserved_places:
            Number(offer.reserved_places) || 0,

          remaining_places:
            Number(offer.remaining_places) || 0,
        }));

      setOffers(normalizedOffers);

      const currentDate =
        date || today;

      if (!date) {
        setDate(today);
      }

      const offersForDay =
        normalizedOffers
          .filter(
            (offer) =>
              offer.offer_date === currentDate
          )
          .sort((a, b) =>
            String(a.start_time).localeCompare(
              String(b.start_time)
            )
          );

      let offerToSelect = null;

      if (preferredOfferId) {
        offerToSelect =
          offersForDay.find(
            (offer) =>
              String(offer.id) ===
                String(preferredOfferId) &&
              offer.remaining_places > 0
          );
      }

      if (!offerToSelect) {
        offerToSelect =
          offersForDay.find(
            (offer) =>
              offer.remaining_places > 0
          );
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
        setTime("19:00");
      }
    } catch (error) {
      console.error("Eroare oferte:", error);
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
            offer.offer_date === date
        )
        .sort((a, b) =>
          String(a.start_time).localeCompare(
            String(b.start_time)
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
            String(offer.id) ===
            String(selectedOfferId)
        ) || null
      );
    }, [offers, selectedOfferId]);

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
                offer.remaining_places > 0
            );

          return {
            date: currentDate,
            offers: dayOffers,
            availableOffers,
          };
        }
      );
    }, [offers]);

  function handleDateChange(newDate) {
    setDate(newDate);
    setMessage("");

    const offersForDay =
      offers
        .filter(
          (offer) =>
            offer.offer_date === newDate
        )
        .sort((a, b) =>
          String(a.start_time).localeCompare(
            String(b.start_time)
          )
        );

    const firstAvailable =
      offersForDay.find(
        (offer) =>
          offer.remaining_places > 0
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

      const selectedHours =
        getHoursForDate(newDate);

      if (
        selectedHours &&
        !selectedHours.is_closed &&
        selectedHours.opening_time
      ) {
        setTime(
          formatTime(
            selectedHours.opening_time
          )
        );
      } else {
        setTime("19:00");
      }
    }
  }

  function selectOffer(offer) {
    if (
      offer.remaining_places <= 0
    ) {
      setMessage(
        "Această ofertă este SOLD OUT."
      );
      return;
    }

    setSelectedOfferId(offer.id);

    setTime(
      String(
        offer.start_time
      ).slice(0, 5)
    );

    setMessage("");
  }

  /*
    =========================
    HELPERS
    =========================
  */

  function generateReservationCode() {
    const randomPart =
      crypto
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

  function getDayLabel(value, index) {
    if (index === 0) return "Azi";
    if (index === 1) return "Mâine";

    return formatShortDate(value);
  }

  /*
    JS:
    0 = Duminică
    1 = Luni
    ...
    6 = Sâmbătă

    Masago:
    0 = Luni
    ...
    6 = Duminică
  */

  function getRestaurantDayIndexFromDate(
    value
  ) {
    if (!value) return null;

    const selectedDate =
      new Date(`${value}T12:00:00`);

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return null;
    }

    return (
      selectedDate.getDay() + 6
    ) % 7;
  }

  function getHoursForDate(value) {
    const dayIndex =
      getRestaurantDayIndexFromDate(
        value
      );

    if (dayIndex === null) {
      return null;
    }

    return (
      restaurantHours.find(
        (row) =>
          Number(row.day_of_week) ===
          dayIndex
      ) || null
    );
  }

  function reservationTimeIsInsideHours() {
    const selectedHours =
      getHoursForDate(date);

    /*
      Dacă restaurantul nu și-a setat
      încă programul, nu blocăm
      rezervările vechi.
    */

    if (!selectedHours) {
      return true;
    }

    if (selectedHours.is_closed) {
      return false;
    }

    const selectedTime =
      String(time || "").slice(0, 5);

    const openingTime =
      formatTime(
        selectedHours.opening_time
      );

    const closingTime =
      formatTime(
        selectedHours.closing_time
      );

    if (
      !selectedTime ||
      !openingTime ||
      !closingTime
    ) {
      return true;
    }

    return (
      selectedTime >= openingTime &&
      selectedTime <= closingTime
    );
  }

  function getOpenStatus() {
    if (hoursLoading) {
      return {
        isOpen: false,
        label:
          "Se verifică programul...",
        detail: "",
        neutral: true,
      };
    }

    if (!restaurantHours.length) {
      return {
        isOpen: false,
        label:
          "Program indisponibil",
        detail: "",
        neutral: true,
      };
    }

    /*
      Folosim ora României,
      nu timezone-ul dispozitivului.
    */

    const now = new Date();

    const romaniaParts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone:
            "Europe/Bucharest",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      ).formatToParts(now);

    const weekday =
      romaniaParts.find(
        (part) =>
          part.type === "weekday"
      )?.value;

    const hour =
      romaniaParts.find(
        (part) =>
          part.type === "hour"
      )?.value;

    const minute =
      romaniaParts.find(
        (part) =>
          part.type === "minute"
      )?.value;

    const weekdayMap = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };

    const todayIndex =
      weekdayMap[weekday];

    const romaniaTime =
      `${hour}:${minute}`;

    const todayHours =
      restaurantHours.find(
        (row) =>
          Number(row.day_of_week) ===
          todayIndex
      );

    if (
      todayHours &&
      !todayHours.is_closed &&
      todayHours.opening_time &&
      todayHours.closing_time
    ) {
      const opening =
        formatTime(
          todayHours.opening_time
        );

      const closing =
        formatTime(
          todayHours.closing_time
        );

      if (
        romaniaTime >= opening &&
        romaniaTime <= closing
      ) {
        return {
          isOpen: true,
          label: "Deschis acum",
          detail:
            `până la ${closing}`,
          neutral: false,
        };
      }

      if (romaniaTime < opening) {
        return {
          isOpen: false,
          label: "Închis acum",
          detail:
            `deschide azi la ${opening}`,
          neutral: false,
        };
      }
    }

    /*
      Căutăm următoarea zi deschisă.
    */

    for (
      let offset = 1;
      offset <= 7;
      offset += 1
    ) {
      const nextIndex =
        (todayIndex + offset) % 7;

      const nextHours =
        restaurantHours.find(
          (row) =>
            Number(
              row.day_of_week
            ) === nextIndex
        );

      if (
        nextHours &&
        !nextHours.is_closed &&
        nextHours.opening_time
      ) {
        const opening =
          formatTime(
            nextHours.opening_time
          );

        return {
          isOpen: false,
          label: "Închis acum",

          detail:
            offset === 1
              ? `deschide mâine la ${opening}`
              : `deschide ${dayNames[
                  nextIndex
                ].toLowerCase()} la ${opening}`,

          neutral: false,
        };
      }
    }

    return {
      isOpen: false,
      label: "Închis",
      detail: "",
      neutral: false,
    };
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

  /*
    =========================
    REZERVARE
    =========================
  */

  async function handleReservation() {
    setMessage("");

    if (!restaurant?.name) {
      setMessage(
        "Restaurantul nu este încărcat."
      );
      return;
    }

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

    const guestNumber =
      Number(guests);

    const selectedHours =
      getHoursForDate(date);

    if (
      selectedHours?.is_closed
    ) {
      setMessage(
        "Restaurantul este închis în ziua selectată."
      );
      return;
    }

    if (
      !reservationTimeIsInsideHours()
    ) {
      const opening =
        formatTime(
          selectedHours?.opening_time
        );

      const closing =
        formatTime(
          selectedHours?.closing_time
        );

      setMessage(
        `Restaurantul acceptă rezervări în această zi între ${opening} și ${closing}.`
      );

      return;
    }

    if (
      selectedOffer &&
      selectedOffer.remaining_places <= 0
    ) {
      setMessage(
        "Oferta este SOLD OUT."
      );
      return;
    }

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

    if (!supabaseUrl || !supabaseKey) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );
      return;
    }

    const reservationCode =
      generateReservationCode();

    const clientAccessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    const authHeaders =
      clientAccessToken
        ? {
            Authorization:
              `Bearer ${clientAccessToken}`,
          }
        : {};

    setLoading(true);

    try {
      if (selectedOffer) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/create_offer_reservation`,
          {
            method: "POST",

            headers: {
              apikey: supabaseKey,
              "Content-Type":
                "application/json",
              ...authHeaders,
            },

            body: JSON.stringify({
              p_offer_id:
                selectedOffer.id,

              p_restaurant_name:
                restaurant.name,

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

          setMessage(
            result?.message ||
              result?.error ||
              "Rezervarea nu a putut fi creată."
          );

          await loadOffers(
            selectedOffer.id
          );

          return;
        }
      } else {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/reservations`,
          {
            method: "POST",

            headers: {
              apikey: supabaseKey,
              "Content-Type":
                "application/json",
              Prefer:
                "return=minimal",
              ...authHeaders,
            },

            body: JSON.stringify({
              restaurant_name:
                restaurant.name,

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

              status: "pending",

              reservation_code:
                reservationCode,

              offer_id: null,

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

      const reservationSummary = {
        code: reservationCode,

        date:
          formatDateRomanian(date),

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

      const savedReservations =
        JSON.parse(
          localStorage.getItem(
            "masago_reservation_codes"
          ) || "[]"
        );

      const updatedReservations = [
        reservationCode,

        ...savedReservations.filter(
          (savedCode) =>
            savedCode !==
            reservationCode
        ),
      ];

      localStorage.setItem(
        "masago_reservation_codes",
        JSON.stringify(
          updatedReservations
        )
      );

      setConfirmation(
        reservationSummary
      );

      await loadOffers(
        selectedOffer?.id || null
      );

      setGuests("2");
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

  /*
    =========================
    STATUS PROGRAM
    =========================
  */

  const openStatus =
    getOpenStatus();

  const selectedDateHours =
    getHoursForDate(date);

  /*
    =========================
    STILURI
    =========================
  */

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
    border: "1px solid #dfe3e8",
    borderRadius: "12px",
    fontSize: "16px",
    background: "white",
    color: "#172033",
    outline: "none",
  };

  /*
    =========================
    LOADING / 404
    =========================
  */

  if (restaurantLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#FAFAF8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
          color: "#172033",
        }}
      >
        <strong>
          Se încarcă restaurantul...
        </strong>
      </main>
    );
  }

  if (
    restaurantError ||
    !restaurant
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#FAFAF8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
          padding: "30px",
        }}
      >
        <div
          style={{
            background: "white",
            border:
              "1px solid #E7E9ED",
            borderRadius: "20px",
            padding: "35px",
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          <div
            style={{
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            🍽️
          </div>

          <h1>
            Restaurant indisponibil
          </h1>

          <p
            style={{
              color: "#667085",
            }}
          >
            {restaurantError ||
              "Restaurantul nu există."}
          </p>

          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "15px",
              background: "#172033",
              color: "white",
              textDecoration: "none",
              padding: "13px 18px",
              borderRadius: "10px",
              fontWeight: "900",
            }}
          >
            ← Înapoi la restaurante
          </a>
        </div>
      </main>
    );
  }

  /*
    =========================
    PAGINA
    =========================
  */

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
          {/* INFO */}

          <div>
            <div
              style={{
                display: "inline-block",

                background:
                  "rgba(255,90,60,0.16)",

                color: "#FF8A73",

                border:
                  "1px solid rgba(255,90,60,0.35)",

                borderRadius: "999px",

                padding: "8px 12px",

                fontSize: "14px",
                fontWeight: "800",

                marginBottom: "18px",
              }}
            >
              Restaurant • Timișoara
            </div>

            <h1
              style={{
                fontSize:
                  "clamp(44px, 6vw, 66px)",

                margin: 0,
                letterSpacing: "-2px",
              }}
            >
              {restaurant.name}
            </h1>

            {/* STATUS DESCHIS / INCHIS */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              <div
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap: "7px",

                  padding:
                    "8px 12px",

                  borderRadius:
                    "999px",

                  background:
                    openStatus.neutral
                      ? "rgba(255,255,255,0.10)"
                      : openStatus.isOpen
                      ? "rgba(22,134,92,0.20)"
                      : "rgba(220,53,69,0.18)",

                  border:
                    openStatus.neutral
                      ? "1px solid rgba(255,255,255,0.18)"
                      : openStatus.isOpen
                      ? "1px solid rgba(61,214,157,0.35)"
                      : "1px solid rgba(255,107,120,0.35)",

                  fontWeight:
                    "900",

                  fontSize:
                    "14px",

                  color:
                    openStatus.neutral
                      ? "#D5DBE5"
                      : openStatus.isOpen
                      ? "#5BE0AE"
                      : "#FF7C88",
                }}
              >
                {!openStatus.neutral && (
                  <span
                    style={{
                      width: "9px",
                      height: "9px",

                      borderRadius:
                        "50%",

                      background:
                        openStatus.isOpen
                          ? "#3DD69D"
                          : "#FF5A67",

                      display:
                        "inline-block",
                    }}
                  />
                )}

                {openStatus.label}
              </div>

              {openStatus.detail && (
                <span
                  style={{
                    color: "#AEB7C6",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  {openStatus.detail}
                </span>
              )}
            </div>

            {/* RATING */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "13px",
              }}
            >
              {reviewsLoading ? (
                <span
                  style={{
                    color: "#cbd2dd",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  Se încarcă recenziile...
                </span>
              ) : reviewStats.total >
                0 ? (
                <>
                  <span
                    style={{
                      color: "#FFD166",
                      fontSize: "19px",
                      letterSpacing: "1px",
                    }}
                  >
                    ★★★★★
                  </span>

                  <strong
                    style={{
                      fontSize: "16px",
                    }}
                  >
                    {reviewStats.average.toFixed(
                      1
                    )}
                  </strong>

                  <span
                    style={{
                      color: "#AEB7C6",
                      fontSize: "14px",
                    }}
                  >
                    (
                    {reviewStats.total}{" "}
                    {reviewStats.total ===
                    1
                      ? "recenzie"
                      : "recenzii"}
                    )
                  </span>

                  <button
                    type="button"
                    onClick={
                      scrollToReviews
                    }
                    style={{
                      border:
                        "1px solid rgba(255,255,255,0.22)",

                      background:
                        "rgba(255,255,255,0.08)",

                      color: "white",

                      borderRadius:
                        "999px",

                      padding:
                        "7px 11px",

                      cursor: "pointer",

                      fontWeight:
                        "800",

                      fontSize:
                        "12px",
                    }}
                  >
                    Vezi recenziile ↓
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      color: "#AEB7C6",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  >
                    Fără recenzii încă
                  </span>

                  <button
                    type="button"
                    onClick={
                      scrollToReviews
                    }
                    style={{
                      border:
                        "1px solid rgba(255,255,255,0.22)",

                      background:
                        "rgba(255,255,255,0.08)",

                      color: "white",

                      borderRadius:
                        "999px",

                      padding:
                        "7px 11px",

                      cursor: "pointer",

                      fontWeight:
                        "800",

                      fontSize:
                        "12px",
                    }}
                  >
                    Vezi recenziile ↓
                  </button>
                </>
              )}
            </div>

            <p
              style={{
                fontSize: "18px",
                color: "#cbd2dd",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Descoperă ofertele disponibile și rezervă o masă
              direct prin Masago.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  display:
                    "inline-block",

                  background:
                    "white",

                  color:
                    "#172033",

                  borderRadius:
                    "10px",

                  padding:
                    "10px 14px",

                  fontWeight:
                    "800",
                }}
              >
                📍 Timișoara
              </div>

              <a
                href="#program"
                style={{
                  display:
                    "inline-block",

                  background:
                    "rgba(255,255,255,0.08)",

                  color:
                    "white",

                  border:
                    "1px solid rgba(255,255,255,0.18)",

                  borderRadius:
                    "10px",

                  padding:
                    "10px 14px",

                  fontWeight:
                    "800",

                  textDecoration:
                    "none",
                }}
              >
                🕐 Vezi programul
              </a>
            </div>
          </div>

          {/* GALERIE */}

          <div>
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

                border:
                  "1px solid #334057",

                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.25)",

                overflow: "hidden",
              }}
            >
              {imagesLoading ? (
                <span
                  style={{
                    color: "#cbd2dd",
                    fontWeight: "800",
                  }}
                >
                  Se încarcă fotografiile...
                </span>
              ) : selectedImageUrl ? (
                <img
                  src={selectedImageUrl}
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
                    fontSize: "100px",
                  }}
                >
                  🍽️
                </div>
              )}
            </div>

            {restaurantImages.length >
              1 && (
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "repeat(6, minmax(0, 1fr))",

                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                {restaurantImages.map(
                  (image) => {
                    const active =
                      selectedImageUrl ===
                      image.image_url;

                    return (
                      <button
                        key={image.id}
                        type="button"

                        onClick={() =>
                          setSelectedImageUrl(
                            image.image_url
                          )
                        }

                        style={{
                          height: "64px",
                          padding: 0,

                          border:
                            active
                              ? "3px solid #FF5A3C"
                              : "2px solid rgba(255,255,255,0.25)",

                          borderRadius:
                            "10px",

                          overflow:
                            "hidden",

                          background:
                            "#202C43",

                          cursor:
                            "pointer",

                          position:
                            "relative",
                        }}
                      >
                        <img
                          src={
                            image.image_url
                          }

                          alt={
                            restaurant.name
                          }

                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit:
                              "cover",
                          }}
                        />

                        {image.is_cover && (
                          <span
                            style={{
                              position:
                                "absolute",

                              top: "4px",
                              left: "4px",

                              background:
                                "rgba(23,32,51,0.9)",

                              color:
                                "white",

                              borderRadius:
                                "999px",

                              padding:
                                "3px 6px",

                              fontSize:
                                "9px",

                              fontWeight:
                                "900",
                            }}
                          >
                            ★
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {restaurantImages.length >
              0 && (
              <div
                style={{
                  marginTop: "9px",
                  color: "#AEB7C6",
                  fontSize: "12px",
                  fontWeight: "700",
                  textAlign: "right",
                }}
              >
                {restaurantImages.length}{" "}
                {restaurantImages.length ===
                1
                  ? "fotografie"
                  : "fotografii"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",

          padding:
            "55px 6% 30px",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",

          gap: "30px",

          alignItems:
            "start",
        }}
      >
        {/* STÂNGA */}

        <div>
          {/* ZILE */}

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
              Vezi ofertele restaurantului{" "}
              <strong>
                {restaurant.name}
              </strong>{" "}
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

                  marginTop:
                    "20px",
                }}
              >
                {upcomingDays.map(
                  (day, index) => {
                    const active =
                      date === day.date;

                    const dayHours =
                      getHoursForDate(
                        day.date
                      );

                    const dayClosed =
                      dayHours?.is_closed ===
                      true;

                    return (
                      <button
                        key={day.date}
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
                            dayClosed
                              ? "#F7F7F8"
                              : active
                              ? "#FFF5F2"
                              : "white",

                          borderRadius:
                            "14px",

                          padding: "15px",

                          textAlign:
                            "left",

                          cursor:
                            "pointer",

                          opacity:
                            dayClosed
                              ? 0.7
                              : 1,
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
                              "7px",

                            fontSize:
                              "12px",

                            fontWeight:
                              "800",

                            color:
                              dayClosed
                                ? "#B42318"
                                : "#667085",
                          }}
                        >
                          {hoursLoading
                            ? "Program..."
                            : dayClosed
                            ? "🔴 Închis"
                            : dayHours
                            ? `🕐 ${formatTime(
                                dayHours.opening_time
                              )}–${formatTime(
                                dayHours.closing_time
                              )}`
                            : "Program nesetat"}
                        </div>

                        <div
                          style={{
                            marginTop:
                              "8px",

                            color:
                              day
                                .availableOffers
                                .length > 0
                                ? "#FF5A3C"
                                : "#98A2B3",

                            fontWeight:
                              "900",

                            fontSize:
                              "13px",
                          }}
                        >
                          {day.offers.length ===
                          0
                            ? "Fără ofertă"
                            : day
                                .availableOffers
                                .length ===
                              0
                            ? "SOLD OUT"
                            : `${day.availableOffers.length} ${
                                day
                                  .availableOffers
                                  .length ===
                                1
                                  ? "ofertă disponibilă"
                                  : "oferte disponibile"
                              }`}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* PROGRAM RESTAURANT */}

          <div
            id="program"
            style={{
              background: "white",

              border:
                "1px solid #E7E9ED",

              borderRadius:
                "20px",

              padding: "25px",

              marginBottom:
                "22px",

              scrollMarginTop:
                "100px",
            }}
          >
            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap: "12px",

                flexWrap:
                  "wrap",

                marginBottom:
                  "20px",
              }}
            >
              <div>
                <div
                  style={{
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
                  Program
                </div>

                <h2
                  style={{
                    margin:
                      "5px 0 0",

                    fontSize:
                      "24px",
                  }}
                >
                  Program restaurant
                </h2>
              </div>

              <div
                style={{
                  borderRadius:
                    "999px",

                  padding:
                    "8px 12px",

                  fontSize:
                    "13px",

                  fontWeight:
                    "900",

                  background:
                    openStatus.neutral
                      ? "#F2F4F7"
                      : openStatus.isOpen
                      ? "#E9F8EF"
                      : "#FFF0F1",

                  color:
                    openStatus.neutral
                      ? "#667085"
                      : openStatus.isOpen
                      ? "#16865C"
                      : "#B42318",
                }}
              >
                {openStatus.label}
              </div>
            </div>

            {hoursLoading ? (
              <div
                style={{
                  color:
                    "#667085",

                  fontWeight:
                    "700",
                }}
              >
                Se încarcă programul...
              </div>
            ) : restaurantHours.length >
              0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                }}
              >
                {dayNames.map(
                  (
                    dayName,
                    dayIndex
                  ) => {
                    const hours =
                      restaurantHours.find(
                        (item) =>
                          Number(
                            item.day_of_week
                          ) ===
                          dayIndex
                      );

                    /*
                      Tot pentru România:
                      convertim ziua JS
                      în indexul Masago.
                    */

                    const jsToday =
                      new Date().getDay();

                    const masagoToday =
                      (jsToday + 6) % 7;

                    const isToday =
                      masagoToday ===
                      dayIndex;

                    return (
                      <div
                        key={dayIndex}

                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          gap: "15px",

                          padding:
                            "12px 14px",

                          borderRadius:
                            "12px",

                          background:
                            isToday
                              ? "#FFF5F2"
                              : "#FAFAFB",

                          border:
                            isToday
                              ? "1px solid #FFD5CC"
                              : "1px solid #F0F1F3",
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              isToday
                                ? "900"
                                : "700",
                          }}
                        >
                          {dayName}

                          {isToday && (
                            <span
                              style={{
                                marginLeft:
                                  "7px",

                                color:
                                  "#FF5A3C",

                                fontSize:
                                  "11px",

                                fontWeight:
                                  "900",
                              }}
                            >
                              AZI
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontWeight:
                              "900",

                            color:
                              !hours
                                ? "#98A2B3"
                                : hours.is_closed
                                ? "#B42318"
                                : "#172033",
                          }}
                        >
                          {!hours
                            ? "Nesetat"
                            : hours.is_closed
                            ? "Închis"
                            : `${formatTime(
                                hours.opening_time
                              )} – ${formatTime(
                                hours.closing_time
                              )}`}
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

                  borderRadius:
                    "12px",

                  padding: "16px",

                  color:
                    "#667085",

                  lineHeight:
                    1.5,
                }}
              >
                Restaurantul nu și-a setat încă programul.
              </div>
            )}
          </div>
          {/* OFERTE */}

          <div
            style={{
              background: "white",
              border: "1px solid #E7E9ED",
              borderRadius: "20px",
              padding: "25px",
            }}
          >
            <h2
              style={{
                margin: "0 0 5px",
                fontSize: "24px",
              }}
            >
              Oferte pentru {formatDateRomanian(date)}
            </h2>

            <p
              style={{
                margin: "0 0 20px",
                color: "#667085",
                lineHeight: 1.5,
              }}
            >
              Alege intervalul care ți se potrivește.
            </p>

            {selectedDayOffers.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {selectedDayOffers.map((offer) => {
                  const active =
                    String(selectedOfferId) === String(offer.id);

                  const soldOut =
                    offer.remaining_places <= 0;

                  return (
                    <div
                      key={offer.id}
                      style={{
                        border: active
                          ? "2px solid #FF5A3C"
                          : "1px solid #E4E7EC",

                        background: soldOut
                          ? "#F4F4F5"
                          : active
                          ? "#FFF5F2"
                          : "white",

                        borderRadius: "16px",
                        padding: "18px",
                        opacity: soldOut ? 0.75 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: soldOut
                                ? "#667085"
                                : "#FF5A3C",

                              fontSize: "28px",
                              fontWeight: "900",
                            }}
                          >
                            -{offer.discount_percent}%
                          </div>

                          <div
                            style={{
                              marginTop: "5px",
                              fontWeight: "900",
                            }}
                          >
                            {formatTime(offer.start_time)} -{" "}
                            {formatTime(offer.end_time)}
                          </div>

                          <div
                            style={{
                              marginTop: "8px",
                              fontSize: "14px",
                              fontWeight: "900",

                              color: soldOut
                                ? "#B42318"
                                : "#16865C",
                            }}
                          >
                            {soldOut
                              ? "🔴 SOLD OUT"
                              : `🪑 ${offer.remaining_places} ${
                                  offer.remaining_places === 1
                                    ? "loc disponibil"
                                    : "locuri disponibile"
                                }`}
                          </div>

                          <div
                            style={{
                              color: "#98A2B3",
                              marginTop: "4px",
                              fontSize: "12px",
                            }}
                          >
                            Capacitate ofertă: {offer.capacity} locuri
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={soldOut}
                          onClick={() => selectOffer(offer)}
                          style={{
                            border: "none",

                            background: soldOut
                              ? "#AEB4BF"
                              : active
                              ? "#16865C"
                              : "#172033",

                            color: "white",
                            borderRadius: "10px",
                            padding: "11px 14px",
                            fontWeight: "900",

                            cursor: soldOut
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          {soldOut
                            ? "SOLD OUT"
                            : active
                            ? "✓ Selectată"
                            : "Alege oferta"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  background: "#F2F4F7",
                  border: "1px solid #E4E7EC",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "7px",
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
                  {restaurant.name} nu a setat încă o ofertă
                  pentru această zi.
                </div>

                <div
                  style={{
                    color: "#667085",
                    lineHeight: 1.6,
                    marginTop: "6px",
                  }}
                >
                  {selectedDateHours?.is_closed
                    ? "Restaurantul este închis în această zi."
                    : "Poți face în continuare o rezervare normală, fără reducere."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DREAPTA / REZERVARE */}

        <div
          style={{
            background: "white",
            border: "1px solid #ebedf0",
            borderRadius: "22px",
            padding: "30px",
            boxShadow: "0 18px 45px rgba(23,32,51,0.08)",
          }}
        >
          {confirmation ? (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 20px",
                  borderRadius: "50%",
                  background: "#E9F8EF",
                  color: "#16865C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontSize: "13px",
                  }}
                >
                  Rezervare trimisă
                </p>

                <h2>Mulțumim, {confirmation.name}!</h2>

                <p
                  style={{
                    color: "#737C8D",
                    lineHeight: 1.6,
                  }}
                >
                  Solicitarea a fost trimisă către{" "}
                  <strong>{restaurant.name}</strong> și așteaptă
                  confirmarea restaurantului.
                </p>

                {confirmation.discount ? (
                  <div
                    style={{
                      marginTop: "15px",
                      background: "#FFF0EC",
                      padding: "14px",
                      borderRadius: "12px",
                      color: "#FF5A3C",
                      fontWeight: "900",
                    }}
                  >
                    Oferta rezervată: -{confirmation.discount}%
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "15px",
                      background: "#F2F4F7",
                      padding: "14px",
                      borderRadius: "12px",
                      color: "#667085",
                      fontWeight: "800",
                    }}
                  >
                    Rezervare fără ofertă Masago.
                  </div>
                )}
              </div>

              <div
                style={{
                  margin: "25px 0",
                  padding: "22px",
                  background: "#172033",
                  color: "white",
                  borderRadius: "16px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#AEB7C6",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: "800",
                  }}
                >
                  Cod rezervare
                </div>

                <div
                  style={{
                    fontSize: "27px",
                    fontWeight: "900",
                    letterSpacing: "2px",
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
                  boxSizing: "border-box",
                  textDecoration: "none",
                  textAlign: "center",
                  background: "#FF5A3C",
                  color: "white",
                  borderRadius: "12px",
                  padding: "15px",
                  fontWeight: "900",
                  marginBottom: "12px",
                }}
              >
                Vezi statusul rezervării
              </a>

              <button
                type="button"
                onClick={makeAnotherReservation}
                style={{
                  width: "100%",
                  border: "1px solid #DDE1E6",
                  borderRadius: "12px",
                  padding: "14px",
                  background: "white",
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
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Rezervare
              </p>

              <h2
                style={{
                  fontSize: "30px",
                  margin: "7px 0 8px",
                }}
              >
                Rezervă o masă
              </h2>

              <p
                style={{
                  color: "#737C8D",
                  marginTop: 0,
                  marginBottom: "18px",
                  lineHeight: 1.5,
                }}
              >
                Selectează ziua, oferta și ora rezervării.
              </p>

              {/* PROGRAM ZI SELECTATĂ */}

              {!hoursLoading && selectedDateHours && (
                <div
                  style={{
                    marginBottom: "18px",
                    padding: "13px 15px",
                    borderRadius: "12px",

                    background: selectedDateHours.is_closed
                      ? "#FFF0F1"
                      : "#EAF8F1",

                    border: selectedDateHours.is_closed
                      ? "1px solid #FFD1D5"
                      : "1px solid #C7EEDD",

                    color: selectedDateHours.is_closed
                      ? "#B42318"
                      : "#16865C",

                    fontWeight: "900",
                    fontSize: "14px",
                  }}
                >
                  {selectedDateHours.is_closed
                    ? "🔴 Restaurantul este închis în ziua selectată"
                    : `🟢 Program în această zi: ${formatTime(
                        selectedDateHours.opening_time
                      )} – ${formatTime(
                        selectedDateHours.closing_time
                      )}`}
                </div>
              )}

              {/* OFERTA SELECTATĂ */}

              {selectedOffer ? (
                <div
                  style={{
                    background: "#FFF0EC",
                    border: "1px solid #FFD8CF",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "22px",
                    color: "#A33A29",
                    fontWeight: "800",
                  }}
                >
                  <div
                    style={{
                      color: "#FF5A3C",
                      fontSize: "21px",
                      fontWeight: "900",
                      marginBottom: "5px",
                    }}
                  >
                    -{selectedOffer.discount_percent}%
                  </div>

                  📅 {formatDateRomanian(selectedOffer.offer_date)}
                  <br />

                  🕐 {formatTime(selectedOffer.start_time)} -{" "}
                  {formatTime(selectedOffer.end_time)}
                  <br />

                  <span
                    style={{
                      color: "#16865C",
                      fontWeight: "900",
                    }}
                  >
                    🪑 {selectedOffer.remaining_places}{" "}
                    {selectedOffer.remaining_places === 1
                      ? "loc disponibil"
                      : "locuri disponibile"}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: "#F2F4F7",
                    border: "1px solid #E4E7EC",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "22px",
                    color: "#667085",
                    fontWeight: "800",
                  }}
                >
                  ℹ️ Restaurantul nu a setat încă o ofertă
                  disponibilă pentru ziua selectată.
                </div>
              )}

              {/* DATA */}

              <div style={fieldStyle}>
                <label style={labelStyle}>Data rezervării</label>

                <input
                  type="date"
                  value={date}
                  min={today}
                  max={maxReservationDate}
                  onChange={(event) =>
                    handleDateChange(event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              {/* ORA */}

              <div style={fieldStyle}>
                <label style={labelStyle}>Ora rezervării</label>

                <input
                  type="time"
                  value={time}
                  min={
                    selectedOffer
                      ? formatTime(selectedOffer.start_time)
                      : selectedDateHours &&
                        !selectedDateHours.is_closed
                      ? formatTime(selectedDateHours.opening_time)
                      : undefined
                  }
                  max={
                    selectedOffer
                      ? formatTime(selectedOffer.end_time)
                      : selectedDateHours &&
                        !selectedDateHours.is_closed
                      ? formatTime(selectedDateHours.closing_time)
                      : undefined
                  }
                  disabled={
                    selectedDateHours?.is_closed === true
                  }
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  style={{
                    ...inputStyle,

                    background: selectedDateHours?.is_closed
                      ? "#F2F4F7"
                      : "white",

                    cursor: selectedDateHours?.is_closed
                      ? "not-allowed"
                      : "auto",
                  }}
                />

                {selectedOffer && (
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#667085",
                      fontSize: "13px",
                    }}
                  >
                    Pentru reducerea de{" "}
                    <strong>
                      -{selectedOffer.discount_percent}%
                    </strong>
                    , rezervarea trebuie făcută între{" "}
                    <strong>
                      {formatTime(selectedOffer.start_time)} și{" "}
                      {formatTime(selectedOffer.end_time)}
                    </strong>
                    .
                  </div>
                )}

                {!selectedOffer &&
                  selectedDateHours &&
                  !selectedDateHours.is_closed && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#667085",
                        fontSize: "13px",
                      }}
                    >
                      Restaurantul este deschis între{" "}
                      <strong>
                        {formatTime(
                          selectedDateHours.opening_time
                        )}{" "}
                        și{" "}
                        {formatTime(
                          selectedDateHours.closing_time
                        )}
                      </strong>
                      .
                    </div>
                  )}
              </div>

              {/* PERSOANE */}

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Număr de persoane
                </label>

                <select
                  value={guests}
                  onChange={(event) =>
                    setGuests(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="1">1 persoană</option>
                  <option value="2">2 persoane</option>
                  <option value="3">3 persoane</option>
                  <option value="4">4 persoane</option>
                  <option value="5">5 persoane</option>
                  <option value="6">6 persoane</option>
                  <option value="7">7 persoane</option>
                  <option value="8">8 persoane</option>
                </select>

                {selectedOffer &&
                  Number(guests) >
                    selectedOffer.remaining_places && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#B42318",
                        fontWeight: "800",
                        fontSize: "13px",
                      }}
                    >
                      Nu mai sunt suficiente locuri pentru acest
                      număr de persoane.
                    </div>
                  )}
              </div>

              {/* NUME */}

              <div style={fieldStyle}>
                <label style={labelStyle}>Nume</label>

                <input
                  type="text"
                  placeholder="Numele tău"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              {/* TELEFON */}

              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Număr de telefon
                </label>

                <input
                  type="tel"
                  placeholder="07xxxxxxxx"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              {/* BUTON REZERVARE */}

              <button
                type="button"
                onClick={handleReservation}
                disabled={
                  loading ||
                  selectedDateHours?.is_closed === true ||
                  !reservationTimeIsInsideHours() ||
                  (selectedOffer &&
                    (selectedOffer.remaining_places <= 0 ||
                      Number(guests) >
                        selectedOffer.remaining_places))
                }
                style={{
                  width: "100%",
                  marginTop: "5px",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px",

                  background:
                    loading ||
                    selectedDateHours?.is_closed === true ||
                    !reservationTimeIsInsideHours() ||
                    (selectedOffer &&
                      (selectedOffer.remaining_places <= 0 ||
                        Number(guests) >
                          selectedOffer.remaining_places))
                      ? "#aeb4bf"
                      : "#FF5A3C",

                  color: "white",
                  fontSize: "17px",
                  fontWeight: "900",

                  cursor:
                    loading ||
                    selectedDateHours?.is_closed === true ||
                    !reservationTimeIsInsideHours() ||
                    (selectedOffer &&
                      (selectedOffer.remaining_places <= 0 ||
                        Number(guests) >
                          selectedOffer.remaining_places))
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading
                  ? "Se trimite..."
                  : selectedDateHours?.is_closed
                  ? "Restaurant închis"
                  : !reservationTimeIsInsideHours()
                  ? "Ora este în afara programului"
                  : selectedOffer
                  ? `Rezervă cu -${selectedOffer.discount_percent}%`
                  : "Rezervă fără reducere"}
              </button>

              {message && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px",
                    borderRadius: "11px",
                    background: "#FFF0EC",
                    color: "#A33A29",
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* =========================
          RECENZII
          ========================= */}

      <section
        id="recenzii"
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "25px 6% 80px",
          scrollMarginTop: "100px",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #E7E9ED",
            borderRadius: "22px",
            padding: "30px",
            boxShadow: "0 12px 35px rgba(23,32,51,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#FF5A3C",
                  fontWeight: "900",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Experiențele clienților
              </p>

              <h2
                style={{
                  margin: "7px 0 5px",
                  fontSize: "30px",
                }}
              >
                Recenzii
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                }}
              >
                Vezi ce spun clienții despre{" "}
                <strong>{restaurant.name}</strong>.
              </p>
            </div>

            {reviewStats.total > 0 && (
              <div
                style={{
                  minWidth: "145px",
                  background: "#FFF8E8",
                  border: "1px solid #FDE6A8",
                  borderRadius: "16px",
                  padding: "15px 18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    color: "#172033",
                  }}
                >
                  {reviewStats.average.toFixed(1)}
                </div>

                <div
                  style={{
                    color: "#F5A623",
                    fontSize: "18px",
                    margin: "2px 0",
                  }}
                >
                  ★★★★★
                </div>

                <div
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {reviewStats.total}{" "}
                  {reviewStats.total === 1
                    ? "recenzie"
                    : "recenzii"}
                </div>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div
              style={{
                padding: "25px",
                background: "#F8F9FA",
                borderRadius: "14px",
                color: "#667085",
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              Se încarcă recenziile...
            </div>
          ) : reviewsError ? (
            <div
              style={{
                padding: "20px",
                background: "#FFF0EC",
                borderRadius: "14px",
                color: "#A33A29",
                fontWeight: "800",
              }}
            >
              {reviewsError}
            </div>
          ) : reviews.length === 0 ? (
            <div
              style={{
                padding: "30px",
                background: "#F8F9FA",
                border: "1px solid #EAECF0",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "35px",
                  marginBottom: "10px",
                }}
              >
                ⭐
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "18px",
                  marginBottom: "6px",
                }}
              >
                Încă nu există recenzii
              </strong>

              <span
                style={{
                  color: "#667085",
                }}
              >
                Primele recenzii vor apărea aici.
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    border: "1px solid #EAECF0",
                    borderRadius: "16px",
                    padding: "20px",
                    background: "#FFFFFF",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "15px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        color: "#F5A623",
                        fontSize: "18px",
                        letterSpacing: "2px",
                      }}
                    >
                      {"★".repeat(
                        Math.max(
                          0,
                          Math.min(
                            5,
                            Number(review.rating || 0)
                          )
                        )
                      )}

                      <span
                        style={{
                          color: "#D0D5DD",
                        }}
                      >
                        {"★".repeat(
                          Math.max(
                            0,
                            5 -
                              Math.min(
                                5,
                                Number(review.rating || 0)
                              )
                          )
                        )}
                      </span>
                    </div>

                    {review.created_at && (
                      <span
                        style={{
                          color: "#98A2B3",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        {new Date(
                          review.created_at
                        ).toLocaleDateString("ro-RO")}
                      </span>
                    )}
                  </div>

                  {review.comment ? (
                    <p
                      style={{
                        margin: "14px 0 0",
                        color: "#475467",
                        lineHeight: 1.65,
                        fontSize: "15px",
                      }}
                    >
                      {review.comment}
                    </p>
                  ) : (
                    <p
                      style={{
                        margin: "14px 0 0",
                        color: "#98A2B3",
                        fontStyle: "italic",
                        fontSize: "14px",
                      }}
                    >
                      Clientul a acordat doar un rating.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
